"""
Modular Configuration Package for Quran RAG Data Preparation Pipeline

This package provides separate configuration modules for different concerns:
- paths: File and directory paths
- dataset: Dataset-specific configuration
- embedding: Embedding generation settings
- qdrant: Qdrant database configuration
- processing: General processing settings
"""

from .paths import Paths, paths
from .dataset import DatasetConfig, dataset_config
from .embedding import EmbeddingConfig, embedding_config
from .qdrant import QdrantConfig, qdrant_config
from .processing import ProcessingConfig, processing_config

__all__ = [
    'Paths',
    'paths',
    'DatasetConfig',
    'dataset_config',
    'EmbeddingConfig',
    'embedding_config',
    'QdrantConfig',
    'qdrant_config',
    'ProcessingConfig',
    'processing_config',
]
