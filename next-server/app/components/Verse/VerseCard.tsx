'use client';

import React from 'react';
import type { VerseResult, VerseOfDay } from '../types';

interface VerseCardProps {
  verse: VerseResult | VerseOfDay;
  onTafsirClick: (verse: VerseResult | VerseOfDay) => void;
  onRelatedVerses: (verse: VerseResult | VerseOfDay) => void;
  onUseInDawah: (verse: VerseResult | VerseOfDay) => void;
  getSurahName: (chapterId: number) => string;
  showActions?: boolean;
}

export function VerseCard({ 
  verse, 
  onTafsirClick, 
  onRelatedVerses, 
  onUseInDawah,
  getSurahName,
  showActions = true 
}: VerseCardProps) {
  return (
    <>
      <div className="verse-badge">{verse.verse_key}</div>
      <div className="verse-arabic-large">{verse.arabic_text}</div>
      <div className="verse-translation">
        &quot;{verse.translation}&quot;
      </div>
      <div className="verse-meta">
        <span className="verse-ref">{getSurahName(verse.chapter_id)} {verse.verse_key.split(':')[1]}</span>
        <span>Juz {verse.juz}</span>
        <span>{verse.revelation_place}</span>
      </div>
      {verse.main_themes && verse.main_themes.length > 0 && (
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {verse.main_themes.map((theme, idx) => (
            <span 
              key={idx} 
              className="theme-pill"
              style={{ 
                padding: '0.25rem 0.6rem', 
                background: 'rgba(200,146,42,0.2)', 
                border: '1px solid rgba(200,146,42,0.3)', 
                borderRadius: '100px', 
                fontSize: '0.75rem', 
                color: 'var(--gold-light)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => onRelatedVerses(verse)}
              title={`Search for ${theme}`}
            >
              {theme}
            </span>
          ))}
        </div>
      )}
      {showActions && (
        <div className="verse-actions">
          <button className="verse-btn primary" onClick={() => onTafsirClick(verse)}>Read Full Tafsir</button>
          <button className="verse-btn" onClick={() => onRelatedVerses(verse)}>Related Verses</button>
          <button className="verse-btn" onClick={() => onUseInDawah(verse)}>Use in Da&apos;wah</button>
        </div>
      )}
    </>
  );
}
