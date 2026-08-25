'use client';

import React from 'react';
import { CatMood } from '@/lib/types';

interface CatIllustrationProps {
  mood?: CatMood | 'logo';
  className?: string;
  size?: number;
}

export const CatIllustration: React.FC<CatIllustrationProps> = ({
  mood = 'happy',
  className = '',
  size = 64
}) => {
  if (mood === 'logo') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Cat Ears */}
        <polygon points="25,40 15,10 42,28" fill="#6E8B74" />
        <polygon points="28,37 20,16 40,28" fill="#FDF1EE" />
        <polygon points="75,40 85,10 58,28" fill="#6E8B74" />
        <polygon points="72,37 80,16 60,28" fill="#FDF1EE" />

        {/* Cat Head */}
        <ellipse cx="50" cy="55" rx="35" ry="30" fill="#FFF8EA" stroke="#3A2E2B" strokeWidth="4" />
        
        {/* Cat Ears Outlines */}
        <path d="M25 40 L15 10 L42 28" stroke="#3A2E2B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M75 40 L85 10 L58 28" stroke="#3A2E2B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        {/* Cute Eyes (Happy Arcs) */}
        <path d="M35 50 Q40 43 45 50" stroke="#3A2E2B" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M55 50 Q60 43 65 50" stroke="#3A2E2B" strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* Cute Nose & Mouth */}
        <polygon points="48,58 52,58 50,61" fill="#E2856E" />
        <path d="M45 64 Q50 68 55 64" stroke="#3A2E2B" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Cheeks */}
        <circle cx="32" cy="58" r="5" fill="#E2856E" opacity="0.4" />
        <circle cx="68" cy="58" r="5" fill="#E2856E" opacity="0.4" />

        {/* Coin in mouth or head */}
        <circle cx="50" cy="22" r="10" fill="#D99B26" stroke="#3A2E2B" strokeWidth="2.5" />
        <text x="50" y="26" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#FFF">$</text>
      </svg>
    );
  }

  if (mood === 'saving') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
        {/* Ears */}
        <polygon points="25,40 15,10 42,28" fill="#E2856E" />
        <polygon points="75,40 85,10 58,28" fill="#E2856E" />
        <ellipse cx="50" cy="55" rx="35" ry="30" fill="#FFF" stroke="#3A2E2B" strokeWidth="4" />
        <path d="M25 40 L15 10 L42 28" stroke="#3A2E2B" strokeWidth="4" strokeLinejoin="round" />
        <path d="M75 40 L85 10 L58 28" stroke="#3A2E2B" strokeWidth="4" strokeLinejoin="round" />
        {/* Starry sparkle eyes */}
        <circle cx="38" cy="50" r="4" fill="#3A2E2B" />
        <circle cx="62" cy="50" r="4" fill="#3A2E2B" />
        <path d="M47 58 L53 58 L50 61 Z" fill="#E2856E" />
        <path d="M44 65 Q50 70 56 65" stroke="#3A2E2B" strokeWidth="3" fill="none" />
        {/* Piggy Bank */}
        <ellipse cx="50" cy="80" rx="16" ry="12" fill="#E2856E" stroke="#3A2E2B" strokeWidth="3" />
        <circle cx="58" cy="78" r="2" fill="#3A2E2B" />
      </svg>
    );
  }

  if (mood === 'warning') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
        <polygon points="25,40 15,10 42,28" fill="#E2856E" />
        <polygon points="75,40 85,10 58,28" fill="#E2856E" />
        <ellipse cx="50" cy="55" rx="35" ry="30" fill="#FFF8EA" stroke="#3A2E2B" strokeWidth="4" />
        <path d="M25 40 L15 10 L42 28" stroke="#3A2E2B" strokeWidth="4" />
        <path d="M75 40 L85 10 L58 28" stroke="#3A2E2B" strokeWidth="4" />
        {/* Shocked eyes */}
        <circle cx="36" cy="48" r="6" stroke="#3A2E2B" strokeWidth="3" fill="#FFF" />
        <circle cx="36" cy="48" r="2" fill="#3A2E2B" />
        <circle cx="64" cy="48" r="6" stroke="#3A2E2B" strokeWidth="3" fill="#FFF" />
        <circle cx="64" cy="48" r="2" fill="#3A2E2B" />
        {/* O mouth */}
        <ellipse cx="50" cy="65" rx="4" ry="6" fill="#E2856E" stroke="#3A2E2B" strokeWidth="2" />
        <circle cx="30" cy="58" r="4" fill="#E2856E" opacity="0.3" />
        <circle cx="70" cy="58" r="4" fill="#E2856E" opacity="0.3" />
      </svg>
    );
  }

  if (mood === 'rich') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
        <polygon points="25,40 15,10 42,28" fill="#D99B26" />
        <polygon points="75,40 85,10 58,28" fill="#D99B26" />
        <ellipse cx="50" cy="55" rx="35" ry="30" fill="#FFF8EA" stroke="#3A2E2B" strokeWidth="4" />
        <path d="M25 40 L15 10 L42 28" stroke="#3A2E2B" strokeWidth="4" />
        <path d="M75 40 L85 10 L58 28" stroke="#3A2E2B" strokeWidth="4" />
        {/* Cool Sunglasses */}
        <rect x="25" y="44" width="22" height="14" rx="3" fill="#3A2E2B" />
        <rect x="53" y="44" width="22" height="14" rx="3" fill="#3A2E2B" />
        <line x1="47" y1="48" x2="53" y2="48" stroke="#3A2E2B" strokeWidth="3" />
        {/* Smirk */}
        <path d="M46 64 Q54 68 58 62" stroke="#3A2E2B" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  // Default Happy Cat
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
      <polygon points="25,40 15,10 42,28" fill="#6E8B74" />
      <polygon points="75,40 85,10 58,28" fill="#6E8B74" />
      <ellipse cx="50" cy="55" rx="35" ry="30" fill="#FFF" stroke="#3A2E2B" strokeWidth="4" />
      <path d="M25 40 L15 10 L42 28" stroke="#3A2E2B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M75 40 L85 10 L58 28" stroke="#3A2E2B" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="36" cy="50" r="4" fill="#3A2E2B" />
      <circle cx="64" cy="50" r="4" fill="#3A2E2B" />
      <polygon points="48,56 52,56 50,59" fill="#E2856E" />
      <path d="M43 62 Q50 67 57 62" stroke="#3A2E2B" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="28" cy="56" r="4" fill="#E2856E" opacity="0.35" />
      <circle cx="72" cy="56" r="4" fill="#E2856E" opacity="0.35" />
    </svg>
  );
};
