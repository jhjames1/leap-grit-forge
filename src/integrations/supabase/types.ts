export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_generated_journeys: {
        Row: {
          created_at: string
          days: Json
          focus_area: string
          id: string
          is_active: boolean
          journey_name: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          days: Json
          focus_area: string
          id?: string
          is_active?: boolean
          journey_name: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          days?: Json
          focus_area?: string
          id?: string
          is_active?: boolean
          journey_name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      ai_phase_modifiers: {
        Row: {
          created_at: string
          extras: Json | null
          id: string
          is_active: boolean
          journey_stage: string
          pacing: string
          phase_name: string
          tone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          extras?: Json | null
          id?: string
          is_active?: boolean
          journey_stage: string
          pacing: string
          phase_name: string
          tone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          extras?: Json | null
          id?: string
          is_active?: boolean
          journey_stage?: string
          pacing?: string
          phase_name?: string
          tone?: string
          updated_at?: string
        }
        Relationships: []
      }
      cbt_game_sessions: {
        Row: {
          coins_earned: number
          completed_at: string
          correct_items: number
          id: string
          pack_id: string
          score: number
          total_items: number
          user_id: string
        }
        Insert: {
          coins_earned?: number
          completed_at?: string
          correct_items?: number
          id?: string
          pack_id: string
          score?: number
          total_items?: number
          user_id: string
        }
        Update: {
          coins_earned?: number
          completed_at?: string
          correct_items?: number
          id?: string
          pack_id?: string
          score?: number
          total_items?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cbt_game_sessions_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "thought_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_game_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_played_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_played_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_played_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string
          metadata: Json | null
          sender_id: string
          sender_type: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string
          metadata?: Json | null
          sender_id: string
          sender_type?: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string
          metadata?: Json | null
          sender_id?: string
          sender_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          specialist_id: string | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          specialist_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          specialist_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "peer_specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      foreman_content: {
        Row: {
          author: string | null
          category: string
          content: string
          content_type: string
          created_at: string
          effectiveness_score: number | null
          id: string
          is_active: boolean
          language: string
          media_url: string | null
          mood_targeting: string[] | null
          priority: number | null
          recovery_stage: string[] | null
          title: string
          trigger_keywords: string[] | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          author?: string | null
          category: string
          content: string
          content_type: string
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          is_active?: boolean
          language?: string
          media_url?: string | null
          mood_targeting?: string[] | null
          priority?: number | null
          recovery_stage?: string[] | null
          title: string
          trigger_keywords?: string[] | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          author?: string | null
          category?: string
          content?: string
          content_type?: string
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          is_active?: boolean
          language?: string
          media_url?: string | null
          mood_targeting?: string[] | null
          priority?: number | null
          recovery_stage?: string[] | null
          title?: string
          trigger_keywords?: string[] | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      peer_specialists: {
        Row: {
          activated_at: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          first_name: string
          id: string
          invitation_expires_at: string | null
          invitation_sent_at: string | null
          invitation_token: string | null
          invited_by_admin_id: string | null
          is_active: boolean | null
          is_invitation_accepted: boolean | null
          is_verified: boolean | null
          last_name: string
          must_change_password: boolean | null
          specialties: string[] | null
          temporary_password_hash: string | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          activated_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_name: string
          id?: string
          invitation_expires_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          invited_by_admin_id?: string | null
          is_active?: boolean | null
          is_invitation_accepted?: boolean | null
          is_verified?: boolean | null
          last_name: string
          must_change_password?: boolean | null
          specialties?: string[] | null
          temporary_password_hash?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          activated_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_name?: string
          id?: string
          invitation_expires_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          invited_by_admin_id?: string | null
          is_active?: boolean | null
          is_invitation_accepted?: boolean | null
          is_verified?: boolean | null
          last_name?: string
          must_change_password?: boolean | null
          specialties?: string[] | null
          temporary_password_hash?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          recovery_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          recovery_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          recovery_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      specialist_content_views: {
        Row: {
          content_id: string
          id: string
          is_favorite: boolean | null
          specialist_id: string
          viewed_at: string
        }
        Insert: {
          content_id: string
          id?: string
          is_favorite?: boolean | null
          specialist_id: string
          viewed_at?: string
        }
        Update: {
          content_id?: string
          id?: string
          is_favorite?: boolean | null
          specialist_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_content_views_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "specialist_motivational_content"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_motivational_content: {
        Row: {
          author: string | null
          category: string
          content: string
          content_type: string
          created_at: string
          id: string
          is_active: boolean
          media_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category: string
          content: string
          content_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          media_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string
          content?: string
          content_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          media_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      specialist_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          specialist_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          specialist_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          specialist_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_schedules_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "peer_specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_status: {
        Row: {
          created_at: string
          id: string
          last_seen: string | null
          presence_data: Json | null
          specialist_id: string
          status: string
          status_message: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen?: string | null
          presence_data?: Json | null
          specialist_id: string
          status?: string
          status_message?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen?: string | null
          presence_data?: Json | null
          specialist_id?: string
          status?: string
          status_message?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_status_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: true
            referencedRelation: "peer_specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      thought_items: {
        Row: {
          category: string | null
          created_at: string
          difficulty: number | null
          id: string
          is_distortion: boolean
          pack_id: string
          text: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          difficulty?: number | null
          id?: string
          is_distortion: boolean
          pack_id: string
          text: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          difficulty?: number | null
          id?: string
          is_distortion?: boolean
          pack_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "thought_items_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "thought_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      thought_packs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          theme: string
          title: string
          unlock_requirement: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          theme?: string
          title: string
          unlock_requirement?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          theme?: string
          title?: string
          unlock_requirement?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          metadata: Json | null
          timestamp: string
          type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          metadata?: Json | null
          timestamp?: string
          type?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          metadata?: Json | null
          timestamp?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_daily_stats: {
        Row: {
          actions_completed: number
          created_at: string
          date: string
          id: string
          journey_activities: string[] | null
          mood_entries: Json | null
          recovery_strength: number | null
          tools_used: string[] | null
          updated_at: string
          user_id: string
          wellness_level: string | null
        }
        Insert: {
          actions_completed?: number
          created_at?: string
          date: string
          id?: string
          journey_activities?: string[] | null
          mood_entries?: Json | null
          recovery_strength?: number | null
          tools_used?: string[] | null
          updated_at?: string
          user_id: string
          wellness_level?: string | null
        }
        Update: {
          actions_completed?: number
          created_at?: string
          date?: string
          id?: string
          journey_activities?: string[] | null
          mood_entries?: Json | null
          recovery_strength?: number | null
          tools_used?: string[] | null
          updated_at?: string
          user_id?: string
          wellness_level?: string | null
        }
        Relationships: []
      }
      user_gratitude_entries: {
        Row: {
          created_at: string
          date: string
          entry_text: string
          id: string
          mood_rating: number | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          entry_text: string
          id?: string
          mood_rating?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          entry_text?: string
          id?: string
          mood_rating?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_journey_assignments: {
        Row: {
          assigned_at: string
          id: string
          is_active: boolean
          journey_id: string
          phase_modifier_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          is_active?: boolean
          journey_id: string
          phase_modifier_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          is_active?: boolean
          journey_id?: string
          phase_modifier_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_journey_assignments_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_journey_assignments_phase_modifier_id_fkey"
            columns: ["phase_modifier_id"]
            isOneToOne: false
            referencedRelation: "ai_phase_modifiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_journey_progress: {
        Row: {
          completed_days: number
          created_at: string
          current_day: number
          daily_stats: Json | null
          focus_areas: string[] | null
          id: string
          journey_responses: Json | null
          journey_stage: string
          support_style: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_days?: number
          created_at?: string
          current_day?: number
          daily_stats?: Json | null
          focus_areas?: string[] | null
          id?: string
          journey_responses?: Json | null
          journey_stage?: string
          support_style?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_days?: number
          created_at?: string
          current_day?: number
          daily_stats?: Json | null
          focus_areas?: string[] | null
          id?: string
          journey_responses?: Json | null
          journey_stage?: string
          support_style?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          language: string
          notifications_enabled: boolean
          phone_number: string | null
          preferences: Json | null
          recovery_start_date: string | null
          sms_opt_in: boolean
          theme: string
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          notifications_enabled?: boolean
          phone_number?: string | null
          preferences?: Json | null
          recovery_start_date?: string | null
          sms_opt_in?: boolean
          theme?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          notifications_enabled?: boolean
          phone_number?: string | null
          preferences?: Json | null
          recovery_start_date?: string | null
          sms_opt_in?: boolean
          theme?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_recovery_plans: {
        Row: {
          generated_at: string
          id: string
          is_current: boolean
          plan_content: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          is_current?: boolean
          plan_content: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          is_current?: boolean
          plan_content?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_toolbox_stats: {
        Row: {
          created_at: string
          favorite_tools: string[] | null
          id: string
          last_activity: string | null
          last_tool_used: string | null
          longest_streak: number
          streak_count: number
          tools_used_today: number
          total_tools_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite_tools?: string[] | null
          id?: string
          last_activity?: string | null
          last_tool_used?: string | null
          longest_streak?: number
          streak_count?: number
          tools_used_today?: number
          total_tools_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorite_tools?: string[] | null
          id?: string
          last_activity?: string | null
          last_tool_used?: string | null
          longest_streak?: number
          streak_count?: number
          tools_used_today?: number
          total_tools_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      week1_universal_data: {
        Row: {
          completed_at: string | null
          core_why: string | null
          created_at: string
          id: string
          identity_words: string[] | null
          reflection: string | null
          safe_space: string | null
          support_triangle: Json | null
          triggers: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          core_why?: string | null
          created_at?: string
          id?: string
          identity_words?: string[] | null
          reflection?: string | null
          safe_space?: string | null
          support_triangle?: Json | null
          triggers?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          core_why?: string | null
          created_at?: string
          id?: string
          identity_words?: string[] | null
          reflection?: string | null
          safe_space?: string | null
          support_triangle?: Json | null
          triggers?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_admin_role: {
        Args: { target_user_id: string }
        Returns: Json
      }
      find_user_by_email: {
        Args: { user_email: string }
        Returns: {
          user_id: string
          email: string
          created_at: string
          is_admin: boolean
        }[]
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_temporary_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          created_at: string
          role_created_at: string
        }[]
      }
      get_users_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          created_at: string
        }[]
      }
      is_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      remove_admin_role: {
        Args: { target_user_id: string }
        Returns: Json
      }
      request_admin_password_reset: {
        Args: { target_email: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
