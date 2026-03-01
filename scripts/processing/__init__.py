"""
Modular Data Processing Package for Quran RAG System

This package provides a modular pipeline for processing Quran data:
- loader: Load data from CSV or parquet files
- validator: Validate data completeness and integrity
- enricher: Add derived fields (juz, revelation place, themes)
- merger: Merge Indonesian translations from legacy data
- normalizer: Normalize text fields
- exporter: Export processed data to JSON or parquet
"""

from .loader import load_csv_dataset, load_parquet_files
from .validator import validate_data, validate_required_columns
from .enricher import enrich_verse_data, add_derived_fields
from .merger import merge_translations
from .normalizer import normalize_verse_texts
from .exporter import export_processed_data

__all__ = [
    'load_csv_dataset',
    'load_parquet_files',
    'validate_data',
    'validate_required_columns',
    'enrich_verse_data',
    'add_derived_fields',
    'merge_translations',
    'normalize_verse_texts',
    'export_processed_data',
]
