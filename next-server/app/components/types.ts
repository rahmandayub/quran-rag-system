// Shared types for components
// Re-export from main types or define component-specific types here

export interface VerseResult {
  verse_key: string;
  chapter_id: number;
  verse_number: number;
  chapter_name: string;
  arabic_text: string;
  translation: string;
  indonesian_translation: string;
  english_translation: string;
  score: number;
  juz: number;
  revelation_place: string;
  main_themes: string[];
  tafsir_text?: string;
}

// VerseOfDay is the same as VerseResult - using type alias instead
export type VerseOfDay = VerseResult;

export interface Theme {
  name: string;
  arabic: string;
  count: number;
  desc?: string;
}

export interface SuggestedQuery {
  text: string;
  category: string;
}

export interface NavItem {
  icon: string;
  label: string;
}

export interface NavLink {
  text: string;
  href?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}
