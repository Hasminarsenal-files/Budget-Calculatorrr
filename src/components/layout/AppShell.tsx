'use client';

import React, { useState } from 'react';
import { Sidebar, navigationItems } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { PWAInstallBanner } from '../PWAInstallBanner';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { usePathname, useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { syncManager } from '@/lib/sync/syncManager';
import { useAuth } from '@/lib/auth/AuthContext';
import { X, Plus, ArrowLeftRight, LogOut } from 'lucide-react';
import Link from 'next/link';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Quick Add Form state
  const { profile, logoutUser } = useAuth();
  const router = useRouter();
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !desc || !profile) return;
    setIsSubmitting(true);

    try {
      const numAmount = parseFloat(amount);
      const newId = 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
      const now = new Date().toISOString();

      const txRecord = {
        id: newId,
        user_id: profile.id,
        description: desc,
        amount: numAmount,
        type,
        payment_method: paymentMethod,
        transaction_date: now,
        notes: `Quick added via Budget Cat app shell`,
        sync_status: 'pending' as const,
        created_at: now
      };

      await db.transactions.put(txRecord);
      await syncManager.queueChange('transactions', 'INSERT', newId, txRecord);

      setDesc('');
      setAmount('');
      setQuickAddOpen(false);
      router.refresh();
    } catch (err) {
      console.error('Error adding transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#3A2E2B] flex">
      {/* Desktop Sidebar */}
      <Sidebar onOpenQuickAdd={() => setQuickAddOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-16 lg:pb-0">
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* PWA Installation Banner */}
      <PWAInstallBanner />

      {/* Mobile Bottom Bar Navigation */}
      <MobileNav onOpenDrawer={() => setMobileDrawerOpen(true)} />

      {/* Mobile Navigation Drawer Modal */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-[#3A2E2B]/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl p-6 border-t border-[#EFE6DD] shadow-warm-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFE6DD] pb-3">
              <h3 className="text-lg font-bold text-[#3A2E2B]">All Sections</h3>
              <button onClick={() => setMobileDrawerOpen(false)} className="p-1 text-[#7C6E6A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pt-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF6F0] hover:bg-[#EBF1EC] text-[#3A2E2B] text-xs font-bold border border-[#EFE6DD]"
                  >
                    <Icon className="w-4 h-4 text-[#6E8B74]" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#EFE6DD]">
              <button
                type="button"
                onClick={async () => {
                  setMobileDrawerOpen(false);
                  await logoutUser();
                  router.push('/login');
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-200 transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Transaction Modal */}
      <Modal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        title="Add Quick Transaction"
        description="Save an expense or income instantly on your device."
      >
        <form onSubmit={handleQuickAdd} className="space-y-4">
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
            placeholder="e.g. Grocery, Lunch, Salary"
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
                className="w-full bg-white border border-[#EFE6DD] text-[#3A2E2B] rounded-2xl px-3 py-2 text-xs"
              >
                <option value="GCash">GCash</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="From Savings">From Savings</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setQuickAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={type === 'expense' ? 'peach' : 'sage'} isLoading={isSubmitting}>
              Save Record 🐾
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
