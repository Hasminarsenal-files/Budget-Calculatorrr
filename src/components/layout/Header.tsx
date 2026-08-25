'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { SyncIndicator } from '../ui/SyncIndicator';
import { CatIllustration } from '../ui/CatIllustration';
import { Bell, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export const Header: React.FC = () => {
  const { profile, logoutUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#EFE6DD] px-4 sm:px-8 py-3 flex items-center justify-between">
      {/* Title / Welcome */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#3A2E2B] tracking-tight">
            Hi, {profile?.full_name || 'Budgeter'} 🐾
          </h2>
          <p className="text-xs text-[#7C6E6A] hidden sm:block">Track income, bills, and goals with ease.</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Sync Indicator Pill */}
        <SyncIndicator compact />

        {/* Notifications */}
        <button
          className="p-2 rounded-2xl bg-white border border-[#EFE6DD] text-[#7C6E6A] hover:text-[#3A2E2B] hover:border-[#6E8B74] transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E2856E] rounded-full" />
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-white border border-[#EFE6DD] hover:border-[#6E8B74] px-2.5 py-1.5 rounded-2xl transition-all shadow-sm"
          >
            <div className="w-7 h-7 rounded-full bg-[#EBF1EC] flex items-center justify-center overflow-hidden">
              <CatIllustration mood="happy" size={28} />
            </div>
            <span className="text-xs font-bold text-[#3A2E2B] hidden md:inline truncate max-w-[100px]">
              {profile?.full_name || 'Account'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#7C6E6A]" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div 
              className="absolute right-0 mt-2 w-48 bg-white border border-[#EFE6DD] rounded-2xl shadow-warm-lg py-2 z-50"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-4 py-2 border-b border-[#EFE6DD]">
                <p className="text-xs font-bold text-[#3A2E2B] truncate">{profile?.full_name}</p>
                <p className="text-[11px] text-[#7C6E6A] truncate">{profile?.email}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-[#3A2E2B] hover:bg-[#FAF6F0] transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-[#7C6E6A]" />
                Profile Settings
              </Link>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logoutUser();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
