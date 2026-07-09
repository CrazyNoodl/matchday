import { type ArchivedRound, type ClosedTournament, type Match, type Player } from '../store/types';

// ---------------------------------------------------------------------------
// All-time stats screen (app/stats.tsx) aggregation
//
// Merges the three store layers — closedTournaments, archivedRounds (past
// rounds of the active tournament), and matches (the current open round) —
// into flat lists the ranking/H2H views can consume.
// ---------------------------------------------------------------------------

export interface H2HPair {
  playerA: Player;
  playerB: Player;
  aWins: number;
  bWins: number;
  draws: number;
  aGoals: number;
  bGoals: number;
  games: number;
}

/** Flattens closed tournaments + archived rounds + the current round into one match list. */
export function collectAllMatches(
  closedTournaments: ClosedTournament[],
  archivedRounds: ArchivedRound[],
  currentMatches: Match[],
): Match[] {
  const fromClosed = closedTournaments.flatMap((t) => t.rounds.flatMap((r) => r.matches));
  const fromArchived = archivedRounds.flatMap((r) => r.matches);
  return [...fromClosed, ...fromArchived, ...currentMatches];
}

/**
 * Union of player IDs across the active tournament roster, every closed
 * tournament's roster, and any aId/bId seen in allMatches — this last part
 * picks up players who appear in historical matches but were pruned from
 * (or never listed in) a roster array.
 */
export function collectPlayerIds(
  tournamentPlayers: string[],
  closedTournaments: ClosedTournament[],
  allMatches: Match[],
): string[] {
  const ids = new Set<string>();
  for (const id of tournamentPlayers) ids.add(id);
  for (const t of closedTournaments) {
    for (const id of t.players) ids.add(id);
  }
  for (const m of allMatches) {
    ids.add(m.aId);
    ids.add(m.bId);
  }
  return Array.from(ids);
}

/** Sum of goals scored across a match list. */
export function sumGoals(matches: Match[]): number {
  return matches.reduce((acc, m) => acc + m.aScore + m.bScore, 0);
}

/** Number of completed rounds (archived + all rounds of closed tournaments) — excludes the in-progress round. */
export function countMatchDaysPlayed(
  archivedRounds: ArchivedRound[],
  closedTournaments: ClosedTournament[],
): number {
  return archivedRounds.length + closedTournaments.reduce((acc, t) => acc + t.rounds.length, 0);
}

/** All-pairs head-to-head aggregation across every player who has faced another at least once. */
export function buildH2HPairs(
  playerIds: string[],
  players: Player[],
  allMatches: Match[],
): H2HPair[] {
  const result: H2HPair[] = [];

  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const idA = playerIds[i];
      const idB = playerIds[j];
      const playerA = players.find((p) => p.id === idA);
      const playerB = players.find((p) => p.id === idB);
      if (!playerA || !playerB) continue;

      let aWins = 0;
      let bWins = 0;
      let draws = 0;
      let aGoals = 0;
      let bGoals = 0;

      for (const m of allMatches) {
        const isAB = m.aId === idA && m.bId === idB;
        const isBA = m.aId === idB && m.bId === idA;
        if (!isAB && !isBA) continue;

        if (isAB) {
          aGoals += m.aScore;
          bGoals += m.bScore;
          if (m.aScore > m.bScore) aWins++;
          else if (m.aScore < m.bScore) bWins++;
          else draws++;
        } else {
          // isBA: flip perspective so A = playerA
          aGoals += m.bScore;
          bGoals += m.aScore;
          if (m.bScore > m.aScore) aWins++;
          else if (m.bScore < m.aScore) bWins++;
          else draws++;
        }
      }

      const games = aWins + bWins + draws;
      if (games === 0) continue;

      result.push({ playerA, playerB, aWins, bWins, draws, aGoals, bGoals, games });
    }
  }

  return result.sort((a, b) => b.games - a.games);
}
