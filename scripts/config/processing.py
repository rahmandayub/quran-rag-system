"""
Processing configuration for Quran RAG data preparation pipeline.

Handles general processing settings like logging, progress reporting, and validation.
"""

import os
from dataclasses import dataclass


@dataclass
class ProcessingConfig:
    """General processing configuration."""
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "{time:YYYY-MM-DD HH:mm:ss} | {level} | {module} | {message}"
    LOG_ROTATION: str = "100 MB"
    LOG_RETENTION: str = "7 days"
    
    # Progress reporting
    ENABLE_PROGRESS_BAR: bool = True
    PROGRESS_BAR_FORMAT: str = "{desc}: {percentage:3.0f}% | {bar} | {n_fmt}/{total_fmt} | {elapsed}<{remaining} | {rate_fmt}"
    
    # Checkpoint settings
    CHECKPOINT_INTERVAL: int = 100  # Save checkpoint every N verses
    ENABLE_CHECKPOINTS: bool = True
    
    # Validation
    STRICT_VALIDATION: bool = True
    SKIP_INVALID_VERSES: bool = False
    MAX_VALIDATION_ERRORS: int = 100  # Stop after this many validation errors
    
    # Error handling
    MAX_RETRIES: int = 3
    RETRY_DELAY: float = 1.0  # seconds
    
    # Memory management
    BATCH_SIZE: int = 500  # Process verses in batches of N
    CLEAR_BATCH_INTERVAL: int = 1000  # Clear memory every N verses
    
    # Parallel processing
    USE_PARALLEL: bool = False
    MAX_WORKERS: int = 4


# Global processing config instance
processing_config = ProcessingConfig()
