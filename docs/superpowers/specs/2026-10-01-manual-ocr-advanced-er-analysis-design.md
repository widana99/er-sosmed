# Design Specification: Manual Input, OCR Screenshot Processing, & Deep Statistical ER Analytics

- **Status:** Approved (In Discussion / Extension Phase)
- **Date:** 2026-10-01
- **Author:** Antigravity Team & Lead Analyst

---

## 1. Overview & Problem Statement
Currently, the ER Analyzer calculates engagement using aggregate averages. To eliminate distortions from viral video outliers, user errors, and private/restricted accounts, this specification introduces:
1. **Granular Multi-Post Input**: Users input individual post metrics (Likes, Comments, Views, Shares) rather than pre-averaged totals.
2. **Client-Side OCR Processing**: Automated extraction of followers, likes, comments, and views from profile and post screenshots using browser-based Tesseract.js (preserving user privacy).
3. **Deep Statistical Analysis Hierarchy**:
   $$\text{Median} \rightarrow \text{Min / Max} \rightarrow \text{Distribution} \rightarrow \text{Engagement Rate} \rightarrow \text{Performance Analysis}$$

---

## 2. Input Architecture & OCR Ingestion

### 2.1 Profile Level Input
- **Platform Selection**: Instagram or TikTok.
- **Metrics**: Username, Followers count, Following, Total posts.
- **OCR Profile Dropzone**:
  - Automatically identifies `@username` and follower metrics with multiplier abbreviations (`K` $\rightarrow \times 1,000$, `M` $\rightarrow \times 1,000,000$, `rb` $\rightarrow \times 1,000$, `jt` $\rightarrow \times 1,000,000$).

### 2.2 Post Level Grid (Multi-Post Builder)
- **Batch Drag & Drop**: Drop multiple post screenshots simultaneously.
- **Client-Side Worker**: Tesseract.js running in a Web Worker to keep UI responsive.
- **Field Extraction**:
  - Likes (❤️, Suka, Likes)
  - Comments (💬, Komentar)
  - Views (👁️, Tayangan, Views)
  - Shares (🔁, Dibagikan)
  - Caption (truncated preview)
- **Interactive Review Table**:
  - Thumbnail preview of the uploaded screenshot.
  - Fully editable numeric cells for user verification before running analysis.
  - Manual row addition (`+ Add Post`) for manual data entry without images.

---

## 3. Mathematical & Statistical Engine

### 3.1 Individual Post ER Computation
For each post $i \in \{1, \dots, n\}$:
- **Instagram (Follower-Based)**:
  $$ER_i = \left( \frac{\text{Likes}_i + \text{Comments}_i}{\text{Followers}} \right) \times 100\%$$
- **TikTok (View-Based)**:
  $$ER_i = \left( \frac{\text{Likes}_i + \text{Comments}_i + \text{Shares}_i}{\max(1, \text{Views}_i)} \right) \times 100\%$$

### 3.2 Output Hierarchy
1. **Median ($Q_2$ / 50th Percentile)**:
   - Sort $\{ER_1, \dots, ER_n\}$ in ascending order.
   - For odd $n$: $ER_{\text{median}} = ER_{(n+1)/2}$
   - For even $n$: $ER_{\text{median}} = \frac{ER_{n/2} + ER_{(n/2)+1}}{2}$
   - Also calculates Median Likes, Median Comments, Median Views.
2. **Min / Max & Spread**:
   - $\text{Min } ER = \min(\{ER_i\})$, identifying the floor performance.
   - $\text{Max } ER = \max(\{ER_i\})$, identifying the ceiling viral peak.
   - $\text{Spread Range} = \text{Max } ER - \text{Min } ER$.
3. **Distribution & Quartiles**:
   - $Q_1$ (25th percentile) and $Q_3$ (75th percentile).
   - $\text{IQR} = Q_3 - Q_1$.
   - **Tiers Classification**:
     - *Viral / Elite*: $ER_i > 8\%$ or $> Q_3 + 1.5 \times \text{IQR}$
     - *High*: $5\% \le ER_i \le 8\%$
     - *Steady / Normal*: $2\% \le ER_i < 5\%$
     - *Underperforming*: $ER_i < 2\%$
4. **Engagement Rate Comparison**:
   - Compare $\text{Average } ER$ vs $\text{Median } ER$.
   - Variance delta determines whether performance is organic or reliant on a single viral hit.
5. **Comprehensive Performance Analysis**:
   - **Consistency Score**:
     $$\text{Consistency} = \max\left(0, 100 - \frac{\sigma}{\mu} \times 100\right)$$
     where $\mu = \text{Mean } ER$ and $\sigma = \text{Standard Deviation}$.
   - **Interaction Quality Index**:
     $$\text{Quality Ratio} = \frac{\text{Total Comments}}{\text{Total Likes}} \times 100\%$$
     ($> 2\%$ = high audience loyalty, $< 0.5\%$ = passive / bot risk).
   - **Fair Rate Card Valuation**:
     $$\text{Estimated Rate Card} = \text{Base Rate} + (\text{Median Views} \times \text{CPM}) \times (1 + \text{Median } ER / 10)$$

---

## 4. Sampling Strategy for Large Accounts (> 100 / > 10,000 Posts)

When accounts have hundreds or tens of thousands of historical posts:
- **Rolling Window (Active Era)**: Standard sample of the latest 12, 30, or 50 posts.
- **Temporal Stratified Sampling**: For full-account audits:
  - Last 30 Days (70% weight)
  - Last 90 Days (20% weight)
  - Historical Baseline (10% weight)
- Prevents algorithmic decay distortion from obsolete 5-year-old content.

---

## 5. UI / UX & Design Standards
- **Neo-Glassmorphism**: Translucent frosted containers, specular highlights, dark/light compatibility.
- **Typography**: `Syne` for display headers, `Instrument Sans` for controls, `DM Mono` for figures.
- **Export Formats**: Executive A4 PDF Report and `.xlsx` Workbook.
