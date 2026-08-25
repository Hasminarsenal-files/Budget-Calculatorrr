'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Input } from '@/components/ui/Input';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, PiggyBank, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'last_month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter transactions based on timeframe
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(tx => {
      const txDate = new Date(tx.transaction_date);

      if (timeframe === 'week') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
        return txDate >= sevenDaysAgo;
      }
      if (timeframe === 'month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      if (timeframe === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return txDate.getMonth() === lastMonth.getMonth() && txDate.getFullYear() === lastMonth.getFullYear();
      }
      if (timeframe === 'year') {
        return txDate.getFullYear() === now.getFullYear();
      }
      if (timeframe === 'custom' && startDate && endDate) {
        return txDate >= new Date(startDate) && txDate <= new Date(endDate);
      }
      return true;
    });
  }, [transactions, timeframe, startDate, endDate]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 3800;
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 1065.50;
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const monthlyBarData = [
    { month: 'Jan', Income: 3200, Expense: 2100 },
    { month: 'Feb', Income: 3500, Expense: 2300 },
    { month: 'Mar', Income: 4000, Expense: 2500 },
    { month: 'Apr', Income: 3800, Expense: 2200 },
    { month: 'May', Income: 4200, Expense: 2600 },
    { month: 'Jun', Income: 4100, Expense: 2400 },
    { month: 'Jul', Income: 4300, Expense: 2700 },
    { month: 'Aug', Income: totalIncome, Expense: totalExpense }
  ];

  const categoryBreakdownData = [
    { name: 'Groceries & Dining', value: 650, color: '#6E8B74' },
    { name: 'Travel & Trips', value: 850, color: '#E2856E' },
    { name: 'Bills & Utilities', value: 340, color: '#D99B26' },
    { name: 'Personal & Gala', value: 240, color: '#8C7CA6' },
    { name: 'Savings & Reserve', value: 1200, color: '#5A96B6' }
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E2B]">Financial Reports & Performance 📊</h1>
            <p className="text-xs sm:text-sm text-[#7C6E6A]">Income, expense, savings, and category distribution analysis.</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#EFE6DD] shadow-sm">
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === 'week' ? 'bg-[#6E8B74] text-white shadow-sm' : 'text-[#7C6E6A]'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === 'month' ? 'bg-[#6E8B74] text-white shadow-sm' : 'text-[#7C6E6A]'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeframe('last_month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === 'last_month' ? 'bg-[#6E8B74] text-white shadow-sm' : 'text-[#7C6E6A]'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setTimeframe('year')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === 'year' ? 'bg-[#6E8B74] text-white shadow-sm' : 'text-[#7C6E6A]'
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => setTimeframe('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === 'custom' ? 'bg-[#6E8B74] text-white shadow-sm' : 'text-[#7C6E6A]'
              }`}
            >
              Custom Range
            </button>
          </div>
        </div>

        {/* Custom Range Selector Row */}
        {timeframe === 'custom' && (
          <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center">
            <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Card>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Savings Rate" amount={`${savingsRate}%`} change="+4.2%" changeType="positive" catMood="happy" badgeText="Velocity" />
          <StatCard title="Net Cashflow" amount={`₱${netSavings.toLocaleString()}`} changeType="positive" icon={<TrendingUp className="w-5 h-5 text-[#6E8B74]" />} />
          <StatCard title="Avg Daily Spend" amount={`₱${(totalExpense / 30).toFixed(2)}`} changeType="neutral" icon={<TrendingDown className="w-5 h-5 text-[#E2856E]" />} />
          <StatCard title="Top Category" amount="Travel & Trips" subtitle="32% of expenses" catMood="saving" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Comparison Bar Chart */}
          <Card className="space-y-4">
            <CardHeader>
              <div>
                <CardTitle>Income vs Expenses</CardTitle>
                <CardDescription>Comparative spending performance</CardDescription>
              </div>
              <Badge variant="sage">Historical View</Badge>
            </CardHeader>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#7C6E6A" fontSize={12} tickLine={false} />
                  <YAxis stroke="#7C6E6A" fontSize={12} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid #EFE6DD' }} />
                  <Bar dataKey="Income" fill="#6E8B74" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Expense" fill="#E2856E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Spending Distribution Pie Chart */}
          <Card className="space-y-4">
            <CardHeader>
              <div>
                <CardTitle>Category Spend Distribution</CardTitle>
                <CardDescription>Proportional expense share</CardDescription>
              </div>
              <Badge variant="peach">Distribution</Badge>
            </CardHeader>

            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {categoryBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
