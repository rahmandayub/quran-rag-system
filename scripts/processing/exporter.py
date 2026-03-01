"""
Data exporter module for Quran RAG system.

Provides functions to export processed data to JSON or parquet formats.
"""

import json
import pandas as pd
from pathlib import Path
from loguru import logger
from tqdm import tqdm

try:
    from ..config import paths
except ImportError:
    from config import paths


def export_to_json(df: pd.DataFrame, output_path: Path = None, indent: int = 2) -> Path:
    """
    Export DataFrame to JSON file.
    
    Args:
        df: DataFrame to export
        output_path: Output file path. Defaults to PROCESSED_DATA_FILE.
        indent: JSON indentation level
        
    Returns:
        Path to exported file
    """
    if output_path is None:
        output_path = paths.PROCESSED_DATA_FILE
    
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Exporting {len(df)} verses to {output_path}...")
    
    # Convert to records and save
    records = df.to_dict(orient='records')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=indent)
    
    logger.info(f"Exported {len(records)} verses to {output_path}")
    return output_path


def export_to_parquet(df: pd.DataFrame, output_path: Path = None) -> Path:
    """
    Export DataFrame to parquet file.
    
    Args:
        df: DataFrame to export
        output_path: Output file path. Defaults to PROCESSED_DATA_PARQUET.
        
    Returns:
        Path to exported file
    """
    if output_path is None:
        output_path = paths.PROCESSED_DATA_PARQUET
    
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Exporting {len(df)} verses to {output_path}...")
    
    df.to_parquet(output_path, index=False, engine='pyarrow')
    
    logger.info(f"Exported {len(df)} verses to {output_path}")
    return output_path


def export_processed_data(
    df: pd.DataFrame,
    output_dir: Path = None,
    formats: list = None
) -> dict:
    """
    Export processed data to multiple formats.
    
    Args:
        df: DataFrame to export
        output_dir: Output directory. Defaults to OUTPUT_DIR.
        formats: List of formats to export. Defaults to ['json', 'parquet'].
        
    Returns:
        Dictionary with paths to exported files
    """
    if output_dir is None:
        output_dir = paths.OUTPUT_DIR
    
    if formats is None:
        formats = ['json', 'parquet']
    
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    results = {}
    
    for fmt in formats:
        try:
            if fmt == 'json':
                output_path = output_dir / 'processed_verses.json'
                export_to_json(df, output_path)
                results['json'] = output_path
            elif fmt == 'parquet':
                output_path = output_dir / 'processed_verses.parquet'
                export_to_parquet(df, output_path)
                results['parquet'] = output_path
            else:
                logger.warning(f"Unknown export format: {fmt}")
        except Exception as e:
            logger.error(f"Error exporting to {fmt}: {e}")
    
    return results


def export_for_embedding(
    df: pd.DataFrame,
    output_path: Path = None,
    text_fields: list = None
) -> Path:
    """
    Export data specifically for embedding generation.
    
    Creates a simplified JSON structure with only the fields needed for embedding.
    
    Args:
        df: DataFrame to export
        output_path: Output file path. Defaults to EMBEDDINGS_FILE parent dir.
        text_fields: Fields to include in embedding text. Defaults to embedding_source_fields.
        
    Returns:
        Path to exported file
    """
    from ..config import dataset_config, embedding_config
    
    if output_path is None:
        output_path = embedding_config.EMBEDDINGS_FILE if hasattr(embedding_config, 'EMBEDDINGS_FILE') else paths.OUTPUT_DIR / 'embedding_input.json'
    
    if text_fields is None:
        text_fields = dataset_config.EMBEDDING_SOURCE_FIELDS
    
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Exporting embedding data for {len(df)} verses...")
    
    # Create simplified structure
    embedding_data = []
    for _, row in tqdm(df.iterrows(), total=len(df), desc="Preparing embedding data"):
        item = {
            'verse_key': row.get('verse_key'),
            'chapter_id': int(row.get('chapter_id', 0)),
            'verse_number': int(row.get('verse_number', 0)),
        }
        
        # Add text fields for embedding
        text_parts = []
        for field in text_fields:
            if field in row and pd.notna(row[field]):
                text_parts.append(str(row[field]))
        
        item['embedding_text'] = ' | '.join(text_parts)
        embedding_data.append(item)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(embedding_data, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Exported embedding data to {output_path}")
    return output_path
