// Generated database types for Supabase schema.
// Run `npx supabase gen types typescript` after schema changes.

export type TournamentSyncStatus = 'active' | 'closed';
export type RoundSyncStatus = 'open' | 'archived';

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;              // uuid, references auth.users
          created_at: string;
        };
        Insert: { id: string };
        Update: { id?: string };
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          nick: string | null;
          color: string;
          team_code: string;
          photo: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['players']['Row'], 'updated_at'> & { updated_at?: string };
        Update: Partial<Database['public']['Tables']['players']['Insert']>;
        Relationships: [];
      };
      teams: {
        Row: {
          code: string;
          user_id: string;
          name: string;
          short: string;
          color: string;
          custom: boolean;
          logo: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'updated_at'> & { updated_at?: string };
        Update: Partial<Database['public']['Tables']['teams']['Insert']>;
        Relationships: [];
      };
      tournaments: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          ranked: boolean;
          rounds_target: number;
          player_ids: string[];
          round: number;
          round_open: boolean;
          round_players: string[];
          status: TournamentSyncStatus;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tournaments']['Row'], 'updated_at'> & { updated_at?: string };
        Update: Partial<Database['public']['Tables']['tournaments']['Insert']>;
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          user_id: string;
          tournament_id: string | null;
          round_id: string | null;
          a_id: string;
          b_id: string;
          a_team: string;
          b_team: string;
          a_score: number;
          b_score: number;
          media: string | null;        // JSON
          note: string | null;
          stats_override: string | null; // JSON
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'updated_at'> & { updated_at?: string };
        Update: Partial<Database['public']['Tables']['matches']['Insert']>;
        Relationships: [];
      };
      rounds: {
        Row: {
          id: string;
          user_id: string;
          tournament_id: string;
          n: number;
          date: string;
          winner: string;
          games: number;
          ranked: boolean;
          name: string;
          player_ids: string[];
          status: RoundSyncStatus;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['rounds']['Row'], 'updated_at'> & { updated_at?: string };
        Update: Partial<Database['public']['Tables']['rounds']['Insert']>;
        Relationships: [];
      };
      closed_tournaments: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          date: string;
          champ_id: string;
          champ_name: string;
          champ_color: string;
          champ_init: string;
          player_ids: string[];
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['closed_tournaments']['Row'], 'updated_at'> & { updated_at?: string };
        Update: Partial<Database['public']['Tables']['closed_tournaments']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
