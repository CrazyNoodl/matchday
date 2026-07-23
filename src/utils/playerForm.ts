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

// A team is always mandatory — a player with no team can't show a badge/color
// anywhere it's displayed. When `teams` is empty there's nothing to pick, so
// this stays unsatisfiable until the user adds a team first (see
// PlayerEditSheet's teamRequired hint, and setup.tsx's adjacent "Add team" row).
export function canSavePlayer(
  name: string,
  teamCode: string,
  teams: Team[],
  players: Player[],
  editingPlayerId?: string
): boolean {
  return (
    !!name.trim() &&
    !!teamCode &&
    !isDuplicatePlayerName(name, players, editingPlayerId)
  );
}
