'use client';

import * as React from 'react';
import type { UIMessage } from 'ai';

import { ChatView, type KnowledgePointContext } from '@/components/chat-v2/chat-view';
import { KnowledgeTree } from '@/components/chat-v2/knowledge-tree';
import {
  defaultSelectedKnowledgePointId,
  mockConversations,
} from '@/lib/mock/chat-conversations';
import { mockKnowledgeTree } from '@/lib/mock/knowledge-tree';

function buildSeedMessages(kpId: string): UIMessage[] {
  const seed = mockConversations[kpId]?.seed ?? [];
  return seed.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [{ type: 'text', text: m.content }],
  }));
}

export default function ChatPage() {
  const [selectedKpId, setSelectedKpId] = React.useState<string>(defaultSelectedKnowledgePointId);

  const context = React.useMemo(() => {
    for (const chapter of mockKnowledgeTree) {
      const point = chapter.points.find((p) => p.id === selectedKpId);
      if (point) {
        const ctx: KnowledgePointContext = {
          chapterTitle: chapter.title,
          pointTitle: point.title,
          requirements: point.requirements.map((r) => r.title),
        };
        return { chapter, point, ctx };
      }
    }
    return null;
  }, [selectedKpId]);

  const seedMessages = React.useMemo(() => buildSeedMessages(selectedKpId), [selectedKpId]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <KnowledgeTree
        chapters={mockKnowledgeTree}
        selectedId={selectedKpId}
        onSelect={setSelectedKpId}
      />
      {context ? (
        <ChatView
          key={selectedKpId}
          title={context.point.title}
          subtitle={context.chapter.title}
          knowledgePoint={context.ctx}
          seedMessages={seedMessages}
        />
      ) : (
        <div className="flex h-full flex-1 items-center justify-center text-muted-foreground">
          请在左侧选择一个知识点
        </div>
      )}
    </div>
  );
}
