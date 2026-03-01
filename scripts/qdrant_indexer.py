"""
Qdrant Indexer Script for Quran RAG System

This script stores generated embeddings in Qdrant vector database
with proper collection configuration, payload indexes, and batch upsert operations.
"""

import json
from pathlib import Path
from typing import List, Dict, Optional
from loguru import logger
from tqdm import tqdm

from qdrant_client import QdrantClient
from qdrant_client import models

try:
    from .config import paths, qdrant_config
except ImportError:
    from config import paths, qdrant_config


class QdrantIndexer:
    """Client for Qdrant vector database operations."""
    
    def __init__(
        self,
        host: str = None,
        port: int = None,
        collection_name: str = None
    ):
        self.host = host or qdrant_config.HOST
        self.port = port or qdrant_config.PORT
        self.collection_name = collection_name or qdrant_config.COLLECTION_NAME
        
        # Initialize REST client
        self.client = QdrantClient(host=self.host, port=self.port)
        
        logger.info(f"Connected to Qdrant at {self.host}:{self.port}")
    
    def create_collection(self) -> bool:
        """
        Create Qdrant collection with proper configuration.
        
        Returns:
            True if collection created, False if already exists
        """
        # Check if collection exists
        collections = self.client.get_collections().collections
        if any(c.name == self.collection_name for c in collections):
            logger.info(f"Collection '{self.collection_name}' already exists")
            return False
        
        # Create collection
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=models.VectorParams(
                size=qdrant_config.VECTOR_SIZE,
                distance=models.Distance[qdrant_config.DISTANCE.upper()]
            ),
            optimizers_config=models.OptimizersConfigDiff(
                default_segment_number=qdrant_config.DEFAULT_SEGMENT_NUMBER,
                memmap_threshold=qdrant_config.MEMMAP_THRESHOLD,
            ),
            hnsw_config=models.HnswConfigDiff(
                m=qdrant_config.HNSW_M,
                ef_construct=qdrant_config.HNSW_EF_CONSTRUCT,
            )
        )
        
        logger.info(f"Created collection '{self.collection_name}'")
        return True
    
    def create_payload_indexes(self) -> bool:
        """
        Create payload indexes for filtering fields.
        
        Returns:
            True if all indexes created successfully
        """
        success = True
        
        for field_name in qdrant_config.PAYLOAD_INDEX_FIELDS:
            try:
                # Determine field type
                if field_name in ['surah_number', 'verse_number', 'juz']:
                    field_type = models.PayloadSchemaType.INTEGER
                else:
                    field_type = models.PayloadSchemaType.KEYWORD
                
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field_name,
                    field_schema=field_type
                )
                logger.info(f"Created payload index for '{field_name}'")
                
            except Exception as e:
                logger.error(f"Failed to create index for '{field_name}': {e}")
                success = False
        
        return success
    
    def upsert_verses(self, verses: List[dict], batch_size: int = 100) -> int:
        """
        Upsert verses into Qdrant.
        
        Args:
            verses: List of verse dictionaries with embeddings
            batch_size: Number of verses per batch
            
        Returns:
            Number of successfully upserted verses
        """
        total_upserted = 0
        
        for i in range(0, len(verses), batch_size):
            batch = verses[i:i + batch_size]
            points = []
            
            for verse in batch:
                # Create point
                point = models.PointStruct(
                    id=self._generate_point_id(verse),
                    vector=verse['embedding'],
                    payload=self._create_payload(verse)
                )
                points.append(point)
            
            # Upsert batch
            try:
                result = self.client.upsert(
                    collection_name=self.collection_name,
                    points=points
                )
                
                if result.status == models.UpdateStatus.COMPLETED:
                    total_upserted += len(batch)
                    logger.debug(f"Upserted batch {i//batch_size + 1}: {len(batch)} verses")
                else:
                    logger.warning(f"Batch upsert incomplete: {result}")
                    
            except Exception as e:
                logger.error(f"Failed to upsert batch: {e}")
        
        return total_upserted
    
    def _generate_point_id(self, verse: dict) -> int:
        """
        Generate numeric point ID from verse data.
        
        Uses formula: (surah_number - 1) * 1000 + verse_number
        This ensures unique IDs and preserves surah ordering.
        
        Args:
            verse: Verse dictionary
            
        Returns:
            Unique numeric ID
        """
        surah = int(verse['surah_number'])
        verse_num = int(verse['verse_number'])
        return (surah - 1) * 1000 + verse_num
    
    def _create_payload(self, verse: dict) -> dict:
        """
        Create payload dictionary from verse data.
        
        Args:
            verse: Verse dictionary
            
        Returns:
            Payload dictionary
        """
        return {
            'id': verse['id'],
            'surah_number': int(verse['surah_number']),
            'verse_number': int(verse['verse_number']),
            'surah_name_arabic': verse['surah_name_arabic'],
            'surah_name_latin': verse['surah_name_latin'],
            'surah_name_en': verse['surah_name_en'],
            'surah_name_id': verse['surah_name_indonesian'],
            'juz': int(verse['juz']),
            'verse_arabic': verse['verse_arabic'],
            'verse_indonesian': verse['verse_indonesian'],
            'verse_english': verse['verse_english'],
            'reference': verse['reference']
        }
    
    def verify_storage(self, expected_count: int) -> dict:
        """
        Verify that all vectors are stored correctly.
        
        Args:
            expected_count: Expected number of vectors
            
        Returns:
            Verification results dictionary
        """
        try:
            collection_info = self.client.get_collection(self.collection_name)
            actual_count = collection_info.points_count
            
            return {
                'expected': expected_count,
                'actual': actual_count,
                'is_complete': actual_count == expected_count,
                'missing': expected_count - actual_count
            }
        except Exception as e:
            logger.error(f"Verification failed: {e}")
            return {
                'expected': expected_count,
                'actual': 0,
                'is_complete': False,
                'error': str(e)
            }
    
    def search(
        self,
        query_vector: List[float],
        limit: int = 4,
        score_threshold: float = 0.5,
        filter_dict: dict = None
    ) -> List[dict]:
        """
        Search for similar verses.
        
        Args:
            query_vector: Query embedding vector
            limit: Number of results
            score_threshold: Minimum similarity score
            filter_dict: Optional payload filter
            
        Returns:
            List of search results
        """
        search_results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            limit=limit,
            score_threshold=score_threshold,
            query_filter=models.Filter(**filter_dict) if filter_dict else None
        )
        
        return [
            {
                'id': result.payload.get('id'),
                'surah_number': result.payload.get('surah_number'),
                'verse_number': result.payload.get('verse_number'),
                'surah_name_arabic': result.payload.get('surah_name_arabic'),
                'surah_name_latin': result.payload.get('surah_name_latin'),
                'surah_name_en': result.payload.get('surah_name_en'),
                'surah_name_id': result.payload.get('surah_name_id'),
                'verse_arabic': result.payload.get('verse_arabic'),
                'verse_indonesian': result.payload.get('verse_indonesian'),
                'reference': result.payload.get('reference'),
                'score': result.score
            }
            for result in search_results
        ]


def index_quran_embeddings(
    embeddings_file: Path = None,
    verify: bool = True
) -> dict:
    """
    Main function to index all Quran embeddings in Qdrant.
    
    Args:
        embeddings_file: Path to embeddings JSON file
        verify: Whether to verify after indexing
        
    Returns:
        Indexing results dictionary
    """
    # Load embeddings
    if embeddings_file is None:
        embeddings_file = paths.EMBEDDINGS_FILE
    
    logger.info(f"Loading embeddings from {embeddings_file}...")
    
    if not embeddings_file.exists():
        logger.error(
            f"Embeddings file not found. Please run embedding_generator.py first."
        )
        raise FileNotFoundError(f"Embeddings not found at {embeddings_file}")
    
    with open(embeddings_file, 'r', encoding='utf-8') as f:
        verses = json.load(f)
    
    logger.info(f"Loaded {len(verses)} verses with embeddings")
    
    # Initialize indexer
    indexer = QdrantIndexer()
    
    # Create collection
    indexer.create_collection()
    
    # Create payload indexes
    indexer.create_payload_indexes()
    
    # Upsert verses
    logger.info("Upserting verses to Qdrant...")
    total_upserted = indexer.upsert_verses(verses, batch_size=100)
    logger.info(f"Upserted {total_upserted} verses")
    
    # Verify
    results = {
        'total_verses': len(verses),
        'upserted': total_upserted,
        'verification': None
    }
    
    if verify:
        logger.info("Verifying storage...")
        results['verification'] = indexer.verify_storage(len(verses))
        logger.info(f"Verification result: {results['verification']}")
    
    return results


def main():
    """Main entry point for Qdrant indexing."""
    # Index embeddings
    results = index_quran_embeddings()
    
    # Display summary
    print("\n" + "="*80)
    print("QDRANT INDEXING COMPLETE")
    print("="*80)
    print(f"Total verses: {results['total_verses']}")
    print(f"Upserted: {results['upserted']}")
    
    if results['verification']:
        print(f"Verification: {results['verification']['is_complete']}")
        if results['verification']['is_complete']:
            print("✓ All vectors stored successfully!")
        else:
            print(f"⚠ Missing {results['verification']['missing']} vectors")
    
    print(f"Collection: {qdrant_config.COLLECTION_NAME}")
    print("="*80)


if __name__ == "__main__":
    main()
