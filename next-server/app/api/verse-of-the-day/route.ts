import { NextRequest, NextResponse } from 'next/server';
import { getRandomVerse } from '@/lib/qdrant';

/**
 * GET /api/verse-of-the-day
 * Return deterministic verse based on date or random seed
 * Access: Public (guest accessible)
 *
 * Query Parameters:
 * - date?: string - ISO date string (default: today)
 * - language?: 'id' | 'en' | 'ar' - Language preference (default: 'id')
 * - seed?: number - Random seed for shuffle (overrides date-based seed)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const seedParam = searchParams.get('seed');
    const language = searchParams.get('language') || 'id';

    // Generate seed from date or use provided seed
    let seed: number;
    let dateStr: string;
    
    if (seedParam) {
      // Use provided seed for random/shuffle mode
      seed = parseInt(seedParam, 10);
      dateStr = new Date().toISOString().split('T')[0];
    } else {
      // Generate deterministic seed from date
      const date = dateParam ? new Date(dateParam) : new Date();
      dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      seed = generateDateSeed(dateStr);
    }

    // Get random verse based on seed
    const verse = await getRandomVerse(seed);

    if (!verse) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verse not found',
        },
        { status: 404 }
      );
    }

    // Determine translation based on language
    let translation = verse.indonesian_translation;
    if (language === 'en') {
      translation = verse.english_translation;
    } else if (language === 'ar') {
      translation = verse.arabic_text;
    }

    // Parse main_themes from JSON array string to array
    let themeList: string[] = [];
    const rawThemes = verse.main_themes?.trim() || '';
    if (rawThemes.startsWith('[') && rawThemes.endsWith(']')) {
      try {
        const parsed = JSON.parse(rawThemes);
        if (Array.isArray(parsed)) {
          themeList = parsed;
        }
      } catch {
        // Handle Python-style array with single quotes
        const cleaned = rawThemes.slice(1, -1);
        themeList = cleaned.split(',')
          .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
          .filter((t) => t.length > 0);
      }
    } else {
      themeList = rawThemes ? [rawThemes] : [];
    }

    return NextResponse.json({
      success: true,
      verse: {
        verse_key: verse.verse_key,
        chapter_id: verse.chapter_id,
        verse_number: verse.verse_number,
        chapter_name: verse.chapter_name,
        arabic_text: verse.arabic_text,
        translation: translation,
        indonesian_translation: verse.indonesian_translation,
        english_translation: verse.english_translation,
        juz: verse.juz,
        revelation_place: verse.revelation_place,
        main_themes: themeList,  // Now returns array of strings
        tafsir_text: verse.tafsir_text || undefined,
      },
      date: dateStr,
    });
  } catch (error) {
    console.error('Verse of the day API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch verse of the day',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate deterministic seed from date string
 * Uses simple hash to ensure same date always returns same seed
 */
function generateDateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
