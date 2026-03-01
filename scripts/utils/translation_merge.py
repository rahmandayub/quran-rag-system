"""
Indonesian translation merge utility for Quran RAG system.

Provides functions to extract Indonesian translations from legacy parquet files
and merge them with the new CSV dataset by verse_key.
"""

import json
import pandas as pd
from pathlib import Path
from loguru import logger
from tqdm import tqdm

try:
    from ..config import paths, dataset_config
except ImportError:
    from config import paths, dataset_config


def load_parquet_files(parquet_dir: Path = None) -> pd.DataFrame:
    """
    Load all parquet files from the legacy data directory and combine them.
    
    Args:
        parquet_dir: Directory containing parquet files. Defaults to QURAN_DATA_DIR.
        
    Returns:
        Combined DataFrame from all parquet files
    """
    if parquet_dir is None:
        parquet_dir = paths.QURAN_DATA_DIR
    
    if not parquet_dir.exists():
        logger.warning(f"Parquet directory not found: {parquet_dir}")
        return pd.DataFrame()
    
    parquet_files = list(parquet_dir.glob("*.parquet"))
    
    if not parquet_files:
        logger.warning(f"No parquet files found in {parquet_dir}")
        return pd.DataFrame()
    
    logger.info(f"Loading {len(parquet_files)} parquet files from {parquet_dir}")
    
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


def normalize_parquet_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize parquet column names to match our standard schema.
    
    Args:
        df: DataFrame with legacy column names
        
    Returns:
        DataFrame with normalized column names
    """
    # Column mappings from legacy to standard
    column_mappings = {
        'surah': 'chapter_id',
        'ayah': 'verse_number',
        'translation-id-indonesian': 'indonesian_translation',
        'arabic-text-uthmani': 'arabic_text',
        'translation-en-sahih': 'english_translation',
    }
    
    df = df.copy()
    
    # Rename columns
    for old_name, new_name in column_mappings.items():
        if old_name in df.columns:
            df.rename(columns={old_name: new_name}, inplace=True)
    
    # Create verse_key if not present
    if 'verse_key' not in df.columns and 'chapter_id' in df.columns and 'verse_number' in df.columns:
        df['verse_key'] = df.apply(
            lambda row: f"{int(row['chapter_id'])}:{int(row['verse_number'])}",
            axis=1
        )
    
    return df


def extract_indonesian_translations(parquet_dir: Path = None, output_path: Path = None) -> dict:
    """
    Extract Indonesian translations from parquet files into a dictionary.
    
    Args:
        parquet_dir: Directory containing parquet files
        output_path: Optional path to save the extracted translations as JSON
        
    Returns:
        Dictionary mapping verse_key to indonesian_translation
    """
    # Load and normalize parquet data
    df = load_parquet_files(parquet_dir)
    
    if df.empty:
        return {}
    
    df = normalize_parquet_columns(df)
    
    # Create mapping: verse_key -> indonesian_translation
    translations = {}
    
    required_cols = ['verse_key', 'indonesian_translation']
    for col in required_cols:
        if col not in df.columns:
            logger.error(f"Missing required column: {col}")
            return {}
    
    for _, row in df.iterrows():
        verse_key = str(row['verse_key'])
        translation = row['indonesian_translation']
        
        if pd.notna(translation) and translation:
            translations[verse_key] = str(translation)
    
    logger.info(f"Extracted {len(translations)} Indonesian translations")
    
    # Save to JSON if output path provided
    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(translations, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved translations to {output_path}")
    
    return translations


def merge_indonesian_translations(
    csv_df: pd.DataFrame,
    translations: dict = None,
    parquet_dir: Path = None
) -> pd.DataFrame:
    """
    Merge Indonesian translations into the CSV DataFrame.
    
    Args:
        csv_df: DataFrame loaded from new CSV dataset
        translations: Pre-extracted translations dict (optional)
        parquet_dir: Directory containing parquet files (if translations not provided)
        
    Returns:
        DataFrame with added 'indonesian_translation' column
    """
    df = csv_df.copy()
    
    # Ensure verse_key column exists
    if 'verse_key' not in df.columns:
        if 'chapter_id' in df.columns and 'verse_number' in df.columns:
            df['verse_key'] = df.apply(
                lambda row: f"{int(row['chapter_id'])}:{int(row['verse_number'])}",
                axis=1
            )
        else:
            logger.error("Missing required columns for verse_key creation")
            return df
    
    # Get translations
    if translations is None:
        translations = extract_indonesian_translations(parquet_dir)
    
    if not translations:
        logger.warning("No translations available to merge")
        df['indonesian_translation'] = None
        return df
    
    # Merge translations
    df['indonesian_translation'] = df['verse_key'].apply(
        lambda vk: translations.get(str(vk), None)
    )
    
    # Log statistics
    translated_count = df['indonesian_translation'].notna().sum()
    logger.info(f"Merged {translated_count}/{len(df)} verses with Indonesian translations")
    
    return df


def create_verse_key(row: pd.Series, chapter_col: str = 'chapter_id', verse_col: str = 'verse_number') -> str:
    """
    Create a standardized verse key from a DataFrame row.
    
    Args:
        row: pandas Series representing a verse
        chapter_col: Name of chapter/surah column
        verse_col: Name of verse number column
        
    Returns:
        Verse key in format "chapter:verse"
    """
    chapter = int(row[chapter_col])
    verse = int(row[verse_col])
    return f"{chapter}:{verse}"
