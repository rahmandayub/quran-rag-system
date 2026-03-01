import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getSystemPrompt } from '@/lib/openai';
import { searchQuranTool } from '@/lib/query-expander';
import { buildOpenAIMessages, truncateToTokenLimit, estimateTokenCount } from '@/lib/context-manager';
import { LanguageCode } from '@/types';

// Set dynamic runtime for streaming support
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Disable response size limit for streaming
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, messages, language = 'id' } = body;

    // Validate language
    const validLanguages: LanguageCode[] = ['id', 'en', 'ar'];
    const selectedLanguage = validLanguages.includes(language) ? language : 'id';

    console.log('Chat API received:', {
      query,
      messageCount: messages?.length || 0,
      hasMessages: Array.isArray(messages),
      language: selectedLanguage
    });

    // Validate query
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Validate messages array if provided
    if (messages && !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages must be an array' },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const enqueueData = (data: string) => {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            console.error('Error enqueueing data:', e);
          }
        };

        try {
          // Get system prompt for the selected language
          const systemPrompt = getSystemPrompt(selectedLanguage);

          // Don't send status immediately - let the AI decide if it needs to search
          // The status will be sent when tool calls are made

          // Build OpenAI messages with conversation history
          // If messages array is provided, use it; otherwise fall back to just the query
          let openaiMessages = buildOpenAIMessages(messages || [], systemPrompt);
          
          // If no conversation history, just use the current query
          if (!messages || messages.length === 0) {
            openaiMessages = [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: query
              },
            ];
          }
          
          // Log token estimation for debugging
          const estimatedTokens = estimateTokenCount(openaiMessages);
          console.log('OpenAI messages built, estimated tokens:', estimatedTokens);

          // Truncate if needed to stay within token limits
          if (estimatedTokens > 80000) {
            console.log('Token count exceeds limit, truncating...');
            openaiMessages = truncateToTokenLimit(openaiMessages, 80000);
            console.log('Truncated to estimated tokens:', estimateTokenCount(openaiMessages));
          }

          // Use runTools helper with streaming
          // The searchQuranTool will receive language from the LLM's tool call arguments
          // or default to 'id' if not provided
          const runner = await openai.chat.completions
            .runTools({
              model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
              messages: openaiMessages,
              tools: [searchQuranTool],
              stream: true,
              maxChatCompletions: 5, // Allow multiple tool calls if needed
            })
            .on('functionToolCall', (call) => {
              // call has properties: name, content, parsedArguments
              const toolCall = call as unknown as { name: string; content: string; parsedArguments: unknown };
              console.log('Tool call:', toolCall.name);
              enqueueData(JSON.stringify({
                type: 'status',
                message: `Calling ${toolCall.name}...`
              }) + '\n');
            })
            .on('functionToolCallResult', (result) => {
              // Log the raw result to debug
              console.log('Tool result (raw):', JSON.stringify(result, null, 2));
              // The result should be a string containing the verses context
              const resultString = typeof result === 'string' ? result : JSON.stringify(result);
              // Parse the result to get references and send them to the client
              try {
                const parsed = JSON.parse(resultString);
                if (parsed.success && parsed.references && parsed.references.length > 0) {
                  // Send references event in the format the client expects
                  enqueueData(JSON.stringify({
                    type: 'references',
                    references: parsed.references,
                    query: query
                  }) + '\n');
                }
              } catch {
                console.log('Could not parse result as JSON');
              }
            })
            .on('content', (delta) => {
              // Stream content chunks
              enqueueData(JSON.stringify({
                type: 'chunk',
                content: delta
              }) + '\n');
            });

          // Wait for completion and get final content
          const finalContent = await runner.finalContent();
          
          enqueueData(JSON.stringify({
            type: 'complete',
            answer: finalContent || '',
            query: query
          }) + '\n');

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          enqueueData(JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'An error occurred'
          }) + '\n');
          controller.close();
        }
      },
    });

    // Return streaming response with proper headers to prevent buffering
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Support streaming with GET for health check
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Chat API is running with streaming support' });
}
