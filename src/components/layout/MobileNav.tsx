'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  PiggyBank, 
  Menu,
  Plus
} from 'lucide-react';

interface MobileNavProps {
  onOpenDrawer: () => void;
  onOpenQuickAdd: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenDrawer, onOpenQuickAdd }) => {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EFE6DD] px-3 py-1.5 shadow-warm-lg">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Home */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            pathname === '/dashboard' ? 'text-[#6E8B74] font-bold' : 'text-[#7C6E6A]'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${pathname === '/dashboard' ? 'text-[#6E8B74]' : 'text-[#7C6E6A]'}`} />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>

        {/* Budgets */}
        <Link
          href="/budgets"
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            pathname === '/budgets' ? 'text-[#6E8B74] font-bold' : 'text-[#7C6E6A]'
          }`}
        >
          <Wallet className={`w-5 h-5 ${pathname === '/budgets' ? 'text-[#6E8B74]' : 'text-[#7C6E6A]'}`} />
          <span className="text-[10px] font-semibold">Budgets</span>
        </Link>

        {/* Central Floating Quick Add Action Button */}
        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="flex flex-col items-center justify-center -mt-5 bg-[#6E8B74] hover:bg-[#5C7862] text-white w-12 h-12 rounded-full shadow-lg shadow-[#6E8B74]/30 active:scale-95 transition-all border-4 border-white"
          aria-label="Add New Transaction"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Transactions */}
        <Link
          href="/transactions"
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            pathname === '/transactions' ? 'text-[#6E8B74] font-bold' : 'text-[#7C6E6A]'
          }`}
        >
          <ArrowLeftRight className={`w-5 h-5 ${pathname === '/transactions' ? 'text-[#6E8B74]' : 'text-[#7C6E6A]'}`} />
          <span className="text-[10px] font-semibold">Activity</span>
        </Link>

        {/* More Drawer */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 text-[#7C6E6A] hover:text-[#3A2E2B]"
        >
          <Menu className="w-5 h-5 text-[#7C6E6A]" />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </div>
    </nav>
  );
};
