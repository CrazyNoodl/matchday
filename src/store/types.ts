export interface Player {
  id: string;
  name: string;
  nick?: string;
  color: string;
  teamCode: string;
  photo?: string;
}

export interface Team {
  code: string;
  name: string;
  short: string;
  color: string;
  custom?: boolean;
  logo?: string;
}

export type MediaType = 'image' | 'video';

export type MatchResult = 'W' | 'D' | 'L';

export type StatConfidence = 'high' | 'medium' | 'low';

/** The 23 canonical match-stat keys, kept in sync with `STAT_DEFINITIONS` in `src/utils/statDefinitions.ts`. */
export type KnownStatKey =
  | 'possession'
  | 'timeToRegain'
  | 'shots'
  | 'expectedGoals'
  | 'passes'
  | 'tackles'
  | 'successfulTackles'
  | 'interceptions'
  | 'saves'
  | 'fouls'
  | 'offsides'
  | 'corners'
  | 'freekicks'
  | 'penaltyShots'
  | 'yellowCards'
  | 'redCards'
  | 'breaksThroughCenter'
  | 'breaksThroughWing'
  | 'breaksThroughHigh'
  | 'defBreakAttempts'
  | 'successfulDribbles'
  | 'shotAccuracy'
  | 'passAccuracy';

/**
 * Escape-hatch union: keeps autocomplete + typo protection for the 23 known keys
 * while still accepting arbitrary OCR-extracted keys (and legacy simulated-only
 * keys like `shotsOnTarget`) as plain strings.
 */
export type StatKey = KnownStatKey | (string & {});

export interface MediaItem {
  uri: string;
  type: MediaType;
  pendingUpload?: boolean;
  uploading?: boolean;
}

export interface Match {
  id: string;
  aId: string;
  bId: string;
  aTeam: string;
  bTeam: string;
  aScore: number;
  bScore: number;
  media?: MediaItem[];
  note?: string;
  // Sparse map keyed by stat key — deliberately `Record<string, ...>` rather than
  // `Record<StatKey, ...>`: mapping a Record's *keys* over a union containing
  // literal members makes each literal a required property, which is wrong for
  // a partial override where only some of the 23 keys may be present.
  statsOverride?: Record<string, { a: number; b: number; confidence?: StatConfidence }>;
  // Storage sub-folder name for this match's media, fixed at creation time
  // (e.g. "match_2-2_2026-07-03_1432"). Never regenerated on score edits.
  // Absent on matches created before the per-round/per-match storage layout.
  mediaFolder?: string;
}

export interface ArchivedRound {
  id: string;
  n: number;
  date: string;
  winner: string;
  games: number;
  ranked: boolean;
  matches: Match[];
  name: string;
  players?: string[];
  // Storage folder name for this round's media (e.g. "matchday-2026-07-03_1430").
  // Absent on rounds started before the per-round/per-match storage layout.
  folder?: string;
}

export interface ClosedTournament {
  id: string;
  name: string;
  date: string;
  rounds: ArchivedRound[];
  champId: string;
  champName: string;
  champColor: string;
  champInit: string;
  players: string[];
}

export interface RealDataBackup {
  tournamentId: string;
  hasTournament: boolean;
  tournamentName: string;
  round: number;
  roundOpen: boolean;
  tournamentRanked: boolean;
  tournamentRounds: number;
  tournamentPlayers: string[];
  roundPlayers: string[];
  matches: Match[];
  archivedRounds: ArchivedRound[];
  closedTournaments: ClosedTournament[];
  players: Player[];
  teams: Team[];
}

export type Modal =
  | null
  | 'add'
  | 'end'
  | 'winner'
  | 'photo'
  | 'del'
  | 'teams'
  | 'assign'
  | 'needEqual'
  | 'needBreakTie'
  | 'editStats'
  | 'editScore'
  | 'editTourName'
  | 'closeTour'
  | 'confirmDelPlayer'
  | 'confirmDelTeam'
  | 'cannotDelete'
  | 'editPlayer'
  | 'editTeam'
  | 'tourSettings'
  | 'newRound'
  | 'delMatch'
  | 'editRoundDate'
  | 'delRound';
