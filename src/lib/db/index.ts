import Dexie, { Table } from 'dexie';
import { 
  UserProfile, 
  Budget, 
  BudgetCategory, 
  Transaction, 
  Income, 
  Bill, 
  SavingsGoal, 
  Debt, 
  SyncQueueItem 
} from '../types';

export class BudgetCatDatabase extends Dexie {
  profiles!: Table<UserProfile, string>;
  budgets!: Table<Budget, string>;
  budget_categories!: Table<BudgetCategory, string>;
  transactions!: Table<Transaction, string>;
  income!: Table<Income, string>;
  bills!: Table<Bill, string>;
  savings_goals!: Table<SavingsGoal, string>;
  debts!: Table<Debt, string>;
  sync_queue!: Table<SyncQueueItem, number>;

  constructor() {
    super('BudgetCatDB');
    this.version(1).stores({
      profiles: 'id, email, sync_status',
      budgets: 'id, local_id, user_id, budget_type, status, sync_status',
      budget_categories: 'id, local_id, budget_id, sync_status',
      transactions: 'id, local_id, user_id, budget_id, category_id, type, transaction_date, sync_status',
      income: 'id, local_id, user_id, budget_id, date, sync_status',
      bills: 'id, local_id, user_id, due_date, status, sync_status',
      savings_goals: 'id, local_id, user_id, sync_status',
      debts: 'id, local_id, user_id, status, sync_status',
      sync_queue: '++id, table_name, action, record_id, timestamp'
    });
  }
}

export const db = new BudgetCatDatabase();
