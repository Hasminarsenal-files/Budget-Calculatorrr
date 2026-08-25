'use client';

import React from 'react';
import { CatIllustration } from './CatIllustration';
import { CatMood } from '@/lib/types';
import { Button } from './Button';
import { Plus } from 'lucide-react';

export interface EmptyStateProps {
  type: 'transactions' | 'savings' | 'budgets' | 'bills' | 'general';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  catMood?: CatMood;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionText,
  onAction,
  catMood = 'sleeping'
}) => {
  const defaultContent = {
    transactions: {
      title: "Your cat's wallet is still empty.",
      description: "Record your first income or expense to start tracking.",
      actionText: "Add Transaction",
      mood: 'sleeping' as CatMood
    },
    savings: {
      title: "Give your cat something to save for!",
      description: "Set a savings target for a new gadget, travel, or emergency fund.",
      actionText: "Create Goal",
      mood: 'saving' as CatMood
    },
    budgets: {
      title: "Let's create your first budget!",
      description: "Set monthly or event budget caps to keep spending under control.",
      actionText: "Create Budget",
      mood: 'happy' as CatMood
    },
    bills: {
      title: "No bills chasing your cat today!",
      description: "Add recurring utilities, internet, or subscription payments.",
      actionText: "Add Bill",
      mood: 'rich' as CatMood
    },
    general: {
      title: "No items found",
      description: "There are no records to show here yet.",
      actionText: "Add Record",
      mood: 'detective' as CatMood
    }
  };

  const content = defaultContent[type] || defaultContent.general;

  return (
    <div className="bg-white rounded-3xl p-8 border border-[#EFE6DD] shadow-warm text-center flex flex-col items-center justify-center space-y-4 my-4">
      <CatIllustration mood={catMood || content.mood} size={80} />
      <div className="space-y-1 max-w-sm">
        <h3 className="text-lg font-bold text-[#3A2E2B]">{title || content.title}</h3>
        <p className="text-xs text-[#7C6E6A] leading-relaxed">{description || content.description}</p>
      </div>
      {onAction && (
        <Button
          variant="sage"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={onAction}
          className="mt-2"
        >
          {actionText || content.actionText}
        </Button>
      )}
    </div>
  );
};
