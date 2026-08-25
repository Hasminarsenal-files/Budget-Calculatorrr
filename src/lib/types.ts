export type SyncStatus = 'pending' | 'synced' | 'failed' | 'conflict';

export type BudgetType = 
  | 'monthly' 
  | 'weekly'
  | 'travel' 
  | 'vacation' 
  | 'gala' 
  | 'shopping' 
  | 'project' 
  | 'event' 
  | 'wedding' 
  | 'birthday' 
  | 'emergency' 
  | 'savings'
  | 'other';

export type TransactionType = 'expense' | 'income' | 'transfer';

export type BillStatus = 'pending' | 'paid' | 'overdue';

export type RecurringFrequency = 'none' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface BaseSyncEntity {
  local_id?: string;
  server_id?: string;
  sync_status: SyncStatus;
  created_at: string;
  updated_at?: string;
  last_synced_at?: string;
}

export interface UserProfile extends BaseSyncEntity {
  id: string; // Supabase auth UUID
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  currency: string;
  timezone: string;
}

export interface Budget extends BaseSyncEntity {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  budget_type: BudgetType;
  start_date: string;
  end_date?: string;
  total_budget: number;
  spent_amount?: number;
  status: 'active' | 'archived' | 'completed';
}

export interface BudgetCategory extends BaseSyncEntity {
  id: string;
  budget_id: string;
  name: string;
  icon: string;
  color: string;
  planned_amount: number;
  spent_amount?: number;
}

export interface Transaction extends BaseSyncEntity {
  id: string;
  user_id: string;
  budget_id?: string;
  category_id?: string;
  type: TransactionType;
  amount: number;
  description: string;
  transaction_date: string;
  payment_method: string;
  location?: string;
  notes?: string;
}

export interface Income extends BaseSyncEntity {
  id: string;
  user_id: string;
  budget_id?: string;
  source: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Bill extends BaseSyncEntity {
  id: string;
  user_id: string;
  budget_id?: string;
  name: string;
  amount: number;
  due_date: string;
  recurring: RecurringFrequency;
  status: BillStatus;
  notes?: string;
}

export interface SavingsGoal extends BaseSyncEntity {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  icon: string;
  color?: string;
}

export interface Debt extends BaseSyncEntity {
  id: string;
  user_id: string;
  name: string;
  original_amount: number;
  remaining_amount: number;
  due_date?: string;
  minimum_payment: number;
  interest_rate: number; // Percentage, e.g. 5.5
  status: 'active' | 'paid_off';
}

export interface SyncQueueItem {
  id?: number;
  table_name: 'profiles' | 'budgets' | 'budget_categories' | 'transactions' | 'income' | 'bills' | 'savings_goals' | 'debts';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string; // local_id or server_id
  payload: any;
  timestamp: string;
  retry_count: number;
  error_message?: string;
}

export type CatMood = 'happy' | 'saving' | 'warning' | 'rich' | 'sleeping' | 'detective';
