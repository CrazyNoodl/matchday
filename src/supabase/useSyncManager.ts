import { useEffect, useRef } from 'react';
import { useStore, syncSuppressionRef } from '@/store';
import { getCurrentUserId } from './auth';
import { pushState, pullState, subscribeToChanges, buildSyncPayload, ALL_DIRTY } from './sync';
import type { DirtyTable } from './sync';
import { supabaseConfigured } from './client';
import { useIsOnline } from '@/hooks/useIsOnline';

const PUSH_DEBOUNCE_MS = 300;
const PULL_DEBOUNCE_MS = 400;

export function useSyncManager() {
  const setSyncStatus = useStore((s) => s.setSyncStatus);
  const applyCloudState = useStore((s) => s.applyCloudState);
  const isOnline = useIsOnline();

  const applyingRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushingRef = useRef(false);
  const dirtyRef = useRef<Set<DirtyTable>>(new Set());
  const prevDemoModeRef = useRef<boolean>(useStore.getState().demoMode);
  // Bridges the reconnect effect (below) into the main effect's closure —
  // reassigned once init() has real `pull`/`runPush`/`userId` in scope.
  const reconnectRef = useRef<() => void>(() => {});
  const wasOnlineRef = useRef(isOnline);

  // Debounced pushes fail silently while offline and only retry on the next
  // local store mutation — nothing was queued to retry them once connectivity
  // returns. Explicitly reconcile (pull, then flush any pending dirty tables)
  // on the offline -> online transition so edits made while offline actually
  // upload, matching the offline banner's "will sync once you're back online" promise.
  useEffect(() => {
    const wasOnline = wasOnlineRef.current;
    wasOnlineRef.current = isOnline;
    if (!wasOnline && isOnline) reconnectRef.current();
  }, [isOnline]);

  useEffect(() => {
    let userId: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let subscription: any = null;
    // Guards the store.subscribe listener below against reacting to
    // persistDirty()'s own setState call — without it, persisting the
    // mirror would re-trigger the listener, which would persist again, forever.
    let persistingDirty = false;

    // Mirrors dirtyRef into persisted store state so a still-pending push
    // survives an app crash/force-quit/OS eviction — dirtyRef itself is a
    // plain in-memory ref and is empty again on the next launch. Read back
    // in init() below.
    function persistDirty() {
      persistingDirty = true;
      useStore.setState({ pendingSyncTables: [...dirtyRef.current] });
      persistingDirty = false;
    }

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
      // A local edit landed (or a push is still in flight) while this pull's
      // network request was in the air, so `pulled` is a stale snapshot from
      // before it. applyCloudState() would blind-overwrite the newer local
      // change — and since applyingRef below suppresses dirty-marking during
      // that overwrite, the edit would be lost for good, not just delayed.
      // Skip applying; the edit's own debounced push (or the next pull
      // trigger once it settles) will catch up.
      if (pushingRef.current || dirtyRef.current.size > 0) return 'failed';
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

    async function runPush(forceDirty?: Set<DirtyTable>) {
      const dirty = forceDirty ?? new Set(dirtyRef.current);
      if (!forceDirty) {
        dirtyRef.current = new Set();
        persistDirty();
      }
      pushingRef.current = true;
      try {
        await pushState(buildSyncPayload(useStore.getState()), dirty);
      } catch {
        setSyncStatus('error');
        if (!forceDirty) {
          dirty.forEach((t) => dirtyRef.current.add(t));
          persistDirty();
        }
      } finally {
        pushingRef.current = false;
      }
    }

    async function init() {
      if (!supabaseConfigured) { setSyncStatus('idle'); return; }

      // Migration: ensure tournamentId is set for existing active tournaments
      const currentState = useStore.getState();
      if (currentState.hasTournament && !currentState.tournamentId) {
        useStore.setState({ tournamentId: `tour-${Date.now()}` });
      }

      // Seed in-memory dirty tracking from a previous session that ended
      // (crash, force-quit, OS eviction) before its edits could push —
      // dirtyRef is in-memory only, but pendingSyncTables (persistDirty())
      // survives the restart.
      (currentState.pendingSyncTables as DirtyTable[]).forEach((t) => dirtyRef.current.add(t));

      setSyncStatus('syncing');
      try {
        userId = await getCurrentUserId();
        if (!userId) { setSyncStatus('idle'); return; }

        if (dirtyRef.current.size > 0) {
          // Local edits from a previous session never reached the cloud.
          // This app is local-first, so push them now, before any pull —
          // pull()'s applyCloudState() is a blind overwrite, not a merge,
          // and would wipe these edits out of local state with the stale
          // pre-edit cloud snapshot before they ever synced.
          await runPush();
        }

        if (dirtyRef.current.size > 0) {
          // The leftover push above failed too (still offline, etc.) —
          // don't pull this launch, that would clobber the still-unsynced
          // local edits. The reconnect effect (or the next launch) retries.
          // setSyncStatus('error') was already set inside runPush's catch.
          return;
        }

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
            await runPush(ALL_DIRTY);
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

    reconnectRef.current = () => {
      if (!userId || useStore.getState().demoMode) return;
      // A push is already mid-flight (its dirty tables were claimed
      // synchronously when it started, so dirtyRef may look empty right
      // now even though that push hasn't landed or failed yet). Pulling
      // here would applyCloudState() a stale snapshot over the store while
      // that push is still in the air. Let it finish — its own success/
      // catch path (or the next mutation/reconnect) will settle things.
      if (pushingRef.current) return;
      if (dirtyRef.current.size > 0) {
        // Local edits were made while offline (e.g. matches added) — this
        // app is local-first, so those are the source of truth. Push them
        // before pulling: pulling first would applyCloudState() the stale
        // pre-offline cloud snapshot over the store, wiping the edits out
        // of local state before they ever reached the cloud.
        runPush();
      } else {
        // Nothing local at risk — safe to catch up on any changes made by
        // another device while this one was offline.
        pull();
      }
    };

    const unsubscribe = useStore.subscribe((state, prevState) => {
      // persistDirty()'s own setState call — nothing to detect, would just
      // re-enter this listener forever if not short-circuited here.
      if (persistingDirty) return;

      // resetStore()'s local-only cache wipe (dev "Reset data", sign-out
      // account isolation) — must never be treated as a real edit to sync,
      // or the debounced push would delete the user's actual cloud rows.
      if (syncSuppressionRef.current) return;

      // Detect which table groups changed (reference equality — Zustand+Immer
      // creates new references only for mutated state, unchanged fields keep the same ref)
      if (!applyingRef.current) {
        const sizeBefore = dirtyRef.current.size;
        if (state.players !== prevState.players) dirtyRef.current.add('players');
        if (state.teams !== prevState.teams) dirtyRef.current.add('teams');
        if (state.matches !== prevState.matches) dirtyRef.current.add('openMatches');
        if (
          state.archivedRounds !== prevState.archivedRounds ||
          state.hasTournament !== prevState.hasTournament ||
          state.tournamentId !== prevState.tournamentId ||
          state.tournamentName !== prevState.tournamentName ||
          state.tournamentRanked !== prevState.tournamentRanked ||
          state.tournamentRounds !== prevState.tournamentRounds ||
          state.tournamentPlayers !== prevState.tournamentPlayers ||
          state.round !== prevState.round ||
          state.roundOpen !== prevState.roundOpen ||
          state.roundPlayers !== prevState.roundPlayers
        ) dirtyRef.current.add('activeTournament');
        if (state.closedTournaments !== prevState.closedTournaments) dirtyRef.current.add('closedTournaments');
        if (dirtyRef.current.size !== sizeBefore) persistDirty();
      }

      if (applyingRef.current) return;
      if (dirtyRef.current.size === 0) return;

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
          if (!useStore.getState().demoMode) runPush(ALL_DIRTY);
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
      reconnectRef.current = () => {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
