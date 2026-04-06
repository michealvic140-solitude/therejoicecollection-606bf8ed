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
      announcements: {
        Row: {
          active: boolean
          content: string
          created_at: string
          featured: boolean
          id: string
          image_url: string | null
          tag: string
          title: string
        }
        Insert: {
          active?: boolean
          content?: string
          created_at?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          tag?: string
          title: string
        }
        Update: {
          active?: boolean
          content?: string
          created_at?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          tag?: string
          title?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          is_system: boolean
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          is_system?: boolean
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          is_system?: boolean
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          active: boolean
          created_at: string
          description: string
          ends_at: string
          id: string
          image_url: string | null
          promo_code: string | null
          starts_at: string
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          ends_at: string
          id?: string
          image_url?: string | null
          promo_code?: string | null
          starts_at?: string
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          image_url?: string | null
          promo_code?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      negotiations: {
        Row: {
          admin_message: string | null
          counter_offer: number | null
          created_at: string
          id: string
          message: string | null
          offered_price: number
          original_price: number
          product_id: string
          product_name: string
          status: string
          user_id: string
          user_name: string
        }
        Insert: {
          admin_message?: string | null
          counter_offer?: number | null
          created_at?: string
          id?: string
          message?: string | null
          offered_price?: number
          original_price?: number
          product_id: string
          product_name?: string
          status?: string
          user_id: string
          user_name?: string
        }
        Update: {
          admin_message?: string | null
          counter_offer?: number | null
          created_at?: string
          id?: string
          message?: string | null
          offered_price?: number
          original_price?: number
          product_id?: string
          product_name?: string
          status?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "negotiations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_tracking: {
        Row: {
          created_at: string
          description: string
          id: string
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          order_id: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string
          status?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          cancellation_reason: string | null
          created_at: string
          delivery_address: string | null
          delivery_city: string | null
          delivery_method: string
          delivery_state: string | null
          id: string
          items: Json
          pickup_location: string | null
          readjust_message: string | null
          readjusted_at: string | null
          refund_admin_note: string | null
          refund_photo: string | null
          refund_reason: string | null
          refund_request_date: string | null
          refund_responded_at: string | null
          refund_status: string | null
          screenshot_url: string | null
          status: string
          total: number
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          cancellation_reason?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_method?: string
          delivery_state?: string | null
          id?: string
          items?: Json
          pickup_location?: string | null
          readjust_message?: string | null
          readjusted_at?: string | null
          refund_admin_note?: string | null
          refund_photo?: string | null
          refund_reason?: string | null
          refund_request_date?: string | null
          refund_responded_at?: string | null
          refund_status?: string | null
          screenshot_url?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id: string
          user_name?: string
        }
        Update: {
          cancellation_reason?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_method?: string
          delivery_state?: string | null
          id?: string
          items?: Json
          pickup_location?: string | null
          readjust_message?: string | null
          readjusted_at?: string | null
          refund_admin_note?: string | null
          refund_photo?: string | null
          refund_reason?: string | null
          refund_request_date?: string | null
          refund_responded_at?: string | null
          refund_status?: string | null
          screenshot_url?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      popup_ads: {
        Row: {
          active: boolean
          created_at: string
          description: string
          discount_percent: number | null
          id: string
          image_url: string | null
          link_id: string
          link_type: string
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          link_id?: string
          link_type?: string
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          link_id?: string
          link_type?: string
          title?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          out_of_stock: boolean
          price: number
          shipping: boolean
          updated_at: string
          visible: boolean
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          out_of_stock?: boolean
          price?: number
          shipping?: boolean
          updated_at?: string
          visible?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          out_of_stock?: boolean
          price?: number
          shipping?: boolean
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          badge: string
          city: string | null
          created_at: string
          dob: string | null
          full_name: string
          id: string
          landmark: string | null
          lga: string | null
          phone: string | null
          restricted: boolean
          state: string | null
          status: string
          updated_at: string
          user_id: string
          username: string | null
          warning_message: string | null
        }
        Insert: {
          address?: string | null
          badge?: string
          city?: string | null
          created_at?: string
          dob?: string | null
          full_name?: string
          id?: string
          landmark?: string | null
          lga?: string | null
          phone?: string | null
          restricted?: boolean
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
          username?: string | null
          warning_message?: string | null
        }
        Update: {
          address?: string | null
          badge?: string
          city?: string | null
          created_at?: string
          dob?: string | null
          full_name?: string
          id?: string
          landmark?: string | null
          lga?: string | null
          phone?: string | null
          restricted?: boolean
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          username?: string | null
          warning_message?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_percent: number
          id: string
          max_uses: number | null
          min_quantity: number
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_percent?: number
          id?: string
          max_uses?: number | null
          min_quantity?: number
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_percent?: number
          id?: string
          max_uses?: number | null
          min_quantity?: number
          used_count?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          delivery_comment: string | null
          delivery_rating: number | null
          id: string
          image_url: string | null
          order_id: string
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          delivery_comment?: string | null
          delivery_rating?: number | null
          id?: string
          image_url?: string | null
          order_id: string
          product_id: string
          rating?: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          delivery_comment?: string | null
          delivery_rating?: number | null
          id?: string
          image_url?: string | null
          order_id?: string
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          key: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      spin_results: {
        Row: {
          created_at: string
          id: string
          prize_name: string
          prize_type: string
          prize_value: string
          spin_wheel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prize_name?: string
          prize_type?: string
          prize_value?: string
          spin_wheel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prize_name?: string
          prize_type?: string
          prize_value?: string
          spin_wheel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spin_results_spin_wheel_id_fkey"
            columns: ["spin_wheel_id"]
            isOneToOne: false
            referencedRelation: "spin_wheels"
            referencedColumns: ["id"]
          },
        ]
      }
      spin_wheels: {
        Row: {
          active: boolean
          created_at: string
          id: string
          prizes: Json
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          prizes?: Json
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          prizes?: Json
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
