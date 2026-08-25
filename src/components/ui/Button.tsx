'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'sage' | 'peach' | 'honey' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'sage',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';

  const variants = {
    sage: 'bg-[#6E8B74] text-white hover:bg-[#5B7460] focus:ring-[#6E8B74]',
    peach: 'bg-[#E2856E] text-white hover:bg-[#D17159] focus:ring-[#E2856E]',
    honey: 'bg-[#D99B26] text-white hover:bg-[#B8811A] focus:ring-[#D99B26]',
    outline: 'border-2 border-[#EFE6DD] bg-white text-[#3A2E2B] hover:bg-[#FAF6F0] focus:ring-[#6E8B74]',
    ghost: 'bg-transparent text-[#3A2E2B] hover:bg-[#FAF6F0] shadow-none focus:ring-[#6E8B74]',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5'
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      disabled={disabled || isLoading}
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {leftIcon}
          {children && <span>{children}</span>}
          {rightIcon}
        </>
      )}
    </motion.button>
  );
};
