import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOpenAIClient, getSystemPrompt } from '@/lib/openai';
import { getVerseByKey } from '@/lib/qdrant';
import { generateEmbedding } from '@/lib/ollama';
import { searchVersesWithFilters } from '@/lib/qdrant';

/**
 * POST /api/ai/analyze
 * Deep AI analysis of specific verses
 * Access: Authenticated users only
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication required',
      },
      { status: 401 }
    );
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const {
      verse_key,
      aspects = ['tafsir', 'historical_context', 'practical_application'],
      language = 'id',
      depth = 'detailed',
    } = body;

    // Validate verse_key
    if (!verse_key || typeof verse_key !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'verse_key is required and must be a string',
        },
        { status: 400 }
      );
    }

    // Fetch verse from Qdrant
    const verse = await getVerseByKey(verse_key);
    if (!verse) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verse not found',
        },
        { status: 404 }
      );
    }

    // Find related verses using embedding similarity
    let relatedVerses: Array<{ verse_key: string; relevance: string }> = [];
    try {
      const queryVector = await generateEmbedding(verse.arabic_text);
      const similarResults = await searchVersesWithFilters(
        queryVector,
        undefined,
        3, // Get 3 related verses
        0,
        0.6
      );
      
      relatedVerses = similarResults
        .filter(r => r.payload.verse_key !== verse_key)
        .slice(0, 2)
        .map(r => ({
          verse_key: r.payload.verse_key,
          relevance: `Thematically related to ${verse.main_themes}`,
        }));
    } catch (embeddingError) {
      console.warn('Could not find related verses:', embeddingError);
    }

    // Build context for AI analysis
    const context = {
      verse_key: verse.verse_key,
      arabic_text: verse.arabic_text,
      translation: verse.indonesian_translation,
      english_translation: verse.english_translation,
      chapter_name: verse.chapter_name,
      juz: verse.juz,
      revelation_place: verse.revelation_place,
      main_themes: verse.main_themes,
      tafsir: verse.tafsir_text || 'No tafsir available',
    };

    // Build analysis prompt
    const analysisPrompt = `Analyze the following Quranic verse in depth.

Verse: ${context.verse_key}
Arabic: ${context.arabic_text}
Translation: ${context.translation}
Chapter: ${context.chapter_name}
Juz: ${context.juz}
Revelation: ${context.revelation_place}
Main Theme: ${context.main_themes}
Tafsir: ${context.tafsir}

Please provide a comprehensive analysis covering these aspects:
${aspects.map((a: string) => `- ${a.replace('_', ' ')}`).join('\n')}

Depth level: ${depth}

Format your response in a structured way with clear sections for each aspect.`;

    // Call OpenAI for analysis
    const openai = getOpenAIClient();
    const systemPrompt = getSystemPrompt(language as 'id' | 'en' | 'ar');

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: analysisPrompt },
      ],
      temperature: 0.3,
      max_tokens: depth === 'comprehensive' ? 1500 : 800,
    });

    const analysis = completion.choices[0].message.content || 'Analysis not available';

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      analysis: {
        verse_key: verse.verse_key,
        tafsir: analysis,
        historical_context: '',
        practical_application: '',
        linguistic_notes: '',
        related_verses: relatedVerses,
      },
      processing_time_ms: processingTime,
    });
  } catch (error) {
    console.error('AI Analyze API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate analysis',
      },
      { status: 500 }
    );
  }
}
