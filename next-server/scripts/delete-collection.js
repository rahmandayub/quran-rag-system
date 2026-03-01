#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Script to delete Qdrant collections
 * 
 * Usage:
 *   node scripts/delete-collection.js [collection_name]
 * 
 * If no collection name is provided, it will delete the Quran collection.
 * Note: Hadith collection support has been removed as the current milestone
 * only supports Quran.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local') });

const { QdrantClient } = require('@qdrant/js-client-rest');

const QDRANT_HOST = process.env.QDRANT_HOST || 'localhost';
const QDRANT_PORT = process.env.QDRANT_PORT || '6335';
const QDRANT_COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'quran_verses';

async function deleteCollections() {
  console.log('Delete Qdrant Collections');
  console.log(`Host: ${QDRANT_HOST}:${QDRANT_PORT}`);

  const client = new QdrantClient({
    url: `http://${QDRANT_HOST}:${QDRANT_PORT}`,
  });

  const args = process.argv.slice(2);
  let collectionsToDelete = [];

  if (args.length > 0) {
    // Delete specific collection
    collectionsToDelete = [args[0]];
  } else {
    // Delete Quran collection by default
    collectionsToDelete = [QDRANT_COLLECTION_NAME];
  }

  try {
    for (const collectionName of collectionsToDelete) {
      const collections = await client.getCollections();
      const exists = collections.collections.some((c) => c.name === collectionName);

      if (exists) {
        console.log(`\nDeleting collection '${collectionName}'...`);
        await client.deleteCollection(collectionName);
        console.log(`Collection '${collectionName}' deleted successfully!`);
      } else {
        console.log(`\nCollection '${collectionName}' does not exist. Skipping.`);
      }
    }

    console.log('\nDone!');
    console.log('\nNote: To completely flush Qdrant storage including qdrant_storage folder,');
    console.log('run: docker compose down && rm -rf ./qdrant_storage/collections/* && docker compose up -d');
  } catch (error) {
    console.error('Error deleting collections:', error);
    process.exit(1);
  }
}

deleteCollections();
