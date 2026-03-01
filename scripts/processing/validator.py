"""
Data validation module for Quran RAG system.

Provides functions to validate data completeness and integrity.
"""

import pandas as pd
from loguru import logger

try:
    from ..config import dataset_config
except ImportError:
    from config import dataset_config


def validate_required_columns(df: pd.DataFrame, required_columns: list = None) -> bool:
    """
    Validate that all required columns are present.
    
    Args:
        df: DataFrame to validate
        required_columns: List of required column names. Defaults to dataset_config.REQUIRED_COLUMNS.
        
    Returns:
        True if all required columns present, False otherwise
    """
    if required_columns is None:
        required_columns = dataset_config.REQUIRED_COLUMNS
    
    missing = set(required_columns) - set(df.columns)
    
    if missing:
        logger.error(f"Missing required columns: {missing}")
        return False
    
    logger.info(f"All {len(required_columns)} required columns present")
    return True


def validate_data(df: pd.DataFrame, strict: bool = True) -> dict:
    """
    Validate data completeness and integrity.
    
    Args:
        df: DataFrame to validate
        strict: If True, raise errors on critical issues. If False, log warnings.
        
    Returns:
        Dictionary with validation results
    """
    results = {
        'valid': True,
        'errors': [],
        'warnings': [],
        'stats': {}
    }
    
    # Check required columns
    required_columns = dataset_config.REQUIRED_COLUMNS
    missing_cols = set(required_columns) - set(df.columns)
    if missing_cols:
        error_msg = f"Missing required columns: {missing_cols}"
        results['errors'].append(error_msg)
        results['valid'] = False
        if strict:
            raise ValueError(error_msg)
    
    # Check for empty values in critical columns
    critical_columns = ['verse_key', 'arabic_text', 'english_translation']
    for col in critical_columns:
        if col in df.columns:
            empty_count = df[col].isna().sum() + (df[col] == '').sum()
            if empty_count > 0:
                msg = f"Column '{col}' has {empty_count} empty values"
                if strict and col in ['verse_key', 'arabic_text']:
                    results['errors'].append(msg)
                    results['valid'] = False
                    raise ValueError(msg)
                else:
                    results['warnings'].append(msg)
    
    # Check verse count
    expected_verses = dataset_config.TOTAL_VERSES
    actual_verses = len(df)
    if actual_verses != expected_verses:
        msg = f"Expected {expected_verses} verses, found {actual_verses}"
        results['warnings'].append(msg)
        logger.warning(msg)
    
    # Check for duplicate verse_keys
    if 'verse_key' in df.columns:
        duplicates = df[df.duplicated(subset=['verse_key'], keep=False)]
        if len(duplicates) > 0:
            msg = f"Found {len(duplicates)} duplicate verse_keys"
            results['warnings'].append(msg)
            logger.warning(msg)
    
    # Check surah count
    if 'chapter_id' in df.columns:
        unique_surahs = df['chapter_id'].nunique()
        if unique_surahs != dataset_config.SURAH_COUNT:
            msg = f"Expected {dataset_config.SURAH_COUNT} surahs, found {unique_surahs}"
            results['warnings'].append(msg)
            logger.warning(msg)
    
    # Stats
    results['stats'] = {
        'total_verses': len(df),
        'unique_surahs': df['chapter_id'].nunique() if 'chapter_id' in df.columns else 0,
        'empty_arabic': df['arabic_text'].isna().sum() if 'arabic_text' in df.columns else 0,
        'empty_translation': df['english_translation'].isna().sum() if 'english_translation' in df.columns else 0,
    }
    
    # Log summary
    if results['valid']:
        logger.info(f"Validation passed: {results['stats']['total_verses']} verses, {results['stats']['unique_surahs']} surahs")
    else:
        logger.error(f"Validation failed: {len(results['errors'])} errors, {len(results['warnings'])} warnings")
    
    return results


def validate_verse_keys(df: pd.DataFrame) -> bool:
    """
    Validate verse_key format (chapter:verse).
    
    Args:
        df: DataFrame with verse_key column
        
    Returns:
        True if all verse_keys are valid, False otherwise
    """
    if 'verse_key' not in df.columns:
        logger.warning("verse_key column not found")
        return False
    
    import re
    pattern = r'^\d+:\d+$'
    
    invalid = df[~df['verse_key'].astype(str).str.match(pattern, na=False)]
    
    if len(invalid) > 0:
        logger.error(f"Found {len(invalid)} invalid verse_key formats")
        return False
    
    logger.info("All verse_key formats are valid")
    return True
