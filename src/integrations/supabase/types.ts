export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type BradoxDatabase = {
  bradox_revenda: {
    Tables: {
      networks: {
        Row: {
          id: string;
          name: string;
          owner_id: string | null;
          slug: string | null;
          status: string;
          legacy_network_hub_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id?: string | null;
          slug?: string | null;
          status?: string;
          legacy_network_hub_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["networks"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          network_id: string | null;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: "admin" | "revenda" | "cliente";
          status: string;
          requested_network_name: string | null;
          approved_at: string | null;
          approved_by: string | null;
          legacy_network_hub_id: string | null;
          legacy_role_raw: string | null;
          legacy_role_mapping_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          network_id?: string | null;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "revenda" | "cliente";
          status?: string;
          requested_network_name?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          legacy_network_hub_id?: string | null;
          legacy_role_raw?: string | null;
          legacy_role_mapping_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["profiles"]["Insert"]>;
      };
      user_hierarchy: {
        Row: {
          id: string;
          network_id: string | null;
          parent_user_id: string | null;
          child_user_id: string | null;
          legacy_network_hub_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          network_id?: string | null;
          parent_user_id?: string | null;
          child_user_id?: string | null;
          legacy_network_hub_id?: string | null;
          created_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["user_hierarchy"]["Insert"]>;
      };
      servers: {
        Row: {
          id: string;
          network_id: string;
          name: string;
          base_url: string | null;
          billing_type: "prepaid" | "postpaid";
          credit_price: number;
          minimum_credits: number;
          status: string;
          metadata: Json;
          legacy_network_hub_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          network_id: string;
          name: string;
          base_url?: string | null;
          billing_type?: "prepaid" | "postpaid";
          credit_price?: number;
          minimum_credits?: number;
          status?: string;
          metadata?: Json;
          legacy_network_hub_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["servers"]["Insert"]>;
      };
      plans: {
        Row: {
          id: string;
          network_id: string;
          server_id: string | null;
          name: string;
          plan_type: string;
          price: number;
          credits: number;
          duration_days: number;
          status: string;
          legacy_network_hub_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          network_id: string;
          server_id?: string | null;
          name: string;
          plan_type?: string;
          price?: number;
          credits?: number;
          duration_days?: number;
          status?: string;
          legacy_network_hub_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["plans"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          network_id: string;
          buyer_id: string | null;
          plan_id: string | null;
          status: string;
          order_type: string;
          amount: number;
          metadata: Json;
          legacy_network_hub_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          network_id: string;
          buyer_id?: string | null;
          plan_id?: string | null;
          status?: string;
          order_type?: string;
          amount?: number;
          metadata?: Json;
          legacy_network_hub_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["orders"]["Insert"]>;
      };
      message_templates: {
        Row: {
          id: string;
          network_id: string;
          name: string;
          category: string | null;
          content: string;
          media: Json | null;
          legacy_network_hub_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          network_id: string;
          name: string;
          category?: string | null;
          content: string;
          media?: Json | null;
          legacy_network_hub_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["message_templates"]["Insert"]>;
      };
      customer_plan_assignments: {
        Row: {
          id: string;
          network_id: string;
          customer_id: string;
          server_id: string | null;
          plan_id: string;
          custom_price: number | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          network_id: string;
          customer_id: string;
          server_id?: string | null;
          plan_id: string;
          custom_price?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["customer_plan_assignments"]["Insert"]>;
      };
      role_definitions: {
        Row: {
          role: "admin" | "revenda" | "cliente";
          label: string;
          description: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          role: "admin" | "revenda" | "cliente";
          label: string;
          description: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["role_definitions"]["Insert"]>;
      };
      role_capabilities: {
        Row: {
          role: "admin" | "revenda" | "cliente";
          capability: string;
          label: string;
          enabled: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          role: "admin" | "revenda" | "cliente";
          capability: string;
          label: string;
          enabled?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["role_capabilities"]["Insert"]>;
      };
      useful_link_categories: {
        Row: {
          id: string;
          network_id: string;
          owner_id: string | null;
          name: string;
          icon: string | null;
          display_order: number;
          status: string;
          legacy_network_hub_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          network_id: string;
          owner_id?: string | null;
          name: string;
          icon?: string | null;
          display_order?: number;
          status?: string;
          legacy_network_hub_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["useful_link_categories"]["Insert"]>;
      };
      useful_links: {
        Row: {
          id: string;
          network_id: string;
          category_id: string | null;
          owner_id: string | null;
          title: string;
          url: string;
          icon: string | null;
          image_url: string | null;
          display_order: number;
          status: string;
          legacy_network_hub_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          network_id: string;
          category_id?: string | null;
          owner_id?: string | null;
          title: string;
          url: string;
          icon?: string | null;
          image_url?: string | null;
          display_order?: number;
          status?: string;
          legacy_network_hub_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["useful_links"]["Insert"]>;
      };
      content_categories: {
        Row: {
          id: string;
          network_id: string;
          owner_id: string | null;
          name: string;
          icon: string | null;
          color: string | null;
          bg: string | null;
          image_url: string | null;
          display_order: number;
          status: string;
          legacy_network_hub_id: string | null;
          legacy_owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          network_id: string;
          owner_id?: string | null;
          name: string;
          icon?: string | null;
          color?: string | null;
          bg?: string | null;
          image_url?: string | null;
          display_order?: number;
          status?: string;
          legacy_network_hub_id?: string | null;
          legacy_owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["content_categories"]["Insert"]>;
      };
      content: {
        Row: {
          id: string;
          network_id: string;
          category_id: string | null;
          created_by: string | null;
          title: string;
          description: string | null;
          body: string | null;
          content_type: "comunicado" | "tutorial" | "aplicativo" | "atualizacao";
          content_url: string | null;
          video_url: string | null;
          images: string[];
          links: Json;
          cta_text: string | null;
          cta_link: string | null;
          status: "draft" | "published" | "archived";
          is_featured: boolean;
          featured_order: number;
          published_at: string | null;
          legacy_network_hub_id: string | null;
          legacy_created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          network_id: string;
          category_id?: string | null;
          created_by?: string | null;
          title: string;
          description?: string | null;
          body?: string | null;
          content_type?: "comunicado" | "tutorial" | "aplicativo" | "atualizacao";
          content_url?: string | null;
          video_url?: string | null;
          images?: string[];
          links?: Json;
          cta_text?: string | null;
          cta_link?: string | null;
          status?: "draft" | "published" | "archived";
          is_featured?: boolean;
          featured_order?: number;
          published_at?: string | null;
          legacy_network_hub_id?: string | null;
          legacy_created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["content"]["Insert"]>;
      };
      payment_provider_settings: {
        Row: {
          id: string;
          network_id: string;
          provider: "mercado_pago" | "updepix" | "manual";
          status: "active" | "inactive";
          display_name: string;
          public_config: Json;
          private_config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          network_id: string;
          provider: "mercado_pago" | "updepix" | "manual";
          status?: "active" | "inactive";
          display_name: string;
          public_config?: Json;
          private_config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["payment_provider_settings"]["Insert"]>;
      };
      manual_payment_receipts: {
        Row: {
          id: string;
          network_id: string;
          order_id: string;
          submitted_by: string | null;
          payer_name: string | null;
          payer_document: string | null;
          receipt_url: string | null;
          receipt_file_name: string | null;
          status: "pending_review" | "approved" | "rejected";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          network_id: string;
          order_id: string;
          submitted_by?: string | null;
          payer_name?: string | null;
          payer_document?: string | null;
          receipt_url?: string | null;
          receipt_file_name?: string | null;
          status?: "pending_review" | "approved" | "rejected";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["manual_payment_receipts"]["Insert"]>;
      };
      migration_batches: {
        Row: {
          id: string;
          source_project: string;
          batch_name: string;
          status: string;
          started_at: string | null;
          finished_at: string | null;
          source_counts: Json;
          target_counts: Json;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_project?: string;
          batch_name: string;
          status?: string;
          started_at?: string | null;
          finished_at?: string | null;
          source_counts?: Json;
          target_counts?: Json;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<BradoxDatabase["bradox_revenda"]["Tables"]["migration_batches"]["Insert"]>;
      };
    };
    Views: {
      network_directory: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          status: string;
          owner_id: string | null;
          owner_email: string | null;
          owner_name: string;
          legacy_network_hub_id: string | null;
          admins_count: number;
          revendas_count: number;
          clientes_count: number;
          servers_count: number;
          plans_count: number;
          templates_count: number;
          orders_count: number;
          open_orders_count: number;
          paid_orders_count: number;
          paid_orders_amount: number;
          active_useful_links_count: number;
          created_at: string;
          updated_at: string;
        };
      };
      network_dashboard_summary: {
        Row: {
          networks_count: number;
          active_networks_count: number;
          admins_count: number;
          revendas_count: number;
          clientes_count: number;
          servers_count: number;
          plans_count: number;
          templates_count: number;
          orders_count: number;
          open_orders_count: number;
          paid_orders_count: number;
          paid_orders_amount: number;
          active_useful_links_count: number;
        };
      };
      customer_directory: {
        Row: {
          id: string;
          network_id: string | null;
          network_name: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          role: "admin" | "revenda" | "cliente";
          status: string;
          created_at: string;
          linked_customers_count: number;
        };
      };
      customer_plan_price_directory: {
        Row: {
          id: string;
          network_id: string;
          customer_id: string;
          customer_name: string;
          server_id: string | null;
          server_name: string | null;
          plan_id: string;
          plan_name: string;
          plan_type: string;
          table_price: number;
          custom_price: number | null;
          effective_price: number;
          discount_amount: number;
          has_custom_price: boolean;
          status: string;
          created_at: string;
          updated_at: string;
        };
      };
      reseller_directory: {
        Row: {
          id: string;
          network_id: string | null;
          network_name: string | null;
          network_slug: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          role: "admin" | "revenda" | "cliente";
          status: string;
          requested_network_name: string | null;
          approved_at: string | null;
          created_at: string;
          linked_customers_count: number;
        };
      };
      reseller_customer_counts: {
        Row: {
          reseller_id: string;
          network_id: string | null;
          network_name: string | null;
          reseller_name: string;
          reseller_email: string | null;
          linked_customers_count: number;
          same_network_customers_count: number;
          unlinked_same_network_customers_count: number;
        };
      };
      reseller_customer_directory: {
        Row: {
          hierarchy_id: string;
          network_id: string | null;
          network_name: string | null;
          reseller_id: string;
          reseller_name: string;
          reseller_email: string | null;
          reseller_status: string;
          customer_id: string;
          customer_name: string;
          customer_email: string | null;
          customer_phone: string | null;
          customer_status: string;
          legacy_network_hub_id: string | null;
          linked_at: string;
        };
      };
      order_billing_directory: {
        Row: {
          id: string;
          network_id: string;
          network_name: string;
          network_owner_id: string | null;
          buyer_id: string | null;
          buyer_name: string;
          buyer_email: string | null;
          buyer_phone: string | null;
          reseller_id: string | null;
          reseller_name: string | null;
          reseller_email: string | null;
          plan_id: string | null;
          plan_name: string | null;
          status: string;
          order_type: string;
          amount: number;
          metadata: Json;
          legacy_network_hub_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      public_revendas: {
        Row: {
          id: string;
          network_id: string | null;
          network_name: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          role: "admin" | "revenda" | "cliente";
          status: string;
          created_at: string;
          clientes_count: number;
        };
      };
      migration_validation_counts: {
        Row: {
          metric: string;
          target_count: number;
          legacy_count: number;
          validation_status: string;
          notes: string;
        };
      };
    };
    Functions: {
      approve_reseller_profile: {
        Args: { profile_id: string };
        Returns: BradoxDatabase["bradox_revenda"]["Tables"]["profiles"]["Row"];
      };
      save_customer_plan_assignments: {
        Args: { target_customer_id: string; assignments: Json };
        Returns: BradoxDatabase["bradox_revenda"]["Views"]["customer_plan_price_directory"]["Row"][];
      };
      save_server: {
        Args: { target_server_id?: string | null; target_network_id?: string | null; target_name?: string | null; target_base_url?: string | null; target_billing_type?: string | null; target_credit_price?: number | null; target_minimum_credits?: number | null; target_status?: string | null };
        Returns: BradoxDatabase["bradox_revenda"]["Tables"]["servers"]["Row"];
      };
      delete_server: {
        Args: { target_server_id: string };
        Returns: void;
      };
      save_plan: {
        Args: { target_plan_id?: string | null; target_network_id?: string | null; target_server_id?: string | null; target_name?: string | null; target_plan_type?: string | null; target_price?: number | null; target_credits?: number | null; target_duration_days?: number | null; target_status?: string | null };
        Returns: BradoxDatabase["bradox_revenda"]["Tables"]["plans"]["Row"];
      };
      delete_plan: {
        Args: { target_plan_id: string };
        Returns: void;
      };
      get_invoice_page: {
        Args: { order_id: string };
        Returns: Array<{
          id: string;
          network_id: string;
          network_name: string;
          customer_name: string;
          customer_email: string | null;
          customer_phone: string | null;
          plan_name: string;
          amount: number;
          table_price: number;
          custom_price: number | null;
          discount_amount: number;
          has_custom_price: boolean;
          status: string;
          due_date: string;
          manual_pix_key: string | null;
          manual_pix_key_type: string | null;
          manual_pix_receiver_name: string | null;
          manual_pix_receiver_city: string | null;
          manual_instructions: string | null;
        }>;
      };
      create_customer_invoice: {
        Args: { target_customer_id: string; target_plan_id: string; due_date?: string | null; notes?: string | null };
        Returns: BradoxDatabase["bradox_revenda"]["Tables"]["orders"]["Row"];
      };
      create_credit_invoice: {
        Args: { target_network_id: string; target_server_id: string; panel_username: string; credit_quantity: number; due_date?: string | null; notes?: string | null };
        Returns: BradoxDatabase["bradox_revenda"]["Tables"]["orders"]["Row"];
      };
      submit_manual_payment_receipt: {
        Args: { order_id: string; payer_name: string; payer_document: string; receipt_file_name: string; receipt_url: string; notes?: string | null };
        Returns: BradoxDatabase["bradox_revenda"]["Tables"]["manual_payment_receipts"]["Row"];
      };
      upsert_payment_provider_setting: {
        Args: { provider: string; status: string; display_name: string; public_config: Json; private_config?: Json };
        Returns: BradoxDatabase["bradox_revenda"]["Tables"]["payment_provider_settings"]["Row"];
      };
    };
    Enums: {
      app_role: "admin" | "revenda" | "cliente";
    };
  };
};