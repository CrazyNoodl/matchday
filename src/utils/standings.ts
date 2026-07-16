import { type Match, type MatchResult } from '../store/types';
import { getCurrentTourMatches } from './matchTours';

export interface Standing {
  playerId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

// ---------------------------------------------------------------------------
// H2H mini-standings for a tied group
// ---------------------------------------------------------------------------

interface H2HStats {
  pts: number;
  gd: number;
  gf: number;
}

function calcH2HGroup(group: Standing[], allMatches: Match[]): Map<string, H2HStats> {
  const groupIds = new Set(group.map((s) => s.playerId));
  const h2hMatches = allMatches.filter((m) => groupIds.has(m.aId) && groupIds.has(m.bId));

  const map = new Map<string, H2HStats>();
  for (const s of group) {
    map.set(s.playerId, { pts: 0, gd: 0, gf: 0 });
  }

  for (const m of h2hMatches) {
    const a = map.get(m.aId);
    const b = map.get(m.bId);

    if (a) {
      a.gf += m.aScore;
      a.gd += m.aScore - m.bScore;
      if (m.aScore > m.bScore) a.pts += 3;
      else if (m.aScore === m.bScore) a.pts += 1;
    }
    if (b) {
      b.gf += m.bScore;
      b.gd += m.bScore - m.aScore;
      if (m.bScore > m.aScore) b.pts += 3;
      else if (m.aScore === m.bScore) b.pts += 1;
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Sort a pre-sorted (by pts/gd/gf) standings array applying h2h within
// tied groups.
// ---------------------------------------------------------------------------

function applyH2HSort(sorted: Standing[], allMatches: Match[]): Standing[] {
  const result: Standing[] = [];
  let i = 0;

  while (i < sorted.length) {
    // Find the end of the current tied group (same pts, gd, gf)
    let j = i + 1;
    while (
      j < sorted.length &&
      sorted[j].pts === sorted[i].pts &&
      sorted[j].gd === sorted[i].gd &&
      sorted[j].gf === sorted[i].gf
    ) {
      j++;
    }

    const group = sorted.slice(i, j);

    if (group.length === 1) {
      result.push(group[0]);
    } else {
      // Apply h2h mini-league sort within the tied group
      const h2hMap = calcH2HGroup(group, allMatches);
      const sortedGroup = [...group].sort((a, b) => {
        const ha = h2hMap.get(a.playerId)!;
        const hb = h2hMap.get(b.playerId)!;
        if (hb.pts !== ha.pts) return hb.pts - ha.pts;
        if (hb.gd !== ha.gd) return hb.gd - ha.gd;
        return hb.gf - ha.gf;
      });
      result.push(...sortedGroup);
    }

    i = j;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function calculateStandings(matches: Match[], playerIds: string[]): Standing[] {
  const map = new Map<string, Standing>();

  for (const id of playerIds) {
    map.set(id, {
      playerId: id,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
    });
  }

  for (const m of matches) {
    const a = map.get(m.aId);
    const b = map.get(m.bId);

    if (a) {
      a.played += 1;
      a.gf += m.aScore;
      a.ga += m.bScore;
      a.gd += m.aScore - m.bScore;
      if (m.aScore > m.bScore) {
        a.wins += 1;
        a.pts += 3;
      } else if (m.aScore === m.bScore) {
        a.draws += 1;
        a.pts += 1;
      } else {
        a.losses += 1;
      }
    }

    if (b) {
      b.played += 1;
      b.gf += m.bScore;
      b.ga += m.aScore;
      b.gd += m.bScore - m.aScore;
      if (m.bScore > m.aScore) {
        b.wins += 1;
        b.pts += 3;
      } else if (m.aScore === m.bScore) {
        b.draws += 1;
        b.pts += 1;
      } else {
        b.losses += 1;
      }
    }
  }

  // Primary sort: pts → gd → gf
  const primary = Array.from(map.values()).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  // Secondary sort: h2h within tied groups
  return applyH2HSort(primary, matches);
}

/**
 * Returns true when the top two standings positions are STILL tied after
 * applying every tiebreaker: pts → gd → gf → h2h pts → h2h gd → h2h gf.
 * Call this after calculateStandings() to decide whether to declare a winner.
 */
export function isTopTied(standings: Standing[], allMatches: Match[]): boolean {
  if (standings.length < 2) return false;

  const [a, b] = standings;

  // Overall stats must be equal first
  if (a.pts !== b.pts || a.gd !== b.gd || a.gf !== b.gf) return false;

  // Check h2h between these two
  const h2hMap = calcH2HGroup([a, b], allMatches);
  const ha = h2hMap.get(a.playerId)!;
  const hb = h2hMap.get(b.playerId)!;

  return ha.pts === hb.pts && ha.gd === hb.gd && ha.gf === hb.gf;
}

/**
 * Decides whether a "leader changed" announcement should fire at the end of
 * a completed tour (round-robin cycle — every player has played every other
 * player once; see matchTours.ts). Returns the new leader's playerId when it
 * should, or null when it shouldn't (feature disabled, too few players, a
 * tour still in progress, no leader yet, a genuine tie at the top, or the
 * leader hasn't actually changed since the last completed tour).
 */
export function getAnnounceLeaderId(
  prevLeaderId: string | null,
  standings: Standing[],
  matches: Match[],
  options: { enabled: boolean; minPlayers: number; playerCount: number },
): string | null {
  if (!options.enabled) return null;
  if (options.playerCount <= options.minPlayers) return null;
  if (matches.length === 0) return null;
  if (getCurrentTourMatches(matches, options.playerCount).length !== 0) return null;
  if (standings.length === 0) return null;
  if (isTopTied(standings, matches)) return null;

  const currentLeaderId = standings[0].playerId;
  if (currentLeaderId === prevLeaderId) return null;

  return currentLeaderId;
}

export function getFormChips(matches: Match[], playerId: string, count = 3): MatchResult[] {
  const relevant = matches.filter((m) => m.aId === playerId || m.bId === playerId).slice(-count);

  return relevant.map((m) => {
    const isA = m.aId === playerId;
    const myScore = isA ? m.aScore : m.bScore;
    const oppScore = isA ? m.bScore : m.aScore;
    if (myScore > oppScore) return 'W';
    if (myScore === oppScore) return 'D';
    return 'L';
  });
}
