'use client';

import React from 'react';
import type { VerseResult } from '../types';

interface SearchResultsProps {
  results: VerseResult[];
  isLoading: boolean;
  query: string;
  onClear: () => void;
  onThemeClick: (theme: string) => void;
  onTafsirClick: (verse: VerseResult) => void;
  getSurahName: (chapterId: number) => string;
}

export function SearchResults({ 
  results, 
  isLoading, 
  query, 
  onClear,
  onThemeClick,
  onTafsirClick,
  getSurahName
}: SearchResultsProps) {
  return (
    <div className="result-preview">
      <div className="result-header">
        <span className="result-label">Results for:</span>
        <span className="result-query">&quot;{query}&quot;</span>
        <button className="result-clear" onClick={onClear}>✕ Clear</button>
      </div>
      {isLoading ? (
        <div className="result-card">Searching...</div>
      ) : results.length > 0 ? (
        results.map((result, i) => (
          <div key={i} className="result-card">
            <div className="result-ar">{result.arabic_text}</div>
            <div className="result-trans">{result.translation}</div>
            <div className="result-meta">
              <span className="result-surah">{getSurahName(result.chapter_id)} {result.verse_key.split(':')[1]}</span>
              <div className="theme-pills" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {result.main_themes.map((theme, idx) => (
                  <span 
                    key={idx} 
                    className="theme-pill" 
                    style={{ 
                      padding: '0.2rem 0.5rem', 
                      background: 'rgba(200,146,42,0.1)', 
                      borderRadius: '100px', 
                      fontSize: '0.75rem', 
                      color: 'var(--gold)', 
                      cursor: 'pointer' 
                    }} 
                    onClick={() => onThemeClick(theme)}
                  >
                    {theme}
                  </span>
                ))}
              </div>
              {result.tafsir_text && (
                <span className="result-tafsir" onClick={() => onTafsirClick(result)} style={{ cursor: 'pointer' }}>
                  Explore tafsir →
                </span>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="result-card">No results found. Try a different query.</div>
      )}
    </div>
  );
}
