"""
Run Script for Quran RAG Data Preparation Pipeline

This script orchestrates the entire data preparation pipeline:
1. Data Processing - Load parquet files, validate, normalize, create full_context
2. Embedding Generation - Generate embeddings using Ollama embeddinggemma
3. Qdrant Indexing - Store vectors in Qdrant database

Usage:
    python -m scripts.run [--skip-processing] [--skip-embedding] [--skip-indexing]
"""

import argparse
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger

try:
    from .config import paths, qdrant_config
except ImportError:
    from config import paths, qdrant_config


def setup_logging():
    """Configure logging for the pipeline."""
    logger.remove()
    logger.add(
        paths.LOGS_DIR / "pipeline.log",
        level="INFO",
        rotation="10 MB",
        retention="7 days"
    )
    logger.add(
        sys.stdout,
        level="INFO",
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{message}</cyan>"
    )


def run_data_processing():
    """Run Phase 1: Data Processing."""
    logger.info("=" * 60)
    logger.info("PHASE 1: DATA PROCESSING")
    logger.info("=" * 60)
    
    try:
        from .data_processing import run_pipeline
    except ImportError:
        from data_processing import run_pipeline
    
    # Run the pipeline
    df = run_pipeline()
    
    logger.info(f"Data processing complete. Output: {paths.PROCESSED_DATA_FILE}")
    return True


def run_embedding_generation():
    """Run Phase 2: Embedding Generation."""
    logger.info("=" * 60)
    logger.info("PHASE 2: EMBEDDING GENERATION")
    logger.info("=" * 60)
    
    try:
        from .embedding_generator import generate_all_embeddings, save_embeddings
    except ImportError:
        from embedding_generator import generate_all_embeddings, save_embeddings
    import json
    
    # Load processed data
    if not paths.PROCESSED_DATA_FILE.exists():
        logger.error("Processed data not found. Please run data processing first.")
        return False
    
    with open(paths.PROCESSED_DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Generate embeddings
    results = generate_all_embeddings(data)
    
    # Save embeddings
    save_embeddings(results)
    
    logger.info(f"Embedding generation complete. Output: {paths.EMBEDDINGS_FILE}")
    return True


def run_qdrant_indexing():
    """Run Phase 3: Qdrant Indexing."""
    logger.info("=" * 60)
    logger.info("PHASE 3: QDRANT INDEXING")
    logger.info("=" * 60)
    
    try:
        from .qdrant_indexer import index_quran_embeddings
    except ImportError:
        from qdrant_indexer import index_quran_embeddings
    
    # Index embeddings
    results = index_quran_embeddings()
    
    # Check verification
    if results['verification']:
        if results['verification']['is_complete']:
            logger.info("All vectors stored successfully in Qdrant!")
        else:
            logger.warning(
                f"Missing {results['verification']['missing']} vectors. "
                f"Expected: {results['verification']['expected']}, "
                f"Actual: {results['verification']['actual']}"
            )
    
    return True


def main():
    """Main entry point for the pipeline."""
    parser = argparse.ArgumentParser(
        description="Quran RAG Data Preparation Pipeline"
    )
    parser.add_argument(
        "--skip-processing",
        action="store_true",
        help="Skip data processing phase"
    )
    parser.add_argument(
        "--skip-embedding",
        action="store_true",
        help="Skip embedding generation phase"
    )
    parser.add_argument(
        "--skip-indexing",
        action="store_true",
        help="Skip Qdrant indexing phase"
    )
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging()
    
    logger.info("=" * 60)
    logger.info("QURAN RAG DATA PREPARATION PIPELINE")
    logger.info("=" * 60)
    
    # Phase 1: Data Processing
    if not args.skip_processing:
        if not run_data_processing():
            logger.error("Data processing failed. Aborting pipeline.")
            return 1
    
    # Phase 2: Embedding Generation
    if not args.skip_embedding:
        if not run_embedding_generation():
            logger.error("Embedding generation failed. Aborting pipeline.")
            return 1
    
    # Phase 3: Qdrant Indexing
    if not args.skip_indexing:
        if not run_qdrant_indexing():
            logger.error("Qdrant indexing failed. Aborting pipeline.")
            return 1
    
    logger.info("=" * 60)
    logger.info("PIPELINE COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Processed data: {paths.PROCESSED_DATA_FILE}")
    logger.info(f"Embeddings: {paths.EMBEDDINGS_FILE}")
    logger.info(f"Qdrant collection: {qdrant_config.COLLECTION_NAME}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
