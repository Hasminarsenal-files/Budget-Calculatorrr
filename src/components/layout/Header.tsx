'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { SyncIndicator } from '../ui/SyncIndicator';
import { CatIllustration } from '../ui/CatIllustration';
import { Bell, LogOut, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const Header: React.FC = () => {
  const { profile, logoutUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDropdownOpen(false);
    await logoutUser();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#EFE6DD] px-4 sm:px-8 py-3 flex items-center justify-between">
      {/* Title / Welcome */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-[#3A2E2B] tracking-tight truncate">
            Hi, {profile?.full_name || 'Budgeter'} 🐾
          </h2>
          <p className="text-xs text-[#7C6E6A] hidden sm:block">Track income, bills, and goals with ease.</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Sync Indicator Pill */}
        <SyncIndicator compact />

        {/* Notifications */}
        <button
          type="button"
          className="p-2 rounded-2xl bg-white border border-[#EFE6DD] text-[#7C6E6A] hover:text-[#3A2E2B] hover:border-[#6E8B74] transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E2856E] rounded-full" />
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 bg-white border border-[#EFE6DD] hover:border-[#6E8B74] px-2 sm:px-2.5 py-1.5 rounded-2xl transition-all shadow-sm active:scale-95"
            aria-expanded={dropdownOpen}
            aria-label="User menu"
          >
            <div className="w-7 h-7 rounded-full bg-[#EBF1EC] flex items-center justify-center overflow-hidden shrink-0">
              <CatIllustration mood="happy" size={26} />
            </div>
            <span className="text-xs font-bold text-[#3A2E2B] hidden md:inline truncate max-w-[100px]">
              {profile?.full_name || 'Account'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#7C6E6A] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Backdrop to close dropdown reliably on mobile touch or desktop click outside */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              {/* Dropdown Menu */}
              <div 
                className="absolute right-0 mt-2 w-52 bg-white border border-[#EFE6DD] rounded-2xl shadow-warm-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-4 py-2 border-b border-[#EFE6DD]">
                  <p className="text-xs font-bold text-[#3A2E2B] truncate">{profile?.full_name || 'Budget Cat User'}</p>
                  <p className="text-[11px] text-[#7C6E6A] truncate">{profile?.email || 'Logged in'}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#3A2E2B] hover:bg-[#FAF6F0] transition-colors font-medium"
                >
                  <Settings className="w-4 h-4 text-[#7C6E6A]" />
                  Profile Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors text-left font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
