'use client';

import React from 'react';
import type { SuggestedQuery } from '../types';

interface SuggestionPillsProps {
  suggestedQueries: SuggestedQuery[];
  onSearch: (query: string) => void;
}

const fallbackSuggestions = [
  'Invite non-Muslims gently',
  'Verses on Tawhid',
  'Kindness in the Qur\'an'
];

export function SuggestionPills({ suggestedQueries, onSearch }: SuggestionPillsProps) {
  return (
    <div className="suggestions animate-3">
      <div className="suggestion-label">Try asking</div>
      <div className="suggestion-pills">
        {suggestedQueries.length > 0 ? (
          suggestedQueries.map((s, i) => (
            <button key={i} className="pill" onClick={() => onSearch(s.text)}>{s.text}</button>
          ))
        ) : (
          fallbackSuggestions.map((s, i) => (
            <button key={i} className="pill" onClick={() => onSearch(s)}>{s}</button>
          ))
        )}
      </div>
    </div>
  );
}
