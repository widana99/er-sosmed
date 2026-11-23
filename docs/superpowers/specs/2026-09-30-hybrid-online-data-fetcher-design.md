# Design Spec: Hybrid Online Social Data Fetcher & Rate Card Estimator

**Date:** 2026-09-30
**Status:** Approved
**Scope:** Backend Data Ingestion Engine & Rate Card Estimator Integration

---

## 1. Goal & Requirements
1. Allow users to search any Instagram or TikTok `@username` and retrieve profile metrics (followers, following, avatar, bio) and recent post data (likes, comments, views, shares).
2. Follow a **Hybrid Zero-Cost Architecture**:
   - Zero required external subscription: Works out of the box using public open scraper endpoints and stealth headers.
   - Optional RapidAPI support: If `RAPIDAPI_KEY` is specified in `.env`, prioritize it for stability.
   - Robust Fallback: If network blocks or rate limits occur (HTTP 429), gracefully fall back to cached database data or simulated fallback with clear badge attribution (`source: 'API' | 'SCRAPED' | 'CACHED' | 'SIMULATED'`).
3. Calculate Engagement Rate (ER) and estimated commercial **Rate Card** ranges (Feed, Story, Reels/TikTok Video).
4. Persist newly fetched live accounts, snapshots, and posts directly to PostgreSQL via Prisma to minimize network calls.

---

## 2. Architecture & Components

```text
ISocialDataProvider
  ├── RapidApiSocialDataProvider (Priority 1 if RAPIDAPI_KEY present)
  ├── PublicScraperSocialDataProvider (Priority 2, direct zero-cost scraping)
  └── SimulatedDataProvider (Fallback if blocked or offline)

CompositeSocialDataProvider (Orchestrator)
  ├── Checks DB cache (< 24h old)
  ├── Calls Providers sequentially until success
  └── Persists new results into PostgreSQL

RateCardCalculator
  ├── Determines Influencer Tier (Nano, Micro, Mid, Macro, Mega)
  ├── Calculates ER Quality Multiplier
  └── Computes Low, Mid, High rate card estimates for deliverables
```

---

## 3. Interfaces & Data Models

### NormalizedAccountData
```typescript
export interface NormalizedAccountData {
  platform: 'INSTAGRAM' | 'TIKTOK';
  username: string;
  displayName: string;
  avatarUrl?: string;
  profileUrl?: string;
  accountType?: string;
  followers: number;
  following: number;
  postsCount: number;
  source: 'MANUAL' | 'SIMULATED' | 'CSV_IMPORT' | 'API' | 'SCRAPED';
  posts: Array<{
    likes: number;
    comments: number;
    views?: number | null;
    shares?: number | null;
    saves?: number | null;
    reach?: number | null;
    caption?: string;
    postUrl?: string;
    postedAt: Date;
  }>;
}
```

### RateCardResult
```typescript
export interface RateCardItem {
  deliverable: 'FEED_POST' | 'REEL_OR_TIKTOK' | 'STORY';
  label: string;
  priceLow: number;
  priceMid: number;
  priceHigh: number;
  currency: 'IDR';
  formattedMid: string;
  formattedRange: string;
}

export interface RateCardEstimation {
  tier: 'NANO' | 'MICRO' | 'MID' | 'MACRO' | 'MEGA';
  tierLabel: string;
  qualityMultiplier: number;
  erAssessment: 'LOW' | 'AVERAGE' | 'HIGH' | 'EXCELLENT';
  deliverables: RateCardItem[];
}
```

---

## 4. Verification & Testing
- Unit & integration testing for `PublicScraperSocialDataProvider` and `RateCardCalculator`.
- End-to-end lookup test via `/api/accounts/search` with live public usernames.
- Verify `npm run build` and zero TypeScript errors (`tsc --noEmit`).
