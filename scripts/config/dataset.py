"""
Dataset configuration for Quran RAG data preparation pipeline.

Defines dataset-specific settings including column mappings, required fields,
and data enrichment configurations.

UPDATED: Now uses parquet dataset as primary source for authentic Arabic text
(arabic-text-uthmani) and Indonesian translations, with CSV enrichment data
(tafsir, themes) merged in.
"""

import os
from dataclasses import dataclass, field
from typing import List


@dataclass
class DatasetConfig:
    """Dataset-specific configuration."""
    
    # Dataset metadata - UPDATED to use parquet as primary source
    DATASET_NAME: str = "quran-uthmani-indonesian"
    DATASET_FORMAT: str = "parquet"  # Changed from "csv"
    
    # Expected total verses
    TOTAL_VERSES: int = 6236
    SURAH_COUNT: int = 114
    
    # Primary data source: Parquet dataset columns
    PARQUET_ARABIC_COLUMNS: List[str] = field(default_factory=lambda: [
        'arabic-text-uthmani',      # Primary: Uthmani script with diacritics
        'arabic-text-simple',       # Fallback: Standard Arabic
    ])
    PARQUET_INDONESIAN_COLUMN: str = 'translation-id-indonesian'
    PARQUET_ENGLISH_COLUMN: str = 'translation-en-sahih'
    
    # Source CSV columns (for enrichment data only - tafsir, themes)
    CSV_ENRICHMENT_COLUMNS: List[str] = field(default_factory=lambda: [
        'chapter_id',
        'verse_number',
        'verse_key',
        'tafsir',
        'main_themes',
        'practical_application',
        'english_translation',  # Use CSV English as fallback
    ])
    
    # Required columns after merge (must be present in final dataset)
    REQUIRED_COLUMNS: List[str] = field(default_factory=lambda: [
        'verse_key',
        'chapter_id',
        'verse_number',
        'arabic_text',              # From parquet arabic-text-uthmani
        'indonesian_translation',   # From parquet translation-id-indonesian
        'english_translation',      # From CSV or parquet fallback
        'tafsir_text',              # From CSV
        'main_themes',              # From CSV
    ])
    
    # Column type mappings for validation
    COLUMN_TYPES: dict = field(default_factory=lambda: {
        'chapter_id': 'int64',
        'verse_number': 'int64',
        'verse_key': 'string',
        'chapter_name': 'string',
        'arabic_text': 'string',
        'indonesian_translation': 'string',
        'english_translation': 'string',
        'tafsir_text': 'string',
        'main_themes': 'string',
        'practical_application': 'string',
        'translation_length': 'int64',
    })
    
    # Fields to include in embedding text - UPDATED to use Indonesian
    EMBEDDING_SOURCE_FIELDS: List[str] = field(default_factory=lambda: [
        'arabic_text',              # From parquet arabic-text-uthmani
        'indonesian_translation',   # From parquet translation-id-indonesian
        'main_themes',              # From CSV
    ])
    
    # Include tafsir in embedding (richer context, slower)
    INCLUDE_TAFSIR_IN_EMBEDDING: bool = False
    TAFSIR_MAX_LENGTH: int = 500  # Truncate tafsir for embedding if enabled
    
    # Text separator for embedding
    EMBEDDING_SEPARATOR: str = " | "
    
    # Theme parsing
    THEME_SEPARATOR: str = ","  # How themes are separated in CSV
    THEME_STRIP_CHARS: str = "[]'\""  # Characters to strip from theme strings
    
    # Column name mappings for merged dataset
    MERGED_COLUMN_MAPPINGS: dict = field(default_factory=lambda: {
        'surah': 'chapter_id',
        'ayah': 'verse_number',
        'arabic-text-uthmani': 'arabic_text',
        'translation-id-indonesian': 'indonesian_translation',
        'translation-en-sahih': 'english_translation',
        'surah-name-en': 'chapter_name',
    })
    
    # Verse key format for merging
    VERSE_KEY_FORMAT: str = "{chapter_id}:{verse_number}"


# Global dataset config instance
dataset_config = DatasetConfig()
