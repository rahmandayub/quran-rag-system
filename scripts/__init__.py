"""
Scripts package for Quran RAG data preparation.
"""

from .config import (
    paths,
    dataset_config,
    embedding_config,
    qdrant_config,
    processing_config,
)

# Import from new modular utils package
from .utils import (
    normalize_text,
    get_juz_number,
    get_revelation_place,
)

# Backward compatibility alias
data_config = dataset_config

__all__ = [
    'paths',
    'dataset_config',
    'data_config',  # Backward compatibility
    'embedding_config',
    'qdrant_config',
    'processing_config',
    'normalize_text',
    'get_juz_number',
    'get_revelation_place',
]
