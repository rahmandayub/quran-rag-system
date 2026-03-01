"""
Data enrichment module for Quran RAG system.

Provides functions to add derived fields like juz, revelation place, and theme analysis.
"""

import json
import pandas as pd
from loguru import logger
from tqdm import tqdm

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


def parse_themes(df: pd.DataFrame, theme_column: str = 'main_themes') -> pd.DataFrame:
    """
    Parse theme strings and add primary_theme and theme_count columns.
    
    Args:
        df: DataFrame with main_themes column (JSON array string)
        theme_column: Name of the theme column
        
    Returns:
        DataFrame with added 'primary_theme' and 'theme_count' columns
    """
    df = df.copy()
    
    if theme_column not in df.columns:
        logger.warning(f"Theme column '{theme_column}' not found")
        df['primary_theme'] = None
        df['theme_count'] = 0
        return df
    
    logger.info("Parsing themes...")
    
    def extract_primary_theme(theme_str):
        """Extract first theme from JSON array string."""
        if pd.isna(theme_str) or not theme_str:
            return None
        try:
            themes = json.loads(theme_str)
            if isinstance(themes, list) and len(themes) > 0:
                return themes[0]
        except (json.JSONDecodeError, TypeError):
            pass
        return None
    
    def count_themes(theme_str):
        """Count themes in JSON array string."""
        if pd.isna(theme_str) or not theme_str:
            return 0
        try:
            themes = json.loads(theme_str)
            if isinstance(themes, list):
                return len(themes)
        except (json.JSONDecodeError, TypeError):
            pass
        return 0
    
    df['primary_theme'] = df[theme_column].apply(extract_primary_theme)
    df['theme_count'] = df[theme_column].apply(count_themes)
    
    logger.info(f"Added primary_theme and theme_count columns")
    
    return df


def add_derived_fields(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add all derived fields to the DataFrame.
    
    This includes:
    - juz: Juz number (1-30)
    - revelation_place: Makkah or Madinah
    - primary_theme: First theme from main_themes array
    - theme_count: Number of themes
    - tafsir_length: Length of tafsir text
    
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
    
    # Parse themes
    df = parse_themes(df)
    
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
