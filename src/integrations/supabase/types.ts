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
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          invited_by: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role: string
          status?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_members_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          accent_color: string | null
          active: boolean
          banner_image: string | null
          business_type: string | null
          created_at: string
          custom_domain: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          short_description: string | null
          slug: string
          welcome_message: string | null
        }
        Insert: {
          accent_color?: string | null
          active?: boolean
          banner_image?: string | null
          business_type?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          short_description?: string | null
          slug: string
          welcome_message?: string | null
        }
        Update: {
          accent_color?: string | null
          active?: boolean
          banner_image?: string | null
          business_type?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          short_description?: string | null
          slug?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          business_id: string
          coupon_id: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          coupon_id: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          coupon_id?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          business_id: string
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
        }
        Insert: {
          active?: boolean
          business_id: string
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_businesses: {
        Row: {
          business_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_businesses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_acceptances: {
        Row: {
          accepted_at: string
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_acceptances_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_acceptances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          active: boolean
          business_id: string
          content: string
          id: string
          type: string
          updated_at: string
          version: string
        }
        Insert: {
          active?: boolean
          business_id: string
          content: string
          id?: string
          type: string
          updated_at?: string
          version: string
        }
        Update: {
          active?: boolean
          business_id?: string
          content?: string
          id?: string
          type?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_settings: {
        Row: {
          base_points_per_purchase: number
          business_id: string
          free_bonus_points: number
          id: string
          membership_points_multiplier: number
          updated_at: string
        }
        Insert: {
          base_points_per_purchase?: number
          business_id: string
          free_bonus_points?: number
          id?: string
          membership_points_multiplier?: number
          updated_at?: string
        }
        Update: {
          base_points_per_purchase?: number
          business_id?: string
          free_bonus_points?: number
          id?: string
          membership_points_multiplier?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          bonus_points: number
          business_id: string
          created_at: string
          ends_at: string | null
          id: string
          is_plus: boolean
          plan_name: string | null
          points_multiplier: number
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          bonus_points?: number
          business_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_plus?: boolean
          plan_name?: string | null
          points_multiplier?: number
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          bonus_points?: number
          business_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_plus?: boolean
          plan_name?: string | null
          points_multiplier?: number
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          business_id: string
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          business_id: string
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          business_id?: string
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      points_ledger: {
        Row: {
          business_id: string
          created_at: string
          id: string
          location_id: string | null
          note: string | null
          points: number
          type: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          location_id?: string | null
          note?: string | null
          points: number
          type: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          location_id?: string | null
          note?: string | null
          points?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          qr_token: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          qr_token?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          qr_token?: string | null
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          business_id: string
          created_at: string
          id: string
          reward_id: string
          status: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          reward_id: string
          status?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          reward_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          business_id: string
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_user_id: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referrer_user_id: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          points_cost: number
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          points_cost: number
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          points_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "rewards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_profile_by_email: {
        Args: { _email: string }
        Returns: {
          email: string
          full_name: string
          id: string
        }[]
      }
      get_user_business_ids: { Args: { _user_id: string }; Returns: string[] }
      has_business_role: {
        Args: {
          _business_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_business_member: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "platform_admin" | "business_admin" | "staff" | "customer"
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
      app_role: ["platform_admin", "business_admin", "staff", "customer"],
    },
  },
} as const
