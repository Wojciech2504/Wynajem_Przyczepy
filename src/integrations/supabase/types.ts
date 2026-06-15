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
      addon_fees: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          sort_order: number | null
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          sort_order?: number | null
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          sort_order?: number | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          data: Json
          id: number
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      app_settings_secrets: {
        Row: {
          data: Json
          id: number
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      blocked_dates: {
        Row: {
          block_type: string
          client_visible_as_unavailable: boolean
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          internal_note: string | null
          reason: string | null
          resolved: boolean
          start_date: string
          trailer_id: string | null
          updated_at: string
        }
        Insert: {
          block_type?: string
          client_visible_as_unavailable?: boolean
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          internal_note?: string | null
          reason?: string | null
          resolved?: boolean
          start_date: string
          trailer_id?: string | null
          updated_at?: string
        }
        Update: {
          block_type?: string
          client_visible_as_unavailable?: boolean
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          internal_note?: string | null
          reason?: string | null
          resolved?: boolean
          start_date?: string
          trailer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_trailer_id_fkey"
            columns: ["trailer_id"]
            isOneToOne: false
            referencedRelation: "trailers"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["contact_status"]
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
        }
        Relationships: []
      }
      documents: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          file_size: number | null
          file_url: string
          id: string
          sort_order: number | null
          source: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          sort_order?: number | null
          source?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          sort_order?: number | null
          source?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          active: boolean
          answer: string
          created_at: string
          id: string
          question: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      finance_settings: {
        Row: {
          chairs_enabled: boolean
          chairs_fee: number
          default_deposit: number
          default_service_fee: number
          deposit_amount: number
          deposit_due_hours: number
          deposit_percent: number
          deposit_type: string
          grill_enabled: boolean
          grill_fee: number
          id: number
          pet_enabled: boolean
          pet_fee: number
          table_enabled: boolean
          table_fee: number
          updated_at: string
        }
        Insert: {
          chairs_enabled?: boolean
          chairs_fee?: number
          default_deposit?: number
          default_service_fee?: number
          deposit_amount?: number
          deposit_due_hours?: number
          deposit_percent?: number
          deposit_type?: string
          grill_enabled?: boolean
          grill_fee?: number
          id?: number
          pet_enabled?: boolean
          pet_fee?: number
          table_enabled?: boolean
          table_fee?: number
          updated_at?: string
        }
        Update: {
          chairs_enabled?: boolean
          chairs_fee?: number
          default_deposit?: number
          default_service_fee?: number
          deposit_amount?: number
          deposit_due_hours?: number
          deposit_percent?: number
          deposit_type?: string
          grill_enabled?: boolean
          grill_fee?: number
          id?: number
          pet_enabled?: boolean
          pet_fee?: number
          table_enabled?: boolean
          table_fee?: number
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string
          sort_order: number | null
          title: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number | null
          title?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number | null
          title?: string | null
        }
        Relationships: []
      }
      price_list: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          sort_order: number | null
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          sort_order?: number | null
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          sort_order?: number | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      rental_terms: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          sort_order: number | null
          updated_at: string
          value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          sort_order?: number | null
          updated_at?: string
          value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          sort_order?: number | null
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      reservation_deposits: {
        Row: {
          collected: boolean
          collected_amount: number | null
          collected_at: string | null
          collected_method: Database["public"]["Enums"]["payment_method"] | null
          created_at: string
          deduction: boolean
          deduction_amount: number | null
          deduction_reason: string | null
          id: string
          notes: string | null
          required_amount: number
          reservation_id: string
          returned: boolean
          returned_amount: number | null
          returned_at: string | null
          returned_method: Database["public"]["Enums"]["payment_method"] | null
          updated_at: string
        }
        Insert: {
          collected?: boolean
          collected_amount?: number | null
          collected_at?: string | null
          collected_method?:
            | Database["public"]["Enums"]["payment_method"]
            | null
          created_at?: string
          deduction?: boolean
          deduction_amount?: number | null
          deduction_reason?: string | null
          id?: string
          notes?: string | null
          required_amount?: number
          reservation_id: string
          returned?: boolean
          returned_amount?: number | null
          returned_at?: string | null
          returned_method?: Database["public"]["Enums"]["payment_method"] | null
          updated_at?: string
        }
        Update: {
          collected?: boolean
          collected_amount?: number | null
          collected_at?: string | null
          collected_method?:
            | Database["public"]["Enums"]["payment_method"]
            | null
          created_at?: string
          deduction?: boolean
          deduction_amount?: number | null
          deduction_reason?: string | null
          id?: string
          notes?: string | null
          required_amount?: number
          reservation_id?: string
          returned?: boolean
          returned_amount?: number | null
          returned_at?: string | null
          returned_method?: Database["public"]["Enums"]["payment_method"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_deposits_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          paid_at: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["payment_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_at?: string | null
          reservation_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["payment_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_at?: string | null
          reservation_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["payment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          addons: Json | null
          addons_total: number | null
          admin_notes: string | null
          base_cost: number | null
          chairs_fee: number | null
          country: string | null
          created_at: string
          days: number | null
          deposit: number | null
          discount: number | null
          discount_code: string | null
          dmc_result: Json | null
          driver_license_confirmed: boolean | null
          email: string
          end_date: string
          expires_at: string | null
          extra_chairs: boolean | null
          extra_table: boolean | null
          first_name: string
          grill_fee: number | null
          has_grill: boolean | null
          has_pet: boolean | null
          id: string
          is_abroad: boolean | null
          last_name: string
          manual_override: boolean | null
          nights: number | null
          notes: string | null
          notified_at: string | null
          other_addons: string | null
          other_addons_fee: number | null
          people_count: number
          pet_fee: number | null
          pets_count: number | null
          phone: string
          pickup_time: string | null
          price_per_day: number | null
          rental_total: number | null
          return_time: string | null
          season: string | null
          service_fee: number | null
          settlement_status:
            | Database["public"]["Enums"]["settlement_status"]
            | null
          start_date: string
          status: Database["public"]["Enums"]["reservation_status"]
          table_fee: number | null
          terms_accepted: boolean | null
          total_amount: number | null
          trailer_id: string | null
          trip_notes: string | null
          trip_plan: string | null
          updated_at: string
        }
        Insert: {
          addons?: Json | null
          addons_total?: number | null
          admin_notes?: string | null
          base_cost?: number | null
          chairs_fee?: number | null
          country?: string | null
          created_at?: string
          days?: number | null
          deposit?: number | null
          discount?: number | null
          discount_code?: string | null
          dmc_result?: Json | null
          driver_license_confirmed?: boolean | null
          email: string
          end_date: string
          expires_at?: string | null
          extra_chairs?: boolean | null
          extra_table?: boolean | null
          first_name: string
          grill_fee?: number | null
          has_grill?: boolean | null
          has_pet?: boolean | null
          id?: string
          is_abroad?: boolean | null
          last_name: string
          manual_override?: boolean | null
          nights?: number | null
          notes?: string | null
          notified_at?: string | null
          other_addons?: string | null
          other_addons_fee?: number | null
          people_count?: number
          pet_fee?: number | null
          pets_count?: number | null
          phone: string
          pickup_time?: string | null
          price_per_day?: number | null
          rental_total?: number | null
          return_time?: string | null
          season?: string | null
          service_fee?: number | null
          settlement_status?:
            | Database["public"]["Enums"]["settlement_status"]
            | null
          start_date: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_fee?: number | null
          terms_accepted?: boolean | null
          total_amount?: number | null
          trailer_id?: string | null
          trip_notes?: string | null
          trip_plan?: string | null
          updated_at?: string
        }
        Update: {
          addons?: Json | null
          addons_total?: number | null
          admin_notes?: string | null
          base_cost?: number | null
          chairs_fee?: number | null
          country?: string | null
          created_at?: string
          days?: number | null
          deposit?: number | null
          discount?: number | null
          discount_code?: string | null
          dmc_result?: Json | null
          driver_license_confirmed?: boolean | null
          email?: string
          end_date?: string
          expires_at?: string | null
          extra_chairs?: boolean | null
          extra_table?: boolean | null
          first_name?: string
          grill_fee?: number | null
          has_grill?: boolean | null
          has_pet?: boolean | null
          id?: string
          is_abroad?: boolean | null
          last_name?: string
          manual_override?: boolean | null
          nights?: number | null
          notes?: string | null
          notified_at?: string | null
          other_addons?: string | null
          other_addons_fee?: number | null
          people_count?: number
          pet_fee?: number | null
          pets_count?: number | null
          phone?: string
          pickup_time?: string | null
          price_per_day?: number | null
          rental_total?: number | null
          return_time?: string | null
          season?: string | null
          service_fee?: number | null
          settlement_status?:
            | Database["public"]["Enums"]["settlement_status"]
            | null
          start_date?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_fee?: number | null
          terms_accepted?: boolean | null
          total_amount?: number | null
          trailer_id?: string | null
          trip_notes?: string | null
          trip_plan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_trailer_id_fkey"
            columns: ["trailer_id"]
            isOneToOne: false
            referencedRelation: "trailers"
            referencedColumns: ["id"]
          },
        ]
      }
      season_descriptions: {
        Row: {
          description: string
          season: string
          updated_at: string
        }
        Insert: {
          description?: string
          season: string
          updated_at?: string
        }
        Update: {
          description?: string
          season?: string
          updated_at?: string
        }
        Relationships: []
      }
      trailers: {
        Row: {
          created_at: string
          equipment: Json | null
          full_description: string | null
          id: string
          image_url: string | null
          name: string
          short_description: string | null
          sleeping_places: number | null
          slug: string
          specifications: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment?: Json | null
          full_description?: string | null
          id?: string
          image_url?: string | null
          name: string
          short_description?: string | null
          sleeping_places?: number | null
          slug: string
          specifications?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment?: Json | null
          full_description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          short_description?: string | null
          sleeping_places?: number | null
          slug?: string
          specifications?: Json | null
          status?: string
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      vignette_links: {
        Row: {
          active: boolean
          country: string
          created_at: string
          description: string | null
          id: string
          open_in_new_tab: boolean
          sort_order: number
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          country: string
          created_at?: string
          description?: string | null
          id?: string
          open_in_new_tab?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          open_in_new_tab?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_blocked_dates: {
        Row: {
          client_visible_as_unavailable: boolean | null
          end_date: string | null
          id: string | null
          start_date: string | null
          trailer_id: string | null
        }
        Insert: {
          client_visible_as_unavailable?: boolean | null
          end_date?: string | null
          id?: string | null
          start_date?: string | null
          trailer_id?: string | null
        }
        Update: {
          client_visible_as_unavailable?: boolean | null
          end_date?: string | null
          id?: string | null
          start_date?: string | null
          trailer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_trailer_id_fkey"
            columns: ["trailer_id"]
            isOneToOne: false
            referencedRelation: "trailers"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "user"
      contact_status: "nowa" | "odczytana" | "zamknieta"
      payment_method: "blik" | "przelew" | "gotowka" | "karta" | "inne"
      payment_status:
        | "oczekuje"
        | "wplacono"
        | "po_terminie"
        | "zwrocono"
        | "anulowano"
      payment_type:
        | "zadatek"
        | "doplata"
        | "pelna_platnosc"
        | "dodatki"
        | "oplata_serwisowa"
        | "inne"
      reservation_status:
        | "zapytanie"
        | "oczekuje"
        | "potwierdzona"
        | "anulowana"
        | "zakonczona"
        | "telefoniczna"
        | "oczekuje_na_zadatek"
        | "oplacona"
        | "wydana"
        | "zwrocona"
        | "rozliczona"
      settlement_status:
        | "brak_wplat"
        | "zadatek_wplacony"
        | "czesciowo_oplacone"
        | "oplacone_w_calosci"
        | "kaucja_pobrana"
        | "kaucja_do_zwrotu"
        | "kaucja_rozliczona"
        | "zamkniete"
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
      contact_status: ["nowa", "odczytana", "zamknieta"],
      payment_method: ["blik", "przelew", "gotowka", "karta", "inne"],
      payment_status: [
        "oczekuje",
        "wplacono",
        "po_terminie",
        "zwrocono",
        "anulowano",
      ],
      payment_type: [
        "zadatek",
        "doplata",
        "pelna_platnosc",
        "dodatki",
        "oplata_serwisowa",
        "inne",
      ],
      reservation_status: [
        "zapytanie",
        "oczekuje",
        "potwierdzona",
        "anulowana",
        "zakonczona",
        "telefoniczna",
        "oczekuje_na_zadatek",
        "oplacona",
        "wydana",
        "zwrocona",
        "rozliczona",
      ],
      settlement_status: [
        "brak_wplat",
        "zadatek_wplacony",
        "czesciowo_oplacone",
        "oplacone_w_calosci",
        "kaucja_pobrana",
        "kaucja_do_zwrotu",
        "kaucja_rozliczona",
        "zamkniete",
      ],
    },
  },
} as const
