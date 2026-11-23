# Manual Input, OCR Screenshot Processing, & Advanced ER Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust manual multi-post builder with client-side OCR screenshot extraction, paired with an advanced mathematical analytics engine delivering Median, Min/Max, Distribution, Engagement Rate, and comprehensive Performance Analysis.

**Architecture:** Client-side Tesseract.js processes profile and post screenshots in browser Web Workers for privacy and speed, auto-filling an editable multi-post data grid. The backend Analytics Engine evaluates individual post metrics using rolling statistical formulas to produce Median ER, Min/Max, Quartiles, Distribution buckets, Consistency Score, Comment-to-Like quality ratio, Bot risk analysis, and Fair Rate Card valuations.

**Tech Stack:** TypeScript, Node.js / Express, Prisma, Tesseract.js (frontend client-side worker), React 18, Tailwind CSS (Neo-Glassmorphism), Lucide React, Recharts.

## Global Constraints
- High contrast and accessible UI (WCAG AA compliant).
- Non-AI slop typography: `Syne` (display), `Instrument Sans` (body), `DM Mono` (numeric/metrics).
- Multi-language support (`id`, `en`, `ms`) via `LanguageContext`.
- No cards-in-cards nesting; clean neo-glass frosted aesthetics.
- Mathematical rigor: accurate median calculation, coefficient of variation, and quartile formulas.

---

### Task 1: Mathematical & Statistical Analytics Engine

**Files:**
- Create: `backend/src/services/StatisticsService.ts`
- Modify: `backend/src/services/AnalyticsEngine.ts`
- Test: `backend/src/tests/statisticsService.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ComprehensiveAnalysisResult {
    formulaType: 'FOLLOWER_BASED' | 'VIEW_BASED';
    sampleSize: number;
    followers: number;
    totalLikes: number;
    totalComments: number;
    totalViews: number;
    totalShares: number;
    averageLikes: number;
    averageComments: number;
    averageViews: number;
    averageER: number;
    medianLikes: number;
    medianComments: number;
    medianViews: number;
    medianER: number;
    minER: number;
    maxER: number;
    spreadRange: number;
    quartiles: { q1: number; median: number; q3: number; iqr: number };
    distribution: {
      viralCount: number;
      highCount: number;
      moderateCount: number;
      lowCount: number;
      viralPct: number;
      highPct: number;
      moderatePct: number;
      lowPct: number;
    };
    consistencyScore: number; // 0 - 100%
    commentToLikeRatio: number; // Percentage
    botRisk: 'LOW' | 'MODERATE' | 'HIGH';
    botRiskReason?: string;
    rateCardValuation: { minIdr: number; maxIdr: number; formatted: string };
    postsRanked: Array<{
      index: number;
      likes: number;
      comments: number;
      views: number;
      shares: number;
      caption?: string;
      postER: number;
      tier: 'VIRAL' | 'HIGH' | 'MODERATE' | 'LOW';
    }>;
  }
  ```

- [ ] **Step 1: Write unit test for statistical calculations**
  Create `backend/src/tests/statisticsService.test.ts` testing median computation (even and odd arrays), min/max, quartiles, coefficient of variation, and distribution tiering.

- [ ] **Step 2: Implement StatisticsService**
  Create `backend/src/services/StatisticsService.ts` implementing `calculateMedian`, `calculateQuartiles`, `calculateMinMax`, `calculateConsistency`, `calculateCommentToLikeRatio`, and `evaluateBotRisk`.

- [ ] **Step 3: Extend AnalyticsEngine with calculateComprehensive**
  Modify `backend/src/services/AnalyticsEngine.ts` to expose `calculateComprehensiveAnalytics` utilizing `StatisticsService` and `RateCardCalculator`.

- [ ] **Step 4: Run tests and verify**
  Run `npx tsx backend/src/tests/statisticsService.test.ts` and ensure all assertions pass.

---

### Task 2: Backend API Route for Deep ER Analytics

**Files:**
- Modify: `backend/src/controllers/analysisController.ts`
- Modify: `backend/src/routes/api.ts`

**Interfaces:**
- Consumes: `AnalyticsEngine.calculateComprehensiveAnalytics`
- Produces: `POST /api/analytics/calculate-deep`

- [ ] **Step 1: Implement deep analysis controller method**
  In `backend/src/controllers/analysisController.ts`, add `calculateDeepAnalysis` handler with Zod request validation for `platform`, `username`, `followers`, and `posts` array.

- [ ] **Step 2: Register route in api.ts**
  In `backend/src/routes/api.ts`, bind `POST /api/analytics/calculate-deep` to `calculateDeepAnalysis`.

- [ ] **Step 3: Verify API with curl**
  Send a test POST request to `http://localhost:5000/api/analytics/calculate-deep` with 3 test posts and verify JSON response.

---

### Task 3: Client-Side OCR Service (Tesseract.js)

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/src/services/ocrService.ts`
- Test: `frontend/src/tests/ocrParsing.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ParsedProfileOcr {
    username?: string;
    followers?: number;
    following?: number;
    postsCount?: number;
    rawText: string;
  }

  export interface ParsedPostOcr {
    likes?: number;
    comments?: number;
    views?: number;
    shares?: number;
    caption?: string;
    rawText: string;
  }
  ```

- [ ] **Step 1: Install Tesseract.js**
  Run `npm install tesseract.js` in `frontend/`.

- [ ] **Step 2: Implement number multiplier sanitizer**
  In `frontend/src/services/ocrService.ts`, write `cleanOcrNumber(rawText)` handling `K`, `M`, `rb`, `jt`, commas, and periods.

- [ ] **Step 3: Implement profile and post OCR parsers**
  Implement `parseProfileScreenshot(fileOrBlob: File | Blob): Promise<ParsedProfileOcr>` and `parsePostScreenshot(fileOrBlob: File | Blob): Promise<ParsedPostOcr>` using `Tesseract.createWorker`.

- [ ] **Step 4: Test regex pattern matching**
  Create unit test verifying Indonesian and English screenshot number formats (`"14,2 rb suka"`, `"1.5M views"`, `"12.4K comments"`).

---

### Task 4: Multi-Post Builder & Screenshot Dropzone Component

**Files:**
- Create: `frontend/src/components/ManualPostBuilder.tsx`

**Interfaces:**
- Consumes: `ocrService.parseProfileScreenshot`, `ocrService.parsePostScreenshot`, `useLanguage`
- Produces: Callback `onAnalyze(accountData, postsData)`

- [ ] **Step 1: Create interactive multi-post table with drag & drop**
  Build `ManualPostBuilder.tsx` with:
  - Account profile card (Platform selector, Username input, Followers input, and Profile Screenshot OCR button).
  - Batch screenshot dropzone supporting multiple file drops.
  - Realtime OCR progress indicator per image.
  - Interactive table showing thumbnail preview, Likes, Comments, Views, Shares, and Caption inputs.
  - "Add Manual Row" and "Remove Row" controls.
  - Clear multi-language tooltips and friendly instructions.

- [ ] **Step 2: Add validation & error states**
  Ensure followers > 0, at least 1 post exists, and non-numeric inputs are flagged gracefully.

---

### Task 5: Deep-Dive Statistical Analysis Result Component

**Files:**
- Create: `frontend/src/components/AdvancedAnalysisResult.tsx`

**Interfaces:**
- Consumes: `ComprehensiveAnalysisResult`, `useLanguage`

- [ ] **Step 1: Build Median vs Average Hero Banner**
  Display comparison of Median ER vs Average ER with variance commentary (e.g. "Konsistensi Tinggi" vs "Bergantung pada 1 Postingan Viral").

- [ ] **Step 2: Build Min / Max & Spread Cards**
  Highlight the Best Performing Post vs Lowest Post with individual post ERs and interaction counts.

- [ ] **Step 3: Build Distribution Histogram & Quartiles Visual**
  Display quartile breakdown ($Q_1, Q_2, Q_3, \text{IQR}$) and bar chart showing % of posts in Viral, High, Moderate, and Low tiers.

- [ ] **Step 4: Build Performance Analysis Dossier**
  Display:
  - Consistency Score gauge (0 - 100%).
  - Comment-to-Like quality ratio with audience loyalty explanation.
  - Bot / Anomaly risk assessment banner.
  - Fair Rate Card endorsement valuation.
  - Ranked post matrix table with post thumbnail and tier badges.

---

### Task 6: View Integration, End-to-End Verification & PDF Export

**Files:**
- Modify: `frontend/src/views/AnalyzeView.tsx`
- Modify: `frontend/src/i18n/LanguageContext.tsx`
- Modify: `frontend/src/services/api.ts`

- [ ] **Step 1: Add translation dictionary entries**
  Update `LanguageContext.tsx` with new dictionary keys for Median, Min/Max, Distribution, Consistency Score, Comment-to-Like Ratio, and OCR upload messages in ID, EN, and MS.

- [ ] **Step 2: Integrate into AnalyzeView**
  Add tabbed mode in `AnalyzeView.tsx`:
  - Mode 1: *Cari Akun Otomatis (Live Scraper)*
  - Mode 2: *Input Manual & OCR Screenshot (Analisis Statistik Mendalam)*

- [ ] **Step 3: Verify frontend build**
  Run `npm run build` in `frontend/` and ensure zero errors.

- [ ] **Step 4: End-to-end verification**
  Test end-to-end flow with sample screenshots and manual post rows to ensure accurate calculation and rendering.
