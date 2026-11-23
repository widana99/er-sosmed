# DESIGN.md — Design System & Visual Architecture
**Project:** Social Media Engagement Rate Analyzer  
**Design Philosophy:** *Minimalist Neoglass Editorial Analytics*  
**Quality Mandate:** Anti-AI-Slop, High-Agency Craft, Production-Grade Polish

---

## 1. Visual Atmosphere & Philosophy

Aplikasi ini adalah instrumen analitik internal kelas enterprise untuk analis dan brand strategist. Desain harus memancarkan **kredibilitas analitis, presisi bedah, dan keanggunan minimalis modern**, bukan template dashboard generik.

### Dial Calibration
* **Density:** `6.5 / 10` (Balanced Analytics / Cockpit) — Ruang pandang efisien tanpa visual kram, angka metrik terbaca cepat dengan jarak napas arsitektural.
* **Variance (Rhythm):** `7.0 / 10` (Asymmetric Hierarchy) — Menghindari susunan grid kaku seragam. Setiap area memiliki peran visual berbeda (hero KPI besar vs list histori ringkas vs detail formula).
* **Motion:** `4.0 / 10` (Micro-Engineered Fluidity) — Transisi responsif berbasis kurva fisika (`ease-out-expo`), tanpa delay animasi lambat, dan tanpa pantulan kartun (*bouncing slop*).
* **Neoglass Dose:** `Controlled Accent (Maksimal 2 elemen per viewport)` — Material kaca digunakan secara selektif untuk elemen mengambang di atas layer dasar (seperti Sticky Top Search Bar dan Modal/Drawer Inspector), bukan untuk membungkus semua kartu.

---

## 2. Anti-Slop Hard Gates & Banned Patterns

Untuk menjamin UI tidak terlihat seperti hasil AI generik (*AI Slop*):

1. **DILARANG Gradien Ungu/Biru Neon Klise (R-01):**
   * *Banned:* `bg-gradient-to-r from-purple-500 to-indigo-600` pada seluruh tombol, header, atau background glow.
   * *Standard:* Warna dasar netral monokromatik berbobot (charcoal/obsidian/chalk) dengan satu aksen fungsional terkalibrasi.
2. **DILARANG "Glass Soup" (R-10):**
   * *Banned:* Memasang `backdrop-blur` dan transparansi putih buram di navbar, sidebar, KPI cards, table row, dan modal secara bersamaan.
   * *Standard:* Bidang data utama (tabel, card performa) berdiri di atas permukaan solid (opaque). Efek neoglass dibatasi hanya pada elemen elevasi tinggi (elevated overlays, search command bar, dan floating tooltips).
3. **DILARANG Nesting Card Berulang (No Cards-in-Cards):**
   * *Banned:* Card di dalam Card di dalam Card dengan padding tebal yang membuang ruang.
   * *Standard:* Gunakan grid hairline border, spasi ritmis, dan tipografi untuk pemisahan data.
4. **DILARANG Pill-Radius Berlebihan (R-11):**
   * *Banned:* Semua tombol, card, input, dan tag berbentuk kapsul/pill penuh (`rounded-full`).
   * *Standard:* Radius tegas dan terstruktur: `rounded-lg (8px)` untuk input dan card, `rounded-md (6px)` untuk tombol dan badge, `rounded-full` hanya untuk avatar akun.
5. **DILARANG Low-Contrast Teks Abu-abu (WCAG AA/AAA Guaranteed):**
   * *Banned:* Teks body abu-abu pudar di atas background kaca putih susu.
   * *Standard:* Rasio kontras teks body $\ge 4.5:1$ terhadap background di belakang kaca.

---

## 3. Color Tokens & Neoglass Materials

Sistem warna menggunakan palet dua mode (Default: Clean High-Contrast Light Mode dengan dukungan Sleek Dark Mode).

### 3.1 Color Palette

| Token Semantic | Light Mode (Hex / HSL) | Dark Mode (Hex / HSL) | Role / Usage |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#F7F7F5` (Stone Warm) | `#0B0C0E` (Deep Onyx) | Background aplikasi utama |
| `--surface-solid` | `#FFFFFF` | `#12141A` | Kartu data, container tabel |
| `--surface-subtle` | `#EFEFED` | `#191C24` | Background secondary, table headers |
| `--border-hairline` | `rgba(0, 0, 0, 0.08)` | `rgba(255, 255, 255, 0.08)` | Pemisah data 1px, pembatas card |
| `--border-specular` | `rgba(255, 255, 255, 0.60)` | `rgba(255, 255, 255, 0.15)` | Highlight bibir atas kaca (top rim) |
| `--text-primary` | `#121316` | `#F4F5F7` | Headings, nilai ER, nama akun |
| `--text-secondary` | `#525866` | `#99A0AE` | Subtitle, label metrik, deskripsi |
| `--text-tertiary` | `#868C98` | `#636A79` | Metadata caption, timestamp histori |
| `--accent-brand` | `#4F46E5` (Iris Indigo) | `#6366F1` | Tombol primer, active state chart |
| `--accent-hover` | `#4338CA` | `#4F46E5` | Hover state tombol primer |

### 3.2 Platform-Specific Indicators
* **Instagram:** `#E1306C` (Accent badge & platform filter icon)
* **TikTok:** `#111111` (Light) / `#00F2FE` (Dark accent highlight)
* **Data Origin Badges:**
  * `MANUAL`: `#4F46E5` tint (Biru presisi)
  * `SIMULATED`: `#D97706` amber tint dengan badge wajib `[SIMULATED DATA]`
  * `CSV_IMPORT`: `#059669` emerald tint

### 3.3 Neoglass Material Specifications

Material neoglass dirancang presisi dengan ilusi optik pembiasan cahaya (specular highlight):

```css
/* Light Mode Neoglass Spec */
.neoglass-light {
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 
    0 1px 0 0 rgba(255, 255, 255, 0.8) inset, /* Top specular rim */
    0 8px 24px -4px rgba(18, 19, 22, 0.04);
}

/* Dark Mode Neoglass Spec */
.neoglass-dark {
  background: rgba(18, 20, 26, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 1px 0 0 rgba(255, 255, 255, 0.12) inset, /* Top specular rim */
    0 12px 32px -4px rgba(0, 0, 0, 0.40);
}
```

---

## 4. Typographic Architecture

Kombinasi editorial profesional: Display Heading berkarakter dengan angka metrik teknis berpresisi tinggi.

* **Display & Heading:** `Manrope`, sans-serif.
  * H1 (Page Title): `text-2xl` s.d. `text-3xl` (`24px - 30px`), `font-semibold`, tracking `-0.025em`, `text-wrap: balance`.
  * H2 (Section Title): `text-lg` (`18px`), `font-medium`, tracking `-0.015em`.
  * H3 / Card Title: `text-sm` (`14px`), `font-medium`, uppercase tracking `0.04em`, warna `--text-secondary`.
* **Body & UI Text:** `Inter` atau `Geist Sans`, sans-serif.
  * Body Standard: `text-sm` (`14px`), line-height `1.5` (`leading-relaxed`), max line length `65ch`.
  * UI Small: `text-xs` (`12px`), line-height `1.4`.
* **Data, Metrik & Rumus:** `Geist Mono` / `JetBrains Mono` / `ui-monospace`.
  * Angka ER Utama: `text-3xl` (`32px`), `font-bold`, tabular numbers (`font-variant-numeric: tabular-nums`).
  * Angka Tabel & Formula: `text-xs` atau `text-sm`, `font-mono`. Memastikan komparasi visual baris demi baris selalu rata.

---

## 5. Layout & Spatial System

### 5.1 Shell Structure
* **App Shell:** Fixed Left Navigation Rail / Minimal Sidebar (`w-64` collapsible to `w-20` on tablet).
* **Main Stage:** `max-w-7xl mx-auto px-6 py-8`.
* **Floating Header Bar:** Neoglass floating command strip di bagian atas layar untuk Global Account Search & Quick Platform Switcher (Instagram / TikTok).

### 5.2 Spacing & Rhythm
* Menggunakan kelipatan 4px (`4px, 8px, 12px, 16px, 24px, 32px, 48px`).
* Spasi internal card: `p-5` atau `p-6` (tidak boleh terlalu sempit atau boros ruang).
* Jarak antar seksi dashboard: `gap-6` atau `gap-8`.

---

## 6. Component Specs & States

### 6.1 Engagement Rate Metric Hero
* **Struktur:** Kartu fokus utama dengan angka ER besar, diikuti pill breakdown rumus di bawahnya:
  * Formula Badge (`Follower-based` / `View-based`).
  * Sample Counter (`Sample: 10 Posts`).
  * Source Flag (`MANUAL`, `SIMULATED`, `CSV`).
* **Interaksi:** Hover memunculkan micro-tooltip transparansi kalkulasi formula aslinya:
  $$\frac{\text{Total Likes (612)} + \text{Total Comments (28)}}{\text{Followers (12,500)}} = 5.12\%$$

### 6.2 Data Input & CSV Upload Zone
* **Dropzone:** Border putus-putus 1px (`border-dashed border-border-hairline`), background halus saat idle, aksen specular saat drag-over.
* **Inline Validation:** Validasi instan baris CSV (deteksi format, tipe platform, jumlah post).

### 6.3 Post Performance Table
* **Header:** Sticky, flat solid background dengan border 1px bawah.
* **Row Behavior:** Transisi hover lembut (`transition-colors duration-150 ease-out bg-surface-subtle/50`).
* **Numeric Columns:** Selalu right-aligned dengan font monospaced tabular.

### 6.4 State Handling (Komprehensif)
* **Default:** Data ter-render tajam.
* **Hover / Focus-Visible:** Focus ring 2px dengan offset (`ring-2 ring-accent-brand ring-offset-2`).
* **Loading / Skeleton:** Shimmer gradient monokrom halus (`linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)`), bukan spinner berputar murahan.
* **Empty State:** Ilustrasi geometris minimalis + panduan tindakan jelas ("Belum ada data analisis untuk akun ini. Masukkan postingan manual atau import file CSV").
* **Error State:** Banner kontras terukur dengan border aksen amber/merah halus dan tombol tindakan perbaikan ("Cek format username").

---

## 7. Motion & Interaction Engine

* **Default Timing Curve:** `cubic-bezier(0.16, 1, 0.3, 1)` (Quartic/Exponential ease-out).
* **Micro-durations:**
  * Button active press: `scale(0.98)` dalam `100ms`.
  * Dropdown & Tooltip reveal: `fade + translateY(4px)` dalam `180ms`.
  * Modal/Drawer open: `300ms` dengan backdrop blur fade.
* **Prefers-Reduced-Motion:**
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

---

## 8. Summary Checklist — Quality Verification

- [x] Tidak ada gradien ungu neon generik tanpa identitas produk.
- [x] Efek neoglass terbatas sebagai aksen fungsional (maks. 2 elemen di viewport).
- [x] Tidak ada nested cards slop.
- [x] Seluruh teks memenuhi kontras WCAG AA ($\ge 4.5:1$).
- [x] Angka analitik menggunakan font monospaced tabular (`font-variant-numeric: tabular-nums`).
- [x] Transparansi formula dan pelabelan sumber data (`SIMULATED`, `MANUAL`, `CSV`) memiliki slot visual khusus.
- [x] Dukungan penuh untuk mode aksesibilitas `prefers-reduced-motion`.
