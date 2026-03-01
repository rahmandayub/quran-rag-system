"""
Data loading module for Quran RAG system.

Provides functions to load data from CSV and parquet files.
"""

import pandas as pd
from pathlib import Path
from loguru import logger
from tqdm import tqdm

try:
    from ..config import paths, dataset_config
except ImportError:
    from config import paths, dataset_config


def load_csv_dataset(csv_path: Path = None) -> pd.DataFrame:
    """
    Load the main Quran dataset from CSV file.
    
    Args:
        csv_path: Path to CSV file. Defaults to DATASET_CSV_PATH.
        
    Returns:
        DataFrame with all verses from CSV
    """
    if csv_path is None:
        csv_path = paths.DATASET_CSV_PATH
    
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV dataset not found: {csv_path}")
    
    logger.info(f"Loading CSV dataset from {csv_path}")
    
    df = pd.read_csv(csv_path)
    
    logger.info(f"Loaded {len(df)} verses from CSV")
    logger.info(f"Columns: {list(df.columns)}")
    
    return df


def load_parquet_files(data_dir: Path = None) -> pd.DataFrame:
    """
    Load all parquet files from legacy data directory.
    
    Args:
        data_dir: Directory containing parquet files. Defaults to QURAN_DATA_DIR.
        
    Returns:
        Combined DataFrame from all parquet files
    """
    if data_dir is None:
        data_dir = paths.QURAN_DATA_DIR
    
    if not data_dir.exists():
        logger.warning(f"Parquet directory not found: {data_dir}")
        return pd.DataFrame()
    
    parquet_files = sorted(data_dir.glob("*.parquet"))
    
    if not parquet_files:
        logger.warning(f"No parquet files found in {data_dir}")
        return pd.DataFrame()
    
    logger.info(f"Loading {len(parquet_files)} parquet files from {data_dir}")
    
    dataframes = []
    for pq_file in tqdm(parquet_files, desc="Loading parquet files"):
        try:
            df = pd.read_parquet(pq_file)
            dataframes.append(df)
        except Exception as e:
            logger.error(f"Error loading {pq_file}: {e}")
    
    if not dataframes:
        return pd.DataFrame()
    
    combined = pd.concat(dataframes, ignore_index=True)
    logger.info(f"Loaded {len(combined)} total verses from parquet files")
    
    return combined


def normalize_csv_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize CSV column names to match our standard schema.
    
    The new CSV dataset uses these columns:
    - chapter_id, verse_number, verse_key, chapter_name
    - arabic_text, english_translation, tafsir_text
    - main_themes, practical_application, audience_group
    - translation_length
    
    Args:
        df: DataFrame with CSV column names
        
    Returns:
        DataFrame with normalized column names
    """
    df = df.copy()
    
    # Standardize column names (lowercase with underscores)
    column_mappings = {
        'chapter_id': 'chapter_id',
        'verse_number': 'verse_number',
        'verse_key': 'verse_key',
        'chapter_name': 'chapter_name',
        'arabic_text': 'arabic_text',
        'english_translation': 'english_translation',
        'tafsir_text': 'tafsir_text',
        'main_themes': 'main_themes',
        'practical_application': 'practical_application',
        'audience_group': 'audience_group',
        'translation_length': 'translation_length',
    }
    
    # Check that all required columns exist
    missing = set(column_mappings.keys()) - set(df.columns)
    if missing:
        logger.warning(f"Missing columns in CSV: {missing}")
    
    return df


def ensure_verse_key(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ensure verse_key column exists, create if missing.
    
    Args:
        df: DataFrame with chapter_id and verse_number columns
        
    Returns:
        DataFrame with verse_key column
    """
    df = df.copy()
    
    if 'verse_key' not in df.columns:
        if 'chapter_id' in df.columns and 'verse_number' in df.columns:
            df['verse_key'] = df.apply(
                lambda row: f"{int(row['chapter_id'])}:{int(row['verse_number'])}",
                axis=1
            )
            logger.info("Created verse_key column from chapter_id and verse_number")
        else:
            logger.error("Cannot create verse_key: missing chapter_id or verse_number")
    
    return df
