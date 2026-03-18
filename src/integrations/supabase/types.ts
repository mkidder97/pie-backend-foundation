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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      pie_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          embedding: string | null
          episode_id: string
          id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          embedding?: string | null
          episode_id: string
          id?: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string | null
          episode_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pie_chunks_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "pie_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      pie_creators: {
        Row: {
          active: boolean | null
          apple_podcast_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          name: string
          rss_feed_url: string | null
          source_type: Database["public"]["Enums"]["pie_source_type"]
          updated_at: string
          youtube_channel_handle: string | null
        }
        Insert: {
          active?: boolean | null
          apple_podcast_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          rss_feed_url?: string | null
          source_type: Database["public"]["Enums"]["pie_source_type"]
          updated_at?: string
          youtube_channel_handle?: string | null
        }
        Update: {
          active?: boolean | null
          apple_podcast_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          rss_feed_url?: string | null
          source_type?: Database["public"]["Enums"]["pie_source_type"]
          updated_at?: string
          youtube_channel_handle?: string | null
        }
        Relationships: []
      }
      pie_episodes: {
        Row: {
          created_at: string
          creator_id: string
          duration_seconds: number | null
          id: string
          metadata: Json | null
          notion_page_id: string | null
          published_at: string | null
          raw_transcript: string | null
          source_guid: string
          source_type: Database["public"]["Enums"]["pie_source_type"] | null
          source_url: string
          status: Database["public"]["Enums"]["pie_episode_status"]
          structured_summary: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          notion_page_id?: string | null
          published_at?: string | null
          raw_transcript?: string | null
          source_guid: string
          source_type?: Database["public"]["Enums"]["pie_source_type"] | null
          source_url: string
          status?: Database["public"]["Enums"]["pie_episode_status"]
          structured_summary?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          notion_page_id?: string | null
          published_at?: string | null
          raw_transcript?: string | null
          source_guid?: string
          source_type?: Database["public"]["Enums"]["pie_source_type"] | null
          source_url?: string
          status?: Database["public"]["Enums"]["pie_episode_status"]
          structured_summary?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pie_episodes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "pie_creators"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      pie_episode_status:
        | "pending"
        | "transcribing"
        | "processing"
        | "completed"
        | "failed"
      pie_source_type: "rss" | "youtube" | "both"
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
      pie_episode_status: [
        "pending",
        "transcribing",
        "processing",
        "completed",
        "failed",
      ],
      pie_source_type: ["rss", "youtube", "both"],
    },
  },
} as const
