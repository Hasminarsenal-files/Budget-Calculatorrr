'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  PiggyBank, 
  Menu
} from 'lucide-react';

export const MobileNav: React.FC<{ onOpenDrawer: () => void }> = ({ onOpenDrawer }) => {
  const pathname = usePathname();

  const primaryNav = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Budgets', href: '/budgets', icon: Wallet },
    { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Savings', href: '/savings', icon: PiggyBank },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EFE6DD] px-4 py-2 shadow-warm-lg">
      <div className="flex items-center justify-around">
        {primaryNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                isActive ? 'text-[#6E8B74] font-bold' : 'text-[#7C6E6A]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#6E8B74]' : 'text-[#7C6E6A]'}`} />
              <span className="text-[10px] font-semibold">{item.name}</span>
            </Link>
          );
        })}

        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center gap-1 py-1 px-3 text-[#7C6E6A] hover:text-[#3A2E2B]"
        >
          <Menu className="w-5 h-5 text-[#7C6E6A]" />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </div>
    </nav>
  );
};
