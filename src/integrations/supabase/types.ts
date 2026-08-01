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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          role?: string
          session_id?: string
          user_id?: string
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
          id: string
          last_message_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dsa_problems: {
        Row: {
          constraints: string
          created_at: string
          difficulty: string
          explanation: string
          id: string
          input_format: string
          optimal_solution: string | null
          output_format: string
          sample_input: string
          sample_output: string
          starter_code: Json
          statement: string
          test_cases: Json
          title: string
          topic: string
          user_id: string
        }
        Insert: {
          constraints: string
          created_at?: string
          difficulty: string
          explanation: string
          id?: string
          input_format: string
          optimal_solution?: string | null
          output_format: string
          sample_input: string
          sample_output: string
          starter_code?: Json
          statement: string
          test_cases?: Json
          title: string
          topic: string
          user_id: string
        }
        Update: {
          constraints?: string
          created_at?: string
          difficulty?: string
          explanation?: string
          id?: string
          input_format?: string
          optimal_solution?: string | null
          output_format?: string
          sample_input?: string
          sample_output?: string
          starter_code?: Json
          statement?: string
          test_cases?: Json
          title?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      dsa_progress: {
        Row: {
          category: string
          created_at: string
          id: string
          is_completed: boolean
          notes: string | null
          topic_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          topic_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          topic_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dsa_submissions: {
        Row: {
          ai_feedback: string | null
          code: string
          created_at: string
          difficulty: string
          id: string
          language: string
          memory_kb: number | null
          passed_count: number
          problem_id: string
          results: Json
          runtime_ms: number | null
          status: string
          topic: string
          total_count: number
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          code: string
          created_at?: string
          difficulty: string
          id?: string
          language: string
          memory_kb?: number | null
          passed_count?: number
          problem_id: string
          results?: Json
          runtime_ms?: number | null
          status: string
          topic: string
          total_count?: number
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          code?: string
          created_at?: string
          difficulty?: string
          id?: string
          language?: string
          memory_kb?: number | null
          passed_count?: number
          problem_id?: string
          results?: Json
          runtime_ms?: number | null
          status?: string
          topic?: string
          total_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dsa_submissions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "dsa_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_countdowns: {
        Row: {
          created_at: string
          exam_date: string
          exam_name: string
          id: string
          is_active: boolean
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_date: string
          exam_name: string
          id?: string
          is_active?: boolean
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_date?: string
          exam_name?: string
          id?: string
          is_active?: boolean
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck_name: string
          front: string
          id: string
          is_mastered: boolean
          subject: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          deck_name?: string
          front: string
          id?: string
          is_mastered?: boolean
          subject: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          deck_name?: string
          front?: string
          id?: string
          is_mastered?: boolean
          subject?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_favorite: boolean
          subject: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          subject: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          subject?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          updated_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          updated_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          updated_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      partner_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "partner_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          grade: string | null
          id: string
          subject_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          grade?: string | null
          id?: string
          subject_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          grade?: string | null
          id?: string
          subject_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          correct_answers: number
          created_at: string
          id: string
          questions: Json | null
          score: number
          subject: string
          topic: string
          total_questions: number
          user_id: string
        }
        Insert: {
          correct_answers?: number
          created_at?: string
          id?: string
          questions?: Json | null
          score?: number
          subject: string
          topic: string
          total_questions?: number
          user_id: string
        }
        Update: {
          correct_answers?: number
          created_at?: string
          id?: string
          questions?: Json | null
          score?: number
          subject?: string
          topic?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      study_partners: {
        Row: {
          availability: string | null
          bio: string | null
          created_at: string
          goals: string | null
          id: string
          is_visible: boolean
          semester: string | null
          subjects: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          created_at?: string
          goals?: string | null
          id?: string
          is_visible?: boolean
          semester?: string | null
          subjects?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          bio?: string | null
          created_at?: string
          goals?: string | null
          id?: string
          is_visible?: boolean
          semester?: string | null
          subjects?: string[]
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
      [_ in never]: never
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
