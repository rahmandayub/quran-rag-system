import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/ollama';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Generate embedding for the text
    const embedding = await generateEmbedding(text);

    return NextResponse.json({ embedding });
  } catch (error) {
    console.error('Error in embed API:', error);
    
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
