'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, DollarSign, AlertCircle } from 'lucide-react';

export type PiggyState = 'happy' | 'excited' | 'worried' | 'sleepy' | 'sad' | 'celebration';

interface CatPiggyBankProps {
  spentAmount?: number;
  totalBudget?: number;
  savingsGoalProgress?: number; // 0 to 100
  recentActivityDays?: number;
  currencySymbol?: string;
  className?: string;
  size?: number;
}

export const CatPiggyBank: React.FC<CatPiggyBankProps> = ({
  spentAmount = 0,
  totalBudget = 4000,
  savingsGoalProgress = 65,
  recentActivityDays = 0,
  currencySymbol = '₱',
  className = '',
  size = 140
}) => {
  // Determine state & message dynamically from real numbers
  const { state, message } = useMemo(() => {
    const pct = totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0;

    if (savingsGoalProgress >= 100) {
      return {
        state: 'celebration' as PiggyState,
        message: `Yay! You reached 100% of your savings goal! 🎉`
      };
    }

    if (pct > 100) {
      return {
        state: 'sad' as PiggyState,
        message: `Oh no! Spending exceeds your budget cap by ${currencySymbol}${(spentAmount - totalBudget).toLocaleString()}.`
      };
    }

    if (pct >= 85) {
      return {
        state: 'worried' as PiggyState,
        message: `Careful! Your spending is at ${pct.toFixed(0)}% of your budget limit.`
      };
    }

    if (savingsGoalProgress >= 75) {
      return {
        state: 'excited' as PiggyState,
        message: `Awesome! You reached ${savingsGoalProgress}% of your savings goal! 🚀`
      };
    }

    if (recentActivityDays >= 3) {
      return {
        state: 'sleepy' as PiggyState,
        message: `Purr... No new transactions recently. All quiet! 💤`
      };
    }

    return {
      state: 'happy' as PiggyState,
      message: `Meow! You're doing great keeping within budget this month! 🐾`
    };
  }, [spentAmount, totalBudget, savingsGoalProgress, recentActivityDays, currencySymbol]);

  // SVG color palette per state
  const earColor = state === 'worried' || state === 'sad' ? '#E2856E' : state === 'celebration' || state === 'excited' ? '#D99B26' : '#6E8B74';
  const bodyBg = '#FFF8EA';

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-4 ${className}`}>
      {/* Speech Bubble */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        key={message}
        className="relative bg-white border border-[#EFE6DD] shadow-warm rounded-2xl p-3 sm:p-4 text-xs font-semibold text-[#3A2E2B] max-w-xs text-center sm:text-left z-10"
      >
        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-[#6E8B74] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#D99B26]" />
          <span>Budget Cat Assistant</span>
        </div>
        <p className="leading-relaxed">{message}</p>
        
        {/* Pointer Arrow */}
        <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-white" />
      </motion.div>

      {/* Cat Piggy Mascot Animation Box */}
      <div className="relative flex items-center justify-center">
        {/* Floating particles for Celebration or Excited */}
        <AnimatePresence>
          {(state === 'celebration' || state === 'excited') && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10, x: -10 }}
                animate={{ opacity: [0, 1, 0], y: -40, x: -20 }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute text-[#D99B26] pointer-events-none"
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10, x: 10 }}
                animate={{ opacity: [0, 1, 0], y: -45, x: 25 }}
                transition={{ repeat: Infinity, duration: 2.2, delay: 0.5 }}
                className="absolute text-[#E2856E] pointer-events-none"
              >
                <Heart className="w-5 h-5 fill-current" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10, x: 0 }}
                animate={{ opacity: [0, 1, 0], y: -50, x: 0 }}
                transition={{ repeat: Infinity, duration: 2.5, delay: 0.8 }}
                className="absolute text-[#6E8B74] pointer-events-none"
              >
                <DollarSign className="w-5 h-5" />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Cat Body SVG with Breathing & Bounce */}
        <motion.div
          animate={{
            y: state === 'excited' || state === 'celebration' ? [0, -6, 0] : [0, -2, 0],
            scale: state === 'sleepy' ? [1, 0.99, 1] : [1, 1.02, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: state === 'excited' ? 1.2 : 3,
            ease: 'easeInOut'
          }}
          className="relative cursor-pointer"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Animated Tail */}
            <motion.path
              d="M 95 85 C 110 80, 115 60, 105 50"
              stroke="#3A2E2B"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              animate={{ rotate: state === 'excited' ? [-8, 8, -8] : [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              style={{ transformOrigin: '95px 85px' }}
            />

            {/* Left Ear */}
            <polygon points="30,48 18,12 50,34" fill={earColor} />
            <polygon points="33,45 24,20 47,34" fill="#FDF1EE" />
            <path d="M30 48 L18 12 L50 34" stroke="#3A2E2B" strokeWidth="4" strokeLinejoin="round" />

            {/* Right Ear */}
            <polygon points="90,48 102,12 70,34" fill={earColor} />
            <polygon points="87,45 96,20 73,34" fill="#FDF1EE" />
            <path d="M90 48 L102 12 L70 34" stroke="#3A2E2B" strokeWidth="4" strokeLinejoin="round" />

            {/* Cat Body/Head */}
            <ellipse cx="60" cy="65" rx="42" ry="36" fill={bodyBg} stroke="#3A2E2B" strokeWidth="4.5" />

            {/* Coin Slot on Head */}
            <rect x="50" y="33" width="20" height="5" rx="2.5" fill="#D99B26" stroke="#3A2E2B" strokeWidth="2" />

            {/* Eyes according to State */}
            {state === 'happy' && (
              <>
                <circle cx="44" cy="60" r="4.5" fill="#3A2E2B" />
                <circle cx="76" cy="60" r="4.5" fill="#3A2E2B" />
                <circle cx="42.5" cy="58.5" r="1.5" fill="#FFF" />
                <circle cx="74.5" cy="58.5" r="1.5" fill="#FFF" />
              </>
            )}

            {state === 'excited' || state === 'celebration' ? (
              <>
                {/* Star eyes */}
                <path d="M44 54 L46 58 L50 58 L47 61 L48 65 L44 62 L40 65 L41 61 L38 58 L42 58 Z" fill="#D99B26" stroke="#3A2E2B" strokeWidth="1.5" />
                <path d="M76 54 L78 58 L82 58 L79 61 L80 65 L76 62 L72 65 L73 61 L70 58 L74 58 Z" fill="#D99B26" stroke="#3A2E2B" strokeWidth="1.5" />
              </>
            ) : null}

            {state === 'worried' && (
              <>
                {/* Concerned eyebrows & eyes */}
                <path d="M38 53 L48 56" stroke="#3A2E2B" strokeWidth="3" strokeLinecap="round" />
                <path d="M82 53 L72 56" stroke="#3A2E2B" strokeWidth="3" strokeLinecap="round" />
                <circle cx="44" cy="62" r="4" fill="#3A2E2B" />
                <circle cx="76" cy="62" r="4" fill="#3A2E2B" />
              </>
            )}

            {state === 'sleepy' && (
              <>
                {/* Closed Zzz Eyes */}
                <path d="M38 62 Q44 56 50 62" stroke="#3A2E2B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M70 62 Q76 56 82 62" stroke="#3A2E2B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <text x="88" y="44" fontSize="12" fontWeight="bold" fill="#7C6E6A">z</text>
                <text x="94" y="36" fontSize="10" fontWeight="bold" fill="#7C6E6A">Z</text>
              </>
            )}

            {state === 'sad' && (
              <>
                {/* Sad arcs */}
                <path d="M38 62 Q44 68 50 62" stroke="#3A2E2B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M70 62 Q76 68 82 62" stroke="#3A2E2B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                {/* Tear drop */}
                <ellipse cx="36" cy="68" rx="2" ry="4" fill="#5A96B6" />
              </>
            )}

            {/* Nose & Whiskers */}
            <polygon points="57,69 63,69 60,73" fill="#E2856E" />
            <path d="M54 75 Q60 80 66 75" stroke="#3A2E2B" strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Whiskers */}
            <line x1="24" y1="64" x2="36" y2="66" stroke="#3A2E2B" strokeWidth="2" strokeLinecap="round" />
            <line x1="22" y1="70" x2="36" y2="70" stroke="#3A2E2B" strokeWidth="2" strokeLinecap="round" />
            <line x1="96" y1="64" x2="84" y2="66" stroke="#3A2E2B" strokeWidth="2" strokeLinecap="round" />
            <line x1="98" y1="70" x2="84" y2="70" stroke="#3A2E2B" strokeWidth="2" strokeLinecap="round" />

            {/* Rosy Cheeks */}
            <circle cx="34" cy="68" r="5" fill="#E2856E" opacity="0.4" />
            <circle cx="86" cy="68" r="5" fill="#E2856E" opacity="0.4" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
};
