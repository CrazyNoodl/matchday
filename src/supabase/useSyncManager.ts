import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { getCurrentUserId } from './auth';
import { pushState, pullState, subscribeToChanges } from './sync';
import { supabaseConfigured } from './client';

const PUSH_DEBOUNCE_MS = 2000;
const PULL_DEBOUNCE_MS = 400;

export function useSyncManager() {
  const setSyncStatus = useStore((s) => s.setSyncStatus);
  const applyCloudState = useStore((s) => s.applyCloudState);

  const applyingRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushingRef = useRef(false);
  const prevDemoModeRef = useRef<boolean>(useStore.getState().demoMode);

  useEffect(() => {
    let userId: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let subscription: any = null;

    // 'failed': the query errored — caller must NOT treat this as an empty
    //   cloud, since that would trigger a bootstrap push that deletes real
    //   cloud rows missing from a local state we never actually compared.
    // 'empty': query succeeded and the cloud genuinely has nothing for this user.
    // 'has-data': query succeeded and applyCloudState() was applied.
    async function pull(): Promise<'failed' | 'empty' | 'has-data'> {
      let pulled: Awaited<ReturnType<typeof pullState>>;
      try {
        pulled = await pullState();
      } catch {
        setSyncStatus('error');
        return 'failed';
      }
      if (!pulled) return 'empty';
      const hasCloudData =
        pulled.players.length > 0 ||
        pulled.teams.length > 0 ||
        pulled.closedTournaments.length > 0 ||
        pulled.hasTournament;
      applyingRef.current = true;
      applyCloudState(pulled);
      setTimeout(() => { applyingRef.current = false; }, 100);
      return hasCloudData ? 'has-data' : 'empty';
    }

    async function runPush() {
      pushingRef.current = true;
      try {
        await pushState(buildPushPayload());
      } catch {
        setSyncStatus('error');
      } finally {
        pushingRef.current = false;
      }
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

        const pullResult = await pull();

        // The initial pull failed (network blip, RLS error, etc.) — we have
        // no reliable read of cloud state, so we must not guess. Bail out
        // without bootstrapping or subscribing; a later mutation's debounced
        // push, or the next app start, will retry the pull from scratch.
        if (pullResult === 'failed') {
          return;
        }

        // Bootstrap push: if Supabase was empty and there is local data, seed it now.
        // This handles the first sync after install / login, and migration from
        // pre-sync app versions that never pushed to Supabase.
        if (pullResult === 'empty') {
          const s = useStore.getState();
          const hasLocalData =
            s.players.length > 0 ||
            s.teams.length > 0 ||
            s.hasTournament ||
            s.closedTournaments.length > 0;
          if (!s.demoMode && hasLocalData) {
            await runPush();
          }
        }

        setSyncStatus('idle');
        subscription = subscribeToChanges(userId, () => {
          // Skip real-time pulls while demo mode is active to avoid wasted
          // network requests (applyCloudState would be a no-op anyway).
          if (useStore.getState().demoMode) return;
          // A push we triggered ourselves is in flight: it writes multiple
          // tables sequentially, each firing its own realtime event. Pulling
          // mid-push would read a partially-written DB state and stomp the
          // local optimistic update (e.g. a just-added match). The push
          // already reflects the latest local state, so skip until it's done.
          if (pushingRef.current) return;
          // Coalesce bursts of realtime events (one push can touch 5+ tables)
          // into a single pull instead of one per table write.
          if (pullTimerRef.current) clearTimeout(pullTimerRef.current);
          pullTimerRef.current = setTimeout(() => { pull(); }, PULL_DEBOUNCE_MS);
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
          if (!useStore.getState().demoMode) runPush();
        });
        return;
      }

      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      pushTimerRef.current = setTimeout(runPush, PUSH_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      subscription?.unsubscribe?.();
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      if (pullTimerRef.current) clearTimeout(pullTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
