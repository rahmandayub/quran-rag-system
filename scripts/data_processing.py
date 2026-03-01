"""
Data Processing Pipeline for Quran RAG System

This script orchestrates the modular data processing pipeline:
1. Load CSV dataset
2. Validate data
3. Enrich with derived fields (juz, revelation place, themes)
4. Merge Indonesian translations from legacy parquet files
5. Normalize text fields
6. Export processed data

Usage:
    python -m scripts.data_processing
    
Or run directly:
    python scripts/data_processing.py
"""

import sys
from pathlib import Path
from loguru import logger

# Configure logging
logger.remove()
logger.add(
    sys.stderr,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {module} | {message}",
    level="INFO"
)

try:
    from .config import paths, dataset_config, processing_config
    from .processing import (
        load_csv_dataset,
        validate_data,
        enrich_verse_data,
        merge_translations,
        normalize_verse_texts,
        export_processed_data,
    )
except ImportError:
    from config import paths, dataset_config, processing_config
    from processing import (
        load_csv_dataset,
        validate_data,
        enrich_verse_data,
        merge_translations,
        normalize_verse_texts,
        export_processed_data,
    )


def run_pipeline():
    """
    Run the complete data processing pipeline.
    
    Returns:
        Processed DataFrame
    """
    logger.info("=" * 60)
    logger.info("Starting Quran Data Processing Pipeline")
    logger.info("=" * 60)
    
    # Step 1: Load CSV dataset
    logger.info("Step 1: Loading CSV dataset...")
    df = load_csv_dataset(paths.DATASET_CSV_PATH)
    logger.info(f"Loaded {len(df)} verses from CSV")
    
    # Step 2: Validate data
    logger.info("Step 2: Validating data...")
    validation_result = validate_data(df, strict=processing_config.STRICT_VALIDATION)
    
    if not validation_result['valid']:
        logger.error(f"Validation failed: {validation_result['errors']}")
        raise ValueError(f"Data validation failed: {validation_result['errors']}")
    
    logger.info(f"Validation passed: {validation_result['stats']}")
    
    # Step 3: Enrich with derived fields
    logger.info("Step 3: Enriching data with derived fields...")
    df = enrich_verse_data(df)
    logger.info(f"Added fields: juz, revelation_place, primary_theme, theme_count")
    
    # Step 4: Merge Indonesian translations
    logger.info("Step 4: Merging Indonesian translations from parquet files...")
    df = merge_translations(df, parquet_dir=paths.QURAN_DATA_DIR)
    
    # Step 5: Normalize text fields
    logger.info("Step 5: Normalizing text fields...")
    df = normalize_verse_texts(df)
    
    # Step 6: Export processed data
    logger.info("Step 6: Exporting processed data...")
    export_results = export_processed_data(df, formats=['json', 'parquet'])
    
    for fmt, path in export_results.items():
        logger.info(f"Exported {fmt} to {path}")
    
    # Final summary
    logger.info("=" * 60)
    logger.info("Pipeline completed successfully!")
    logger.info(f"Total verses: {len(df)}")
    logger.info(f"Columns: {list(df.columns)}")
    logger.info("=" * 60)
    
    return df


def main():
    """Main entry point."""
    try:
        run_pipeline()
        logger.info("Data processing completed successfully!")
        return 0
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
