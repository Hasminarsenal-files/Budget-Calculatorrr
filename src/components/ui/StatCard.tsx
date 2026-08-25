'use client';

import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { CatIllustration } from './CatIllustration';
import { CatMood } from '@/lib/types';

export interface StatCardProps {
  title: string;
  amount: string | number;
  currency?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  catMood?: CatMood;
  subtitle?: string;
  badgeText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  currency = '$',
  change,
  changeType = 'positive',
  icon,
  catMood,
  subtitle,
  badgeText
}) => {
  const formattedAmount = typeof amount === 'number' 
    ? `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : amount;

  return (
    <Card className="relative overflow-hidden group hover:border-[#6E8B74]/40 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-[#7C6E6A] tracking-wider uppercase">{title}</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#3A2E2B] mt-1 tracking-tight">
            {formattedAmount}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {icon && (
            <div className="p-3 bg-[#FAF6F0] text-[#6E8B74] rounded-2xl border border-[#EFE6DD]">
              {icon}
            </div>
          )}
          {catMood && (
            <div className="w-10 h-10 flex items-center justify-center">
              <CatIllustration mood={catMood} size={40} />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#EFE6DD]/60">
        {change && (
          <div className="flex items-center gap-1 text-xs">
            <span className={changeType === 'positive' ? 'text-[#6E8B74] font-semibold' : changeType === 'negative' ? 'text-[#E2856E] font-semibold' : 'text-[#7C6E6A]'}>
              {change}
            </span>
            {subtitle && <span className="text-[#7C6E6A]">{subtitle}</span>}
          </div>
        )}
        {badgeText && (
          <Badge variant={changeType === 'positive' ? 'sage' : changeType === 'negative' ? 'peach' : 'honey'}>
            {badgeText}
          </Badge>
        )}
      </div>
    </Card>
  );
};
