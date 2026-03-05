'use client';

import React from 'react';
import type { VerseOfDay } from '../types';
import { VerseCard } from './VerseCard';

interface VerseOfDayPanelProps {
  verse: VerseOfDay | null;
  isLoading: boolean;
  onShuffle: () => void;
  onTafsirClick: (verse: VerseOfDay) => void;
  onRelatedVerses: (verse: VerseOfDay) => void;
  onUseInDawah: (verse: VerseOfDay) => void;
  getSurahName: (chapterId: number) => string;
}

// Fallback verse for when API fails
const fallbackVerse: VerseOfDay = {
  verse_key: '2:256',
  chapter_id: 2,
  verse_number: 256,
  chapter_name: 'Al-Baqarah',
  arabic_text: 'لَآ إِكْرَاهَ فِى ٱلدِّينِ ۖ قَد تَّبَيَّنَ ٱلرُّشْدُ مِنَ ٱلْغَىِّ',
  translation: 'There shall be no compulsion in religion. The right course has become clear from the wrong.',
  indonesian_translation: 'Tidak ada paksaan dalam agama. Sesungguhnya telah jelas jalan yang benar dari jalan yang sesat.',
  english_translation: 'There shall be no compulsion in religion. The right course has become clear from the wrong.',
  score: 0,
  juz: 3,
  revelation_place: 'Madani',
  main_themes: ['Faith', 'Guidance'],
};

export function VerseOfDayPanel({ 
  verse, 
  isLoading, 
  onShuffle,
  onTafsirClick, 
  onRelatedVerses, 
  onUseInDawah,
  getSurahName
}: VerseOfDayPanelProps) {
  return (
    <div className="section animate-5">
      <div className="section-header">
        <div className="section-title"><span>✦</span> Verse of the Day</div>
        <button 
          className="see-all" 
          onClick={onShuffle}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: '1px solid var(--gold)', cursor: 'pointer', padding: '0.35rem 0.7rem', borderRadius: '100px', color: 'var(--gold)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          title="Get a random verse"
        >
          🔀 Shuffle
        </button>
      </div>
      <div className="verse-panel">
        {isLoading ? (
          <div style={{ animation: 'fadeUp 0.4s ease both' }}>
            <div className="verse-badge" style={{ display: 'inline-block', padding: '0.28rem 0.7rem', background: 'rgba(200,146,42,0.15)', border: '1px solid rgba(200,146,42,0.3)', borderRadius: '100px', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold-light)', marginBottom: '1rem', minWidth: '120px', height: '28px' }}>&nbsp;</div>
            <div className="verse-arabic-large" style={{ marginBottom: '1rem', minHeight: '60px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.1) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '4px' }}>&nbsp;</div>
            <div className="verse-translation" style={{ marginBottom: '1rem', minHeight: '40px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.1) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '4px' }}>&nbsp;</div>
            <div className="verse-meta" style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
              <span style={{ minWidth: '100px', height: '16px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>&nbsp;</span>
              <span style={{ minWidth: '60px', height: '16px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>&nbsp;</span>
            </div>
            <div className="verse-actions" style={{ display: 'flex', gap: '0.6rem' }}>
              <button className="verse-btn primary" style={{ minWidth: '120px', height: '36px', background: 'rgba(255,255,255,0.15)' }}>&nbsp;</button>
              <button className="verse-btn" style={{ minWidth: '100px', height: '36px', background: 'rgba(255,255,255,0.1)' }}>&nbsp;</button>
              <button className="verse-btn" style={{ minWidth: '100px', height: '36px', background: 'rgba(255,255,255,0.1)' }}>&nbsp;</button>
            </div>
          </div>
        ) : verse ? (
          <VerseCard 
            verse={verse} 
            onTafsirClick={onTafsirClick} 
            onRelatedVerses={onRelatedVerses} 
            onUseInDawah={onUseInDawah}
            getSurahName={getSurahName}
          />
        ) : (
          <VerseCard 
            verse={fallbackVerse} 
            onTafsirClick={onTafsirClick} 
            onRelatedVerses={onRelatedVerses} 
            onUseInDawah={onUseInDawah}
            getSurahName={getSurahName}
          />
        )}
      </div>
    </div>
  );
}
