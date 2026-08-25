'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { CatIllustration } from './ui/CatIllustration';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSBanner, setShowIOSBanner] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed = localStorage.getItem('budget_cat_pwa_dismissed');
    if (dismissed === 'true') return;

    setIsDismissed(false);

    // Chrome / Android / Windows PWA Install prompt listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Detect iOS WebKit Safari standalone mode
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if (isIOS && !isStandalone) {
      setShowIOSBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    }
    setDeferredPrompt(null);
    dismissBanner();
  };

  const dismissBanner = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('budget_cat_pwa_dismissed', 'true');
    }
  };

  if (isDismissed || (!deferredPrompt && !showIOSBanner)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:max-w-sm z-50 bg-white border border-[#EFE6DD] shadow-warm-lg rounded-3xl p-4 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <CatIllustration mood="logo" size={40} />
          <div>
            <h4 className="text-xs font-bold text-[#3A2E2B]">Install Budget Cat</h4>
            <p className="text-[10px] text-[#7C6E6A]">
              {showIOSBanner 
                ? 'Tap Share → Add to Home Screen for offline PWA app access.' 
                : 'Install app on home screen for 100% offline access.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {deferredPrompt && (
            <Button size="sm" variant="sage" onClick={handleInstallClick} leftIcon={<Download className="w-3.5 h-3.5" />}>
              Install
            </Button>
          )}
          <button
            onClick={dismissBanner}
            className="p-1.5 text-[#7C6E6A] hover:bg-[#FAF6F0] rounded-full"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
