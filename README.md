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

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `QDRANT_HOST` | localhost | Qdrant host for client connections |
| `QDRANT_PORT` | 6335 | REST API port |
| `QDRANT_GRPC_PORT` | 6336 | gRPC API port |
| `QDRANT_COLLECTION_NAME` | quran_verses_enhanced | Default collection name for Quran verses |
| `QDRANT_HADITH_COLLECTION_NAME` | hadith_collection | Collection name for Hadith |
| `DISTANCE_METRIC` | Cosine | Similarity metric (Cosine, Dot, Euclid) |
| `OLLAMA_HOST` | http://localhost:11434 | Ollama API host |
| `OLLAMA_EMBEDDING_MODEL` | qwen3-embedding:0.6b | Ollama embedding model |
| `EMBEDDING_DIMENSION` | 1024 | Vector dimension (must match embedding model) |

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
2. Generate embeddings using Ollama's embedding model
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

### Pipeline Phases

#### Phase 1: Data Processing

**Input:** `dataset/zincly/quranpak-explore-114-dataset.csv`
**Output:** `output/processed_data.json` and `output/processed_data.parquet`

This phase:
- Loads the CSV dataset (6,236 verses)
- Validates required fields
- Enriches with derived fields (juz, revelation_place, themes)
- Merges Indonesian translations from legacy parquet files
- Normalizes text fields
- Exports processed data

#### Phase 2: Embedding Generation

**Input:** `output/processed_data.json`
**Output:** `output/embeddings.json` and `output/checkpoints/embeddings_checkpoint.jsonl`

This phase:
- Connects to Ollama API (`http://localhost:11434`)
- Uses configured embedding model (default: `qwen3-embedding:0.6b`, 1024 dimensions)
- Processes verses with checkpointing (can resume)
- Implements retry logic with exponential backoff

**Prerequisites:**
```bash
# Install and start Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull embedding model
ollama pull qwen3-embedding:0.6b

# Verify model
ollama list
```

#### Phase 3: Qdrant Indexing

**Input:** `output/embeddings.json`
**Output:** Qdrant collection `quran_verses_enhanced`

This phase:
- Creates Qdrant collection (1024 dims, COSINE distance)
- Creates payload indexes (chapter_id, juz, themes, etc.)
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
| `output/processed_data.json` | Cleaned dataset with enriched fields |
| `output/processed_data.parquet` | Cleaned dataset in Parquet format |
| `output/embeddings.json` | Dataset with embeddings |
| `output/checkpoints/embeddings_checkpoint.jsonl` | Embedding progress checkpoint |
| `output/logs/pipeline.log` | Pipeline execution logs |

### Qdrant Collection Schema (Enhanced)

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `verse_key` | String | Yes | Verse key (`{chapter}:{verse}`) |
| `chapter_id` | Integer | Yes | Surah number (1-114) |
| `verse_number` | Integer | No | Verse number within surah |
| `chapter_name` | String | No | Surah name |
| `juz` | Integer | Yes | Juz number (1-30) |
| `revelation_place` | String | Yes | Makkah or Madinah |
| `main_themes` | String | Yes | JSON array of themes |
| `primary_theme` | String | Yes | Primary theme |
| `theme_count` | Integer | No | Number of themes |
| `audience_group` | String | Yes | Target audience |
| `arabic_text` | String | No | Arabic text |
| `english_translation` | String | No | English translation |
| `indonesian_translation` | String | No | Indonesian translation |
| `tafsir_text` | String | No | Tafsir commentary |
| `practical_application` | String | No | Practical application |

### Modular Architecture

The Python codebase has been refactored into modular components:

#### Configuration Package (`scripts/config/`)
- `paths.py` - File and directory paths
- `dataset.py` - Dataset-specific settings
- `embedding.py` - Embedding model configuration
- `qdrant.py` - Qdrant database settings
- `processing.py` - General processing options

#### Utility Modules (`scripts/utils/`)
- `juz_mapping.py` - Juz number calculation
- `revelation_mapping.py` - Makkah/Madinah classification
- `translation_merge.py` - Indonesian translation merging

#### Processing Pipeline (`scripts/processing/`)
- `loader.py` - Data loading (CSV/parquet)
- `validator.py` - Data validation
- `enricher.py` - Field enrichment
- `merger.py` - Translation merging
- `normalizer.py` - Text normalization
- `exporter.py` - Data export

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
