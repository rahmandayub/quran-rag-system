"""
Qdrant Data Migration Script

Migrates existing Qdrant data to use authentic Arabic text from parquet dataset
instead of CSV presentation form characters.

This script:
1. Exports existing verse_keys from Qdrant
2. Deletes the old collection
3. Re-processes data with new parquet-based pipeline
4. Re-indexes all embeddings with authentic Arabic text

Usage:
    python -m scripts.migrate_qdrant_data
    
Or run directly:
    python scripts/migrate_qdrant_data.py

WARNING: This will delete the existing Qdrant collection!
"""

import json
from pathlib import Path
from loguru import logger

try:
    from .config import paths, qdrant_config, dataset_config, embedding_config
    from .qdrant_indexer import QdrantIndexer, index_quran_embeddings
    from .processing.loader import load_combined_dataset
except ImportError:
    from config import paths, qdrant_config, dataset_config, embedding_config
    from qdrant_indexer import QdrantIndexer, index_quran_embeddings
    from processing.loader import load_combined_dataset


def migrate_qdrant_data(
    confirm_delete: bool = False,
    regenerate_embeddings: bool = True
):
    """
    Migrate Qdrant data to use authentic Arabic text.
    
    Args:
        confirm_delete: Must be True to proceed with deletion
        regenerate_embeddings: If True, regenerate embeddings with new text
    """
    logger.info("="*80)
    logger.info("QDRANT DATA MIGRATION")
    logger.info("="*80)
    logger.info("This script will:")
    logger.info("1. Delete existing Qdrant collection")
    logger.info("2. Re-process data with parquet-based pipeline")
    logger.info("3. Re-index embeddings with authentic Arabic text")
    logger.info("="*80)
    
    if not confirm_delete:
        logger.error("Set confirm_delete=True to proceed with migration")
        raise ValueError("Migration requires explicit confirmation")
    
    # Step 1: Initialize indexer and delete old collection
    logger.info("Step 1: Deleting old collection...")
    indexer = QdrantIndexer()
    
    if indexer.delete_collection():
        logger.info("Old collection deleted successfully")
    else:
        logger.warning("Old collection did not exist or could not be deleted")
    
    # Step 2: Load and process new data
    logger.info("Step 2: Loading combined dataset (parquet + CSV enrichment)...")
    merged_df = load_combined_dataset()
    
    logger.info(f"Loaded {len(merged_df)} verses")
    
    # Verify Arabic text is authentic (not presentation forms)
    logger.info("Step 3: Verifying Arabic text authenticity...")
    auth_check = verify_arabic_text_authenticity(merged_df)
    
    if not auth_check['is_authentic']:
        logger.error(f"Arabic text verification failed: {auth_check}")
        raise ValueError(f"Arabic text contains presentation form characters: {auth_check['presentation_form_count']} verses affected")
    
    logger.info(f"✓ Arabic text is authentic: {auth_check}")
    
    # Step 4: Prepare data for embedding
    logger.info("Step 4: Preparing data for embedding...")
    verses = prepare_verses_for_embedding(merged_df)
    
    # Save prepared data
    prepared_file = paths.OUTPUT_DIR / "prepared_verses.json"
    with open(prepared_file, 'w', encoding='utf-8') as f:
        json.dump(verses, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Prepared {len(verses)} verses saved to {prepared_file}")
    
    # Step 5: Regenerate embeddings (if requested)
    if regenerate_embeddings:
        logger.info("Step 5: Regenerating embeddings...")
        logger.info("Note: This requires Ollama to be running with embeddinggemma model")
        
        # Update embedding generator to use new data
        from .embedding_generator import (
            OllamaEmbeddingClient,
            CheckpointManager,
            generate_all_embeddings,
            prepare_embedding_text
        )
        
        client = OllamaEmbeddingClient()
        
        # Verify model
        if not client.verify_model():
            logger.error(f"Embedding model '{embedding_config.MODEL_NAME}' not found")
            logger.error("Please ensure Ollama is running and the model is available")
            raise ValueError("Embedding model not available")
        
        checkpoint = CheckpointManager()
        
        # Generate embeddings
        verses_with_embeddings = generate_all_embeddings(verses, client, checkpoint)
        
        # Save embeddings
        embeddings_file = paths.EMBEDDINGS_FILE
        with open(embeddings_file, 'w', encoding='utf-8') as f:
            json.dump(verses_with_embeddings, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Embeddings saved to {embeddings_file}")
    
    # Step 6: Index in Qdrant
    logger.info("Step 6: Indexing in Qdrant...")
    
    indexing_results = index_quran_embeddings(
        embeddings_file=paths.EMBEDDINGS_FILE,
        verify=True,
        recreate_collection=False  # Already deleted above
    )
    
    # Final summary
    logger.info("="*80)
    logger.info("MIGRATION COMPLETE")
    logger.info("="*80)
    logger.info(f"Total verses migrated: {indexing_results['total_verses']}")
    logger.info(f"Upserted: {indexing_results['upserted']}")
    
    if indexing_results['verification']:
        logger.info(f"Verification: {indexing_results['verification']['is_complete']}")
    
    logger.info(f"Collection: {qdrant_config.COLLECTION_NAME}")
    logger.info("="*80)
    
    return indexing_results


def verify_arabic_text_authenticity(df) -> dict:
    """
    Verify that Arabic text does not contain presentation form characters.
    
    Args:
        df: DataFrame with arabic_text column
        
    Returns:
        Verification results dictionary
    """
    results = {
        'total_verses': len(df),
        'presentation_form_count': 0,
        'affected_verses': [],
        'is_authentic': True,
    }
    
    if 'arabic_text' not in df.columns:
        results['is_authentic'] = False
        results['error'] = "arabic_text column not found"
        return results
    
    for idx, row in df.iterrows():
        text = row.get('arabic_text', '')
        if isinstance(text, str):
            for char in text:
                code = ord(char)
                # Check for Arabic Presentation Forms-A (U+FB50-U+FDFF)
                if 0xFB50 <= code <= 0xFDFF:
                    results['presentation_form_count'] += 1
                    results['affected_verses'].append(row.get('verse_key', str(idx)))
                    break
    
    if results['presentation_form_count'] > 0:
        results['is_authentic'] = False
    
    return results


def prepare_verses_for_embedding(df) -> list:
    """
    Prepare verses for embedding generation.
    
    Args:
        df: DataFrame with processed data
        
    Returns:
        List of verse dictionaries ready for embedding
    """
    verses = []
    
    for _, row in df.iterrows():
        verse = {
            'verse_key': row.get('verse_key', ''),
            'chapter_id': int(row.get('chapter_id', 0)),
            'verse_number': int(row.get('verse_number', 0)),
            'chapter_name': row.get('chapter_name', ''),
            'arabic_text': row.get('arabic_text', ''),
            'indonesian_translation': row.get('indonesian_translation', ''),
            'english_translation': row.get('english_translation', ''),
            'tafsir_text': row.get('tafsir_text', ''),
            'main_themes': row.get('main_themes', ''),
            'practical_application': row.get('practical_application', ''),
            'juz': int(row.get('juz', 0)) if 'juz' in row else 0,
            'revelation_place': row.get('revelation_place', ''),
        }
        verses.append(verse)
    
    return verses


def main():
    """Main entry point."""
    import sys
    
    # Require explicit confirmation
    confirm = len(sys.argv) > 1 and sys.argv[1] == '--confirm'
    
    if not confirm:
        print("="*80)
        print("QDRANT DATA MIGRATION")
        print("="*80)
        print("WARNING: This will delete the existing Qdrant collection!")
        print()
        print("Usage:")
        print("  python scripts/migrate_qdrant_data.py --confirm")
        print()
        print("Or in Python:")
        print("  from scripts.migrate_qdrant_data import migrate_qdrant_data")
        print("  migrate_qdrant_data(confirm_delete=True)")
        print("="*80)
        return
    
    try:
        results = migrate_qdrant_data(confirm_delete=True)
        
        print("\n" + "="*80)
        print("MIGRATION COMPLETE")
        print("="*80)
        print(f"Total verses migrated: {results['total_verses']}")
        print(f"Upserted: {results['upserted']}")
        
        if results['verification'] and results['verification']['is_complete']:
            print("✓ All vectors stored successfully!")
        else:
            print(f"⚠ Missing {results['verification'].get('missing', 'unknown')} vectors")
        
        print("="*80)
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise


if __name__ == "__main__":
    main()
