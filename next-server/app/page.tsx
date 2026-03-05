'use client';

import { useState, useEffect } from 'react';
import { getSurahNameArabicLatin } from '@/lib/surah-names';

// Import components
import {
  Header,
  MobileNav,
  Hero,
  Footer,
  MobileBottomBar,
  SearchBox,
  SuggestionPills,
  SearchResults,
  ThemeGrid,
  VerseOfDayPanel,
  ScholarsToolkit,
} from './components';

// Import types
import type { VerseResult, Theme, SuggestedQuery, VerseOfDay } from './components';

// Constants
const barItems = [
  { icon: '🔍', label: 'Search' },
  { icon: '📚', label: 'Themes' },
  { icon: '🕌', label: 'Surahs' },
  { icon: '🗣️', label: 'Da\'i' },
];

const filters = ['All Sources', 'Verses', 'Tafsir', 'Thematic', 'Da\'wah Focus'];

const filterToFocus: Record<string, string> = {
  'All Sources': 'all',
  'Verses': 'verses',
  'Tafsir': 'tafsir',
  'Thematic': 'thematic',
  'Da\'wah Focus': 'dawah',
};

const themeDescriptions: Record<string, string> = {
  'Faith': 'Tawhid, pillars of iman, certainty',
  'Worship': 'Prayer, fasting, zakat, hajj',
  'Guidance': 'Divine guidance, following the right path',
  'Ethics': 'Manners, truthfulness, justice',
  'Mercy': 'Allah\'s mercy, repentance, hope',
  'Hereafter': 'Judgment, paradise, accountability',
  'Da\'wah': 'Calling to Islam with wisdom',
  'Patience': 'Sabr, gratitude, trials',
};

export default function HomePage() {
  // State
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Sources');
  const [showResults, setShowResults] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeBar, setActiveBar] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingThemes, setIsLoadingThemes] = useState(true);
  const [isLoadingVerseOfDay, setIsLoadingVerseOfDay] = useState(true);
  const [searchResults, setSearchResults] = useState<VerseResult[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [suggestedQueries, setSuggestedQueries] = useState<SuggestedQuery[]>([]);
  const [verseOfDay, setVerseOfDay] = useState<VerseOfDay | null>(null);

  // Load initial data on mount
  useEffect(() => {
    loadThemes();
    loadSuggestedQueries();
    loadVerseOfDay();
  }, []);

  // Close menu on resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 640) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // API calls
  const loadThemes = async () => {
    setIsLoadingThemes(true);
    try {
      const response = await fetch('/api/themes?limit=6');
      const data = await response.json();
      if (data.success) {
        const enrichedThemes = data.themes.map((t: Theme) => ({
          ...t,
          desc: themeDescriptions[t.name] || undefined,
        }));
        setThemes(enrichedThemes);
      }
    } catch (error) {
      console.error('Failed to load themes:', error);
    } finally {
      setIsLoadingThemes(false);
    }
  };

  const loadSuggestedQueries = async () => {
    try {
      const response = await fetch('/api/suggested-queries');
      const data = await response.json();
      if (data.success) {
        setSuggestedQueries(data.queries);
      }
    } catch (error) {
      console.error('Failed to load suggested queries:', error);
    }
  };

  const loadVerseOfDay = async () => {
    setIsLoadingVerseOfDay(true);
    try {
      const response = await fetch('/api/verse-of-the-day');
      const data = await response.json();
      if (data.success) {
        setVerseOfDay(data.verse);
      }
    } catch (error) {
      console.error('Failed to load verse of the day:', error);
    } finally {
      setIsLoadingVerseOfDay(false);
    }
  };

  const handleShuffleVerse = async () => {
    setIsLoadingVerseOfDay(true);
    try {
      const randomSeed = Math.floor(Math.random() * 1000000);
      const response = await fetch(`/api/verse-of-the-day?seed=${randomSeed}`);
      const data = await response.json();
      if (data.success) {
        setVerseOfDay(data.verse);
      }
    } catch (error) {
      console.error('Failed to shuffle verse:', error);
    } finally {
      setIsLoadingVerseOfDay(false);
    }
  };

  // Handlers
  const handleSearch = async (q?: string) => {
    const val = (q !== undefined ? q : query).trim();
    if (!val) return;

    setQuery(val);
    setIsLoading(true);
    setShowResults(true);
    setMenuOpen(false);

    try {
      const focus = filterToFocus[activeFilter] || 'all';
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: val,
          filters: { focus },
          limit: 10,
          language: 'id',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSearchResults(data.results);
      } else {
        console.error('Search failed:', data.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setShowResults(false);
    setQuery('');
    setSearchResults([]);
  };

  const handleThemeClick = (themeName: string) => {
    setQuery(themeName);
    handleSearch(themeName);
  };

  const handleTafsirClick = (verse: VerseResult | VerseOfDay) => {
    console.log('Tafsir requested for:', verse.verse_key);
    alert('Tafsir feature coming soon! This will show detailed explanation for ' + verse.verse_key);
  };

  const handleRelatedVerses = (verse: VerseResult | VerseOfDay) => {
    if (verse.main_themes) {
      const firstTheme = Array.isArray(verse.main_themes) ? verse.main_themes[0] : verse.main_themes;
      if (firstTheme) {
        setQuery(firstTheme);
        handleSearch(firstTheme);
      }
    }
  };

  const handleUseInDawah = (verse: VerseOfDay | VerseResult) => {
    console.log('Use in da\'wah:', verse.verse_key);
    alert('Da\'wah Builder feature coming soon! This will help you create presentations using ' + verse.verse_key);
  };

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  return (
    <div className="page">
      {/* Background */}
      <div className="bg-texture" />
      <div className="noise" />

      {/* Header */}
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* Mobile drawer */}
      <MobileNav menuOpen={menuOpen} onNavClick={handleNavClick} />

      {/* Hero */}
      <Hero />

      {/* Search */}
      <SearchBox
        query={query}
        setQuery={setQuery}
        activeFilter={activeFilter}
        filters={filters}
        onSearch={() => handleSearch()}
        onFilterChange={setActiveFilter}
      />

      {/* Suggestions - only show when not showing results */}
      {!showResults && (
        <SuggestionPills
          suggestedQueries={suggestedQueries}
          onSearch={handleSearch}
        />
      )}

      {/* Results - only show when searching */}
      {showResults && (
        <SearchResults
          results={searchResults}
          isLoading={isLoading}
          query={query}
          onClear={handleClear}
          onThemeClick={handleThemeClick}
          onTafsirClick={handleTafsirClick}
          getSurahName={getSurahNameArabicLatin}
        />
      )}

      {/* Home content - only show when not showing results */}
      {!showResults && (
        <>
          {/* Theme Grid */}
          <ThemeGrid
            themes={themes}
            isLoading={isLoadingThemes}
            onThemeClick={handleThemeClick}
          />

          {/* Verse of the Day */}
          <VerseOfDayPanel
            verse={verseOfDay}
            isLoading={isLoadingVerseOfDay}
            onShuffle={handleShuffleVerse}
            onTafsirClick={handleTafsirClick}
            onRelatedVerses={handleRelatedVerses}
            onUseInDawah={handleUseInDawah}
            getSurahName={getSurahNameArabicLatin}
          />

          {/* Scholar's Toolkit */}
          <ScholarsToolkit />

          {/* Divider */}
          <div className="divider">
            <span className="divider-ornament">﷽</span>
          </div>
        </>
      )}

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Bar */}
      <MobileBottomBar
        barItems={barItems}
        activeBar={activeBar}
        setActiveBar={setActiveBar}
      />
    </div>
  );
}
