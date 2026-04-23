'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';

import { ChatView } from '@/components/chat-v2/chat-view';
import { KnowledgeTree } from '@/components/chat-v2/knowledge-tree';
import { mockStudyOutline } from '@/lib/mock/knowledge-tree';
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

  // Start with NO knowledge point selected — the student enters at the
  // course-level overview and can click a KP to focus. System prompt
  // adapts accordingly (no "current focus" section when null).
  const [selectedKpId, setSelectedKpId] = React.useState<string | null>(null);

  // When the outline itself changes (new study session), reset to overview.
  // Switching KPs within the same outline does NOT reset chat — that's
  // handled by the stable `key={outline.id}` on ChatView.
  React.useEffect(() => {
    setSelectedKpId(null);
  }, [outline.id]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <KnowledgeTree
        title={outline.title || '学习大纲'}
        points={outline.points}
        selectedId={selectedKpId}
        onSelect={setSelectedKpId}
      />
      <ChatView key={outline.id} outline={outline} currentKpId={selectedKpId} />
    </div>
  );
}
