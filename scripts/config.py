"""
Configuration constants for Quran RAG data preparation pipeline.

DEPRECATED: This module is kept for backward compatibility.
Use the modular config package (scripts.config) instead:
    from scripts.config import paths, dataset_config, embedding_config, qdrant_config, processing_config
"""

import warnings
from .config.paths import paths
from .config.dataset import dataset_config
from .config.embedding import embedding_config
from .config.qdrant import qdrant_config
from .config.processing import processing_config

# Backward compatibility aliases
Paths = paths.__class__
DataConfig = dataset_config.__class__  # Renamed to DatasetConfig
EmbeddingConfig = embedding_config.__class__
QdrantConfig = qdrant_config.__class__
ProcessingConfig = processing_config.__class__

# Show deprecation warning
warnings.warn(
    "scripts.config (monolith) is deprecated. "
    "Use 'from scripts.config import paths, dataset_config, ...' instead.",
    DeprecationWarning,
    stacklevel=2
)

# Global configuration instances (backward compatible names)
data_config = dataset_config

__all__ = [
    'paths',
    'dataset_config',
    'embedding_config',
    'qdrant_config',
    'processing_config',
    # Backward compatibility
    'Paths',
    'DataConfig',
    'EmbeddingConfig',
    'QdrantConfig',
    'ProcessingConfig',
    'data_config',
]
