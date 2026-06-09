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
      domains: {
        Row: {
          color: string
          coordinator_name: string | null
          coordinator_role: string | null
          created_at: string
          description: string
          display_order: number
          head_name: string | null
          head_role: string | null
          icon: string
          id: string
          name: string
          responsibilities: string[] | null
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string
          coordinator_name?: string | null
          coordinator_role?: string | null
          created_at?: string
          description: string
          display_order?: number
          head_name?: string | null
          head_role?: string | null
          icon?: string
          id?: string
          name: string
          responsibilities?: string[] | null
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string
          coordinator_name?: string | null
          coordinator_role?: string | null
          created_at?: string
          description?: string
          display_order?: number
          head_name?: string | null
          head_role?: string | null
          icon?: string
          id?: string
          name?: string
          responsibilities?: string[] | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_domains: {
        Row: {
          created_at: string
          domain_id: string
          event_id: string
          id: string
        }
        Insert: {
          created_at?: string
          domain_id: string
          event_id: string
          id?: string
        }
        Update: {
          created_at?: string
          domain_id?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_domains_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_domains_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          status: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          status?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          display_order: number | null
          eligibility: string | null
          faculty_coordinator_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          mode: string | null
          registration_link: string | null
          student_coordinator_id: string | null
          time: string | null
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          display_order?: number | null
          eligibility?: string | null
          faculty_coordinator_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          mode?: string | null
          registration_link?: string | null
          student_coordinator_id?: string | null
          time?: string | null
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          display_order?: number | null
          eligibility?: string | null
          faculty_coordinator_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          mode?: string | null
          registration_link?: string | null
          student_coordinator_id?: string | null
          time?: string | null
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      faculty_members: {
        Row: {
          about: string | null
          created_at: string
          department: string
          designation: string
          display_order: number
          email: string | null
          github_url: string | null
          id: string
          image_url: string | null
          instagram_url: string | null
          is_active: boolean | null
          linkedin_url: string | null
          name: string
          phone_number: string | null
          social_visibility: Json
          twitter_url: string | null
          updated_at: string
          user_id: string | null
          whatsapp_url: string | null
        }
        Insert: {
          about?: string | null
          created_at?: string
          department: string
          designation: string
          display_order?: number
          email?: string | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          name: string
          phone_number?: string | null
          social_visibility?: Json
          twitter_url?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_url?: string | null
        }
        Update: {
          about?: string | null
          created_at?: string
          department?: string
          designation?: string
          display_order?: number
          email?: string | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          name?: string
          phone_number?: string | null
          social_visibility?: Json
          twitter_url?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_url?: string | null
        }
        Relationships: []
      }
      gallery: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          event_date: string | null
          event_name: string | null
          id: string
          image_url: string
          is_featured: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          social_links: Json | null
          updated_at: string
        }
        Insert: {
          about?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          social_links?: Json | null
          updated_at?: string
        }
        Update: {
          about?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          social_links?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      student_members: {
        Row: {
          about: string | null
          created_at: string
          display_order: number
          domain: string | null
          domain_role: string
          github_url: string | null
          id: string
          image_url: string | null
          instagram_url: string | null
          is_active: boolean | null
          is_core_member: boolean | null
          linkedin_url: string | null
          name: string
          phone_number: string | null
          role: string
          social_visibility: Json
          twitter_url: string | null
          updated_at: string
          user_id: string | null
          whatsapp_url: string | null
        }
        Insert: {
          about?: string | null
          created_at?: string
          display_order?: number
          domain?: string | null
          domain_role?: string
          github_url?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_core_member?: boolean | null
          linkedin_url?: string | null
          name: string
          phone_number?: string | null
          role: string
          social_visibility?: Json
          twitter_url?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_url?: string | null
        }
        Update: {
          about?: string | null
          created_at?: string
          display_order?: number
          domain?: string | null
          domain_role?: string
          github_url?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_core_member?: boolean | null
          linkedin_url?: string | null
          name?: string
          phone_number?: string | null
          role?: string
          social_visibility?: Json
          twitter_url?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_domain_roles: {
        Row: {
          created_at: string
          domain_id: string
          id: string
          role: Database["public"]["Enums"]["domain_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          domain_id: string
          id?: string
          role?: Database["public"]["Enums"]["domain_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          domain_id?: string
          id?: string
          role?: Database["public"]["Enums"]["domain_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_domain_roles_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      member_directory: {
        Row: {
          about: string | null
          department: string | null
          designation: string | null
          display_order: number | null
          domain: string | null
          domain_role: string | null
          email: string | null
          github_url: string | null
          id: string | null
          image_url: string | null
          instagram_url: string | null
          is_core_member: boolean | null
          linkedin_url: string | null
          member_type: string | null
          name: string | null
          phone_number: string | null
          role: string | null
          twitter_url: string | null
          whatsapp_url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member: {
        Args: {
          _uid: string
        }
        Returns: boolean
      }
      search_potential_coordinators: {
        Args: {
          search_query: string
          member_type: string
        }
        Returns: {
          user_id: string
          name: string
          designation: string
          email: string
        }[]
      }
      upsert_my_member_profile: {
        Args: {
          p_name: string
          p_phone_number?: string | null
          p_about?: string | null
          p_domain?: string | null
          p_role?: string | null
          p_designation?: string | null
          p_department?: string | null
          p_image_url?: string | null
          p_linkedin_url?: string | null
          p_twitter_url?: string | null
          p_instagram_url?: string | null
          p_github_url?: string | null
          p_whatsapp_url?: string | null
          p_social_visibility?: Json
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      domain_role: "head" | "coordinator" | "member"
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
      app_role: ["admin", "moderator", "user"],
      domain_role: ["head", "coordinator", "member"],
    },
  },
} as const
