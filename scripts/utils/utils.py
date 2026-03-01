"""
Text normalization utilities for Quran RAG data preparation pipeline.

This module provides text normalization functions including Arabic text processing.
"""

import re
import unicodedata


def normalize_text(text: str) -> str:
    """
    Normalize text for consistent processing.
    
    Args:
        text: Input text
        
    Returns:
        Normalized text
    """
    if not isinstance(text, str):
        if text is None:
            return ""
        return str(text)
    
    # Remove non-UTF8 characters
    text = text.encode('utf-8', errors='ignore').decode('utf-8')
    
    # Normalize Unicode characters
    text = unicodedata.normalize('NFC', text)
    
    # Normalize Arabic text
    text = normalize_arabic(text)
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def normalize_arabic(text: str) -> str:
    """
    Normalize Arabic text (remove tatweel, normalize alef forms).
    
    Args:
        text: Arabic text
        
    Returns:
        Normalized Arabic text
    """
    if not text:
        return text
    
    # Remove tatweel (elongation character)
    text = text.replace('ـ', '')
    
    # Normalize alef forms to standard alef
    arabic_alef_forms = {
        'آ': 'ا',  # Alef with madda
        'أ': 'ا',  # Alef with hamza above
        'إ': 'ا',  # Alef with hamza below
        'ٱ': 'ا',  # Alef wasla
    }
    
    for form, standard in arabic_alef_forms.items():
        text = text.replace(form, standard)
    
    # Normalize yeh forms
    text = text.replace('ى', 'ي')  # Alef maksura to yeh
    
    return text


def clean_whitespace(text: str) -> str:
    """
    Clean excessive whitespace from text.
    
    Args:
        text: Input text
        
    Returns:
        Text with normalized whitespace
    """
    if not text:
        return text
    
    # Replace multiple spaces with single space
    text = re.sub(r'\s+', ' ', text)
    
    # Strip leading/trailing whitespace
    return text.strip()


def remove_special_characters(text: str, keep_arabic: bool = True) -> str:
    """
    Remove special characters that don't add semantic value.
    
    Args:
        text: Input text
        keep_arabic: Whether to keep Arabic characters
        
    Returns:
        Cleaned text
    """
    if not text:
        return text
    
    if keep_arabic:
        # Keep Arabic characters, basic punctuation, and common symbols
        pattern = r'[^\w\s\u0600-\u06FF\.,!?-]'
    else:
        pattern = r'[^\w\s\.,!?-]'
    
    return re.sub(pattern, '', text)


def validate_utf8(text: str) -> str:
    """
    Validate and clean UTF-8 encoding.
    
    Args:
        text: Input text
        
    Returns:
        Valid UTF-8 text
    """
    if not text:
        return text
    
    # Encode and decode with error handling
    return text.encode('utf-8', errors='ignore').decode('utf-8')
