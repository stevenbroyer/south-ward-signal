/**
 * Supabase Database Types for South Ward Signal
 *
 * Manually derived from migration files:
 *   20260226200000_initial_schema.sql
 *   20260226210000_data_room_expansion.sql
 *   20260226220000_widen_numeric_columns.sql
 *   20260226230000_relax_foreign_keys.sql
 *   20260226240000_add_cancelled_status.sql
 *   20260227100000_add_image_columns.sql
 *   20260227200000_market_values.sql
 *   20260228000000_fotmob_enrichment.sql
 *
 * Regenerate with `supabase gen types typescript` when the CLI is configured.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      /* ── matches ──────────────────────────────────────────────────── */
      matches: {
        Row: {
          id: string;
          date: string;
          home_team: string;
          away_team: string;
          home_team_id: string | null;
          away_team_id: string | null;
          home_score: number | null;
          away_score: number | null;
          home_xg: number | null;
          away_xg: number | null;
          status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
          venue: string | null;
          competition: string;
          season: number;
          stats: Json | null;
          lineups: Json | null;
          shots: Json | null;
          pass_pairs: Json | null;
          goals_added: Json | null;
          fotmob_id: string | null;
          momentum: Json | null;
          events: Json | null;
          referee: string | null;
          attendance: number | null;
          player_of_match: string | null;
          player_of_match_rating: number | null;
          home_formation: string | null;
          away_formation: string | null;
          home_coach: string | null;
          away_coach: string | null;
          match_round: string | null;
          weather: Json | null;
          data_source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['matches']['Row'],
          'created_at' | 'updated_at'
        > & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['matches']['Insert']>;
      };

      /* ── articles ─────────────────────────────────────────────────── */
      articles: {
        Row: {
          id: string;
          match_id: string | null;
          type:
            | 'match-recap'
            | 'pre-match-preview'
            | 'player-spotlight'
            | 'power-rankings'
            | 'transfer-intel'
            | 'stat-of-week'
            | 'weekly-roundup';
          title: string;
          slug: string;
          excerpt: string | null;
          body: string | null;
          html_body: string | null;
          ghost_url: string | null;
          ghost_id: string | null;
          seo_title: string | null;
          seo_description: string | null;
          featured_image: string | null;
          tags: string[];
          word_count: number;
          status: 'draft' | 'published' | 'failed' | 'archived';
          qa_passed: boolean | null;
          qa_result: Json | null;
          social_content: Json | null;
          created_at: string;
          published_at: string | null;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['articles']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['articles']['Insert']>;
      };

      /* ── social_queue ─────────────────────────────────────────────── */
      social_queue: {
        Row: {
          id: string;
          article_id: string | null;
          platform: 'twitter' | 'tiktok' | 'instagram' | 'bluesky';
          content: Json;
          images: string[];
          status: 'queued' | 'posted' | 'failed';
          scheduled_for: string;
          posted_at: string | null;
          external_id: string | null;
          error_message: string | null;
          retry_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['social_queue']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['social_queue']['Insert']>;
      };

      /* ── standings ────────────────────────────────────────────────── */
      standings: {
        Row: {
          id: string;
          team: string;
          team_id: string | null;
          position: number;
          points: number;
          wins: number;
          draws: number;
          losses: number;
          goals_for: number;
          goals_against: number;
          goal_difference: number;
          form: string[];
          games_played: number;
          season: number;
          conference: string | null;
          ppg: number; // generated column
          logo_url: string | null;
          sofascore_team_id: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['standings']['Row'],
          'id' | 'ppg' | 'created_at' | 'updated_at'
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['standings']['Insert']>;
      };

      /* ── standings_history ────────────────────────────────────────── */
      standings_history: {
        Row: {
          id: string;
          week: number;
          season: number;
          team: string;
          team_id: string | null;
          position: number;
          points: number;
          conference: string | null;
          snapshot_date: string;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['standings_history']['Row'],
          'id' | 'created_at'
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['standings_history']['Insert']>;
      };

      /* ── player_stats ─────────────────────────────────────────────── */
      player_stats: {
        Row: {
          id: string;
          name: string;
          team: string;
          position: string | null;
          season: number;
          games_played: number;
          minutes: number;
          goals: number;
          assists: number;
          xg: number | null;
          xa: number | null;
          goals_added: number | null;
          key_passes: number | null;
          tackles_won: number | null;
          interceptions: number | null;
          aerial_duels_won: number | null;
          pass_completion: number | null;
          progressive_passes: number | null;
          progressive_carries: number | null;
          shot_creating_actions: number | null;
          goal_creating_actions: number | null;
          xg_per_90: number; // generated column
          xa_per_90: number; // generated column
          image_url: string | null;
          sofascore_id: number | null;
          nationality: string | null;
          age: number | null;
          preferred_foot: string | null;
          height_cm: number | null;
          shirt_number: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['player_stats']['Row'],
          'xg_per_90' | 'xa_per_90' | 'created_at' | 'updated_at'
        > & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['player_stats']['Insert']>;
      };

      /* ── match_shots ──────────────────────────────────────────────── */
      match_shots: {
        Row: {
          id: string;
          match_id: string;
          team: string;
          player: string;
          minute: number;
          x: number;
          y: number;
          xg: number | null;
          outcome: 'goal' | 'saved' | 'blocked' | 'off_target' | 'post';
          body_part: string | null;
          shot_type: string | null;
          assist_player: string | null;
          home_team_side: boolean;
          expected_goals_on_target: number | null;
          situation: string | null;
          fotmob_player_id: number | null;
          on_goal_shot: Json | null;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['match_shots']['Row'],
          'id' | 'created_at'
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['match_shots']['Insert']>;
      };

      /* ── match_xg_flow ────────────────────────────────────────────── */
      match_xg_flow: {
        Row: {
          id: string;
          match_id: string;
          minute: number;
          home_xg: number;
          away_xg: number;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['match_xg_flow']['Row'],
          'id' | 'created_at'
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['match_xg_flow']['Insert']>;
      };

      /* ── player_match_stats ───────────────────────────────────────── */
      player_match_stats: {
        Row: {
          id: string;
          match_id: string;
          player_name: string;
          team: string;
          position: string | null;
          minutes_played: number;
          goals: number;
          assists: number;
          xg: number | null;
          xa: number | null;
          shots: number;
          key_passes: number;
          passes: number;
          pass_accuracy: number | null;
          tackles: number;
          interceptions: number;
          fouls: number;
          yellows: number;
          reds: number;
          fotmob_rating: number | null;
          goals_added: number | null;
          shots_on_target: number;
          dribbles_attempted: number;
          dribbles_succeeded: number;
          duels_won: number;
          duels_total: number;
          aerial_duels_won: number;
          aerial_duels_total: number;
          touches: number;
          clearances: number;
          blocks: number;
          crosses: number;
          long_balls: number;
          long_balls_accurate: number;
          saves: number;
          goals_prevented: number | null;
          shirt_number: number | null;
          is_starter: boolean | null;
          sub_on_minute: number | null;
          sub_off_minute: number | null;
          is_home: boolean | null;
          fotmob_player_id: number | null;
          data_source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['player_match_stats']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['player_match_stats']['Insert']>;
      };

      /* ── team_season_stats ────────────────────────────────────────── */
      team_season_stats: {
        Row: {
          id: string;
          team: string;
          team_id: string | null;
          season: number;
          games_played: number;
          wins: number;
          draws: number;
          losses: number;
          goals_for: number;
          goals_against: number;
          xg_for: number;
          xg_against: number;
          xg_diff: number; // generated column
          goals_added: number | null;
          xpass: number | null;
          points: number;
          ppg: number; // generated column
          salary_budget: number | null;
          conference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['team_season_stats']['Row'],
          'xg_diff' | 'ppg' | 'created_at' | 'updated_at'
        > & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['team_season_stats']['Insert']>;
      };

      /* ── player_season_history ────────────────────────────────────── */
      player_season_history: {
        Row: {
          id: string;
          player_name: string;
          team: string;
          season: number;
          position: string | null;
          games_played: number;
          minutes: number;
          goals: number;
          assists: number;
          xg: number | null;
          xa: number | null;
          goals_added: number | null;
          ga_dribbling: number | null;
          ga_passing: number | null;
          ga_receiving: number | null;
          ga_shooting: number | null;
          ga_defending: number | null;
          key_passes: number | null;
          tackles_won: number | null;
          interceptions: number | null;
          pass_completion: number | null;
          salary: number | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['player_season_history']['Row'],
          'created_at' | 'updated_at'
        > & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['player_season_history']['Insert']>;
      };

      /* ── team_match_advanced ──────────────────────────────────────── */
      team_match_advanced: {
        Row: {
          id: string;
          match_id: string;
          team: string;
          season: number;
          match_date: string;
          opponent: string;
          is_home: boolean;
          result: 'W' | 'D' | 'L' | null;
          goals_for: number;
          goals_against: number;
          xg_for: number | null;
          xg_against: number | null;
          possession: number | null;
          shots: number;
          shots_on_target: number;
          ppda: number | null;
          passes: number;
          pass_accuracy: number | null;
          corners: number;
          fouls: number;
          goals_added: number | null;
          clean_sheet: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['team_match_advanced']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['team_match_advanced']['Insert']>;
      };

      /* ── fotmob_cache ─────────────────────────────────────────────── */
      fotmob_cache: {
        Row: {
          cache_key: string;
          data: Json;
          fetched_at: string;
          expires_at: string;
        };
        Insert: Database['public']['Tables']['fotmob_cache']['Row'] & {
          fetched_at?: string;
          expires_at?: string;
        };
        Update: Partial<Database['public']['Tables']['fotmob_cache']['Insert']>;
      };

      /* ── player_market_values ─────────────────────────────────────── */
      player_market_values: {
        Row: {
          id: string;
          player_name: string;
          team: string | null;
          date: string;
          value_eur: number;
          transfermarkt_id: number | null;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['player_market_values']['Row'],
          'id' | 'created_at'
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['player_market_values']['Insert']>;
      };

      /* ── player_transfers ─────────────────────────────────────────── */
      player_transfers: {
        Row: {
          id: string;
          player_name: string;
          from_club: string | null;
          to_club: string | null;
          transfer_date: string | null;
          fee_eur: number | null;
          fee_text: string | null;
          season: string | null;
          transfermarkt_id: number | null;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['player_transfers']['Row'],
          'id' | 'created_at'
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['player_transfers']['Insert']>;
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

/* ── Convenience aliases ──────────────────────────────────────────── */

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
