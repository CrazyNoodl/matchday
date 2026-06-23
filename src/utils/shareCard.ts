import { Standing } from '@/utils/standings';

/** Column order/labels shared by the share-round and share-standings card tables. */
export const STANDINGS_NUM_COLS: { key: keyof Standing; label: string }[] = [
  { key: 'played', label: 'P' },
  { key: 'wins', label: 'W' },
  { key: 'draws', label: 'D' },
  { key: 'losses', label: 'L' },
  { key: 'gf', label: 'GF' },
  { key: 'ga', label: 'GA' },
];

/** Formats a date for the share card top bar, e.g. "23 Jun 2026". */
export function formatShareCardDate(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
