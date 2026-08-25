'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={twMerge(clsx('animate-pulse bg-[#EFE6DD] rounded-2xl', className))}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-3xl p-6 border border-[#EFE6DD] shadow-warm space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <Skeleton className="h-8 w-36" />
    <Skeleton className="h-2.5 w-full rounded-full" />
  </div>
);

export const SkeletonRow: React.FC = () => (
  <div className="py-3.5 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-2xl" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-5 w-16" />
  </div>
);
