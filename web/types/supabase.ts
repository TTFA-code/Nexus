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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
            foreignKeyName: "fk_lobby_players_lobby"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lobbies"
            referencedColumns: ["id"]
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
            foreignKeyName: "fk_match_players_match"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
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
        Relationships: []
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
        Relationships: []
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
            foreignKeyName: "fk_mmr_history_match"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_mmr_history_player"
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
          mmr: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          game_id: string
          mmr: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          game_id?: string
          mmr?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          avatar_url: string | null
          is_banned: boolean | null
          mmr: number | null
          user_id: string
          username: string | null
          uuid_link: string | null
        }
        Insert: {
          avatar_url?: string | null
          is_banned?: boolean | null
          mmr?: number | null
          user_id: string
          username?: string | null
          uuid_link?: string | null
        }
        Update: {
          avatar_url?: string | null
          is_banned?: boolean | null
          mmr?: number | null
          user_id?: string
          username?: string | null
          uuid_link?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
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
        Relationships: []
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
          status: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          guild_id: string
          id?: string
          reason: string
          reported_id?: string | null
          reporter_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          guild_id?: string
          id?: string
          reason?: string
          reported_id?: string | null
          reporter_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      server_members: {
        Row: {
          guild_id: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          guild_id: string
          id?: string
          joined_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          guild_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_all_server_matches: {
        Args: { target_guild_id: string }
        Returns: undefined
      }
      approve_match: { Args: { match_id_input: string }; Returns: undefined }
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
