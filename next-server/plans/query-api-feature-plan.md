# Query API & Full Feature Plan

## Overview

This document provides a comprehensive plan for the QuranInsight smart query API and full feature set, building upon the authentication foundation already in place.

---

## Current Status

### ✅ Completed Infrastructure:
1. **Authentication System** - NextAuth.js v5 with Prisma adapter
2. **Database Schema** - User, Account, Session, SavedSearch, Collection models
3. **Prisma Client** - Generated and migrated
4. **Environment Setup** - PostgreSQL connection configured

### 🔄 In Progress:
1. API endpoint implementation
2. Frontend integration with auth state

---

## Feature Architecture

### System Flow Diagram

```mermaid
flowchart LR
    subgraph User Layers
        G[Guest User]
        A[Authenticated User]
    end
    
    subgraph Public Features
        PS[Smart Search]
        PT[Theme Explorer]
        PV[Verse of Day]
        PQ[Suggested Queries]
    end
    
    subgraph Auth Features
        AA[AI Analysis]
        AE[AI Explain]
        AC[AI Chat]
        SS[Saved Searches]
        CC[Collections]
    end
    
    subgraph API Layer
        S1[/api/search]
        S2[/api/themes]
        S3[/api/verse-of-the-day]
        S4[/api/suggested-queries]
        P1[/api/ai/analyze]
        P2[/api/ai/explain]
        P3[/api/ai/chat]
        P4[/api/user/saved-searches]
        P5[/api/user/collections]
    end
    
    subgraph Services
        Q[Qdrant Client]
        O[OpenAI Client]
        E[Embedding Service]
    end
    
    G --> PS
    G --> PT
    G --> PV
    G --> PQ
    
    A --> AA
    A --> AE
    A --> AC
    A --> SS
    A --> CC
    
    PS --> S1
    PT --> S2
    PV --> S3
    PQ --> S4
    AA --> P1
    AE --> P2
    AC --> P3
    SS --> P4
    CC --> P5
    
    S1 --> Q
    S2 --> Q
    S3 --> Q
    P1 --> Q
    P1 --> O
    P2 --> Q
    P2 --> O
    P3 --> Q
    P3 --> O
    
    Q --> E
```

---

## API Endpoint Specifications

### Public Endpoints (Guest Access)

#### 1. POST /api/search

**Purpose:** Smart semantic search with optional filters

**Request Body:**
```typescript
interface SearchRequest {
  query: string;
  filters?: {
    focus?: 'all' | 'verses' | 'tafsir' | 'thematic' | 'dawah';
    themes?: string[];
    juz?: number;
    revelation_place?: 'Makkah' | 'Madinah';
    chapter_id?: number;
  };
  limit?: number; // default: 10, max: 50
  offset?: number; // for pagination
  language?: 'id' | 'en' | 'ar';
}
```

**Response:**
```typescript
interface SearchResponse {
  success: boolean;
  query: string;
  results: {
    verse_key: string;
    chapter_id: number;
    verse_number: number;
    chapter_name: string;
    arabic_text: string;
    translation: string; // Localized based on request
    indonesian_translation: string;
    english_translation: string;
    score: number;
    juz: number;
    revelation_place: 'Makkah' | 'Madinah';
    primary_theme: string;
    main_themes: string[];
    tafsir_text?: string;
  }[];
  total: number;
  has_more: boolean;
  processing_time_ms: number;
}
```

**Implementation Flow:**
1. Validate request body
2. Generate embedding for query using Ollama
3. Build Qdrant filter based on provided filters
4. Search Qdrant with vector + filters
5. Format results with localized translations
6. Return structured response

**Error Cases:**
- Invalid query (empty/too long)
- Embedding generation failure
- Qdrant connection error

---

#### 2. GET /api/themes

**Purpose:** List all themes with verse counts

**Query Parameters:**
```typescript
interface ThemesRequest {
  limit?: number; // default: all
  include_arabic?: boolean; // default: true
}
```

**Response:**
```typescript
interface ThemesResponse {
  success: boolean;
  themes: {
    name: string;
    arabic: string;
    count: number;
    description?: string;
  }[];
  total: number;
}
```

**Implementation:**
1. Query Qdrant to aggregate unique primary_theme values
2. Count occurrences of each theme
3. Map to predefined Arabic names
4. Sort by count (descending)
5. Cache results (revalidate every 24h)

---

#### 3. GET /api/verse-of-the-day

**Purpose:** Return deterministic verse based on date

**Query Parameters:**
```typescript
interface VerseOfDayRequest {
  date?: string; // ISO date string, default: today
  language?: 'id' | 'en' | 'ar';
}
```

**Response:**
```typescript
interface VerseOfDayResponse {
  success: boolean;
  verse: {
    verse_key: string;
    chapter_id: number;
    verse_number: number;
    chapter_name: string;
    arabic_text: string;
    translation: string;
    indonesian_translation: string;
    english_translation: string;
    juz: number;
    revelation_place: 'Makkah' | 'Madinah';
    primary_theme: string;
    main_themes: string[];
    tafsir_text?: string;
  };
  date: string;
}
```

**Implementation:**
1. Generate deterministic seed from date (e.g., YYYYMMDD hash mod total verses)
2. Use seed to select verse index
3. Fetch verse from Qdrant by offset or key
4. Return verse with full context

---

#### 4. GET /api/suggested-queries

**Purpose:** Return list of suggested search queries

**Response:**
```typescript
interface SuggestedQueriesResponse {
  success: boolean;
  queries: {
    text: string;
    category: string;
  }[];
}
```

**Suggested Queries:**
```typescript
const SUGGESTED_QUERIES = [
  { text: "How to invite non-Muslims to Islam gently", category: "Da'wah" },
  { text: "Verses about Tawhid (Oneness of God)", category: "Faith" },
  { text: "Kindness and mercy in the Qur'an", category: "Ethics" },
  { text: "Why is shirk forbidden in Islam", category: "Faith" },
  { text: "What is the purpose of human creation", category: "Life" },
  { text: "Signs of Judgment Day", category: "Hereafter" },
  { text: "Patience and gratitude in trials", category: "Ethics" },
  { text: "Rules of inheritance in Islam", category: "Law" },
  { text: "Stories of prophets in the Qur'an", category: "Stories" },
  { text: "Guidance for family relationships", category: "Ethics" },
];
```

---

### Protected Endpoints (Auth Required)

#### 5. POST /api/ai/analyze

**Access:** Authenticated users only

**Purpose:** Deep AI analysis of specific verses

**Request:**
```typescript
interface AnalyzeRequest {
  verse_key: string;
  aspects?: ('tafsir' | 'historical_context' | 'practical_application' | 'linguistic')[];
  language?: 'id' | 'en' | 'ar';
  depth?: 'basic' | 'detailed' | 'comprehensive';
}
```

**Response:**
```typescript
interface AnalyzeResponse {
  success: boolean;
  analysis: {
    verse_key: string;
    tafsir: string;
    historical_context: string;
    practical_application: string;
    linguistic_notes: string;
    related_verses: {
      verse_key: string;
      relevance: string;
    }[];
  };
  processing_time_ms: number;
}
```

**Implementation:**
1. Verify authentication
2. Fetch verse from Qdrant
3. Build context with verse + tafsir + related verses
4. Call OpenAI with analysis prompt
5. Stream or return complete analysis

---

#### 6. POST /api/ai/explain

**Access:** Authenticated users only

**Purpose:** AI-powered explanation of Quranic concepts

**Request:**
```typescript
interface ExplainRequest {
  topic: string;
  verses?: string[]; // Optional verse keys to focus on
  depth?: 'basic' | 'intermediate' | 'advanced';
  language?: 'id' | 'en' | 'ar';
  include_practical_tips?: boolean;
}
```

**Response:**
```typescript
interface ExplainResponse {
  success: boolean;
  explanation: string;
  references: {
    verse_key: string;
    arabic_text: string;
    translation: string;
    relevance: string;
  }[];
  related_topics: string[];
  processing_time_ms: number;
}
```

---

#### 7. POST /api/ai/chat

**Access:** Authenticated users only

**Purpose:** Multi-turn conversational AI about Quran

**Request:**
```typescript
interface ChatRequest {
  message: string;
  conversation_id?: string; // For continuing conversations
  language?: 'id' | 'en' | 'ar';
  max_tokens?: number;
}
```

**Response:** (Streaming SSE)
```typescript
// Stream events:
{ type: 'start', conversation_id: string }
{ type: 'chunk', content: string }
{ type: 'references', references: VerseReference[] }
{ type: 'complete', answer: string }
{ type: 'error', message: string }
```

**Implementation:**
1. Verify authentication
2. Load conversation history if conversation_id provided
3. Generate embedding for user message
4. Search Qdrant for relevant verses
5. Build context with conversation history + verses
6. Stream OpenAI response with tool calls

---

#### 8. GET /api/user/saved-searches

**Access:** Authenticated users only

**Purpose:** Get user's saved search history

**Response:**
```typescript
interface SavedSearchesResponse {
  success: boolean;
  searches: {
    id: string;
    query: string;
    filters: object | null;
    createdAt: string;
  }[];
}
```

---

#### 9. POST /api/user/collections

**Access:** Authenticated users only

**Purpose:** Create/manage verse collections

**Request (Create):**
```typescript
interface CreateCollectionRequest {
  name: string;
  description?: string;
  verses: string[]; // Array of verse_keys
  isPublic?: boolean;
}
```

**Response:**
```typescript
interface CollectionResponse {
  success: boolean;
  collection: {
    id: string;
    name: string;
    description: string | null;
    verses: string[];
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
  };
}
```

---

## Qdrant Client Enhancement

### New Functions Required

```typescript
// src/lib/qdrant.ts

/**
 * Search verses with filters
 */
export async function searchVersesWithFilters(
  queryVector: number[],
  filters?: SearchFilters,
  limit?: number,
  offset?: number,
  scoreThreshold?: number
): Promise<VerseSearchResult[]>;

/**
 * Get all unique themes with counts
 */
export async function getAllThemes(): Promise<ThemeInfo[]>;

/**
 * Get verse by key
 */
export async function getVerseByKey(verseKey: string): Promise<VersePayload | null>;

/**
 * Get random verse by seed (for verse-of-the-day)
 */
export async function getRandomVerse(seed: number): Promise<VersePayload>;

/**
 * Get verses by theme
 */
export async function getVersesByTheme(
  theme: string,
  limit?: number
): Promise<VerseSearchResult[]>;
```

### Filter Mapping

```typescript
function buildQdrantFilter(filters: SearchFilters): Filter {
  const conditions: FilterCondition[] = [];
  
  if (filters.juz) {
    conditions.push({
      key: 'juz',
      match: { value: filters.juz }
    });
  }
  
  if (filters.revelation_place) {
    conditions.push({
      key: 'revelation_place',
      match: { value: filters.revelation_place }
    });
  }
  
  if (filters.chapter_id) {
    conditions.push({
      key: 'chapter_id',
      match: { value: filters.chapter_id }
    });
  }
  
  if (filters.themes?.length) {
    conditions.push({
      key: 'primary_theme',
      match: { any: filters.themes }
    });
  }
  
  if (filters.focus === 'tafsir') {
    conditions.push({
      key: 'tafsir_text',
      is_empty: false
    });
  }
  
  return conditions.length > 0 ? { must: conditions } : {};
}
```

---

## Middleware & Route Protection

### Next.js Middleware

```typescript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  
  // Public paths
  const publicPaths = [
    '/api/search',
    '/api/themes',
    '/api/verse-of-the-day',
    '/api/suggested-queries',
    '/auth/signin',
    '/auth/signout',
  ];
  
  // Protected API paths
  const protectedPaths = [
    '/api/ai/',
    '/api/user/',
  ];
  
  // Check if path is protected
  const isProtectedPath = protectedPaths.some(p => 
    nextUrl.pathname.startsWith(p)
  );
  
  // Check if path is public
  const isPublicPath = publicPaths.some(p => 
    nextUrl.pathname.startsWith(p)
  );
  
  // Block access to protected paths if not logged in
  if (isProtectedPath && !isLoggedIn) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/api/:path*', '/auth/:path*'],
};
```

---

## Frontend Integration

### Auth Context

```typescript
// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession, signIn, signOut, SessionProvider } from 'next-auth/react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  signIn: typeof signIn;
  signOut: typeof signOut;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  
  const value: AuthContextType = {
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    user: session?.user || null,
    signIn,
    signOut,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Search Hook

```typescript
// src/hooks/useSearch.ts
import { useState, useCallback } from 'react';

interface UseSearchResult {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  clear: () => void;
}

export function useSearch(): UseSearchResult {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const search = useCallback(async (query: string, filters?: SearchFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters }),
      });
      
      if (!res.ok) throw new Error('Search failed');
      
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);
  
  return { results, isLoading, error, search, clear };
}
```

---

## Implementation Checklist

### Phase 1: Qdrant Enhancement
- [ ] Add `searchVersesWithFilters()` function
- [ ] Add `getAllThemes()` function
- [ ] Add `getVerseByKey()` function
- [ ] Add `getRandomVerse()` function
- [ ] Add `getVersesByTheme()` function
- [ ] Update TypeScript types for new functions

### Phase 2: Public API Endpoints
- [ ] Create `/api/search/route.ts` (POST)
- [ ] Create `/api/themes/route.ts` (GET)
- [ ] Create `/api/verse-of-the-day/route.ts` (GET)
- [ ] Create `/api/suggested-queries/route.ts` (GET)
- [ ] Add rate limiting middleware

### Phase 3: Protected API Endpoints
- [ ] Create `/api/ai/analyze/route.ts` (POST)
- [ ] Create `/api/ai/explain/route.ts` (POST)
- [ ] Create `/api/ai/chat/route.ts` (POST, streaming)
- [ ] Create `/api/user/saved-searches/route.ts` (GET, POST)
- [ ] Create `/api/user/collections/route.ts` (GET, POST, PUT, DELETE)

### Phase 4: Frontend Integration
- [ ] Wrap app with AuthProvider in layout.tsx
- [ ] Add sign-in button to header
- [ ] Create AuthGuard component
- [ ] Update search component to use useSearch hook
- [ ] Add auth prompts for protected features
- [ ] Create user profile dropdown
- [ ] Create saved searches page
- [ ] Create collections management page

### Phase 5: Polish
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add toast notifications
- [ ] Test authentication flow
- [ ] Test protected routes
- [ ] Performance optimization
- [ ] Mobile responsiveness

---

## File Structure

```
next-server/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts ✅
│   │   ├── search/route.ts
│   │   ├── themes/route.ts
│   │   ├── verse-of-the-day/route.ts
│   │   ├── suggested-queries/route.ts
│   │   ├── ai/
│   │   │   ├── analyze/route.ts
│   │   │   ├── explain/route.ts
│   │   │   └── chat/route.ts
│   │   └── user/
│   │       ├── saved-searches/route.ts
│   │       └── collections/route.ts
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   └── signout/page.tsx
│   ├── layout.tsx (wrap with AuthProvider)
│   └── page.tsx (connect to APIs)
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthGuard.tsx
│   │   │   └── SignInButton.tsx
│   │   └── search/
│   │       └── SmartSearch.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useSearch.ts
│   │   └── useAuth.ts
│   ├── lib/
│   │   ├── auth.config.ts ✅
│   │   ├── prisma.ts ✅
│   │   ├── qdrant.ts (enhance)
│   │   └── smart-search.ts (new)
│   ├── auth.ts ✅
│   └── types/
│       └── index.ts (already has types)
├── middleware.ts
├── prisma/
│   └── schema.prisma ✅
└── plans/
    ├── auth-api-implementation-plan.md ✅
    └── query-api-feature-plan.md (this file)
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://rahmandayub:Rahasiajokowi@localhost:5432/test"

# NextAuth
NEXTAUTH_URL="http://localhost:4000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI (for AI features)
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="coder-model"
OPENAI_BASE_URL="https://qwen.alitlab.com/v1"

# Qdrant
QDRANT_HOST="localhost"
QDRANT_PORT="6335"
QDRANT_COLLECTION_NAME="quran_verses"

# Ollama (for embeddings)
OLLAMA_HOST="http://localhost:11434"
OLLAMA_EMBEDDING_MODEL="qwen3-embedding:0.6b"
EMBEDDING_DIMENSION=1024
```

---

## Security Considerations

1. **Rate Limiting:** Implement on all endpoints (100/hr guest, 500/hr auth)
2. **Input Validation:** Sanitize all user inputs
3. **Password Hashing:** Use bcrypt with salt rounds ≥ 10
4. **JWT Secrets:** Generate strong random secret for NextAuth
5. **CORS:** Configure properly for production
6. **HTTPS:** Required for production
7. **Session Security:** Use HTTP-only cookies

---

## Performance Considerations

1. **Embedding Caching:** Cache common query embeddings
2. **Themes Caching:** Cache theme aggregation (24h revalidation)
3. **Verse of Day:** Deterministic, no caching needed
4. **Response Pagination:** Limit default results, use offset for more
5. **React Query:** Use for frontend caching and revalidation

---

## Testing Strategy

### Unit Tests
- Test filter mapping logic
- Test verse formatting functions
- Test deterministic verse-of-the-day calculation
- Test authentication callbacks

### Integration Tests
- Test full search flow with mock Qdrant
- Test error handling for failed embeddings
- Test API response formats
- Test auth flow

### E2E Tests
- Test user search interaction
- Test theme card clicks
- Test sign-in/sign-out flow
- Test protected route access
- Test mobile responsiveness
