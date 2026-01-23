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
          created_at: string | null
          game_id: string | null
          guild_id: string | null
          id: string
          is_active: boolean | null
          name: string
          picking_method: string
          team_size: number
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          guild_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          picking_method?: string
          team_size?: number
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          guild_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          picking_method?: string
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
          created_at: string | null
          icon_url: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
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
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          guild_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          guild_id?: string
          reason?: string | null
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
      lobbies: {
        Row: {
          created_at: string | null
          creator_id: string
          game_id: string | null
          game_mode_id: string | null
          guild_id: string | null
          id: string
          is_private: boolean | null
          match_id: string | null
          region: string | null
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
          match_id?: string | null
          region?: string | null
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
          match_id?: string | null
          region?: string | null
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
        ]
      }
      lobby_players: {
        Row: {
          created_at: string | null
          id: string
          is_ready: boolean | null
          lobby_id: string | null
          status: string | null
          team: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_ready?: boolean | null
          lobby_id?: string | null
          status?: string | null
          team?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_ready?: boolean | null
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
          created_at: string | null
          id: string
          match_id: string | null
          stats: Json | null
          team: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          stats?: Json | null
          team: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
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
          result_data: Json
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          reporter_id?: string | null
          result_data: Json
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          reporter_id?: string | null
          result_data?: Json
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
          metadata: Json | null
          region: string | null
          started_at: string | null
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
          metadata?: Json | null
          region?: string | null
          started_at?: string | null
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
          metadata?: Json | null
          region?: string | null
          started_at?: string | null
          status?: string | null
          winner_team?: number | null
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
      mmr_history: {
        Row: {
          change: number
          created_at: string | null
          game_id: string | null
          id: string
          match_id: string | null
          new_mmr: number
          old_mmr: number
          player_id: string | null
        }
        Insert: {
          change: number
          created_at?: string | null
          game_id?: string | null
          id?: string
          match_id?: string | null
          new_mmr: number
          old_mmr: number
          player_id?: string | null
        }
        Update: {
          change?: number
          created_at?: string | null
          game_id?: string | null
          id?: string
          match_id?: string | null
          new_mmr?: number
          old_mmr?: number
          player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mmr_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "mmr_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["user_id"]
          },
        ]
      }
      player_mmr: {
        Row: {
          game_id: string
          losses: number | null
          mmr: number | null
          updated_at: string | null
          user_id: string
          wins: number | null
        }
        Insert: {
          game_id: string
          losses?: number | null
          mmr?: number | null
          updated_at?: string | null
          user_id: string
          wins?: number | null
        }
        Update: {
          game_id?: string
          losses?: number | null
          mmr?: number | null
          updated_at?: string | null
          user_id?: string
          wins?: number | null
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
          avatar_url: string | null
          created_at: string | null
          is_banned: boolean | null
          user_id: string
          username: string | null
          uuid_link: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          is_banned?: boolean | null
          user_id: string
          username?: string | null
          uuid_link?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          is_banned?: boolean | null
          user_id?: string
          username?: string | null
          uuid_link?: string | null
        }
        Relationships: []
      }
      queues: {
        Row: {
          game_mode_id: string | null
          guild_id: string | null
          id: string
          joined_at: string | null
          user_id: string | null
        }
        Insert: {
          game_mode_id?: string | null
          guild_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Update: {
          game_mode_id?: string | null
          guild_id?: string | null
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
            foreignKeyName: "queues_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["guild_id"]
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
          guild_id: string
          id: string
          reason: string
          reported_id: string | null
          reporter_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          guild_id: string
          id?: string
          reason: string
          reported_id?: string | null
          reporter_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          guild_id?: string
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
      server_members: {
        Row: {
          created_at: string | null
          guild_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          guild_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          guild_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_members_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["guild_id"]
          },
          {
            foreignKeyName: "server_members_user_id_fkey"
            columns: ["user_id"]
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
          game_mode_name: string | null
          guild_id: string | null
          guild_name: string | null
          match_id: string | null
          reporter_name: string | null
          started_at: string | null
          status: string | null
          winner_team: number | null
        }
        Relationships: [
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
      approve_all_server_matches: {
        Args: { p_target_guild_id: string }
        Returns: Json
      }
      approve_match: { Args: { p_match_id: string }; Returns: undefined }
      cancel_match: { Args: { p_match_id: string }; Returns: undefined }
      reject_match: { Args: { p_match_id: string }; Returns: undefined }
      get_matches_for_review: {
        Args: {
          target_guild_id: string
        }
        Returns: {
          match_id: string
          status: string
          guild_id: string
          game_mode_name: string | null
          reporter_name: string | null
          winner_team: number | null
          finished_at: string | null
          started_at: string | null
        }[]
      }
      submit_match_report: {
        Args: {
          p_match_id: string
          p_my_score: number
          p_opponent_score: number
          p_reporter_id: string
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
    Enums: {},
  },
} as const
