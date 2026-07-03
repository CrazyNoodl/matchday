import { Match, ArchivedRound, ClosedTournament } from './types';

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Patch a single match wherever it lives (current matches + archived rounds)
export function patchMatchEverywhere(
  s: { matches: Match[]; archivedRounds: ArchivedRound[] },
  id: string,
  patch: Partial<Match>,
): { matches: Match[]; archivedRounds: ArchivedRound[] } {
  return {
    matches: s.matches.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    archivedRounds: s.archivedRounds.map((r) => ({
      ...r,
      matches: r.matches.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  };
}

// The relative storage path segment holding a match's media, nested under the
// tournament id. New-layout matches (created after #67) get a round/match
// folder pair; matches from before that carry no mediaFolder fall back to the
// old flat `{matchId}` layout so their existing media stays deletable.
export function matchMediaFolder(roundFolder: string | undefined, match: Match): string {
  return roundFolder && match.mediaFolder ? `${roundFolder}/${match.mediaFolder}` : match.id;
}

// Collect every match across current round, archived rounds, and closed tournaments
export function collectAllMatches(
  s: { matches: Match[]; archivedRounds: ArchivedRound[]; closedTournaments: ClosedTournament[] },
): Match[] {
  return [
    ...s.matches,
    ...s.archivedRounds.flatMap((r) => r.matches),
    ...s.closedTournaments.flatMap((t) => t.rounds.flatMap((r) => r.matches)),
  ];
}
