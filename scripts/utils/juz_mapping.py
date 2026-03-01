"""
Juz (Para) mapping utility for Quran RAG system.

Provides functions to determine the juz number for any given verse
based on standard Hafs Quran divisions.
"""

from dataclasses import dataclass
from typing import Tuple


@dataclass
class JuzBoundary:
    """Represents the starting verse of a juz."""
    juz_number: int
    surah_number: int
    verse_number: int
    surah_name: str


# Standard Juz boundaries (Hafs narration)
# Format: (juz_number, surah_number, verse_number, surah_name_optional)
JUZ_BOUNDARIES: list[Tuple[int, int, int]] = [
    (1, 1, 1),      # Juz 1: Al-Fatihah 1
    (2, 2, 142),    # Juz 2: Al-Baqarah 142
    (3, 2, 253),    # Juz 3: Al-Baqarah 253
    (4, 3, 93),     # Juz 4: Ali 'Imran 93
    (5, 4, 24),     # Juz 5: An-Nisa 24
    (6, 4, 148),    # Juz 6: An-Nisa 148
    (7, 5, 82),     # Juz 7: Al-Ma'idah 82
    (8, 6, 111),    # Juz 8: Al-An'am 111
    (9, 7, 88),     # Juz 9: Al-A'raf 88
    (10, 8, 41),    # Juz 10: Al-Anfal 41
    (11, 9, 93),    # Juz 11: At-Tawbah 93
    (12, 11, 6),    # Juz 12: Hud 6
    (13, 12, 53),   # Juz 13: Yusuf 53
    (14, 13, 19),   # Juz 14: Ar-Ra'd 19
    (15, 15, 1),    # Juz 15: Al-Hijr 1
    (16, 16, 129),  # Juz 16: An-Nahl 129
    (17, 17, 1),    # Juz 17: Al-Isra 1
    (18, 18, 75),   # Juz 18: Al-Kahf 75
    (19, 21, 1),    # Juz 19: Al-Anbiya 1
    (20, 22, 79),   # Juz 20: Al-Hajj 79
    (21, 25, 21),   # Juz 21: Al-Furqan 21
    (22, 27, 56),   # Juz 22: An-Naml 56
    (23, 29, 45),   # Juz 23: Al-'Ankabut 45
    (24, 33, 31),   # Juz 24: Al-Ahzab 31
    (25, 36, 28),   # Juz 25: Ya-Sin 28
    (26, 39, 32),   # Juz 26: Az-Zumar 32
    (27, 41, 47),   # Juz 27: Fussilat 47
    (28, 48, 1),    # Juz 28: Al-Fath 1
    (29, 51, 31),   # Juz 29: Adh-Dhariyat 31
    (30, 67, 1),    # Juz 30: Al-Mulk 1
]


def get_juz_number(surah: int, verse: int) -> int:
    """
    Calculate juz number based on surah and verse number.
    
    Uses standard Hafs Quran juz boundaries.
    
    Args:
        surah: Surah number (1-114)
        verse: Verse number within surah
        
    Returns:
        Juz number (1-30)
        
    Raises:
        ValueError: If surah or verse is out of valid range
    """
    if surah < 1 or surah > 114:
        raise ValueError(f"Invalid surah number: {surah}. Must be 1-114.")
    if verse < 1:
        raise ValueError(f"Invalid verse number: {verse}. Must be >= 1.")
    
    # Find the juz by checking boundaries
    juz = 1
    for i, (juz_num, boundary_surah, boundary_verse) in enumerate(JUZ_BOUNDARIES):
        # Check if current verse is at or after this boundary
        if surah > boundary_surah or (surah == boundary_surah and verse >= boundary_verse):
            juz = juz_num
        # If we've passed the current surah, stop checking
        elif boundary_surah > surah:
            break
            
    return juz


def get_juz_boundaries(juz_number: int) -> Tuple[int, int]:
    """
    Get the starting surah and verse for a given juz.
    
    Args:
        juz_number: Juz number (1-30)
        
    Returns:
        Tuple of (surah_number, verse_number)
        
    Raises:
        ValueError: If juz_number is out of range
    """
    if juz_number < 1 or juz_number > 30:
        raise ValueError(f"Invalid juz number: {juz_number}. Must be 1-30.")
    
    for juz, surah, verse in JUZ_BOUNDARIES:
        if juz == juz_number:
            return (surah, verse)
    
    # Should never reach here
    raise ValueError(f"Juz {juz_number} not found in boundaries.")


def get_verse_key(surah: int, verse: int) -> str:
    """
    Create a standardized verse key string.
    
    Args:
        surah: Surah number (1-114)
        verse: Verse number within surah
        
    Returns:
        Verse key in format "surah:verse" (e.g., "2:255")
    """
    return f"{surah}:{verse}"


def parse_verse_key(verse_key: str) -> Tuple[int, int]:
    """
    Parse a verse key string into surah and verse numbers.
    
    Args:
        verse_key: Verse key in format "surah:verse" (e.g., "2:255")
        
    Returns:
        Tuple of (surah_number, verse_number)
        
    Raises:
        ValueError: If verse_key format is invalid
    """
    try:
        parts = verse_key.split(":")
        if len(parts) != 2:
            raise ValueError(f"Invalid verse key format: {verse_key}")
        surah = int(parts[0])
        verse = int(parts[1])
        return (surah, verse)
    except (ValueError, IndexError) as e:
        raise ValueError(f"Invalid verse key: {verse_key}. Expected format 'surah:verse'") from e


def get_juz_for_verse_key(verse_key: str) -> int:
    """
    Get juz number for a verse key string.
    
    Args:
        verse_key: Verse key in format "surah:verse" (e.g., "2:255")
        
    Returns:
        Juz number (1-30)
    """
    surah, verse = parse_verse_key(verse_key)
    return get_juz_number(surah, verse)


# Convenience function for batch processing
def add_juz_to_dataframe(df):
    """
    Add juz column to a pandas DataFrame with surah and verse columns.
    
    Args:
        df: pandas DataFrame with 'chapter_id' and 'verse_number' columns
        
    Returns:
        DataFrame with added 'juz' column
    """
    df = df.copy()
    df['juz'] = df.apply(
        lambda row: get_juz_number(row['chapter_id'], row['verse_number']),
        axis=1
    )
    return df
