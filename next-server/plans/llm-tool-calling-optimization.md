# LLM Tool Calling Optimization Plan

## Overview

This plan optimizes the Quran chat assistant for handling complex multi-entity queries (e.g., "apa perbedaan iblis, jin, malaikat dan manusia") using OpenAI's parallel tool calling capabilities.

## Architecture Decision

**Approach**: LLM-Decides with Parallel Tool Calling

Let the LLM automatically:
1. Detect entities in comparative queries
2. Decide how many tool calls are needed
3. Expand each entity query with relevant terms
4. Call tools in parallel (single round trip)

**Cost**: Fixed at 2 API calls regardless of entity count

## Optimization Changes

### 1. Enhanced Tool Description

**File**: [`src/lib/query-expander.ts`](src/lib/query-expander.ts:84)

**Current**:
```typescript
description: 'Search for relevant Quran verses based on a topic or question. ONLY use this tool when the user asks about Islamic teachings, Quranic concepts, or topics that require verse references. Do NOT use for casual conversation, greetings, or acknowledgments like "thank you".',
```

**Optimized**:
```typescript
description: 'Search for relevant Quran verses based on a topic, entity, or question. For comparative questions (e.g., "difference between X and Y"), you should call this tool multiple times - once for each entity. Expand each query with related terms for better search results. Examples: For "iblis", expand to "iblis creation arrogance disobedience first sin"; For "malaikat", expand to "malaikat angels creation obedience worship". Do NOT use for casual conversation, greetings, or acknowledgments.',
```

**Rationale**: Explicitly tells LLM to call the tool multiple times for comparative queries and provides query expansion examples.

---

### 2. Enhanced Parameter Descriptions

**File**: [`src/lib/query-expander.ts`](src/lib/query-expander.ts:91)

**Current**:
```typescript
expandedQuery: {
  type: 'string',
  description: 'Expanded query with related Islamic/Quranic terms. For example, if the user asks about "patience", expand to include "sabr, perseverance, endurance, trials, patience in hardship".'
},
```

**Optimized**:
```typescript
expandedQuery: {
  type: 'string',
  description: 'Expanded query with related Islamic/Quranic terms. For single topics: expand with synonyms and related concepts. For entities (iblis, jin, malaikat, manusia, nabi, rasul): include creation, nature, characteristics, and key stories. Example: "iblis" → "iblis creation arrogance disobedience first sin adam refusal sajda"'
},
originalQuery: {
  type: 'string',
  description: 'The original user query without modification.'
},
intent: {
  type: 'string',
  description: 'The detected intent or topic category. Use "comparative" for questions asking about differences/comparisons between multiple entities. Examples: "patience", "inheritance", "prayer", "comparative", "gratitude".'
},
```

**Rationale**: Provides entity-specific query expansion guidance and introduces "comparative" as a recognized intent type.

---

### 3. Enhanced Tool Result Structure

**File**: [`src/lib/query-expander.ts`](src/lib/query-expander.ts:10)

**Current**:
```typescript
export async function searchQuran(params: {
  expandedQuery: string;
  originalQuery: string;
  intent?: string;
  language?: LanguageCode;
}): Promise<{
  success: boolean;
  verses: string;
  count: number;
  references: VerseReference[];
}>
```

**Optimized**:
```typescript
export async function searchQuran(params: {
  expandedQuery: string;
  originalQuery: string;
  intent?: string;
  language?: LanguageCode;
}): Promise<{
  success: boolean;
  verses: string;
  count: number;
  references: VerseReference[];
  // NEW: Metadata for better LLM synthesis
  searchMetadata: {
    expandedQuery: string;
    intent: string | undefined;
    resultCount: number;
  };
}>
```

**Rationale**: Provides the LLM with metadata about each search for better synthesis of comparative answers.

---

### 4. Explicit Parallel Tool Calls Configuration

**File**: [`app/api/chat/route.ts`](app/api/chat/route.ts:98)

**Current**:
```typescript
const runner = await openai.chat.completions
  .runTools({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: openaiMessages,
    tools: [searchQuranTool],
    stream: true,
    maxChatCompletions: 5,
  })
```

**Optimized**:
```typescript
const runner = await openai.chat.completions
  .runTools({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: openaiMessages,
    tools: [searchQuranTool],
    stream: true,
    maxChatCompletions: 5,
    parallel_tool_calls: true, // Explicit: allow multiple tool calls in parallel
  })
```

**Rationale**: Makes parallel tool calling explicit (already default, but clarity helps future maintainers).

---

### 5. Enhanced System Prompt for Comparative Queries

**File**: [`src/lib/openai.ts`](src/lib/openai.ts:27)

**Add to Indonesian system prompt** (after "KAPAN MENGGUNAKAN TOOL SEARCH QURAN"):

```
PERTANYAAN PERBANDINGAN (COMPARATIVE QUESTIONS):
- Ketika pengguna bertanya tentang "perbedaan X dan Y" atau "perbandingan X dengan Y"
- Panggil tool searchQuran beberapa kali secara paralel - sekali untuk setiap entitas
- Contoh: "Apa perbedaan iblis, jin, malaikat dan manusia?" → Panggil tool 4 kali:
  * searchQuran({expandedQuery: "iblis creation arrogance disobedience first sin", intent: "comparative"})
  * searchQuran({expandedQuery: "jin creation free will belief disbelief smokeless fire", intent: "comparative"})
  * searchQuran({expandedQuery: "malaikat creation obedience worship light no free will", intent: "comparative"})
  * searchQuran({expandedQuery: "manusia creation khalifah free will responsibility trial", intent: "comparative"})
- Setelah semua hasil kembali, sintesis jawaban yang membandingkan karakteristik masing-masing entitas
```

**Add to English system prompt** (after "WHEN TO USE THE SEARCH QURAN TOOL"):

```
COMPARATIVE QUESTIONS:
- When the user asks about "difference between X and Y" or "comparison of X with Y"
- Call the searchQuran tool multiple times in parallel - once for each entity
- Example: "What are the differences between iblis, jin, malaikat, and humans?" → Call tool 4 times:
  * searchQuran({expandedQuery: "iblis creation arrogance disobedience first sin", intent: "comparative"})
  * searchQuran({expandedQuery: "jin creation free will belief disbelief smokeless fire", intent: "comparative"})
  * searchQuran({expandedQuery: "malaikat creation obedience worship light no free will", intent: "comparative"})
  * searchQuran({expandedQuery: "manusia creation khalifah free will responsibility trial", intent: "comparative"})
- After all results return, synthesize an answer comparing the characteristics of each entity
```

**Rationale**: Provides explicit guidance for handling comparative queries with concrete examples.

---

## Implementation Checklist

- [ ] Update tool description in [`src/lib/query-expander.ts`](src/lib/query-expander.ts:88)
- [ ] Enhance parameter descriptions in [`src/lib/query-expander.ts`](src/lib/query-expander.ts:91)
- [ ] Add searchMetadata to return type in [`src/lib/query-expander.ts`](src/lib/query-expander.ts:15)
- [ ] Add `parallel_tool_calls: true` in [`app/api/chat/route.ts`](app/api/chat/route.ts:98)
- [ ] Update Indonesian system prompt in [`src/lib/openai.ts`](src/lib/openai.ts:27)
- [ ] Update English system prompt in [`src/lib/openai.ts`](src/lib/openai.ts:83)
- [ ] Update Arabic system prompt in [`src/lib/openai.ts`](src/lib/openai.ts:138)
- [ ] Test with comparative queries
- [ ] Monitor token usage and API costs

---

## Expected Flow After Optimization

```
User: "Apa perbedaan iblis, jin, malaikat dan manusia?"
         ↓
    [API Call 1: Query → LLM]
         ↓
    LLM Analysis (guided by enhanced description):
    "This is a comparative question. I need to search for 4 entities."
         ↓
    Parallel Tool Calls (single round trip, parallel_tool_calls: true):
    ├─ searchQuran({
    │    expandedQuery: "iblis creation arrogance disobedience first sin adam",
    │    originalQuery: "Apa perbedaan iblis, jin, malaikat dan manusia?",
    │    intent: "comparative"
    │  })
    ├─ searchQuran({
    │    expandedQuery: "jin creation free will belief disbelief smokeless fire",
    │    originalQuery: "Apa perbedaan iblis, jin, malaikat dan manusia?",
    │    intent: "comparative"
    │  })
    ├─ searchQuran({
    │    expandedQuery: "malaikat creation obedience worship light no free will",
    │    originalQuery: "Apa perbedaan iblis, jin, malaikat dan manusia?",
    │    intent: "comparative"
    │  })
    └─ searchQuran({
         expandedQuery: "manusia creation khalifah free will responsibility trial",
         originalQuery: "Apa perbedaan iblis, jin, malaikat dan manusia?",
         intent: "comparative"
       })
         ↓
    Execute All Searches in Parallel (Promise.all)
         ↓
    Results with metadata sent back to LLM
         ↓
    [API Call 2: Results → LLM]
         ↓
    LLM Synthesizes Comparison (guided by system prompt):
    "Pertanyaan yang sangat baik. Mari kita lihat apa yang Al-Qur'an katakan
    tentang masing-masing makhluk ini..."
    [Provides structured comparison with verse references for each entity]
         ↓
    Stream Answer to User
```

---

## Cost Analysis

| Scenario | Before Optimization | After Optimization |
|----------|--------------------|--------------------|
| Simple query ("apa itu sabar") | 2 API calls | 2 API calls |
| Comparative (4 entities) | 2 API calls* | 2 API calls |
| Complex (10 entities) | 2-5 API calls* | 2 API calls |

*Before optimization, the LLM might not call tools in parallel efficiently

**Key Benefit**: Consistent 2 API calls for all query types with parallel tool calling.

---

## Testing Strategy

### Test Queries

1. **Single Entity**:
   - "Apa itu sabar dalam Islam?"
   - "Jelaskan tentang malaikat"

2. **Two-Entity Comparison**:
   - "Apa perbedaan jin dan iblis?"
   - "Perbedaan malaikat dan manusia"

3. **Multi-Entity Comparison**:
   - "Apa perbedaan iblis, jin, malaikat dan manusia?"
   - "Bandingkan nabi dan rasul"

4. **Complex Comparative**:
   - "Apa persamaan dan perbedaan antara jin, iblis, dan syaitan?"
   - "Bagaimana penciptaan malaikat berbeda dengan jin dan manusia?"

### Success Criteria

- [ ] LLM calls tool multiple times for comparative queries
- [ ] Tool calls are parallel (single round trip)
- [ ] Query expansion includes entity-specific terms
- [ ] Answers include verse references for each entity
- [ ] Response is structured as a comparison (not separate answers)
- [ ] Total API calls remain at 2 regardless of entity count

---

## Monitoring

After implementation, monitor:

1. **Token Usage**: Track input/output tokens per query type
2. **API Calls**: Verify consistent 2 API calls for comparative queries
3. **Response Quality**: Ensure comparisons are well-structured
4. **Latency**: Parallel calls should reduce overall latency
5. **Cost**: Track monthly OpenAI costs

---

## Rollback Plan

If issues arise:

1. Revert tool description to original
2. Remove `parallel_tool_calls: true` (reverts to default behavior)
3. Remove comparative guidance from system prompts
4. Keep searchMetadata (backward compatible addition)

---

## Future Enhancements

1. **Entity Tags in Qdrant**: Add entity/topic metadata to verses for more precise filtering
2. **Query Intent Classification**: Pre-classify queries before sending to LLM
3. **Caching**: Cache common entity searches to reduce API calls
4. **Batch Search**: Add optional `entities: string[]` parameter for single tool call with multiple searches
