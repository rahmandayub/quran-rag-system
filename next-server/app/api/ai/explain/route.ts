import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOpenAIClient, getSystemPrompt } from '@/lib/openai';
import { getVerseByKey, searchVersesWithFilters } from '@/lib/qdrant';
import { generateEmbedding } from '@/lib/ollama';

/**
 * POST /api/ai/explain
 * AI-powered explanation of Quranic concepts
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
      topic,
      verses,
      depth = 'intermediate',
      language = 'id',
      include_practical_tips = true,
    } = body;

    // Validate topic
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Topic is required and must be a string',
        },
        { status: 400 }
      );
    }

    // Search for relevant verses based on topic
    let relevantVerses: Array<{
      verse_key: string;
      arabic_text: string;
      translation: string;
      relevance: string;
    }> = [];

    try {
      const queryVector = await generateEmbedding(topic);
      const searchResults = await searchVersesWithFilters(
        queryVector,
        undefined,
        5, // Get 5 relevant verses
        0,
        0.4
      );

      relevantVerses = searchResults.map(r => ({
        verse_key: r.payload.verse_key,
        arabic_text: r.payload.arabic_text,
        translation: r.payload.indonesian_translation,
        relevance: r.payload.main_themes,
      }));
    } catch (embeddingError) {
      console.warn('Could not search for relevant verses:', embeddingError);
    }

    // If specific verses are provided, fetch them
    if (verses && Array.isArray(verses)) {
      for (const verseKey of verses) {
        const verse = await getVerseByKey(verseKey);
        if (verse && !relevantVerses.find(v => v.verse_key === verseKey)) {
          relevantVerses.push({
            verse_key: verse.verse_key,
            arabic_text: verse.arabic_text,
            translation: verse.indonesian_translation,
            relevance: verse.main_themes,
          });
        }
      }
    }

    // Build explanation prompt
    const versesContext = relevantVerses
      .map(v => `- ${v.verse_key}: "${v.translation}" (Theme: ${v.relevance})`)
      .join('\n');

    const explanationPrompt = `Explain the following Quranic concept/topic in detail.

Topic: ${topic}

Relevant Verses:
${versesContext || 'No specific verses found - use general knowledge about the topic'}

Depth level: ${depth}
${include_practical_tips ? 'Include practical application tips for daily life.' : ''}

Provide a comprehensive explanation that:
1. Explains the concept clearly
2. References the verses above
3. Shows how the verses relate to the topic
4. ${include_practical_tips ? 'Includes practical tips for applying this in daily life' : 'Concludes with key takeaways'}`;

    // Call OpenAI for explanation
    const openai = getOpenAIClient();
    const systemPrompt = getSystemPrompt(language as 'id' | 'en' | 'ar');

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: explanationPrompt },
      ],
      temperature: 0.3,
      max_tokens: depth === 'advanced' ? 1200 : 600,
    });

    const explanation = completion.choices[0].message.content || 'Explanation not available';

    // Generate related topics based on the main topic
    const relatedTopics = generateRelatedTopics(topic);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      explanation: explanation,
      references: relevantVerses,
      related_topics: relatedTopics,
      processing_time_ms: processingTime,
    });
  } catch (error) {
    console.error('AI Explain API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate explanation',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate related topics based on the input topic
 * This is a simple heuristic approach
 */
function generateRelatedTopics(topic: string): string[] {
  const topicLower = topic.toLowerCase();
  
  const topicMap: Record<string, string[]> = {
    'sabar': ['Patience', 'Gratitude', 'Trials', 'Trust in Allah'],
    'patience': ['Sabr', 'Gratitude', 'Trials', 'Trust in Allah'],
    'syukur': ['Gratitude', 'Patience', 'Blessings', 'Remembrance'],
    'gratitude': ['Shukr', 'Patience', 'Blessings', 'Remembrance'],
    'tauhid': ['Tawhid', 'Oneness of Allah', 'Shirk', 'Faith'],
    'tawhid': ['Tawhid', 'Oneness of Allah', 'Shirk', 'Faith'],
    'shirk': ['Tawhid', 'Polytheism', 'Forgiveness', 'Repentance'],
    'rahmat': ['Mercy', 'Forgiveness', 'Compassion', 'Love'],
    'mercy': ['Rahmah', 'Forgiveness', 'Compassion', 'Love'],
    'ampunan': ['Forgiveness', 'Repentance', 'Mercy', 'Grace'],
    'forgiveness': ['Maghfirah', 'Repentance', 'Mercy', 'Grace'],
    'doa': ['Prayer', 'Supplication', 'Remembrance', 'Patience'],
    'prayer': ['Salah', 'Dua', 'Worship', 'Remembrance'],
    'sedekah': ['Charity', 'Zakat', 'Generosity', 'Reward'],
    'charity': ['Sadaqah', 'Zakat', 'Generosity', 'Reward'],
  };

  // Check for matching topics
  for (const [key, topics] of Object.entries(topicMap)) {
    if (topicLower.includes(key)) {
      return topics.filter(t => !topicLower.includes(t.toLowerCase()));
    }
  }

  // Default related topics
  return ['Quranic guidance', 'Prophetic examples', 'Practical application', 'Spiritual reflection'];
}
