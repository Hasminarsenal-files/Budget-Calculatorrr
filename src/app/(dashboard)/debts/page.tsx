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
import { Debt } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { CreditCard, Plus, ArrowDownRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function DebtsPage() {
  const { profile } = useAuth();
  const debts = useLiveQuery(() => db.debts.toArray(), []) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const [name, setName] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalRemainingDebt = debts.reduce((sum, d) => sum + d.remaining_amount, 0);

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !originalAmount || !profile) return;
    setIsSubmitting(true);

    try {
      const newId = 'debt-' + Date.now();
      const now = new Date().toISOString();
      const orig = parseFloat(originalAmount);

      const newDebt: Debt = {
        id: newId,
        user_id: profile.id,
        name,
        original_amount: orig,
        remaining_amount: remainingAmount ? parseFloat(remainingAmount) : orig,
        minimum_payment: minimumPayment ? parseFloat(minimumPayment) : 0,
        interest_rate: interestRate ? parseFloat(interestRate) : 0,
        due_date: dueDate,
        status: 'active',
        sync_status: 'pending',
        created_at: now
      };

      await db.debts.put(newDebt);
      await syncManager.queueChange('debts', 'INSERT', newId, newDebt);

      setName('');
      setOriginalAmount('');
      setRemainingAmount('');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error adding debt:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !payAmount || !profile) return;

    const pVal = parseFloat(payAmount);
    const newRemaining = Math.max(0, selectedDebt.remaining_amount - pVal);
    const newStatus = newRemaining === 0 ? 'paid_off' : 'active';

    await db.debts.update(selectedDebt.id, {
      remaining_amount: newRemaining,
      status: newStatus
    });
    await syncManager.queueChange('debts', 'UPDATE', selectedDebt.id, {
      ...selectedDebt,
      remaining_amount: newRemaining,
      status: newStatus
    });

    // Record as expense transaction
    const txId = 'tx-debt-' + Date.now();
    const now = new Date().toISOString();
    const newTx = {
      id: txId,
      user_id: profile.id,
      description: `Debt Payment: ${selectedDebt.name}`,
      amount: pVal,
      type: 'expense' as const,
      payment_method: 'Bank Transfer',
      transaction_date: now,
      sync_status: 'pending' as const,
      created_at: now
    };
    await db.transactions.put(newTx);
    await syncManager.queueChange('transactions', 'INSERT', txId, newTx);

    setPayAmount('');
    setIsPayModalOpen(false);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E2B]">Debts & Loan Tracker 💳</h1>
            <p className="text-xs sm:text-sm text-[#7C6E6A]">Monitor credit card balances, student loans, mortgage, and minimum payments.</p>
          </div>
          <Button variant="peach" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            Add Debt Record
          </Button>
        </div>

        {/* Debt Banner */}
        <Card className="bg-[#FDF1EE] border-[#F8D7CF] p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#E2856E] text-white rounded-2xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#E2856E] uppercase tracking-wider">Total Outstanding Debt</p>
              <h2 className="text-3xl font-black text-[#3A2E2B]">${totalRemainingDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            </div>
          </div>
          <Badge variant="peach">{debts.filter(d => d.status === 'active').length} Active Debts</Badge>
        </Card>

        {/* Debts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {debts.map((d) => {
            const isPaidOff = d.status === 'paid_off' || d.remaining_amount === 0;
            const paidPct = Math.round(((d.original_amount - d.remaining_amount) / d.original_amount) * 100);

            return (
              <Card key={d.id} className="space-y-4 flex flex-col justify-between hover:border-[#E2856E]/50 transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-[#3A2E2B]">{d.name}</h3>
                      <p className="text-xs text-[#7C6E6A]">Interest: {d.interest_rate}% | Min Pay: ${d.minimum_payment}</p>
                    </div>
                    <Badge variant={isPaidOff ? 'sage' : 'peach'}>
                      {isPaidOff ? 'PAID OFF 🎉' : `${paidPct}% PAID`}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-[#7C6E6A]">
                      <span>Remaining: ${d.remaining_amount.toLocaleString()}</span>
                      <span>Original: ${d.original_amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-[#FAF6F0] h-3 rounded-full overflow-hidden border border-[#EFE6DD]">
                      <div className="bg-[#E2856E] h-full rounded-full transition-all duration-500" style={{ width: `${100 - paidPct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EFE6DD] flex items-center justify-between">
                  <span className="text-xs text-[#7C6E6A]">Due: {d.due_date || 'N/A'}</span>
                  {!isPaidOff && (
                    <Button size="sm" variant="peach" onClick={() => { setSelectedDebt(d); setIsPayModalOpen(true); }}>
                      Make Payment
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Create Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Debt / Credit Balance">
          <form onSubmit={handleCreateDebt} className="space-y-4">
            <Input label="Debt Title" placeholder="e.g. Visa Credit Card, Student Loan" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Original Total Amount ($)" type="number" step="0.01" placeholder="5000.00" value={originalAmount} onChange={(e) => setOriginalAmount(e.target.value)} required />
            <Input label="Current Remaining Balance ($)" type="number" step="0.01" placeholder="4200.00" value={remainingAmount} onChange={(e) => setRemainingAmount(e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Interest Rate (%)" type="number" step="0.1" placeholder="18.5" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
              <Input label="Minimum Monthly Payment ($)" type="number" step="0.01" placeholder="150.00" value={minimumPayment} onChange={(e) => setMinimumPayment(e.target.value)} />
            </div>
            <Input label="Monthly Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="peach" isLoading={isSubmitting}>Save Debt Record 🐾</Button>
            </div>
          </form>
        </Modal>

        {/* Payment Modal */}
        <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title={`Make Payment to ${selectedDebt?.name}`}>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <Input label="Payment Amount ($)" type="number" step="0.01" placeholder="150.00" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="peach">Record Payment 💳</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
