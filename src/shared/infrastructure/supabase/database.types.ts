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
      audio_assets: {
        Row: {
          german_text: string
          id: string
          ipa: string | null
          lesson_id: string
          storage_path: string
          translation: string | null
        }
        Insert: {
          german_text: string
          id?: string
          ipa?: string | null
          lesson_id: string
          storage_path: string
          translation?: string | null
        }
        Update: {
          german_text?: string
          id?: string
          ipa?: string | null
          lesson_id?: string
          storage_path?: string
          translation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_assets_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          guiding_points: string[]
          id: string
          lesson_id: string
          max_words: number | null
          min_words: number | null
          prompt: string
          recipient: string | null
          task_type: Database["public"]["Enums"]["writing_task_type"]
        }
        Insert: {
          guiding_points?: string[]
          id?: string
          lesson_id: string
          max_words?: number | null
          min_words?: number | null
          prompt: string
          recipient?: string | null
          task_type?: Database["public"]["Enums"]["writing_task_type"]
        }
        Update: {
          guiding_points?: string[]
          id?: string
          lesson_id?: string
          max_words?: number | null
          min_words?: number | null
          prompt?: string
          recipient?: string | null
          task_type?: Database["public"]["Enums"]["writing_task_type"]
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comment: string
          created_at: string
          id: string
          score: number | null
          submission_id: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          score?: number | null
          submission_id: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          score?: number | null
          submission_id?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "writing_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_marks: {
        Row: {
          flashcard_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          flashcard_id: string
          status: string
          student_id: string
          updated_at?: string
        }
        Update: {
          flashcard_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_marks_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          category: string
          id: string
          is_published: boolean
          level: Database["public"]["Enums"]["cefr_level"]
          position: number
          synonyms: string[]
          term: string
          translation: string
        }
        Insert: {
          category: string
          id?: string
          is_published?: boolean
          level: Database["public"]["Enums"]["cefr_level"]
          position: number
          synonyms?: string[]
          term: string
          translation: string
        }
        Update: {
          category?: string
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["cefr_level"]
          position?: number
          synonyms?: string[]
          term?: string
          translation?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content_md: string
          id: string
          is_published: boolean
          position: number
          title: string
          unit_id: string
        }
        Insert: {
          content_md?: string
          id?: string
          is_published?: boolean
          position: number
          title: string
          unit_id: string
        }
        Update: {
          content_md?: string
          id?: string
          is_published?: boolean
          position?: number
          title?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deactivated_at: string | null
          display_name: string
          email: string | null
          id: string
          must_change_password: boolean
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          display_name: string
          email?: string | null
          id: string
          must_change_password?: boolean
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          display_name?: string
          email?: string | null
          id?: string
          must_change_password?: boolean
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      speaking_assessments: {
        Row: {
          comment: string
          created_at: string
          id: string
          practice_id: string
          score: number
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          comment?: string
          created_at?: string
          id?: string
          practice_id: string
          score: number
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          practice_id?: string
          score?: number
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speaking_assessments_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: true
            referencedRelation: "speaking_practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaking_assessments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      speaking_practices: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          student_id: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds: number
          id?: string
          student_id: string
          topic_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          student_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "speaking_practices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaking_practices_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "speaking_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      speaking_topics: {
        Row: {
          exam: Database["public"]["Enums"]["speaking_exam"]
          follow_up_questions: string[]
          guiding_points: string[]
          id: string
          is_published: boolean
          level: Database["public"]["Enums"]["cefr_level"]
          position: number
          prompt: string
          source_text: string | null
          task_type: Database["public"]["Enums"]["speaking_task_type"]
          title: string
        }
        Insert: {
          exam?: Database["public"]["Enums"]["speaking_exam"]
          follow_up_questions?: string[]
          guiding_points?: string[]
          id?: string
          is_published?: boolean
          level: Database["public"]["Enums"]["cefr_level"]
          position: number
          prompt: string
          source_text?: string | null
          task_type: Database["public"]["Enums"]["speaking_task_type"]
          title: string
        }
        Update: {
          exam?: Database["public"]["Enums"]["speaking_exam"]
          follow_up_questions?: string[]
          guiding_points?: string[]
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["cefr_level"]
          position?: number
          prompt?: string
          source_text?: string | null
          task_type?: Database["public"]["Enums"]["speaking_task_type"]
          title?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          id: string
          level: Database["public"]["Enums"]["cefr_level"]
          position: number
          title: string
        }
        Insert: {
          id?: string
          level: Database["public"]["Enums"]["cefr_level"]
          position: number
          title: string
        }
        Update: {
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          position?: number
          title?: string
        }
        Relationships: []
      }
      useful_phrases: {
        Row: {
          category: string
          id: string
          position: number
          task_type: Database["public"]["Enums"]["writing_task_type"]
          text: string
        }
        Insert: {
          category: string
          id?: string
          position: number
          task_type: Database["public"]["Enums"]["writing_task_type"]
          text: string
        }
        Update: {
          category?: string
          id?: string
          position?: number
          task_type?: Database["public"]["Enums"]["writing_task_type"]
          text?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          last_seen_at: string
          user_id: string
        }
        Insert: {
          last_seen_at?: string
          user_id: string
        }
        Update: {
          last_seen_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      writing_drafts: {
        Row: {
          content: string
          exercise_id: string
          id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          content: string
          exercise_id: string
          id?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          exercise_id?: string
          id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "writing_drafts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "writing_drafts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      writing_submissions: {
        Row: {
          attempt_number: number
          content: string
          created_at: string
          duration_seconds: number | null
          exercise_id: string
          guiding_points_checked: number | null
          id: string
          student_id: string
        }
        Insert: {
          attempt_number: number
          content: string
          created_at?: string
          duration_seconds?: number | null
          exercise_id: string
          guiding_points_checked?: number | null
          id?: string
          student_id: string
        }
        Update: {
          attempt_number?: number
          content?: string
          created_at?: string
          duration_seconds?: number | null
          exercise_id?: string
          guiding_points_checked?: number | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "writing_submissions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "writing_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      touch_presence: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
      cefr_level: "A1" | "A2" | "B1" | "B2"
      speaking_exam: "goethe" | "telc"
      speaking_task_type:
        | "presentation"
        | "discussion"
        | "experience"
        | "planning"
      writing_task_type: "forum_post" | "formal_email"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["student", "teacher", "admin"],
      cefr_level: ["A1", "A2", "B1", "B2"],
      speaking_exam: ["goethe", "telc"],
      speaking_task_type: [
        "presentation",
        "discussion",
        "experience",
        "planning",
      ],
      writing_task_type: ["forum_post", "formal_email"],
    },
  },
} as const
