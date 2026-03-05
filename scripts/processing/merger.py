"""
Indonesian Translation Merger for Quran RAG System.

This module ONLY extracts Indonesian translations from legacy parquet files
and merges them into the CSV-based dataset. It does NOT modify any other fields.

The parquet files are used solely as a source for Indonesian translations.
"""

import pandas as pd
from pathlib import Path
from loguru import logger

try:
    from ..config import paths
except ImportError:
    from config import paths


def extract_indonesian_translations(parquet_dir: Path = None) -> dict:
    """
    Extract Indonesian translations from parquet files into a dictionary.
    
    Args:
        parquet_dir: Directory containing parquet files. Defaults to QURAN_DATA_DIR.
        
    Returns:
        Dictionary mapping verse_key to indonesian_translation
    """
    if parquet_dir is None:
        parquet_dir = paths.QURAN_DATA_DIR
    
    if not parquet_dir.exists():
        logger.warning(f"Parquet directory not found: {parquet_dir}")
        return {}
    
    parquet_files = list(parquet_dir.glob("*.parquet"))
    
    if not parquet_files:
        logger.warning(f"No parquet files found in {parquet_dir}")
        return {}
    
    logger.info(f"Loading {len(parquet_files)} parquet files for Indonesian translations...")
    
    # Load and combine all parquet files
    dataframes = []
    for pq_file in parquet_files:
        try:
            df = pd.read_parquet(pq_file)
            dataframes.append(df)
        except Exception as e:
            logger.error(f"Error loading {pq_file}: {e}")
    
    if not dataframes:
        return {}
    
    combined = pd.concat(dataframes, ignore_index=True)
    logger.info(f"Loaded {len(combined)} verses from parquet files")
    
    # Extract only Indonesian translations
    # Parquet files use: surah, ayah, translation-id-indonesian
    translations = {}
    
    for _, row in combined.iterrows():
        surah = int(row.get('surah', 0))
        ayah = int(row.get('ayah', 0))
        verse_key = f"{surah}:{ayah}"
        
        translation = row.get('translation-id-indonesian')
        if pd.notna(translation) and translation:
            translations[verse_key] = str(translation)
    
    logger.info(f"Extracted {len(translations)} Indonesian translations from parquet files")
    
    return translations


def merge_indonesian_translations(
    df: pd.DataFrame,
    translations: dict = None,
    parquet_dir: Path = None
) -> pd.DataFrame:
    """
    Merge Indonesian translations into the CSV DataFrame.
    
    This function ONLY adds the 'indonesian_translation' column.
    It does NOT modify any existing columns like arabic_text, english_translation,
    main_themes, etc.
    
    Args:
        df: DataFrame loaded from CSV dataset
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
        translations = extract_indonesian_translations(parquet_dir)
    
    if not translations:
        logger.warning("No translations available to merge")
        df['indonesian_translation'] = None
        return df
    
    # Merge translations ONLY
    logger.info(f"Merging {len(translations)} Indonesian translations...")
    
    df['indonesian_translation'] = df['verse_key'].apply(
        lambda vk: translations.get(str(vk), None)
    )
    
    # Log statistics
    translated_count = df['indonesian_translation'].notna().sum()
    logger.info(f"Merged {translated_count}/{len(df)} verses with Indonesian translations")
    
    # Verify that main_themes is preserved
    if 'main_themes' in df.columns:
        themes_with_data = (df['main_themes'].notna() & (df['main_themes'] != '[]')).sum()
        logger.info(f"main_themes preserved: {themes_with_data}/{len(df)} verses with themes")
    
    return df
