'use client';

import * as React from 'react';

import { ChatView } from '@/components/chat-v2/chat-view';
import { KnowledgeTree } from '@/components/chat-v2/knowledge-tree';
import {
  type ChatMessage,
  defaultSelectedKnowledgePointId,
  mockConversations,
} from '@/lib/mock/chat-conversations';
import { mockKnowledgeTree } from '@/lib/mock/knowledge-tree';

const ASSISTANT_REPLY_DELAY_MS = 600;

export default function ChatPage() {
  const [selectedKpId, setSelectedKpId] = React.useState<string>(defaultSelectedKnowledgePointId);
  const [messagesByKp, setMessagesByKp] = React.useState<Record<string, ChatMessage[]>>(() => {
    const initial: Record<string, ChatMessage[]> = {};
    for (const [id, convo] of Object.entries(mockConversations)) {
      initial[id] = convo.seed;
    }
    return initial;
  });
  const [isAssistantTyping, setIsAssistantTyping] = React.useState(false);

  const selectedKp = React.useMemo(() => {
    for (const chapter of mockKnowledgeTree) {
      const match = chapter.points.find((p) => p.id === selectedKpId);
      if (match) return { chapter, point: match };
    }
    return null;
  }, [selectedKpId]);

  const messages = messagesByKp[selectedKpId] ?? [];

  const handleSend = (content: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
    };
    setMessagesByKp((prev) => ({
      ...prev,
      [selectedKpId]: [...(prev[selectedKpId] ?? []), userMsg],
    }));
    setIsAssistantTyping(true);

    const reply =
      mockConversations[selectedKpId]?.cannedReply ?? '（Mock 回复）这是一个占位的 AI 回复。';

    window.setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
      };
      setMessagesByKp((prev) => ({
        ...prev,
        [selectedKpId]: [...(prev[selectedKpId] ?? []), assistantMsg],
      }));
      setIsAssistantTyping(false);
    }, ASSISTANT_REPLY_DELAY_MS);
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <KnowledgeTree
        chapters={mockKnowledgeTree}
        selectedId={selectedKpId}
        onSelect={setSelectedKpId}
      />
      <ChatView
        title={selectedKp?.point.title ?? '选择一个知识点开始'}
        subtitle={selectedKp?.chapter.title}
        messages={messages}
        isAssistantTyping={isAssistantTyping}
        onSend={handleSend}
      />
    </div>
  );
}
