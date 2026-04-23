'use client';

import * as React from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Bot, SendHorizonal, Square, User } from 'lucide-react';
import { Streamdown } from 'streamdown';

import { Button } from '@/components/ui/button';
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '@/components/ui/chat/chat-bubble';
import { ChatInput } from '@/components/ui/chat/chat-input';
import { ChatMessageList } from '@/components/ui/chat/chat-message-list';
import { getCurrentModelConfig } from '@/lib/utils/model-config';

import { ChatHeader } from './chat-header';

export interface KnowledgePointContext {
  chapterTitle: string;
  pointTitle: string;
  requirements: string[];
}

interface ChatViewProps {
  title: string;
  subtitle?: string;
  knowledgePoint: KnowledgePointContext;
  seedMessages: UIMessage[];
}

function extractText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

export function ChatView({ title, subtitle, knowledgePoint, seedMessages }: ChatViewProps) {
  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat-v2',
        headers: () => {
          const c = getCurrentModelConfig();
          return {
            'x-model': c.modelString || '',
            'x-api-key': c.apiKey || '',
            'x-base-url': c.baseUrl || '',
            'x-provider-type': c.providerType || '',
          };
        },
        body: { knowledgePoint },
      }),
    [knowledgePoint],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    transport,
    messages: seedMessages,
  });

  const [input, setInput] = React.useState('');
  const isStreaming = status === 'submitted' || status === 'streaming';
  const lastMessage = messages[messages.length - 1];
  const isAssistantStreaming = isStreaming && lastMessage?.role === 'assistant';

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    sendMessage({ text: trimmed });
    setInput('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-background">
      <ChatHeader title={title} subtitle={subtitle} />

      <div className="flex-1 overflow-hidden">
        <ChatMessageList smooth>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const text = extractText(msg);
            const isThisOneStreaming = isAssistantStreaming && msg.id === lastMessage?.id;
            return (
              <ChatBubble key={msg.id} variant={isUser ? 'sent' : 'received'}>
                <ChatBubbleAvatar
                  className="size-8"
                  fallback={isUser ? <User className="size-4" /> : <Bot className="size-4" />}
                />
                <ChatBubbleMessage
                  variant={isUser ? 'sent' : 'received'}
                  isLoading={isThisOneStreaming && text.length === 0}
                >
                  {isUser ? (
                    text
                  ) : (
                    <Streamdown
                      className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_pre]:my-2 [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground"
                    >
                      {text}
                    </Streamdown>
                  )}
                </ChatBubbleMessage>
              </ChatBubble>
            );
          })}

          {status === 'submitted' && lastMessage?.role === 'user' && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar className="size-8" fallback={<Bot className="size-4" />} />
              <ChatBubbleMessage variant="received" isLoading />
            </ChatBubble>
          )}

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              出错了：{error.message}
            </div>
          )}
        </ChatMessageList>
      </div>

      <div className="border-t border-border bg-background p-4">
        <form
          className="relative flex items-end gap-2 rounded-lg border border-border bg-background p-2 focus-within:ring-1 focus-within:ring-ring"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="向 AI 老师提问 — 按 Enter 发送，Shift+Enter 换行"
            rows={1}
            disabled={isStreaming}
            className="min-h-10 border-0 bg-transparent focus-visible:ring-0"
          />
          {isStreaming ? (
            <Button type="button" size="icon-sm" variant="outline" onClick={stop} aria-label="停止">
              <Square className="size-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon-sm" disabled={!input.trim()} aria-label="发送">
              <SendHorizonal className="size-4" />
            </Button>
          )}
        </form>
      </div>
    </section>
  );
}
