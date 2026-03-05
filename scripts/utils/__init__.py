"""
Utility modules for Quran RAG data preparation pipeline.

Provides reusable utilities for:
- Juz mapping (determining juz number for verses)
- Revelation place mapping (Makkah/Madinah)
- Text normalization
"""

from .juz_mapping import (
    get_juz_number,
    get_juz_boundaries,
    get_verse_key,
    parse_verse_key,
    get_juz_for_verse_key,
    add_juz_to_dataframe,
    JUZ_BOUNDARIES,
)

from .revelation_mapping import (
    get_revelation_place,
    is_makki,
    is_madani,
    add_revelation_place_to_dataframe,
    MADANI_SURAHS,
)

# Import existing utilities from utils.py
try:
    from .utils import normalize_text  # type: ignore
except ImportError:
    # Fallback if utils.py doesn't have normalize_text
    def normalize_text(text: str) -> str:
        """Simple text normalization fallback."""
        if not text:
            return ""
        return " ".join(str(text).split())

__all__ = [
    # Juz mapping
    'get_juz_number',
    'get_juz_boundaries',
    'get_verse_key',
    'parse_verse_key',
    'get_juz_for_verse_key',
    'add_juz_to_dataframe',
    'JUZ_BOUNDARIES',
    # Revelation mapping
    'get_revelation_place',
    'is_makki',
    'is_madani',
    'add_revelation_place_to_dataframe',
    'MADANI_SURAHS',
    # Text utilities
    'normalize_text',
]
