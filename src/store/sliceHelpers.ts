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
// tournament id. New-layout matches (created after #67) carry their own
// `mediaFolder` (the match folder name) — prefixed with the round folder when
// one is known, or used bare when it isn't (e.g. a round still open from
// before #67 shipped, so its round has no stored folder yet). Matches from
// before #67 carry no mediaFolder at all and fall back to the old flat
// `{matchId}` layout so their existing media stays deletable.
export function matchMediaFolder(roundFolder: string | undefined, match: Match): string {
  if (!match.mediaFolder) return match.id;
  return roundFolder ? `${roundFolder}/${match.mediaFolder}` : match.mediaFolder;
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
