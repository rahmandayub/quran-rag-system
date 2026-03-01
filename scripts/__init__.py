"""
Scripts package for Quran RAG data preparation.
"""

from .config import (
    paths,
    data_config,
    embedding_config,
    qdrant_config,
    processing_config,
)
from .utils import (
    normalize_text,
    normalize_arabic,
    clean_whitespace,
    remove_special_characters,
    validate_utf8,
)

__all__ = [
    'paths',
    'data_config',
    'embedding_config',
    'qdrant_config',
    'processing_config',
    'normalize_text',
    'normalize_arabic',
    'clean_whitespace',
    'remove_special_characters',
    'validate_utf8',
]
