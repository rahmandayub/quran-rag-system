'use client';

import React from 'react';
import type { Theme } from '../types';
import { ThemeCard } from './ThemeCard';

interface ThemeGridProps {
  themes: Theme[];
  isLoading: boolean;
  onThemeClick: (themeName: string) => void;
}

const fallbackThemes = [
  { name: 'Faith & Belief', desc: 'Tawhid, pillars of iman, certainty', count: 312, arabic: '' },
  { name: 'Mercy & Forgiveness', desc: 'Allah\'s mercy, repentance, hope', count: 248, arabic: '' },
  { name: 'The Hereafter', desc: 'Judgment, paradise, accountability', count: 396, arabic: '' },
  { name: 'Da\'wah Methods', desc: 'Calling to Islam with wisdom', count: 87, arabic: '' },
  { name: 'Character & Ethics', desc: 'Manners, truthfulness, justice', count: 203, arabic: '' },
  { name: 'Patience & Resilience', desc: 'Sabr, gratitude, trials', count: 90, arabic: '' },
];

export function ThemeGrid({ themes, isLoading, onThemeClick }: ThemeGridProps) {
  return (
    <div className="section animate-4">
      <div className="section-header">
        <div className="section-title"><span>❖</span> Explore by Theme</div>
        <span className="see-all">View all →</span>
      </div>
      <div className="theme-grid">
        {isLoading ? (
          // Loading skeletons
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="theme-card" style={{ pointerEvents: 'none' }}>
              <div className="theme-name" style={{ background: 'linear-gradient(90deg, #f0e8dc 25%, #e8dcc8 50%, #f0e8dc 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', height: '24px' }}>&nbsp;</div>
              <div className="theme-desc" style={{ background: 'linear-gradient(90deg, #f0e8dc 25%, #e8dcc8 50%, #f0e8dc 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', height: '16px', marginTop: '8px' }}>&nbsp;</div>
              <div className="theme-count" style={{ background: 'linear-gradient(90deg, #f0e8dc 25%, #e8dcc8 50%, #f0e8dc 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', height: '14px', marginTop: '12px' }}>&nbsp;</div>
            </div>
          ))
        ) : themes.length > 0 ? (
          themes.map((theme) => (
            <ThemeCard key={theme.name} theme={theme} onClick={onThemeClick} />
          ))
        ) : (
          // Fallback to static themes while loading
          fallbackThemes.map((theme) => (
            <div key={theme.name} className="theme-card">
              <div className="theme-name">{theme.name}</div>
              <div className="theme-desc">{theme.desc}</div>
              <div className="theme-count">{theme.count} verses</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
