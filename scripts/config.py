"""
Configuration constants for Quran RAG data preparation pipeline.
"""

import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import List


@dataclass
class Paths:
    """File and directory paths."""
    BASE_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent)
    QURAN_DATA_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent / "quran" / "data")
    OUTPUT_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent / "output")
    CHECKPOINTS_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent / "output" / "checkpoints")
    LOGS_DIR: Path = field(default_factory=lambda: Path(__file__).parent.parent / "output" / "logs")
    PROCESSED_DATA_FILE: Path = field(default_factory=lambda: Path(__file__).parent.parent / "output" / "processed_data.json")
    EMBEDDINGS_FILE: Path = field(default_factory=lambda: Path(__file__).parent.parent / "output" / "embeddings.json")

    def __post_init__(self):
        """Create directories if they don't exist."""
        self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        self.CHECKPOINTS_DIR.mkdir(parents=True, exist_ok=True)
        self.LOGS_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class DataConfig:
    """Data processing configuration."""
    TOTAL_VERSES: int = 6236
    TOTAL_PARQUET_FILES: int = 172
    SURAH_COUNT: int = 114
    REQUIRED_COLUMNS: List[str] = field(default_factory=lambda: [
        'verse_arabic',
        'verse_indonesian',
        'verse_english',
        'surah_number',
        'verse_number',
        'surah_name_arabic',
        'surah_name_latin',
        'surah_name_en',
        'surah_name_indonesian',
        'juz'
    ])


@dataclass
class EmbeddingConfig:
    """Embedding generation configuration."""
    MODEL_NAME: str = os.getenv("OLLAMA_EMBEDDING_MODEL", "qwen3-embedding:0.6b")
    DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "1024"))
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_EMBEDDINGS_ENDPOINT: str = "/api/embeddings"
    BATCH_SIZE: int = 50
    MAX_RETRIES: int = 3
    TIMEOUT_SECONDS: int = 30
    RETRY_DELAY_SECONDS: int = 2


@dataclass
class QdrantConfig:
    """Qdrant database configuration."""
    HOST: str = os.getenv("QDRANT_HOST", "localhost")
    PORT: int = int(os.getenv("QDRANT_PORT", "6335"))
    GRPC_PORT: int = int(os.getenv("QDRANT_GRPC_PORT", "6336"))
    COLLECTION_NAME: str = os.getenv("QDRANT_COLLECTION_NAME", "quran_verses")
    HADITH_COLLECTION_NAME: str = os.getenv("QDRANT_HADITH_COLLECTION_NAME", "hadith_collection")
    DISTANCE: str = os.getenv("DISTANCE_METRIC", "Cosine")
    VECTOR_SIZE: int = int(os.getenv("EMBEDDING_DIMENSION", "1024"))

    # HNSW configuration
    HNSW_M: int = 16
    HNSW_EF_CONSTRUCT: int = 100

    # Optimizer configuration
    MEMMAP_THRESHOLD: int = 10000
    DEFAULT_SEGMENT_NUMBER: int = 2

    # Indexing
    PAYLOAD_INDEX_FIELDS: List[str] = field(default_factory=lambda: ['surah_number', 'juz', 'surah_name_arabic', 'surah_name_latin', 'surah_name_en', 'surah_name_id'])


@dataclass
class ProcessingConfig:
    """General processing configuration."""
    ENABLE_PROGRESS_BAR: bool = True
    LOG_LEVEL: str = "INFO"
    CHECKPOINT_INTERVAL: int = 100  # Save checkpoint every N verses


# Global configuration instances
paths = Paths()
data_config = DataConfig()
embedding_config = EmbeddingConfig()
qdrant_config = QdrantConfig()
processing_config = ProcessingConfig()
