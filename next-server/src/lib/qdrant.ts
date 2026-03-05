import { QdrantClient } from '@qdrant/js-client-rest';
import { VerseSearchResult, VersePayload, SearchFilters } from '../types';

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
 * Build Qdrant filter from search filters
 */
function buildQdrantFilter(filters?: SearchFilters) {
  const conditions: Array<{
    key: string;
    match?: { value: number | string } | { any: (number | string)[] };
    is_empty?: boolean;
  }> = [];
  
  if (filters?.juz) {
    conditions.push({
      key: 'juz',
      match: { value: filters.juz }
    });
  }
  
  if (filters?.revelation_place) {
    conditions.push({
      key: 'revelation_place',
      match: { value: filters.revelation_place }
    });
  }
  
  if (filters?.chapter_id) {
    conditions.push({
      key: 'chapter_id',
      match: { value: filters.chapter_id }
    });
  }
  
  if (filters?.themes?.length) {
    conditions.push({
      key: 'primary_theme',
      match: { any: filters.themes }
    });
  }
  
  if (filters?.focus === 'tafsir') {
    conditions.push({
      key: 'tafsir_text',
      is_empty: false
    });
  }
  
  if (filters?.focus === 'dawah') {
    // Filter for verses related to da'wah themes
    conditions.push({
      key: 'primary_theme',
      match: { any: ['Da\'wah', 'Guidance', 'Invitation'] }
    });
  }
  
  return conditions.length > 0 ? { must: conditions } : undefined;
}

/**
 * Search for verses in Qdrant using a query vector with optional filters
 * @param queryVector - Embedding vector
 * @param filters - Optional search filters
 * @param limit - Maximum number of results (default: 10)
 * @param offset - Pagination offset (default: 0)
 * @param scoreThreshold - Minimum similarity score (default: 0.5)
 * @returns Array of verse search results
 */
export async function searchVersesWithFilters(
  queryVector: number[],
  filters?: SearchFilters,
  limit: number = 10,
  offset: number = 0,
  scoreThreshold: number = 0.5
): Promise<VerseSearchResult[]> {
  const qdrant = getQdrantClient();
  
  try {
    const filter = buildQdrantFilter(filters);
    
    const results = await qdrant.search(QDRANT_COLLECTION_NAME, {
      vector: queryVector,
      filter,
      limit: limit,
      offset: offset,
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
 * Search for verses (legacy function, kept for backward compatibility)
 */
export async function searchVerses(
  queryVector: number[],
  limit: number = 4,
  scoreThreshold: number = 0.5
): Promise<VerseSearchResult[]> {
  return searchVersesWithFilters(queryVector, undefined, limit, 0, scoreThreshold);
}

/**
 * Get all unique themes with verse counts
 * Uses main_themes field (JSON array of theme strings, e.g., ["Faith", "Worship", "Guidance"])
 */
export async function getAllThemes(): Promise<{ name: string; arabic: string; count: number }[]> {
  const qdrant = getQdrantClient();
  
  try {
    // Scroll through all points to aggregate themes
    const themes = new Map<string, { arabic: string; count: number }>();
    
    let offset: string | number | undefined = undefined;
    const batchSize = 100;
    
    do {
      const response = await qdrant.scroll(QDRANT_COLLECTION_NAME, {
        limit: batchSize,
        offset,
        with_payload: true,
      });
      
      response.points.forEach((point) => {
        const payload = point.payload as unknown as VersePayload;
        
        // Handle main_themes as JSON array string
        if (payload?.main_themes) {
          let themeList: string[] = [];
          
          // Check if it's a JSON array string (starts with [)
          const rawThemes = payload.main_themes.trim();
          if (rawThemes.startsWith('[') && rawThemes.endsWith(']')) {
            // Parse JSON array - handle both valid JSON and Python-style arrays
            try {
              // Try standard JSON parse first
              const parsed = JSON.parse(rawThemes);
              if (Array.isArray(parsed)) {
                themeList = parsed.map((t: string) => t.trim()).filter((t: string) => t.length > 0);
              }
            } catch {
              // Try to extract themes from Python-style array string like ['Faith', 'Worship']
              // Remove brackets and split by comma
              const cleaned = rawThemes.slice(1, -1); // Remove [ and ]
              themeList = cleaned.split(',')
                .map((t) => t.trim().replace(/^['"]|['"]$/g, '')) // Remove quotes
                .filter((t) => t.length > 0);
            }
          } else {
            // Single theme string
            themeList = [rawThemes];
          }
          
          // Count each theme
          themeList.forEach((theme) => {
            const cleanTheme = theme.trim();
            if (!cleanTheme) return;
            
            const existing = themes.get(cleanTheme);
            if (existing) {
              existing.count++;
            } else {
              themes.set(cleanTheme, { arabic: '', count: 1 });
            }
          });
        }
      });
      
      // Handle next_page_offset - only use string or number types
      const nextOffset = response.next_page_offset;
      if (typeof nextOffset === 'string' || typeof nextOffset === 'number') {
        offset = nextOffset;
      } else {
        offset = undefined;
      }
    } while (offset !== undefined);
    
    // Convert to array and sort by count descending
    const result = Array.from(themes.entries())
      .map(([name, data]) => ({ name, arabic: data.arabic || name, count: data.count }))
      .sort((a, b) => b.count - a.count);
    
    console.log(`getAllThemes: Found ${result.length} unique themes`);
    return result;
  } catch (error) {
    console.error('Error getting themes:', error);
    throw new Error('Failed to get themes');
  }
}

/**
 * Get verse by key
 */
export async function getVerseByKey(verseKey: string): Promise<VersePayload | null> {
  const qdrant = getQdrantClient();
  
  try {
    // Search for verse with exact key match using a dummy vector
    const results = await qdrant.search(QDRANT_COLLECTION_NAME, {
      vector: [0], // Dummy vector - filter does the work
      filter: {
        must: [
          {
            key: 'verse_key',
            match: { value: verseKey }
          }
        ]
      },
      limit: 1,
      with_payload: true,
    });
    
    if (results.length === 0) {
      return null;
    }
    
    return results[0].payload as unknown as VersePayload;
  } catch (error) {
    console.error('Error getting verse by key:', error);
    throw new Error('Failed to get verse');
  }
}

/**
 * Get random verse by seed (for verse-of-the-day)
 * Uses simple approach: get all point IDs and retrieve by ID
 */
export async function getRandomVerse(seed: number): Promise<VersePayload | null> {
  const qdrant = getQdrantClient();
  
  try {
    // Get total count first
    const info = await qdrant.getCollection(QDRANT_COLLECTION_NAME);
    const totalCount = info.indexed_vectors_count || 0;
    
    console.log(`getRandomVerse: collection info - total=${totalCount}, status=ok`);
    
    if (totalCount === 0) {
      console.error('getRandomVerse: Collection is empty!');
      return null;
    }
    
    // Calculate random index from seed
    const randomIndex = seed % totalCount;
    
    // Scroll to get the verse at the calculated position
    // Use scroll without offset first to get a cursor, then paginate
    const response = await qdrant.scroll(QDRANT_COLLECTION_NAME, {
      limit: randomIndex + 1,
      with_payload: true,
    });
    
    console.log(`getRandomVerse: scrolled ${response.points.length} points, next_offset=${response.next_page_offset}`);
    
    if (response.points.length === 0) {
      console.error('getRandomVerse: No points returned from scroll');
      return null;
    }
    
    // Get the last point (at randomIndex position)
    const point = response.points[response.points.length - 1];
    console.log(`getRandomVerse: returning point ${point.id}`);
    
    return point.payload as unknown as VersePayload;
  } catch (error) {
    console.error('Error getting random verse:', error);
    throw new Error('Failed to get random verse');
  }
}

/**
 * Get verses by theme
 */
export async function getVersesByTheme(
  theme: string,
  limit: number = 10
): Promise<VerseSearchResult[]> {
  const qdrant = getQdrantClient();
  
  try {
    const results = await qdrant.search(QDRANT_COLLECTION_NAME, {
      vector: [0], // Dummy vector - filter does the work
      filter: {
        must: [
          {
            key: 'primary_theme',
            match: { value: theme }
          }
        ]
      },
      limit: limit,
      with_payload: true,
    });
    
    return results.map((result) => ({
      score: result.score || 0,
      payload: result.payload as unknown as VersePayload,
    }));
  } catch (error) {
    console.error('Error getting verses by theme:', error);
    throw new Error('Failed to get verses by theme');
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
