import type { Player } from '@/store/types';

/** Resolves the name to show for a player, honoring the showNick display setting. */
export function getPlayerDisplayName(
  player: Pick<Player, 'name' | 'nick'> | undefined,
  showNick: boolean,
  fallback = 'Unknown',
): string {
  if (showNick && player?.nick) return player.nick;
  return player?.name ?? fallback;
}
