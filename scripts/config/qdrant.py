"""
Qdrant configuration for Quran RAG data preparation pipeline.

Handles Qdrant database connection, collection settings, and indexing configuration.
"""

import os
from dataclasses import dataclass, field
from typing import List


@dataclass
class QdrantConfig:
    """Qdrant database configuration."""
    
    # Connection settings
    HOST: str = os.getenv("QDRANT_HOST", "localhost")
    PORT: int = int(os.getenv("QDRANT_PORT", "6335"))
    GRPC_PORT: int = int(os.getenv("QDRANT_GRPC_PORT", "6336"))
    
    # Collection names
    COLLECTION_NAME: str = os.getenv("QDRANT_COLLECTION_NAME", "quran_verses_enhanced")
    HADITH_COLLECTION_NAME: str = os.getenv("QDRANT_HADITH_COLLECTION_NAME", "hadith_collection")
    
    # Vector settings
    DISTANCE: str = os.getenv("DISTANCE_METRIC", "Cosine")
    VECTOR_SIZE: int = int(os.getenv("EMBEDDING_DIMENSION", "1024"))
    
    # HNSW configuration (for approximate nearest neighbor search)
    HNSW_M: int = 16
    HNSW_EF_CONSTRUCT: int = 100
    
    # Optimizer configuration
    MEMMAP_THRESHOLD: int = 10000
    DEFAULT_SEGMENT_NUMBER: int = 2
    
    # Payload indexes to create - UPDATED with more fields for filtering
    PAYLOAD_INDEXES: List[dict] = field(default_factory=lambda: [
        {"field": "chapter_id", "type": "integer"},
        {"field": "verse_number", "type": "integer"},
        {"field": "juz", "type": "integer"},
        {"field": "main_themes", "type": "keyword"},
        {"field": "revelation_place", "type": "keyword"},
        {"field": "chapter_name", "type": "keyword"},
    ])
    
    # Batch upsert settings
    BATCH_SIZE: int = 100
    PARALLEL: int = 1
    
    # Wait for indexing to complete
    WAIT_FOR_INDEXING: bool = True
    INDEXING_TIMEOUT: int = 60  # seconds


# Global qdrant config instance
qdrant_config = QdrantConfig()
