import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/ollama';
import { searchVersesWithFilters } from '@/lib/qdrant';
import type { SearchFilters } from '@/types';

/**
 * POST /api/search
 * Smart semantic search with optional filters
 * Access: Public (guest accessible)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const {
      query,
      filters,
      limit = 10,
      offset = 0,
      language = 'id',
    } = body;

    // Validate query
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Query is required and must be a string',
        },
        { status: 400 }
      );
    }

    if (query.trim().length === 0 || query.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query must be between 1 and 500 characters',
        },
        { status: 400 }
      );
    }

    // Validate limit
    const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

    // Generate embedding for the query
    let queryVector: number[];
    try {
      queryVector = await generateEmbedding(query);
    } catch (embeddingError) {
      console.error('Failed to generate embedding:', embeddingError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate query embedding',
        },
        { status: 503 }
      );
    }

    // Build search filters
    const searchFilters: SearchFilters = {};
    
    if (filters) {
      // Map focus parameter to internal filter
      if (filters.focus && filters.focus !== 'all') {
        if (filters.focus === 'tafsir' || filters.focus === 'dawah') {
          searchFilters.focus = filters.focus;
        }
      }
      
      // Optional filters
      if (filters.juz) {
        searchFilters.juz = parseInt(filters.juz);
      }
      
      if (filters.revelation_place) {
        searchFilters.revelation_place = filters.revelation_place;
      }
      
      if (filters.chapter_id) {
        searchFilters.chapter_id = parseInt(filters.chapter_id);
      }
      
      if (filters.themes && Array.isArray(filters.themes)) {
        searchFilters.themes = filters.themes;
      }
    }

    // Search verses in Qdrant
    const results = await searchVersesWithFilters(
      queryVector,
      searchFilters,
      safeLimit,
      offset,
      0.3 // Lower threshold for better recall
    );

    // Format results with localized translations
    const formattedResults = results.map((result) => {
      // Determine which translation to use based on language
      let translation = result.payload.indonesian_translation;
      if (language === 'en') {
        translation = result.payload.english_translation;
      } else if (language === 'ar') {
        translation = result.payload.arabic_text;
      }

      // Parse main_themes from JSON array string to array
      let themeList: string[] = [];
      const rawThemes = result.payload.main_themes?.trim() || '';
      if (rawThemes.startsWith('[') && rawThemes.endsWith(']')) {
        try {
          const parsed = JSON.parse(rawThemes);
          if (Array.isArray(parsed)) {
            themeList = parsed;
          } else {
            themeList = [rawThemes];
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

      return {
        verse_key: result.payload.verse_key,
        chapter_id: result.payload.chapter_id,
        verse_number: result.payload.verse_number,
        chapter_name: result.payload.chapter_name,
        arabic_text: result.payload.arabic_text,
        translation: translation,
        indonesian_translation: result.payload.indonesian_translation,
        english_translation: result.payload.english_translation,
        score: Math.round(result.score * 1000) / 1000,
        juz: result.payload.juz,
        revelation_place: result.payload.revelation_place,
        main_themes: themeList,  // Now returns array of strings
        tafsir_text: result.payload.tafsir_text || undefined,
      };
    });

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      query,
      results: formattedResults,
      total: formattedResults.length,
      has_more: formattedResults.length === safeLimit,
      processing_time_ms: processingTime,
      filters: searchFilters,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
