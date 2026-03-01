"""
Path configuration for Quran RAG data preparation pipeline.

Handles all file and directory paths used across the pipeline.
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
    DATASET_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "dataset")
    ZINCALY_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "dataset" / "zincly")
    QURAN_DATA_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "quran" / "data")
    
    # Output directories
    OUTPUT_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output")
    CHECKPOINTS_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output" / "checkpoints")
    LOGS_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output" / "logs")
    
    # Data files - New CSV dataset
    DATASET_CSV_PATH: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "dataset" / "zincly" / "quranpak-explore-114-dataset.csv")
    
    # Data files - Legacy parquet (for Indonesian merge)
    PARQUET_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "quran" / "data")
    
    # Output files
    PROCESSED_DATA_FILE: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output" / "processed_data.json")
    PROCESSED_DATA_PARQUET: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output" / "processed_data.parquet")
    EMBEDDINGS_FILE: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output" / "embeddings.json")
    INDONESIAN_MERGE_FILE: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output" / "indonesian_translations.json")
    
    # Log files
    PIPELINE_LOG: Path = field(default_factory=lambda: Path(__file__).parent.parent.parent / "output" / "logs" / "pipeline.log")
    
    def __post_init__(self):
        """Create directories if they don't exist."""
        self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        self.CHECKPOINTS_DIR.mkdir(parents=True, exist_ok=True)
        self.LOGS_DIR.mkdir(parents=True, exist_ok=True)
        self.DATASET_DIR.mkdir(parents=True, exist_ok=True)
        self.ZINCALY_DIR.mkdir(parents=True, exist_ok=True)


# Global paths instance
paths = Paths()
