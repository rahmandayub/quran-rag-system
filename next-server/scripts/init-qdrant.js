#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Script to initialize Qdrant collection for Quran verses
 * 
 * This script creates the quran_verses_enhanced collection in Qdrant with the appropriate
 * vector size and payload indexing for the new enhanced schema.
 * 
 * New schema includes:
 * - verse_key, chapter_id, verse_number, chapter_name
 * - juz, revelation_place
 * - main_themes, primary_theme, theme_count, audience_group
 * - arabic_text, english_translation, indonesian_translation, tafsir_text
 * - practical_application, translation_length, tafsir_length
 */

// Load environment variables from .env.local
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local') });

const { QdrantClient } = require('@qdrant/js-client-rest');

const QDRANT_HOST = process.env.QDRANT_HOST || 'localhost';
const QDRANT_PORT = process.env.QDRANT_PORT || '6335';
const QDRANT_COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'quran_verses_enhanced';
const EMBEDDING_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION || '1024', 10);
const DISTANCE_METRIC = process.env.DISTANCE_METRIC || 'Cosine';

async function initializeQdrant() {
  console.log('Initializing Qdrant...');
  console.log(`Host: ${QDRANT_HOST}:${QDRANT_PORT}`);
  console.log(`Collection: ${QDRANT_COLLECTION_NAME}`);
  console.log(`Vector Size: ${EMBEDDING_DIMENSION}`);
  console.log(`Distance Metric: ${DISTANCE_METRIC}`);

  const client = new QdrantClient({
    url: `http://${QDRANT_HOST}:${QDRANT_PORT}`,
  });

  try {
    // Initialize Quran verses collection
    await initializeCollection(client, QDRANT_COLLECTION_NAME, EMBEDDING_DIMENSION, DISTANCE_METRIC);
    
    console.log('\nQdrant initialization complete!');
    
  } catch (error) {
    console.error('Error initializing Qdrant:', error);
    process.exit(1);
  }
}

/**
 * Initialize or recreate a Qdrant collection
 * @param {QdrantClient} client - The Qdrant client
 * @param {string} collectionName - The collection name
 * @param {number} vectorSize - The vector dimension
 * @param {string} distanceMetric - The distance metric
 */
async function initializeCollection(client, collectionName, vectorSize, distanceMetric) {
  // Check if collection already exists
  const collections = await client.getCollections();
  const collectionExists = collections.collections.some(
    (c) => c.name === collectionName
  );

  if (collectionExists) {
    console.log(`\nCollection '${collectionName}' already exists.`);
    
    // Get collection info
    const info = await client.getCollection(collectionName);
    console.log(`  - Vectors count: ${info.indexed_vectors_count || 0}`);
    console.log(`  - Points count: ${info.points_count || 0}`);
    console.log(`  - Vector size: ${info.config?.params?.vectors?.size || 'unknown'}`);
    
    // Check if vector size matches
    const currentVectorSize = info.config?.params?.vectors?.size;
    if (currentVectorSize && currentVectorSize !== vectorSize) {
      console.log(`\n⚠️  Vector size mismatch! Current: ${currentVectorSize}, Expected: ${vectorSize}`);
      console.log(`Deleting collection '${collectionName}' to recreate with correct vector size...`);
      
      await client.deleteCollection(collectionName);
      console.log(`Collection '${collectionName}' deleted.`);
      
      // Recreate collection
      await createCollection(client, collectionName, vectorSize, distanceMetric);
    } else {
      console.log(`  ✓ Vector size matches: ${vectorSize}`);
    }
  } else {
    // Create new collection
    await createCollection(client, collectionName, vectorSize, distanceMetric);
  }
}

/**
 * Create a Qdrant collection with payload indexes
 * @param {QdrantClient} client - The Qdrant client
 * @param {string} collectionName - The collection name
 * @param {number} vectorSize - The vector dimension
 * @param {string} distanceMetric - The distance metric
 */
async function createCollection(client, collectionName, vectorSize, distanceMetric) {
  console.log(`\nCreating collection '${collectionName}'...`);
  
  await client.createCollection(collectionName, {
    vectors: {
      size: vectorSize,
      distance: distanceMetric,
    },
    optimizers_config: {
      default_segment_number: 2,
      memmap_threshold: 10000,
    },
    hnsw_config: {
      m: 16,
      ef_construct: 100,
    },
  });

  console.log('Collection created successfully!');

  // Create payload indexes for efficient filtering
  console.log('\nCreating payload indexes...');
  
  // Integer indexes
  const integerFields = ['chapter_id', 'verse_number', 'juz', 'theme_count', 'translation_length', 'tafsir_length'];
  for (const field of integerFields) {
    try {
      await client.createPayloadIndex(collectionName, {
        field_name: field,
        field_schema: 'integer',
      });
      console.log(`  ✓ Created integer index for '${field}'`);
    } catch {
      console.log(`  ⚠ Index for '${field}' may already exist`);
    }
  }
  
  // Keyword indexes
  const keywordFields = ['verse_key', 'chapter_name', 'revelation_place', 'primary_theme', 'audience_group', 'main_themes'];
  for (const field of keywordFields) {
    try {
      await client.createPayloadIndex(collectionName, {
        field_name: field,
        field_schema: 'keyword',
      });
      console.log(`  ✓ Created keyword index for '${field}'`);
    } catch {
      console.log(`  ⚠ Index for '${field}' may already exist`);
    }
  }

  console.log('\nPayload indexes created successfully!');
}

initializeQdrant();
