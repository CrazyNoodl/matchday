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
