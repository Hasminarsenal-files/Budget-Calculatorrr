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
    <div className="min-h-screen bg-[#FAF6F0] text-[#3A2E2B] flex flex-col">
      {/* Navigation Header */}
      <header className="px-6 py-4 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CatIllustration mood="logo" size={48} />
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#3A2E2B]">Budget Cat</h1>
            <p className="text-[11px] font-semibold text-[#6E8B74]">Purr-fect Personal Finance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button variant="sage" size="sm">Get Started Free</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-12 md:py-20 max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <Badge variant="sage" dot>
            Offline-First • Smart Personal Companion
          </Badge>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#3A2E2B] leading-tight tracking-tight">
            Budget smarter. Save happier. <span className="text-[#6E8B74]">Meow! 🐾</span>
          </h2>

          <p className="text-base sm:text-lg text-[#7C6E6A] leading-relaxed">
            Track your money, create monthly and trip budgets (Cebu, Japan), save for goals, and track recurring bills with your cute animated cat companion. Works 100% offline and syncs automatically when online.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/register">
              <Button variant="sage" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Login to Dashboard
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-6 pt-4 text-xs font-semibold text-[#7C6E6A]">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#6E8B74]" /> Supabase RLS Security</span>
            <span className="flex items-center gap-1.5"><WifiOff className="w-4 h-4 text-[#E2856E]" /> Works 100% Offline</span>
          </div>
        </motion.div>

        {/* Hero Visual Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE6DD] shadow-warm-lg space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE6DD]">
              <div className="flex items-center gap-3">
                <CatIllustration mood="rich" size={48} />
                <div>
                  <h3 className="font-bold text-[#3A2E2B]">Total Net Balance</h3>
                  <p className="text-2xl font-black text-[#6E8B74]">₱14,250.00</p>
                </div>
              </div>
              <Badge variant="sage">+12.4% Surplus</Badge>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-[#7C6E6A] tracking-wider mb-3">Active Budgets</p>
              <div className="space-y-3">
                <div className="bg-[#FAF6F0] p-3.5 rounded-2xl flex items-center justify-between border border-[#EFE6DD]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#EBF1EC] text-[#6E8B74] rounded-xl">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#3A2E2B]">Monthly Household</p>
                      <p className="text-[11px] text-[#7C6E6A]">₱2,400 spent of ₱4,000</p>
                    </div>
                  </div>
                  <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#6E8B74] h-full w-[60%]" />
                  </div>
                </div>

                <div className="bg-[#FAF6F0] p-3.5 rounded-2xl flex items-center justify-between border border-[#EFE6DD]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#FDF1EE] text-[#E2856E] rounded-xl">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#3A2E2B]">Trip to Cebu 🏝️</p>
                      <p className="text-[11px] text-[#7C6E6A]">Temporary Event Budget</p>
                    </div>
                  </div>
                  <Badge variant="peach">₱1,850 left</Badge>
                </div>
              </div>
            </div>

            <div className="bg-[#EBF1EC] text-[#6E8B74] p-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <WifiOff className="w-4 h-4" />
              <span>Offline Ready — Instant sync when reconnecting</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-16 border-t border-[#EFE6DD]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="honey">Smart Financial Companion</Badge>
            <h3 className="text-3xl font-black text-[#3A2E2B]">Everything You Need for Financial Freedom</h3>
            <p className="text-sm text-[#7C6E6A]">
              Track your money, create monthly and trip budgets, save for goals, track recurring bills, all with a cute cat companion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="space-y-3">
              <div className="p-3 bg-[#EBF1EC] text-[#6E8B74] w-fit rounded-2xl">
                <WifiOff className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg text-[#3A2E2B]">Works 100% Offline</h4>
              <p className="text-xs text-[#7C6E6A] leading-relaxed">
                Log expenses on airplanes or remote travels. Dexie IndexedDB stores records locally and syncs with Supabase automatically when connection returns.
              </p>
            </Card>

            <Card className="space-y-3">
              <div className="p-3 bg-[#FDF1EE] text-[#E2856E] w-fit rounded-2xl">
                <Plane className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg text-[#3A2E2B]">Trips & Event Trackers</h4>
              <p className="text-xs text-[#7C6E6A] leading-relaxed">
                Set up dedicated budgets for Cebu trips, galas, shopping, weddings, or emergency funds with custom category planned allocations.
              </p>
            </Card>

            <Card className="space-y-3">
              <div className="p-3 bg-[#FFF8EA] text-[#D99B26] w-fit rounded-2xl">
                <PiggyBank className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg text-[#3A2E2B]">Cute Cat Companion</h4>
              <p className="text-xs text-[#7C6E6A] leading-relaxed">
                Your virtual cat piggy bank mascot changes mood dynamically (Happy, Excited, Worried, Sad, Celebration) to guide your savings.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#FAF6F0] border-t border-[#EFE6DD] py-8 px-6 text-center text-xs text-[#7C6E6A]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CatIllustration mood="logo" size={32} />
            <span className="font-bold text-[#3A2E2B]">Budget Cat App</span>
          </div>
          <p>© {new Date().getFullYear()} Budget Cat. Crafted with 🐾 and care.</p>
        </div>
      </footer>
    </div>
  );
}
