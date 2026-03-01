import { QdrantClient } from '@qdrant/js-client-rest';
import { VerseSearchResult, VersePayload } from '../types';

const QDRANT_HOST = process.env.QDRANT_HOST || 'localhost';
const QDRANT_PORT = process.env.QDRANT_PORT || '6335';
const QDRANT_COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'quran_verses';

// Create singleton Qdrant client
let client: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!client) {
    client = new QdrantClient({
      url: `http://${QDRANT_HOST}:${QDRANT_PORT}`,
    });
  }
  return client;
}

/**
 * Search for verses in Qdrant using a query vector
 * @param queryVector - 768-dimensional embedding vector
 * @param limit - Maximum number of results to return (default: 4)
 * @param scoreThreshold - Minimum similarity score threshold (default: 0.5)
 * @returns Array of verse search results
 */
export async function searchVerses(
  queryVector: number[],
  limit: number = 4,
  scoreThreshold: number = 0.5
): Promise<VerseSearchResult[]> {
  const qdrant = getQdrantClient();
  
  try {
    const results = await qdrant.search(QDRANT_COLLECTION_NAME, {
      vector: queryVector,
      limit: limit,
      score_threshold: scoreThreshold,
      with_payload: true,
    });
    
    return results.map((result) => ({
      score: result.score || 0,
      payload: result.payload as unknown as VersePayload,
    }));
  } catch (error) {
    console.error('Error searching verses in Qdrant:', error);
    throw new Error('Failed to search verses');
  }
}

/**
 * Get collection info for health check
 */
export async function getCollectionInfo(): Promise<{ status: string; vectors_count?: number }> {
  const qdrant = getQdrantClient();
  
  try {
    const info = await qdrant.getCollection(QDRANT_COLLECTION_NAME);
    return {
      status: 'ok',
      vectors_count: info.indexed_vectors_count ?? undefined,
    };
  } catch (error) {
    console.error('Error getting collection info:', error);
    throw new Error('Failed to get collection info');
  }
}

