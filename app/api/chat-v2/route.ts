import { convertToModelMessages, type UIMessage } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

import { streamLLM } from '@/lib/ai/llm';
import { createLogger } from '@/lib/logger';
import { resolveModelFromHeaders } from '@/lib/server/resolve-model';

export const maxDuration = 120;
export const runtime = 'nodejs';

const log = createLogger('chat-v2');

interface KnowledgePointContext {
  chapterTitle: string;
  pointTitle: string;
  requirements: string[];
}

interface ChatV2Body {
  messages: UIMessage[];
  knowledgePoint?: KnowledgePointContext;
}

function buildSystemPrompt(kp?: KnowledgePointContext): string {
  if (!kp) {
    return '你是一位耐心、启发式的 AI 老师。请用简洁、循序渐进的方式回答学生的问题。';
  }
  const reqList =
    kp.requirements.length > 0
      ? kp.requirements.map((r, i) => `  ${i + 1}. ${r}`).join('\n')
      : '  （暂无）';
  return [
    '你是一位 1 对 1 的 AI 老师，正在为学生讲解下列知识点。',
    '',
    `章节：${kp.chapterTitle}`,
    `知识点：${kp.pointTitle}`,
    '课程要求：',
    reqList,
    '',
    '教学要求：',
    '- 使用中文回答。',
    '- 采用启发式、Socratic 的方法，先引导学生思考再给答案。',
    '- 每轮聚焦一个问题，避免一次信息量过大。',
    '- 需要公式时使用 KaTeX 语法：行内 $...$，块级 $$...$$。',
    '- 可以使用 Markdown 列表、加粗突出重点。',
  ].join('\n');
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
    log.info(`Streaming chat with ${modelString} (kp=${body.knowledgePoint?.pointTitle ?? '-'})`);

    const modelMessages = await convertToModelMessages(body.messages);

    const result = streamLLM(
      {
        model,
        system: buildSystemPrompt(body.knowledgePoint),
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
