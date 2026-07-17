import { calculateStandings, isTopTied, getFormChips, getAnnounceLeaderId } from '../standings';
import { type Match } from '../../store/types';

const match = (id: string, aId: string, bId: string, aScore: number, bScore: number): Match => ({
  id,
  aId,
  bId,
  aScore,
  bScore,
  aTeam: 'A',
  bTeam: 'B',
});

describe('calculateStandings', () => {
  it('returns zero stats for all players with no matches', () => {
    const result = calculateStandings([], ['p1', 'p2']);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      pts: 0,
      gf: 0,
      ga: 0,
      gd: 0,
    });
  });

  it('awards 3 pts to winner, 0 to loser', () => {
    const matches = [match('m1', 'p1', 'p2', 2, 1)];
    const result = calculateStandings(matches, ['p1', 'p2']);
    const p1 = result.find((s) => s.playerId === 'p1')!;
    const p2 = result.find((s) => s.playerId === 'p2')!;
    expect(p1.pts).toBe(3);
    expect(p1.wins).toBe(1);
    expect(p2.pts).toBe(0);
    expect(p2.losses).toBe(1);
  });

  it('awards 1 pt each for a draw', () => {
    const matches = [match('m1', 'p1', 'p2', 1, 1)];
    const result = calculateStandings(matches, ['p1', 'p2']);
    const p1 = result.find((s) => s.playerId === 'p1')!;
    const p2 = result.find((s) => s.playerId === 'p2')!;
    expect(p1.pts).toBe(1);
    expect(p1.draws).toBe(1);
    expect(p2.pts).toBe(1);
    expect(p2.draws).toBe(1);
  });

  it('accumulates GF, GA, GD correctly', () => {
    const matches = [match('m1', 'p1', 'p2', 3, 1), match('m2', 'p1', 'p2', 1, 2)];
    const result = calculateStandings(matches, ['p1', 'p2']);
    const p1 = result.find((s) => s.playerId === 'p1')!;
    expect(p1.gf).toBe(4);
    expect(p1.ga).toBe(3);
    expect(p1.gd).toBe(1);
    expect(p1.played).toBe(2);
  });

  it('sorts by pts descending', () => {
    // p1 wins over p2, p3 beats p4 → p1 and p3 each 3pts, p2 0pts, p4 0pts
    const matches = [match('m1', 'p1', 'p2', 2, 0), match('m2', 'p3', 'p4', 1, 0)];
    const result = calculateStandings(matches, ['p1', 'p2', 'p3', 'p4']);
    expect(result[0].pts).toBe(3);
    expect(result[1].pts).toBe(3);
    expect(result[2].pts).toBe(0);
    expect(result[3].pts).toBe(0);
    // 3pt players come before 0pt players
    const topTwo = result.slice(0, 2).map((s) => s.playerId);
    expect(topTwo).toContain('p1');
    expect(topTwo).toContain('p3');
  });

  it('sorts by GD when pts are tied', () => {
    const matches = [match('m1', 'p1', 'p3', 3, 0), match('m2', 'p2', 'p3', 1, 0)];
    const result = calculateStandings(matches, ['p1', 'p2', 'p3']);
    expect(result[0].playerId).toBe('p1'); // 3pts, GD+3
    expect(result[1].playerId).toBe('p2'); // 3pts, GD+1
  });

  it('sorts by GF when pts and GD are tied', () => {
    const matches = [match('m1', 'p1', 'p3', 2, 1), match('m2', 'p2', 'p3', 3, 2)];
    const result = calculateStandings(matches, ['p1', 'p2', 'p3']);
    expect(result[0].playerId).toBe('p2'); // 3pts, GD+1, GF=3
    expect(result[1].playerId).toBe('p1'); // 3pts, GD+1, GF=2
  });

  it('applies H2H tiebreaker when pts/GD/GF all equal', () => {
    // p1 and p2 both have same overall stats but p1 beat p2 head-to-head
    const matches = [
      match('m1', 'p1', 'p2', 2, 1), // p1 wins H2H
      match('m2', 'p2', 'p1', 2, 1), // p2 wins H2H → tied in H2H overall...
    ];
    // After both matches: p1: 3pts, GD+0, GF=3; p2: 3pts, GD+0, GF=3
    // H2H: p1 wins m1 (3pts), p2 wins m2 (3pts) → H2H tied too
    // So order stays alphabetical/insertion
    const result = calculateStandings(matches, ['p1', 'p2']);
    expect(result).toHaveLength(2);
    expect(result[0].pts).toBe(3);
    expect(result[1].pts).toBe(3);
  });

  it('H2H breaks the tie when one player won head-to-head only', () => {
    // Both have 3pts, same GD, same GF overall
    // p1 beat p2 directly in the only mutual match
    const matches = [
      match('m1', 'p1', 'p3', 1, 0), // p1: 3pts, GD+1, GF=1
      match('m2', 'p2', 'p4', 1, 0), // p2: 3pts, GD+1, GF=1
      match('m3', 'p1', 'p2', 1, 0), // p1 beats p2 — H2H
      match('m4', 'p3', 'p4', 0, 0), // noise
    ];
    const result = calculateStandings(matches, ['p1', 'p2', 'p3', 'p4']);
    const p1idx = result.findIndex((s) => s.playerId === 'p1');
    const p2idx = result.findIndex((s) => s.playerId === 'p2');
    expect(p1idx).toBeLessThan(p2idx);
  });

  it('breaks a pts/GD/GF tie (no mutual match) by total wins', () => {
    // p1: 2 wins, no draws. p2: 1 win + 3 draws. Same pts/GD/GF, never played
    // each other, so H2H is empty (tied) and it falls through to win count.
    const matches = [
      match('m1', 'p1', 'p3', 2, 0),
      match('m2', 'p1', 'p4', 1, 0),
      match('m3', 'p2', 'p3', 3, 0),
      match('m4', 'p2', 'p4', 0, 0),
      match('m5', 'p2', 'p5', 0, 0),
      match('m6', 'p2', 'p6', 0, 0),
    ];
    const result = calculateStandings(matches, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
    const p1 = result.find((s) => s.playerId === 'p1')!;
    const p2 = result.find((s) => s.playerId === 'p2')!;
    expect(p1.pts).toBe(p2.pts);
    expect(p1.gd).toBe(p2.gd);
    expect(p1.gf).toBe(p2.gf);
    expect(p1.wins).toBeGreaterThan(p2.wins);
    expect(result.findIndex((s) => s.playerId === 'p1')).toBeLessThan(
      result.findIndex((s) => s.playerId === 'p2'),
    );
  });

  it('resolves a full tie (pts/GD/GF/H2H/wins all equal) deterministically, so a tournament always has exactly one champion', () => {
    const matches = [match('m1', 'p1', 'p3', 1, 0), match('m2', 'p2', 'p4', 1, 0)];
    const playerIds = ['p1', 'p2', 'p3', 'p4'];
    const first = calculateStandings(matches, playerIds);
    const second = calculateStandings(matches, playerIds);
    // Same order on every call — a stable resolution, not a random pick.
    expect(first.map((s) => s.playerId)).toEqual(second.map((s) => s.playerId));
    expect(first[0].pts).toBe(3);
    expect(first[1].pts).toBe(3);
  });

  it('ignores matches for players not in playerIds', () => {
    const matches = [match('m1', 'p1', 'unknown', 3, 0)];
    const result = calculateStandings(matches, ['p1', 'p2']);
    const p1 = result.find((s) => s.playerId === 'p1')!;
    // p1 played against unknown — still counts since map has p1
    expect(p1.played).toBe(1);
    expect(p1.pts).toBe(3);
    // unknown not in result
    expect(result.find((s) => s.playerId === 'unknown')).toBeUndefined();
  });
});

describe('isTopTied', () => {
  it('returns false when standings has fewer than 2 players', () => {
    const standings = [
      { playerId: 'p1', played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, pts: 3 },
    ];
    expect(isTopTied(standings, [])).toBe(false);
  });

  it('returns false when top two differ in pts', () => {
    const matches = [match('m1', 'p1', 'p2', 2, 0)];
    const standings = calculateStandings(matches, ['p1', 'p2']);
    expect(isTopTied(standings, matches)).toBe(false);
  });

  it('returns false when top two have same pts but differ in GD', () => {
    const matches = [match('m1', 'p1', 'p3', 3, 0), match('m2', 'p2', 'p3', 1, 0)];
    const standings = calculateStandings(matches, ['p1', 'p2', 'p3']);
    expect(isTopTied(standings, matches)).toBe(false);
  });

  it('returns true when all tiebreakers are equal including H2H', () => {
    const matches = [
      match('m1', 'p1', 'p2', 1, 1), // draw — identical H2H
    ];
    const standings = calculateStandings(matches, ['p1', 'p2']);
    expect(isTopTied(standings, matches)).toBe(true);
  });

  it('returns false when pts/GD/GF equal but H2H breaks the tie', () => {
    // p1 and p2 both beat p3 and p4 with same scorelines
    // but p1 beat p2 in H2H, p2 beat p1 in other H2H → equal H2H
    // For a real H2H break: only one H2H match, p1 wins
    const equalStandings = [
      { playerId: 'p1', played: 2, wins: 1, draws: 0, losses: 1, gf: 2, ga: 1, gd: 1, pts: 3 },
      { playerId: 'p2', played: 2, wins: 1, draws: 0, losses: 1, gf: 2, ga: 1, gd: 1, pts: 3 },
    ];
    const h2hMatches = [match('m1', 'p1', 'p2', 2, 0)]; // p1 wins H2H
    expect(isTopTied(equalStandings, h2hMatches)).toBe(false);
  });
});

describe('getFormChips', () => {
  it('returns empty array when player has no matches', () => {
    expect(getFormChips([], 'p1')).toEqual([]);
  });

  it('returns W for a win', () => {
    const matches = [match('m1', 'p1', 'p2', 2, 0)];
    expect(getFormChips(matches, 'p1')).toEqual(['W']);
    expect(getFormChips(matches, 'p2')).toEqual(['L']);
  });

  it('returns D for a draw', () => {
    const matches = [match('m1', 'p1', 'p2', 1, 1)];
    expect(getFormChips(matches, 'p1')).toEqual(['D']);
    expect(getFormChips(matches, 'p2')).toEqual(['D']);
  });

  it('returns L for a loss', () => {
    const matches = [match('m1', 'p1', 'p2', 0, 3)];
    expect(getFormChips(matches, 'p1')).toEqual(['L']);
  });

  it('returns last 3 results by default', () => {
    const matches = [
      match('m1', 'p1', 'p2', 1, 0),
      match('m2', 'p1', 'p2', 0, 1),
      match('m3', 'p1', 'p2', 1, 1),
      match('m4', 'p1', 'p2', 2, 0),
    ];
    expect(getFormChips(matches, 'p1')).toEqual(['L', 'D', 'W']);
  });

  it('respects custom count', () => {
    const matches = [
      match('m1', 'p1', 'p2', 1, 0),
      match('m2', 'p1', 'p2', 0, 1),
      match('m3', 'p1', 'p2', 1, 1),
    ];
    expect(getFormChips(matches, 'p1', 2)).toEqual(['L', 'D']);
  });

  it('only includes matches where the player participated', () => {
    const matches = [
      match('m1', 'p1', 'p2', 1, 0),
      match('m2', 'p3', 'p4', 2, 1),
      match('m3', 'p1', 'p3', 0, 0),
    ];
    expect(getFormChips(matches, 'p1')).toEqual(['W', 'D']);
  });

  it('works correctly when player is side B', () => {
    const matches = [match('m1', 'p2', 'p1', 0, 3)];
    expect(getFormChips(matches, 'p1')).toEqual(['W']);
  });
});

describe('getAnnounceLeaderId', () => {
  // With 2 players a "tour" (round-robin cycle) is exactly 1 match, so these
  // cases exercise every gate except the tour-boundary check (covered below
  // with 3 players, where a tour spans multiple matches).
  const opts = { enabled: true, minPlayers: 0, playerCount: 2 };

  it('returns null when the feature is disabled', () => {
    const matches = [match('m1', 'p1', 'p2', 2, 0)];
    const standings = calculateStandings(matches, ['p1', 'p2']);
    expect(getAnnounceLeaderId(null, standings, matches, { ...opts, enabled: false })).toBeNull();
  });

  it('returns null when the player count is at or below the threshold', () => {
    const matches = [match('m1', 'p1', 'p2', 2, 0)];
    const standings = calculateStandings(matches, ['p1', 'p2']);
    expect(
      getAnnounceLeaderId(null, standings, matches, { ...opts, minPlayers: 2 }),
    ).toBeNull();
  });

  it('returns null when there are no matches yet', () => {
    expect(getAnnounceLeaderId(null, [], [], opts)).toBeNull();
  });

  it('returns null when the top two are still tied after every tiebreaker', () => {
    const matches = [match('m1', 'p1', 'p2', 1, 1)];
    const standings = calculateStandings(matches, ['p1', 'p2']);
    expect(getAnnounceLeaderId(null, standings, matches, opts)).toBeNull();
  });

  it('returns null when the leader is unchanged from last time', () => {
    const matches = [match('m1', 'p1', 'p2', 2, 0)];
    const standings = calculateStandings(matches, ['p1', 'p2']);
    expect(getAnnounceLeaderId('p1', standings, matches, opts)).toBeNull();
  });

  it('returns the new leader id when the leader changes', () => {
    const matches = [match('m1', 'p1', 'p2', 2, 0)];
    const standings = calculateStandings(matches, ['p1', 'p2']);
    expect(getAnnounceLeaderId('p2', standings, matches, opts)).toBe('p1');
  });

  it('returns the leader id on first emergence (prev is null)', () => {
    const matches = [match('m1', 'p1', 'p2', 2, 0)];
    const standings = calculateStandings(matches, ['p1', 'p2']);
    expect(getAnnounceLeaderId(null, standings, matches, opts)).toBe('p1');
  });

  describe('tour-boundary gate (3 players — a tour is 3 matches)', () => {
    const tourOpts = { enabled: true, minPlayers: 0, playerCount: 3 };
    // Tour 1: p1 wins both its matches — clear leader.
    const m1 = match('m1', 'p1', 'p2', 2, 0);
    const m2 = match('m2', 'p1', 'p3', 2, 0);
    const m3 = match('m3', 'p2', 'p3', 2, 0);
    // Tour 2: p3 wins big enough to overtake p1 on GD despite equal pts.
    const m4 = match('m4', 'p3', 'p1', 5, 0);
    const m5 = match('m5', 'p3', 'p2', 5, 0);
    const m6 = match('m6', 'p2', 'p1', 1, 0);

    it('stays null mid-tour, even if the standings leader has already flipped', () => {
      const oneMatch = [m1];
      expect(
        getAnnounceLeaderId(null, calculateStandings(oneMatch, ['p1', 'p2', 'p3']), oneMatch, tourOpts),
      ).toBeNull();

      const twoMatches = [m1, m2];
      expect(
        getAnnounceLeaderId(
          null,
          calculateStandings(twoMatches, ['p1', 'p2', 'p3']),
          twoMatches,
          tourOpts,
        ),
      ).toBeNull();
    });

    it('announces the leader once the first tour completes', () => {
      const tour1 = [m1, m2, m3];
      const standings = calculateStandings(tour1, ['p1', 'p2', 'p3']);
      expect(standings[0].playerId).toBe('p1');
      expect(getAnnounceLeaderId(null, standings, tour1, tourOpts)).toBe('p1');
    });

    it('stays null mid-second-tour, and null again at the boundary if unchanged', () => {
      const midTour2 = [m1, m2, m3, m4];
      expect(
        getAnnounceLeaderId(
          'p1',
          calculateStandings(midTour2, ['p1', 'p2', 'p3']),
          midTour2,
          tourOpts,
        ),
      ).toBeNull();
    });

    it('announces the new leader once the second tour completes and the leader changed', () => {
      const tour2 = [m1, m2, m3, m4, m5, m6];
      const standings = calculateStandings(tour2, ['p1', 'p2', 'p3']);
      expect(standings[0].playerId).toBe('p3');
      expect(getAnnounceLeaderId('p1', standings, tour2, tourOpts)).toBe('p3');
    });
  });
});
