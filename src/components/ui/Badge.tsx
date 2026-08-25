'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'sage' | 'peach' | 'honey' | 'lavender' | 'sky' | 'gray' | 'danger';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'sage',
  size = 'md',
  dot = false,
  className,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full gap-1.5 transition-colors';

  const variants = {
    sage: 'bg-[#EBF1EC] text-[#6E8B74]',
    peach: 'bg-[#FDF1EE] text-[#E2856E]',
    honey: 'bg-[#FFF8EA] text-[#D99B26]',
    lavender: 'bg-[#F4F0F8] text-[#8C7CA6]',
    sky: 'bg-[#EEF6F9] text-[#5A96B6]',
    gray: 'bg-[#FAF6F0] text-[#7C6E6A]',
    danger: 'bg-red-50 text-red-600'
  };

  const dotColors = {
    sage: 'bg-[#6E8B74]',
    peach: 'bg-[#E2856E]',
    honey: 'bg-[#D99B26]',
    lavender: 'bg-[#8C7CA6]',
    sky: 'bg-[#5A96B6]',
    gray: 'bg-[#7C6E6A]',
    danger: 'bg-red-500'
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs'
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))} {...props}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};
