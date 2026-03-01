"""
Embedding Generator Script for Quran RAG System

This script generates vector embeddings for all Quran verses using
Ollama's embeddinggemma model with batch processing, retry logic,
and checkpointing.
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
    from .config import paths, embedding_config
except ImportError:
    from config import paths, embedding_config


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
        verse_id: str,
        embedding: List[float],
        processed_count: int,
        total_count: int
    ):
        """
        Save a single embedding to checkpoint file.
        
        Args:
            verse_id: Unique verse identifier
            embedding: Embedding vector
            processed_count: Number of processed items
            total_count: Total items to process
        """
        checkpoint_data = {
            'verse_id': verse_id,
            'embedding': embedding,
            'timestamp': datetime.now().isoformat(),
            'progress': f"{processed_count}/{total_count}"
        }
        
        with open(self.checkpoint_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(checkpoint_data, ensure_ascii=False) + '\n')
    
    def load_checkpoint(self) -> Dict[str, List[float]]:
        """
        Load existing embeddings from checkpoint.
        
        Returns:
            Dictionary mapping verse_id to embedding
        """
        if not self.checkpoint_file.exists():
            return {}
        
        embeddings = {}
        with open(self.checkpoint_file, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                embeddings[data['verse_id']] = data['embedding']
        
        return embeddings
    
    def get_processed_ids(self) -> set:
        """Get set of already processed verse IDs."""
        return set(self.load_checkpoint().keys())
    
    def get_checkpoint_status(self, total_count: int) -> dict:
        """
        Get checkpoint status summary.
        
        Args:
            total_count: Total items to process
            
        Returns:
            Status dictionary
        """
        processed_ids = self.get_processed_ids()
        total_processed = len(processed_ids)
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
        logger.error(f"Model {embedding_config.MODEL_NAME} not found. Please run: ollama pull embeddinggemma")
        raise RuntimeError("Ollama model not available")
    
    total_verses = len(data)
    
    # Load existing checkpoints
    processed_ids = checkpoint_manager.get_processed_ids()
    logger.info(f"Resuming from checkpoint: {len(processed_ids)} embeddings already exist")
    
    # Get checkpoint status
    status = checkpoint_manager.get_checkpoint_status(total_verses)
    logger.info(
        f"Progress: {status['processed']}/{status['total']} "
        f"({status['progress_percent']:.1f}%), "
        f"{status['remaining']} remaining"
    )
    
    # Filter out already processed verses
    remaining_data = [v for v in data if v['id'] not in processed_ids]
    logger.info(f"Remaining verses to process: {len(remaining_data)}")
    
    # Process remaining verses
    with tqdm(total=total_verses, initial=len(processed_ids), desc="Generating embeddings") as pbar:
        for verse in remaining_data:
            # Generate embedding
            embedding = client.generate_embedding(verse['full_context'])
            
            if embedding is not None:
                # Save checkpoint
                checkpoint_manager.save_checkpoint(
                    verse_id=verse['id'],
                    embedding=embedding,
                    processed_count=len(processed_ids) + (total_verses - len(remaining_data)),
                    total_count=total_verses
                )
            else:
                logger.warning(f"Failed to generate embedding for verse {verse['id']}")
            
            pbar.update(1)
    
    # Load all embeddings (including previously processed)
    all_embeddings = checkpoint_manager.load_checkpoint()
    
    # Combine verse data with embeddings
    results = []
    for verse in data:
        if verse['id'] in all_embeddings:
            verse_with_embedding = verse.copy()
            verse_with_embedding['embedding'] = all_embeddings[verse['id']]
            results.append(verse_with_embedding)
        else:
            logger.warning(f"No embedding found for verse {verse['id']}")
    
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
        output_path = paths.EMBEDDINGS_FILE
    
    logger.info(f"Saving embeddings to {output_path}...")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Saved {len(data)} embeddings to {output_path}")


def main():
    """Main entry point for embedding generation."""
    # Load processed data
    logger.info(f"Loading processed data from {paths.PROCESSED_DATA_FILE}...")
    
    if not paths.PROCESSED_DATA_FILE.exists():
        logger.error(
            f"Processed data file not found. Please run data_processing.py first."
        )
        raise FileNotFoundError(f"Processed data not found at {paths.PROCESSED_DATA_FILE}")
    
    with open(paths.PROCESSED_DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
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
    print(f"Output file: {paths.EMBEDDINGS_FILE}")
    print("="*80)


if __name__ == "__main__":
    main()
