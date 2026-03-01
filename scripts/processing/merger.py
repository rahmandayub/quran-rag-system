"""
Translation merger module for Quran RAG system.

Provides functions to merge Indonesian translations from legacy parquet files
into the new CSV dataset.
"""

import pandas as pd
from pathlib import Path
from loguru import logger

try:
    from ..config import paths
    from ..utils import extract_indonesian_translations
except ImportError:
    from config import paths
    from utils import extract_indonesian_translations


def merge_translations(
    df: pd.DataFrame,
    translations: dict = None,
    parquet_dir: Path = None
) -> pd.DataFrame:
    """
    Merge Indonesian translations into the DataFrame.
    
    Args:
        df: DataFrame with verse_key column
        translations: Pre-extracted translations dict (optional)
        parquet_dir: Directory containing parquet files (if translations not provided)
        
    Returns:
        DataFrame with added 'indonesian_translation' column
    """
    df = df.copy()
    
    # Ensure verse_key column exists
    if 'verse_key' not in df.columns:
        if 'chapter_id' in df.columns and 'verse_number' in df.columns:
            df['verse_key'] = df.apply(
                lambda row: f"{int(row['chapter_id'])}:{int(row['verse_number'])}",
                axis=1
            )
            logger.info("Created verse_key column for merging")
        else:
            logger.error("Cannot merge: missing verse_key, chapter_id, or verse_number")
            df['indonesian_translation'] = None
            return df
    
    # Get translations
    if translations is None:
        logger.info("Extracting Indonesian translations from parquet files...")
        translations = extract_indonesian_translations(parquet_dir)
    
    if not translations:
        logger.warning("No translations available to merge")
        df['indonesian_translation'] = None
        return df
    
    # Merge translations
    logger.info(f"Merging {len(translations)} Indonesian translations...")
    
    df['indonesian_translation'] = df['verse_key'].apply(
        lambda vk: translations.get(str(vk), None)
    )
    
    # Log statistics
    translated_count = df['indonesian_translation'].notna().sum()
    total_count = len(df)
    logger.info(f"Merged {translated_count}/{total_count} verses with Indonesian translations")
    
    return df


def merge_english_translations(
    df: pd.DataFrame,
    translations: dict = None
) -> pd.DataFrame:
    """
    Merge English translations if provided separately.
    
    Args:
        df: DataFrame with verse_key column
        translations: Dictionary mapping verse_key to english translation
        
    Returns:
        DataFrame with added 'english_translation' column (if not present)
    """
    df = df.copy()
    
    if not translations:
        return df
    
    # Only merge if english_translation doesn't exist
    if 'english_translation' in df.columns:
        logger.info("english_translation already exists, skipping merge")
        return df
    
    if 'verse_key' not in df.columns:
        logger.error("Cannot merge: missing verse_key")
        return df
    
    logger.info(f"Merging {len(translations)} English translations...")
    
    df['english_translation'] = df['verse_key'].apply(
        lambda vk: translations.get(str(vk), None)
    )
    
    translated_count = df['english_translation'].notna().sum()
    logger.info(f"Merged {translated_count}/{len(df)} verses with English translations")
    
    return df
