'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/db';
import { syncManager } from '@/lib/sync/syncManager';
import { Budget, BudgetType } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { Wallet, Plus, Calendar, Tag, Plane, Sparkles, Trash2, PieChart } from 'lucide-react';

interface CustomCategoryItem {
  name: string;
  planned: number;
}

export default function BudgetsPage() {
  const { profile } = useAuth();
  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budgetType, setBudgetType] = useState<BudgetType>('monthly');
  const [totalBudget, setTotalBudget] = useState('4000');
  const [currency, setCurrency] = useState('₱');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Allocation State
  const [categories, setCategories] = useState<CustomCategoryItem[]>([
    { name: 'Transportation', planned: 500 },
    { name: 'Accommodation', planned: 1200 },
    { name: 'Food & Dining', planned: 800 },
    { name: 'Activities', planned: 600 },
    { name: 'Shopping', planned: 400 },
    { name: 'Emergency Reserve', planned: 500 }
  ]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatPlanned, setNewCatPlanned] = useState('');

  // Allocation Math
  const parsedTotalBudget = parseFloat(totalBudget) || 0;
  const totalPlanned = categories.reduce((sum, c) => sum + (c.planned || 0), 0);
  const unallocatedRemaining = parsedTotalBudget - totalPlanned;
  const percentageAllocated = parsedTotalBudget > 0 ? Math.min(100, Math.round((totalPlanned / parsedTotalBudget) * 100)) : 0;

  const handleAddCategory = () => {
    if (!newCatName) return;
    setCategories([...categories, { name: newCatName, planned: parseFloat(newCatPlanned) || 0 }]);
    setNewCatName('');
    setNewCatPlanned('');
  };

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, idx) => idx !== index));
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !totalBudget || !profile) return;
    setIsSubmitting(true);

    try {
      const newId = 'b-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
      const now = new Date().toISOString();

      const newBudget: Budget = {
        id: newId,
        user_id: profile.id,
        name,
        description: description || `Categories: ${categories.map(c => c.name).join(', ')}`,
        budget_type: budgetType,
        total_budget: parsedTotalBudget,
        spent_amount: 0,
        start_date: startDate,
        end_date: endDate || undefined,
        status: 'active',
        sync_status: 'pending',
        created_at: now
      };

      await db.budgets.put(newBudget);
      await syncManager.queueChange('budgets', 'INSERT', newId, newBudget);

      // Save categories to Dexie
      for (const cat of categories) {
        const catId = 'cat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
        await db.budget_categories.put({
          id: catId,
          budget_id: newId,
          name: cat.name,
          icon: 'Tag',
          color: '#6E8B74',
          planned_amount: cat.planned,
          sync_status: 'pending',
          created_at: now
        });
      }

      setName('');
      setDescription('');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error creating budget:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const budgetTypesList: { type: BudgetType; label: string; icon: string }[] = [
    { type: 'monthly', label: 'Monthly Budget', icon: '🗓️' },
    { type: 'weekly', label: 'Weekly Budget', icon: '📅' },
    { type: 'travel', label: 'Trip Budget', icon: '✈️' },
    { type: 'vacation', label: 'Vacation Budget', icon: '🏖️' },
    { type: 'gala', label: 'Event Budget', icon: '🎉' },
    { type: 'project', label: 'School Budget', icon: '📚' },
    { type: 'shopping', label: 'Shopping Budget', icon: '🛍️' },
    { type: 'other', label: 'Custom Budget', icon: '✨' }
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E2B]">Budgets & Event Trackers 🐾</h1>
            <p className="text-xs sm:text-sm text-[#7C6E6A]">Ordinary monthly budgets and temporary event budgets (Cebu Trip, Vacation, Gala, Weddings).</p>
          </div>
          <Button variant="sage" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            Create New Budget
          </Button>
        </div>

        {/* Budgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => {
            const spent = b.spent_amount || 0;
            const pct = Math.min(100, Math.round((spent / b.total_budget) * 100));

            return (
              <Card key={b.id} className="space-y-5 flex flex-col justify-between hover:border-[#6E8B74]/50 transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#EBF1EC] text-[#6E8B74] rounded-2xl">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#3A2E2B]">{b.name}</h3>
                        <p className="text-xs text-[#7C6E6A] truncate max-w-[160px]">{b.description || 'Custom Budget'}</p>
                      </div>
                    </div>
                    <Badge variant={b.budget_type === 'monthly' ? 'sage' : 'peach'}>
                      {b.budget_type.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-semibold text-[#7C6E6A]">
                      <span>Spent: ₱{spent.toLocaleString()}</span>
                      <span>Cap: ₱{b.total_budget.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-[#FAF6F0] h-3 rounded-full overflow-hidden border border-[#EFE6DD]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct > 90 ? 'bg-[#E2856E]' : 'bg-[#6E8B74]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EFE6DD] flex items-center justify-between text-xs font-medium text-[#7C6E6A]">
                  <span>{b.start_date} {b.end_date ? `→ ${b.end_date}` : ''}</span>
                  <span className="font-bold text-[#3A2E2B]">₱{(b.total_budget - spent).toLocaleString()} Left</span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Intuitive Create Budget Modal with Category Allocation Math */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Budget"
          description="Define budget type, target amount, and category planned allocations."
          maxWidth="xl"
        >
          <form onSubmit={handleCreateBudget} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Budget Name"
                placeholder="e.g. Trip to Cebu 🏝️ or Monthly Household"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div>
                <label className="text-xs font-semibold text-[#3A2E2B] mb-1.5 block">Budget Type</label>
                <select
                  value={budgetType}
                  onChange={(e) => setBudgetType(e.target.value as any)}
                  className="w-full bg-white border border-[#EFE6DD] text-[#3A2E2B] rounded-2xl px-4 py-2.5 text-sm"
                >
                  {budgetTypesList.map(t => (
                    <option key={t.type} value={t.type}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Total Target Budget"
                type="number"
                step="0.01"
                placeholder="4000.00"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                required
              />

              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />

              <Input
                label="End Date (Optional)"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Real-time Category Allocation Calculator */}
            <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EFE6DD] space-y-4">
              <div className="flex items-center justify-between border-b border-[#EFE6DD] pb-3">
                <div>
                  <h4 className="font-bold text-sm text-[#3A2E2B] flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-[#6E8B74]" /> Category Planned Allocation
                  </h4>
                  <p className="text-xs text-[#7C6E6A]">Assign planned amounts to each category.</p>
                </div>
                <Badge variant={unallocatedRemaining >= 0 ? 'sage' : 'danger'}>
                  {percentageAllocated}% Allocated
                </Badge>
              </div>

              {/* Allocation Summary Bar */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-[#EFE6DD]">
                  <span className="text-[#7C6E6A]">Total Planned</span>
                  <p className="font-bold text-[#3A2E2B]">{currency}{totalPlanned.toLocaleString()}</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-[#EFE6DD]">
                  <span className="text-[#7C6E6A]">Unallocated</span>
                  <p className={`font-bold ${unallocatedRemaining < 0 ? 'text-red-500' : 'text-[#6E8B74]'}`}>
                    {currency}{unallocatedRemaining.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-[#EFE6DD]">
                  <span className="text-[#7C6E6A]">Allocated Share</span>
                  <p className="font-bold text-[#3A2E2B]">{percentageAllocated}%</p>
                </div>
              </div>

              {/* Categories Table / List */}
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-[#EFE6DD] text-xs font-semibold">
                    <span>{cat.name}</span>
                    <div className="flex items-center gap-3">
                      <span>{currency}{cat.planned.toLocaleString()}</span>
                      <button type="button" onClick={() => handleRemoveCategory(idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Category Row */}
              <div className="flex gap-2 pt-1">
                <input
                  placeholder="Category Name (e.g. Transportation)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-white border border-[#EFE6DD] text-xs px-3 py-2 rounded-xl text-[#3A2E2B]"
                />
                <input
                  type="number"
                  placeholder="Planned Amount"
                  value={newCatPlanned}
                  onChange={(e) => setNewCatPlanned(e.target.value)}
                  className="w-28 bg-white border border-[#EFE6DD] text-xs px-3 py-2 rounded-xl text-[#3A2E2B]"
                />
                <Button type="button" size="sm" variant="sage" onClick={handleAddCategory}>
                  Add
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="sage" isLoading={isSubmitting}>
                Save & Activate Budget 🐾
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
