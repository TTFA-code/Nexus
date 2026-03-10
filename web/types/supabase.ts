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
          team_size: number | null
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          guild_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          team_size?: number | null
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          guild_id?: string | null
          id?: string
          is_active?: boolean | null
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
          lobby_id: string
          status: string | null
          team: number | null
          user_id: string
        }
        Insert: {
          id?: string
          is_ready?: boolean | null
          joined_at?: string | null
          lobby_id: string
          status?: string | null
          team?: number | null
          user_id: string
        }
        Update: {
          id?: string
          is_ready?: boolean | null
          joined_at?: string | null
          lobby_id?: string
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
          id: string
          match_id: string
          rematch_status: string | null
          stats: Json | null
          team: number
          user_id: string
        }
        Insert: {
          id?: string
          match_id: string
          rematch_status?: string | null
          stats?: Json | null
          team: number
          user_id: string
        }
        Update: {
          id?: string
          match_id?: string
          rematch_status?: string | null
          stats?: Json | null
          team?: number
          user_id?: string
        }
        Relationships: [
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
          creator_id: string | null
          finished_at: string | null
          game_mode_id: string | null
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
          game_mode_id?: string | null
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
          game_mode_id?: string | null
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
          {
            foreignKeyName: "matches_mvp_user_id_fkey"
            columns: ["mvp_user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["user_id"]
          },
        ]
      }
      matchmaking_queue: {
        Row: {
          discord_id: string
          game_mode_id: string | null
          joined_at: string | null
          mmr: number | null
          user_id: string
        }
        Insert: {
          discord_id: string
          game_mode_id?: string | null
          joined_at?: string | null
          mmr?: number | null
          user_id: string
        }
        Update: {
          discord_id?: string
          game_mode_id?: string | null
          joined_at?: string | null
          mmr?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchmaking_queue_game_mode_id_fkey"
            columns: ["game_mode_id"]
            isOneToOne: false
            referencedRelation: "game_modes"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          lobby_id: string | null
          match_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          lobby_id?: string | null
          match_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          lobby_id?: string | null
          match_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["user_id"]
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
          player_uuid: string
        }
        Insert: {
          change?: number | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          new_mmr?: number | null
          old_mmr?: number | null
          player_uuid: string
        }
        Update: {
          change?: number | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          new_mmr?: number | null
          old_mmr?: number | null
          player_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "mmr_history_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
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
        ]
      }
      players: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          is_banned: boolean | null
          mmr: number | null
          updated_at: string | null
          user_id: string
          username: string | null
          uuid_link: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          is_banned?: boolean | null
          mmr?: number | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          uuid_link?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          is_banned?: boolean | null
          mmr?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          uuid_link?: string | null
        }
        Relationships: []
      }
      queues: {
        Row: {
          game_mode_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          game_mode_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          game_mode_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
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
      ready_checks: {
        Row: {
          accepted: boolean | null
          created_at: string | null
          id: string
          lobby_id: string | null
          match_id: string | null
          responded_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string | null
          id?: string
          lobby_id?: string | null
          match_id?: string | null
          responded_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          accepted?: boolean | null
          created_at?: string | null
          id?: string
          lobby_id?: string | null
          match_id?: string | null
          responded_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ready_checks_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ready_checks_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ready_checks_user_id_fkey"
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
      server_members: {
        Row: {
          created_at: string | null
          guild_id: string
          id: string
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          guild_id: string
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          guild_id?: string
          id?: string
          role?: string | null
          updated_at?: string | null
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
      [_ in never]: never
    }
    Functions: {
      admin_resolve_match: {
        Args: {
          admin_id_input: string
          force_t1_score: number
          force_t2_score: number
          match_id_input: string
        }
        Returns: Json
      }
      approve_all_server_matches: {
        Args: { p_target_guild_id: string }
        Returns: Json
      }
      approve_match: { Args: { p_match_id: string }; Returns: undefined }
      cancel_match: { Args: { p_match_id: string }; Returns: undefined }
      check_active_session: { Args: { p_user_id: string }; Returns: boolean }
      decline_match: { Args: { p_match_id: string }; Returns: Json }
      find_match: { Args: never; Returns: number }
      get_guild_member_matches: {
        Args: { p_guild_id: string }
        Returns: {
          created_at: string
          finished_at: string
          game_icon: string
          game_name: string
          id: string
          mode_name: string
          player_avatar: string
          player_username: string
          status: string
          winner_team: number
        }[]
      }
      is_chat_participant: {
        Args: { _lobby_id: string; _match_id: string; _user_uuid: string }
        Returns: boolean
      }
      join_queue: {
        Args: { p_discord_id: string; p_game_mode_id: string }
        Returns: Json
      }
      leave_queue: { Args: never; Returns: Json }
      reject_match: { Args: { p_match_id: string }; Returns: undefined }
      submit_match_report: {
        Args: {
          match_id_input: string
          my_score_input: number
          opponent_score_input: number
          reporter_discord_id_input: string
        }
        Returns: Json
      }
      timeout_queue_player: { Args: { p_user_id: string }; Returns: undefined }
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
