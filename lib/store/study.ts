/**
 * Study Outlines Store
 *
 * Caches generated study outlines (topic → knowledge-point list) so the
 * `/chat` page can look up by id without re-fetching. Also caches chat
 * history per outline so the conversation survives page reloads and
 * navigation. Keep it small — drop oldest entry when size exceeds
 * MAX_CACHED; evicted outlines also lose their stored messages.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIMessage } from 'ai';

import type { StudyOutline } from '@/lib/types/study';

const MAX_CACHED = 20;
const MAX_MESSAGES_PER_OUTLINE = 200;

export interface StudyState {
  outlines: Record<string, StudyOutline>;
  order: string[]; // oldest → newest, for LRU eviction
  messagesByOutline: Record<string, UIMessage[]>;

  setOutline: (outline: StudyOutline) => void;
  getOutline: (id: string) => StudyOutline | undefined;
  clearOutline: (id: string) => void;

  getMessages: (outlineId: string) => UIMessage[] | undefined;
  setMessages: (outlineId: string, messages: UIMessage[]) => void;
  clearMessages: (outlineId: string) => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      outlines: {},
      order: [],
      messagesByOutline: {},

      setOutline: (outline) =>
        set((state) => {
          const nextOrder = [...state.order.filter((id) => id !== outline.id), outline.id];
          const nextOutlines = { ...state.outlines, [outline.id]: outline };
          const nextMessages = { ...state.messagesByOutline };

          while (nextOrder.length > MAX_CACHED) {
            const evicted = nextOrder.shift();
            if (evicted) {
              delete nextOutlines[evicted];
              delete nextMessages[evicted];
            }
          }

          return {
            outlines: nextOutlines,
            order: nextOrder,
            messagesByOutline: nextMessages,
          };
        }),

      getOutline: (id) => get().outlines[id],

      clearOutline: (id) =>
        set((state) => {
          const nextOutlines = { ...state.outlines };
          const nextMessages = { ...state.messagesByOutline };
          delete nextOutlines[id];
          delete nextMessages[id];
          return {
            outlines: nextOutlines,
            order: state.order.filter((x) => x !== id),
            messagesByOutline: nextMessages,
          };
        }),

      getMessages: (outlineId) => get().messagesByOutline[outlineId],

      setMessages: (outlineId, messages) =>
        set((state) => {
          const trimmed =
            messages.length > MAX_MESSAGES_PER_OUTLINE
              ? messages.slice(messages.length - MAX_MESSAGES_PER_OUTLINE)
              : messages;
          return {
            messagesByOutline: {
              ...state.messagesByOutline,
              [outlineId]: trimmed,
            },
          };
        }),

      clearMessages: (outlineId) =>
        set((state) => {
          const next = { ...state.messagesByOutline };
          delete next[outlineId];
          return { messagesByOutline: next };
        }),
    }),
    {
      name: 'deepstudy.outlines',
      version: 2,
      partialize: (s) => ({
        outlines: s.outlines,
        order: s.order,
        messagesByOutline: s.messagesByOutline,
      }),
    },
  ),
);
