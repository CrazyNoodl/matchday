import { useMemo } from 'react';
import { computeDayStatRecords, computeDayStatComparisons } from '@/utils/matchdayStatsAggregation';
import { useSharedRound, type SharedRoundData } from './useSharedRound';

export type SharedMatchdayStatsState =
  | { status: 'loading' }
  | { status: 'notFound' }
  | {
      status: 'found';
      data: SharedRoundData;
      records: ReturnType<typeof computeDayStatRecords>;
      comparisons: ReturnType<typeof computeDayStatComparisons>;
    };

export function useSharedMatchdayStats(shareId: string): SharedMatchdayStatsState {
  const state = useSharedRound(shareId);

  const matches = state.status === 'found' ? state.data.matches : [];
  const records = useMemo(() => computeDayStatRecords(matches), [matches]);
  const comparisons = useMemo(() => computeDayStatComparisons(matches), [matches]);

  if (state.status !== 'found') return state;
  return { status: 'found', data: state.data, records, comparisons };
}
