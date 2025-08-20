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
      app_screenshots: {
        Row: {
          captured_at: string
          category: string
          created_at: string
          description: string | null
          device_type: string
          id: string
          image_url: string
          is_active: boolean
          route: string
          section: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          captured_at?: string
          category: string
          created_at?: string
          description?: string | null
          device_type: string
          id?: string
          image_url: string
          is_active?: boolean
          route: string
          section: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          captured_at?: string
          category?: string
          created_at?: string
          description?: string | null
          device_type?: string
          id?: string
          image_url?: string
          is_active?: boolean
          route?: string
          section?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointment_proposals: {
        Row: {
          appointment_type_id: string
          chat_session_id: string | null
          created_at: string
          description: string | null
          duration: number
          expires_at: string
          frequency: string
          id: string
          occurrences: number
          proposed_at: string
          responded_at: string | null
          specialist_id: string
          start_date: string
          start_time: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_type_id: string
          chat_session_id?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          expires_at?: string
          frequency: string
          id?: string
          occurrences?: number
          proposed_at?: string
          responded_at?: string | null
          specialist_id: string
          start_date: string
          start_time: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_type_id?: string
          chat_session_id?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          expires_at?: string
          frequency?: string
          id?: string
          occurrences?: number
          proposed_at?: string
          responded_at?: string | null
          specialist_id?: string
          start_date?: string
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_proposals_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_proposals_chat_session_id_fkey"
            columns: ["chat_session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_proposals_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "peer_specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_types: {
        Row: {
          color: string | null
          created_at: string
          default_duration: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          default_duration?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          default_duration?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
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
          end_reason: string | null
          ended_at: string | null
          id: string
          last_activity: string | null
          session_number: number
          specialist_id: string | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          last_activity?: string | null
          session_number?: number
          specialist_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          last_activity?: string | null
          session_number?: number
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
      manual_change_tracking: {
        Row: {
          affected_sections: string[] | null
          auto_updated: boolean | null
          change_description: string | null
          change_type: string
          created_at: string | null
          file_path: string
          id: string
          requires_review: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          affected_sections?: string[] | null
          auto_updated?: boolean | null
          change_description?: string | null
          change_type: string
          created_at?: string | null
          file_path: string
          id?: string
          requires_review?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          affected_sections?: string[] | null
          auto_updated?: boolean | null
          change_description?: string | null
          change_type?: string
          created_at?: string | null
          file_path?: string
          id?: string
          requires_review?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: []
      }
      manual_content: {
        Row: {
          content: string
          content_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          order_index: number
          section_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          content_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_index: number
          section_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number
          section_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_content_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "manual_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_sections: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          order_index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_index: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          notification_type: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          notification_type?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          notification_type?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      peer_checkins: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          peer_id: string
          scheduled_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          peer_id: string
          scheduled_at: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          peer_id?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_checkins_peer_id_fkey"
            columns: ["peer_id"]
            isOneToOne: false
            referencedRelation: "peer_specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_monthly_metrics: {
        Row: {
          avg_response_time_seconds: number | null
          avg_streak_impact: number | null
          avg_user_rating: number | null
          chat_completion_rate: number | null
          checkin_completion_rate: number | null
          created_at: string
          id: string
          month: string
          peer_id: string
          updated_at: string
        }
        Insert: {
          avg_response_time_seconds?: number | null
          avg_streak_impact?: number | null
          avg_user_rating?: number | null
          chat_completion_rate?: number | null
          checkin_completion_rate?: number | null
          created_at?: string
          id?: string
          month: string
          peer_id: string
          updated_at?: string
        }
        Update: {
          avg_response_time_seconds?: number | null
          avg_streak_impact?: number | null
          avg_user_rating?: number | null
          chat_completion_rate?: number | null
          checkin_completion_rate?: number | null
          created_at?: string
          id?: string
          month?: string
          peer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_monthly_metrics_peer_id_fkey"
            columns: ["peer_id"]
            isOneToOne: false
            referencedRelation: "peer_specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_performance_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          peer_id: string | null
          session_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          peer_id?: string | null
          session_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          peer_id?: string | null
          session_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peer_performance_events_peer_id_fkey"
            columns: ["peer_id"]
            isOneToOne: false
            referencedRelation: "peer_specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_performance_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_session_ratings: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          peer_id: string
          rating: number
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          peer_id: string
          rating: number
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          peer_id?: string
          rating?: number
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_session_ratings_peer_id_fkey"
            columns: ["peer_id"]
            isOneToOne: false
            referencedRelation: "peer_specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_session_ratings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_specialists: {
        Row: {
          activated_at: string | null
          activation_method: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
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
          manually_activated_by: string | null
          must_change_password: boolean | null
          phone_number: string | null
          specialties: string[] | null
          temporary_password_hash: string | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          activated_at?: string | null
          activation_method?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
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
          manually_activated_by?: string | null
          must_change_password?: boolean | null
          phone_number?: string | null
          specialties?: string[] | null
          temporary_password_hash?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          activated_at?: string | null
          activation_method?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
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
          manually_activated_by?: string | null
          must_change_password?: boolean | null
          phone_number?: string | null
          specialties?: string[] | null
          temporary_password_hash?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      phone_call_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          initiated_at: string | null
          metadata: Json | null
          request_token: string
          responded_at: string | null
          session_id: string
          specialist_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          initiated_at?: string | null
          metadata?: Json | null
          request_token?: string
          responded_at?: string | null
          session_id: string
          specialist_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          initiated_at?: string | null
          metadata?: Json | null
          request_token?: string
          responded_at?: string | null
          session_id?: string
          specialist_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_call_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_call_requests_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "peer_specialists"
            referencedColumns: ["id"]
          },
        ]
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
          user_type: Database["public"]["Enums"]["user_type"] | null
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
          user_type?: Database["public"]["Enums"]["user_type"] | null
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
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_appointments: {
        Row: {
          appointment_type_id: string
          created_at: string
          id: string
          meeting_type: string
          meeting_url: string | null
          notes: string | null
          proposal_id: string
          reminder_sent: boolean | null
          scheduled_end: string
          scheduled_start: string
          specialist_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_type_id: string
          created_at?: string
          id?: string
          meeting_type?: string
          meeting_url?: string | null
          notes?: string | null
          proposal_id: string
          reminder_sent?: boolean | null
          scheduled_end: string
          scheduled_start: string
          specialist_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_type_id?: string
          created_at?: string
          id?: string
          meeting_type?: string
          meeting_url?: string | null
          notes?: string | null
          proposal_id?: string
          reminder_sent?: boolean | null
          scheduled_end?: string
          scheduled_start?: string
          specialist_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_appointments_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_appointments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "appointment_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "peer_specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_appointments: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          appointment_type_id: string
          cancellation_reason: string | null
          created_at: string
          id: string
          location: string | null
          meeting_type: string
          meeting_url: string | null
          notes: string | null
          reminder_sent: boolean | null
          scheduled_appointment_id: string | null
          scheduled_end: string
          scheduled_start: string
          specialist_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          appointment_type_id: string
          cancellation_reason?: string | null
          created_at?: string
          id?: string
          location?: string | null
          meeting_type?: string
          meeting_url?: string | null
          notes?: string | null
          reminder_sent?: boolean | null
          scheduled_appointment_id?: string | null
          scheduled_end: string
          scheduled_start: string
          specialist_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          appointment_type_id?: string
          cancellation_reason?: string | null
          created_at?: string
          id?: string
          location?: string | null
          meeting_type?: string
          meeting_url?: string | null
          notes?: string | null
          reminder_sent?: boolean | null
          scheduled_appointment_id?: string | null
          scheduled_end?: string
          scheduled_start?: string
          specialist_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_appointments_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_appointments_scheduled_appointment_id_fkey"
            columns: ["scheduled_appointment_id"]
            isOneToOne: false
            referencedRelation: "scheduled_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "peer_specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_availability_exceptions: {
        Row: {
          created_at: string
          end_time: string
          exception_type: string
          id: string
          is_recurring: boolean | null
          reason: string | null
          recurrence_pattern: Json | null
          specialist_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          exception_type?: string
          id?: string
          is_recurring?: boolean | null
          reason?: string | null
          recurrence_pattern?: Json | null
          specialist_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          exception_type?: string
          id?: string
          is_recurring?: boolean | null
          reason?: string | null
          recurrence_pattern?: Json | null
          specialist_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_availability_exceptions_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "peer_specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_calendar_settings: {
        Row: {
          allow_back_to_back_bookings: boolean
          auto_confirm_bookings: boolean
          buffer_time_minutes: number
          created_at: string
          default_appointment_duration: number
          external_calendar_sync: Json | null
          id: string
          maximum_booking_days: number
          minimum_notice_hours: number
          notification_preferences: Json
          specialist_id: string
          timezone: string
          updated_at: string
          working_hours: Json
        }
        Insert: {
          allow_back_to_back_bookings?: boolean
          auto_confirm_bookings?: boolean
          buffer_time_minutes?: number
          created_at?: string
          default_appointment_duration?: number
          external_calendar_sync?: Json | null
          id?: string
          maximum_booking_days?: number
          minimum_notice_hours?: number
          notification_preferences?: Json
          specialist_id: string
          timezone?: string
          updated_at?: string
          working_hours?: Json
        }
        Update: {
          allow_back_to_back_bookings?: boolean
          auto_confirm_bookings?: boolean
          buffer_time_minutes?: number
          created_at?: string
          default_appointment_duration?: number
          external_calendar_sync?: Json | null
          id?: string
          maximum_booking_days?: number
          minimum_notice_hours?: number
          notification_preferences?: Json
          specialist_id?: string
          timezone?: string
          updated_at?: string
          working_hours?: Json
        }
        Relationships: [
          {
            foreignKeyName: "specialist_calendar_settings_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: true
            referencedRelation: "peer_specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_content_usage: {
        Row: {
          chat_session_id: string | null
          content_category: string
          content_id: string
          content_type: string
          context_metadata: Json | null
          created_at: string
          id: string
          shared_at: string
          specialist_id: string
          user_id: string
        }
        Insert: {
          chat_session_id?: string | null
          content_category: string
          content_id: string
          content_type: string
          context_metadata?: Json | null
          created_at?: string
          id?: string
          shared_at?: string
          specialist_id: string
          user_id: string
        }
        Update: {
          chat_session_id?: string | null
          content_category?: string
          content_id?: string
          content_type?: string
          context_metadata?: Json | null
          created_at?: string
          id?: string
          shared_at?: string
          specialist_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_content_usage_chat_session_id_fkey"
            columns: ["chat_session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_content_usage_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "foreman_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_content_usage_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "peer_specialists"
            referencedColumns: ["id"]
          },
        ]
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
      specialist_module_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          module_id: string
          score: number | null
          specialist_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          module_id: string
          score?: number | null
          specialist_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          module_id?: string
          score?: number | null
          specialist_id?: string
          updated_at?: string
        }
        Relationships: []
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
          appointment_type_id: string | null
          buffer_time_minutes: number | null
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          max_bookings_per_slot: number | null
          recurrence_pattern: Json | null
          specialist_id: string
          start_time: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          appointment_type_id?: string | null
          buffer_time_minutes?: number | null
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          max_bookings_per_slot?: number | null
          recurrence_pattern?: Json | null
          specialist_id: string
          start_time: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          appointment_type_id?: string | null
          buffer_time_minutes?: number | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          max_bookings_per_slot?: number | null
          recurrence_pattern?: Json | null
          specialist_id?: string
          start_time?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_schedules_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
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
      training_progress: {
        Row: {
          attempt_number: number
          completed_at: string | null
          created_at: string
          feedback: Json | null
          id: string
          scenario_id: string
          score: number | null
          specialist_id: string
          started_at: string | null
          status: string
          time_spent_minutes: number | null
          updated_at: string
        }
        Insert: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          scenario_id: string
          score?: number | null
          specialist_id: string
          started_at?: string | null
          status?: string
          time_spent_minutes?: number | null
          updated_at?: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          scenario_id?: string
          score?: number | null
          specialist_id?: string
          started_at?: string | null
          status?: string
          time_spent_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_progress_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "training_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      training_scenarios: {
        Row: {
          category: string
          created_at: string
          description: string
          difficulty_level: number
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean
          learning_objectives: string[] | null
          prerequisites: string[] | null
          scenario_data: Json
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          difficulty_level?: number
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          learning_objectives?: string[] | null
          prerequisites?: string[] | null
          scenario_data?: Json
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          difficulty_level?: number
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          learning_objectives?: string[] | null
          prerequisites?: string[] | null
          scenario_data?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_session_logs: {
        Row: {
          action_data: Json
          action_type: string
          id: string
          progress_id: string
          timestamp: string
        }
        Insert: {
          action_data?: Json
          action_type: string
          id?: string
          progress_id: string
          timestamp?: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          id?: string
          progress_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_session_logs_progress_id_fkey"
            columns: ["progress_id"]
            isOneToOne: false
            referencedRelation: "training_progress"
            referencedColumns: ["id"]
          },
        ]
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
          completed_days: number[] | null
          completion_dates: Json | null
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
          completed_days?: number[] | null
          completion_dates?: Json | null
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
          completed_days?: number[] | null
          completion_dates?: Json | null
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
      user_login_history: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          location_data: Json | null
          login_status: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: unknown
          location_data?: Json | null
          login_status?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          location_data?: Json | null
          login_status?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          gender: string | null
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
          gender?: string | null
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
          gender?: string | null
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
      check_message_duplicate: {
        Args: {
          p_content: string
          p_sender_id: string
          p_session_id: string
          p_time_window_seconds?: number
        }
        Returns: boolean
      }
      check_specialist_availability: {
        Args: {
          p_end_time: string
          p_specialist_id: string
          p_start_time: string
        }
        Returns: boolean
      }
      claim_chat_session: {
        Args: { p_session_id: string; p_specialist_user_id: string }
        Returns: Json
      }
      debug_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      end_chat_session: {
        Args: {
          p_session_id: string
          p_specialist_id: string
          p_user_id: string
        }
        Returns: Json
      }
      end_chat_session_atomic: {
        Args: { p_end_reason?: string; p_session_id: string; p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["chat_operation_result"]
      }
      find_user_by_email: {
        Args: { user_email: string }
        Returns: {
          created_at: string
          email: string
          is_admin: boolean
          user_id: string
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
          created_at: string
          email: string
          role_created_at: string
          user_id: string
        }[]
      }
      get_session_with_messages: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: Json
      }
      get_specialist_training_summary: {
        Args: { p_specialist_id: string }
        Returns: Json
      }
      get_users_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          id: string
        }[]
      }
      is_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      log_login_attempt: {
        Args: {
          p_ip_address: unknown
          p_location_data?: Json
          p_login_status?: string
          p_user_agent: string
          p_user_id: string
        }
        Returns: string
      }
      permanently_delete_specialist: {
        Args:
          | { admin_user_id: string; specialist_id: string }
          | { specialist_id: string }
        Returns: Json
      }
      remove_admin_role: {
        Args: { target_user_id: string }
        Returns: Json
      }
      request_admin_password_reset: {
        Args: { target_email: string }
        Returns: Json
      }
      send_message_atomic: {
        Args: {
          p_content: string
          p_message_type?: string
          p_metadata?: Json
          p_sender_id: string
          p_sender_type: string
          p_session_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["chat_operation_result"]
      }
      set_user_type: {
        Args: { target_user_id: string }
        Returns: Database["public"]["Enums"]["user_type"]
      }
      soft_delete_specialist: {
        Args: { specialist_id: string }
        Returns: Json
      }
      start_chat_session_atomic: {
        Args: { p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["chat_operation_result"]
      }
      sync_working_hours_to_schedules: {
        Args: { p_specialist_id: string; p_working_hours: Json }
        Returns: undefined
      }
      update_specialist_status_from_calendar_schedule: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      user_type: "admin" | "specialist" | "peer_client"
    }
    CompositeTypes: {
      chat_operation_result: {
        success: boolean | null
        error_code: string | null
        error_message: string | null
        data: Json | null
      }
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
      user_type: ["admin", "specialist", "peer_client"],
    },
  },
} as const
