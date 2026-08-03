import React, { createContext, useContext } from 'react';
import { useIsOnline as useIsOnlineDetector } from './useIsOnline';

// Every consumer of `useIsOnline` used to call the detector hook directly,
// each mounting its own NetInfo/window listener and its own pingSupabase()
// health-check cycle. Two or more of those cycles running concurrently (e.g.
// the app root's plus a screen's own) raced fetches to the identical health
// endpoint and could make one instance's reading get stuck reporting
// "unreachable" (see the note in useMediaRetryManager.ts / useSyncManager.ts,
// and e2e/09.offline.spec.ts). This context computes the value exactly once,
// at the root, and every screen reads the same shared value — no duplicate
// subscriptions possible.
const IsOnlineContext = createContext(true);

export function IsOnlineProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useIsOnlineDetector();
  return <IsOnlineContext.Provider value={isOnline}>{children}</IsOnlineContext.Provider>;
}

export function useIsOnline(): boolean {
  return useContext(IsOnlineContext);
}
