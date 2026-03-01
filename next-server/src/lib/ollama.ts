const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || 'qwen3-embedding:0.6b';

/**
 * Generate embedding for a given text using Ollama
 * @param text - The text to generate embedding for
 * @returns Promise resolving to the embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_EMBEDDING_MODEL,
        prompt: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Health check for Ollama service
 */
export async function checkOllamaHealth(): Promise<{ status: string; model?: string }> {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
      method: 'GET',
    });

    if (!response.ok) {
      return { status: 'error' };
    }

    const data = await response.json();
    const hasModel = data.models?.some((m: { name: string }) => m.name === OLLAMA_EMBEDDING_MODEL);
    
    return {
      status: hasModel ? 'ok' : 'missing_model',
      model: OLLAMA_EMBEDDING_MODEL,
    };
  } catch (error) {
    console.error('Error checking Ollama health:', error);
    return { status: 'error' };
  }
}
