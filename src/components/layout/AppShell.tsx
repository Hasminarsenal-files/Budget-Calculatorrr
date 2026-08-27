'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, navigationItems } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { PWAInstallBanner } from '../PWAInstallBanner';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CatIllustration } from '../ui/CatIllustration';
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
  const { user, profile, loading, logoutUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !profile) {
      router.replace('/login');
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    // Initial sync
    syncManager.sync();

    // Sync on tab focus or when network comes back online
    const handleFocus = () => {
      syncManager.sync();
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    // Live continuous sync polling every 4 seconds when tab is active
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && navigator.onLine) {
        syncManager.sync();
      }
    }, 4000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !desc.trim()) return;
    setIsSubmitting(true);

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setIsSubmitting(false);
        return;
      }

      const newId = 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
      const now = new Date().toISOString();
      const userId = profile?.id || user?.id || 'user-offline';

      const txRecord = {
        id: newId,
        user_id: userId,
        description: desc.trim(),
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

      // If it's income, also record in the income table so the Income view reflects it
      if (type === 'income') {
        const incId = 'inc-' + Date.now();
        const incRecord = {
          id: incId,
          user_id: userId,
          source: desc.trim(),
          amount: numAmount,
          date: now.slice(0, 10),
          notes: `Quick added (${paymentMethod})`,
          sync_status: 'pending' as const,
          created_at: now
        };
        await db.income.put(incRecord);
        await syncManager.queueChange('income', 'INSERT', incId, incRecord);
      }

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

  if (loading || (!user && !profile)) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3">
          <CatIllustration mood="sleeping" size={64} className="mx-auto animate-pulse" />
          <p className="text-xs font-bold text-[#7C6E6A]">Loading Budget Cat...</p>
        </div>
      </div>
    );
  }

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
      <MobileNav 
        onOpenDrawer={() => setMobileDrawerOpen(true)} 
        onOpenQuickAdd={() => setQuickAddOpen(true)} 
      />

      {/* Mobile Navigation Drawer Modal */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-[#3A2E2B]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl p-6 border-t border-[#EFE6DD] shadow-warm-lg space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#EFE6DD] pb-3">
              <div className="flex items-center gap-2">
                <CatIllustration mood="happy" size={28} />
                <h3 className="text-base font-black text-[#3A2E2B]">All Menu & Sections 🐾</h3>
              </div>
              <button 
                onClick={() => setMobileDrawerOpen(false)} 
                className="p-1.5 rounded-full hover:bg-[#FAF6F0] text-[#7C6E6A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action in Mobile Drawer */}
            <button
              type="button"
              onClick={() => {
                setMobileDrawerOpen(false);
                setQuickAddOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#6E8B74] hover:bg-[#5C7862] text-white text-xs font-bold shadow-md shadow-[#6E8B74]/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ New Transaction</span>
            </button>

            {/* Grid of all 11 Navigation sections */}
            <div className="grid grid-cols-2 gap-2 overflow-y-auto pt-1 pb-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-bold border transition-all ${
                      isActive 
                        ? 'bg-[#EBF1EC] border-[#6E8B74] text-[#6E8B74] shadow-sm' 
                        : 'bg-[#FAF6F0] hover:bg-[#EBF1EC] text-[#3A2E2B] border-[#EFE6DD]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#6E8B74]' : 'text-[#7C6E6A]'}`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Sync & Logout Footer */}
            <div className="pt-3 border-t border-[#EFE6DD] flex flex-col gap-2">
              <button
                type="button"
                onClick={async () => {
                  await syncManager.sync();
                  setMobileDrawerOpen(false);
                  window.location.reload();
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-[#FAF6F0] hover:bg-[#EBF1EC] text-[#6E8B74] text-xs font-bold border border-[#EFE6DD] transition-colors"
              >
                <span>☁️ Force Cloud Sync Now</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setMobileDrawerOpen(false);
                  await logoutUser();
                  window.location.href = '/login';
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-200 transition-colors"
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
