"""
Embedding Generator Script for Quran RAG System

This script generates vector embeddings for all Quran verses using
Ollama's embedding model with batch processing, retry logic, and checkpointing.

Updated for new CSV-based dataset with enriched fields.

Usage:
    python -m scripts.embedding_generator
    
Or run directly:
    python scripts/embedding_generator.py
"""

import json
import time
import requests
from pathlib import Path
from typing import List, Optional, Dict
from loguru import logger
from tqdm import tqdm
from datetime import datetime

try:
    from .config import paths, dataset_config, embedding_config
    from .processing import load_csv_dataset
except ImportError:
    from config import paths, dataset_config, embedding_config
    from processing import load_csv_dataset


class OllamaEmbeddingClient:
    """Client for Ollama embeddings API."""
    
    def __init__(self, host: str = None, model: str = None):
        self.host = host or embedding_config.OLLAMA_HOST
        self.model = model or embedding_config.MODEL_NAME
        self.base_url = f"{self.host}{embedding_config.OLLAMA_EMBEDDINGS_ENDPOINT}"
        
        logger.info(f"Initialized Ollama client: {self.base_url}")
        logger.info(f"Using model: {self.model}")
    
    def generate_embedding(self, text: str, max_retries: int = None) -> Optional[List[float]]:
        """
        Generate embedding for a single text.
        
        Args:
            text: Input text to embed
            max_retries: Maximum retry attempts
            
        Returns:
            List of floats (embedding vector) or None if failed
        """
        max_retries = max_retries or embedding_config.MAX_RETRIES
        
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    self.base_url,
                    json={
                        'model': self.model,
                        'prompt': text
                    },
                    timeout=embedding_config.TIMEOUT_SECONDS
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get('embedding')
                else:
                    logger.warning(
                        f"Ollama API returned status {response.status_code}: "
                        f"{response.text}"
                    )
                    
            except requests.exceptions.Timeout:
                logger.warning(f"Request timeout (attempt {attempt + 1}/{max_retries})")
            except requests.exceptions.ConnectionError:
                logger.error(f"Connection error (attempt {attempt + 1}/{max_retries})")
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
            
            if attempt < max_retries - 1:
                delay = embedding_config.RETRY_DELAY_SECONDS * (2 ** attempt)
                logger.info(f"Retrying in {delay} seconds...")
                time.sleep(delay)
        
        logger.error(f"Failed to generate embedding after {max_retries} attempts")
        return None
    
    def generate_embeddings_batch(
        self,
        texts: List[str],
        batch_size: int = None
    ) -> List[Optional[List[float]]]:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of input texts
            batch_size: Unused for single-request API, kept for compatibility
            
        Returns:
            List of embeddings (None for failed)
        """
        embeddings = []
        for text in texts:
            embedding = self.generate_embedding(text)
            embeddings.append(embedding)
        return embeddings
    
    def verify_model(self) -> bool:
        """
        Verify that the embedding model is available.
        
        Returns:
            True if model is available, False otherwise
        """
        try:
            response = requests.get(f"{self.host}/api/tags")
            if response.status_code == 200:
                models = response.json().get('models', [])
                model_names = [m.get('name', '') for m in models]
                return any(self.model in name for name in model_names)
        except Exception as e:
            logger.error(f"Failed to verify model: {e}")
        
        return False


class CheckpointManager:
    """Manage embedding progress checkpoints."""
    
    def __init__(self, checkpoint_dir: Path = None):
        self.checkpoint_dir = checkpoint_dir or paths.CHECKPOINTS_DIR
        self.checkpoint_file = self.checkpoint_dir / "embeddings_checkpoint.jsonl"
    
    def save_checkpoint(
        self,
        verse_key: str,
        embedding: List[float],
        processed_count: int,
        total_count: int
    ):
        """
        Save a single embedding to checkpoint file.
        
        Args:
            verse_key: Verse key (e.g., "1:1")
            embedding: Embedding vector
            processed_count: Number of processed items
            total_count: Total items to process
        """
        checkpoint_data = {
            'verse_key': verse_key,
            'embedding': embedding,
            'timestamp': datetime.now().isoformat(),
            'progress': f"{processed_count}/{total_count}"
        }
        
        with open(self.checkpoint_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(checkpoint_data, ensure_ascii=False) + '\n')
    
    def load_checkpoint(self) -> Dict[str, List[float]]:
        """
        Load existing embeddings from checkpoint.
        
        Handles both old format (verse_id) and new format (verse_key).
        
        Returns:
            Dictionary mapping verse_key to embedding
        """
        if not self.checkpoint_file.exists():
            return {}
        
        embeddings = {}
        with open(self.checkpoint_file, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                # Handle both old and new checkpoint formats
                key = data.get('verse_key') or data.get('verse_id') or data.get('id')
                if key:
                    embeddings[key] = data['embedding']
        
        return embeddings
    
    def get_processed_keys(self) -> set:
        """Get set of already processed verse keys."""
        return set(self.load_checkpoint().keys())
    
    def get_checkpoint_status(self, total_count: int) -> dict:
        """
        Get checkpoint status summary.
        
        Args:
            total_count: Total items to process
            
        Returns:
            Status dictionary
        """
        processed_keys = self.get_processed_keys()
        total_processed = len(processed_keys)
        return {
            'processed': total_processed,
            'remaining': total_count - total_processed,
            'total': total_count,
            'progress_percent': (total_processed / total_count) * 100 if total_count > 0 else 0
        }
    
    def clear_checkpoint(self):
        """Clear checkpoint file (use with caution)."""
        if self.checkpoint_file.exists():
            self.checkpoint_file.unlink()
            logger.info("Checkpoint file cleared")


def prepare_embedding_text(verse: dict) -> str:
    """
    Prepare text for embedding from verse data.
    
    Uses the configured embedding source fields from dataset_config.
    
    Args:
        verse: Verse dictionary with text fields
        
    Returns:
        Combined text string for embedding
    """
    text_parts = []
    
    for field in dataset_config.EMBEDDING_SOURCE_FIELDS:
        if field in verse and verse[field]:
            value = verse[field]
            if isinstance(value, str) and value.strip():
                text_parts.append(value)
    
    # Optionally include tafsir
    if dataset_config.INCLUDE_TAFSIR_IN_EMBEDDING and 'tafsir_text' in verse and verse['tafsir_text']:
        tafsir = verse['tafsir_text'][:dataset_config.TAFSIR_MAX_LENGTH]
        text_parts.append(f"Tafsir: {tafsir}")
    
    return dataset_config.EMBEDDING_SEPARATOR.join(text_parts)


def generate_all_embeddings(
    data: List[dict],
    client: OllamaEmbeddingClient = None,
    checkpoint_manager: CheckpointManager = None
) -> List[dict]:
    """
    Generate embeddings for all verses with checkpointing.
    
    Args:
        data: List of verse dictionaries
        client: Ollama client (optional, will create if None)
        checkpoint_manager: Checkpoint manager (optional, will create if None)
        
    Returns:
        List of verse data with embeddings added
    """
    if client is None:
        client = OllamaEmbeddingClient()
    
    if checkpoint_manager is None:
        checkpoint_manager = CheckpointManager()
    
    # Verify model availability
    if not client.verify_model():
        logger.error(f"Model {embedding_config.MODEL_NAME} not found. Please run: ollama pull {embedding_config.MODEL_NAME}")
        raise RuntimeError("Ollama model not available")
    
    total_verses = len(data)
    
    # Load existing checkpoints
    processed_keys = checkpoint_manager.get_processed_keys()
    logger.info(f"Resuming from checkpoint: {len(processed_keys)} embeddings already exist")
    
    # Get checkpoint status
    status = checkpoint_manager.get_checkpoint_status(total_verses)
    logger.info(
        f"Progress: {status['processed']}/{status['total']} "
        f"({status['progress_percent']:.1f}%), "
        f"{status['remaining']} remaining"
    )
    
    # Filter out already processed verses
    remaining_data = [v for v in data if v.get('verse_key') not in processed_keys]
    logger.info(f"Remaining verses to process: {len(remaining_data)}")
    
    # Process remaining verses
    with tqdm(total=total_verses, initial=len(processed_keys), desc="Generating embeddings") as pbar:
        for verse in remaining_data:
            # Prepare embedding text
            embedding_text = prepare_embedding_text(verse)
            
            if not embedding_text.strip():
                logger.warning(f"No text for embedding in verse {verse.get('verse_key')}")
                pbar.update(1)
                continue
            
            # Generate embedding
            embedding = client.generate_embedding(embedding_text)
            
            if embedding is not None:
                # Save checkpoint
                checkpoint_manager.save_checkpoint(
                    verse_key=verse.get('verse_key'),
                    embedding=embedding,
                    processed_count=len(processed_keys) + (total_verses - len(remaining_data)),
                    total_count=total_verses
                )
            else:
                logger.warning(f"Failed to generate embedding for verse {verse.get('verse_key')}")
            
            pbar.update(1)
    
    # Load all embeddings (including previously processed)
    all_embeddings = checkpoint_manager.load_checkpoint()
    
    # Combine verse data with embeddings
    results = []
    for verse in data:
        verse_key = verse.get('verse_key')
        if verse_key in all_embeddings:
            verse_with_embedding = verse.copy()
            verse_with_embedding['embedding'] = all_embeddings[verse_key]
            results.append(verse_with_embedding)
        else:
            logger.warning(f"No embedding found for verse {verse_key}")
    
    logger.info(f"Embedding generation complete. Total: {len(results)}/{total_verses}")
    
    return results


def save_embeddings(data: List[dict], output_path: Path = None):
    """
    Save embeddings to JSON file.
    
    Args:
        data: List of verse dictionaries with embeddings
        output_path: Output file path
    """
    if output_path is None:
        output_path = paths.OUTPUT_DIR / "embeddings.json"
    
    logger.info(f"Saving embeddings to {output_path}...")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Saved {len(data)} embeddings to {output_path}")


def normalize_verse_schema(verse: dict) -> dict:
    """
    Normalize verse schema from old format to new format.
    
    Old format keys:
    - id, surah_number, verse_number, verse_arabic, verse_indonesian, verse_english
    
    New format keys:
    - verse_key, chapter_id, verse_number, arabic_text, indonesian_translation, english_translation
    """
    result = verse.copy()
    
    # Handle verse_key / id
    if 'verse_key' not in result and 'id' in result:
        result['verse_key'] = result['id']
    
    # Handle chapter_id / surah_number
    if 'chapter_id' not in result and 'surah_number' in result:
        result['chapter_id'] = result['surah_number']
    
    # Handle arabic_text / verse_arabic
    if 'arabic_text' not in result and 'verse_arabic' in result:
        result['arabic_text'] = result['verse_arabic']
    
    # Handle english_translation / verse_english
    if 'english_translation' not in result and 'verse_english' in result:
        result['english_translation'] = result['verse_english']
    
    # Handle indonesian_translation / verse_indonesian
    if 'indonesian_translation' not in result and 'verse_indonesian' in result:
        result['indonesian_translation'] = result['verse_indonesian']
    
    # Handle main_themes (default to empty if not present)
    if 'main_themes' not in result:
        result['main_themes'] = '[]'
    
    return result


def main():
    """Main entry point for embedding generation."""
    # Load processed data
    processed_file = paths.PROCESSED_DATA_PARQUET if paths.PROCESSED_DATA_PARQUET.exists() else paths.PROCESSED_DATA_FILE
    
    logger.info(f"Loading processed data from {processed_file}...")
    
    if not processed_file.exists():
        logger.error(
            f"Processed data file not found. Please run data_processing.py first."
        )
        raise FileNotFoundError(f"Processed data not found at {processed_file}")
    
    # Load from parquet or JSON
    if str(processed_file).endswith('.parquet'):
        import pandas as pd
        df = pd.read_parquet(processed_file)
        data = df.to_dict(orient='records')
    else:
        with open(processed_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    
    # Normalize schema (handle both old and new formats)
    logger.info("Normalizing verse schema...")
    data = [normalize_verse_schema(v) for v in data]
    
    logger.info(f"Loaded {len(data)} verses")
    
    # Generate embeddings
    results = generate_all_embeddings(data)
    
    # Save embeddings
    save_embeddings(results)
    
    # Display summary
    print("\n" + "="*80)
    print("EMBEDDING GENERATION COMPLETE")
    print("="*80)
    print(f"Total verses: {len(data)}")
    print(f"Embeddings generated: {len(results)}")
    print(f"Output file: {paths.OUTPUT_DIR / 'embeddings.json'}")
    print("="*80)


if __name__ == "__main__":
    main()
