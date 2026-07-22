import { type Player, type Team } from '@/store/types';

// Case/whitespace-insensitive so "Alex" and " alex " collide — matches the
// dedup rule bulk import already applies via name.toLowerCase().
export function isDuplicatePlayerName(
  name: string,
  players: Player[],
  editingPlayerId?: string
): boolean {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return false;
  return players.some(
    (p) => p.id !== editingPlayerId && p.name.trim().toLowerCase() === normalized
  );
}

// A team pick is only mandatory when there's actually a team to pick — a
// fresh install starts with `teams: []`, and hard-requiring one there would
// dead-end the very first "add player" flow with no inline way out.
export function canSavePlayer(
  name: string,
  teamCode: string,
  teams: Team[],
  players: Player[],
  editingPlayerId?: string
): boolean {
  const teamRequired = teams.length > 0;
  return (
    !!name.trim() &&
    (!teamRequired || !!teamCode) &&
    !isDuplicatePlayerName(name, players, editingPlayerId)
  );
}
