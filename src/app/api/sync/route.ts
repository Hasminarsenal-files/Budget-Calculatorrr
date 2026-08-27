import { NextRequest, NextResponse } from 'next/server';

// Server-side in-memory user data store for automatic cross-device sync
// Persists across requests in the active serverless container
interface UserDataStore {
  profiles?: any[];
  budgets?: any[];
  budget_categories?: any[];
  transactions?: any[];
  income?: any[];
  bills?: any[];
  savings_goals?: any[];
  debts?: any[];
  last_updated?: string;
}

const globalStore: Map<string, UserDataStore> = (global as any).__BUDGET_CAT_STORE__ || new Map();
(global as any).__BUDGET_CAT_STORE__ = globalStore;

function getUserKey(userId?: string, email?: string): string {
  if (email && email.trim()) return email.trim().toLowerCase();
  if (userId && userId.trim()) return userId.trim().toLowerCase();
  return 'default-user';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id') || undefined;
    const email = searchParams.get('email') || undefined;

    const key = getUserKey(userId, email);
    const data = globalStore.get(key) || {
      budgets: [],
      budget_categories: [],
      transactions: [],
      income: [],
      bills: [],
      savings_goals: [],
      debts: [],
      profiles: [],
      last_updated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      key,
      data
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, tables } = body;

    const key = getUserKey(userId, email);
    let currentData = globalStore.get(key) || {
      budgets: [],
      budget_categories: [],
      transactions: [],
      income: [],
      bills: [],
      savings_goals: [],
      debts: [],
      profiles: []
    };

    // Helper to merge arrays of items by id
    const mergeById = (existing: any[] = [], incoming: any[] = []) => {
      const map = new Map<string, any>();
      existing.forEach((item) => {
        if (item && item.id) map.set(item.id, item);
      });
      incoming.forEach((item) => {
        if (item && item.id) map.set(item.id, { ...map.get(item.id), ...item });
      });
      return Array.from(map.values());
    };

    if (tables) {
      if (tables.budgets) currentData.budgets = mergeById(currentData.budgets, tables.budgets);
      if (tables.budget_categories) currentData.budget_categories = mergeById(currentData.budget_categories, tables.budget_categories);
      if (tables.transactions) currentData.transactions = mergeById(currentData.transactions, tables.transactions);
      if (tables.income) currentData.income = mergeById(currentData.income, tables.income);
      if (tables.bills) currentData.bills = mergeById(currentData.bills, tables.bills);
      if (tables.savings_goals) currentData.savings_goals = mergeById(currentData.savings_goals, tables.savings_goals);
      if (tables.debts) currentData.debts = mergeById(currentData.debts, tables.debts);
      if (tables.profiles) currentData.profiles = mergeById(currentData.profiles, tables.profiles);
    }

    currentData.last_updated = new Date().toISOString();
    globalStore.set(key, currentData);

    return NextResponse.json({
      success: true,
      key,
      data: currentData
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
