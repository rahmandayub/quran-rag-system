'use client';

import React, { useRef } from 'react';

interface SearchBoxProps {
  query: string;
  setQuery: (query: string) => void;
  activeFilter: string;
  filters: string[];
  onSearch: () => void;
  onFilterChange: (filter: string) => void;
}

export function SearchBox({ 
  query, 
  setQuery, 
  activeFilter, 
  filters, 
  onSearch,
  onFilterChange
}: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="search-container animate-2">
      <div className="search-box">
        <div className="search-input-row">
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Ask a question, theme, or Arabic phrase…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
          <button className="search-btn" onClick={onSearch} aria-label="Search">⟶</button>
        </div>
        <div className="search-filters">
          <span className="filter-label">Focus:</span>
          {filters.map((filter) => (
            <button
              key={filter}
              className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => onFilterChange(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
