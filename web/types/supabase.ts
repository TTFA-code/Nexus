export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      clubs: {
        Row: {
          announcement_channel_id: string | null
          created_at: string | null
          guild_id: string
          name: string | null
          premium_tier: number | null
        }
        Insert: {
          announcement_channel_id?: string | null
          created_at?: string | null
          guild_id: string
          name?: string | null
          premium_tier?: number | null
        }
        Update: {
          announcement_channel_id?: string | null
          created_at?: string | null
          guild_id?: string
          name?: string | null
          premium_tier?: number | null
        }
        Relationships: []
      }
      game_modes: {
        Row: {
          game_id: string | null
          guild_id: string | null
          id: string
          is_active: boolean | null
          name: string
          team_size: number
        }
        Insert: {
          game_id?: string | null
          guild_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          team_size: number
        }
        Update: {
          game_id?: string | null
          guild_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          team_size?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_modes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          icon_url: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          icon_url?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          icon_url?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      guild_bans: {
        Row: {
          created_at: string | null
          guild_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          guild_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          guild_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_bans_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["guild_id"]
          },
          {
            foreignKeyName: "guild_bans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "guild_bans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_discord_sync"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      lobbies: {
        Row: {
          created_at: string | null
          creator_id: string
          game_id: string | null
          game_mode_id: string | null
          guild_id: string | null
          id: string
          is_private: boolean | null
          is_tournament: boolean | null
          match_id: string | null
          notes: string | null
          region: string | null
          scheduled_start: string | null
          sector_key: string | null
          status: string | null
          voice_required: boolean | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          game_id?: string | null
          game_mode_id?: string | null
          guild_id?: string | null
          id?: string
          is_private?: boolean | null
          is_tournament?: boolean | null
          match_id?: string | null
          notes?: string | null
          region?: string | null
          scheduled_start?: string | null
          sector_key?: string | null
          status?: string | null
          voice_required?: boolean | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          game_id?: string | null
          game_mode_id?: string | null
          guild_id?: string | null
          id?: string
          is_private?: boolean | null
          is_tournament?: boolean | null
          match_id?: string | null
          notes?: string | null
          region?: string | null
          scheduled_start?: string | null
          sector_key?: string | null
          status?: string | null
          voice_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "lobbies_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uuid_link"]
          },
          {
            foreignKeyName: "lobbies_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "v_discord_sync"
            referencedColumns: ["supabase_id"]
          },
          {
            foreignKeyName: "lobbies_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobbies_game_mode_id_fkey"
            columns: ["game_mode_id"]
            isOneToOne: false
            referencedRelation: "game_modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobbies_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["guild_id"]
          },
          {
            foreignKeyName: "lobbies_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "admin_match_review"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "lobbies_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      lobby_players: {
        Row: {
          id: string
          is_ready: boolean | null
          joined_at: string | null
          lobby_id: string | null
          status: string | null
          team: number | null
          user_id: string
        }
        Insert: {
          id?: string
          is_ready?: boolean | null
          joined_at?: string | null
          lobby_id?: string | null
          status?: string | null
          team?: number | null
          user_id: string
        }
        Update: {
          id?: string
          is_ready?: boolean | null
          joined_at?: string | null
          lobby_id?: string | null
          status?: string | null
          team?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lobby_players_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobby_players_players_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uuid_link"]
          },
          {
            foreignKeyName: "lobby_players_players_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_discord_sync"
            referencedColumns: ["supabase_id"]
          },
          {
            foreignKeyName: "lobby_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uuid_link"]
          },
          {
            foreignKeyName: "lobby_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_discord_sync"
            referencedColumns: ["supabase_id"]
          },
        ]
      }
      match_players: {
        Row: {
          id: string
          match_id: string | null
          stats: Json | null
          team: number
          user_id: string | null
        }
        Insert: {
          id?: string
          match_id?: string | null
          stats?: Json | null
          team: number
          user_id?: string | null
        }
        Update: {
          id?: string
          match_id?: string | null
          stats?: Json | null
          team?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "admin_match_review"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uuid_link"]
          },
          {
            foreignKeyName: "match_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_discord_sync"
            referencedColumns: ["supabase_id"]
          },
        ]
      }
      match_reports: {
        Row: {
          created_at: string | null
          id: string
          match_id: string | null
          reporter_id: string | null
          result_data: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          reporter_id?: string | null
          result_data?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          reporter_id?: string | null
          result_data?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_reports_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "admin_match_review"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_reports_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uuid_link"]
          },
          {
            foreignKeyName: "match_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "v_discord_sync"
            referencedColumns: ["supabase_id"]
          },
        ]
      }
      matches: {
        Row: {
          creator_id: string | null
          finished_at: string | null
          game_mode_id: string
          guild_id: string | null
          id: string
          metadata: Json | null
          mvp_user_id: string | null
          region: string | null
          started_at: string | null
          status: string | null
          winner_team: number | null
        }
        Insert: {
          creator_id?: string | null
          finished_at?: string | null
          game_mode_id: string
          guild_id?: string | null
          id?: string
          metadata?: Json | null
          mvp_user_id?: string | null
          region?: string | null
          started_at?: string | null
          status?: string | null
          winner_team?: number | null
        }
        Update: {
          creator_id?: string | null
          finished_at?: string | null
          game_mode_id?: string
          guild_id?: string | null
          id?: string
          metadata?: Json | null
          mvp_user_id?: string | null
          region?: string | null
          started_at?: string | null
          status?: string | null
          winner_team?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_game_mode"
            columns: ["game_mode_id"]
            isOneToOne: false
            referencedRelation: "game_modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uuid_link"]
          },
          {
            foreignKeyName: "matches_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "v_discord_sync"
            referencedColumns: ["supabase_id"]
          },
          {
            foreignKeyName: "matches_game_mode_id_fkey"
            columns: ["game_mode_id"]
            isOneToOne: false
            referencedRelation: "game_modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["guild_id"]
          },
          {
            foreignKeyName: "matches_mvp_user_id_fkey"
            columns: ["mvp_user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uuid_link"]
          },
          {
            foreignKeyName: "matches_mvp_user_id_fkey"
            columns: ["mvp_user_id"]
            isOneToOne: false
            referencedRelation: "v_discord_sync"
            referencedColumns: ["supabase_id"]
          },
        ]
      }
      mmr_history: {
        Row: {
          change: number | null
          created_at: string | null
          id: string
          match_id: string | null
          new_mmr: number | null
          old_mmr: number | null
          player_uuid: string | null
        }
        Insert: {
          change?: number | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          new_mmr?: number | null
          old_mmr?: number | null
          player_uuid?: string | null
        }
        Update: {
          change?: number | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          new_mmr?: number | null
          old_mmr?: number | null
          player_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mmr_history_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "admin_match_review"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "mmr_history_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mmr_history_player_uuid_fkey"
            columns: ["player_uuid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uuid_link"]
          },
          {
            foreignKeyName: "mmr_history_player_uuid_fkey"
            columns: ["player_uuid"]
            isOneToOne: false
            referencedRelation: "v_discord_sync"
            referencedColumns: ["supabase_id"]
          },
        ]
      }
      players: {
        Row: {
          avatar_url: string | null
          mmr: number | null
          user_id: string
          username: string | null
          uuid_link: string | null
        }
        Insert: {
          avatar_url?: string | null
          mmr?: number | null
          user_id: string
          username?: string | null
          uuid_link?: string | null
        }
        Update: {
          avatar_url?: string | null
          mmr?: number | null
          user_id?: string
          username?: string | null
          uuid_link?: string | null
        }
        Relationships: []
      }
      queues: {
        Row: {
          game_mode_id: string | null
          id: string
          joined_at: string | null
          user_id: string | null
        }
        Insert: {
          game_mode_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Update: {
          game_mode_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queues_game_mode_id_fkey"
            columns: ["game_mode_id"]
            isOneToOne: false
            referencedRelation: "game_modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uuid_link"]
          },
          {
            foreignKeyName: "queues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_discord_sync"
            referencedColumns: ["supabase_id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          details: string | null
          guild_id: string
          id: string
          reason: string
          reported_id: string | null
          reporter_id: string | null
          status: Database["public"]["Enums"]["report_status"] | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          guild_id: string
          id?: string
          reason: string
          reported_id?: string | null
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          guild_id?: string
          id?: string
          reason?: string
          reported_id?: string | null
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "v_discord_sync"
            referencedColumns: ["discord_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "v_discord_sync"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      ttfa_config: {
        Row: {
          key: string
          value: string | null
        }
        Insert: {
          key: string
          value?: string | null
        }
        Update: {
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      ttfa_player_stats: {
        Row: {
          challenges_lost: number | null
          challenges_won: number | null
          current_streak: number | null
          fifa_gg_id: string | null
          immunity_expires_at: string | null
          medal_1: boolean | null
          medal_2: boolean | null
          medal_3: boolean | null
          medal_4: boolean | null
          user_id: string
        }
        Insert: {
          challenges_lost?: number | null
          challenges_won?: number | null
          current_streak?: number | null
          fifa_gg_id?: string | null
          immunity_expires_at?: string | null
          medal_1?: boolean | null
          medal_2?: boolean | null
          medal_3?: boolean | null
          medal_4?: boolean | null
          user_id: string
        }
        Update: {
          challenges_lost?: number | null
          challenges_won?: number | null
          current_streak?: number | null
          fifa_gg_id?: string | null
          immunity_expires_at?: string | null
          medal_1?: boolean | null
          medal_2?: boolean | null
          medal_3?: boolean | null
          medal_4?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ttfa_player_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ttfa_player_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_discord_sync"
            referencedColumns: ["discord_id"]
          },
        ]
      }
    }
    Views: {
      admin_match_review: {
        Row: {
          finished_at: string | null
          game_mode_id: string | null
          game_mode_name: string | null
          guild_id: string | null
          match_id: string | null
          reporter_name: string | null
          status: string | null
          winner_team: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_game_mode"
            columns: ["game_mode_id"]
            isOneToOne: false
            referencedRelation: "game_modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_game_mode_id_fkey"
            columns: ["game_mode_id"]
            isOneToOne: false
            referencedRelation: "game_modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["guild_id"]
          },
        ]
      }
      lobby_stats: {
        Row: {
          lobby_id: string | null
          player_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lobby_players_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lobbies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_discord_sync: {
        Row: {
          discord_id: string | null
          supabase_id: string | null
        }
        Insert: {
          discord_id?: string | null
          supabase_id?: string | null
        }
        Update: {
          discord_id?: string | null
          supabase_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_all_server_matches: {
        Args: { target_guild_id: string }
        Returns: Json
      }
      approve_match: { Args: { match_id_input: string }; Returns: Json }
      get_column_names: {
        Args: { table_name: string }
        Returns: {
          column_name: string
        }[]
      }
      purge_old_nexus_data: { Args: never; Returns: undefined }
      submit_match_report: {
        Args: {
          match_id_input: string
          my_score_input: number
          opponent_score_input: number
          reporter_id_input: string
        }
        Returns: Json
      }
    }
    Enums: {
      report_status: "PENDING" | "RESOLVED" | "DISMISSED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      report_status: ["PENDING", "RESOLVED", "DISMISSED"],
    },
  },
} as const
