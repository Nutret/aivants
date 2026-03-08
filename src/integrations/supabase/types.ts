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
      campaigns: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
          subject: string | null
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: string
          subject?: string | null
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          subject?: string | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_activities: {
        Row: {
          activity_type: string
          campaign_id: string | null
          channel: string
          created_at: string
          id: string
          lead_id: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          activity_type?: string
          campaign_id?: string | null
          channel?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          campaign_id?: string | null
          channel?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_activities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          industry: string | null
          name: string
          size: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          industry?: string | null
          name: string
          size?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          industry?: string | null
          name?: string
          size?: string | null
          user_id?: string
        }
        Relationships: []
      }
      company_intelligence: {
        Row: {
          ai_opening_line: string | null
          company_id: string | null
          created_at: string
          growth_signals: string | null
          hiring_signals: string | null
          id: string
          industry_focus: string | null
          lead_id: string
          marketing_activity: string | null
          outreach_angle: string | null
          raw_data: Json | null
          researched_at: string
          services: string | null
          user_id: string
          website_summary: string | null
        }
        Insert: {
          ai_opening_line?: string | null
          company_id?: string | null
          created_at?: string
          growth_signals?: string | null
          hiring_signals?: string | null
          id?: string
          industry_focus?: string | null
          lead_id: string
          marketing_activity?: string | null
          outreach_angle?: string | null
          raw_data?: Json | null
          researched_at?: string
          services?: string | null
          user_id: string
          website_summary?: string | null
        }
        Update: {
          ai_opening_line?: string | null
          company_id?: string | null
          created_at?: string
          growth_signals?: string | null
          hiring_signals?: string | null
          id?: string
          industry_focus?: string | null
          lead_id?: string
          marketing_activity?: string | null
          outreach_angle?: string | null
          raw_data?: Json | null
          researched_at?: string
          services?: string | null
          user_id?: string
          website_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_intelligence_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_intelligence_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      content_assets: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_url: string
          id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_url?: string
          id?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_url?: string
          id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          bounced: boolean
          campaign_id: string | null
          channel: string | null
          created_at: string
          id: string
          lead_id: string | null
          opened_at: string | null
          replied_at: string | null
          reply_body: string | null
          reply_classification: string | null
          reply_sentiment: string | null
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          bounced?: boolean
          campaign_id?: string | null
          channel?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          replied_at?: string | null
          reply_body?: string | null
          reply_classification?: string | null
          reply_sentiment?: string | null
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          bounced?: boolean
          campaign_id?: string | null
          channel?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          replied_at?: string | null
          reply_body?: string | null
          reply_classification?: string | null
          reply_sentiment?: string | null
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          category: string | null
          created_at: string
          id: string
          name: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string
          id?: string
          name: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      followup_sequences: {
        Row: {
          campaign_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_sequences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_status: {
        Row: {
          campaign_id: string | null
          created_at: string
          current_step: number
          id: string
          last_email_sent_at: string | null
          lead_id: string
          next_followup_date: string | null
          sequence_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          current_step?: number
          id?: string
          last_email_sent_at?: string | null
          lead_id: string
          next_followup_date?: string | null
          sequence_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          current_step?: number
          id?: string
          last_email_sent_at?: string | null
          lead_id?: string
          next_followup_date?: string | null
          sequence_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_status_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_status_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_status_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "followup_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_steps: {
        Row: {
          body_override: string | null
          channel: string
          content_asset_id: string | null
          created_at: string
          delay_days: number
          id: string
          script_id: string | null
          sequence_id: string
          step_number: number
          subject_override: string | null
          template_id: string | null
        }
        Insert: {
          body_override?: string | null
          channel?: string
          content_asset_id?: string | null
          created_at?: string
          delay_days?: number
          id?: string
          script_id?: string | null
          sequence_id: string
          step_number?: number
          subject_override?: string | null
          template_id?: string | null
        }
        Update: {
          body_override?: string | null
          channel?: string
          content_asset_id?: string | null
          created_at?: string
          delay_days?: number
          id?: string
          script_id?: string | null
          sequence_id?: string
          step_number?: number
          subject_override?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followup_steps_content_asset_id_fkey"
            columns: ["content_asset_id"]
            isOneToOne: false
            referencedRelation: "content_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_steps_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "outreach_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "followup_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          company_id: string | null
          company_name: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          industry: string | null
          last_name: string | null
          linkedin: string | null
          location: string | null
          notes: string | null
          phone: string | null
          query: string | null
          rating: number | null
          reviews: number | null
          score: number | null
          source: string | null
          status: string
          tags: string[] | null
          title: string | null
          updated_at: string
          url: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          industry?: string | null
          last_name?: string | null
          linkedin?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          query?: string | null
          rating?: number | null
          reviews?: number | null
          score?: number | null
          source?: string | null
          status?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          industry?: string | null
          last_name?: string | null
          linkedin?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          query?: string | null
          rating?: number | null
          reviews?: number | null
          score?: number | null
          source?: string | null
          status?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_scripts: {
        Row: {
          call_to_action: string
          category: string
          context: string
          created_at: string
          full_template: string
          hook: string
          id: string
          name: string
          proof: string
          updated_at: string
          user_id: string
          value_proposition: string
          variables: string[] | null
        }
        Insert: {
          call_to_action?: string
          category?: string
          context?: string
          created_at?: string
          full_template?: string
          hook?: string
          id?: string
          name: string
          proof?: string
          updated_at?: string
          user_id: string
          value_proposition?: string
          variables?: string[] | null
        }
        Update: {
          call_to_action?: string
          category?: string
          context?: string
          created_at?: string
          full_template?: string
          hook?: string
          id?: string
          name?: string
          proof?: string
          updated_at?: string
          user_id?: string
          value_proposition?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          client_won: boolean
          created_at: string
          deal_value: number | null
          id: string
          lead_id: string
          meeting_booked: boolean
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_won?: boolean
          created_at?: string
          deal_value?: number | null
          id?: string
          lead_id: string
          meeting_booked?: boolean
          stage?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_won?: boolean
          created_at?: string
          deal_value?: number | null
          id?: string
          lead_id?: string
          meeting_booked?: boolean
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_users: {
        Row: {
          id: string
          is_active: boolean
          linked_at: string
          telegram_chat_id: number
          telegram_username: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          linked_at?: string
          telegram_chat_id: number
          telegram_username?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          linked_at?: string
          telegram_chat_id?: number
          telegram_username?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          email_provider: string | null
          from_email: string | null
          id: string
          updated_at: string
          user_id: string
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string
          email_provider?: string | null
          from_email?: string | null
          id?: string
          updated_at?: string
          user_id: string
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string
          email_provider?: string | null
          from_email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          webhook_secret?: string | null
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
