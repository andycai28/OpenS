'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import type { UIMessage } from 'ai';

import { ChatView, type KnowledgePointContext } from '@/components/chat-v2/chat-view';
import { KnowledgeTree } from '@/components/chat-v2/knowledge-tree';
import { mockConversations } from '@/lib/mock/chat-conversations';
import { mockStudyOutline, defaultMockKnowledgePointId } from '@/lib/mock/knowledge-tree';
import { useStudyStore } from '@/lib/store/study';
import type { StudyOutline } from '@/lib/types/study';

function readOutlineFromSession(id: string): StudyOutline | null {
  try {
    const raw = sessionStorage.getItem(`deepstudy.outline.${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as StudyOutline;
  } catch {
    return null;
  }
}

function buildSeedMessages(kpId: string): UIMessage[] {
  const seed = mockConversations[kpId]?.seed ?? [];
  return seed.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [{ type: 'text', text: m.content }],
  }));
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const outlineId = searchParams.get('outlineId');
  const getOutline = useStudyStore((s) => s.getOutline);

  // Resolve outline: URL → store → sessionStorage → mock fallback.
  const outline = React.useMemo<StudyOutline>(() => {
    if (!outlineId) return mockStudyOutline;
    const fromStore = getOutline(outlineId);
    if (fromStore) return fromStore;
    if (typeof window !== 'undefined') {
      const fromSession = readOutlineFromSession(outlineId);
      if (fromSession) return fromSession;
    }
    return mockStudyOutline;
  }, [outlineId, getOutline]);

  const isMockFallback = outline.id === mockStudyOutline.id;
  const initialSelectedId =
    outline.points[0]?.id ?? (isMockFallback ? defaultMockKnowledgePointId : null);

  const [selectedKpId, setSelectedKpId] = React.useState<string | null>(initialSelectedId);

  // When the outline changes (navigating from one study session to another),
  // reset the selected KP.
  React.useEffect(() => {
    setSelectedKpId(outline.points[0]?.id ?? null);
  }, [outline.id, outline.points]);

  const selectedPoint = React.useMemo(() => {
    if (!selectedKpId) return null;
    return outline.points.find((p) => p.id === selectedKpId) ?? null;
  }, [outline, selectedKpId]);

  const context = React.useMemo<KnowledgePointContext | null>(() => {
    if (!selectedPoint) return null;
    return {
      chapterTitle: outline.title,
      pointTitle: selectedPoint.title,
      requirements: selectedPoint.keyPoints,
    };
  }, [outline.title, selectedPoint]);

  const seedMessages = React.useMemo(() => {
    if (!selectedKpId) return [] as UIMessage[];
    return isMockFallback ? buildSeedMessages(selectedKpId) : [];
  }, [selectedKpId, isMockFallback]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <KnowledgeTree
        title={outline.title || '学习大纲'}
        points={outline.points}
        selectedId={selectedKpId}
        onSelect={setSelectedKpId}
      />
      {selectedPoint && context ? (
        <ChatView
          key={`${outline.id}:${selectedKpId}`}
          title={selectedPoint.title}
          subtitle={selectedPoint.description || outline.title}
          knowledgePoint={context}
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
