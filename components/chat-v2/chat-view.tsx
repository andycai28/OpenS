'use client';

import * as React from 'react';
import { Bot, SendHorizonal, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '@/components/ui/chat/chat-bubble';
import { ChatInput } from '@/components/ui/chat/chat-input';
import { ChatMessageList } from '@/components/ui/chat/chat-message-list';
import type { ChatMessage } from '@/lib/mock/chat-conversations';

import { ChatHeader } from './chat-header';

interface ChatViewProps {
  title: string;
  subtitle?: string;
  messages: ChatMessage[];
  isAssistantTyping?: boolean;
  onSend: (content: string) => void;
}

export function ChatView({
  title,
  subtitle,
  messages,
  isAssistantTyping = false,
  onSend,
}: ChatViewProps) {
  const [input, setInput] = React.useState('');

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
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
            return (
              <ChatBubble key={msg.id} variant={isUser ? 'sent' : 'received'}>
                <ChatBubbleAvatar
                  className="size-8"
                  fallback={isUser ? <User className="size-4" /> : <Bot className="size-4" />}
                />
                <ChatBubbleMessage variant={isUser ? 'sent' : 'received'}>
                  {msg.content}
                </ChatBubbleMessage>
              </ChatBubble>
            );
          })}

          {isAssistantTyping && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar className="size-8" fallback={<Bot className="size-4" />} />
              <ChatBubbleMessage variant="received" isLoading />
            </ChatBubble>
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
            className="min-h-10 border-0 bg-transparent focus-visible:ring-0"
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={!input.trim() || isAssistantTyping}
            aria-label="发送"
          >
            <SendHorizonal className="size-4" />
          </Button>
        </form>
      </div>
    </section>
  );
}
