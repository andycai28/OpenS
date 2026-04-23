import { convertToModelMessages, type UIMessage } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

import { streamLLM } from '@/lib/ai/llm';
import { createLogger } from '@/lib/logger';
import { resolveModelFromHeaders } from '@/lib/server/resolve-model';
import {
  SESSION_START_MARKER,
  buildTutorSystemPrompt,
  type TutorPromptMode,
} from '@/lib/study/chat-prompt';
import type { StudyOutline } from '@/lib/types/study';

export const maxDuration = 120;
export const runtime = 'nodejs';

const log = createLogger('chat-v2');

interface ChatV2Body {
  messages: UIMessage[];
  outline?: StudyOutline;
  currentKpId?: string | null;
}

function extractText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

export async function POST(req: NextRequest) {
  let body: ChatV2Body;
  try {
    body = (await req.json()) as ChatV2Body;
  } catch (error) {
    log.warn('Invalid JSON body', error);
    return NextResponse.json(
      { error: 'INVALID_BODY', message: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: 'INVALID_BODY', message: '`messages` must be a non-empty array' },
      { status: 400 },
    );
  }

  try {
    const { model, modelString } = await resolveModelFromHeaders(req);

    // Detect the [session_start] opening trigger and choose prompt mode.
    // The trigger is a user message whose text is exactly the marker; we
    // strip it from the messages sent to the LLM and switch to opening mode.
    const lastUser = [...body.messages].reverse().find((m) => m.role === 'user');
    const isOpening =
      lastUser !== undefined && extractText(lastUser).trim() === SESSION_START_MARKER;

    const mode: TutorPromptMode = isOpening ? 'opening' : 'ongoing';
    const uiMessages = isOpening
      ? body.messages.filter((m) => extractText(m).trim() !== SESSION_START_MARKER)
      : body.messages;

    // In opening mode we need at least one user-turn placeholder for the LLM
    // (some providers reject an assistant-first / empty conversation). If we
    // stripped the only message, synthesize a minimal start signal the model
    // can ignore semantically.
    const effectiveMessages: UIMessage[] = isOpening && uiMessages.length === 0
      ? [
          {
            id: 'session-start-synthetic',
            role: 'user',
            parts: [{ type: 'text', text: '（学生已进入课堂，请按开场指令回应）' }],
          } satisfies UIMessage,
        ]
      : uiMessages;

    const system = body.outline
      ? buildTutorSystemPrompt({
          outline: body.outline,
          currentKpId: body.currentKpId ?? null,
          mode,
        })
      : '你是一位耐心的 AI 老师。用中文回答，使用 Markdown 和 KaTeX 组织内容。';

    log.info(
      `Streaming chat with ${modelString} ` +
        `(outline=${body.outline?.id ?? '-'}, focus=${body.currentKpId ?? '-'}, mode=${mode})`,
    );

    const modelMessages = await convertToModelMessages(effectiveMessages);

    const result = streamLLM(
      {
        model,
        system,
        messages: modelMessages,
      },
      'chat-v2',
    );

    return result.toUIMessageStreamResponse();
  } catch (error) {
    log.error('Chat stream failed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'CHAT_FAILED', message }, { status: 500 });
  }
}
