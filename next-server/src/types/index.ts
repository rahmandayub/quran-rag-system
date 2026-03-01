// Language support
export type LanguageCode = 'id' | 'en' | 'ar';

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  displayName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

// Enhanced Verse payload from Qdrant (new schema with themes and tafsir)
export interface VersePayload {
  // Core identifiers
  verse_key: string;
  chapter_id: number;
  verse_number: number;
  chapter_name: string;
  
  // Enrichment fields
  juz: number;
  revelation_place: 'Makkah' | 'Madinah';
  
  // Theme fields
  main_themes: string; // JSON array string
  primary_theme: string;
  theme_count: number;
  audience_group: string;
  
  // Text content
  arabic_text: string;
  english_translation: string;
  indonesian_translation: string;
  tafsir_text: string;
  
  // Metadata
  practical_application: string;
  translation_length: number;
  tafsir_length: number;
}

// Legacy Verse payload (for backward compatibility)
export interface LegacyVersePayload {
  verse_arabic: string;
  verse_indonesian: string;
  verse_english: string;
  surah_number: number;
  verse_number: number;
  surah_name_arabic: string;
  surah_name_latin: string;
  surah_name_en: string;
  surah_name_id: string;
  juz: number;
  reference: string;
}

// Localized verse payload (for multi-language support)
export interface LocalizedVersePayload {
  verse_key: string;
  chapter_id: number;
  verse_number: number;
  chapter_name: string;
  verse_arabic: string;
  verse_translation: string; // Translation in the selected language
  juz: number;
  revelation_place: 'Makkah' | 'Madinah';
  primary_theme: string;
  main_themes: string[];
}

// Individual verse within a surah context
export interface SurahVerse {
  verse_number: number;
  verse_key: string;
  verse_arabic: string;
  verse_indonesian: string;
  verse_english: string;
  tafsir_text?: string;
}

// Full surah context for enhanced RAG
export interface SurahContext {
  surah_number: number;
  surah_name_en: string;
  surah_name_id: string;
  verses: SurahVerse[];
  full_text: string; // Concatenated text for LLM context
}

// Search result from Qdrant (enhanced schema)
export interface VerseSearchResult {
  score: number;
  payload: VersePayload;
}

// Legacy search result (for backward compatibility)
export interface LegacyVerseSearchResult {
  score: number;
  payload: LegacyVersePayload;
}

// Chat request
export interface ChatRequest {
  query: string;
  language?: LanguageCode;
  filters?: SearchFilters; // NEW: Optional filters for smart query
}

// Search filters for smart query
export interface SearchFilters {
  focus?: 'all' | 'verses' | 'tafsir' | 'thematic' | 'dawah';
  themes?: string[];
  juz?: number;
  revelation_place?: 'Makkah' | 'Madinah';
  chapter_id?: number;
}

// Chat response
export interface ChatResponse {
  answer: string;
  references: VerseReference[];
  query: string;
  processing_time_ms: number;
}

// Verse reference for UI (enhanced with themes)
export interface VerseReference {
  verse_key: string;
  chapter_id: number;
  verse_number: number;
  chapter_name: string;
  arabic_text: string;
  translation: string; // Localized translation
  indonesian_translation: string; // Keep for backward compatibility
  english_translation: string; // Keep for backward compatibility
  relevance_score: number;
  juz: number;
  revelation_place: 'Makkah' | 'Madinah';
  primary_theme: string;
  main_themes: string[];
  tafsir_text?: string;
}

// Full surah view data (enhanced)
export interface SurahVerseData {
  verse_number: number;
  verse_key: string;
  verse_arabic: string;
  verse_translation: string; // Translation in the selected language
  verse_indonesian: string; // Keep for backward compatibility
  verse_english: string; // Keep for backward compatibility
  tafsir_text?: string;
}

export interface SurahData {
  surah_number: number;
  surah_name: string; // Localized surah name
  surah_name_en: string; // English meaning
  surah_name_id: string; // Indonesian name
  surah_name_latin: string; // Latin/English name
  surah_name_arabic: string; // Arabic name
  verses_count: number;
  revelation_place: 'makkah' | 'madinah';
  verses: SurahVerseData[];
}

// Localized surah data
export interface LocalizedSurahData {
  surah_number: number;
  surah_name: string;
  surah_name_native: string; // Native name (e.g., "الفاتحة")
  verses_count: number;
  revelation_place: 'makkah' | 'madinah';
  verses: {
    verse_number: number;
    verse_key: string;
    verse_arabic: string;
    verse_translation: string;
  }[];
}

// Message types for chat UI
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  references?: VerseReference[];
  timestamp: Date;
}

// Embedding request
export interface EmbeddingRequest {
  text: string;
}

// Embedding response
export interface EmbeddingResponse {
  embedding: number[];
}

// Theme category for exploration UI
export interface ThemeCategory {
  arabic: string;
  name: string;
  desc: string;
  count: string;
}

// Smart query result card
export interface SmartQueryResult {
  verse_key: string;
  arabic_text: string;
  translation: string;
  chapter_name: string;
  verse_number: number;
  theme: string;
  juz: number;
  score: number;
}

// Verse of the day data
export interface VerseOfTheDay {
  verse_key: string;
  arabic_text: string;
  translation: string;
  chapter_name: string;
  verse_number: number;
  juz: number;
  revelation_place: 'Makkah' | 'Madinah';
  tafsir_text?: string;
  themes: string[];
}
