'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { CatIllustration } from '@/components/ui/CatIllustration';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/db';
import { syncManager } from '@/lib/sync/syncManager';
import { SavingsGoal } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { PiggyBank, Plus, TrendingUp, Sparkles, Laptop, Shield, Car } from 'lucide-react';

export default function SavingsPage() {
  const { profile } = useAuth();
  const goals = useLiveQuery(() => db.savings_goals.toArray(), []) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !profile) return;
    setIsSubmitting(true);

    try {
      const newId = 'sg-' + Date.now();
      const now = new Date().toISOString();

      const newGoal: SavingsGoal = {
        id: newId,
        user_id: profile.id,
        name,
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
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
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error creating savings goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !depositAmount) return;

    const addVal = parseFloat(depositAmount);
    const updatedVal = selectedGoal.current_amount + addVal;

    await db.savings_goals.update(selectedGoal.id, { current_amount: updatedVal });
    await syncManager.queueChange('savings_goals', 'UPDATE', selectedGoal.id, { ...selectedGoal, current_amount: updatedVal });

    setDepositAmount('');
    setIsDepositOpen(false);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E2B]">Savings & Financial Goals 🐷</h1>
            <p className="text-xs sm:text-sm text-[#7C6E6A]">Set targets for gadgets, travel, emergency funds, or house down-payments.</p>
          </div>
          <Button variant="sage" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            Create New Goal
          </Button>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));

            return (
              <Card key={g.id} className="space-y-5 flex flex-col justify-between hover:border-[#6E8B74]/50 transition-all">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#FFF8EA] text-[#D99B26] rounded-2xl">
                        <PiggyBank className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#3A2E2B]">{g.name}</h3>
                        <p className="text-xs text-[#7C6E6A]">Target Date: {g.target_date || 'Open End'}</p>
                      </div>
                    </div>
                    <Badge variant="honey">{pct}% Saved</Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-[#7C6E6A]">
                      <span>₱{g.current_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      <span>Target: ₱{g.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="w-full bg-[#FAF6F0] h-3 rounded-full overflow-hidden border border-[#EFE6DD]">
                      <div className="bg-[#D99B26] h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EFE6DD] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#3A2E2B]">₱{(g.target_amount - g.current_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} Remaining</span>
                  <Button size="sm" variant="sage" onClick={() => { setSelectedGoal(g); setIsDepositOpen(true); }}>
                    + Add Funds
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

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

        {/* Add Funds Modal */}
        <Modal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} title={`Add Funds to ${selectedGoal?.name}`}>
          <form onSubmit={handleAddDeposit} className="space-y-4">
            <Input label="Deposit Amount (₱)" type="number" step="0.01" placeholder="100.00" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} required />
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setIsDepositOpen(false)}>Cancel</Button>
              <Button type="submit" variant="honey">Confirm Deposit 💰</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
