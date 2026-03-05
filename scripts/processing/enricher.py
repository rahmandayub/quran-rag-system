"""
Data enrichment module for Quran RAG system.

Provides functions to add derived fields like juz, revelation place, and theme analysis.
"""

import json
import pandas as pd
from loguru import logger

try:
    from ..config import dataset_config
    from ..utils import get_juz_number, get_revelation_place
except ImportError:
    from config import dataset_config
    from utils import get_juz_number, get_revelation_place


def add_juz_column(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add juz number column based on surah and verse numbers.
    
    Args:
        df: DataFrame with chapter_id and verse_number columns
        
    Returns:
        DataFrame with added 'juz' column
    """
    df = df.copy()
    
    if 'chapter_id' not in df.columns or 'verse_number' not in df.columns:
        logger.error("Cannot add juz: missing chapter_id or verse_number")
        return df
    
    logger.info("Adding juz column...")
    
    df['juz'] = df.apply(
        lambda row: get_juz_number(int(row['chapter_id']), int(row['verse_number'])),
        axis=1
    )
    
    logger.info(f"Added juz column (range: {df['juz'].min()}-{df['juz'].max()})")
    return df


def add_revelation_place_column(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add revelation place (Makkah/Madinah) column based on surah number.
    
    Args:
        df: DataFrame with chapter_id column
        
    Returns:
        DataFrame with added 'revelation_place' column
    """
    df = df.copy()
    
    if 'chapter_id' not in df.columns:
        logger.error("Cannot add revelation_place: missing chapter_id")
        return df
    
    logger.info("Adding revelation_place column...")
    
    df['revelation_place'] = df['chapter_id'].apply(
        lambda x: get_revelation_place(int(x))
    )
    
    # Log distribution
    makki_count = (df['revelation_place'] == 'Makkah').sum()
    madani_count = (df['revelation_place'] == 'Madinah').sum()
    logger.info(f"Added revelation_place: {makki_count} Makki, {madani_count} Madani")
    
    return df


def add_derived_fields(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add all derived fields to the DataFrame.
    
    This includes:
    - juz: Juz number (1-30)
    - revelation_place: Makkah or Madinah
    - tafsir_length: Length of tafsir text
    
    Note: main_themes is kept as-is from the source CSV (no primary_theme derivation).
    
    Args:
        df: DataFrame with base verse data
        
    Returns:
        DataFrame with all derived fields added
    """
    logger.info("Adding derived fields...")
    
    # Normalize tafsir column name (CSV uses 'tafsir', we use 'tafsir_text')
    if 'tafsir' in df.columns and 'tafsir_text' not in df.columns:
        df.rename(columns={'tafsir': 'tafsir_text'}, inplace=True)
        logger.info("Renamed 'tafsir' column to 'tafsir_text'")
    
    # Add juz
    df = add_juz_column(df)
    
    # Add revelation place
    df = add_revelation_place_column(df)
    
    # Add tafsir length
    if 'tafsir_text' in df.columns:
        df['tafsir_length'] = df['tafsir_text'].apply(
            lambda x: len(str(x)) if pd.notna(x) else 0
        )
    
    logger.info("Derived fields added successfully")
    return df


def enrich_verse_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Complete enrichment pipeline for verse data.
    
    Args:
        df: DataFrame with base verse data
        
    Returns:
        Fully enriched DataFrame
    """
    return add_derived_fields(df)
