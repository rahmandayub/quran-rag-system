"""
Dataset configuration for Quran RAG data preparation pipeline.

Defines dataset-specific settings including column mappings, required fields,
and data enrichment configurations.
"""

import os
from dataclasses import dataclass, field
from typing import List


@dataclass
class DatasetConfig:
    """Dataset-specific configuration."""
    
    # Dataset metadata
    DATASET_NAME: str = "quranpak-explore-114"
    DATASET_FORMAT: str = "csv"
    
    # Expected total verses
    TOTAL_VERSES: int = 6236
    SURAH_COUNT: int = 114
    
    # Source CSV columns (from new dataset)
    SOURCE_COLUMNS: List[str] = field(default_factory=lambda: [
        'chapter_id',
        'verse_number',
        'verse_key',
        'chapter_name',
        'arabic_text',
        'english_translation',
        'tafsir',  # Note: CSV uses 'tafsir' not 'tafsir_text'
        'main_themes',
        'practical_application',
        'audience_group',
        'translation_length',
    ])
    
    # Required columns (must be present)
    REQUIRED_COLUMNS: List[str] = field(default_factory=lambda: [
        'chapter_id',
        'verse_number',
        'verse_key',
        'arabic_text',
        'english_translation',
        'tafsir',  # Note: CSV uses 'tafsir' not 'tafsir_text'
        'main_themes',
    ])
    
    # Column type mappings for validation
    COLUMN_TYPES: dict = field(default_factory=lambda: {
        'chapter_id': 'int64',
        'verse_number': 'int64',
        'verse_key': 'string',
        'chapter_name': 'string',
        'arabic_text': 'string',
        'english_translation': 'string',
        'tafsir_text': 'string',
        'main_themes': 'string',  # JSON array string
        'practical_application': 'string',
        'audience_group': 'string',
        'translation_length': 'int64',
    })
    
    # Target field names (after transformation)
    TARGET_FIELDS: dict = field(default_factory=lambda: {
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
        # Added fields
        'verse_id': 'verse_id',  # Same as verse_key
        'indonesian_translation': 'indonesian_translation',  # From merge
        'juz': 'juz',  # From enrichment
        'revelation_place': 'revelation_place',  # From enrichment
        'tafsir_length': 'tafsir_length',  # Computed
        'primary_theme': 'primary_theme',  # Computed (first theme)
        'theme_count': 'theme_count',  # Computed
    })
    
    # Fields to include in embedding text
    EMBEDDING_SOURCE_FIELDS: List[str] = field(default_factory=lambda: [
        'arabic_text',
        'english_translation',
        'main_themes',
    ])
    
    # Include tafsir in embedding (richer context, slower)
    INCLUDE_TAFSIR_IN_EMBEDDING: bool = False
    TAFSIR_MAX_LENGTH: int = 500  # Truncate tafsir for embedding if enabled
    
    # Text separator for embedding
    EMBEDDING_SEPARATOR: str = " | "
    
    # Theme parsing
    THEME_SEPARATOR: str = ","  # How themes are separated in CSV
    THEME_STRIP_CHARS: str = "[]'\""  # Characters to strip from theme strings
    
    # Legacy parquet columns (for Indonesian merge)
    LEGACY_PARQUET_COLUMNS: dict = field(default_factory=lambda: {
        'surah': 'surah_number',
        'ayah': 'verse_number',
        'translation-id-indonesian': 'verse_indonesian',
        'arabic-text-uthmani': 'verse_arabic',
        'translation-en-sahih': 'verse_english',
    })
    
    # Verse key format for merging
    VERSE_KEY_FORMAT: str = "{chapter_id}:{verse_number}"


# Global dataset config instance
dataset_config = DatasetConfig()
