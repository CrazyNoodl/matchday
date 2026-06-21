import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { ensureAnonymousSession } from './auth';
import { pushState, pullState, subscribeToChanges } from './sync';
import { supabaseConfigured } from './client';

const PUSH_DEBOUNCE_MS = 2000;

export function useSyncManager() {
  const setSyncStatus = useStore((s) => s.setSyncStatus);
  const applyCloudState = useStore((s) => s.applyCloudState);

  // Prevents push from firing while we're applying a cloud pull
  const applyingRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let userId: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let subscription: any = null;

    async function pull() {
      const pulled = await pullState();
      if (!pulled) return;
      applyingRef.current = true;
      applyCloudState(pulled);
      // Allow the state change to propagate before re-enabling push
      setTimeout(() => { applyingRef.current = false; }, 100);
    }

    async function init() {
      if (!supabaseConfigured) { setSyncStatus('idle'); return; }
      setSyncStatus('syncing');
      try {
        userId = await ensureAnonymousSession();
        if (!userId) { setSyncStatus('error'); return; }

        await pull();
        setSyncStatus('idle');

        subscription = subscribeToChanges(userId, () => { pull(); });
      } catch {
        setSyncStatus('error');
      }
    }

    init();

    // Debounced push on every store mutation
    const unsubscribe = useStore.subscribe((state) => {
      if (applyingRef.current) return;
      if (state.demoMode) return;
      if (!userId) return;

      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      pushTimerRef.current = setTimeout(() => {
        pushState({
          players: state.players,
          teams: state.teams,
          matches: state.matches,
          archivedRounds: state.archivedRounds,
          closedTournaments: state.closedTournaments,
          tournament: {
            name: state.tournamentName,
            ranked: state.tournamentRanked,
            roundsTarget: state.tournamentRounds,
            playerIds: state.tournamentPlayers,
            round: state.round,
            roundOpen: state.roundOpen,
            roundPlayers: state.roundPlayers,
            hasTournament: state.hasTournament,
          },
        }).catch(() => setSyncStatus('error'));
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
