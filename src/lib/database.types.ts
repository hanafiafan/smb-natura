export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          category: string | null;
          code: string;
          created_at: string;
          id: number;
          is_active: boolean;
          name: string;
          section: Database["public"]["Enums"]["account_section"];
          sign: number;
          sort_order: number;
        };
        Insert: {
          category?: string | null;
          code: string;
          created_at?: string;
          id?: number;
          is_active?: boolean;
          name: string;
          section: Database["public"]["Enums"]["account_section"];
          sign?: number;
          sort_order?: number;
        };
        Update: {
          category?: string | null;
          code?: string;
          created_at?: string;
          id?: number;
          is_active?: boolean;
          name?: string;
          section?: Database["public"]["Enums"]["account_section"];
          sign?: number;
          sort_order?: number;
        };
        Relationships: [];
      };
      branches: {
        Row: {
          created_at: string;
          id: number;
          is_active: boolean;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          is_active?: boolean;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          account_id: number;
          amount: number;
          branch_id: number;
          created_at: string;
          description: string | null;
          id: string;
          reference: string | null;
          txn_date: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          account_id: number;
          amount: number;
          branch_id: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          reference?: string | null;
          txn_date: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          account_id?: number;
          amount?: number;
          branch_id?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          reference?: string | null;
          txn_date?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      account_section:
        | "revenue"
        | "cogs"
        | "opex"
        | "non_op_income"
        | "non_op_expense"
        | "tax";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type AccountSection = Database["public"]["Enums"]["account_section"];
export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Branch = Database["public"]["Tables"]["branches"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
