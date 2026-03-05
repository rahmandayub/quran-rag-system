"""
Modular Data Processing Package for Quran RAG System

UPDATED: Now uses parquet dataset as primary source for authentic Arabic text
(arabic-text-uthmani) and Indonesian translations, with CSV enrichment data
(tafsir, themes) merged in.

This package provides a modular pipeline for processing Quran data:
- loader: Load data from parquet (primary) + CSV enrichment
- validator: Validate data completeness and integrity
- enricher: Add derived fields (juz, revelation place, themes)
- normalizer: Normalize text fields
- exporter: Export processed data to JSON or parquet
"""

from .loader import (
    load_csv_dataset,  # Legacy
    load_parquet_dataset,
    load_csv_enrichment,
    merge_parquet_with_csv_enrichment,
    load_combined_dataset,
)
from .validator import validate_data, validate_required_columns
from .enricher import enrich_verse_data, add_derived_fields
from .merger import merge_indonesian_translations
from .normalizer import normalize_verse_texts
from .exporter import export_processed_data

__all__ = [
    'load_csv_dataset',  # Legacy
    'load_parquet_dataset',
    'load_csv_enrichment',
    'merge_parquet_with_csv_enrichment',
    'load_combined_dataset',
    'validate_data',
    'validate_required_columns',
    'enrich_verse_data',
    'add_derived_fields',
    'merge_indonesian_translations',
    'normalize_verse_texts',
    'export_processed_data',
]
