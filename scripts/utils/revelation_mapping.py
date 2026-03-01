"""
Revelation place (Makkah/Madinah) mapping utility for Quran RAG system.

Provides functions to determine whether a surah was revealed in Makkah or Madinah
based on established Islamic scholarship.
"""

from typing import Set


# Madani (Medinan) Surahs - revealed after Hijrah
# Generally longer, focus on laws, social matters, jihad
MADANI_SURAHS: Set[int] = {
    2,   # Al-Baqarah
    3,   # Ali 'Imran
    4,   # An-Nisa
    5,   # Al-Ma'idah
    8,   # Al-Anfal
    9,   # At-Tawbah
    24,  # An-Nur
    33,  # Al-Ahzab
    47,  # Muhammad
    48,  # Al-Fath
    49,  # Al-Hujurat
    57,  # Al-Hadid
    58,  # Al-Mujadila
    59,  # Al-Hashr
    60,  # Al-Mumtahanah
    61,  # As-Saff
    62,  # Al-Jumu'ah
    63,  # Al-Munafiqun
    64,  # At-Taghabun
    65,  # At-Talaq
    66,  # At-Tahrim
    98,  # Al-Bayyinah
    110, # An-Nasr
}


def get_revelation_place(surah_number: int) -> str:
    """
    Determine whether a surah was revealed in Makkah or Madinah.
    
    Args:
        surah_number: Surah number (1-114)
        
    Returns:
        "Makkah" or "Madinah"
        
    Raises:
        ValueError: If surah_number is out of range
    """
    if surah_number < 1 or surah_number > 114:
        raise ValueError(f"Invalid surah number: {surah_number}. Must be 1-114.")
    
    if surah_number in MADANI_SURAHS:
        return "Madinah"
    return "Makkah"


def is_makki(surah_number: int) -> bool:
    """Check if a surah is Makki (revealed in Makkah)."""
    return get_revelation_place(surah_number) == "Makkah"


def is_madani(surah_number: int) -> bool:
    """Check if a surah is Madani (revealed in Madinah)."""
    return get_revelation_place(surah_number) == "Madinah"


def add_revelation_place_to_dataframe(df, chapter_column: str = "chapter_id"):
    """
    Add revelation_place column to a pandas DataFrame.
    
    Args:
        df: pandas DataFrame with chapter_id column
        chapter_column: Name of the column containing chapter IDs
        
    Returns:
        DataFrame with added 'revelation_place' column
    """
    df = df.copy()
    df['revelation_place'] = df[chapter_column].apply(get_revelation_place)
    return df
