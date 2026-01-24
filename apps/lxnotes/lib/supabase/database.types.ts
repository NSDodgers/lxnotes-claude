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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      custom_priorities: {
        Row: {
          color: string
          created_at: string | null
          id: string
          is_hidden: boolean | null
          is_system: boolean | null
          label: string
          module_type: string
          production_id: string
          sort_order: number
          updated_at: string | null
          value: string
        }
        Insert: {
          color: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          is_system?: boolean | null
          label: string
          module_type: string
          production_id: string
          sort_order?: number
          updated_at?: string | null
          value: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          is_system?: boolean | null
          label?: string
          module_type?: string
          production_id?: string
          sort_order?: number
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_priorities_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_types: {
        Row: {
          color: string
          created_at: string | null
          id: string
          is_hidden: boolean | null
          is_system: boolean | null
          label: string
          module_type: string
          production_id: string
          sort_order: number
          updated_at: string | null
          value: string
        }
        Insert: {
          color: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          is_system?: boolean | null
          label: string
          module_type: string
          production_id: string
          sort_order?: number
          updated_at?: string | null
          value: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          is_system?: boolean | null
          label?: string
          module_type?: string
          production_id?: string
          sort_order?: number
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_types_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      department_members: {
        Row: {
          created_at: string | null
          department_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          department_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          app_id: string
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          production_id: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          app_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          production_id: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          app_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          production_id?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      fixtures: {
        Row: {
          address: number | null
          channel: number
          created_at: string | null
          fixture_type: string
          id: string
          is_active: boolean | null
          lwid: string
          position: string
          position_order: number | null
          production_id: string
          purpose: string | null
          removed_at: string | null
          source: string | null
          source_uploaded_at: string | null
          unit_number: string
          universe: number | null
          universe_address_raw: string | null
          updated_at: string | null
        }
        Insert: {
          address?: number | null
          channel: number
          created_at?: string | null
          fixture_type: string
          id?: string
          is_active?: boolean | null
          lwid: string
          position: string
          position_order?: number | null
          production_id: string
          purpose?: string | null
          removed_at?: string | null
          source?: string | null
          source_uploaded_at?: string | null
          unit_number: string
          universe?: number | null
          universe_address_raw?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: number | null
          channel?: number
          created_at?: string | null
          fixture_type?: string
          id?: string
          is_active?: boolean | null
          lwid?: string
          position?: string
          position_order?: number | null
          production_id?: string
          purpose?: string | null
          removed_at?: string | null
          source?: string | null
          source_uploaded_at?: string | null
          unit_number?: string
          universe?: number | null
          universe_address_raw?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      note_transfers: {
        Row: {
          created_at: string | null
          id: string
          in_reply_to_id: string | null
          sent_at: string | null
          sent_by: string
          source_app_id: string
          source_department_id: string | null
          source_note_id: string
          target_app_id: string
          target_department_id: string
          target_note_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          in_reply_to_id?: string | null
          sent_at?: string | null
          sent_by: string
          source_app_id: string
          source_department_id?: string | null
          source_note_id: string
          target_app_id: string
          target_department_id: string
          target_note_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          in_reply_to_id?: string | null
          sent_at?: string | null
          sent_by?: string
          source_app_id?: string
          source_department_id?: string | null
          source_note_id?: string
          target_app_id?: string
          target_department_id?: string
          target_note_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_transfers_in_reply_to_id_fkey"
            columns: ["in_reply_to_id"]
            isOneToOne: false
            referencedRelation: "note_transfers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_transfers_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_transfers_source_department_id_fkey"
            columns: ["source_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_transfers_source_note_id_fkey"
            columns: ["source_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_transfers_target_department_id_fkey"
            columns: ["target_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_transfers_target_note_id_fkey"
            columns: ["target_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          app_id: string | null
          assigned_to: string | null
          channel_numbers: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          cue_number: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_transferred: boolean | null
          lightwright_item_id: string | null
          module_type: string
          position_unit: string | null
          priority: string
          production_id: string
          scene_song_id: string | null
          scenery_needs: string | null
          script_page_id: string | null
          source_department_id: string | null
          status: string
          title: string
          transferred_at: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          app_id?: string | null
          assigned_to?: string | null
          channel_numbers?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          cue_number?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_transferred?: boolean | null
          lightwright_item_id?: string | null
          module_type: string
          position_unit?: string | null
          priority?: string
          production_id: string
          scene_song_id?: string | null
          scenery_needs?: string | null
          script_page_id?: string | null
          source_department_id?: string | null
          status?: string
          title: string
          transferred_at?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          app_id?: string | null
          assigned_to?: string | null
          channel_numbers?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          cue_number?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_transferred?: boolean | null
          lightwright_item_id?: string | null
          module_type?: string
          position_unit?: string | null
          priority?: string
          production_id?: string
          scene_song_id?: string | null
          scenery_needs?: string | null
          script_page_id?: string | null
          source_department_id?: string | null
          status?: string
          title?: string
          transferred_at?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_source_department_id_fkey"
            columns: ["source_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      position_orders: {
        Row: {
          created_at: string | null
          csv_checksum: string | null
          id: string
          order_source: string
          positions: string[]
          production_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          csv_checksum?: string | null
          id?: string
          order_source?: string
          positions?: string[]
          production_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          csv_checksum?: string | null
          id?: string
          order_source?: string
          positions?: string[]
          production_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "position_orders_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: true
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      production_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          production_id: string
          role: string
          status: string
          token: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          production_id: string
          role?: string
          status?: string
          token?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          production_id?: string
          role?: string
          status?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_invitations_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      production_members: {
        Row: {
          created_at: string | null
          id: string
          primary_department_id: string | null
          production_id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          primary_department_id?: string | null
          production_id: string
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          primary_department_id?: string | null
          production_id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_members_primary_department_id_fkey"
            columns: ["primary_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_members_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      productions: {
        Row: {
          abbreviation: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_demo: boolean | null
          logo: string | null
          name: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          abbreviation: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_demo?: boolean | null
          logo?: string | null
          name: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          abbreviation?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_demo?: boolean | null
          logo?: string | null
          name?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scenes_songs: {
        Row: {
          act_id: string | null
          continues_from_id: string | null
          continues_on_page_id: string | null
          created_at: string | null
          first_cue_number: string | null
          id: string
          module_type: string
          name: string
          order_index: number
          production_id: string
          script_page_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          act_id?: string | null
          continues_from_id?: string | null
          continues_on_page_id?: string | null
          created_at?: string | null
          first_cue_number?: string | null
          id?: string
          module_type: string
          name: string
          order_index?: number
          production_id: string
          script_page_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          act_id?: string | null
          continues_from_id?: string | null
          continues_on_page_id?: string | null
          created_at?: string | null
          first_cue_number?: string | null
          id?: string
          module_type?: string
          name?: string
          order_index?: number
          production_id?: string
          script_page_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenes_songs_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenes_songs_script_page_id_fkey"
            columns: ["script_page_id"]
            isOneToOne: false
            referencedRelation: "script_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      script_pages: {
        Row: {
          created_at: string | null
          first_cue_number: string | null
          id: string
          page_number: string
          production_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          first_cue_number?: string | null
          id?: string
          page_number: string
          production_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          first_cue_number?: string | null
          id?: string
          page_number?: string
          production_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "script_pages_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      work_note_fixture_links: {
        Row: {
          created_at: string | null
          fixture_id: string
          id: string
          work_note_id: string
        }
        Insert: {
          created_at?: string | null
          fixture_id: string
          id?: string
          work_note_id: string
        }
        Update: {
          created_at?: string | null
          fixture_id?: string
          id?: string
          work_note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_note_fixture_links_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_note_fixture_links_work_note_id_fkey"
            columns: ["work_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_deleted_productions: { Args: never; Returns: undefined }
      get_department_production_id: {
        Args: { check_department_id: string }
        Returns: string
      }
      has_production_access: {
        Args: { check_production_id: string; check_user_id: string }
        Returns: boolean
      }
      is_department_head: {
        Args: { check_department_id: string; check_user_id: string }
        Returns: boolean
      }
      is_department_member: {
        Args: { check_department_id: string; check_user_id: string }
        Returns: boolean
      }
      is_production_admin: {
        Args: { check_production_id: string; check_user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { check_user_id: string }; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
