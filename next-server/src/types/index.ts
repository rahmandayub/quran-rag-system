// Language support
export type LanguageCode = 'id' | 'en' | 'ar';

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  displayName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

// Verse payload from Qdrant
export interface VersePayload {
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
  verse_arabic: string;
  verse_translation: string; // Translation in the selected language
  surah_number: number;
  verse_number: number;
  surah_name: string; // Surah name in the selected language
  juz: number;
  reference: string;
}

// Individual verse within a surah context
export interface SurahVerse {
  verse_number: number;
  verse_arabic: string;
  verse_indonesian: string;
  verse_english: string;
}

// Full surah context for enhanced RAG
export interface SurahContext {
  surah_number: number;
  surah_name_en: string;
  surah_name_id: string;
  verses: SurahVerse[];
  full_text: string; // Concatenated text for LLM context
}

// Search result from Qdrant
export interface VerseSearchResult {
  score: number;
  payload: VersePayload;
}

// Chat request
export interface ChatRequest {
  query: string;
  language?: LanguageCode; // NEW: User's preferred language
}

// Chat response
export interface ChatResponse {
  answer: string;
  references: VerseReference[];
  query: string;
  processing_time_ms: number;
}

// Verse reference for UI (with multi-language support)
export interface VerseReference {
  surah_number: number;
  verse_number: number;
  surah_name: string; // Localized surah name
  surah_name_id: string; // Indonesian name (Keep for backward compatibility)
  surah_name_en: string; // English meaning (Keep for backward compatibility)
  surah_name_latin: string; // Latin/English name (same as surah_name_en for most cases)
  surah_name_arabic: string; // Arabic name
  verse_arabic: string;
  verse_translation: string; // Translation in the selected language
  verse_indonesian: string; // Keep for backward compatibility
  relevance_score: number;
  juz: number;
}

// Full surah view data (with multi-language support)
export interface SurahVerseData {
  verse_number: number;
  verse_arabic: string;
  verse_translation: string; // Translation in the selected language
  verse_indonesian: string; // Keep for backward compatibility
  verse_english: string; // Keep for backward compatibility
}

export interface SurahData {
  surah_number: number;
  surah_name: string; // Localized surah name
  surah_name_en: string; // English meaning (Keep for backward compatibility)
  surah_name_id: string; // Indonesian name (Keep for backward compatibility)
  surah_name_latin: string; // Latin/English name
  surah_name_arabic: string; // Keep for backward compatibility
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
