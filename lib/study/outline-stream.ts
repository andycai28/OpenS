/**
 * Client-side consumer for the `/api/generate/outline-study` SSE stream.
 * Exposes an async generator of typed events so the orchestration page
 * can update UI as the outline grows.
 */

import { getCurrentModelConfig } from '@/lib/utils/model-config';
import type { StudyKnowledgePoint, StudyOutline } from '@/lib/types/study';

export type StudyOutlineEvent =
  | { type: 'languageDirective'; data: string }
  | { type: 'courseTitle'; data: string }
  | { type: 'courseDescription'; data: string }
  | { type: 'outline'; data: StudyKnowledgePoint; index: number }
  | { type: 'retry'; attempt: number; maxAttempts: number }
  | { type: 'done'; outline: StudyOutline }
  | { type: 'error'; error: string };

function buildHeaders(): HeadersInit {
  const cfg = getCurrentModelConfig();
  return {
    'Content-Type': 'application/json',
    'x-model': cfg.modelString || '',
    'x-api-key': cfg.apiKey || '',
    'x-base-url': cfg.baseUrl || '',
    'x-provider-type': cfg.providerType || '',
  };
}

export async function* streamStudyOutline(
  requirement: string,
  signal?: AbortSignal,
): AsyncGenerator<StudyOutlineEvent, void, void> {
  const response = await fetch('/api/generate/outline-study', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ requirement }),
    signal,
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by blank lines (\n\n).
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        const dataLines = raw
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim());

        if (dataLines.length === 0) continue;
        const joined = dataLines.join('\n');

        try {
          const event = JSON.parse(joined) as StudyOutlineEvent;
          yield event;
        } catch {
          // Ignore malformed event lines — keeps the stream resilient.
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }
}
