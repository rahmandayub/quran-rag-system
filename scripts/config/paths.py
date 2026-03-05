"""
Path configuration for Quran RAG data preparation pipeline.

Handles all file and directory paths used across the pipeline.

UPDATED: Now uses parquet dataset as primary source for authentic Arabic text
and Indonesian translations, with CSV for enrichment data.
"""

import os
from pathlib import Path
from dataclasses import dataclass, field


@dataclass
class Paths:
    """File and directory paths."""
    
    # Base directories
    BASE_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent)
    SCRIPTS_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent)
    
    # Data directories
    DATASET_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "datasets")
    
    # Primary data source: Parquet dataset (authentic Arabic + Indonesian)
    PARQUET_DATA_DIR: Path = field(default_factory=lambda:
        Path(__file__).parent.parent.parent / "datasets" / "quran" / "data")
    
    # Enrichment source: CSV dataset (tafsir, themes)
    CSV_ENRICHMENT_PATH: Path = field(default_factory=lambda:
        Path(__file__).parent.parent.parent / "datasets" / "zincly" / "quranpak-explore-114-dataset.csv")
    
    # Legacy paths (kept for backward compatibility)
    ZINCALY_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "datasets" / "zincly")
    QURAN_DATA_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "datasets" / "quran" / "data")
    DATASET_CSV_PATH: Path = field(default_factory=lambda:
        Path(__file__).parent.parent.parent / "datasets" / "zincly" / "quranpak-explore-114-dataset.csv")
    
    # Output directories
    OUTPUT_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output")
    CHECKPOINTS_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output" / "checkpoints")
    LOGS_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output" / "logs")
    
    # Output files - UPDATED names
    PROCESSED_DATA_FILE: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output" / "processed_verses.json")
    PROCESSED_DATA_PARQUET: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output" / "processed_verses.parquet")
    EMBEDDINGS_FILE: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output" / "embeddings.json")
    
    # Log files
    PIPELINE_LOG: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output" / "logs" / "pipeline.log")
    
    def __post_init__(self):
        """Create directories if they don't exist."""
        self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        self.CHECKPOINTS_DIR.mkdir(parents=True, exist_ok=True)
        self.LOGS_DIR.mkdir(parents=True, exist_ok=True)
        self.DATASET_DIR.mkdir(parents=True, exist_ok=True)
        self.PARQUET_DATA_DIR.mkdir(parents=True, exist_ok=True)


# Global paths instance
paths = Paths()
