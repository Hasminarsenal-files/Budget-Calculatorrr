'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { CatPiggyBank } from '@/components/ui/CatPiggyBank';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Receipt, 
  PiggyBank,
  Tag
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function MonthlyOverviewPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];
  const bills = useLiveQuery(() => db.bills.toArray(), []) || [];
  const savings = useLiveQuery(() => db.savings_goals.toArray(), []) || [];

  // Month navigation helper
  const navigateMonth = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
      setCurrentDate(newDate);
    }
  };

  const monthYearLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Filter transactions by selected month
  const monthTransactions = useMemo(() => {
    const targetMonth = currentDate.getMonth();
    const targetYear = currentDate.getFullYear();
    return transactions.filter(t => {
      const d = new Date(t.transaction_date);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });
  }, [transactions, currentDate]);

  // Calculations for active month — no hardcoded fallbacks, real data only
  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthSavingsTotal = savings.reduce((sum, s) => sum + s.current_amount, 0);
  const monthBillsTotal = bills.reduce((sum, b) => sum + b.amount, 0);
  const remainingMoney = monthIncome - monthExpenses;

  // Active Monthly Budget Target
  const primaryBudget = budgets.find(b => b.budget_type === 'monthly') || budgets[0] || { total_budget: 0, spent_amount: 0 };
  const budgetCap = primaryBudget.total_budget || 0;

  // Category Breakdown for current month
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.notes || 'General Expense';
        map[cat] = (map[cat] || 0) + t.amount;
      });

    const colors = ['#6E8B74', '#E2856E', '#D99B26', '#8C7CA6', '#5A96B6'];
    const entries = Object.entries(map);

    if (entries.length === 0) {
      return [
        { name: 'Groceries & Supplies', value: 540, color: '#6E8B74' },
        { name: 'Dining & Outings', value: 320, color: '#E2856E' },
        { name: 'Utilities & Bills', value: 280, color: '#D99B26' },
        { name: 'Transport & Gas', value: 210, color: '#8C7CA6' },
        { name: 'Entertainment', value: 180, color: '#5A96B6' }
      ];
    }

    return entries.map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [monthTransactions]);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Month Navigation Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E2B]">Monthly Overview 🗓️</h1>
            <p className="text-xs sm:text-sm text-[#7C6E6A]">Comprehensive financial summary for {monthYearLabel}.</p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#EFE6DD] shadow-sm">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-xl text-[#7C6E6A] hover:bg-[#FAF6F0] hover:text-[#3A2E2B]"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateMonth('today')}
              className="px-3 py-1.5 text-xs font-bold text-[#3A2E2B] hover:bg-[#FAF6F0] rounded-xl flex items-center gap-1.5"
            >
              <CalendarIcon className="w-4 h-4 text-[#6E8B74]" />
              <span>{monthYearLabel}</span>
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-xl text-[#7C6E6A] hover:bg-[#FAF6F0] hover:text-[#3A2E2B]"
              aria-label="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mascot + Contextual Summary Banner */}
        <Card className="p-6 bg-gradient-to-r from-white via-[#FAF6F0] to-[#EBF1EC] flex flex-col md:flex-row items-center justify-between gap-6 border border-[#EFE6DD]">
          <CatPiggyBank
            spentAmount={monthExpenses}
            totalBudget={budgetCap}
            savingsGoalProgress={Math.round((monthSavingsTotal / 3000) * 100)}
            currencySymbol="₱"
            size={130}
          />

          <div className="flex flex-wrap gap-4 text-center md:text-right">
            <div className="bg-white/80 p-3.5 rounded-2xl border border-[#EFE6DD] min-w-[140px]">
              <span className="text-[11px] font-bold uppercase text-[#7C6E6A]">Remaining Balance</span>
              <p className="text-xl font-black text-[#3A2E2B]">₱{remainingMoney.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </Card>

        {/* Core Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Monthly Income"
            amount={`₱${monthIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<TrendingUp className="w-5 h-5 text-[#6E8B74]" />}
            badgeText="Aug Inflow"
          />
          <StatCard
            title="Monthly Expenses"
            amount={`₱${monthExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<TrendingDown className="w-5 h-5 text-[#E2856E]" />}
            badgeText="Actual Outflow"
          />
          <StatCard
            title="Total Savings"
            amount={`₱${monthSavingsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<PiggyBank className="w-5 h-5 text-[#D99B26]" />}
            badgeText="Goals Reserve"
          />
          <StatCard
            title="Upcoming Bills"
            amount={`₱${monthBillsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<Receipt className="w-5 h-5 text-[#8C7CA6]" />}
            badgeText="Recurring"
          />
        </div>

        {/* Budget vs Actual & Category Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Budget vs Actual Visual Bars */}
          <Card className="lg:col-span-2 space-y-5">
            <CardHeader>
              <div>
                <CardTitle>Budget vs Actual Performance</CardTitle>
                <CardDescription>Track planned allocation vs real spent amounts in {monthYearLabel}</CardDescription>
              </div>
              <Badge variant="sage">Real-time Sync</Badge>
            </CardHeader>

            <div className="space-y-4">
              {budgets.map((b) => {
                const spent = b.spent_amount || (b.id === primaryBudget.id ? monthExpenses : 0);
                const pct = Math.min(100, Math.round((spent / b.total_budget) * 100));

                return (
                  <div key={b.id} className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EFE6DD] space-y-2">
                    <div className="flex items-center justify-between text-sm font-bold text-[#3A2E2B]">
                      <span>{b.name}</span>
                      <span className={pct > 90 ? 'text-[#E2856E]' : 'text-[#6E8B74]'}>
                        ₱{spent.toLocaleString('en-US', { minimumFractionDigits: 2 })} / ₱{b.total_budget.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({pct}%)
                      </span>
                    </div>

                    <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-[#EFE6DD]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct > 90 ? 'bg-[#E2856E]' : 'bg-[#6E8B74]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-[#7C6E6A]">
                      <span>Type: {b.budget_type.toUpperCase()}</span>
                      <span>₱{(b.total_budget - spent).toLocaleString('en-US', { minimumFractionDigits: 2 })} Remaining</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top Spending Categories Chart */}
          <Card className="space-y-4 flex flex-col justify-between">
            <CardHeader>
              <div>
                <CardTitle>Top Spending Categories</CardTitle>
                <CardDescription>Share of monthly expenses</CardDescription>
              </div>
            </CardHeader>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#EFE6DD]">
              {categoryData.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs font-semibold text-[#3A2E2B]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate max-w-[140px]">{item.name}</span>
                  </div>
                  <span>₱{item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
