/**
 * DeepStudy outline-only streaming API (SSE).
 *
 * Input:  { requirement: string }
 * Output: SSE stream of events
 *   { type: 'languageDirective', data: string }
 *   { type: 'courseTitle', data: string }
 *   { type: 'courseDescription', data: string }
 *   { type: 'outline', data: StudyKnowledgePoint, index: number }
 *   { type: 'retry', attempt: number, maxAttempts: number }
 *   { type: 'done', outline: StudyOutline }
 *   { type: 'error', error: string }
 *
 * Reuses OpenS's streamLLM + model resolution. Does NOT touch the
 * full classroom pipeline (no agents, no scenes, no media).
 */

import { nanoid } from 'nanoid';
import { NextRequest } from 'next/server';

import { streamLLM } from '@/lib/ai/llm';
import { createLogger } from '@/lib/logger';
import { apiError } from '@/lib/server/api-response';
import { resolveModelFromHeaders } from '@/lib/server/resolve-model';
import { OUTLINE_SYSTEM_PROMPT, buildOutlineUserPrompt } from '@/lib/study/outline-prompt';
import type { StudyKnowledgePoint, StudyOutline } from '@/lib/types/study';

export const maxDuration = 300;

const log = createLogger('Outline Study Stream');

/** Extract a top-level string field from partial JSON, e.g. "title":"..." */
function extractStringField(buffer: string, key: string): string | null {
  const re = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const match = buffer.match(re);
  if (!match) return null;
  try {
    return JSON.parse(`"${match[1]}"`);
  } catch {
    return match[1];
  }
}

/**
 * Incremental JSON-array parser. Walks the streamed buffer looking for the
 * `outlines` key and yields fully-closed `{...}` objects as they become
 * available. Mirrors the parser in scene-outlines-stream but simplified.
 */
function extractNewOutlines(buffer: string, alreadyParsed: number): StudyKnowledgePoint[] {
  const results: StudyKnowledgePoint[] = [];

  const stripped = buffer.replace(/^[\s\S]*?(?=[\[{])/, '');
  const outlinesKeyIdx = stripped.indexOf('"outlines"');
  const arrayStart = outlinesKeyIdx >= 0 ? stripped.indexOf('[', outlinesKeyIdx) : stripped.indexOf('[');
  if (arrayStart === -1) return results;

  let depth = 0;
  let objectStart = -1;
  let inString = false;
  let escaped = false;
  let objectCount = 0;

  for (let i = arrayStart + 1; i < stripped.length; i++) {
    const char = stripped[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{') {
      if (depth === 0) objectStart = i;
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && objectStart >= 0) {
        objectCount++;
        if (objectCount > alreadyParsed) {
          try {
            const obj = JSON.parse(stripped.substring(objectStart, i + 1));
            results.push(obj);
          } catch {
            // Incomplete or invalid — skip; we'll see it again on the next chunk
          }
        }
        objectStart = -1;
      }
    }
  }

  return results;
}

function normalizeKnowledgePoint(raw: unknown, index: number): StudyKnowledgePoint {
  const o = (raw ?? {}) as Partial<StudyKnowledgePoint> & Record<string, unknown>;
  const keyPoints = Array.isArray(o.keyPoints)
    ? o.keyPoints.filter((s): s is string => typeof s === 'string')
    : [];
  return {
    id: typeof o.id === 'string' && o.id.length > 0 ? o.id : `kp-${index + 1}`,
    order: typeof o.order === 'number' ? o.order : index + 1,
    title: typeof o.title === 'string' ? o.title : '',
    description: typeof o.description === 'string' ? o.description : '',
    keyPoints,
    teachingObjective:
      typeof o.teachingObjective === 'string' ? o.teachingObjective : undefined,
  };
}

export async function POST(req: NextRequest) {
  let requirementSnippet: string | undefined;
  let resolvedModelString: string | undefined;

  try {
    const body = (await req.json()) as { requirement?: string };
    const requirement = body.requirement?.trim();
    if (!requirement) {
      return apiError('MISSING_REQUIRED_FIELD', 400, '`requirement` is required');
    }

    requirementSnippet = requirement.slice(0, 60);

    const { model, modelInfo, modelString } = await resolveModelFromHeaders(req);
    resolvedModelString = modelString;

    log.info(`Generating study outline: "${requirementSnippet}" [model=${modelString}]`);

    const encoder = new TextEncoder();
    const HEARTBEAT_INTERVAL_MS = 15_000;
    const MAX_STREAM_RETRIES = 2;

    const stream = new ReadableStream({
      async start(controller) {
        let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
        const startHeartbeat = () => {
          stopHeartbeat();
          heartbeatTimer = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(`:heartbeat\n\n`));
            } catch {
              stopHeartbeat();
            }
          }, HEARTBEAT_INTERVAL_MS);
        };
        const stopHeartbeat = () => {
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
        };

        const emit = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        try {
          startHeartbeat();

          let finalOutlines: StudyKnowledgePoint[] = [];
          let languageDirective = '';
          let courseTitle = '';
          let courseDescription = '';
          let lastError: string | undefined;

          for (let attempt = 1; attempt <= MAX_STREAM_RETRIES + 1; attempt++) {
            try {
              const result = streamLLM(
                {
                  model,
                  system: OUTLINE_SYSTEM_PROMPT,
                  prompt: buildOutlineUserPrompt(requirement),
                  maxOutputTokens: modelInfo?.outputWindow,
                },
                'outline-study',
              );

              let fullText = '';
              let parsedCount = 0;
              finalOutlines = [];
              let localLanguageDirective = '';
              let localCourseTitle = '';
              let localCourseDescription = '';

              for await (const chunk of result.textStream) {
                fullText += chunk;

                if (!localLanguageDirective) {
                  const ld = extractStringField(fullText, 'languageDirective');
                  if (ld) {
                    localLanguageDirective = ld;
                    emit({ type: 'languageDirective', data: ld });
                  }
                }
                if (!localCourseTitle) {
                  const t = extractStringField(fullText, 'title');
                  if (t) {
                    localCourseTitle = t;
                    emit({ type: 'courseTitle', data: t });
                  }
                }
                if (!localCourseDescription) {
                  const d = extractStringField(fullText, 'description');
                  if (d) {
                    localCourseDescription = d;
                    emit({ type: 'courseDescription', data: d });
                  }
                }

                const newOnes = extractNewOutlines(fullText, parsedCount);
                for (const raw of newOnes) {
                  const kp = normalizeKnowledgePoint(raw, finalOutlines.length);
                  finalOutlines.push(kp);
                  emit({ type: 'outline', data: kp, index: finalOutlines.length - 1 });
                }
                parsedCount += newOnes.length;
              }

              languageDirective = localLanguageDirective;
              courseTitle = localCourseTitle;
              courseDescription = localCourseDescription;

              if (finalOutlines.length >= 1) break;

              lastError = fullText.trim()
                ? 'LLM response could not be parsed into knowledge points'
                : 'LLM returned empty response';

              if (attempt <= MAX_STREAM_RETRIES) {
                log.warn(
                  `Empty outline (attempt ${attempt}/${MAX_STREAM_RETRIES + 1}), retrying...`,
                );
                emit({ type: 'retry', attempt, maxAttempts: MAX_STREAM_RETRIES + 1 });
              }
            } catch (error) {
              lastError = error instanceof Error ? error.message : String(error);
              if (attempt <= MAX_STREAM_RETRIES) {
                log.warn(
                  `Stream error (attempt ${attempt}/${MAX_STREAM_RETRIES + 1}), retrying...`,
                  error,
                );
                emit({ type: 'retry', attempt, maxAttempts: MAX_STREAM_RETRIES + 1 });
                continue;
              }
            }
          }

          if (finalOutlines.length === 0) {
            log.error(
              `Outline generation failed after ${MAX_STREAM_RETRIES + 1} attempts: ${lastError}`,
            );
            emit({ type: 'error', error: lastError || 'Failed to generate outline' });
            return;
          }

          // Renumber / re-id to be safe even if LLM didn't.
          const normalized = finalOutlines.map((kp, i) => ({
            ...kp,
            id: `kp-${i + 1}`,
            order: i + 1,
          }));

          const outline: StudyOutline = {
            id: `ol-${nanoid(10)}`,
            topic: requirement,
            title: courseTitle || requirement.slice(0, 40),
            description: courseDescription,
            languageDirective:
              languageDirective || 'Teach in the language that matches the student requirement.',
            createdAt: Date.now(),
            points: normalized,
          };

          emit({ type: 'done', outline });
        } catch (error) {
          emit({ type: 'error', error: error instanceof Error ? error.message : String(error) });
        } finally {
          stopHeartbeat();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    log.error(
      `Outline-study streaming failed [requirement="${requirementSnippet ?? 'unknown'}...", model=${resolvedModelString ?? 'unknown'}]:`,
      error,
    );
    return apiError('INTERNAL_ERROR', 500, error instanceof Error ? error.message : String(error));
  }
}
