'use client';

import React from 'react';
import { useSync } from '@/lib/hooks/useSync';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SyncIndicator: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { status, pendingCount, triggerSync } = useSync();

  let icon = <CheckCircle2 className="w-4 h-4 text-[#6E8B74]" />;
  let label = 'Everything is synced.';
  let bgClass = 'bg-[#EBF1EC] text-[#6E8B74] border-[#D1E2D4]';

  if (status === 'offline') {
    icon = <WifiOff className="w-4 h-4 text-[#E2856E]" />;
    label = "You're offline. Your changes are safely stored on this device.";
    bgClass = 'bg-[#FDF1EE] text-[#E2856E] border-[#F8D7CF]';
  } else if (status === 'syncing') {
    icon = <RefreshCw className="w-4 h-4 text-[#D99B26] animate-spin" />;
    label = 'Connection restored. Syncing your changes...';
    bgClass = 'bg-[#FFF8EA] text-[#D99B26] border-[#F7E7C4]';
  } else if (status === 'error') {
    icon = <AlertCircle className="w-4 h-4 text-red-500" />;
    label = "Some changes couldn't sync. Tap to retry.";
    bgClass = 'bg-red-50 text-red-600 border-red-200 cursor-pointer';
  } else if (pendingCount > 0) {
    icon = <RefreshCw className="w-4 h-4 text-[#D99B26]" />;
    label = `Syncing ${pendingCount} change${pendingCount > 1 ? 's' : ''}...`;
    bgClass = 'bg-[#FFF8EA] text-[#D99B26] border-[#F7E7C4]';
  }

  if (compact) {
    return (
      <button
        onClick={triggerSync}
        title={label}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${bgClass}`}
      >
        {icon}
        <span className="hidden sm:inline">
          {status === 'offline' ? 'Saved locally' : status === 'syncing' ? 'Syncing...' : status === 'error' ? 'Sync Error' : 'Synced'}
        </span>
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        onClick={status === 'error' || pendingCount > 0 ? triggerSync : undefined}
        className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-medium border shadow-sm ${bgClass}`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </div>
        {(status === 'error' || (status !== 'syncing' && status !== 'offline' && pendingCount > 0)) && (
          <button
            onClick={triggerSync}
            className="underline hover:opacity-80 font-bold"
          >
            Tap to retry
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
