export type AccountSection =
  | "revenue"
  | "cogs"
  | "opex"
  | "non_op_income"
  | "non_op_expense"
  | "tax";

export type UserRole = "super_admin" | "brand_admin";

export type Company = {
  id: number;
  name: string;
  created_at: string;
};

export type Brand = {
  id: number;
  company_id: number;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type AppUser = {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
};

export type Account = {
  id: number;
  brand_id: number;
  code: string;
  name: string;
  section: AccountSection;
  category: string | null;
  sign: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  brand_id: number;
  txn_date: string;
  account_id: number;
  amount: number;
  description: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionWithRelations = Transaction & {
  accounts: Pick<Account, "code" | "name" | "section" | "category"> | null;
};
