# Rencana Implementasi Platform Dakwah AI (Fase 1: Al-Qur'an)

**Dokumen Versi:** 1.0  
**Tanggal:** 2026-02-28  
**Status:** Planning  
**Author:** Development Team

---

## Ringkasan Eksekutif

Dokumen ini menjelaskan langkah-langkah teknis untuk membangun platform dakwah tahap awal yang berfokus pada Al-Qur'an menggunakan metode **Retrieval-Augmented Generation (RAG)**. Platform ini akan memungkinkan pengguna untuk bertanya tentang Al-Qur'an dalam berbagai bahasa (Indonesia, Inggris) dan menerima jawaban yang akurat dengan referensi ayat yang jelas.

### Tujuan Utama
- Membangun sistem RAG yang akurat untuk pencarian dan pemahaman Al-Qur'an
- Mendukung query multibahasa (Indonesia, Inggris) dengan hasil dalam Bahasa Indonesia dan Arab
- Menyediakan referensi ayat yang dapat diverifikasi untuk setiap jawaban
- Optimasi untuk deployment dengan resource terbatas (RAM 8GB, CPU AMD EPYC)

### Scope Fase 1
- Dataset: 6.236 ayat Al-Qur'an dengan terjemahan Indonesia dan Inggris
- Embedding model: embeddinggemma via Ollama
- Vector database: Qdrant
- Frontend: Next.js dengan TypeScript
- Deployment: VPS Debian 13 dengan Docker

---

## 1. Fase Persiapan Data (Lokal)

### 1.1 Tujuan
Menyiapkan dataset Al-Qur'an multi-bahasa agar memiliki konteks semantik yang kuat untuk proses embedding dan retrieval.

### 1.2 Dataset Source

| Properti | Nilai |
|----------|-------|
| **Source** | [nazimali/quran](https://huggingface.co/datasets/nazimali/quran) dari Hugging Face |
| **Total Ayat** | 6.236 |
| **Format** | Parquet files (172 files) |
| **Lokasi Lokal** | `./quran/data/` |

### 1.3 Kolom yang Digunakan

#### Data Utama
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `verse_arabic` | String | Teks Arab asli dari Al-Qur'an |
| `verse_indonesian` | String | Terjemahan resmi Bahasa Indonesia |
| `verse_english` | String | Terjemahan Bahasa Inggris |

#### Metadata
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `surah_number` | Integer | Nomor surat (1-114) |
| `verse_number` | Integer | Nomor ayat dalam surat |
| `surah_name_en` | String | Nama surat dalam Bahasa Inggris |
| `juz` | Integer | Nomor juz (1-30) |

### 1.4 Data Processing & Cleaning

#### 1.4.1 Concatenated Context
Membuat field `full_context` dengan menggabungkan:
```
full_context = "{verse_arabic} | {verse_indonesian} | {verse_english}"
```

**Alasan Desain:**
- Mencari dengan kata kunci bahasa Inggris atau Indonesia akan tetap mengarah pada ayat yang sama karena mereka berada dalam satu vektor yang sama
- Memungkinkan cross-lingual retrieval tanpa perlu multiple embeddings
- Mengurangi kompleksitas dan biaya komputasi

#### 1.4.2 Normalisasi
Proses pembersihan yang akan dilakukan:

```python
def normalize_text(text: str) -> str:
    # Remove non-UTF8 characters
    text = text.encode('utf-8', errors='ignore').decode('utf-8')
    
    # Normalize Arabic text (remove tatweel, normalize alef)
    text = arabic_normalizer.normalize(text)
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Remove special characters that don't add semantic value
    text = re.sub(r'[^\w\s\u0600-\u06FF\.,!?-]', '', text)
    
    return text
```

#### 1.4.3 Validasi Data
- [ ] Pastikan semua 6.236 ayat memiliki ketiga kolom (Arab, Indonesia, Inggris)
- [ ] Validasi bahwa `surah_number` berada dalam range 1-114
- [ ] Validasi bahwa `verse_number` konsisten dengan total ayat per surat
- [ ] Cek untuk empty strings atau null values

### 1.5 Output yang Diharapkan
File JSON/Parquet dengan struktur:
```json
{
  "id": "1:1",
  "surah_number": 1,
  "verse_number": 1,
  "surah_name_en": "Al-Fatihah",
  "juz": 1,
  "verse_arabic": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  "verse_indonesian": "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.",
  "verse_english": "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
  "full_context": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ | Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. | In the name of Allah, the Entirely Merciful, the Especially Merciful."
}
```

---

## 2. Fase Vektorisasi & Indexing (Lokal - RTX 4060)

### 2.1 Tujuan
Mengubah seluruh ayat Al-Qur'an menjadi vektor embeddings dan menyimpannya dalam Qdrant untuk pencarian semantik yang cepat.

### 2.2 Hardware Specification

| Komponen | Spesifikasi |
|----------|-------------|
| **GPU** | NVIDIA RTX 4060 (8GB VRAM) |
| **RAM** | 16GB+ System RAM |
| **Storage** | SSD dengan minimal 10GB free space |

### 2.3 Environment Setup

#### 2.3.1 Ollama Configuration
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull embedding model
ollama pull embeddinggemma

# Verify model
ollama list

# Expected output:
# NAME                    ID              SIZE      MODIFIED
# embeddinggemma    abc123...       300MB     2 days ago
```

#### 2.3.2 Qdrant Setup (Docker)
```bash
# Pull Qdrant image
docker pull qdrant/qdrant

# Run Qdrant
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

**Ports:**
- `6333`: REST API
- `6334`: gRPC API (optional, untuk performa lebih tinggi)

### 2.4 Proses Embedding

#### 2.4.1 Script Architecture
```
scripts/
├── data_processing.py      # Load dan clean data
├── embedding_generator.py  # Generate embeddings via Ollama
├── qdrant_indexer.py       # Store ke Qdrant
└── config.py               # Configuration constants
```

#### 2.4.2 Batch Processing Configuration
```python
BATCH_SIZE = 50  # Ayat per batch
MAX_RETRIES = 3
TIMEOUT_SECONDS = 30

# Estimated processing time:
# 6,236 ayat / 50 batch = ~125 batches
# Dengan rate ~10 batch/menit = ~12-15 menit total
```

#### 2.4.3 Ollama API Call
```python
import requests

def generate_embedding(text: str) -> list[float]:
    response = requests.post(
        'http://localhost:11434/api/embeddings',
        json={
            'model': 'embeddinggemma',
            'prompt': text
        }
    )
    return response.json()['embedding']
```

### 2.5 Qdrant Schema Design

#### 2.5.1 Collection Configuration
```python
from qdrant_client import models

collection_config = {
    "vectors": {
        "size": 768,  # embeddinggemma output dimension
        "distance": models.Distance.COSINE
    },
    "optimizers_config": {
        "default_segment_number": 2,
        "memmap_threshold": 10000
    },
    "hnsw_config": {
        "m": 16,
        "ef_construct": 100
    }
}
```

#### 2.5.2 Payload Schema
| Field | Tipe | Indexed | Deskripsi |
|-------|------|---------|-----------|
| `verse_arabic` | Text | No | Teks Arab untuk display |
| `verse_indonesian` | Text | No | Terjemahan Indonesia untuk display |
| `verse_english` | Text | No | Terjemahan Inggris untuk fallback |
| `surah_number` | Integer | Yes | Untuk filtering per surat |
| `verse_number` | Integer | No | Nomor ayat |
| `surah_name_en` | Text | No | Nama surat |
| `surah_name_id` | Text | No | Nama surat dalam Bahasa Indonesia |
| `juz` | Integer | Yes | Untuk filtering per juz |
| `reference` | Text | No | Formatted reference string |

#### 2.5.3 Payload Indexing
```python
# Create payload indexes untuk filtering
qdrant.create_payload_index(
    collection_name="quran_verses",
    field_name="surah_number",
    field_schema=models.PayloadSchemaType.INTEGER
)

qdrant.create_payload_index(
    collection_name="quran_verses",
    field_name="juz",
    field_schema=models.PayloadSchemaType.INTEGER
)
```

### 2.6 Point Structure Example
```python
{
    "id": 1,  # Global unique ID (1-6236)
    "vector": [0.123, -0.456, ...],  # 768 dimensions
    "payload": {
        "verse_arabic": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        "verse_indonesian": "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.",
        "surah_number": 1,
        "verse_number": 1,
        "surah_name_en": "Al-Fatihah",
        "surah_name_id": "Pembukaan",
        "juz": 1,
        "reference": "Surat Al-Fatihah (1): Ayat 1"
    }
}
```

---

## 3. Fase Pengembangan Web (Next.js)

### 3.1 Tujuan
Membangun alur RAG yang efisien tanpa menggunakan Python di sisi server VPS, memanfaatkan ekosistem JavaScript/TypeScript sepenuhnya.

### 3.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 15.x | App Router, Server Actions |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 3.x | UI styling |
| **Vector DB Client** | @qdrant/js-client-rest | 1.x | Qdrant interaction |
| **AI/LLM** | OpenAI API | GPT-4o mini | Response generation |
| **Embedding** | Ollama | Latest | Local embedding generation |
| **Runtime** | Node.js | 22.x | Server runtime |

### 3.3 Project Structure
```
apps/web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts      # Chat endpoint
│   │   │   └── embed/
│   │   │       └── route.ts      # Embedding endpoint
│   │   ├── layout.tsx
│   │   └── page.tsx              # Main chat UI
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   └── VerseCard.tsx
│   │   └── ui/
│   ├── lib/
│   │   ├── qdrant.ts             # Qdrant client
│   │   ├── ollama.ts             # Ollama client
│   │   ├── openai.ts             # OpenAI client
│   │   └── rag.ts                # RAG orchestration
│   └── types/
│       └── index.ts
├── package.json
└── tailwind.config.ts
```

### 3.4 Logic Flow (Server-Side)

#### 3.4.1 Architecture Diagram
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────▶│  Next.js     │────▶│   Ollama    │────▶│   Qdrant    │
│   Query     │     │  Server      │     │  (Embed)    │     │  (Search)   │
└─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
                           │                                        │
                           │                                        │
                           ▼                                        ▼
                    ┌──────────────┐                        ┌─────────────┐
                    │   OpenAI     │◀───────────────────────│  Context    │
                    │   (Generate) │                        │  (Verses)   │
                    └──────────────┘                        └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Response  │
                    │   + Cards   │
                    └─────────────┘
```

#### 3.4.2 Step-by-Step Flow

**Step 1: User Query**
```typescript
// POST /api/chat
{
  "query": "Apa kata Quran tentang sabar?"
}
```

**Step 2: Embedding Generation**
```typescript
// src/lib/ollama.ts
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    body: JSON.stringify({
      model: 'embeddinggemma',
      prompt: query
    })
  });
  const data = await response.json();
  return data.embedding;
}
```

**Step 3: Vector Search**
```typescript
// src/lib/qdrant.ts
async function searchVerses(
  queryVector: number[],
  limit: number = 4
): Promise<VerseResult[]> {
  const results = await qdrant.search({
    collection_name: 'quran_verses',
    vector: queryVector,
    limit: limit,
    score_threshold: 0.5,  // Minimum similarity threshold
    with_payload: true
  });
  
  return results.map(r => ({
    score: r.score,
    ...r.payload
  }));
}
```

**Step 4: Context Building**
```typescript
// src/lib/rag.ts
function buildContext(verses: VerseResult[]): string {
  return verses.map(v => 
    `[${v.reference}]\n` +
    `Arab: ${v.verse_arabic}\n` +
    `Indonesia: ${v.verse_indonesian}\n`
  ).join('\n---\n');
}
```

**Step 5: LLM Prompting**
```typescript
// src/lib/openai.ts
const SYSTEM_PROMPT = `Anda adalah asisten Al-Qur'an yang membantu dan akurat.

TUGAS ANDA:
1. Jawablah pertanyaan pengguna HANYA berdasarkan konteks ayat yang diberikan
2. Sebutkan nomor surat dan ayat dengan tepat
3. Jika konteks tidak relevan, katakan bahwa Anda tidak menemukan informasi yang relevan
4. Gunakan bahasa Indonesia yang jelas dan mudah dipahami
5. Jangan membuat-buat informasi atau mengarang ayat

FORMAT JAWABAN:
- Mulai dengan jawaban langsung
- Sertakan referensi ayat dalam format: "QS {SurahName} ({surah_number}):{verse_number}"
- Jika ada multiple ayat, jelaskan hubungan/konteks antar ayat

KONTEKS AYAT:
{context}`;

async function generateResponse(
  query: string,
  context: string
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT.replace('{context}', context) },
      { role: 'user', content: query }
    ],
    temperature: 0.3,  // Low temperature for factual accuracy
    max_tokens: 500
  });
  
  return completion.choices[0].message.content;
}
```

### 3.5 Response Format
```typescript
// API Response
{
  "answer": "Al-Qur'an menyebutkan tentang sabar dalam banyak ayat...",
  "references": [
    {
      "surah_number": 2,
      "verse_number": 153,
      "surah_name_en": "Al-Baqarah",
      "surah_name_id": "Sapi Betina",
      "verse_arabic": "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ...",
      "verse_indonesian": "Wahai orang-orang yang beriman! Mohonlah pertolongan (kepada Allah) dengan sabar dan shalat...",
      "relevance_score": 0.89
    }
    // ... more references
  ],
  "query": "Apa kata Quran tentang sabar?",
  "processing_time_ms": 245
}
```

### 3.6 UI Components

#### 3.6.1 Chat Interface
- Input field dengan auto-resize textarea
- Message bubbles (user vs AI)
- Loading state dengan skeleton
- Error handling dengan retry option

#### 3.6.2 Verse Card Component
```typescript
interface VerseCardProps {
  surahName: string;
  surahNumber: number;
  verseNumber: number;
  arabicText: string;
  indonesianText: string;
  relevanceScore: number;
}

// Features:
// - Toggle arabic text size
// - Copy to clipboard
// - Highlight on hover
// - Show relevance score indicator
```

---

## 4. Fase Deployment (VPS Debian 13)

### 4.1 Tujuan
Deploy platform ke production environment dengan optimasi resource untuk RAM 8GB dan CPU AMD EPYC.

### 4.2 VPS Specifications

| Komponen | Spesifikasi |
|----------|-------------|
| **OS** | Debian 13 (Trixie) |
| **CPU** | AMD EPYC (shared/vCPU) |
| **RAM** | 8GB DDR4 |
| **Storage** | SSD NVMe (minimal 50GB) |
| **Network** | 1Gbps |

### 4.3 Docker Setup

#### 4.3.1 Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant
    ports:
      - "6333:6333"
    volumes:
      - ./qdrant_storage:/qdrant/storage
    deploy:
      resources:
        limits:
          memory: 1.5G
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/"]
      interval: 30s
      timeout: 10s
      retries: 3

  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ./ollama_models:/root/.ollama
    deploy:
      resources:
        limits:
          memory: 1G
    restart: unless-stopped
    command: serve

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    container_name: quran-web
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OLLAMA_HOST=http://ollama:11434
      - QDRANT_URL=http://qdrant:6333
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - qdrant
      - ollama
    restart: unless-stopped
```

#### 4.3.2 Resource Limits Explanation
| Service | Memory Limit | Rationale |
|---------|--------------|-----------|
| Qdrant | 1.5GB | Cukup untuk 6.236 vectors + index |
| Ollama | 1GB | embeddinggemma hanya butuh ~500MB |
| Web | ~500MB | Next.js production build |
| **Total** | **~3GB** | Menyisakan 5GB untuk OS dan buffer |

### 4.4 Data Migration

#### 4.4.1 Export Snapshot (Local)
```bash
# Create Qdrant snapshot via API
curl -X POST http://localhost:6333/collections/quran_verses/snapshots

# Download snapshot
curl -O http://localhost:6333/collections/quran_verses/snapshots/<snapshot_name>
```

#### 4.4.2 Transfer to VPS
```bash
# Using scp
scp quran_verses-snapshot-*.snap user@vps-ip:/home/user/snapshots/

# Or using rsync for resume capability
rsync -avP quran_verses-snapshot-*.snap user@vps-ip:/home/user/snapshots/
```

#### 4.4.3 Restore Snapshot (VPS)
```bash
# Upload snapshot to Qdrant
curl -X PUT http://localhost:6333/collections/quran_verses/snapshots \
  -H "Content-Type: application/json" \
  -d '{
    "location": "/home/user/snapshots/quran_verses-snapshot-*.snap"
  }'

# Verify restoration
curl http://localhost:6333/collections/quran_verses
```

### 4.5 Production Web Deployment

#### 4.5.1 Next.js Build
```bash
# In apps/web directory
npm run build

# Output: .next/ folder dengan optimized production build
```

#### 4.5.2 PM2 Configuration
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name "quran-web" -- start

# PM2 ecosystem file (ecosystem.config.js)
module.exports = {
  apps: [{
    name: 'quran-web',
    cwd: '/home/user/quran-rag-system/apps/web',
    script: 'npm',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '500M',
    autorestart: true,
    error_file: './logs/error.log',
    out_file: './logs/out.log'
  }]
};
```

#### 4.5.3 Nginx Configuration
```nginx
# /etc/nginx/sites-available/quran-platform
server {
    listen 80;
    server_name your-domain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/quran-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4.6 Environment Variables
```bash
# .env.production
NODE_ENV=production
PORT=3000

# Ollama
OLLAMA_HOST=http://localhost:11434
EMBEDDING_MODEL=embeddinggemma

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=quran_verses

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Application
MAX_CONTEXT_VERSSES=4
SIMILARITY_THRESHOLD=0.5
```

---

## 5. Rencana Pengujian (Testing)

### 5.1 Testing Categories

#### 5.1.1 Functional Testing
| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| **TC-001** | Query dalam Bahasa Indonesia | Ayat relevan dengan terjemahan Indonesia |
| **TC-002** | Query dalam Bahasa Inggris | Ayat relevan dengan terjemahan Indonesia |
| **TC-003** | Query dengan kata kunci spesifik | Ayat dengan konteks yang tepat |
| **TC-004** | Query ambigu | Multiple ayat dengan penjelasan |
| **TC-005** | Query di luar scope | Response yang tepat (tidak mengarang) |

#### 5.1.2 Multilingual Query Tests
```typescript
const testQueries = [
  {
    query: "Apa kata Quran tentang sabar?",
    language: "id",
    expectedTopics: ["sabar", "patience", "steadfastness"]
  },
  {
    query: "Patience in Quran",
    language: "en",
    expectedTopics: ["sabar", "patience"]
  },
  {
    query: "Prayer times in Quran",
    language: "en",
    expectedTopics: ["shalat", "prayer", "salah"]
  },
  {
    query: "Keutamaan sedekah",
    language: "id",
    expectedTopics: ["sedekah", "charity", "zakat"]
  }
];
```

#### 5.1.3 Citation Accuracy Tests
| Test ID | Verification Method | Pass Criteria |
|---------|--------------------|---------------|
| **CA-001** | Cross-reference dengan mushaf | 100% accuracy |
| **CA-002** | Verify surah name matches number | 100% accuracy |
| **CA-003** | Verify verse number exists in surah | 100% accuracy |

### 5.2 Performance Testing

#### 5.2.1 Performance Benchmarks
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Embedding Generation** | < 100ms | Ollama API response time |
| **Vector Search** | < 200ms | Qdrant search latency |
| **LLM Response** | < 3s | OpenAI API response time |
| **Total End-to-End** | < 5s | User-perceived latency |

#### 5.2.2 Load Testing
```bash
# Using k6 for load testing
import http from 'k/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '5m',
};

export default function () {
  const res = http.post('https://your-domain.com/api/chat', {
    query: 'Apa kata Quran tentang sabar?'
  });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });
  
  sleep(1);
}
```

### 5.3 Test Automation

#### 5.3.1 Unit Tests (Jest)
```typescript
// __tests__/rag.test.ts
describe('RAG Pipeline', () => {
  test('should build context from verses', () => {
    const verses = mockVerses;
    const context = buildContext(verses);
    expect(context).toContain('Arab:');
    expect(context).toContain('Indonesia:');
  });
  
  test('should format reference correctly', () => {
    const verse = mockVerse;
    const ref = formatReference(verse);
    expect(ref).toMatch(/Surat .+ \(\d+\): Ayat \d+/);
  });
});
```

#### 5.3.2 Integration Tests
```typescript
// __tests__/integration.test.ts
describe('API Integration', () => {
  test('POST /api/chat should return valid response', async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ query: 'Test query' })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('answer');
    expect(data).toHaveProperty('references');
  });
});
```

---

## 6. Risk Assessment & Mitigation

### 6.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Embedding model tidak akurat** | Medium | High | Test dengan multiple queries sebelum production; Consider fine-tuning |
| **Qdrant memory overflow** | Low | Medium | Set memory limits; Monitor usage; Implement pagination |
| **OpenAI API rate limits** | Medium | Medium | Implement caching; Use gpt-4o-mini yang lebih murah |
| **VPS resource exhaustion** | Low | High | Monitor dengan Prometheus/Grafana; Auto-scaling plan |

### 6.2 Data Integrity Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Terjemahan tidak akurat** | Low | High | Gunakan terjemahan resmi Kemenag; Allow user feedback |
| **Ayat terkorupsi/missing** | Low | Critical | Implement checksum validation; Backup verification |
| **Reference mismatch** | Low | Critical | Cross-validate dengan API eksternal (e.g., Alquran Cloud) |

### 6.3 Security Considerations

```yaml
# Security Checklist
- [ ] HTTPS dengan Let's Encrypt
- [ ] API rate limiting
- [ ] Input sanitization untuk user queries
- [ ] OpenAI API key dalam environment variables
- [ ] Docker container security updates
- [ ] Regular backup Qdrant snapshots
- [ ] Access logging dan monitoring
```

---

## 7. Timeline & Milestones

### 7.1 Phase Breakdown

| Phase | Duration | Dependencies | Deliverables |
|-------|----------|--------------|--------------|
| **Phase 1: Data Prep** | 2-3 days | None | Cleaned dataset, validation reports |
| **Phase 2: Vectorization** | 1-2 days | Phase 1 | Qdrant collection with embeddings |
| **Phase 3: Web Dev** | 5-7 days | Phase 2 | Working Next.js application |
| **Phase 4: Deployment** | 2-3 days | Phase 3 | Production deployment on VPS |
| **Phase 5: Testing** | 2-3 days | Phase 4 | Test reports, bug fixes |

### 7.2 Total Estimated Timeline
**12-18 working days** (approximately 2.5-3.5 weeks)

### 7.3 Milestone Checkpoints

```
Week 1: Data preparation complete, embeddings generated
Week 2: Web application functional locally
Week 3: VPS deployment complete, testing begins
Week 4: Testing complete, production ready
```

---

## 8. Appendix

### 8.1 Glossary

| Term | Definition |
|------|------------|
| **RAG** | Retrieval-Augmented Generation - metode AI yang mengambil informasi dari database sebelum menghasilkan jawaban |
| **Embedding** | Representasi vektor dari teks yang menangkap makna semantik |
| **Cosine Similarity** | Metrik untuk mengukur kemiripan antara dua vektor |
| **Payload** | Metadata yang disimpan bersama vektor di Qdrant |
| **Juz** | 30 bagian Al-Qur'an untuk memudahkan pembacaan |

### 8.2 Reference Links

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Ollama API Reference](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Next.js App Router](https://nextjs.org/docs/app)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Hugging Face - nazimali/quran](https://huggingface.co/datasets/nazimali/quran)

### 8.3 Contact & Support

Untuk pertanyaan atau issue teknis, silakan buat issue di repository GitHub atau hubungi tim development.

---

**Dokumen ini akan diupdate seiring dengan perkembangan implementasi.**
