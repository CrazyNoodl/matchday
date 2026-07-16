import { type Team } from '@/store/types';

// A team pick is only mandatory when there's actually a team to pick — a
// fresh install starts with `teams: []`, and hard-requiring one there would
// dead-end the very first "add player" flow with no inline way out.
export function canSavePlayer(name: string, teamCode: string, teams: Team[]): boolean {
  const teamRequired = teams.length > 0;
  return !!name.trim() && (!teamRequired || !!teamCode);
}
