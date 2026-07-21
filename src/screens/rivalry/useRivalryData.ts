import { useMemo } from 'react';
import { useStore } from '@/store';
import {
  collectRivalryMatches,
  computeRivalryRecords,
  computeRivalryTotals,
} from '@/utils/rivalryAggregation';
import { buildH2HPairs, type H2HPair } from '@/utils/statsAggregation';

export function useRivalryData(playerIdA: string, playerIdB: string, tournamentOnly: boolean) {
  const players = useStore((s) => s.players);
  const archivedRounds = useStore((s) => s.archivedRounds);
  const currentMatches = useStore((s) => s.matches);
  const allClosedTournaments = useStore((s) => s.closedTournaments);
  const closedTournaments = useMemo(
    () => (tournamentOnly ? [] : allClosedTournaments),
    [tournamentOnly, allClosedTournaments],
  );

  const playerA = players.find((p) => p.id === playerIdA);
  const playerB = players.find((p) => p.id === playerIdB);

  const entries = useMemo(
    () =>
      collectRivalryMatches(playerIdA, playerIdB, closedTournaments, archivedRounds, currentMatches),
    [playerIdA, playerIdB, closedTournaments, archivedRounds, currentMatches],
  );

  const records = useMemo(() => computeRivalryRecords(entries), [entries]);
  const totals = useMemo(() => computeRivalryTotals(entries), [entries]);

  // Reuses buildH2HPairs for the summary card at the top of the screen — entries'
  // matches are already perspective-normalized to aId === playerIdA, so this just
  // tallies wins/draws/goals for the single requested pair.
  const pair = useMemo<H2HPair | undefined>(
    () => buildH2HPairs([playerIdA, playerIdB], players, entries.map((e) => e.match))[0],
    [playerIdA, playerIdB, players, entries],
  );

  const avgGoalsPerGame = pair && pair.games > 0 ? (pair.aGoals + pair.bGoals) / pair.games : 0;

  return { playerA, playerB, entries, records, totals, pair, avgGoalsPerGame };
}
