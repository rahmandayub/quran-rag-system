"""
Main Data Processing Script for Quran RAG System

This script processes the Quran dataset by:
1. Loading parquet data (primary source) - authentic Arabic text and Indonesian
2. Loading CSV enrichment data (secondary source) - tafsir, themes
3. Merging both sources by verse_key
4. Exporting processed data for embedding generation

UPDATED: Now uses parquet dataset as primary source for authentic Arabic text
(arabic-text-uthmani) and Indonesian translations.

Usage:
    python -m scripts.process_quran_data
    
Or run directly:
    python scripts/process_quran_data.py
"""

import json
from pathlib import Path
from loguru import logger

try:
    from .config import paths, dataset_config
    from .processing.loader import load_combined_dataset
except ImportError:
    from config import paths, dataset_config
    from processing.loader import load_combined_dataset


def process_and_export_data():
    """
    Main function to process and export Quran data.
    
    Returns:
        dict: Processing results with counts and file paths
    """
    logger.info("="*80)
    logger.info("QURAN DATA PROCESSING PIPELINE")
    logger.info("="*80)
    logger.info(f"Primary source: Parquet dataset (arabic-text-uthmani)")
    logger.info(f"Enrichment source: CSV dataset (tafsir, themes)")
    logger.info("="*80)
    
    # Step 1: Load and merge datasets
    logger.info("Step 1: Loading and merging datasets...")
    merged_df = load_combined_dataset()
    
    logger.info(f"Loaded {len(merged_df)} verses")
    logger.info(f"Columns: {list(merged_df.columns)}")
    
    # Step 2: Validate data
    logger.info("Step 2: Validating data...")
    validation_results = validate_data(merged_df)
    
    if not validation_results['is_valid']:
        logger.error(f"Validation failed: {validation_results}")
        raise ValueError(f"Data validation failed: {validation_results}")
    
    logger.info(f"Validation passed: {validation_results}")
    
    # Step 3: Prepare data for embedding/export
    logger.info("Step 3: Preparing data for export...")
    verses = prepare_verses_for_export(merged_df)
    
    # Step 4: Export to JSON
    logger.info("Step 4: Exporting to JSON...")
    json_output = paths.PROCESSED_DATA_FILE
    with open(json_output, 'w', encoding='utf-8') as f:
        json.dump(verses, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Exported {len(verses)} verses to {json_output}")
    
    # Step 5: Export to parquet (optional, for faster re-loading)
    logger.info("Step 5: Exporting to parquet...")
    parquet_output = paths.PROCESSED_DATA_PARQUET
    merged_df.to_parquet(parquet_output, index=False, engine='pyarrow')
    
    logger.info(f"Exported {len(merged_df)} verses to {parquet_output}")
    
    # Summary
    results = {
        'total_verses': len(verses),
        'validation': validation_results,
        'json_output': str(json_output),
        'parquet_output': str(parquet_output),
        'columns': list(merged_df.columns),
    }
    
    logger.info("="*80)
    logger.info("PROCESSING COMPLETE")
    logger.info("="*80)
    logger.info(f"Total verses: {results['total_verses']}")
    logger.info(f"JSON output: {results['json_output']}")
    logger.info(f"Parquet output: {results['parquet_output']}")
    logger.info("="*80)
    
    return results


def validate_data(df) -> dict:
    """
    Validate processed data integrity.
    
    Args:
        df: DataFrame to validate
        
    Returns:
        Validation results dictionary
    """
    results = {
        'total_verses': len(df),
        'expected_verses': dataset_config.TOTAL_VERSES,
        'missing_columns': [],
        'null_arabic': 0,
        'null_indonesian': 0,
        'is_valid': True,
    }
    
    # Check required columns
    for col in dataset_config.REQUIRED_COLUMNS:
        if col not in df.columns:
            results['missing_columns'].append(col)
            results['is_valid'] = False
    
    # Check for null values in critical fields
    if 'arabic_text' in df.columns:
        results['null_arabic'] = df['arabic_text'].isnull().sum()
        if results['null_arabic'] > 0:
            logger.warning(f"Found {results['null_arabic']} verses with null Arabic text")
    
    if 'indonesian_translation' in df.columns:
        results['null_indonesian'] = df['indonesian_translation'].isnull().sum()
        if results['null_indonesian'] > 0:
            logger.warning(f"Found {results['null_indonesian']} verses with null Indonesian translation")
    
    # Check verse count
    if len(df) != dataset_config.TOTAL_VERSES:
        logger.warning(
            f"Expected {dataset_config.TOTAL_VERSES} verses, found {len(df)}"
        )
    
    # Check for presentation form characters in Arabic text (should NOT be present)
    if 'arabic_text' in df.columns:
        presentation_form_count = 0
        for text in df['arabic_text']:
            if isinstance(text, str):
                for char in text:
                    code = ord(char)
                    # Check for Arabic Presentation Forms-A (U+FB50-U+FDFF)
                    if 0xFB50 <= code <= 0xFDFF:
                        presentation_form_count += 1
                        break
        
        if presentation_form_count > 0:
            logger.warning(
                f"Found {presentation_form_count} verses with presentation form characters"
            )
        else:
            logger.info("✓ No presentation form characters detected in Arabic text")
    
    return results


def prepare_verses_for_export(df) -> list:
    """
    Convert DataFrame to list of verse dictionaries for JSON export.
    
    Args:
        df: DataFrame with processed data
        
    Returns:
        List of verse dictionaries
    """
    verses = []
    
    for _, row in df.iterrows():
        verse = {
            'verse_key': row.get('verse_key', ''),
            'chapter_id': int(row.get('chapter_id', 0)),
            'verse_number': int(row.get('verse_number', 0)),
            'chapter_name': row.get('chapter_name', ''),
            
            # Text fields - using parquet Arabic and Indonesian
            'arabic_text': row.get('arabic_text', ''),
            'indonesian_translation': row.get('indonesian_translation', ''),
            'english_translation': row.get('english_translation', ''),
            
            # Enrichment fields from CSV
            'tafsir_text': row.get('tafsir_text', ''),
            'main_themes': row.get('main_themes', ''),
            'practical_application': row.get('practical_application', ''),
            
            # Metadata
            'juz': int(row.get('juz', 0)) if 'juz' in row else 0,
            'revelation_place': row.get('revelation_place', ''),
        }
        verses.append(verse)
    
    return verses


def main():
    """Main entry point."""
    try:
        results = process_and_export_data()
        
        print("\n" + "="*80)
        print("DATA PROCESSING COMPLETE")
        print("="*80)
        print(f"Total verses processed: {results['total_verses']}")
        print(f"JSON output: {results['json_output']}")
        print(f"Parquet output: {results['parquet_output']}")
        print("="*80)
        
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        raise


if __name__ == "__main__":
    main()
