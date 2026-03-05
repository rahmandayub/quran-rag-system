"""
Data Processing Pipeline for Quran RAG System

UPDATED: Now uses parquet dataset as primary source for authentic Arabic text
(arabic-text-uthmani) and Indonesian translations, with CSV enrichment data
(tafsir, themes) merged in.

This script orchestrates the modular data processing pipeline:
1. Load parquet dataset (primary source) + CSV enrichment
2. Validate data
3. Normalize text fields
4. Export processed data

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
    from .processing.loader import load_combined_dataset
    from .processing import (
        validate_data,
        normalize_verse_texts,
        export_processed_data,
    )
except ImportError:
    from config import paths, dataset_config, processing_config
    from processing.loader import load_combined_dataset
    from processing import (
        validate_data,
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
    logger.info("Primary source: Parquet (arabic-text-uthmani + Indonesian)")
    logger.info("Enrichment source: CSV (tafsir, themes)")
    logger.info("=" * 60)
    
    # Step 1: Load combined dataset (parquet + CSV enrichment)
    logger.info("Step 1: Loading combined dataset...")
    df = load_combined_dataset()
    logger.info(f"Loaded {len(df)} verses")
    
    # Step 2: Validate data
    logger.info("Step 2: Validating data...")
    validation_result = validate_data(df, strict=processing_config.STRICT_VALIDATION)
    
    if not validation_result['valid']:
        logger.error(f"Validation failed: {validation_result['errors']}")
        raise ValueError(f"Data validation failed: {validation_result['errors']}")
    
    logger.info(f"Validation passed: {validation_result['stats']}")
    
    # Step 3: Normalize text fields
    logger.info("Step 3: Normalizing text fields...")
    df = normalize_verse_texts(df)
    
    # Step 4: Export processed data
    logger.info("Step 4: Exporting processed data...")
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
