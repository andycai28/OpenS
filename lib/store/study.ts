/**
 * Study Outlines Store
 *
 * Caches generated study outlines (topic → knowledge-point list) so the
 * `/chat` page can look up by id without re-fetching. Keep it small —
 * drop oldest entry when size exceeds MAX_CACHED.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudyOutline } from '@/lib/types/study';

const MAX_CACHED = 20;

export interface StudyState {
  outlines: Record<string, StudyOutline>;
  order: string[]; // oldest → newest, for LRU eviction
  setOutline: (outline: StudyOutline) => void;
  getOutline: (id: string) => StudyOutline | undefined;
  clearOutline: (id: string) => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      outlines: {},
      order: [],

      setOutline: (outline) =>
        set((state) => {
          const nextOrder = [...state.order.filter((id) => id !== outline.id), outline.id];
          const nextOutlines = { ...state.outlines, [outline.id]: outline };

          while (nextOrder.length > MAX_CACHED) {
            const evicted = nextOrder.shift();
            if (evicted) delete nextOutlines[evicted];
          }

          return { outlines: nextOutlines, order: nextOrder };
        }),

      getOutline: (id) => get().outlines[id],

      clearOutline: (id) =>
        set((state) => {
          const nextOutlines = { ...state.outlines };
          delete nextOutlines[id];
          return {
            outlines: nextOutlines,
            order: state.order.filter((x) => x !== id),
          };
        }),
    }),
    {
      name: 'deepstudy.outlines',
      partialize: (s) => ({ outlines: s.outlines, order: s.order }),
    },
  ),
);
