'use client';

import React from 'react';
import Link from 'next/link';
import { CatIllustration } from '@/components/ui/CatIllustration';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Wallet, 
  WifiOff, 
  Sparkles, 
  ShieldCheck, 
  Plane, 
  PiggyBank, 
  ArrowRight,
  TrendingUp,
  Receipt,
  Heart
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#3A2E2B] flex flex-col selection:bg-[#6E8B74] selection:text-white">
      {/* Navigation Header */}
      <header className="px-4 sm:px-6 py-3.5 sm:py-4 max-w-7xl w-full mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <CatIllustration mood="logo" size={38} className="sm:w-12 sm:h-12" />
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#3A2E2B] leading-none">Budget Cat</h1>
            <p className="text-[10px] sm:text-[11px] font-semibold text-[#6E8B74] mt-0.5">Purr-fect Personal Finance</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="px-2.5 sm:px-3 text-xs sm:text-sm font-semibold">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="sage" size="sm" className="px-3 sm:px-4 text-xs sm:text-sm font-bold shadow-sm">
              Get Started Free
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-8 sm:py-12 md:py-20 max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-5 sm:space-y-6"
        >
          <div className="inline-block">
            <Badge variant="sage" dot className="text-[11px] sm:text-xs">
              Offline-First • Smart Personal Companion
            </Badge>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#3A2E2B] leading-[1.15] tracking-tight">
            Budget smarter. Save happier. <span className="text-[#6E8B74] inline-block">Meow! 🐾</span>
          </h2>

          <p className="text-sm sm:text-base lg:text-lg text-[#7C6E6A] leading-relaxed text-justify sm:text-left">
            Track your money, create monthly and trip budgets (Cebu, Japan), save for goals, and track recurring bills with your cute animated cat companion. Works 100% offline and syncs automatically when online.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full sm:w-auto">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="sage"
                size="lg"
                className="w-full sm:w-auto justify-center font-bold text-sm sm:text-base py-3.5 px-6 shadow-md"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Get Started
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto justify-center font-bold text-sm sm:text-base py-3.5 px-6"
              >
                Login to Dashboard
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-4 sm:gap-6 pt-2 text-xs font-semibold text-[#7C6E6A]">
            <span className="flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#6E8B74]" /> Supabase RLS Security
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <WifiOff className="w-4 h-4 text-[#E2856E]" /> Works 100% Offline
            </span>
          </div>
        </motion.div>

        {/* Hero Visual Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative mt-2 sm:mt-0"
        >
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-[#EFE6DD] shadow-warm-lg space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD] gap-2">
              <div className="flex items-center gap-3">
                <CatIllustration mood="rich" size={44} className="sm:w-12 sm:h-12 shrink-0" />
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#3A2E2B]">Total Net Balance</h3>
                  <p className="text-xl sm:text-2xl font-black text-[#6E8B74]">₱14,250.00</p>
                </div>
              </div>
              <Badge variant="sage" className="shrink-0 text-[11px] sm:text-xs">+12.4% Surplus</Badge>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-[#7C6E6A] tracking-wider mb-3">Active Budgets</p>
              <div className="space-y-3">
                <div className="bg-[#FAF6F0] p-3.5 rounded-2xl flex items-center justify-between border border-[#EFE6DD] gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="p-2.5 bg-[#EBF1EC] text-[#6E8B74] rounded-xl shrink-0">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#3A2E2B] truncate">Monthly Household</p>
                      <p className="text-[11px] text-[#7C6E6A]">₱2,400 spent of ₱4,000</p>
                    </div>
                  </div>
                  <div className="w-16 sm:w-20 bg-gray-200 h-2 rounded-full overflow-hidden shrink-0">
                    <div className="bg-[#6E8B74] h-full w-[60%]" />
                  </div>
                </div>

                <div className="bg-[#FAF6F0] p-3.5 rounded-2xl flex items-center justify-between border border-[#EFE6DD] gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="p-2.5 bg-[#FDF1EE] text-[#E2856E] rounded-xl shrink-0">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#3A2E2B] truncate">Trip to Cebu 🏝️</p>
                      <p className="text-[11px] text-[#7C6E6A]">Temporary Event Budget</p>
                    </div>
                  </div>
                  <Badge variant="peach" className="shrink-0 text-[11px]">₱1,850 left</Badge>
                </div>
              </div>
            </div>

            <div className="bg-[#EBF1EC] text-[#6E8B74] p-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>Offline Ready — Instant sync when reconnecting</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-12 sm:py-16 border-t border-[#EFE6DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
          <div className="text-left sm:text-center max-w-2xl mx-auto space-y-3">
            <div className="flex sm:justify-center">
              <Badge variant="honey">Smart Financial Companion</Badge>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#3A2E2B]">Everything You Need for Financial Freedom</h3>
            <p className="text-sm text-[#7C6E6A] text-justify sm:text-center leading-relaxed">
              Track your money, create monthly and trip budgets, save for goals, track recurring bills, all with a cute cat companion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <Card className="space-y-3 p-5 sm:p-6">
              <div className="p-3 bg-[#EBF1EC] text-[#6E8B74] w-fit rounded-2xl">
                <WifiOff className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base sm:text-lg text-[#3A2E2B]">Works 100% Offline</h4>
              <p className="text-xs text-[#7C6E6A] leading-relaxed text-justify">
                Log expenses on airplanes or remote travels. Dexie IndexedDB stores records locally and syncs with Supabase automatically when connection returns.
              </p>
            </Card>

            <Card className="space-y-3 p-5 sm:p-6">
              <div className="p-3 bg-[#FDF1EE] text-[#E2856E] w-fit rounded-2xl">
                <Plane className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base sm:text-lg text-[#3A2E2B]">Trips & Event Trackers</h4>
              <p className="text-xs text-[#7C6E6A] leading-relaxed text-justify">
                Set up dedicated budgets for Cebu trips, galas, shopping, weddings, or emergency funds with custom category planned allocations.
              </p>
            </Card>

            <Card className="space-y-3 p-5 sm:p-6">
              <div className="p-3 bg-[#FFF8EA] text-[#D99B26] w-fit rounded-2xl">
                <PiggyBank className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base sm:text-lg text-[#3A2E2B]">Cute Cat Companion</h4>
              <p className="text-xs text-[#7C6E6A] leading-relaxed text-justify">
                Your virtual cat piggy bank mascot changes mood dynamically (Happy, Excited, Worried, Sad, Celebration) to guide your savings.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#FAF6F0] border-t border-[#EFE6DD] py-6 sm:py-8 px-4 sm:px-6 text-xs text-[#7C6E6A]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <CatIllustration mood="logo" size={28} />
            <span className="font-bold text-[#3A2E2B]">Budget Cat App</span>
          </div>
          <p>© {new Date().getFullYear()} Budget Cat. Crafted with 🐾 and care.</p>
        </div>
      </footer>
    </div>
  );
}
