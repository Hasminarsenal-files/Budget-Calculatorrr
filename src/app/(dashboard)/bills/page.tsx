'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/db';
import { syncManager } from '@/lib/sync/syncManager';
import { Bill, RecurringFrequency } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { Receipt, Plus, CheckCircle, Trash2 } from 'lucide-react';

export default function BillsPage() {
  const { profile } = useAuth();
  const bills = useLiveQuery(() => db.bills.toArray(), []) || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // When marking as paid, record as expense and remove from active bills
  const handleMarkAsPaid = async (bill: Bill) => {
    if (!profile) return;

    try {
      const now = new Date().toISOString();
      const txId = 'tx-bill-' + Date.now();

      // 1. Record payment in transactions
      const newTx = {
        id: txId,
        user_id: profile.id,
        description: `Bill Paid: ${bill.name}`,
        amount: bill.amount,
        type: 'expense' as const,
        payment_method: 'Auto Pay / Bill',
        transaction_date: now,
        notes: `Settled recurring bill due on ${bill.due_date}`,
        sync_status: 'pending' as const,
        created_at: now
      };
      await db.transactions.put(newTx);
      await syncManager.queueChange('transactions', 'INSERT', txId, newTx);

      // 2. Remove the paid bill from active bills
      await db.bills.delete(bill.id);
      await syncManager.queueChange('bills', 'DELETE', bill.id, null);
    } catch (err) {
      console.error('Error marking bill as paid:', err);
    }
  };

  const confirmDeleteBill = async () => {
    if (!billToDelete) return;
    setIsProcessing(true);
    try {
      await db.bills.delete(billToDelete.id);
      await syncManager.queueChange('bills', 'DELETE', billToDelete.id, null);
      setBillToDelete(null);
    } catch (err) {
      console.error('Error deleting bill:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const activeBills = bills.filter(b => b.status !== 'paid');

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

        {/* Bills List or Empty State */}
        {activeBills.length === 0 ? (
          <EmptyState
            type="bills"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBills.map((b) => {
              const isOverdue = new Date(b.due_date) < new Date();

              return (
                <Card key={b.id} className="space-y-4 flex flex-col justify-between hover:border-[#6E8B74]/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${isOverdue ? 'bg-red-50 text-red-500' : 'bg-[#FFF8EA] text-[#D99B26]'}`}>
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#3A2E2B]">{b.name}</h3>
                        <p className="text-xs text-[#7C6E6A]">Due: {b.due_date} ({b.recurring})</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isOverdue ? 'danger' : 'honey'}>
                        {isOverdue ? 'OVERDUE' : 'PENDING'}
                      </Badge>
                      <button
                        type="button"
                        title="Delete bill"
                        onClick={() => setBillToDelete(b)}
                        className="text-red-400 hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EFE6DD] flex items-center justify-between">
                    <span className="text-xl font-black text-[#3A2E2B]">₱{b.amount.toFixed(2)}</span>
                    <Button
                      size="sm"
                      variant="sage"
                      leftIcon={<CheckCircle className="w-4 h-4" />}
                      onClick={() => handleMarkAsPaid(b)}
                    >
                      Mark as Paid
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add New Bill Modal */}
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

        {/* Delete Confirmation Popup Modal */}
        <Modal
          isOpen={!!billToDelete}
          onClose={() => setBillToDelete(null)}
          title="Delete Bill Reminder? 🗑️"
          description="Please confirm if you want to delete this bill."
        >
          {billToDelete && (
            <div className="space-y-4">
              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EFE6DD] space-y-1 text-xs">
                <div className="flex justify-between font-bold text-[#3A2E2B] text-sm">
                  <span>{billToDelete.name}</span>
                  <span className="text-[#E2856E]">₱{billToDelete.amount.toFixed(2)}</span>
                </div>
                <p className="text-[#7C6E6A]">Due: {billToDelete.due_date} ({billToDelete.recurring})</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setBillToDelete(null)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="peach"
                  onClick={confirmDeleteBill}
                  isLoading={isProcessing}
                >
                  Yes, Delete Bill
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
