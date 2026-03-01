#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Script to generate surah-contexts.json from processed_data.json
 * 
 * This script reads the processed Quran data and creates a JSON file
 * with full surah contexts for the RAG system.
 */

const fs = require('fs');
const path = require('path');

// Paths
const INPUT_FILE = path.join(__dirname, '../../output/processed_data.json');
const OUTPUT_FILE = path.join(__dirname, '../data/surah-contexts.json');

/**
 * Process verse data into surah context format
 */
function generateSurahContexts(processedData) {
  // Group verses by surah_number
  const surahMap = new Map();
  
  for (const verse of processedData) {
    const surahNumber = verse.surah_number;
    
    if (!surahMap.has(surahNumber)) {
      surahMap.set(surahNumber, {
        surah_number: surahNumber,
        surah_name_en: verse.surah_name_en,
        surah_name_id: verse.surah_name_id,
        verses: [],
      });
    }
    
    const surah = surahMap.get(surahNumber);
    surah.verses.push({
      verse_number: verse.verse_number,
      verse_arabic: verse.verse_arabic,
      verse_indonesian: verse.verse_indonesian,
      verse_english: verse.verse_english,
    });
  }
  
  // Sort verses within each surah by verse_number
  for (const [, surah] of surahMap) {
    surah.verses.sort((a, b) => a.verse_number - b.verse_number);
    
    // Generate full_text for LLM context
    surah.full_text = surah.verses
      .map((v) => `[${v.verse_number}] ${v.verse_arabic} | ${v.verse_indonesian}`)
      .join('\n');
  }
  
  // Convert map to sorted array
  const surahContexts = Array.from(surahMap.values())
    .sort((a, b) => a.surah_number - b.surah_number);
  
  return surahContexts;
}

/**
 * Main function
 */
async function main() {
  console.log('Generating surah contexts...');
  console.log(`Input: ${INPUT_FILE}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  
  // Check if input file exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Error: Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }
  
  // Read processed data
  console.log('Reading processed data...');
  const processedData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`Loaded ${processedData.length} verses`);
  
  // Generate surah contexts
  console.log('Generating surah contexts...');
  const surahContexts = generateSurahContexts(processedData);
  console.log(`Generated ${surahContexts.length} surah contexts`);
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write output file
  console.log('Writing output file...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(surahContexts, null, 2), 'utf-8');
  
  console.log('Done!');
  console.log(`Output written to: ${OUTPUT_FILE}`);
  
  // Print summary
  console.log('\nSummary:');
  console.log(`- Total surahs: ${surahContexts.length}`);
  console.log(`- Total verses: ${surahContexts.reduce((sum, s) => sum + s.verses.length, 0)}`);
  
  // Show first few surahs as example
  console.log('\nFirst 3 surahs:');
  surahContexts.slice(0, 3).forEach((s) => {
    console.log(`  - Surah ${s.surah_number}: ${s.surah_name_en} (${s.verses.length} verses)`);
  });
}

// Run the script
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
