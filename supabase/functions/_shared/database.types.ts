export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      peer_specialists: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          bio: string | null
          specialties: string[] | null
          years_experience: number | null
          created_at: string
          updated_at: string
          is_verified: boolean
          is_active: boolean
          must_change_password: boolean
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          bio?: string | null
          specialties?: string[] | null
          years_experience?: number | null
          created_at?: string
          updated_at?: string
          is_verified?: boolean
          is_active?: boolean
          must_change_password?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          bio?: string | null
          specialties?: string[] | null
          years_experience?: number | null
          created_at?: string
          updated_at?: string
          is_verified?: boolean
          is_active?: boolean
          must_change_password?: boolean
        }
      }
      user_activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          type: string
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          type: string
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          type?: string
          details?: string | null
          created_at?: string
        }
      }
    }
  }
}