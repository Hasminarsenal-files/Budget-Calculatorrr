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
import { Bill, RecurringFrequency } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { Receipt, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function BillsPage() {
  const { profile } = useAuth();
  const bills = useLiveQuery(() => db.bills.toArray(), []) || [];
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState<RecurringFrequency>('monthly');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !dueDate || !profile) return;
    setIsSubmitting(true);

    try {
      const newId = 'bill-' + Date.now();
      const now = new Date().toISOString();

      const newBill: Bill = {
        id: newId,
        user_id: profile.id,
        name,
        amount: parseFloat(amount),
        due_date: dueDate,
        recurring,
        status: 'pending',
        notes,
        sync_status: 'pending',
        created_at: now
      };

      await db.bills.put(newBill);
      await syncManager.queueChange('bills', 'INSERT', newId, newBill);

      setName('');
      setAmount('');
      setDueDate('');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error adding bill:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBillPaid = async (bill: Bill) => {
    const newStatus = bill.status === 'paid' ? 'pending' : 'paid';
    await db.bills.update(bill.id, { status: newStatus });
    await syncManager.queueChange('bills', 'UPDATE', bill.id, { ...bill, status: newStatus });

    // If marked as paid, record as expense transaction
    if (newStatus === 'paid' && profile) {
      const txId = 'tx-bill-' + Date.now();
      const now = new Date().toISOString();
      const newTx = {
        id: txId,
        user_id: profile.id,
        description: `Bill Paid: ${bill.name}`,
        amount: bill.amount,
        type: 'expense' as const,
        payment_method: 'Auto Pay / Bill',
        transaction_date: now,
        sync_status: 'pending' as const,
        created_at: now
      };
      await db.transactions.put(newTx);
      await syncManager.queueChange('transactions', 'INSERT', txId, newTx);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E2B]">Bills & Subscriptions 🧾</h1>
            <p className="text-xs sm:text-sm text-[#7C6E6A]">Never miss rent, electricity, internet, or recurring credit payments.</p>
          </div>
          <Button variant="sage" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            Add Recurring Bill
          </Button>
        </div>

        {/* Bills List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bills.map((b) => {
            const isPaid = b.status === 'paid';
            const isOverdue = !isPaid && new Date(b.due_date) < new Date();

            return (
              <Card key={b.id} className="space-y-4 flex flex-col justify-between hover:border-[#6E8B74]/50 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${isPaid ? 'bg-[#EBF1EC] text-[#6E8B74]' : isOverdue ? 'bg-red-50 text-red-500' : 'bg-[#FFF8EA] text-[#D99B26]'}`}>
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#3A2E2B]">{b.name}</h3>
                      <p className="text-xs text-[#7C6E6A]">Due: {b.due_date} ({b.recurring})</p>
                    </div>
                  </div>
                  <Badge variant={isPaid ? 'sage' : isOverdue ? 'danger' : 'honey'}>
                    {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING'}
                  </Badge>
                </div>

                <div className="pt-3 border-t border-[#EFE6DD] flex items-center justify-between">
                  <span className="text-xl font-black text-[#3A2E2B]">₱{b.amount.toFixed(2)}</span>
                  <Button
                    size="sm"
                    variant={isPaid ? 'outline' : 'sage'}
                    onClick={() => toggleBillPaid(b)}
                  >
                    {isPaid ? 'Mark Pending' : 'Mark as Paid'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Bill">
          <form onSubmit={handleAddBill} className="space-y-4">
            <Input label="Bill Name" placeholder="e.g. Electric Utility, Netflix, Rent" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Amount (₱)" type="number" step="0.01" placeholder="85.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            <div>
              <label className="text-xs font-semibold text-[#3A2E2B] mb-1.5 block">Frequency</label>
              <select value={recurring} onChange={(e) => setRecurring(e.target.value as any)} className="w-full bg-white border border-[#EFE6DD] text-[#3A2E2B] rounded-2xl px-4 py-2.5 text-sm">
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
                <option value="none">One-time</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="sage" isLoading={isSubmitting}>Save Bill 🐾</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
