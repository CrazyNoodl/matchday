import { Colors } from '@/theme/colors';
import type { Player, Team, Match, ArchivedRound, ClosedTournament } from '@/store/types';

// ---------------------------------------------------------------------------
// Players & Teams
// ---------------------------------------------------------------------------
export const DEMO_PLAYERS: Player[] = [
  { id: 'demo-p1', name: 'Ruslan', nick: 'Rusik', color: Colors.player[0], teamCode: 'JUV' },
  { id: 'demo-p2', name: 'Artem',  nick: 'Art',   color: Colors.player[1], teamCode: 'TOT' },
  { id: 'demo-p3', name: 'Uz',                    color: Colors.player[2], teamCode: 'GAL' },
];

export const DEMO_TEAMS: Team[] = [
  { code: 'JUV', name: 'Juventus',          short: 'JUV', color: Colors.team[0] },
  { code: 'TOT', name: 'Tottenham Hotspur', short: 'TOT', color: Colors.team[1] },
  { code: 'GAL', name: 'Galatasaray',       short: 'GAL', color: Colors.team[2] },
];

// ---------------------------------------------------------------------------
// Champions Cup — closed tournament (Ruslan champion)
// ---------------------------------------------------------------------------
const CC_R1: Match[] = [
  { id: 'cc-r1-m1', aId: 'demo-p1', bId: 'demo-p2', aTeam: 'JUV', bTeam: 'TOT', aScore: 2, bScore: 0 },
  { id: 'cc-r1-m2', aId: 'demo-p1', bId: 'demo-p3', aTeam: 'JUV', bTeam: 'GAL', aScore: 3, bScore: 1 },
  { id: 'cc-r1-m3', aId: 'demo-p2', bId: 'demo-p3', aTeam: 'TOT', bTeam: 'GAL', aScore: 1, bScore: 2 },
];

const CC_R2: Match[] = [
  { id: 'cc-r2-m1', aId: 'demo-p1', bId: 'demo-p2', aTeam: 'JUV', bTeam: 'TOT', aScore: 3, bScore: 2 },
  { id: 'cc-r2-m2', aId: 'demo-p1', bId: 'demo-p3', aTeam: 'JUV', bTeam: 'GAL', aScore: 2, bScore: 1 },
  { id: 'cc-r2-m3', aId: 'demo-p2', bId: 'demo-p3', aTeam: 'TOT', bTeam: 'GAL', aScore: 0, bScore: 1 },
];

const CC_ARCHIVED_ROUNDS: ArchivedRound[] = [
  { id: 'cc-r1', n: 1, name: 'Round 1', date: '2026-03-15T14:00:00.000Z', winner: 'demo-p1', games: 3, ranked: true, matches: CC_R1 },
  { id: 'cc-r2', n: 2, name: 'Round 2', date: '2026-03-22T14:00:00.000Z', winner: 'demo-p1', games: 3, ranked: true, matches: CC_R2 },
];

const DEMO_CLOSED_TOURNAMENTS: ClosedTournament[] = [
  {
    id: 'demo-tour-cc',
    name: 'Champions Cup',
    date: '2026-03-23T16:00:00.000Z',
    rounds: CC_ARCHIVED_ROUNDS,
    champId: 'demo-p1',
    champName: 'Ruslan',
    champColor: Colors.player[0],
    champInit: 'RU',
    players: ['demo-p1', 'demo-p2', 'demo-p3'],
  },
];

// ---------------------------------------------------------------------------
// Premier League S2 — active tournament
// ---------------------------------------------------------------------------
// Round 1 — Ruslan wins (2W 6pts)
const PL_R1: Match[] = [
  { id: 'pl-r1-m1', aId: 'demo-p1', bId: 'demo-p2', aTeam: 'JUV', bTeam: 'TOT', aScore: 3, bScore: 1 },
  { id: 'pl-r1-m2', aId: 'demo-p1', bId: 'demo-p3', aTeam: 'JUV', bTeam: 'GAL', aScore: 4, bScore: 2 },
  { id: 'pl-r1-m3', aId: 'demo-p2', bId: 'demo-p3', aTeam: 'TOT', bTeam: 'GAL', aScore: 2, bScore: 0 },
];

// Round 2 — Uz wins (2W 6pts)
const PL_R2: Match[] = [
  { id: 'pl-r2-m1', aId: 'demo-p1', bId: 'demo-p2', aTeam: 'JUV', bTeam: 'TOT', aScore: 2, bScore: 3 },
  { id: 'pl-r2-m2', aId: 'demo-p1', bId: 'demo-p3', aTeam: 'JUV', bTeam: 'GAL', aScore: 1, bScore: 2 },
  { id: 'pl-r2-m3', aId: 'demo-p2', bId: 'demo-p3', aTeam: 'TOT', bTeam: 'GAL', aScore: 0, bScore: 1 },
];

const DEMO_ARCHIVED_ROUNDS: ArchivedRound[] = [
  { id: 'pl-r1', n: 1, name: 'Round 1', date: '2026-04-12T14:00:00.000Z', winner: 'demo-p1', games: 3, ranked: true, matches: PL_R1 },
  { id: 'pl-r2', n: 2, name: 'Round 2', date: '2026-04-19T14:00:00.000Z', winner: 'demo-p3', games: 3, ranked: true, matches: PL_R2 },
];

// Round 3 — currently open (2 of 3 matches played)
const DEMO_CURRENT_MATCHES: Match[] = [
  { id: 'pl-r3-m1', aId: 'demo-p1', bId: 'demo-p2', aTeam: 'JUV', bTeam: 'TOT', aScore: 2, bScore: 1 },
  { id: 'pl-r3-m2', aId: 'demo-p2', bId: 'demo-p3', aTeam: 'TOT', bTeam: 'GAL', aScore: 1, bScore: 1 },
];

// ---------------------------------------------------------------------------
// Full demo state snapshot (injected into the store)
// ---------------------------------------------------------------------------
export const DEMO_STATE = {
  players: DEMO_PLAYERS,
  teams: DEMO_TEAMS,

  hasTournament: true,
  tournamentName: 'Premier League S2',
  round: 3,
  roundOpen: true,
  tournamentRanked: true,
  tournamentPlayers: ['demo-p1', 'demo-p2', 'demo-p3'] as string[],
  matches: DEMO_CURRENT_MATCHES,
  archivedRounds: DEMO_ARCHIVED_ROUNDS,
  closedTournaments: DEMO_CLOSED_TOURNAMENTS,

  showNick: true,
  showTeamLogo: true,
  language: 'en',
} as const;
