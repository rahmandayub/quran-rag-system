"""
Text normalization module for Quran RAG system.

Provides functions to normalize Arabic and Latin text fields.
"""

import re
import pandas as pd
from loguru import logger

try:
    from ..utils import normalize_text
except ImportError:
    from utils import normalize_text


def normalize_arabic_text(text: str) -> str:
    """
    Normalize Arabic text by standardizing alef forms and removing tatweel.
    
    Args:
        text: Arabic text string
        
    Returns:
        Normalized Arabic text
    """
    if pd.isna(text) or not text:
        return text
    
    text = str(text)
    
    # Standardize alef forms (أ, إ, آ → ا)
    text = text.replace('أ', 'ا')
    text = text.replace('إ', 'ا')
    text = text.replace('آ', 'ا')
    
    # Remove tatweel (elongation character)
    text = text.replace('ـ', '')
    
    # Normalize hamza positions (optional, more aggressive)
    # text = text.replace('ؤ', 'و')
    # text = text.replace('ئ', 'ي')
    
    return text


def normalize_latin_text(text: str) -> str:
    """
    Normalize Latin text (English/Indonesian) by standardizing whitespace and punctuation.
    
    Args:
        text: Latin text string
        
    Returns:
        Normalized Latin text
    """
    if pd.isna(text) or not text:
        return text
    
    text = str(text)
    
    # Normalize whitespace
    text = ' '.join(text.split())
    
    # Normalize quotes
    text = text.replace('"', '"').replace('"', '"')
    text = text.replace(''', "'").replace(''', "'")
    
    # Normalize dashes
    text = text.replace('—', '-').replace('–', '-')
    
    return text


def normalize_verse_texts(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize all text fields in the DataFrame.
    
    Normalizes:
    - arabic_text: Standardize alef forms, remove tatweel
    - english_translation: Normalize whitespace and quotes
    - indonesian_translation: Normalize whitespace and quotes
    - tafsir_text: Normalize whitespace and quotes
    
    Args:
        df: DataFrame with verse data
        
    Returns:
        DataFrame with normalized text fields
    """
    df = df.copy()
    
    logger.info("Normalizing text fields...")
    
    # Normalize Arabic text
    if 'arabic_text' in df.columns:
        df['arabic_text'] = df['arabic_text'].apply(normalize_arabic_text)
        logger.debug("Normalized arabic_text")
    
    # Normalize English translation
    if 'english_translation' in df.columns:
        df['english_translation'] = df['english_translation'].apply(normalize_latin_text)
        logger.debug("Normalized english_translation")
    
    # Normalize Indonesian translation
    if 'indonesian_translation' in df.columns:
        df['indonesian_translation'] = df['indonesian_translation'].apply(normalize_latin_text)
        logger.debug("Normalized indonesian_translation")
    
    # Normalize tafsir text
    if 'tafsir_text' in df.columns:
        df['tafsir_text'] = df['tafsir_text'].apply(normalize_latin_text)
        logger.debug("Normalized tafsir_text")
    
    logger.info("Text normalization complete")
    return df


def clean_theme_strings(df: pd.DataFrame, theme_column: str = 'main_themes') -> pd.DataFrame:
    """
    Clean theme string formatting (ensure valid JSON).
    
    Args:
        df: DataFrame with theme column
        theme_column: Name of the theme column
        
    Returns:
        DataFrame with cleaned theme strings
    """
    df = df.copy()
    
    if theme_column not in df.columns:
        return df
    
    def clean_theme(theme_str):
        """Clean theme string to ensure valid JSON format."""
        if pd.isna(theme_str) or not theme_str:
            return '[]'
        
        theme_str = str(theme_str).strip()
        
        # If it looks like JSON array, return as-is
        if theme_str.startswith('[') and theme_str.endswith(']'):
            return theme_str
        
        # If it's a comma-separated list, convert to JSON array
        if ',' in theme_str:
            themes = [t.strip().strip("'\"") for t in theme_str.split(',')]
            import json
            return json.dumps(themes)
        
        # Single theme
        import json
        return json.dumps([theme_str.strip().strip("'\"")])
    
    df[theme_column] = df[theme_column].apply(clean_theme)
    
    return df
