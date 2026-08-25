'use client';

import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  showPasswordToggle,
  className,
  id,
  type,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const isPasswordField = type === 'password';
  const resolvedType = isPasswordField && showPasswordToggle
    ? (showPassword ? 'text' : 'password')
    : type;

  const hasRightSlot = rightIcon || (isPasswordField && showPasswordToggle);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#3A2E2B] tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-[#7C6E6A] pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          className={twMerge(
            clsx(
              'w-full bg-white border border-[#EFE6DD] text-[#3A2E2B] placeholder-[#A39691] rounded-2xl px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:border-[#6E8B74] focus:ring-2 focus:ring-[#6E8B74]/20 disabled:opacity-50 disabled:bg-[#FAF6F0]',
              leftIcon && 'pl-10',
              hasRightSlot && 'pr-10',
              error && 'border-red-400 focus:border-red-500 focus:ring-red-400/20',
              className
            )
          )}
          {...props}
        />
        {/* Show/hide password toggle */}
        {isPasswordField && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 text-[#7C6E6A] hover:text-[#3A2E2B] transition-colors focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {/* Custom right icon (non-password) */}
        {!isPasswordField && rightIcon && (
          <div className="absolute right-3.5 text-[#7C6E6A]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
      {hint && !error && <span className="text-xs text-[#7C6E6A]">{hint}</span>}
    </div>
  );
});

Input.displayName = 'Input';
