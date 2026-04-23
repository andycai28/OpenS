'use client';

import { useEffect, useState } from 'react';

import { useStudyStore } from '@/lib/store/study';

/**
 * Returns `true` once the Zustand persist middleware for `useStudyStore` has
 * finished reading localStorage. SSR and the initial client render both
 * return `false` so components that depend on persisted state can defer
 * mounting until the store is ready — avoids hydration mismatches and
 * stale-initial-state bugs in `useChat` which snapshots its messages.
 */
export function useStudyStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useStudyStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useStudyStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  return hydrated;
}
