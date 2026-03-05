import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getOpenAIClient, getSystemPrompt } from '@/lib/openai';
import { searchVersesWithFilters } from '@/lib/qdrant';
import { generateEmbedding } from '@/lib/ollama';

/**
 * POST /api/ai/chat
 * Multi-turn conversational AI about Quran
 * Access: Authenticated users only
 * 
 * Streaming SSE Response:
 * - { type: 'start', conversation_id: string }
 * - { type: 'chunk', content: string }
 * - { type: 'references', references: VerseReference[] }
 * - { type: 'complete', answer: string }
 * - { type: 'error', message: string }
 */
export async function POST(request: NextRequest) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return new Response(
      JSON.stringify({ type: 'error', message: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const {
      message,
      conversation_id,
      language = 'id',
      max_tokens = 800,
    } = body;

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ type: 'error', message: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate conversation ID if not provided
    const convId = conversation_id || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Search for relevant verses based on user message
    let relevantVerses: Array<{
      verse_key: string;
      arabic_text: string;
      translation: string;
      chapter_name: string;
    }> = [];

    try {
      const queryVector = await generateEmbedding(message);
      const searchResults = await searchVersesWithFilters(
        queryVector,
        undefined,
        4,
        0,
        0.35
      );

      relevantVerses = searchResults.map(r => ({
        verse_key: r.payload.verse_key,
        arabic_text: r.payload.arabic_text,
        translation: r.payload.indonesian_translation,
        chapter_name: r.payload.chapter_name,
      }));
    } catch (embeddingError) {
      console.warn('Could not search for relevant verses:', embeddingError);
    }

    // Build context from relevant verses
    const versesContext = relevantVerses
      .map(v => `- ${v.verse_key} (${v.chapter_name}): "${v.translation}"`)
      .join('\n');

    // Build messages for OpenAI
    const systemPrompt = getSystemPrompt(language as 'id' | 'en' | 'ar');
    
    const userMessage = `Relevant Quranic verses for context:
${versesContext || 'No specific verses found'}

User's message: ${message}

Provide a helpful, accurate response based on the verses above if relevant. If no verses are relevant, respond naturally to the user's message.`;

    // Create OpenAI client
    const openai = getOpenAIClient();

    // Create streaming response
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send start event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', conversation_id: convId })}\n\n`));

          // Send references
          if (relevantVerses.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'references', 
                references: relevantVerses.map(v => ({
                  verse_key: v.verse_key,
                  arabic_text: v.arabic_text,
                  translation: v.translation,
                  chapter_name: v.chapter_name,
                }))
              })}\n\n`)
            );
          }

          // Stream completion
          const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature: 0.5,
            max_tokens,
            stream: true,
          });

          let fullResponse = '';

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`));
            }
          }

          // Send complete event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', answer: fullResponse })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Chat streaming error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              message: error instanceof Error ? error.message : 'Streaming error' 
            })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
