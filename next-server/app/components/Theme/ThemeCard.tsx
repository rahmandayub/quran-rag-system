'use client';

import React from 'react';
import type { Theme } from '../types';

interface ThemeCardProps {
  theme: Theme;
  onClick: (themeName: string) => void;
}

export function ThemeCard({ theme, onClick }: ThemeCardProps) {
  return (
    <div 
      className="theme-card" 
      onClick={() => onClick(theme.name)}
      style={{ cursor: 'pointer' }}
    >
      {theme.arabic && theme.arabic !== theme.name && (
        <div className="theme-arabic">{theme.arabic}</div>
      )}
      <div className="theme-name">{theme.name}</div>
      {theme.desc && <div className="theme-desc">{theme.desc}</div>}
      <div className="theme-count">{theme.count} verses</div>
    </div>
  );
}
