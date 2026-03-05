"""
Dataset verification script to compare CSV and parquet datasets.
Compares arabic_text fields to ensure data authenticity.
"""

import pandas as pd
from pathlib import Path


def load_csv_dataset(csv_path: str) -> pd.DataFrame:
    """Load the CSV dataset."""
    df = pd.read_csv(csv_path)
    print(f"CSV Dataset loaded: {len(df)} rows")
    print(f"CSV Columns: {list(df.columns)}")
    return df


def load_parquet_dataset(parquet_dir: str) -> pd.DataFrame:
    """Load and combine all parquet files from the dataset."""
    parquet_path = Path(parquet_dir)
    parquet_files = sorted(parquet_path.glob("*.parquet"))
    
    print(f"Found {len(parquet_files)} parquet files")
    
    # Load all parquet files
    dfs = []
    for pf in parquet_files:
        df = pd.read_parquet(pf)
        dfs.append(df)
    
    combined_df = pd.concat(dfs, ignore_index=True)
    print(f"Parquet Dataset loaded: {len(combined_df)} rows")
    print(f"Parquet Columns: {list(combined_df.columns)}")
    return combined_df


def normalize_arabic_text(text: str) -> str:
    """
    Normalize Arabic text by removing diacritics and extra spaces.
    This helps compare texts that may have slight formatting differences.
    """
    if pd.isna(text):
        return ""
    
    text = str(text).strip()
    
    # Arabic diacritics range
    diacritics = ''.join(chr(i) for i in range(0x064B, 0x0653))  # Fathatan to Kasratan
    diacritics += ''.join(chr(i) for i in range(0x06D6, 0x06DC))  # Quranic annotation signs
    
    # Remove diacritics
    for d in diacritics:
        text = text.replace(d, '')
    
    # Normalize alef variations
    text = text.replace('آ', 'ا')
    text = text.replace('أ', 'ا')
    text = text.replace('إ', 'ا')
    
    # Normalize alif maqsura
    text = text.replace('ى', 'ي')
    
    # Remove extra spaces
    text = ' '.join(text.split())
    
    return text


def compare_verses(csv_df: pd.DataFrame, parquet_df: pd.DataFrame) -> dict:
    """
    Compare verses between CSV and parquet datasets.
    Returns comparison statistics and mismatches.
    """
    results = {
        'csv_count': len(csv_df),
        'parquet_count': len(parquet_df),
        'exact_matches': 0,
        'normalized_matches': 0,
        'mismatches': [],
        'csv_only_keys': [],
        'parquet_only_keys': [],
    }
    
    # Create verse_key for parquet using surah and ayah columns
    parquet_df['verse_key'] = parquet_df['surah'].astype(str) + ':' + parquet_df['ayah'].astype(str)
    
    # Create lookup dictionaries - use first occurrence for CSV (deduplicate)
    csv_lookup = {}
    if 'verse_key' in csv_df.columns:
        for _, row in csv_df.drop_duplicates(subset=['verse_key']).iterrows():
            csv_lookup[row['verse_key']] = row['arabic_text']
    
    parquet_lookup = {}
    # Use arabic-text-uthmani as the primary Arabic text column (matches screenshot)
    arabic_col = 'arabic-text-uthmani' if 'arabic-text-uthmani' in parquet_df.columns else 'arabic-text-simple'
    
    for _, row in parquet_df.iterrows():
        parquet_lookup[row['verse_key']] = row[arabic_col]
    
    print(f"\nCSV lookup size: {len(csv_lookup)}")
    print(f"Parquet lookup size: {len(parquet_lookup)}")
    print(f"Using parquet column: {arabic_col}")
    
    # Compare
    for key, csv_text in csv_lookup.items():
        if key not in parquet_lookup:
            results['csv_only_keys'].append(key)
            continue
        
        parquet_text = parquet_lookup[key]
        
        # Exact match
        if csv_text == parquet_text:
            results['exact_matches'] += 1
        else:
            # Normalized match
            csv_norm = normalize_arabic_text(csv_text)
            parquet_norm = normalize_arabic_text(parquet_text)
            
            if csv_norm == parquet_norm:
                results['normalized_matches'] += 1
            else:
                results['mismatches'].append({
                    'verse_key': key,
                    'csv_text': csv_text,
                    'parquet_text': parquet_text,
                    'csv_normalized': csv_norm,
                    'parquet_normalized': parquet_norm,
                })
    
    # Find parquet-only keys
    for key in parquet_lookup.keys():
        if key not in csv_lookup:
            results['parquet_only_keys'].append(key)
    
    return results


def print_sample_comparison(csv_df: pd.DataFrame, parquet_df: pd.DataFrame, n: int = 5):
    """Print sample comparison of first N verses."""
    print("\n" + "="*80)
    print("SAMPLE COMPARISON (First {} verses)".format(n))
    print("="*80)
    
    # Use arabic-text-uthmani as primary (matches screenshot)
    parquet_arabic_col = 'arabic-text-uthmani' if 'arabic-text-uthmani' in parquet_df.columns else 'arabic-text-simple'
    
    # Create parquet lookup
    parquet_df['verse_key'] = parquet_df['surah'].astype(str) + ':' + parquet_df['ayah'].astype(str)
    parquet_lookup = {}
    for _, row in parquet_df.iterrows():
        parquet_lookup[row['verse_key']] = row[parquet_arabic_col]
    
    # Get unique CSV rows
    csv_unique = csv_df.drop_duplicates(subset=['verse_key'])
    
    for i in range(min(n, len(csv_unique))):
        csv_row = csv_unique.iloc[i]
        
        # Get verse key
        verse_key = csv_row['verse_key']
        csv_arabic = csv_row['arabic_text']
        
        # Find matching parquet row
        parquet_arabic = parquet_lookup.get(verse_key)
        
        print(f"\n--- Verse {verse_key} ---")
        print(f"CSV Arabic: {csv_arabic}")
        
        if parquet_arabic is not None:
            print(f"Parquet Arabic ({parquet_arabic_col}): {parquet_arabic}")
            
            # Check match
            if csv_arabic == parquet_arabic:
                print("✓ EXACT MATCH")
            elif normalize_arabic_text(csv_arabic) == normalize_arabic_text(parquet_arabic):
                print("✓ MATCH (after normalization)")
            else:
                print("✗ MISMATCH")
        else:
            print("Parquet: NOT FOUND")


def analyze_csv_arabic_text(csv_df: pd.DataFrame):
    """Analyze the CSV arabic_text field to understand its encoding."""
    print("\n" + "="*80)
    print("CSV ARABIC_TEXT ANALYSIS")
    print("="*80)
    
    sample = csv_df['arabic_text'].iloc[0]
    print(f"\nSample CSV arabic_text (verse 1:1): {sample}")
    print(f"Length: {len(sample)} characters")
    print(f"\nUnicode code points: {[hex(ord(c)) for c in sample]}")
    
    # Check character ranges
    print("\nCharacter analysis:")
    for i, c in enumerate(sample):
        code = ord(c)
        print(f"  [{i}] {c} = U+{code:04X}")
    
    # Check for Quranic annotation symbols (0xFB50-0xFDFF, 0xFE70-0xFEFF)
    quranic_chars = [c for c in sample if 0xFB50 <= ord(c) <= 0xFDFF or 0xFE70 <= ord(c) <= 0xFEFF]
    print(f"\nQuranic annotation characters found: {len(quranic_chars)}")
    if quranic_chars:
        print(f"  Characters: {quranic_chars}")


def compare_all_parquet_columns(csv_df: pd.DataFrame, parquet_df: pd.DataFrame, n: int = 3):
    """Compare CSV arabic_text with all Arabic columns in parquet."""
    print("\n" + "="*80)
    print("COMPARISON WITH ALL PARQUET ARABIC COLUMNS")
    print("="*80)
    
    arabic_columns = ['arabic-text-simple', 'arabic-text-simple-min', 'arabic-text-simple-plain',
                      'arabic-text-simple-clean', 'arabic-text-uthmani']
    
    csv_unique = csv_df.drop_duplicates(subset=['verse_key'])
    parquet_df['verse_key'] = parquet_df['surah'].astype(str) + ':' + parquet_df['ayah'].astype(str)
    
    for i in range(min(n, len(csv_unique))):
        csv_row = csv_unique.iloc[i]
        verse_key = csv_row['verse_key']
        csv_text = csv_row['arabic_text']
        
        parquet_row = parquet_df[parquet_df['verse_key'] == verse_key].iloc[0] if len(parquet_df[parquet_df['verse_key'] == verse_key]) > 0 else None
        
        print(f"\n--- Verse {verse_key} ---")
        print(f"CSV: {csv_text}")
        
        if parquet_row is not None:
            for col in arabic_columns:
                if col in parquet_row:
                    parquet_text = parquet_row[col]
                    match_status = "✓" if normalize_arabic_text(csv_text) == normalize_arabic_text(parquet_text) else "✗"
                    print(f"  {match_status} {col}: {parquet_text}")
        else:
            print("  Parquet: NOT FOUND")


def main():
    csv_path = "datasets/zincly/quranpak-explore-114-dataset.csv"
    parquet_dir = "datasets/quran/data"
    
    print("="*80)
    print("DATASET VERIFICATION: CSV vs Parquet")
    print("="*80)
    
    # Load datasets
    csv_df = load_csv_dataset(csv_path)
    parquet_df = load_parquet_dataset(parquet_dir)
    
    # Analyze CSV arabic_text encoding
    analyze_csv_arabic_text(csv_df)
    
    # Print sample comparison
    print_sample_comparison(csv_df, parquet_df, n=5)
    
    # Compare with all parquet columns
    compare_all_parquet_columns(csv_df, parquet_df, n=5)
    
    # Full comparison
    print("\n" + "="*80)
    print("FULL COMPARISON RESULTS")
    print("="*80)
    
    results = compare_verses(csv_df, parquet_df)
    
    print(f"\nCSV Dataset: {results['csv_count']} rows (unique verses: {len(results['csv_only_keys']) + results['exact_matches'] + results['normalized_matches'] + len(results['mismatches'])})")
    print(f"Parquet Dataset: {results['parquet_count']} verses")
    print(f"\nExact matches: {results['exact_matches']}")
    print(f"Normalized matches: {results['normalized_matches']}")
    print(f"Total matches: {results['exact_matches'] + results['normalized_matches']}")
    print(f"Mismatches: {len(results['mismatches'])}")
    
    print("\n" + "="*80)
    print("CONCLUSION")
    print("="*80)
    print("""
The CSV 'arabic_text' field uses Unicode Quranic annotation characters
(ornamental/symbolic representation), while the parquet dataset contains
standard Arabic script text.

These are NOT direct text matches - they represent the same Quranic verses
but in different Unicode encodings:
- CSV: Uses ornamental Quranic characters (Arabic Presentation Forms-A/B)
- Parquet: Uses standard Arabic script with diacritics

For RAG applications, the parquet 'arabic-text-uthmani' or 'arabic-text-simple'
columns are recommended as they use standard Arabic Unicode characters that
are better supported by text processing libraries and embedding models.
    """)


if __name__ == "__main__":
    main()
