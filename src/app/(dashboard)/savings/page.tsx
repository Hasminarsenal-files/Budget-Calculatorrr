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
import { SavingsGoal } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { PiggyBank, Plus, TrendingUp, Sparkles, Laptop, Trash2, ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function SavingsPage() {
  const { profile } = useAuth();
  const goals = useLiveQuery(() => db.savings_goals.toArray(), []) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalSavedAll = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const availableTotalBalance = totalIncome - totalExpense - totalSavedAll;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Forms
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDesc, setWithdrawDesc] = useState('');

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Goal
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !profile) return;
    setIsSubmitting(true);

    try {
      const newId = 'sg-' + Date.now();
      const now = new Date().toISOString();
      const initialAmt = parseFloat(currentAmount) || 0;

      const newGoal: SavingsGoal = {
        id: newId,
        user_id: profile.id,
        name,
        target_amount: parseFloat(targetAmount),
        current_amount: initialAmt,
        target_date: targetDate,
        icon: 'PiggyBank',
        sync_status: 'pending',
        created_at: now
      };

      await db.savings_goals.put(newGoal);
      await syncManager.queueChange('savings_goals', 'INSERT', newId, newGoal);

      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setTargetDate('');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error creating savings goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deposit Money into Goal
  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !depositAmount || !profile) return;
    setIsSubmitting(true);

    try {
      const addVal = parseFloat(depositAmount);
      const updatedVal = selectedGoal.current_amount + addVal;
      const now = new Date().toISOString();
      const txId = 'tx-save-' + Date.now();

      // 1. Update savings goal amount
      await db.savings_goals.update(selectedGoal.id, { current_amount: updatedVal });
      await syncManager.queueChange('savings_goals', 'UPDATE', selectedGoal.id, { ...selectedGoal, current_amount: updatedVal });

      // 2. Log transaction
      const newTx = {
        id: txId,
        user_id: profile.id,
        description: `Savings Deposit: ${selectedGoal.name}`,
        amount: addVal,
        type: 'transfer' as const,
        payment_method: 'Savings Allocation',
        transaction_date: now,
        notes: `Allocated funds into goal: ${selectedGoal.name}`,
        sync_status: 'pending' as const,
        created_at: now
      };
      await db.transactions.put(newTx);
      await syncManager.queueChange('transactions', 'INSERT', txId, newTx);

      setDepositAmount('');
      setIsDepositOpen(false);
    } catch (err) {
      console.error('Error depositing to goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Withdraw / Spend Money from Goal
  const handleWithdrawSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !withdrawAmount || !profile) return;
    setIsSubmitting(true);

    try {
      const spendVal = parseFloat(withdrawAmount);
      const remainingVal = Math.max(0, selectedGoal.current_amount - spendVal);
      const now = new Date().toISOString();
      const txId = 'tx-spend-save-' + Date.now();

      // 1. Deduct amount from savings goal
      await db.savings_goals.update(selectedGoal.id, { current_amount: remainingVal });
      await syncManager.queueChange('savings_goals', 'UPDATE', selectedGoal.id, { ...selectedGoal, current_amount: remainingVal });

      // 2. Log transfer transaction returning money to available balance
      const purpose = withdrawDesc.trim() || `Withdrawn from ${selectedGoal.name}`;
      const newTx = {
        id: txId,
        user_id: profile.id,
        description: `Withdrawn Savings: ${purpose}`,
        amount: spendVal,
        type: 'transfer' as const,
        payment_method: `Transferred to Total Balance`,
        transaction_date: now,
        notes: `Returned from savings goal '${selectedGoal.name}' into available total balance`,
        sync_status: 'pending' as const,
        created_at: now
      };
      await db.transactions.put(newTx);
      await syncManager.queueChange('transactions', 'INSERT', txId, newTx);

      setWithdrawAmount('');
      setWithdrawDesc('');
      setIsWithdrawOpen(false);
    } catch (err) {
      console.error('Error spending from savings goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Goal
  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;
    setIsSubmitting(true);
    try {
      await db.savings_goals.delete(goalToDelete.id);
      await syncManager.queueChange('savings_goals', 'DELETE', goalToDelete.id, null);
      setGoalToDelete(null);
    } catch (err) {
      console.error('Error deleting goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E2B]">Savings & Financial Goals 🐷</h1>
            <p className="text-xs sm:text-sm text-[#7C6E6A]">Set targets for gadgets, travel, emergency funds, and log savings spending transactions.</p>
          </div>
          <Button variant="sage" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            Create New Goal
          </Button>
        </div>

        {/* Total Savings Overview Banner */}
        <Card className="bg-[#FFF8EA] border-[#F7E7C4] p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#D99B26] text-white rounded-2xl">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#D99B26] uppercase tracking-wider">Total Active Savings Reserve</p>
              <h2 className="text-3xl font-black text-[#3A2E2B]">₱{totalSavedAll.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            </div>
          </div>
          <Badge variant="honey">{goals.length} Active Goals</Badge>
        </Card>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <EmptyState
            type="savings"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
              const isGoalReached = g.current_amount >= g.target_amount;

              return (
                <Card key={g.id} className="space-y-5 flex flex-col justify-between hover:border-[#6E8B74]/50 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${isGoalReached ? 'bg-[#EBF1EC] text-[#6E8B74]' : 'bg-[#FFF8EA] text-[#D99B26]'}`}>
                          <PiggyBank className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-[#3A2E2B]">{g.name}</h3>
                          <p className="text-xs text-[#7C6E6A]">Target Date: {g.target_date || 'Open End'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isGoalReached ? 'sage' : 'honey'}>
                          {isGoalReached ? '🎉 Goal Met!' : `${pct}% Saved`}
                        </Badge>
                        <button
                          type="button"
                          title="Delete goal"
                          onClick={() => setGoalToDelete(g)}
                          className="text-red-400 hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-[#7C6E6A]">
                        <span className="font-bold text-[#3A2E2B]">₱{g.current_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span>Target: ₱{g.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="w-full bg-[#FAF6F0] h-3 rounded-full overflow-hidden border border-[#EFE6DD]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isGoalReached ? 'bg-[#6E8B74]' : 'bg-[#D99B26]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#EFE6DD] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#3A2E2B]">
                      {g.current_amount >= g.target_amount ? (
                        <span className="text-[#6E8B74] flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready to spend!
                        </span>
                      ) : (
                        `₱${(g.target_amount - g.current_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} Remaining`
                      )}
                    </span>

                    <div className="flex items-center gap-2">
                      {g.current_amount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedGoal(g); setIsWithdrawOpen(true); }}
                        >
                          💸 Use Savings
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="sage"
                        onClick={() => { setSelectedGoal(g); setIsDepositOpen(true); }}
                      >
                        + Add Funds
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Goal Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Savings Goal">
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <Input label="Goal Name" placeholder="e.g. New Mac, House Fund, Emergency Reserve" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Target Amount (₱)" type="number" placeholder="5000.00" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
            <Input label="Current Initial Amount (₱)" type="number" placeholder="0.00" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
            <Input label="Target Date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="sage" isLoading={isSubmitting}>Save Goal 🐾</Button>
            </div>
          </form>
        </Modal>

        {/* Add Deposit Modal */}
        <Modal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} title={`Add Funds to ${selectedGoal?.name}`}>
          <form onSubmit={handleAddDeposit} className="space-y-4">
            {/* Total Balance Reference Card */}
            <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EFE6DD] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#7C6E6A] uppercase tracking-wider block">Available Total Balance</span>
                <span className="text-xs text-[#7C6E6A]">Your current spendable money</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-[#3A2E2B]">
                  ₱{availableTotalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#7C6E6A]">
              Depositing funds into this goal reserves this money and updates your spendable total balance.
            </p>
            <Input
              label="Deposit Amount (₱)"
              type="number"
              step="0.01"
              max={Math.max(0, availableTotalBalance)}
              placeholder="100.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setIsDepositOpen(false)}>Cancel</Button>
              <Button type="submit" variant="honey" isLoading={isSubmitting}>Confirm Deposit 💰</Button>
            </div>
          </form>
        </Modal>

        {/* Withdraw / Use Savings Modal */}
        <Modal
          isOpen={isWithdrawOpen}
          onClose={() => setIsWithdrawOpen(false)}
          title={`Spend / Withdraw from ${selectedGoal?.name} 🛍️`}
          description="Log a transaction when using your saved funds."
        >
          <form onSubmit={handleWithdrawSpend} className="space-y-4">
            <div className="bg-[#FAF6F0] p-3.5 rounded-2xl border border-[#EFE6DD] text-xs">
              <span className="text-[#7C6E6A]">Available in Goal:</span>
              <p className="text-base font-black text-[#6E8B74]">₱{selectedGoal?.current_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>

            <Input
              label="Amount to Spend / Withdraw (₱)"
              type="number"
              step="0.01"
              max={selectedGoal?.current_amount}
              placeholder="e.g. 1500.00"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              required
            />

            <Input
              label="Purpose / Item Purchased"
              placeholder={`e.g. Bought ${selectedGoal?.name}, Travel Ticket`}
              value={withdrawDesc}
              onChange={(e) => setWithdrawDesc(e.target.value)}
              required
            />

            <p className="text-xs text-[#7C6E6A]">
              This will deduct ₱{withdrawAmount || '0'} from your savings goal and immediately add it back into your spendable Total Balance.
            </p>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setIsWithdrawOpen(false)}>Cancel</Button>
              <Button type="submit" variant="sage" isLoading={isSubmitting}>Confirm Withdrawal to Balance 🐾</Button>
            </div>
          </form>
        </Modal>

        {/* Delete Goal Confirmation Modal */}
        <Modal
          isOpen={!!goalToDelete}
          onClose={() => setGoalToDelete(null)}
          title="Delete Savings Goal? 🗑️"
          description="Please confirm if you want to delete this savings goal."
        >
          {goalToDelete && (
            <div className="space-y-4">
              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EFE6DD] space-y-1 text-xs">
                <div className="flex justify-between font-bold text-[#3A2E2B] text-sm">
                  <span>{goalToDelete.name}</span>
                  <span className="text-[#D99B26]">₱{goalToDelete.current_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} saved</span>
                </div>
                <p className="text-[#7C6E6A]">Target: ₱{goalToDelete.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setGoalToDelete(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="peach"
                  onClick={confirmDeleteGoal}
                  isLoading={isSubmitting}
                >
                  Yes, Delete Goal
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
