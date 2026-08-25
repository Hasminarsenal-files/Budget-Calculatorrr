'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/db';
import { syncManager } from '@/lib/sync/syncManager';
import { Transaction, TransactionType } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ArrowLeftRight, 
  Plus, 
  Search, 
  Trash2, 
  Filter,
  CheckCircle2,
  WifiOff,
  Tag,
  CreditCard,
  ArrowUpDown
} from 'lucide-react';

export default function TransactionsPage() {
  const { profile } = useAuth();
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];

  // Filter & Search Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [budgetId, setBudgetId] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advanced Multi-Criteria Filter & Sort
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    // 1. Search text
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(tx => 
        tx.description.toLowerCase().includes(term) ||
        (tx.notes && tx.notes.toLowerCase().includes(term)) ||
        (tx.location && tx.location.toLowerCase().includes(term))
      );
    }

    // 2. Type filter
    if (filterType !== 'all') {
      result = result.filter(tx => tx.type === filterType);
    }

    // 3. Payment method filter
    if (filterPayment !== 'all') {
      result = result.filter(tx => tx.payment_method === filterPayment);
    }

    // 4. Date range filter
    if (filterDateRange !== 'all') {
      const now = new Date();
      result = result.filter(tx => {
        const txDate = new Date(tx.transaction_date);
        if (filterDateRange === 'today') {
          return txDate.toDateString() === now.toDateString();
        } else if (filterDateRange === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
          return txDate >= sevenDaysAgo;
        } else if (filterDateRange === 'month') {
          return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // 5. Sorting
    result.sort((a, b) => {
      const timeA = new Date(a.transaction_date).getTime();
      const timeB = new Date(b.transaction_date).getTime();
      if (sortBy === 'newest') return timeB - timeA;
      if (sortBy === 'oldest') return timeA - timeB;
      if (sortBy === 'highest') return b.amount - a.amount;
      if (sortBy === 'lowest') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, searchTerm, filterType, filterPayment, filterDateRange, sortBy]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || !profile) return;
    setIsSubmitting(true);

    try {
      const newId = 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
      const now = new Date().toISOString();

      const newTx: Transaction = {
        id: newId,
        user_id: profile.id,
        budget_id: budgetId || undefined,
        description: desc,
        amount: parseFloat(amount),
        type,
        payment_method: paymentMethod,
        location,
        notes,
        transaction_date: now,
        sync_status: 'pending',
        created_at: now
      };

      await db.transactions.put(newTx);
      await syncManager.queueChange('transactions', 'INSERT', newId, newTx);

      if (budgetId && type === 'expense') {
        const targetBudget = await db.budgets.get(budgetId);
        if (targetBudget) {
          const updatedSpent = (targetBudget.spent_amount || 0) + parseFloat(amount);
          await db.budgets.update(budgetId, { spent_amount: updatedSpent });
          await syncManager.queueChange('budgets', 'UPDATE', budgetId, { ...targetBudget, spent_amount: updatedSpent });
        }
      }

      setDesc('');
      setAmount('');
      setLocation('');
      setNotes('');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error adding transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTx = async (txId: string) => {
    await db.transactions.delete(txId);
    await syncManager.queueChange('transactions', 'DELETE', txId, null);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E2B]">Transactions History 🐾</h1>
            <p className="text-xs sm:text-sm text-[#7C6E6A]">View, search, filter, and record all expenses and income.</p>
          </div>
          <Button
            variant="sage"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Transaction
          </Button>
        </div>

        {/* Multi-Criteria Filter Toolbar */}
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search description, location, or notes..."
                leftIcon={<Search className="w-4 h-4 text-[#7C6E6A]" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-[#FAF6F0] border border-[#EFE6DD] text-[#3A2E2B] text-xs font-bold rounded-2xl px-3 py-2.5"
              >
                <option value="all">All Types</option>
                <option value="expense">Expenses Only</option>
                <option value="income">Income Only</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="w-full bg-[#FAF6F0] border border-[#EFE6DD] text-[#3A2E2B] text-xs font-bold rounded-2xl px-3 py-2.5"
              >
                <option value="all">All Payment Methods</option>
                <option value="GCash">GCash</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-[#FAF6F0] border border-[#EFE6DD] text-[#3A2E2B] text-xs font-bold rounded-2xl px-3 py-2.5"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Transactions Table & Mobile Cards */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF6F0] border-b border-[#EFE6DD] text-xs uppercase font-bold text-[#7C6E6A]">
                <tr>
                  <th className="px-6 py-4">Transaction</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Sync Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE6DD]">
                {processedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FAF6F0]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#3A2E2B]">{tx.description}</div>
                      <div className="text-xs text-[#7C6E6A]">
                        {new Date(tx.transaction_date).toLocaleString()} {tx.location ? `• ${tx.location}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={tx.type === 'expense' ? 'peach' : 'sage'} size="sm">
                        {tx.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-[#7C6E6A]">
                      {tx.payment_method}
                    </td>
                    <td className="px-6 py-4 font-black">
                      <span className={tx.type === 'expense' ? 'text-[#E2856E]' : 'text-[#6E8B74]'}>
                        {tx.type === 'expense' ? '-' : '+'}₱{tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tx.sync_status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[#E2856E] font-semibold bg-[#FDF1EE] px-2.5 py-1 rounded-full">
                          <WifiOff className="w-3 h-3" /> Saved Offline
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-[#6E8B74] font-semibold bg-[#EBF1EC] px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Synced
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteTx(tx.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record New Transaction"
          description="Log income or spending instantly."
        >
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="flex bg-[#FAF6F0] p-1 rounded-2xl border border-[#EFE6DD]">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  type === 'expense' ? 'bg-[#E2856E] text-white shadow-sm' : 'text-[#7C6E6A]'
                }`}
              >
                Expense 💸
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  type === 'income' ? 'bg-[#6E8B74] text-white shadow-sm' : 'text-[#7C6E6A]'
                }`}
              >
                Income 💰
              </button>
            </div>

            <Input
              label="Description"
              placeholder="e.g. Grocery, Flight Ticket, Freelance"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount (₱)"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />

              <div>
                <label className="text-xs font-semibold text-[#3A2E2B] mb-1.5 block">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white border border-[#EFE6DD] text-[#3A2E2B] rounded-2xl px-4 py-2.5 text-sm"
                >
                  <option value="GCash">GCash</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="From Savings">From Savings</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#3A2E2B] mb-1.5 block">Assign to Budget (Optional)</label>
              <select
                value={budgetId}
                onChange={(e) => setBudgetId(e.target.value)}
                className="w-full bg-white border border-[#EFE6DD] text-[#3A2E2B] rounded-2xl px-4 py-2.5 text-sm"
              >
                <option value="">-- No specific budget --</option>
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} (₱{b.total_budget})</option>
                ))}
              </select>
            </div>

            <Input
              label="Location / Vendor (Optional)"
              placeholder="e.g. SM Supermarket, Starbucks"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EFE6DD]">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant={type === 'expense' ? 'peach' : 'sage'} isLoading={isSubmitting}>
                Save Transaction 🐾
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
