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
      ? v.payload.verse_english 
      : v.payload.verse_indonesian;
    
    const languageLabel = language === 'en' 
      ? 'English' 
      : language === 'ar'
      ? 'العربية'
      : 'Indonesia';
    
    return `[${v.payload.reference}]\n` +
      `Arab: ${v.payload.verse_arabic}\n` +
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
      ? v.payload.verse_english
      : v.payload.verse_indonesian;
    
    // Get surah name based on language
    let surahName: string;
    if (language === 'en') {
      surahName = v.payload.surah_name_latin;
    } else if (language === 'ar') {
      surahName = v.payload.surah_name_arabic;
    } else {
      surahName = v.payload.surah_name_id;
    }
    
    return {
      surah_number: v.payload.surah_number,
      verse_number: v.payload.verse_number,
      surah_name: surahName,
      surah_name_id: v.payload.surah_name_id,
      surah_name_en: v.payload.surah_name_en,
      surah_name_latin: v.payload.surah_name_latin,
      surah_name_arabic: v.payload.surah_name_arabic,
      verse_arabic: v.payload.verse_arabic,
      verse_translation: translation,
      verse_indonesian: v.payload.verse_indonesian,
      relevance_score: v.score,
      juz: v.payload.juz,
    };
  });
}
