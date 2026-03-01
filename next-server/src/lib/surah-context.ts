import { SurahContext } from '../types';

// Configuration
const MAX_SURAHS_TO_INCLUDE = parseInt(process.env.MAX_SURAHS_TO_INCLUDE || '5', 10);
const SURAH_CONTEXTS_PATH = process.env.SURAH_CONTEXTS_PATH || './data/surah-contexts.json';

// Cache for surah contexts
let surahContextsCache: Map<number, SurahContext> | null = null;

/**
 * Load all surah contexts from JSON file
 * @returns Promise resolving to a Map of surah contexts keyed by surah number
 */
export async function loadSurahContexts(): Promise<Map<number, SurahContext>> {
  if (surahContextsCache) {
    return surahContextsCache;
  }

  try {
    // Try to load from the JSON file first
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Resolve path relative to project root
    const fullPath = path.join(process.cwd(), SURAH_CONTEXTS_PATH);
    const data = await fs.readFile(fullPath, 'utf-8');
    const surahArray = JSON.parse(data) as SurahContext[];
    
    // Convert to Map for easier lookup
    surahContextsCache = new Map(
      surahArray.map((surah) => [surah.surah_number, surah])
    );
    
    console.log(`Loaded ${surahContextsCache.size} surah contexts`);
    return surahContextsCache;
  } catch (error) {
    console.error('Error loading surah contexts:', error);
    // Return empty map if file doesn't exist
    surahContextsCache = new Map();
    return surahContextsCache;
  }
}

/**
 * Get surah contexts by their surah numbers
 * @param surahNumbers - Array of surah numbers to retrieve
 * @param limit - Maximum number of surahs to return (default: MAX_SURAHS_TO_INCLUDE)
 * @returns Array of surah contexts
 */
export async function getSurahContextsByNumbers(
  surahNumbers: number[],
  limit: number = MAX_SURAHS_TO_INCLUDE
): Promise<SurahContext[]> {
  await loadSurahContexts();
  
  // Get unique surah numbers and limit the count
  const uniqueSurahNumbers = [...new Set(surahNumbers)].slice(0, limit);
  
  const contexts: SurahContext[] = [];
  for (const surahNumber of uniqueSurahNumbers) {
    const context = surahContextsCache?.get(surahNumber);
    if (context) {
      contexts.push(context);
    }
  }
  
  return contexts;
}

/**
 * Build a formatted context string from surah contexts for the LLM
 * @param surahContexts - Array of surah contexts to format
 * @returns Formatted context string
 */
export function buildSurahContextString(surahContexts: SurahContext[]): string {
  if (surahContexts.length === 0) {
    return '';
  }

  const sections = surahContexts.map((surah) => {
    const header = `=== Surah ${surah.surah_name_en} (${surah.surah_name_id}) - ${surah.verses.length} verses ===`;
    
    // Include full surah text with verse numbers
    const versesText = surah.verses
      .map((verse) => `[${verse.verse_number}] ${verse.verse_arabic} | ${verse.verse_indonesian}`)
      .join('\n');
    
    return `${header}\n${versesText}`;
  });

  return `FULL SURAH CONTEXT:\n${sections.join('\n\n')}\n\n`;
}

/**
 * Extract unique surah numbers from verse search results
 * @param verses - Array of verse search results
 * @returns Array of unique surah numbers
 */
export function extractUniqueSurahNumbers(verses: Array<{ payload: { surah_number: number } }>): number[] {
  const surahNumbers = verses.map((v) => v.payload.surah_number);
  return [...new Set(surahNumbers)];
}

/**
 * Health check for surah context loading
 */
export async function checkSurahContextHealth(): Promise<{ status: string; count?: number }> {
  try {
    const contexts = await loadSurahContexts();
    const count = contexts.size;
    
    if (count === 0) {
      return { status: 'no_data' };
    }
    
    return {
      status: 'ok',
      count,
    };
  } catch (error) {
    console.error('Error checking surah context health:', error);
    return { status: 'error' };
  }
}
