import { generateEmbedding } from './ollama';
import { searchVerses } from './qdrant';
import { buildVerseContext, convertToReferences } from './rag';
import { VerseReference, LanguageCode } from '../types';

/**
 * Tool function that OpenAI will call to search Quran verses
 * This function receives an expanded query from the LLM and returns relevant verses
 */
export async function searchQuran(params: {
  expandedQuery: string;
  originalQuery: string;
  intent?: string;
  language?: LanguageCode;
}): Promise<{
  success: boolean;
  verses: string;
  count: number;
  references: VerseReference[];
}> {
  const { expandedQuery, originalQuery, intent, language = 'id' } = params;
  
  console.log('searchQuran called:', {
    originalQuery,
    expandedQuery,
    intent
  });
  
  try {
    // Generate embedding for the expanded query
    const queryVector = await generateEmbedding(expandedQuery);
    
    // Search Qdrant with the expanded query - get more results for better context
    // No hard limit on results, but filtered by score threshold (≥0.5 confidence)
    // This allows relevant verses to be included based on relevance, not arbitrary count
    const verses = await searchVerses(queryVector, 50, 0.5);
    
    if (verses.length === 0) {
      return {
        success: false,
        verses: 'TIDAK ADA AYAT YANG DITEMUKAN. Jangan mengarang atau membuat-buat referensi ayat. Jawab dengan jujur bahwa Anda tidak dapat menemukan ayat yang spesifik untuk pertanyaan ini.',
        count: 0,
        references: []
      };
    }
    
    // Format verses as context string for the LLM (with language support)
    const verseContext = buildVerseContext(verses, language);
    const references = convertToReferences(verses, language);
    
    console.log(`Found ${verses.length} verses for query: "${originalQuery}"`);
    
    return {
      success: true,
      verses: verseContext,
      count: verses.length,
      references
    };
  } catch (error) {
    console.error('Error in searchQuran tool:', error);
    return {
      success: false,
      verses: 'Error searching verses: ' + (error as Error).message,
      count: 0,
      references: []
    };
  }
}

/**
 * Tool definition for OpenAI
 * This tells OpenAI what the tool does and what parameters it expects
 *
 * IMPORTANT: This tool should ONLY be called when:
 * - The user asks about a topic, theme, or teaching in the Quran
 * - The user requests explanation of an Islamic concept
 * - The user's question requires verse references for an accurate answer
 *
 * DO NOT call this tool when:
 * - The user says "thank you", "hello", or other greetings
 * - The user is having a casual conversation
 * - The user's message doesn't require Quranic references
 */
export const searchQuranTool = {
  type: 'function' as const,
  function: {
    name: 'searchQuran',
    description: 'Search for relevant Quran verses based on a topic or question. ONLY use this tool when the user asks about Islamic teachings, Quranic concepts, or topics that require verse references. Do NOT use for casual conversation, greetings, or acknowledgments like "thank you".',
    parameters: {
      type: 'object' as const,
      properties: {
        expandedQuery: {
          type: 'string',
          description: 'Expanded query with related Islamic/Quranic terms. For example, if the user asks about "patience", expand to include "sabr, perseverance, endurance, trials, patience in hardship".'
        },
        originalQuery: {
          type: 'string',
          description: 'The original user query without modification.'
        },
        intent: {
          type: 'string',
          description: 'The detected intent or topic category (e.g., "patience", "inheritance", "prayer", "forgiveness", "gratitude").'
        },
        language: {
          type: 'string',
          description: 'The user\'s preferred language for the response (id, en, ar). Default is Indonesian (id).'
        }
      },
      required: ['expandedQuery', 'originalQuery']
    },
    parse: JSON.parse,
    function: searchQuran
  }
};

