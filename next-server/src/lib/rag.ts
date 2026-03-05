import { 
  VerseReference, 
  VerseSearchResult,
  LanguageCode
} from '../types';

/**
 * Build context string from retrieved verses
 * @param verses - Array of verse search results
 * @param language - The language to use for translation (default: 'id')
 * @returns Formatted context string for the LLM
 */
export function buildVerseContext(
  verses: VerseSearchResult[],
  language: LanguageCode = 'id'
): string {
  return verses.map((v) => {
    // Get translation based on language
    const translation = language === 'en' 
      ? v.payload.english_translation 
      : v.payload.indonesian_translation;
    
    const languageLabel = language === 'en' 
      ? 'English' 
      : language === 'ar'
      ? 'العربية'
      : 'Indonesia';
    
    return `[${v.payload.chapter_name} ${v.payload.verse_number}]\n` +
      `Arab: ${v.payload.arabic_text}\n` +
      `${languageLabel}: ${translation}`;
  }).join('\n---\n');
}

/**
 * Convert verse search results to verse references for UI
 * @param verses - Array of verse search results
 * @param language - The language to use for translation (default: 'id')
 * @returns Array of verse references
 */
export function convertToReferences(
  verses: VerseSearchResult[],
  language: LanguageCode = 'id'
): VerseReference[] {
  return verses.map((v) => {
    // Get translation based on language
    const translation = language === 'en'
      ? v.payload.english_translation
      : v.payload.indonesian_translation;
    
    return {
      verse_key: v.payload.verse_key,
      chapter_id: v.payload.chapter_id,
      verse_number: v.payload.verse_number,
      chapter_name: v.payload.chapter_name,
      arabic_text: v.payload.arabic_text,
      translation: translation,
      indonesian_translation: v.payload.indonesian_translation,
      english_translation: v.payload.english_translation,
      relevance_score: v.score,
      juz: v.payload.juz,
      revelation_place: v.payload.revelation_place,
      main_themes: v.payload.main_themes,
      tafsir_text: v.payload.tafsir_text,
    };
  });
}
