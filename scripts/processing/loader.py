"""
Data loading module for Quran RAG system.

Provides functions to load data from:
1. Parquet dataset (primary source) - authentic Arabic text (arabic-text-uthmani)
   and Indonesian translations
2. CSV dataset (enrichment source) - tafsir, themes, practical applications

UPDATED: Now uses parquet as primary data source with CSV enrichment merge.
"""

import pandas as pd
from pathlib import Path
from loguru import logger

try:
    from ..config import paths, dataset_config
except ImportError:
    from config import paths, dataset_config


def load_parquet_dataset(parquet_dir: Path = None) -> pd.DataFrame:
    """
    Load the main Quran dataset from parquet files (primary source).
    
    Loads all 172 parquet files and combines them into a single DataFrame.
    This is the primary source for:
    - arabic-text-uthmani (authentic Arabic script)
    - translation-id-indonesian (Indonesian translation)
    
    Args:
        parquet_dir: Path to parquet directory. Defaults to PARQUET_DATA_DIR.
        
    Returns:
        DataFrame with all verses from parquet files
    """
    if parquet_dir is None:
        parquet_dir = paths.PARQUET_DATA_DIR
    
    if not parquet_dir.exists():
        raise FileNotFoundError(f"Parquet dataset not found: {parquet_dir}")
    
    logger.info(f"Loading parquet dataset from {parquet_dir}")
    
    # Find all parquet files
    parquet_files = sorted(parquet_dir.glob("*.parquet"))
    logger.info(f"Found {len(parquet_files)} parquet files")
    
    if len(parquet_files) == 0:
        raise ValueError(f"No parquet files found in {parquet_dir}")
    
    # Load and combine all files
    dfs = []
    for pf in parquet_files:
        df = pd.read_parquet(pf)
        dfs.append(df)
    
    combined_df = pd.concat(dfs, ignore_index=True)
    
    logger.info(f"Loaded {len(combined_df)} verses from {len(parquet_files)} parquet files")
    logger.info(f"Columns: {list(combined_df.columns)}")
    
    return combined_df


def load_csv_enrichment(csv_path: Path = None) -> pd.DataFrame:
    """
    Load CSV dataset for enrichment fields (secondary source).
    
    This CSV provides:
    - tafsir (exegesis/commentary)
    - main_themes (thematic tags)
    - practical_application (life lessons)
    - english_translation (fallback)
    
    Args:
        csv_path: Path to CSV file. Defaults to CSV_ENRICHMENT_PATH.
        
    Returns:
        DataFrame with enrichment fields (deduplicated by verse_key)
    """
    if csv_path is None:
        csv_path = paths.CSV_ENRICHMENT_PATH
    
    if not csv_path.exists():
        logger.warning(f"CSV enrichment file not found: {csv_path}")
        return pd.DataFrame()
    
    logger.info(f"Loading CSV enrichment data from {csv_path}")
    
    df = pd.read_csv(csv_path)
    
    logger.info(f"Loaded {len(df)} rows from CSV")
    
    # Deduplicate by verse_key (keep first occurrence)
    if 'verse_key' in df.columns:
        duplicates_count = df.duplicated(subset=['verse_key']).sum()
        if duplicates_count > 0:
            logger.info(f"Removing {duplicates_count} duplicate verses by verse_key")
            df = df.drop_duplicates(subset=['verse_key'], keep='first')
            logger.info(f"After deduplication: {len(df)} unique verses")
    
    return df


def merge_parquet_with_csv_enrichment(
    parquet_df: pd.DataFrame,
    csv_df: pd.DataFrame
) -> pd.DataFrame:
    """
    Merge parquet Arabic/Indonesian with CSV enrichment fields.
    
    Merge strategy:
    - parquet: surah + ayah → verse_key = "{surah}:{ayah}"
    - csv: chapter_id + verse_number → verse_key = "{chapter_id}:{verse_number}"
    
    Args:
        parquet_df: DataFrame from parquet files
        csv_df: DataFrame from CSV enrichment
        
    Returns:
        Merged DataFrame with all fields
    """
    logger.info("Merging parquet data with CSV enrichment...")
    
    # Create verse_key in parquet if not exists
    if 'verse_key' not in parquet_df.columns:
        parquet_df['verse_key'] = parquet_df['surah'].astype(str) + ':' + parquet_df['ayah'].astype(str)
        logger.info("Created verse_key in parquet DataFrame")
    
    # Create verse_key in CSV if not exists
    if 'verse_key' not in csv_df.columns:
        if 'chapter_id' in csv_df.columns and 'verse_number' in csv_df.columns:
            csv_df['verse_key'] = csv_df['chapter_id'].astype(str) + ':' + csv_df['verse_number'].astype(str)
            logger.info("Created verse_key in CSV DataFrame")
    
    # Select only needed columns from CSV for enrichment
    csv_enrichment_cols = ['verse_key', 'tafsir', 'main_themes',
                           'practical_application', 'english_translation']
    csv_cols_to_use = [c for c in csv_enrichment_cols if c in csv_df.columns]
    logger.info(f"Using CSV columns for enrichment: {csv_cols_to_use}")
    
    csv_enrichment = csv_df[csv_cols_to_use].copy()
    
    # Rename tafsir to tafsir_text for consistency
    if 'tafsir' in csv_enrichment.columns:
        csv_enrichment = csv_enrichment.rename(columns={'tafsir': 'tafsir_text'})
    
    # Merge parquet with CSV enrichment (left join to keep all parquet verses)
    merged = parquet_df.merge(csv_enrichment, on='verse_key', how='left')
    logger.info(f"Merged DataFrame: {len(merged)} verses")
    
    # Rename parquet columns to standard names
    rename_mappings = {
        'surah': 'chapter_id',
        'ayah': 'verse_number',
        'arabic-text-uthmani': 'arabic_text',
        'translation-id-indonesian': 'indonesian_translation',
        'surah-name-en': 'chapter_name',
    }
    
    for old_name, new_name in rename_mappings.items():
        if old_name in merged.columns:
            merged = merged.rename(columns={old_name: new_name})
    
    # Fill missing indonesian_translation from fallback if available
    if 'indonesian_translation' in merged.columns and 'translation-id-jalalayn' in merged.columns:
        merged['indonesian_translation'] = merged['indonesian_translation'].fillna(
            merged['translation-id-jalalayn']
        )
    
    logger.info(f"Final merged columns: {list(merged.columns)}")
    
    return merged


def load_combined_dataset() -> pd.DataFrame:
    """
    Main function to load and merge all data sources.
    
    Returns:
        Combined DataFrame with Arabic, Indonesian, and enrichment fields
    """
    logger.info("Loading combined Quran dataset...")
    
    # Load primary data (parquet)
    parquet_df = load_parquet_dataset()
    
    # Load enrichment data (CSV)
    csv_df = load_csv_enrichment()
    
    if csv_df.empty:
        logger.warning("CSV enrichment is empty, using parquet data only")
        # Still need to rename columns for consistency
        if 'verse_key' not in parquet_df.columns:
            parquet_df['verse_key'] = parquet_df['surah'].astype(str) + ':' + parquet_df['ayah'].astype(str)
        rename_mappings = {
            'surah': 'chapter_id',
            'ayah': 'verse_number',
            'arabic-text-uthmani': 'arabic_text',
            'translation-id-indonesian': 'indonesian_translation',
            'surah-name-en': 'chapter_name',
        }
        for old_name, new_name in rename_mappings.items():
            if old_name in parquet_df.columns:
                parquet_df = parquet_df.rename(columns={old_name: new_name})
        return parquet_df
    
    # Merge datasets
    merged_df = merge_parquet_with_csv_enrichment(parquet_df, csv_df)
    
    logger.info(f"Combined dataset: {len(merged_df)} verses")
    logger.info(f"Columns: {list(merged_df.columns)}")
    
    return merged_df


# ============================================================================
# Legacy functions (kept for backward compatibility)
# ============================================================================

def load_csv_dataset(csv_path: Path = None) -> pd.DataFrame:
    """
    Load the main Quran dataset from CSV file (LEGACY - use load_combined_dataset instead).
    
    Args:
        csv_path: Path to CSV file. Defaults to DATASET_CSV_PATH.
        
    Returns:
        DataFrame with all verses from CSV (deduplicated by verse_key)
    """
    if csv_path is None:
        csv_path = paths.DATASET_CSV_PATH
    
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV dataset not found: {csv_path}")
    
    logger.info(f"Loading CSV dataset from {csv_path}")
    
    df = pd.read_csv(csv_path)
    
    logger.info(f"Loaded {len(df)} verses from CSV")
    logger.info(f"Columns: {list(df.columns)}")
    
    # Deduplicate by verse_key (keep first occurrence)
    if 'verse_key' in df.columns:
        duplicates_count = df.duplicated(subset=['verse_key']).sum()
        if duplicates_count > 0:
            logger.info(f"Removing {duplicates_count} duplicate verses by verse_key")
            df = df.drop_duplicates(subset=['verse_key'], keep='first')
            logger.info(f"After deduplication: {len(df)} unique verses")
    
    return df


def normalize_csv_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize CSV column names to match our standard schema (LEGACY).
    
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
    Ensure verse_key column exists, create if missing (LEGACY).
    
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
