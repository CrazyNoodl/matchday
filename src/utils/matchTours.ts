import { Match } from '@/store/types';

export interface TourGroup {
  tourNumber: number;
  matches: Match[];
}

export function groupMatchesByTour(matches: Match[], playerCount: number): TourGroup[] {
  const tourSize = playerCount > 1 ? (playerCount * (playerCount - 1)) / 2 : 0;

  if (tourSize === 0 || matches.length === 0) {
    return [{ tourNumber: 1, matches }];
  }

  const groups: TourGroup[] = [];
  for (let i = 0; i < matches.length; i += tourSize) {
    groups.push({
      tourNumber: groups.length + 1,
      matches: matches.slice(i, i + tourSize),
    });
  }
  return groups;
}

// Matches belonging to the tour currently being played, i.e. the tail of `matches`
// past the last complete round-robin block. Empty once that block completes (or is
// yet to start) — a fresh tour has no already-played pairs.
export function getCurrentTourMatches(matches: Match[], playerCount: number): Match[] {
  const tourSize = playerCount > 1 ? (playerCount * (playerCount - 1)) / 2 : 0;
  if (tourSize === 0) return [];
  const remainder = matches.length % tourSize;
  if (remainder === 0) return [];
  return matches.slice(matches.length - remainder);
}

export function getPlayedPartnerIds(currentTourMatches: Match[], playerId: string): Set<string> {
  const partners = new Set<string>();
  for (const m of currentTourMatches) {
    if (m.aId === playerId) partners.add(m.bId);
    if (m.bId === playerId) partners.add(m.aId);
  }
  return partners;
}
