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

export interface MediaItem {
  uri: string;
  type: 'image' | 'video';
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
  statsOverride?: Record<string, { a: number; b: number }>;
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
  | 'delMatch';
