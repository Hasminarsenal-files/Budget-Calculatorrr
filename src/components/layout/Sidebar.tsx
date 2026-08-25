'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CatIllustration } from '../ui/CatIllustration';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  TrendingUp, 
  Receipt, 
  PiggyBank, 
  CreditCard, 
  BarChart3, 
  Settings,
  Calendar,
  CalendarDays,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

export const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Monthly View', href: '/monthly', icon: CalendarDays },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Budgets', href: '/budgets', icon: Wallet },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Income', href: '/income', icon: TrendingUp },
  { name: 'Bills', href: '/bills', icon: Receipt },
  { name: 'Savings', href: '/savings', icon: PiggyBank },
  { name: 'Debts', href: '/debts', icon: CreditCard },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC<{ onOpenQuickAdd?: () => void }> = ({ onOpenQuickAdd }) => {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#EFE6DD] h-screen sticky top-0 z-30 p-5 shadow-warm">
      {/* Brand Header */}
      <Link href="/dashboard" className="flex items-center gap-3 px-2 py-3 mb-4">
        <CatIllustration mood="logo" size={44} />
        <div>
          <h1 className="text-xl font-black text-[#3A2E2B] tracking-tight">Budget Cat</h1>
          <p className="text-[11px] font-semibold text-[#6E8B74] tracking-wide uppercase">Smart Money Purr-fection</p>
        </div>
      </Link>

      {/* Quick Action Button */}
      {onOpenQuickAdd && (
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center justify-center gap-2 w-full bg-[#6E8B74] hover:bg-[#5B7460] text-white py-3 px-4 rounded-2xl font-bold text-sm shadow-sm transition-all mb-4 group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          <span>New Transaction</span>
        </button>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'text-[#6E8B74] bg-[#EBF1EC]'
                  : 'text-[#7C6E6A] hover:bg-[#FAF6F0] hover:text-[#3A2E2B]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveIndicator"
                  className="absolute left-0 top-1.5 bottom-1.5 w-1.5 bg-[#6E8B74] rounded-r-full"
                />
              )}
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#6E8B74]' : 'text-[#7C6E6A]'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Cute Footer Widget */}
      <div className="mt-auto pt-3 border-t border-[#EFE6DD]">
        <div className="bg-[#FFF8EA] border border-[#F7E7C4] rounded-2xl p-2.5 flex items-center gap-2.5">
          <CatIllustration mood="saving" size={28} />
          <div>
            <p className="text-xs font-bold text-[#3A2E2B]">Saving Goal Active</p>
            <p className="text-[10px] text-[#7C6E6A]">Keep going! You got this! 🐾</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
