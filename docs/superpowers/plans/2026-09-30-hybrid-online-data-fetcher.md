# Hybrid Online Social Data Fetcher & Rate Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a zero-cost hybrid online data fetcher for Instagram and TikTok public profiles with automatic database persistence, resilient fallback, and commercial Rate Card estimation.

**Architecture:** Implement modular providers (`PublicScraperProvider`, `RapidApiProvider`, `SimulatedProvider`) governed by an orchestrator (`CompositeSocialDataProvider`) using Chain of Responsibility. Integrate a dedicated `RateCardCalculator` domain service into the analytics pipeline and update controller endpoints and frontend displays.

**Tech Stack:** Node.js, Express, TypeScript (NodeNext), PostgreSQL, Prisma ORM, Axios/Native Fetch with stealth headers, Cheerio, React + Vite, Tailwind CSS.

## Global Constraints
- Target MVP cost is Rp0 (no paid external subscription required to function).
- Resilient error handling: scraper failures or rate-limits (HTTP 429/403) must never crash the server or throw uncaught exceptions to the client.
- Strict WCAG accessibility, high-contrast, zero-slop UI aesthetics.
- Maintain existing database schema consistency.

---

### Task 1: Rate Card Calculator Service (`RateCardCalculator.ts`)
- [ ] Create `backend/src/services/RateCardCalculator.ts`.
- [ ] Implement tier classification (Nano, Micro, Mid, Macro, Mega based on follower counts).
- [ ] Implement ER quality multiplier (ER < 1.5% -> 0.8x, 1.5-3.5% -> 1.0x, 3.5-6% -> 1.25x, > 6% -> 1.5x).
- [ ] Implement deliverables calculation (Story, Feed Post, Reel/TikTok Video) with low, mid, high IDR price formatting.
- [ ] Add unit test / verification script to confirm calculation correctness for sample tiers.

### Task 2: Public Scraper Provider (`PublicScraperProvider.ts`)
- [ ] Create `backend/src/services/PublicScraperProvider.ts` implementing `ISocialDataProvider`.
- [ ] Implement TikTok public profile scraper:
  - Fetch `https://www.tiktok.com/@${username}` with modern browser headers.
  - Parse `__UNIVERSAL_DATA_FOR_REHYDRATION__` / `SIGI_STATE` or metadata tags for follower count, avatar, and recent video stats.
- [ ] Implement Instagram public scraper:
  - Fetch profile using public OpenGraph meta tags and public endpoint fallback.
  - Extract followers count and fallback post metrics.
- [ ] Gracefully return `null` on network errors, CAPTCHA, or HTTP 429 so caller can proceed to fallback.

### Task 3: RapidAPI Provider (`RapidApiProvider.ts`) & Composite Orchestrator
- [ ] Create `backend/src/services/RapidApiProvider.ts` implementing `ISocialDataProvider` (checks for `process.env.RAPIDAPI_KEY`).
- [ ] Update `backend/src/services/SocialDataProvider.ts` to export `CompositeSocialDataProvider`:
  - Sequence: DB Cache (<24h) -> RapidAPI (if key present) -> Public Scraper -> Simulated Fallback.
  - Tag data source properly (`source: 'API' | 'SCRAPED' | 'CACHED' | 'SIMULATED'`).

### Task 4: Controller & API Route Integration
- [ ] Wire `CompositeSocialDataProvider` into `backend/src/controllers/accountController.ts`.
- [ ] Attach `rateCard` estimation to `calculateAndSave` in `backend/src/controllers/analyticsController.ts` and `searchAccount`.
- [ ] Update database persistence to upsert live posts and snapshots smoothly without duplicates.

### Task 5: Frontend UI Enhancement (Rate Card Card & Live Data Badge)
- [ ] Update account view / analytics card in `frontend/src/` to display:
  - Live data status badge (🟢 LIVE / 🟡 CACHED / 🟣 SIMULATED).
  - Estimated Rate Card component showing formatted IDR pricing (Feed, Story, Video) with tier tag and ER multiplier notice.
- [ ] Verify full build and end-to-end functionality via browser.
