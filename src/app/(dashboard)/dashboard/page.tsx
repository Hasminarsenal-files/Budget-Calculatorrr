'use client';

import React, { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CatPiggyBank } from '@/components/ui/CatPiggyBank';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/db';
import { Transaction, Budget, SavingsGoal, Bill } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Plus, 
  ArrowRight,
  Plane,
  Receipt,
  Tag,
  CreditCard,
  CalendarDays
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import Link from 'next/link';

export default function DashboardPage() {
  const { profile } = useAuth();
  
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];
  const savings = useLiveQuery(() => db.savings_goals.toArray(), []) || [];
  const bills = useLiveQuery(() => db.bills.toArray(), []) || [];

  // Seed sample initial data if completely empty
  useEffect(() => {
    async function seedInitialData() {
      const budgetCount = await db.budgets.count();
      if (budgetCount === 0 && profile) {
        const now = new Date().toISOString();
        const initialBudgets: Budget[] = [
          {
            id: 'b-1',
            user_id: profile.id,
            name: 'Monthly Household Budget',
            budget_type: 'monthly',
            total_budget: 4500,
            spent_amount: 1850,
            start_date: new Date().toISOString().slice(0, 10),
            status: 'active',
            sync_status: 'synced',
            created_at: now
          },
          {
            id: 'b-2',
            user_id: profile.id,
            name: 'Cebu Island Trip 🏝️',
            budget_type: 'travel',
            total_budget: 2500,
            spent_amount: 920,
            start_date: new Date().toISOString().slice(0, 10),
            status: 'active',
            sync_status: 'synced',
            created_at: now
          }
        ];
        await db.budgets.bulkPut(initialBudgets);

        const txCount = await db.transactions.count();
        if (txCount === 0) {
          const sampleTx: Transaction[] = [
            {
              id: 'tx-1',
              user_id: profile.id,
              budget_id: 'b-1',
              description: 'Supermarket Grocery & Food',
              amount: 145.50,
              type: 'expense',
              payment_method: 'GCash',
              transaction_date: new Date(Date.now() - 86400000).toISOString(),
              sync_status: 'synced',
              created_at: now
            },
            {
              id: 'tx-2',
              user_id: profile.id,
              description: 'Primary Salary Direct Deposit',
              amount: 3800.00,
              type: 'income',
              payment_method: 'Bank Transfer',
              transaction_date: new Date(Date.now() - 172800000).toISOString(),
              sync_status: 'synced',
              created_at: now
            }
          ];
          await db.transactions.bulkPut(sampleTx);
        }

        const billCount = await db.bills.count();
        if (billCount === 0) {
          await db.bills.bulkPut([
            {
              id: 'bill-1',
              user_id: profile.id,
              name: 'Electricity & Utility',
              amount: 120.00,
              due_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
              recurring: 'monthly',
              status: 'pending',
              sync_status: 'synced',
              created_at: now
            },
            {
              id: 'bill-2',
              user_id: profile.id,
              name: 'Fiber Internet Subscription',
              amount: 65.00,
              due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
              recurring: 'monthly',
              status: 'pending',
              sync_status: 'synced',
              created_at: now
            }
          ]);
        }

        const savingsCount = await db.savings_goals.count();
        if (savingsCount === 0) {
          await db.savings_goals.put({
            id: 'sg-1',
            user_id: profile.id,
            name: 'New Laptop & Desk Setup',
            target_amount: 3000,
            current_amount: 1950,
            target_date: '2026-12-31',
            icon: 'Laptop',
            sync_status: 'synced',
            created_at: now
          });
        }
      }
    }
    seedInitialData();
  }, [profile]);

  // ─── Calculations (single source of truth: actual transactions) ───
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Current-month transactions only
  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.transaction_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // All-time totals (Total Balance = Income - Expenses - Savings allocated)
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = savings.reduce((sum, s) => sum + s.current_amount, 0);
  const totalBalance = totalIncome - totalExpense - totalSavings;

  // Current-month totals (Remaining Balance = income - expenses - savings)
  const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const remainingBalance = monthIncome - monthExpense - totalSavings;

  // Budget cap from primary monthly budget
  const primaryBudget = budgets.find(b => b.budget_type === 'monthly') || budgets[0] || { total_budget: 0, spent_amount: 0 };
  const budgetCap = primaryBudget.total_budget || 0;
  const budgetUsedPct = budgetCap > 0 ? Math.round((monthExpense / budgetCap) * 100) : 0;

  const topGoal = savings[0] || { name: 'Savings Reserve', current_amount: 0, target_amount: 1 };
  const goalProgressPct = topGoal.target_amount > 0 ? Math.round((topGoal.current_amount / topGoal.target_amount) * 100) : 0;

  // Trend chart — previous months hardcoded for demo, current month from real data
  const trendData = [
    { month: 'May', Income: 3200, Expense: 2100 },
    { month: 'Jun', Income: 3800, Expense: 2400 },
    { month: 'Jul', Income: 4100, Expense: 2700 },
    { month: now.toLocaleDateString('en-US', { month: 'short' }), Income: totalIncome, Expense: totalExpense }
  ];

  // Pie chart — built from real current-month expense transactions
  const categoryMap: Record<string, number> = {};
  monthTransactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.notes || t.description || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
  });
  const pieColors = ['#6E8B74', '#E2856E', '#D99B26', '#8C7CA6', '#5A96B6'];
  const categoryPieData = Object.entries(categoryMap).length > 0
    ? Object.entries(categoryMap).map(([name, value], i) => ({ name, value, color: pieColors[i % pieColors.length] }))
    : [
        { name: 'Groceries & Dining', value: 450, color: '#6E8B74' },
        { name: 'Travel & Trips', value: 380, color: '#E2856E' },
        { name: 'Bills & Subscriptions', value: 185, color: '#D99B26' },
        { name: 'Savings Reserve', value: 850, color: '#5A96B6' }
      ];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Animated Cat Piggy Bank Mascot Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE6DD] shadow-warm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 z-10 w-full md:w-auto">
            <Badge variant="sage" dot>Smart Personal Finance • Budget Cat</Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E2B] tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-xs sm:text-sm text-[#7C6E6A] max-w-lg">
              Monitor your total balance, monthly spending caps, active event budgets, and upcoming bill due dates in real-time.
            </p>
          </div>

          <CatPiggyBank
            spentAmount={totalExpense}
            totalBudget={primaryBudget.total_budget}
            savingsGoalProgress={goalProgressPct}
            currencySymbol="₱"
            size={140}
          />
        </div>

        {/* Level 1: Primary Financial Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Balance"
            amount={`₱${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            change={totalBalance >= 0 ? 'Spendable' : 'Deficit'}
            changeType={totalBalance >= 0 ? 'positive' : 'negative'}
            catMood="rich"
            badgeText="After Savings"
          />
          <StatCard
            title="Monthly Income"
            amount={`₱${monthIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<TrendingUp className="w-5 h-5 text-[#6E8B74]" />}
            changeType="positive"
            badgeText="This Month"
          />
          <StatCard
            title="Monthly Expenses"
            amount={`₱${monthExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<TrendingDown className="w-5 h-5 text-[#E2856E]" />}
            changeType="negative"
            badgeText="This Month"
          />
          <StatCard
            title="Total Savings"
            amount={`₱${savings.reduce((sum, s) => sum + s.current_amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<PiggyBank className="w-5 h-5 text-[#D99B26]" />}
            change={`${goalProgressPct}% goal reached`}
            changeType="positive"
            catMood="saving"
            badgeText="Goals Reserve"
          />
        </div>

        {/* Level 2: Spending Overview Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Income vs Expense Area Chart */}
          <Card className="lg:col-span-2 space-y-4">
            <CardHeader>
              <div>
                <CardTitle>Cashflow & Trend Overview</CardTitle>
                <CardDescription>Monthly comparison of income vs expenses</CardDescription>
              </div>
              <Link href="/monthly">
                <Button variant="ghost" size="sm">Monthly View →</Button>
              </Link>
            </CardHeader>

            <div className="h-64 sm:h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6E8B74" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6E8B74" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E2856E" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#E2856E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#7C6E6A" fontSize={12} tickLine={false} />
                  <YAxis stroke="#7C6E6A" fontSize={12} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid #EFE6DD' }} />
                  <Area type="monotone" dataKey="Income" stroke="#6E8B74" strokeWidth={3} fillOpacity={1} fill="url(#incGrad)" />
                  <Area type="monotone" dataKey="Expense" stroke="#E2856E" strokeWidth={3} fillOpacity={1} fill="url(#expGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Expense Category Pie */}
          <Card className="space-y-4 flex flex-col justify-between">
            <CardHeader>
              <div>
                <CardTitle>Spending Share</CardTitle>
                <CardDescription>Category distribution</CardDescription>
              </div>
            </CardHeader>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#EFE6DD]">
              {categoryPieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs font-semibold text-[#3A2E2B]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span>₱{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Level 3: Active Budgets, Goals, and Upcoming Bills */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Budgets Card */}
          <Card className="space-y-4 lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Active Budgets</CardTitle>
                <CardDescription>Monthly & Event Trackers (Cebu Trip, Vacation)</CardDescription>
              </div>
              <Link href="/budgets">
                <Button variant="outline" size="sm">+ New Budget</Button>
              </Link>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {budgets.map((b) => {
                const spent = b.spent_amount || 0;
                const pct = Math.min(100, Math.round((spent / b.total_budget) * 100));

                return (
                  <div key={b.id} className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EFE6DD] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-[#EBF1EC] text-[#6E8B74] rounded-xl">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#3A2E2B]">{b.name}</p>
                          <Badge variant="sage" size="sm">{b.budget_type.toUpperCase()}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-[#7C6E6A]">
                        <span>Spent: ₱{spent.toLocaleString()}</span>
                        <span>Cap: ₱{b.total_budget.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-[#EFE6DD]">
                        <div className="bg-[#6E8B74] h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Upcoming Bills & Subscriptions Widget */}
          <Card className="space-y-4">
            <CardHeader>
              <div>
                <CardTitle>Upcoming Bills</CardTitle>
                <CardDescription>Due in next 7 days</CardDescription>
              </div>
              <Link href="/calendar">
                <Button variant="ghost" size="sm">Calendar →</Button>
              </Link>
            </CardHeader>

            <div className="space-y-3">
              {bills.map((b) => (
                <div key={b.id} className="bg-[#FAF6F0] p-3 rounded-2xl border border-[#EFE6DD] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-4 h-4 text-[#8C7CA6]" />
                    <div>
                      <p className="font-bold text-[#3A2E2B]">{b.name}</p>
                      <p className="text-[10px] text-[#7C6E6A]">Due {b.due_date}</p>
                    </div>
                  </div>
                  <span className="font-black text-[#3A2E2B]">₱{b.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Level 4: Recent Transactions Detailed Table */}
        <Card className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>IndexedDB local transactions</CardDescription>
            </div>
            <Link href="/transactions">
              <Button variant="ghost" size="sm">View All →</Button>
            </Link>
          </CardHeader>

          <div className="divide-y divide-[#EFE6DD]">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${tx.type === 'expense' ? 'bg-[#FDF1EE] text-[#E2856E]' : 'bg-[#EBF1EC] text-[#6E8B74]'}`}>
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-[#3A2E2B]">{tx.description}</p>
                    <p className="text-[11px] text-[#7C6E6A]">{new Date(tx.transaction_date).toLocaleDateString()} • {tx.payment_method}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-black ${tx.type === 'expense' ? 'text-[#E2856E]' : 'text-[#6E8B74]'}`}>
                    {tx.type === 'expense' ? '-' : '+'}₱{tx.amount.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-[#7C6E6A]">
                    {tx.sync_status === 'pending' ? 'Saved Offline 📱' : 'Synced ☁️'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
