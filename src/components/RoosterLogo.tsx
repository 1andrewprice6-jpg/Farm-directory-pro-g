import React from 'react';

export const RoosterSVG = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* A stylized rooster / bird using basic geometric paths representing a technical blueprint */}
    <path d="M12 2C8 2 5 5 5 10c0 3 1.5 6 4 8 2 1.5 5 2 8 2 2 0 3-1 3-3s-2-3-4-3c-1.5 0-3 1-3 1s-1-2-1-4c0-2.5 1-4 3-5 1.5-1 4-.5 4-.5s1-2.5 0-4-3-3-5-3h-1z" />
    <path d="M12 2v4" />
    <path d="M9 4v3" />
    <path d="M15 4v3" />
    <path d="M22 10l-3-1" />
    <path d="M22 12l-3 1" />
    <circle cx="16" cy="8" r="1" fill="currentColor" />
    <path d="M3 14c2-1 4-1 6 0" />
    <path d="M2 17c3-1 6-1 9 0" />
    <path d="M4 20c2-1 5-1 7 0" />
  </svg>
);
