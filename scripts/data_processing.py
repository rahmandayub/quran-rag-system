"""
Data Processing Script for Quran RAG System

This script loads all parquet files, validates data, normalizes text,
creates full_context fields, and outputs processed dataset.

Column mappings for nazimali/quran dataset:
- surah → surah_number
- ayah → verse_number
- surah-name → surah_name_arabic
- surah-name-transliteration → surah_name_latin
- surah-name-en → surah_name_en
- arabic-text-uthmani → verse_arabic
- translation-id-indonesian → verse_indonesian
- translation-en-sahih → verse_english
"""

import json
import pandas as pd
from pathlib import Path
from loguru import logger
from tqdm import tqdm

try:
    from .config import paths, data_config
    from .utils import normalize_text
except ImportError:
    from config import paths, data_config
    from utils import normalize_text


# Column name mappings from source dataset to our standard names
COLUMN_MAPPINGS = {
    'surah': 'surah_number',
    'ayah': 'verse_number',
    'surah-name': 'surah_name_arabic',
    'surah-name-transliteration': 'surah_name_latin',
    'surah-name-en': 'surah_name_en',
    'arabic-text-uthmani': 'verse_arabic',
    'translation-id-indonesian': 'verse_indonesian',
    'translation-en-sahih': 'verse_english',
}

# Required source columns
REQUIRED_SOURCE_COLUMNS = list(COLUMN_MAPPINGS.keys())


def get_juz_number(surah: int, verse: int) -> int:
    """
    Calculate juz number based on surah and verse number.
    
    Uses standard juz boundaries based on common Quran divisions.
    
    Args:
        surah: Surah number (1-114)
        verse: Verse number within surah
        
    Returns:
        Juz number (1-30)
    """
    # Juz boundaries: (surah, verse) where each juz starts
    # Based on standard Hafs Quran divisions
    juz_boundaries = [
        (1, 1),     # Juz 1: Al-Fatihah
        (2, 142),   # Juz 2: Al-Baqarah 142
        (2, 253),   # Juz 3: Al-Baqarah 253
        (3, 93),    # Juz 4: Ali 'Imran 93
        (4, 24),    # Juz 5: An-Nisa 24
        (4, 148),   # Juz 6: An-Nisa 148
        (5, 82),    # Juz 7: Al-Ma'idah 82
        (6, 111),   # Juz 8: Al-An'am 111
        (7, 88),    # Juz 9: Al-A'raf 88
        (8, 41),    # Juz 10: Al-Anfal 41
        (9, 93),    # Juz 11: At-Tawbah 93
        (11, 6),    # Juz 12: Hud 6
        (12, 53),   # Juz 13: Yusuf 53
        (13, 19),   # Juz 14: Ar-Ra'd 19
        (15, 1),    # Juz 15: Al-Hijr 1
        (16, 129),  # Juz 16: An-Nahl 129
        (17, 1),    # Juz 17: Al-Isra 1
        (18, 75),   # Juz 18: Al-Kahf 75
        (21, 1),    # Juz 19: Al-Anbiya 1
        (22, 79),   # Juz 20: Al-Hajj 79
        (25, 21),   # Juz 21: Al-Furqan 21
        (27, 56),   # Juz 22: An-Naml 56
        (29, 45),   # Juz 23: Al-'Ankabut 45
        (33, 31),   # Juz 24: Al-Ahzab 31
        (36, 28),   # Juz 25: Ya-Sin 28
        (39, 32),   # Juz 26: Az-Zumar 32
        (41, 47),   # Juz 27: Fussilat 47
        (48, 1),    # Juz 28: Al-Fath 1
        (51, 31),   # Juz 29: Adh-Dhariyat 31
        (67, 1),    # Juz 30: Al-Mulk 1
    ]
    
    # Find the juz by checking boundaries
    juz = 1
    for i, (boundary_surah, boundary_verse) in enumerate(juz_boundaries):
        if surah > boundary_surah or (surah == boundary_surah and verse >= boundary_verse):
            juz = i + 1
    
    return juz


def load_parquet_files(data_dir: Path) -> pd.DataFrame:
    """
    Load all parquet files and combine into single DataFrame.
    
    Args:
        data_dir: Directory containing parquet files
        
    Returns:
        Combined DataFrame with all verses
    """
    parquet_files = sorted(data_dir.glob("train-*.parquet"))
    
    if len(parquet_files) != data_config.TOTAL_PARQUET_FILES:
        logger.warning(
            f"Expected {data_config.TOTAL_PARQUET_FILES} parquet files, "
            f"found {len(parquet_files)}"
        )
    
    dataframes = []
    for file_path in tqdm(parquet_files, desc="Loading parquet files"):
        df = pd.read_parquet(file_path)
        dataframes.append(df)
    
    combined_df = pd.concat(dataframes, ignore_index=True)
    logger.info(f"Loaded {len(combined_df)} verses from {len(parquet_files)} files")
    
    return combined_df


def rename_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Rename columns from source names to standard names.
    
    Args:
        df: DataFrame with source column names
        
    Returns:
        DataFrame with standard column names
    """
    return df.rename(columns=COLUMN_MAPPINGS)


def validate_data(df: pd.DataFrame) -> dict:
    """
    Validate data completeness and integrity.
    
    Args:
        df: DataFrame to validate
        
    Returns:
        Dictionary with validation results
    """
    validation_results = {
        'total_verses': len(df),
        'expected_verses': data_config.TOTAL_VERSES,
        'missing_columns': [],
        'null_values': {},
        'surah_range_valid': True,
        'is_valid': True
    }
    
    # Check required columns (after renaming)
    required_cols = ['surah_number', 'verse_number', 'surah_name_arabic',
                     'surah_name_latin', 'surah_name_en',
                     'verse_arabic', 'verse_indonesian', 'verse_english']
    
    for col in required_cols:
        if col not in df.columns:
            validation_results['missing_columns'].append(col)
            validation_results['is_valid'] = False
    
    # Check for null values
    for col in required_cols:
        if col in df.columns:
            null_count = df[col].isnull().sum()
            if null_count > 0:
                validation_results['null_values'][col] = null_count
    
    # Validate surah number range (1-114)
    if 'surah_number' in df.columns:
        surah_min = df['surah_number'].min()
        surah_max = df['surah_number'].max()
        if surah_min < 1 or surah_max > 114:
            validation_results['surah_range_valid'] = False
            validation_results['is_valid'] = False
    
    # Check total verses
    if len(df) != data_config.TOTAL_VERSES:
        logger.warning(
            f"Expected {data_config.TOTAL_VERSES} verses, found {len(df)}"
        )
    
    return validation_results


def create_full_context(row: pd.Series) -> str:
    """
    Create combined context from Arabic, Indonesian, and English translations.
    
    Format: "{verse_arabic} | {verse_indonesian} | {verse_english}"
    
    Args:
        row: DataFrame row with verse data
        
    Returns:
        Combined context string
    """
    arabic = row.get('verse_arabic', '')
    indonesian = row.get('verse_indonesian', '')
    english = row.get('verse_english', '')
    
    # Clean individual components
    arabic = normalize_text(arabic)
    indonesian = normalize_text(indonesian)
    english = normalize_text(english)
    
    return f"{arabic} | {indonesian} | {english}"


def generate_verse_id(row: pd.Series) -> str:
    """
    Generate unique verse ID in format {surah_number}:{verse_number}.
    
    Args:
        row: DataFrame row with surah_number and verse_number
        
    Returns:
        Unique verse ID string
    """
    return f"{int(row['surah_number'])}:{int(row['verse_number'])}"


def create_reference(row: pd.Series) -> str:
    """
    Create human-readable reference string.
    
    Format: "Surat {surah_name_latin} ({surah_name_arabic}, {surah_name_en}, {surah_name_indonesian}) ({surah_number}): Ayat {verse_number}"
    
    Args:
        row: DataFrame row with verse data
        
    Returns:
        Reference string
    """
    return (
        f"Surat {row['surah_name_latin']} ({row['surah_name_arabic']}, "
        f"{row['surah_name_en']}, {row['surah_name_indonesian']}) "
        f"({int(row['surah_number'])}): Ayat {int(row['verse_number'])}"
    )


def process_quran_data() -> pd.DataFrame:
    """
    Main function to process Quran data from parquet files.
    
    Returns:
        Processed DataFrame with all transformations
    """
    logger.info("Starting Quran data processing...")
    
    # Step 1: Load data
    df = load_parquet_files(paths.QURAN_DATA_DIR)
    
    # Step 2: Rename columns
    logger.info("Renaming columns...")
    df = rename_columns(df)
    
    # Step 3: Validate data
    validation = validate_data(df)
    if not validation['is_valid']:
        logger.error(f"Data validation failed: {validation}")
        raise ValueError(f"Data validation failed: {validation}")
    logger.info(f"Data validation passed: {validation}")
    
    # Step 4: Calculate juz number (not in source dataset)
    logger.info("Calculating juz numbers...")
    df['juz'] = df.apply(lambda row: get_juz_number(row['surah_number'], row['verse_number']), axis=1)
    
    # Step 5: Create Indonesian surah name (use Latin transliteration as Indonesian uses the same)
    logger.info("Creating Indonesian surah names...")
    df['surah_name_indonesian'] = df['surah_name_latin']
    
    # Step 6: Apply text normalization to translation columns
    logger.info("Normalizing text...")
    for col in ['verse_arabic', 'verse_indonesian', 'verse_english']:
        df[col] = df[col].apply(normalize_text)
    
    # Step 7: Create full_context field
    logger.info("Creating full_context field...")
    df['full_context'] = df.apply(create_full_context, axis=1)
    
    # Step 8: Generate unique IDs
    logger.info("Generating verse IDs...")
    df['id'] = df.apply(generate_verse_id, axis=1)
    
    # Step 9: Create reference strings
    logger.info("Creating reference strings...")
    df['reference'] = df.apply(create_reference, axis=1)
    
    # Step 10: Ensure correct data types
    df['surah_number'] = df['surah_number'].astype(int)
    df['verse_number'] = df['verse_number'].astype(int)
    df['juz'] = df['juz'].astype(int)
    
    # Step 11: Select and order final columns
    final_columns = [
        'id',
        'surah_number',
        'verse_number',
        'surah_name_arabic',
        'surah_name_latin',
        'surah_name_en',
        'surah_name_indonesian',
        'juz',
        'verse_arabic',
        'verse_indonesian',
        'verse_english',
        'full_context',
        'reference'
    ]
    df = df[final_columns]
    
    logger.info(f"Processing complete. Total verses: {len(df)}")
    
    return df


def save_processed_data(df: pd.DataFrame, output_path: Path = None, format: str = 'json'):
    """
    Save processed data to file.
    
    Args:
        df: Processed DataFrame
        output_path: Output file path (default: config default)
        format: Output format ('json' or 'parquet')
    """
    if output_path is None:
        output_path = paths.PROCESSED_DATA_FILE
    
    logger.info(f"Saving processed data to {output_path}...")
    
    if format == 'json':
        # Convert to records format
        records = df.to_dict(orient='records')
        
        # Save as JSON
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Saved {len(records)} verses to {output_path}")
    elif format == 'parquet':
        # Save as parquet
        df.to_parquet(output_path.with_suffix('.parquet'), index=False)
        logger.info(f"Saved {len(df)} verses to {output_path.with_suffix('.parquet')}")
    else:
        raise ValueError(f"Unsupported format: {format}")


def main():
    """Main entry point for data processing."""
    # Process data
    df = process_quran_data()
    
    # Save to JSON
    save_processed_data(df, format='json')
    
    # Save to Parquet as well
    save_processed_data(df, format='parquet')
    
    # Display sample
    print("\n" + "="*80)
    print("DATA PROCESSING COMPLETE")
    print("="*80)
    print(f"\nTotal verses: {len(df)}")
    print(f"\nColumns: {list(df.columns)}")
    print(f"\nSample verse:")
    print(df.iloc[0].to_string())
    print("="*80)


if __name__ == "__main__":
    main()
