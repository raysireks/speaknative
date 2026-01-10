# Next Steps: Phase 3 - Smart Caching & Just-in-Time Translation

## Context
We have transitioned from a static "Library" model to a dynamic "Smart Cache" model for translations.
- **Current State:** Database seeded with ~100 base phrases (tiered difficulty). `usage_count` initialized to 0. `getSimilarPhrases` is read-only.
- **Goal:** Allow the database to grow organically based on user requests ("Direct Translation"), using `usage_count` to prioritize local caching.

## High-Priority Tasks

### 1. Backend: Direct Translation Function
**Type:** Server-Side Cloud Function
- **Constraint:** ALL logic must run server-side. Client only sends `{ text, userLocale, targetLocale }`.
- **Logic Workflow:**
    1. Check **User Locale** for input text match (exact or semantic).
    2. **If User Phrase Missing:** Generate embedding -> Add to DB (User Locale) -> Use new embedding.
    3. **Query Target:** Use embedding to find Nearest Neighbor in **Target Locale**.
    4. **If Found:** Return existing phrase + increment `usage_count` (Atomic +1).
    5. **If Missing:** Call Gemini to translate (Common + Slang) -> Store in DB (Target Locale) -> Return new phrase + init `usage_count: 1`.
- **Requirement:** Ensure slang variants are handled in generation.

### 2. Backend: Cache Warming Cron Job
**Type:** Scheduled Cloud Function (Weekly)
- Create `rebuildGlobalCache` Scheduled Function.
- **Logic:**
    1. Fetch top 100 phrases by `usage_count` for each supported locale.
    2. **Vector Join:** For each phrase, run parallel `findNearest` searches to find variants/translations in all other locales.
    3. **Assemble:** Create a optimized JSON object: `{ locale: "es-CO", top_phrases: [ { text, translation, variants: [...] } ] }`.
    4. **Store:** Save to a static `cache_top_phrases` collection (read count = 1 to fetch list).
- **Goal:** Expensive "Vector Joins" happen only once/week. Frontend downloads single static doc.

### 3. Frontend: Caching & UI
**Type:** Client-Side
- Update `phrase-adapter.ts` to fetch "Top N" by `usage_count` on load.
- Implement local caching (localStorage/IndexedDB).
- Add Search/Translate input component connected to `translatePhrase`.

### 4. Verification & Cleanup
- **Do Not Run:** `scripts/DO_NOT_RUN_seed_database.ts`.
- **Monitor:** Check Firestore `usage_count` updates to ensure they only happen on direct translation.
