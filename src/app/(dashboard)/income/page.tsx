'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/db';
import { syncManager } from '@/lib/sync/syncManager';
import { Income } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { TrendingUp, Plus, DollarSign, Calendar, Trash2 } from 'lucide-react';

export default function IncomePage() {
  const { profile } = useAuth();
  const incomeList = useLiveQuery(() => db.income.toArray(), []) || [];
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalIncomeAmount = incomeList.reduce((sum, item) => sum + item.amount, 0);

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !amount || !profile) return;
    setIsSubmitting(true);

    try {
      const newId = 'inc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
      const now = new Date().toISOString();

      const newIncome: Income = {
        id: newId,
        user_id: profile.id,
        source,
        amount: parseFloat(amount),
        date,
        notes,
        sync_status: 'pending',
        created_at: now
      };

      await db.income.put(newIncome);
      await syncManager.queueChange('income', 'INSERT', newId, newIncome);

      // Also record as income transaction
      const txId = 'tx-' + Date.now();
      const newTx = {
        id: txId,
        user_id: profile.id,
        description: `Income: ${source}`,
        amount: parseFloat(amount),
        type: 'income' as const,
        payment_method: 'Bank Deposit',
        transaction_date: now,
        sync_status: 'pending' as const,
        created_at: now
      };
      await db.transactions.put(newTx);
      await syncManager.queueChange('transactions', 'INSERT', txId, newTx);

      setSource('');
      setAmount('');
      setNotes('');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error adding income:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    await db.income.delete(id);
    await syncManager.queueChange('income', 'DELETE', id, null);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E2B]">Income Streams 💰</h1>
            <p className="text-xs sm:text-sm text-[#7C6E6A]">Track salary, freelancing, investments, side hustles, and business revenue.</p>
          </div>
          <Button variant="sage" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            Add Income Source
          </Button>
        </div>

        {/* Total Income Stat Banner */}
        <Card className="bg-[#EBF1EC] border-[#D1E2D4] p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#6E8B74] text-white rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#6E8B74] uppercase tracking-wider">Total Recorded Income</p>
              <h2 className="text-3xl font-black text-[#3A2E2B]">${totalIncomeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            </div>
          </div>
          <Badge variant="sage">Active Streams</Badge>
        </Card>

        {/* Income Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {incomeList.map((inc) => (
            <Card key={inc.id} className="space-y-4 hover:border-[#6E8B74]/50 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#EBF1EC] text-[#6E8B74] rounded-2xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#3A2E2B]">{inc.source}</h3>
                    <p className="text-xs text-[#7C6E6A]">{inc.notes || 'Direct Deposit'}</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteIncome(inc.id)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-3 border-t border-[#EFE6DD] flex items-center justify-between">
                <span className="text-xs text-[#7C6E6A]">{inc.date}</span>
                <span className="text-xl font-black text-[#6E8B74]">+${inc.amount.toLocaleString()}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Income Source">
          <form onSubmit={handleAddIncome} className="space-y-4">
            <Input label="Income Source" placeholder="e.g. Primary Salary, Freelance Design" value={source} onChange={(e) => setSource(e.target.value)} required />
            <Input label="Amount ($)" type="number" step="0.01" placeholder="3500.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <Input label="Notes" placeholder="Additional details..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="sage" isLoading={isSubmitting}>Save Income Stream 🐾</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
