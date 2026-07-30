export type AccountSection =
  | "revenue"
  | "cogs"
  | "opex"
  | "non_op_income"
  | "non_op_expense"
  | "tax";

export type Account = {
  id: number;
  code: string;
  name: string;
  section: AccountSection;
  category: string | null;
  sign: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Branch = {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  txn_date: string;
  account_id: number;
  branch_id: number;
  amount: number;
  description: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionWithRelations = Transaction & {
  accounts: Pick<Account, "code" | "name" | "section" | "category"> | null;
  branches: Pick<Branch, "name"> | null;
};
