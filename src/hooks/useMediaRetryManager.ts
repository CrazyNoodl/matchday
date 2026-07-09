import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { supabaseConfigured } from '@/supabase/client';
import { uploadMediaItems } from '@/supabase/storage';
import { matchMediaFolder } from '@/store/sliceHelpers';
import type { Match } from '@/store/types';

// Media left with pendingUpload:true is scoped per-match on the match-detail
// screen (handleRetryUpload in useMatchDetail.ts) — it only retries whichever
// match happens to be open. This mounts once at the app root and retries
// every pending item across every match (open round + archived rounds) on
// the offline -> online transition, so a failed upload doesn't just sit
// there until the user happens to reopen that exact match.
//
// Takes `isOnline` as a param rather than calling useIsOnline() itself — a
// second independent instance of that hook mounts its own NetInfo listener
// and its own pingSupabase() health-check cycle, racing the app root's
// existing one. Two concurrent health-check fetches to the same
// route-blocked URL made the root's own isOnline reading get stuck
// reporting "unreachable" in e2e, holding the offline banner visible when
// it shouldn't be (see e2e/09.offline.spec.ts). One isOnline value, computed
// once at the root and passed down, avoids the duplicate cycle entirely.
export function useMediaRetryManager(isOnline: boolean) {
  const wasOnlineRef = useRef(isOnline);
  const retryingRef = useRef(false);

  useEffect(() => {
    const wasOnline = wasOnlineRef.current;
    wasOnlineRef.current = isOnline;
    if (!wasOnline && isOnline) retryAllPendingMedia(retryingRef);
  }, [isOnline]);
}

async function retryAllPendingMedia(retryingRef: { current: boolean }) {
  if (retryingRef.current || !supabaseConfigured) return;
  const state = useStore.getState();
  if (state.demoMode) return;

  retryingRef.current = true;
  try {
    await retryPendingMedia(state);
  } finally {
    retryingRef.current = false;
  }
}

async function retryPendingMedia(state: ReturnType<typeof useStore.getState>) {
  const targets: { match: Match; roundFolder: string | undefined }[] = [
    ...state.matches.map((match) => ({ match, roundFolder: state.roundFolder })),
    ...state.archivedRounds.flatMap((round) =>
      round.matches.map((match) => ({ match, roundFolder: round.folder })),
    ),
  ].filter(({ match }) => match.media?.some((item) => item.pendingUpload));

  for (const { match, roundFolder } of targets) {
    const media = match.media!;
    const pendingIndices = media
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.pendingUpload);

    const retried = await uploadMediaItems(
      pendingIndices.map(({ item }) => item),
      { tournamentId: state.tournamentId, mediaFolder: matchMediaFolder(roundFolder, match) },
    );

    const newMedia = [...media];
    pendingIndices.forEach(({ index }, i) => {
      newMedia[index] = retried[i];
    });
    useStore.getState().updateMatchMedia(match.id, newMedia);
  }
}
