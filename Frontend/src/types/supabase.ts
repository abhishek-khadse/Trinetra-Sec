export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// This type will be replaced with the actual database types
// once we connect to Supabase and generate the types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          created_at: string
          username: string | null
          avatar_url: string | null
          role: string
          last_login: string | null
        }
        Insert: {
          id: string
          created_at?: string
          username?: string | null
          avatar_url?: string | null
          role?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          username?: string | null
          avatar_url?: string | null
          role?: string
          last_login?: string | null
        }
      }
      file_scans: {
        Row: {
          id: string
          created_at: string
          user_id: string
          file_name: string
          file_size: number
          file_hash: string
          scan_status: 'pending' | 'scanning' | 'completed' | 'failed'
          result_summary: string | null
          threat_level: 'none' | 'low' | 'medium' | 'high' | 'critical' | null
          detection_count: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          file_name: string
          file_size: number
          file_hash: string
          scan_status?: 'pending' | 'scanning' | 'completed' | 'failed'
          result_summary?: string | null
          threat_level?: 'none' | 'low' | 'medium' | 'high' | 'critical' | null
          detection_count?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          file_name?: string
          file_size?: number
          file_hash?: string
          scan_status?: 'pending' | 'scanning' | 'completed' | 'failed'
          result_summary?: string | null
          threat_level?: 'none' | 'low' | 'medium' | 'high' | 'critical' | null
          detection_count?: number | null
        }
      }
      threat_feeds: {
        Row: {
          id: string
          created_at: string
          feed_type: 'malware' | 'phishing' | 'ransomware' | 'vulnerability' | 'exploit'
          threat_name: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          ioc_type: 'ip' | 'domain' | 'url' | 'hash' | 'email'
          ioc_value: string
          description: string | null
          source: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          feed_type: 'malware' | 'phishing' | 'ransomware' | 'vulnerability' | 'exploit'
          threat_name: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          ioc_type: 'ip' | 'domain' | 'url' | 'hash' | 'email'
          ioc_value: string
          description?: string | null
          source?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          feed_type?: 'malware' | 'phishing' | 'ransomware' | 'vulnerability' | 'exploit'
          threat_name?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          ioc_type?: 'ip' | 'domain' | 'url' | 'hash' | 'email'
          ioc_value?: string
          description?: string | null
          source?: string | null
          is_active?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}