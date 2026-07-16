import { type ArchivedRound, type Match } from '../store/types';

/**
 * True if the active tournament has at least one recorded match anywhere —
 * the current (possibly still-open) round or a past archived round. Used to
 * gate closeTournament()'s archive path vs deleteTournament()'s discard path
 * (#86): a started-but-empty round (roundOpen with no matches yet) does not
 * count, matching closeTournament()'s own "don't archive an empty round"
 * rule (#88).
 */
export function hasAnyRecordedMatch(matches: Match[], archivedRounds: ArchivedRound[]): boolean {
  return matches.length > 0 || archivedRounds.some((r) => r.matches.length > 0);
}
