# Authentication & API Implementation Plan

## Overview

This document outlines the implementation plan for the QuranInsight smart query platform with **tiered access control**:
- **Guest users**: Basic RAG-based search (vector similarity search)
- **Authenticated users**: Advanced AI features (LLM-powered analysis, smart explanations, contextual conversations)

---

## Architecture

```mermaid
flowchart TB
    subgraph Frontend
        A[HomePage]
        B[Auth Provider]
        C[Sign In Modal]
    end
    
    subgraph Public APIs
        D[GET /api/search]
        E[GET /api/themes]
        F[GET /api/verse-of-the-day]
        G[GET /api/suggested-queries]
    end
    
    subgraph Protected APIs
        H[POST /api/ai/analyze]
        I[POST /api/ai/explain]
        J[POST /api/ai/chat]
    end
    
    subgraph Auth
        K[NextAuth.js]
        L[Credentials Provider]
        M[Google OAuth]
    end
    
    subgraph Backend
        N[Qdrant Client]
        O[OpenAI Client]
        P[Embedding Service]
    end
    
    subgraph Data
        Q[(Qdrant Vector DB)]
        R[(Database - Users)]
    end
    
    A --> B
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    A --> J
    
    B --> K
    K --> L
    K --> M
    K --> R
    
    D --> N
    E --> N
    F --> N
    G --> N
    
    H --> O
    I --> O
    J --> O
    
    N --> P
    N --> Q
```

---

## Feature Tiers

### Guest Access (No Login Required)

| Feature | Description |
|---------|-------------|
| **Smart Search** | Vector-based semantic search with filters |
| **Theme Exploration** | Browse Quranic themes with verse counts |
| **Verse of the Day** | Daily featured verse |
| **Suggested Queries** | Pre-defined search suggestions |
| **Basic Filters** | Filter by juz, revelation place, surah |

### Authenticated Users (Login Required)

| Feature | Description |
|---------|-------------|
| **AI Analysis** | LLM-powered deep analysis of verses |
| **Smart Explanations** | Contextual explanations with tafsir |
| **Conversational AI** | Multi-turn conversations about Quran |
| **Thematic Insights** | AI-generated theme connections |
| **Da'wah Builder** | AI-assisted presentation creation |
| **Saved Searches** | Save and organize search history |
| **Custom Collections** | Create personal verse collections |

---

## Authentication System

### Provider: NextAuth.js (Auth.js)

**Why NextAuth.js:**
- Built for Next.js App Router
- Supports multiple providers out of the box
- Session management built-in
- Easy API route protection
- TypeScript support

### Authentication Providers

```typescript
// next-server/auth.config.ts
export const authConfig = {
  providers: [
    // 1. Credentials Provider (Email/Password)
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        // Validate against database
        // Return user object or null
      }
    }),
    
    // 2. Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
    
    // 3. GitHub OAuth (optional)
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    })
  ],
  
  // Session strategy
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Pages
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  
  // Callbacks
  callbacks: {
    async jwt({ token, user, account }) {
      // Add user role to token
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add role to session
      session.user.role = token.role;
      return session;
    }
  }
};
```

### User Schema

```typescript
// src/types/auth.ts
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'user' | 'premium' | 'admin';
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: 'user' | 'premium' | 'admin';
  };
  expires: string;
}
```

### Database Schema (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  password      String?   // Hashed password for credentials provider
  role          Role      @default(USER)
  accounts      Account[]
  sessions      Session[]
  savedSearches SavedSearch[]
  collections   Collection[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Role {
  USER
  PREMIUM
  ADMIN
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model SavedSearch {
  id        String   @id @default(cuid())
  userId    String
  query     String
  filters   Json?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Collection {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  verses      Json     // Array of verse_keys
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## API Endpoints

### Public Endpoints (Guest Access)

#### 1. GET /api/search

**Access:** Public (no auth required)

**Request:**
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
  limit?: number; // default: 10, max: 20 for guests
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
    translation: string;
    score: number;
    primary_theme: string;
  }[];
  processing_time_ms: number;
}
```

**Rate Limits:**
- Guests: 100 requests/hour
- Authenticated: 500 requests/hour

---

#### 2. GET /api/themes

**Access:** Public

**Response:**
```typescript
interface ThemesResponse {
  success: boolean;
  themes: {
    name: string;
    arabic: string;
    count: number;
  }[];
}
```

---

#### 3. GET /api/verse-of-the-day

**Access:** Public

**Response:**
```typescript
interface VerseOfDayResponse {
  success: boolean;
  verse: {
    verse_key: string;
    arabic_text: string;
    translation: string;
    chapter_name: string;
    primary_theme: string;
  };
}
```

---

#### 4. GET /api/suggested-queries

**Access:** Public

**Response:**
```typescript
interface SuggestedQueriesResponse {
  success: boolean;
  queries: string[];
}
```

---

### Protected Endpoints (Auth Required)

#### 5. POST /api/ai/analyze

**Access:** Authenticated users only

**Purpose:** Deep AI analysis of verses with tafsir and contextual insights

**Request:**
```typescript
interface AnalyzeRequest {
  verse_key: string;
  aspects?: ('tafsir' | 'historical_context' | 'practical_application' | 'linguistic')[];
  language?: 'id' | 'en' | 'ar';
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
    related_verses: string[];
  };
  processing_time_ms: number;
}
```

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
}
```

**Response:**
```typescript
interface ExplainResponse {
  success: boolean;
  explanation: string;
  references: VerseReference[];
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
}
```

**Response:** (Streaming)
```typescript
interface ChatStreamResponse {
  type: 'chunk' | 'complete' | 'error' | 'references';
  content?: string;
  answer?: string;
  references?: VerseReference[];
  conversation_id?: string;
}
```

---

#### 8. GET /api/user/saved-searches

**Access:** Authenticated users only

**Purpose:** Get user's saved search history

---

#### 9. POST /api/user/collections

**Access:** Authenticated users only

**Purpose:** Create/save verse collections

---

## Middleware & Route Protection

### Next.js Middleware

```typescript
// next-server/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Add custom logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Public paths
        const publicPaths = [
          '/auth/signin',
          '/auth/signout',
          '/api/search',
          '/api/themes',
          '/api/verse-of-the-day',
          '/api/suggested-queries',
        ];
        
        if (publicPaths.some(p => path.startsWith(p))) {
          return true;
        }
        
        // Protected API paths
        const protectedPaths = ['/api/ai/', '/api/user/'];
        if (protectedPaths.some(p => path.startsWith(p))) {
          return !!token;
        }
        
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/api/:path*', '/auth/:path*'],
};
```

### API Route Protection Helper

```typescript
// src/lib/auth-helpers.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    };
  }
  
  return {
    authenticated: true,
    session,
  };
}

export async function requireRole(roles: ('user' | 'premium' | 'admin')[]) {
  const auth = await requireAuth();
  
  if (!auth.authenticated) {
    return auth;
  }
  
  const userRole = (auth.session.user as any).role || 'user';
  
  if (!roles.includes(userRole)) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    };
  }
  
  return auth;
}
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

### Protected UI Components

```typescript
// src/components/auth/AuthGuard.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, fallback, requireAuth = false }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div>
        <p>This feature requires authentication.</p>
        <button onClick={() => signIn()}>Sign In</button>
      </div>
    );
  }
  
  return <>{children}</>;
}
```

### Search Component with Auth

```typescript
// src/components/search/SmartSearch.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function SmartSearch() {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSearch = async () => {
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 10 }),
      });
      
      const data = await res.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAIAnalysis = async (verseKey: string) => {
    if (!isAuthenticated) {
      // Show sign-in prompt
      return;
    }
    
    // Call protected AI endpoint
    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verse_key: verseKey }),
    });
  };
  
  return (
    <div>
      {/* Search UI */}
      {!isAuthenticated && (
        <div className="auth-prompt">
          <p>Sign in for AI-powered analysis and advanced features</p>
          <button onClick={() => signIn()}>Sign In</button>
        </div>
      )}
    </div>
  );
}
```

---

## Implementation Checklist

### Phase 1: Authentication Setup
- [ ] Install NextAuth.js and dependencies
- [ ] Set up Prisma with database
- [ ] Create auth configuration
- [ ] Create auth API routes (`/api/auth/[...nextauth]`)
- [ ] Create sign-in/sign-out pages
- [ ] Add middleware for route protection
- [ ] Create AuthContext provider

### Phase 2: Public APIs
- [ ] Enhance Qdrant client with filtered search
- [ ] Create `/api/search` endpoint (public)
- [ ] Create `/api/themes` endpoint (public)
- [ ] Create `/api/verse-of-the-day` endpoint (public)
- [ ] Create `/api/suggested-queries` endpoint (public)
- [ ] Add rate limiting

### Phase 3: Protected APIs
- [ ] Create `/api/ai/analyze` endpoint (protected)
- [ ] Create `/api/ai/explain` endpoint (protected)
- [ ] Create `/api/ai/chat` endpoint (protected, streaming)
- [ ] Create `/api/user/saved-searches` endpoint (protected)
- [ ] Create `/api/user/collections` endpoint (protected)

### Phase 4: Frontend Integration
- [ ] Wrap app with AuthProvider
- [ ] Add sign-in button to header
- [ ] Create AuthGuard component
- [ ] Update search component with auth prompts
- [ ] Add user profile dropdown
- [ ] Connect all APIs to frontend

### Phase 5: Polish
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add toast notifications
- [ ] Test authentication flow
- [ ] Test protected routes
- [ ] Performance optimization

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/quraninsight"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Optional: GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# OpenAI (for AI features)
OPENAI_API_KEY="your-openai-api-key"

# Qdrant
QDRANT_HOST="localhost"
QDRANT_PORT="6335"
QDRANT_COLLECTION_NAME="quran_verses"

# Ollama (for embeddings)
OLLAMA_HOST="localhost"
OLLAMA_PORT="11434"
```

---

## Security Considerations

1. **Password Hashing:** Use bcrypt for credentials provider
2. **JWT Secrets:** Generate strong random secret for NextAuth
3. **Rate Limiting:** Implement on all endpoints
4. **Input Validation:** Sanitize all user inputs
5. **CORS:** Configure properly for production
6. **HTTPS:** Required for production
7. **Session Security:** Use HTTP-only cookies

---

## Future Enhancements

1. **Premium Tier:** Add subscription-based premium features
2. **API Keys:** Allow developers to generate API keys
3. **Two-Factor Auth:** Add 2FA for enhanced security
4. **Social Sharing:** Allow sharing collections publicly
5. **Analytics Dashboard:** Track usage and popular searches
