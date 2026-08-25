'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#3A2E2B]/50 backdrop-blur-sm"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
            className={`relative w-full ${widths[maxWidth]} bg-white rounded-3xl border border-[#EFE6DD] shadow-2xl z-10 max-h-[85vh] flex flex-col overflow-hidden`}
          >
            {/* Header (Sticky top) */}
            {(title || description) && (
              <div className="px-6 py-4 border-b border-[#EFE6DD] flex items-start justify-between flex-shrink-0 bg-[#FCF9F6]">
                <div>
                  {title && <h2 className="text-lg sm:text-xl font-black text-[#3A2E2B]">{title}</h2>}
                  {description && <p className="text-xs text-[#7C6E6A] mt-0.5">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-[#7C6E6A] hover:bg-[#FAF6F0] hover:text-[#3A2E2B] transition-colors -mr-1"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content (Scrollable interior) */}
            <div className="px-6 py-5 overflow-y-auto flex-1 overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
