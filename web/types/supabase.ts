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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      game_modes: {
        Row: {
          game_id: string | null
          guild_id: string | null
          id: string
          name: string
          team_size: number | null
        }
        Insert: {
          game_id?: string | null
          guild_id?: string | null
          id?: string
          name: string
          team_size?: number | null
        }
        Update: {
          game_id?: string | null
          guild_id?: string | null
          id?: string
          name?: string
          team_size?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_modes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_modes_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["guild_id"]
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
            referencedRelation: "guilds"
            referencedColumns: ["guild_id"]
          },
          {
            foreignKeyName: "guild_bans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["user_id"]
          },
        ]
      }
      guilds: {
        Row: {
          created_at: string | null
          guild_id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          guild_id: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          guild_id?: string
          name?: string | null
        }
        Relationships: []
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
            referencedRelation: "guilds"
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
          user_id: string | null
        }
        Insert: {
          id?: string
          is_ready?: boolean | null
          joined_at?: string | null
          lobby_id?: string | null
          status?: string | null
          team?: number | null
          user_id?: string | null
        }
        Update: {
          id?: string
          is_ready?: boolean | null
          joined_at?: string | null
          lobby_id?: string | null
          status?: string | null
          team?: number | null
          user_id?: string | null
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
            foreignKeyName: "lobby_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["user_id"]
          },
        ]
      }
      match_players: {
        Row: {
          match_id: string
          team: number | null
          user_id: string
        }
        Insert: {
          match_id: string
          team?: number | null
          user_id: string
        }
        Update: {
          match_id?: string
          team?: number | null
          user_id?: string
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
            referencedColumns: ["user_id"]
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
            referencedColumns: ["user_id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          creator_id: string | null
          finished_at: string | null
          game_mode_id: string | null
          guild_id: string | null
          id: string
          status: string | null
          winner_team: number | null
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          finished_at?: string | null
          game_mode_id?: string | null
          guild_id?: string | null
          id?: string
          status?: string | null
          winner_team?: number | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          finished_at?: string | null
          game_mode_id?: string | null
          guild_id?: string | null
          id?: string
          status?: string | null
          winner_team?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["user_id"]
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
            referencedRelation: "guilds"
            referencedColumns: ["guild_id"]
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
            referencedColumns: ["user_id"]
          },
        ]
      }
      player_mmr: {
        Row: {
          game_id: string
          mmr: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          game_id: string
          mmr?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          game_id?: string
          mmr?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_mmr_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_mmr_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["user_id"]
          },
        ]
      }
      players: {
        Row: {
          is_banned: boolean | null
          mmr: number | null
          user_id: string
          username: string | null
        }
        Insert: {
          is_banned?: boolean | null
          mmr?: number | null
          user_id: string
          username?: string | null
        }
        Update: {
          is_banned?: boolean | null
          mmr?: number | null
          user_id?: string
          username?: string | null
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
            referencedColumns: ["user_id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          details: string | null
          guild_id: string | null
          id: string
          reason: string
          reported_id: string | null
          reporter_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          guild_id?: string | null
          id?: string
          reason: string
          reported_id?: string | null
          reporter_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          guild_id?: string | null
          id?: string
          reason?: string
          reported_id?: string | null
          reporter_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["guild_id"]
          },
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["user_id"]
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
            referencedRelation: "guilds"
            referencedColumns: ["guild_id"]
          },
        ]
      }
    }
    Functions: {
      submit_match_report: {
        Args: {
          match_id_input: string
          my_score_input: number
          opponent_score_input: number
          reporter_id_input: string
        }
        Returns: undefined
      }
      update_mmr: { Args: { p_match_id: string }; Returns: undefined }
    }
    Enums: {
      report_status: "PENDING" | "RESOLVED" | "REJECTED"
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
  public: {
    Enums: {
      report_status: ["PENDING", "RESOLVED", "REJECTED"],
    },
  },
} as const
