"""
Embedding configuration for Quran RAG data preparation pipeline.

Handles embedding model settings, API endpoints, and generation parameters.
"""

import os
from dataclasses import dataclass, field


@dataclass
class EmbeddingConfig:
    """Embedding generation configuration."""
    
    # Model settings
    MODEL_NAME: str = os.getenv("OLLAMA_EMBEDDING_MODEL", "qwen3-embedding:0.6b")
    DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "1024"))
    
    # Ollama API settings
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_EMBEDDINGS_ENDPOINT: str = "/api/embeddings"
    
    # Batch processing
    BATCH_SIZE: int = 50
    MAX_RETRIES: int = 3
    TIMEOUT_SECONDS: int = 30
    RETRY_DELAY_SECONDS: int = 2
    
    # Checkpoint settings
    CHECKPOINT_INTERVAL: int = 100  # Save checkpoint every N verses
    
    # Text preprocessing for embedding
    TEXT_NORMALIZATION: bool = True
    ARABIC_NORMALIZATION: bool = True
    
    # Embedding text format
    # Format: "{arabic_text} | {english_translation} | {themes}"
    EMBEDDING_SEPARATOR: str = " | "
    
    # Progress reporting
    SHOW_PROGRESS_BAR: bool = True
    PROGRESS_BAR_INTERVAL: int = 10  # Update progress every N verses


# Global embedding config instance
embedding_config = EmbeddingConfig()
