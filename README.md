# Quran RAG System - Qdrant Docker Configuration

This directory contains Docker configuration for running Qdrant vector database, optimized for the Quran RAG system's Python development phase.

## Quick Start

### 1. Clone and Setup

```bash
# Copy environment variables template
cp .env.example .env

# Adjust values in .env if needed (defaults work for local development)
```

### 2. Start Qdrant

```bash
# Start the Qdrant service
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Verify Installation

```bash
# Test REST API
curl http://localhost:6335/

# Expected response: JSON with Qdrant version info
```

### 4. Stop Qdrant

```bash
# Stop the service
docker-compose down

# Stop and remove volumes (deletes all data)
docker-compose down -v
```

## Configuration

### Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| 6335 | HTTP | REST API |
| 6336 | gRPC | gRPC API (high-performance) |

### Volumes

| Host Path | Container Path | Purpose |
|-----------|----------------|---------|
| `./qdrant_storage` | `/qdrant/storage` | Persistent vector data |
| `./qdrant.yaml` | `/qdrant/config/production.yaml` | Configuration file |

### Resource Limits

| Service | Memory Limit |
|---------|--------------|
| Qdrant | 1.5GB |

## Creating the Quran Verses Collection

After starting Qdrant, create the collection with these settings:

```python
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    HnswConfigDiff,
    OptimizersConfigDiff,
    PayloadSchemaType,
)

# Connect to Qdrant
client = QdrantClient(host="localhost", port=6335)

# Collection configuration
collection_name = "quran_verses"
vector_size = 768  # embeddinggemma output dimension
distance = Distance.COSINE

# Create collection
client.create_collection(
    collection_name=collection_name,
    vectors_config=VectorParams(
        size=vector_size,
        distance=distance,
    ),
    hnsw_config=HnswConfigDiff(
        m=16,
        ef_construct=100,
    ),
    optimizers_config=OptimizersConfigDiff(
        default_segment_number=2,
        memmap_threshold=10000,
    ),
)

# Create payload indexes for filtering
client.create_payload_index(
    collection_name=collection_name,
    field_name="surah_number",
    field_schema=PayloadSchemaType.INTEGER,
)

client.create_payload_index(
    collection_name=collection_name,
    field_name="juz",
    field_schema=PayloadSchemaType.INTEGER,
)

print(f"Collection '{collection_name}' created successfully!")
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `QDRANT_HOST` | localhost | Qdrant host for client connections |
| `QDRANT_PORT` | 6335 | REST API port |
| `QDRANT_GRPC_PORT` | 6336 | gRPC API port |
| `QDRANT_COLLECTION_NAME` | quran_verses | Default collection name for Quran verses |
| `QDRANT_HADITH_COLLECTION_NAME` | hadith_collection | Collection name for Hadith |
| `DISTANCE_METRIC` | Cosine | Similarity metric (Cosine, Dot, Euclid) |
| `OLLAMA_HOST` | http://localhost:11434 | Ollama API host |
| `OLLAMA_EMBEDDING_MODEL` | qwen3-embedding:0.6b | Ollama embedding model |
| `EMBEDDING_DIMENSION` | 768 | Vector dimension (must match embedding model) |

**Note:** When changing the embedding model, make sure to update `EMBEDDING_DIMENSION` to match the new model's output dimension:
- `qwen3-embedding:0.6b` → 1024
- `qwen3-embedding:1.5b` → 1536
- `nomic-embed-text` → 768
- `mxbai-embed-large` → 1024

## Health Check

Qdrant is configured with a health check that runs every 30 seconds:

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' qdrant
```

## Accessing Qdrant Dashboard

Qdrant provides a web-based dashboard at:

```
http://localhost:6335/dashboard
```

## Data Persistence

All vector data is stored in the `./qdrant_storage` directory. This data persists across container restarts and recreations.

To backup your data:

```bash
# Create backup
tar -czf qdrant-backup-$(date +%Y%m%d).tar.gz ./qdrant_storage
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs qdrant

# Verify ports are not in use
lsof -i :6335
lsof -i :6336
```

### Reset everything

```bash
# Stop and remove all data
docker-compose down -v
rm -rf ./qdrant_storage
```

## Refresh Database and Re-run Embeddings

To completely flush the Qdrant database, clear cached embeddings, and re-run with a different model:

```bash
# 1. Stop Docker and flush Qdrant storage completely
docker compose down
sudo rm -rf ./qdrant_storage/collections/*

# 2. Restart Qdrant
docker compose up -d

# 3. Delete any remaining collections via API
node next-server/scripts/delete-collection.js

# 4. Recreate collections with correct dimension
node next-server/scripts/init-qdrant.js

# 5. Clear cached embeddings and checkpoints (important!)
rm -f ./output/embeddings.json
rm -f ./output/checkpoints/embeddings_checkpoint.jsonl

# 6. Run the full pipeline
python -m scripts.run
```

### Or as a single command chain:

```bash
docker compose down && \
sudo rm -rf ./qdrant_storage/collections/* && \
docker compose up -d && \
node next-server/scripts/delete-collection.js && \
node next-server/scripts/init-qdrant.js && \
rm -f ./output/embeddings.json ./output/checkpoints/embeddings_checkpoint.jsonl && \
python -m scripts.run
```

## Next Steps

1. Run the Python data processing scripts to prepare Quran data
2. Generate embeddings using Ollama's `embeddinggemma` model
3. Index vectors in Qdrant using the provided Python scripts

---

## Python Scripts Usage

### Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

### Running the Pipeline

The complete pipeline can be run in three phases:

#### Option 1: Run Full Pipeline

```bash
# Run all phases sequentially
python -m scripts.run
```

#### Option 2: Run Individual Phases

```bash
# Phase 1: Data Processing
python -m scripts.data_processing

# Phase 2: Embedding Generation (requires Ollama running)
python -m scripts.embedding_generator

# Phase 3: Qdrant Indexing
python -m scripts.qdrant_indexer
```

#### Option 3: Run with Skip Options

```bash
# Skip data processing (if already done)
python -m scripts.run --skip-processing

# Skip embedding generation (if already done)
python -m scripts.run --skip-embedding

# Skip Qdrant indexing (if already done)
python -m scripts.run --skip-indexing
```

### Pipeline Phases

#### Phase 1: Data Processing

**Input:** 172 parquet files from `quran/data/`
**Output:** `output/processed_data.json` and `output/processed_data.parquet`

This phase:
- Loads all 172 parquet files
- Validates 6,236 verses with required fields
- Normalizes text (UTF-8, Arabic normalization)
- Creates `full_context` field (Arabic + Indonesian + English)
- Generates unique IDs (`{surah_number}:{verse_number}`)
- Creates reference strings

#### Phase 2: Embedding Generation

**Input:** `output/processed_data.json`
**Output:** `output/embeddings.json` and `output/checkpoints/embeddings_checkpoint.jsonl`

This phase:
- Connects to Ollama API (`http://localhost:11434`)
- Uses `embeddinggemma` model (768 dimensions)
- Processes verses with checkpointing (can resume)
- Implements retry logic with exponential backoff

**Prerequisites:**
```bash
# Install and start Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull embedding model
ollama pull embeddinggemma

# Verify model
ollama list
```

#### Phase 3: Qdrant Indexing

**Input:** `output/embeddings.json`
**Output:** Qdrant collection `quran_verses`

This phase:
- Creates Qdrant collection (768 dims, COSINE distance)
- Creates payload indexes (surah_number, juz)
- Batch upserts all vectors
- Verifies storage completeness

**Prerequisites:**
```bash
# Start Qdrant (from this directory)
docker-compose up -d

# Verify Qdrant is running
curl http://localhost:6335/
```

### Output Files

| File | Description |
|------|-------------|
| `output/processed_data.json` | Cleaned dataset with full_context |
| `output/processed_data.parquet` | Cleaned dataset in Parquet format |
| `output/embeddings.json` | Dataset with 768-dimension embeddings |
| `output/checkpoints/embeddings_checkpoint.jsonl` | Embedding progress checkpoint |
| `output/logs/pipeline.log` | Pipeline execution logs |

### Qdrant Collection Schema

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | String | No | Verse ID (`{surah}:{verse}`) |
| `surah_number` | Integer | Yes | Surah number (1-114) |
| `verse_number` | Integer | No | Verse number within surah |
| `surah_name_en` | String | No | Surah name in English |
| `juz` | Integer | Yes | Juz number (1-30) |
| `verse_arabic` | String | No | Arabic text |
| `verse_indonesian` | String | No | Indonesian translation |
| `verse_english` | String | No | English translation |
| `reference` | String | No | Formatted reference string |

### Troubleshooting

#### Ollama connection failed
```bash
# Check if Ollama is running
ollama list

# Restart Ollama service
sudo systemctl restart ollama
```

#### Qdrant connection failed
```bash
# Check if Qdrant container is running
docker-compose ps

# View Qdrant logs
docker-compose logs qdrant

# Restart Qdrant
docker-compose down && docker-compose up -d
```

#### Checkpoint recovery
```bash
# To resume from checkpoint, just re-run the embedding generator
# It will automatically detect and resume from checkpoint
python -m scripts.embedding_generator

# To clear checkpoint and start fresh
rm output/checkpoints/embeddings_checkpoint.jsonl
python -m scripts.embedding_generator
```

## References

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Qdrant Python Client](https://qdrant.tech/documentation/qdrant-client/python/)
- [Configuration Guide](https://qdrant.tech/documentation/guides/configuration/)
