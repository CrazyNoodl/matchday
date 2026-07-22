import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import { supabase, supabaseConfigured } from '@/supabase/client';
import type { ArchivedRound, Match, Player, Team } from '@/store/types';

export interface SharedRoundData {
  round: Pick<ArchivedRound, 'id' | 'date' | 'winner' | 'name' | 'n' | 'games' | 'ranked'>;
  matches: Match[];
  players: Player[];
  teams: Team[];
}

export type SharedRoundState =
  | { status: 'loading' }
  | { status: 'found'; data: SharedRoundData }
  | { status: 'notFound' };

// `matches.media`/`matches.stats_override` are stored as JSON-encoded strings
// (the app JSON.stringifies before insert — see dbMatchToLocal/tryParseJson
// in src/supabase/sync.ts), not native jsonb arrays/objects — the RPC passes
// the column value through as-is, so it needs the same second parse here.
function parseJsonField<T>(raw: unknown): T | undefined {
  if (raw == null) return undefined;
  if (typeof raw !== 'string') return raw as T;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn('[useSharedRound] malformed JSON field:', raw.slice(0, 80));
    Sentry.captureException(e, { tags: { sharedRoundOp: 'parseJsonField' } });
    return undefined;
  }
}

function normalizeMatch(m: Match): Match {
  return {
    ...m,
    media: parseJsonField(m.media),
    statsOverride: parseJsonField(m.statsOverride),
  };
}

export function useSharedRound(shareId: string): SharedRoundState {
  const [state, setState] = useState<SharedRoundState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabaseConfigured) {
        setState({ status: 'notFound' });
        return;
      }
      const { data, error } = await supabase.rpc('get_shared_round', { p_share_id: shareId });
      if (cancelled) return;
      if (error || !data) {
        setState({ status: 'notFound' });
        return;
      }
      const raw = data as SharedRoundData;
      setState({
        status: 'found',
        data: { ...raw, matches: raw.matches.map(normalizeMatch) },
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  return state;
}
