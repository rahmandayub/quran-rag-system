# Frontend Rebuild & Backend API Plan

## Overview

Transform the Quran RAG application from a chatbot interface to a **smart query knowledge platform** based on the design in [`docs/new_design.jsx`](docs/new_design.jsx:1) and concept in [`docs/new-idea.md`](docs/new-idea.md:1).

**Philosophy:** Not a chatbot — this is a *knowledge lens*. The metaphor is a **scholarly reading room**, not a chat window.

---

## Phase 1: Archive Old Components

### 1.1 Archive Legacy Files

Move old chatbot components to archive directory:

| Source | Destination |
|--------|-------------|
| `next-server/app/page.tsx` | `next-server/app/archive/page.tsx` |
| `next-server/src/components/chat/` | `next-server/app/archive/components-chat/` |

**Files to archive:**
- [`next-server/app/page.tsx`](next-server/app/page.tsx:1) - Old chatbot homepage
- [`next-server/src/components/chat/ChatInput.tsx`](next-server/src/components/chat/ChatInput.tsx:1)
- [`next-server/src/components/chat/ChatMessage.tsx`](next-server/src/components/chat/ChatMessage.tsx:1)
- [`next-server/src/components/chat/VerseCard.tsx`](next-server/src/components/chat/VerseCard.tsx:1)
- [`next-server/src/components/chat/VerseCardSkeleton.tsx`](next-server/src/components/chat/VerseCardSkeleton.tsx:1)
- [`next-server/src/components/chat/ReferencePanel.tsx`](next-server/src/components/chat/ReferencePanel.tsx:1)
- [`next-server/src/components/chat/FullSurahView.tsx`](next-server/src/components/chat/FullSurahView.tsx:1)
- [`next-server/src/components/chat/LanguageSwitcher.tsx`](next-server/src/components/chat/LanguageSwitcher.tsx:1)
- [`next-server/src/components/chat/LazyVerseCard.tsx`](next-server/src/components/chat/LazyVerseCard.tsx:1)

---

## Phase 2: New Frontend Architecture

### 2.1 Homepage (`next-server/app/page.tsx`)

**Based on:** [`docs/new_design.jsx`](docs/new_design.jsx:335)

**Components:**
1. **Hero Section**
   - Qur'anic ayah display (establishes spiritual tone)
   - Title: "Explore the Qur'an with depth and clarity"
   - Subtitle explaining the platform

2. **Smart Search Bar**
   - Prominent inquiry field (not chat prompt)
   - Focus filter chips: [All] [Verses] [Tafsir] [Da'wah] [Thematic]
   - Search button with arrow icon

3. **Suggested Queries**
   - Horizontal scrollable pills
   - Examples: "Invite non-Muslims gently", "Verses on Tawhid", "Kindness in the Qur'an"

4. **Explore by Theme Section**
   - Grid of theme cards (2-5 columns responsive)
   - Each card: Arabic theme name, English name, description, verse count
   - Themes: Faith, Mercy, Hereafter, Da'wah, Ethics, Patience

5. **Verse of the Day Panel**
   - Teal gradient background panel
   - Arabic text, translation, reference
   - Action buttons: Read Tafsir, Related Verses, Use in Da'wah

6. **Scholar's Toolkit Section**
   - Thematic Explorer
   - Tafsir Comparator
   - Da'wah Builder

7. **Results Preview** (when search active)
   - Verse cards with Arabic, translation, reference, theme
   - "Explore tafsir" link

### 2.2 New Component Structure

```
next-server/src/components/
├── smart-query/
│   ├── SearchBar.tsx              # Main search input with filters
│   ├── SearchFilters.tsx          # Filter chip components
│   ├── SuggestedQueries.tsx       # Horizontal pill suggestions
│   ├── VerseCard.tsx              # New verse result card
│   ├── VerseCardSkeleton.tsx      # Loading skeleton
│   ├── ThemeCard.tsx              # Theme exploration card
│   ├── ThemeGrid.tsx              # Grid layout for themes
│   ├── VerseOfTheDay.tsx          # Daily verse panel
│   ├── ScholarToolkit.tsx         # Toolkit section
│   └── ResultsPreview.tsx         # Search results display
├── layout/
│   ├── Header.tsx                 # Top navigation
│   ├── Footer.tsx                 # Footer with Arabic text
│   ├── MobileNav.tsx              # Mobile drawer navigation
│   └── MobileBar.tsx              # Mobile bottom navigation
└── shared/
    ├── ArabicText.tsx             # Arabic text renderer
    ├── SectionHeader.tsx          # Reusable section header
    └── LoadingSpinner.tsx         # Loading indicator
```

### 2.3 Visual Style (from [`docs/new-idea.md`](docs/new-idea.md:62))

| Element | Specification |
|---------|---------------|
| **Typography** | Lateef (Arabic), Cormorant Garamond (Latin) |
| **Palette** | Warm vellum background, Deep teal, Burnished gold |
| **Atmosphere** | Illuminated manuscript meets modern research archive |
| **Motion** | Gentle staggered fade-ins |
| **Tone** | Calm, trustworthy, reverent |

### 2.4 Responsive Breakpoints

- **Desktop (>900px):** Full navigation, 5-column theme grid
- **Tablet (640-900px):** Hidden nav links, 3-4 column grid
- **Mobile (<640px):** Hamburger menu, 2-column grid, bottom nav bar

---

## Phase 3: Backend API Updates

### 3.1 New API Endpoints

#### GET `/api/search`
**Purpose:** Smart query search with filters

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
  limit?: number;
}
```

**Response:**
```typescript
interface SearchResponse {
  results: {
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
    main_themes: string[];
    primary_theme: string;
    tafsir_text?: string;
    score: number;
  }[];
  query: string;
  total: number;
}
```

#### GET `/api/themes`
**Purpose:** List all available themes with counts

**Response:**
```typescript
interface Theme {
  arabic: string;
  name: string;
  desc: string;
  count: number;
  slug: string;
}

interface ThemesResponse {
  themes: Theme[];
}
```

#### GET `/api/verse-of-the-day`
**Purpose:** Get daily featured verse

**Response:**
```typescript
interface VerseOfTheDayResponse {
  verse_key: string;
  arabic_text: string;
  translation: string;
  chapter_name: string;
  juz: number;
  revelation_place: 'Makkah' | 'Madinah';
  tafsir_text?: string;
  themes: string[];
}
```

#### GET `/api/suggested-queries`
**Purpose:** Get suggested search queries

**Response:**
```typescript
interface SuggestedQueriesResponse {
  queries: string[];
}
```

### 3.2 Update Existing API

#### POST `/api/chat` → `/api/query`
**Purpose:** Rename and refactor for smart query (not chat)

**Changes:**
- Remove chat history context
- Focus on single query → results
- Return structured verse results, not conversational answer
- Add filter support

### 3.3 Qdrant Query Updates

Update [`next-server/src/lib/qdrant.ts`](next-server/src/lib/qdrant.ts:1) to support:

1. **Theme-based filtering:**
```typescript
async function searchByTheme(themes: string[], limit: number)
```

2. **Focus-based filtering:**
```typescript
async function searchWithFocus(
  query: string,
  focus: 'verses' | 'tafsir' | 'thematic',
  limit: number
)
```

3. **Multi-field search:**
```typescript
async function smartSearch(
  query: string,
  filters: SearchFilters,
  limit: number
)
```

### 3.4 Query Expander Updates

Update [`next-server/src/lib/query-expander.ts`](next-server/src/lib/query-expander.ts:1) for:
- Theme extraction from queries
- Arabic query detection
- Intent classification (da'wah, study, reference)

---

## Phase 4: State Management

### 4.1 Search State

```typescript
interface SearchState {
  query: string;
  filters: SearchFilters;
  results: SearchResult[] | null;
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}
```

### 4.2 Theme State

```typescript
interface ThemeState {
  themes: Theme[];
  selectedTheme: string | null;
  isLoading: boolean;
}
```

---

## Phase 5: Implementation Order

### Week 1: Foundation
1. ✅ Archive old components
2. ✅ Create new component structure
3. ✅ Implement layout components (Header, Footer, MobileNav)
4. ✅ Create shared components (ArabicText, SectionHeader)

### Week 2: Core Features
5. ✅ Implement SearchBar with filters
6. ✅ Implement ThemeCard and ThemeGrid
7. ✅ Implement VerseCard (new design)
8. ✅ Implement VerseOfTheDay panel

### Week 3: Backend Integration
9. ✅ Create new API endpoints
10. ✅ Update Qdrant client for smart search
11. ✅ Connect frontend to backend
12. ✅ Implement loading states and error handling

### Week 4: Polish
13. ✅ Responsive design refinement
14. ✅ Animation and transitions
15. ✅ Performance optimization
16. ✅ Accessibility audit

---

## File Checklist

### To Create
- [ ] `next-server/app/archive/` directory
- [ ] `next-server/src/components/smart-query/SearchBar.tsx`
- [ ] `next-server/src/components/smart-query/SearchFilters.tsx`
- [ ] `next-server/src/components/smart-query/SuggestedQueries.tsx`
- [ ] `next-server/src/components/smart-query/VerseCard.tsx`
- [ ] `next-server/src/components/smart-query/VerseCardSkeleton.tsx`
- [ ] `next-server/src/components/smart-query/ThemeCard.tsx`
- [ ] `next-server/src/components/smart-query/ThemeGrid.tsx`
- [ ] `next-server/src/components/smart-query/VerseOfTheDay.tsx`
- [ ] `next-server/src/components/smart-query/ScholarToolkit.tsx`
- [ ] `next-server/src/components/smart-query/ResultsPreview.tsx`
- [ ] `next-server/src/components/layout/Header.tsx`
- [ ] `next-server/src/components/layout/Footer.tsx`
- [ ] `next-server/src/components/layout/MobileNav.tsx`
- [ ] `next-server/src/components/layout/MobileBar.tsx`
- [ ] `next-server/src/components/shared/ArabicText.tsx`
- [ ] `next-server/src/components/shared/SectionHeader.tsx`
- [ ] `next-server/src/components/shared/LoadingSpinner.tsx`
- [ ] `next-server/app/api/search/route.ts`
- [ ] `next-server/app/api/themes/route.ts`
- [ ] `next-server/app/api/verse-of-the-day/route.ts`
- [ ] `next-server/app/api/suggested-queries/route.ts`

### To Update
- [ ] `next-server/app/page.tsx` - New homepage
- [ ] `next-server/app/layout.tsx` - Add new fonts
- [ ] `next-server/src/lib/qdrant.ts` - Smart search methods
- [ ] `next-server/src/lib/query-expander.ts` - Theme extraction
- [ ] `next-server/src/types/index.ts` - Already updated ✅
- [ ] `next-server/app/globals.css` - New styles

### To Archive
- [ ] `next-server/app/page.tsx` (old)
- [ ] `next-server/src/components/chat/` (entire directory)

---

## Architecture Diagram

```mermaid
graph TD
    A[User Lands on Homepage] --> B{Has searched before?}
    B -->|No| C[Show Hero + Search + Suggestions]
    B -->|Yes| D[Show Results Preview]
    
    C --> E[User Types Query]
    E --> F[Smart Search API]
    
    F --> G{Query Type?}
    G -->|Theme-based| H[Filter by Theme]
    G -->|Arabic text| I[Exact Arabic match]
    G -->|English question| J[Semantic search]
    G -->|Da'wah intent| K[Filter by audience_group]
    
    H --> L[Qdrant Search]
    I --> L
    J --> L
    K --> L
    
    L --> M[Return Verse Cards]
    M --> N[Display Results]
    
    N --> O{User Action?}
    O -->|Click theme| P[Navigate to Theme Explorer]
    O -->|Click tafsir| Q[Show Tafsir Panel]
    O -->|New search| E
    
    subgraph Components
        R[Header]
        S[SearchBar]
        T[ThemeGrid]
        U[VerseOfTheDay]
        V[Footer]
    end
    
    subgraph API
        W[/api/search]
        X[/api/themes]
        Y[/api/verse-of-the-day]
        Z[/api/suggested-queries]
    end
```

---

## Next Steps

1. **Review and approve this plan**
2. **Switch to Code mode** for implementation
3. **Start with Phase 1** (Archive old components)
4. **Proceed through phases sequentially**
