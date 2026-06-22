import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { getCurrentUserId } from './auth';
import { pushState, pullState, subscribeToChanges } from './sync';
import { supabaseConfigured } from './client';

const PUSH_DEBOUNCE_MS = 2000;

export function useSyncManager() {
  const setSyncStatus = useStore((s) => s.setSyncStatus);
  const applyCloudState = useStore((s) => s.applyCloudState);

  const applyingRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDemoModeRef = useRef<boolean>(useStore.getState().demoMode);

  useEffect(() => {
    let userId: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let subscription: any = null;

    // Returns true if cloud had data (so applyCloudState was applied)
    async function pull(): Promise<boolean> {
      const pulled = await pullState();
      if (!pulled) return false;
      const hasCloudData =
        pulled.players.length > 0 ||
        pulled.teams.length > 0 ||
        pulled.closedTournaments.length > 0 ||
        pulled.hasTournament;
      applyingRef.current = true;
      applyCloudState(pulled);
      setTimeout(() => { applyingRef.current = false; }, 100);
      return hasCloudData;
    }

    function buildPushPayload() {
      const s = useStore.getState();
      return {
        tournamentId: s.tournamentId,
        players: s.players,
        teams: s.teams,
        matches: s.matches,
        archivedRounds: s.archivedRounds,
        closedTournaments: s.closedTournaments,
        tournament: {
          name: s.tournamentName,
          ranked: s.tournamentRanked,
          roundsTarget: s.tournamentRounds,
          playerIds: s.tournamentPlayers,
          round: s.round,
          roundOpen: s.roundOpen,
          roundPlayers: s.roundPlayers,
          hasTournament: s.hasTournament,
        },
      };
    }

    async function init() {
      if (!supabaseConfigured) { setSyncStatus('idle'); return; }

      // Migration: ensure tournamentId is set for existing active tournaments
      const currentState = useStore.getState();
      if (currentState.hasTournament && !currentState.tournamentId) {
        useStore.setState({ tournamentId: `tour-${Date.now()}` });
      }

      setSyncStatus('syncing');
      try {
        userId = await getCurrentUserId();
        if (!userId) { setSyncStatus('idle'); return; }

        const cloudHadData = await pull();

        // Bootstrap push: if Supabase was empty and there is local data, seed it now.
        // This handles the first sync after install / login, and migration from
        // pre-sync app versions that never pushed to Supabase.
        if (!cloudHadData) {
          const s = useStore.getState();
          const hasLocalData =
            s.players.length > 0 ||
            s.teams.length > 0 ||
            s.hasTournament ||
            s.closedTournaments.length > 0;
          if (!s.demoMode && hasLocalData) {
            await pushState(buildPushPayload()).catch(() => {});
          }
        }

        setSyncStatus('idle');
        subscription = subscribeToChanges(userId, () => {
          // Skip real-time pulls while demo mode is active to avoid wasted
          // network requests (applyCloudState would be a no-op anyway).
          if (!useStore.getState().demoMode) pull();
        });
      } catch {
        setSyncStatus('error');
      }
    }

    init();

    const unsubscribe = useStore.subscribe((state) => {
      if (applyingRef.current) return;

      const wasDemo = prevDemoModeRef.current;
      prevDemoModeRef.current = state.demoMode;

      if (state.demoMode) {
        // Cancel any pending push when entering demo mode so demo data
        // never reaches Supabase via a lingering debounce timer.
        if (pushTimerRef.current) {
          clearTimeout(pushTimerRef.current);
          pushTimerRef.current = null;
        }
        return;
      }

      if (!userId) return;

      if (wasDemo) {
        // Just exited demo mode: pull the latest cloud state first so we
        // don't overwrite changes made on another device while demo was active.
        pull().then(() => {
          if (!useStore.getState().demoMode) {
            pushState(buildPushPayload()).catch(() => setSyncStatus('error'));
          }
        });
        return;
      }

      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      pushTimerRef.current = setTimeout(() => {
        pushState(buildPushPayload()).catch(() => setSyncStatus('error'));
      }, PUSH_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      subscription?.unsubscribe?.();
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
