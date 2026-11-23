# Product Requirements Document (PRD)

# Social Media Engagement Rate Analyzer

**Document Version:** 1.0.0
**Product Status:** MVP Planning
**Product Type:** Internal Admin Dashboard
**Primary Platform:** Web
**Primary Users:** Admin / Social Media Analyst
**Supported Platforms:** Instagram & TikTok
**Initial Data Source:** Manual / Simulated / CSV
**Future Data Source:** Official API / Approved Data Provider
**Database:** PostgreSQL
**Target MVP Development Cost:** Rp0

---

# 1. Product Overview

## 1.1 Product Description

**Social Media Engagement Rate Analyzer** adalah aplikasi web berbentuk admin dashboard yang digunakan untuk mencari, menyimpan, menghitung, dan menganalisis **Engagement Rate (ER)** akun media sosial.

Platform utama yang dianalisis:

* Instagram
* TikTok

Pada tahap MVP, sistem tidak bergantung pada API berbayar.

Admin dapat memasukkan data akun dan data postingan secara manual atau melalui CSV. Sistem kemudian menghitung Engagement Rate berdasarkan formula yang dipilih.

Arsitektur aplikasi dirancang agar pada tahap berikutnya dapat diintegrasikan dengan:

* Instagram API
* TikTok API
* Approved third-party data provider

tanpa perlu melakukan perubahan besar pada sistem inti.

---

# 2. Problem Statement

Proses analisis performa akun media sosial sering dilakukan menggunakan berbagai sumber yang terpisah, seperti:

* Instagram
* TikTok
* Spreadsheet
* Screenshot
* Data manual
* Dashboard pihak ketiga

Hal tersebut menyebabkan proses analisis menjadi:

* Tidak terpusat
* Tidak konsisten
* Sulit dilacak
* Sulit membandingkan akun
* Sulit melihat histori performa
* Membutuhkan perhitungan manual

Social Media Engagement Rate Analyzer dibuat untuk menyediakan satu sistem terpusat yang dapat menyimpan data, menghitung Engagement Rate, dan menyediakan histori analisis.

---

# 3. Product Goals

## 3.1 Primary Goals

### G1 — Account Lookup

Admin dapat mencari akun berdasarkan:

* Platform
* Username

Contoh:

```text
Platform: Instagram
Username: @ginoptrwdna
```

atau:

```text
Platform: TikTok
Username: @ginoptrwdna
```

---

### G2 — Engagement Rate Calculation

Sistem dapat menghitung Engagement Rate secara otomatis berdasarkan data yang tersedia.

Contoh:

```text
Followers        : 12,500
Average Likes    : 612
Average Comments : 28

Engagement Rate  : 5.12%
```

---

### G3 — Analytics Dashboard

Admin dapat melihat:

* Followers
* Following
* Jumlah posting
* Average likes
* Average comments
* Average views
* Average shares
* Engagement Rate
* Engagement per post
* Performance trend

---

### G4 — Historical Analysis

Setiap analisis dapat disimpan dan dilihat kembali.

Contoh:

```text
30 September 2026
ER: 5.12%

15 September 2026
ER: 4.87%

01 September 2026
ER: 4.31%
```

---

### G5 — Future API Integration

Sistem harus memungkinkan penambahan data provider di masa depan.

Contoh:

```text
Instagram API
TikTok API
Approved Data Provider
```

Integrasi tersebut tidak boleh mengharuskan perubahan besar terhadap frontend dan analytics engine.

---

# 4. Non-Goals

Fitur berikut tidak menjadi fokus MVP:

* Automated Instagram scraping
* Automated TikTok scraping
* AI content analysis
* Sentiment analysis
* AI caption generation
* Influencer marketplace
* Social media post scheduling
* Social media publishing
* Advertising management
* Automated content recommendation
* Viral prediction
* Advanced demographic analysis

Fitur tersebut dapat dipertimbangkan pada fase pengembangan berikutnya.

---

# 5. Target Users

## 5.1 Admin

Admin merupakan pengguna utama sistem.

Admin dapat:

* Login
* Mencari akun
* Menambahkan akun
* Memasukkan data
* Mengedit data
* Menghapus data
* Melakukan analisis
* Menyimpan analisis
* Melihat histori
* Membandingkan akun
* Membuat laporan

---

## 5.2 Analyst

Future role.

Analyst dapat:

* Mencari akun
* Melakukan analisis
* Melihat statistik
* Membuat laporan

Namun tidak memiliki akses terhadap konfigurasi sistem.

---

## 5.3 Viewer

Future role.

Viewer hanya dapat:

* Melihat dashboard
* Melihat akun
* Melihat hasil analisis
* Melihat laporan

Tidak dapat mengubah data.

---

# 6. User Journey

Primary flow:

```text
LOGIN
   ↓
DASHBOARD
   ↓
SEARCH ACCOUNT
   ↓
SELECT PLATFORM
   ↓
INPUT USERNAME
   ↓
ACCOUNT FOUND / DATA NOT AVAILABLE
   ↓
ACCOUNT OVERVIEW
   ↓
INPUT / IMPORT POST DATA
   ↓
CALCULATE ENGAGEMENT RATE
   ↓
ANALYSIS RESULT
   ↓
SAVE ANALYSIS
   ↓
ANALYSIS HISTORY
```

---

# 7. Information Architecture

```text
Social Analytics
│
├── Dashboard
│
├── Analyze
│   ├── Instagram
│   └── TikTok
│
├── Accounts
│   ├── All Accounts
│   ├── Instagram
│   └── TikTok
│
├── Analytics
│   ├── Overview
│   ├── Posts
│   ├── Engagement
│   └── History
│
├── Comparison
│
├── Reports
│
└── Settings
    ├── Profile
    ├── Admin
    └── System
```

---

# 8. Functional Requirements

## FR-001 — Authentication

System harus menyediakan autentikasi admin.

### Requirements

* Login menggunakan email dan password
* Logout
* Protected routes
* Session management
* Role-based authorization

### Authentication Flow

```text
Login
 ↓
Validate Credentials
 ↓
Create Session
 ↓
Dashboard
```

---

# 9. Dashboard

Dashboard adalah halaman utama setelah admin berhasil login.

## 9.1 KPI Cards

Dashboard menampilkan:

```text
TOTAL ACCOUNTS
128
```

```text
INSTAGRAM
82
```

```text
TIKTOK
46
```

```text
TOTAL ANALYSES
347
```

```text
AVERAGE ER
4.82%
```

---

## 9.2 Recent Analysis

Menampilkan analisis terbaru.

Contoh:

| Account      | Platform  |    ER | Date        |
| ------------ | --------- | ----: | ----------- |
| @ginoptrwdna | Instagram | 5.12% | 30 Sep 2026 |
| @accountA    | TikTok    | 4.81% | 29 Sep 2026 |
| @accountB    | Instagram | 3.91% | 28 Sep 2026 |

---

# 10. Account Search

Account Search merupakan salah satu fitur utama.

## Search Interface

```text
Platform

[ Instagram ▼ ]

Username

[ @ginoptrwdna ]

[ Analyze ]
```

Platform:

* Instagram
* TikTok

---

# 11. Search Result

Jika akun tersedia:

```text
Instagram

@ginoptrwdna

Followers
12.5K

Following
1.23K

Posts
184

Latest Analysis
5.12%

[ View Analysis ]
```

---

# 12. Account Detail

Halaman Account Detail menampilkan informasi lengkap akun.

## Profile Information

```text
@ginoptrwdna
Instagram

12.5K Followers
1.23K Following
184 Posts
```

---

## Engagement Overview

```text
Engagement Rate
5.12%

Average Likes
612

Average Comments
28

Average Engagement
640
```

---

# 13. Engagement Rate Engine

Engagement Rate Engine merupakan komponen inti aplikasi.

## 13.1 Instagram — ER by Followers

Formula:

```text
ER =
(Average Likes + Average Comments)
/
Followers
× 100
```

Contoh:

```text
Followers        = 12,500
Average Likes    = 612
Average Comments = 28
```

Perhitungan:

```text
(612 + 28)
─────────── × 100
  12,500

= 5.12%
```

---

# 14. TikTok Engagement Rate

Untuk TikTok, sistem dapat mendukung formula berbasis views.

```text
ER =
(Likes + Comments + Shares)
/
Views
× 100
```

Contoh:

```text
Likes    = 5,000
Comments = 120
Shares   = 400
Views    = 100,000
```

```text
(5,000 + 120 + 400)
─────────────────── × 100
       100,000

= 5.52%
```

---

# 15. Formula Type

Setiap analisis wajib menyimpan formula yang digunakan.

Supported types:

```text
FOLLOWER_BASED
VIEW_BASED
REACH_BASED
```

Contoh:

```text
formula_type: FOLLOWER_BASED
```

---

# 16. Metric Dictionary

## 16.1 Account Metrics

| Metric       | Description      | Required |
| ------------ | ---------------- | -------- |
| Username     | Username akun    | Yes      |
| Followers    | Jumlah followers | Yes      |
| Following    | Jumlah following | Optional |
| Posts        | Jumlah posting   | Optional |
| Account Type | Jenis akun       | Optional |

---

## 16.2 Post Metrics

| Metric   | Description     | Required |
| -------- | --------------- | -------- |
| Likes    | Jumlah likes    | Yes      |
| Comments | Jumlah komentar | Yes      |
| Views    | Jumlah views    | Optional |
| Shares   | Jumlah shares   | Optional |
| Saves    | Jumlah saves    | Optional |
| Reach    | Jumlah reach    | Optional |

Tidak semua platform menyediakan seluruh metric.

Nilai yang tidak tersedia harus dapat disimpan sebagai:

```text
NULL
```

---

# 17. Data Source

Setiap data harus mempunyai source.

Supported values:

```text
MANUAL
SIMULATED
CSV_IMPORT
API
```

Contoh:

```text
source: MANUAL
```

Untuk data simulasi:

```text
source: SIMULATED
```

UI harus memberikan indikasi yang jelas bahwa data tersebut bukan data aktual.

---

# 18. Post Analytics

Sistem menampilkan tabel performa postingan.

| Post | Date   | Likes | Comments |  Views |    ER |
| ---- | ------ | ----: | -------: | -----: | ----: |
| #01  | 25 Sep |   720 |       32 |  8,200 | 6.02% |
| #02  | 22 Sep |   580 |       25 |  6,700 | 4.84% |
| #03  | 19 Sep |   810 |       41 | 10,200 | 6.81% |

Admin dapat membuka detail setiap posting.

---

# 19. Analytics Visualization

Sistem harus menyediakan visualisasi data.

## 19.1 Engagement Trend

Menampilkan perubahan ER dari waktu ke waktu.

```text
ER %
│
7 │       ╭──╮
6 │   ╭───╯  ╰╮
5 │───╯       ╰──
4 │
  └────────────────
       Time
```

---

## 19.2 Post Performance

Menampilkan performa masing-masing posting.

```text
Post 01 ███████
Post 02 █████
Post 03 █████████
Post 04 ████
```

---

## 19.3 Engagement Composition

Menampilkan komposisi interaksi.

```text
Likes
████████████

Comments
██

Shares
███
```

---

# 20. Analysis History

Setiap analisis disimpan.

Contoh:

| Date   | Account      | Platform  |    ER | Sample |
| ------ | ------------ | --------- | ----: | -----: |
| 30 Sep | @ginoptrwdna | Instagram | 5.12% |     10 |
| 15 Sep | @ginoptrwdna | Instagram | 4.87% |     10 |
| 01 Sep | @ginoptrwdna | Instagram | 4.31% |     10 |

Admin dapat membuka kembali hasil analisis.

---

# 21. Comparison

Admin dapat memilih beberapa akun untuk dibandingkan.

Contoh:

```text
Instagram

[@gino]
[@accountA]
[@accountB]
```

Output:

| Metric       | @gino | @accountA | @accountB |
| ------------ | ----: | --------: | --------: |
| Followers    | 12.5K |     18.2K |      9.8K |
| Avg Likes    |   612 |       840 |       490 |
| Avg Comments |    28 |        35 |        21 |
| ER           | 5.12% |     4.80% |     5.21% |

Sistem harus menampilkan formula dan source setiap data agar perbandingan dapat dipahami dengan benar.

---

# 22. CSV Import

Admin dapat mengunggah data melalui CSV.

## Flow

```text
Upload CSV
   ↓
Validate
   ↓
Preview
   ↓
Confirm
   ↓
Import
   ↓
Calculate
```

---

## CSV Structure

```csv
platform,username,followers,post_date,likes,comments,views,shares
instagram,ginoptrwdna,12500,2026-09-25,720,32,8200,120
instagram,ginoptrwdna,12500,2026-09-22,580,25,6700,80
```

---

# 23. Reports

Admin dapat membuat laporan analisis.

## Report Structure

```text
Account Information
        ↓
Follower Statistics
        ↓
Engagement Overview
        ↓
Post Performance
        ↓
Engagement Trend
        ↓
Analysis Method
        ↓
Data Source
        ↓
Analysis Date
```

Supported export:

* PDF
* CSV

---

# 24. Database Requirements

Database menggunakan PostgreSQL.

## 24.1 admin_users

```text
id
name
email
password_hash
role
created_at
updated_at
```

Roles:

```text
ADMIN
ANALYST
VIEWER
```

---

## 24.2 social_accounts

```text
id
platform
username
display_name
profile_url
avatar_url
account_type
created_at
updated_at
```

Constraint:

```text
UNIQUE(platform, username)
```

---

## 24.3 account_snapshots

```text
id
account_id
followers
following
posts_count
captured_at
source
```

Digunakan untuk menyimpan histori statistik akun.

---

## 24.4 social_posts

```text
id
account_id
post_url
caption
posted_at
likes
comments
views
shares
saves
reach
source
created_at
```

---

## 24.5 analysis_runs

```text
id
account_id
formula_type
sample_size
average_likes
average_comments
average_views
average_shares
engagement_rate
source
analyzed_at
```

---

## 24.6 search_history

```text
id
admin_id
platform
username
searched_at
result_status
```

---

# 25. Database Relationship

```text
admin_users
    │
    └── search_history
              │
              ▼
       social_accounts
          │    │    │
          │    │    └── analysis_runs
          │    │
          │    └────── social_posts
          │
          └─────────── account_snapshots
```

---

# 26. Technology Stack

## Frontend

```text
React
Vite
TypeScript
Tailwind CSS
shadcn/ui
Recharts
```

---

## Backend

```text
Node.js
Express
TypeScript
Prisma
```

---

## Database

Development:

```text
PostgreSQL Local
```

Production / Cloud:

```text
Neon PostgreSQL
```

---

## Version Control

```text
Git
GitHub
```

---

# 27. System Architecture

```text
┌──────────────────────────────┐
│           FRONTEND           │
│                              │
│ React + Vite + TypeScript    │
│ Tailwind + shadcn/ui         │
│ Recharts                     │
└──────────────┬───────────────┘
               │
               │ REST API
               ▼
┌──────────────────────────────┐
│           BACKEND            │
│                              │
│ Node.js + Express            │
│ TypeScript                   │
│ Prisma                       │
│ Auth Service                 │
│ Analytics Engine             │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│          DATABASE            │
│                              │
│ PostgreSQL                   │
│ Local → Neon                 │
└──────────────────────────────┘
```

---

# 28. Data Provider Architecture

Untuk mengantisipasi integrasi API:

```text
SocialDataProvider
        │
        ├── ManualProvider
        │
        ├── CSVProvider
        │
        ├── InstagramProvider
        │
        └── TikTokProvider
```

Flow:

```text
Search Username
       ↓
Provider Service
       ↓
Data Source
       ↓
Normalize Data
       ↓
PostgreSQL
       ↓
Analytics Engine
       ↓
Dashboard
```

---

# 29. API Specification

## Authentication

```http
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

---

## Accounts

```http
GET /api/accounts
GET /api/accounts/:id
POST /api/accounts
PUT /api/accounts/:id
DELETE /api/accounts/:id
```

---

## Search

```http
POST /api/accounts/search
GET /api/search-history
```

---

## Posts

```http
GET /api/accounts/:id/posts
POST /api/accounts/:id/posts
PUT /api/posts/:id
DELETE /api/posts/:id
```

---

## Analytics

```http
POST /api/analysis
GET /api/analysis/:id
GET /api/accounts/:id/analysis
```

---

## Comparison

```http
POST /api/comparison
```

---

## Reports

```http
POST /api/reports
GET /api/reports/:id
```

---

# 30. Security Requirements

System harus menerapkan:

* Password hashing
* Protected API routes
* Authentication
* Authorization
* Role-based access
* Input validation
* SQL injection protection
* Rate limiting
* CORS configuration
* Environment variables
* Secure HTTP configuration

Sensitive configuration harus disimpan dalam:

```text
.env
```

Contoh:

```env
DATABASE_URL=
JWT_SECRET=
API_KEY=
```

File `.env` tidak boleh di-commit ke repository.

---

# 31. Performance Requirements

Target MVP:

| Requirement          | Target                      |
| -------------------- | --------------------------- |
| Dashboard load       | < 3 seconds                 |
| Local account search | < 2 seconds                 |
| ER calculation       | < 1 second                  |
| Chart rendering      | < 2 seconds                 |
| Pagination           | Required for large datasets |

---

# 32. Responsive Requirements

Target:

```text
Desktop
1440px
1280px
1024px

Tablet
768px

Mobile
375px
```

Dashboard menggunakan pendekatan **desktop-first**, karena primary user adalah admin.

---

# 33. Design Direction

## Visual Direction

**Premium Editorial Analytics Dashboard**

Karakter visual:

* Minimal
* Professional
* Sophisticated
* Clean
* Data-focused
* Modern
* Editorial
* Premium

Hindari:

* Gradient berlebihan
* Neon dashboard
* Excessive glassmorphism
* Generic SaaS template
* Dashboard dengan terlalu banyak warna
* Visual yang terlalu ramai

---

# 34. Typography

Recommended:

### Primary

```text
Manrope
```

### Secondary

```text
Inter
```

Typography harus memiliki hierarchy yang jelas.

Contoh:

```text
H1
Dashboard

H2
Engagement Overview

H3
Recent Analysis

Body
Account performance over the selected period.

Caption
Last analyzed 30 September 2026
```

---

# 35. Color Direction

Recommended base palette:

```text
Background
#F7F7F5

Primary
#111111

Secondary
#6B6B6B

Border
#E5E5E5

Accent
#6C63FF
```

Accent color dapat diganti setelah proses UI exploration.

---

# 36. Navigation

Sidebar:

```text
SOCIAL ANALYTICS

OVERVIEW
Dashboard

ANALYZE
Search Account

ACCOUNTS
All Accounts
Instagram
TikTok

ANALYTICS
Overview
Comparison
History

REPORTS

SYSTEM
Settings
```

---

# 37. Error States

## Account Not Found

```text
Account not found.

Please check the username and platform.
```

---

## Data Unavailable

```text
Account found, but analytics data is unavailable.
```

---

## Insufficient Data

```text
Insufficient data to calculate engagement rate.
```

---

## API Error

```text
Unable to retrieve data.

Please try again later.
```

---

## Invalid Username

```text
Please enter a valid username.
```

---

# 38. Data Validation

System harus melakukan validasi:

### Username

* Tidak boleh kosong
* Tidak boleh mengandung karakter ilegal
* Maximum length harus ditentukan

### Followers

```text
>= 0
```

### Likes

```text
>= 0
```

### Comments

```text
>= 0
```

### Views

```text
>= 0
```

### Shares

```text
>= 0
```

### Engagement Rate

```text
0 <= ER <= 100
```

Jika hasil melebihi 100%, sistem harus melakukan validation check karena kemungkinan terdapat data atau formula yang tidak sesuai.

---

# 39. Manual Analysis Mode

Admin dapat menggunakan mode manual.

Form:

```text
Platform
[ Instagram ]

Username
[ @ginoptrwdna ]

Followers
[ 12500 ]

Average Likes
[ 612 ]

Average Comments
[ 28 ]

Formula
[ ER by Followers ]

[ Calculate ]
```

Output:

```text
ENGAGEMENT RATE

5.12%
```

---

# 40. Simulated Data Mode

MVP harus mendukung data simulasi untuk development dan demonstration.

Contoh:

```text
Source:
SIMULATED
```

UI harus memberikan label:

```text
SIMULATED DATA
```

Data simulasi tidak boleh ditampilkan sebagai data aktual.

---

# 41. MVP Feature Priority

## P0 — Critical

* Authentication
* Dashboard
* Account search
* Instagram support
* TikTok support
* Manual data input
* Post data input
* Engagement Rate calculation
* Account detail
* Analytics
* PostgreSQL
* Analysis history
* Data source indicator

---

## P1 — Important

* CSV import
* CSV export
* PDF report
* Account comparison
* Analytics charts
* Admin roles

---

## P2 — Future

* Instagram API
* TikTok API
* Automated data retrieval
* Scheduled analysis
* Notifications

---

## P3 — Experimental

* AI insights
* Sentiment analysis
* Content classification
* Hashtag analysis
* Recommendation engine

---

# 42. MVP Success Criteria

MVP dianggap berhasil apabila admin dapat menjalankan flow berikut:

```text
LOGIN
  ↓
SEARCH @ginoptrwdna
  ↓
CREATE / FIND ACCOUNT
  ↓
INPUT 10 POSTS
  ↓
CALCULATE ER
  ↓
VIEW 5.12%
  ↓
VIEW CHART
  ↓
SAVE ANALYSIS
  ↓
OPEN HISTORY
  ↓
COMPARE WITH ANOTHER ACCOUNT
```

Seluruh proses tersebut harus dapat dilakukan tanpa API Instagram atau TikTok berbayar.

---

# 43. Example End-to-End Analysis

Admin mencari:

```text
Platform:
Instagram

Username:
@ginoptrwdna
```

Account:

```text
Followers:
12,500
```

Admin memasukkan 10 postingan.

System menghitung:

```text
Average Likes:
612

Average Comments:
28

Average Engagement:
640

Engagement Rate:
5.12%
```

Admin memilih:

```text
Save Analysis
```

Database menyimpan:

```text
Account:
@ginoptrwdna

Platform:
Instagram

ER:
5.12%

Sample:
10 posts

Formula:
Follower Based

Source:
Manual

Date:
30 September 2026
```

Data kemudian tersedia di:

```text
Analytics → History
```

---

# 44. Development Roadmap

## Phase 01 — Foundation

* Repository setup
* React + Vite
* TypeScript
* Tailwind
* Node.js
* Express
* PostgreSQL
* Prisma
* Environment configuration
* Project structure

---

## Phase 02 — Authentication

* Login
* Logout
* Session
* Protected routes
* Role system

---

## Phase 03 — Dashboard

* Sidebar
* Header
* KPI cards
* Recent analysis
* Recent accounts

---

## Phase 04 — Account Management

* Account search
* Username validation
* Platform selection
* Account detail
* Search history

---

## Phase 05 — Analytics Engine

* Post input
* Average calculation
* ER calculation
* Formula selection
* Data validation
* Analysis storage

---

## Phase 06 — Analytics UI

* Account overview
* ER card
* Post table
* Charts
* Historical ER
* Performance visualization

---

## Phase 07 — Import / Export

* CSV import
* CSV validation
* CSV export
* PDF report

---

## Phase 08 — Comparison

* Account selection
* Metric comparison
* ER comparison
* Historical comparison
* Comparison charts

---

## Phase 09 — Deployment

Frontend:

```text
Vercel
```

Backend:

```text
Render / Railway / equivalent free-tier service
```

Database:

```text
Neon PostgreSQL
```

Free-tier availability and limitations should be verified at deployment time.

---

## Phase 10 — Data Provider Integration

Future:

```text
Instagram Provider
TikTok Provider
Approved Third-party Provider
```

---

# 45. Future Architecture

```text
                     ┌─────────────────┐
                     │   Instagram     │
                     │   Data Source   │
                     └────────┬────────┘
                              │
                              ▼
┌─────────────┐       ┌───────────────┐
│  Dashboard  │──────►│ Social Data   │
│             │       │ Provider      │
└─────────────┘       └───────┬───────┘
                              │
                     ┌────────┴────────┐
                     │                 │
               Instagram           TikTok
                Provider           Provider
                     │                 │
                     └────────┬────────┘
                              ▼
                       Data Normalizer
                              │
                              ▼
                       Analytics Engine
                              │
                              ▼
                         PostgreSQL
                              │
                              ▼
                          Dashboard
```

---

# 46. Core Product Principle

The application must not only display an Engagement Rate number.

Every Engagement Rate result should be traceable.

For example:

```text
ENGAGEMENT RATE
5.12%

Followers
12,500

Posts analyzed
10

Average Likes
612

Average Comments
28

Formula
ER by Followers

Data Source
Manual

Analysis Date
30 September 2026
```

The purpose is to ensure that every result can be understood and verified.

---

# 47. Recommended Final MVP Stack

```text
┌──────────────────────────────────────┐
│              FRONTEND                │
│                                      │
│ React + Vite + TypeScript            │
│ Tailwind CSS + shadcn/ui             │
│ Recharts                             │
└──────────────────┬───────────────────┘
                   │
                   │ REST API
                   ▼
┌──────────────────────────────────────┐
│               BACKEND                │
│                                      │
│ Node.js + Express + TypeScript       │
│ Prisma                               │
│ Authentication                       │
│ Analytics Engine                     │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│              DATABASE                │
│                                      │
│ PostgreSQL                           │
│ Local → Neon                         │
└──────────────────────────────────────┘
```

---

# 48. Development Principles

Development harus mengikuti prinsip berikut:

1. **Database-first architecture**
2. **API-first backend**
3. **Provider abstraction**
4. **Separation of concerns**
5. **Reusable components**
6. **Strong data validation**
7. **Transparent analytics calculation**
8. **Source-aware data**
9. **Scalable database structure**
10. **No dependency on paid APIs for MVP**

---

# 49. Final Product Definition

Social Media Engagement Rate Analyzer merupakan internal analytics platform yang memungkinkan admin untuk:

```text
SEARCH
   ↓
STORE
   ↓
INPUT / IMPORT
   ↓
CALCULATE
   ↓
ANALYZE
   ↓
COMPARE
   ↓
SAVE
   ↓
REPORT
```

Versi MVP harus dapat berjalan menggunakan:

```text
React
+
Node.js
+
PostgreSQL
```

tanpa ketergantungan terhadap API Instagram atau TikTok berbayar.

Arsitektur harus disiapkan agar data provider otomatis dapat ditambahkan setelah MVP mendapatkan persetujuan dan kebutuhan bisnis sudah jelas.

---

# 50. Next Development Document

Setelah PRD ini disetujui, dokumentasi berikutnya yang perlu dibuat adalah:

```text
01_PRD.md
02_DATABASE_SCHEMA.md
03_ERD.md
04_API_SPECIFICATION.md
05_SYSTEM_ARCHITECTURE.md
06_DESIGN_SYSTEM.md
07_UI_UX_SPECIFICATION.md
08_DEVELOPMENT_ROADMAP.md
```

Urutan pengerjaan yang direkomendasikan:

```text
PRD
 ↓
DATABASE SCHEMA
 ↓
ERD
 ↓
SYSTEM ARCHITECTURE
 ↓
API SPECIFICATION
 ↓
DESIGN SYSTEM
 ↓
UI/UX
 ↓
BACKEND
 ↓
ANALYTICS ENGINE
 ↓
FRONTEND
 ↓
TESTING
 ↓
DEPLOYMENT
```

**End of PRD — Version 1.0.0**
