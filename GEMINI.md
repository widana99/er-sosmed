# Project Directives & Master Skill Orchestration

Semua proses perancangan, pengembangan, dan modifikasi kode pada proyek ini secara otomatis dan permanen menerapkan seluruh skills & standar kualitas yang terpasang:

## 1. Craft, UI & Visual Engine (`impeccable`, `scroll-craft`, `antislop-ui`, `ui-craft`, `ui-ux-pro-max`, `emil-design-eng`, `animate`)
- **Impeccable Craft Standards**:
  - Kontras tinggi dan terverifikasi (WCAG AA/AAA: teks body ≥ 4.5:1, large text ≥ 3:1).
  - Tipografi matang: `clamp()` display ceiling ≤ 6rem, letter-spacing display ≥ -0.04em, line length 65–75ch, `text-wrap: balance` pada headings.
  - Skala z-index semantik (dropdown → sticky → modal-backdrop → modal → toast → tooltip).
  - Larangan keras nesting card berulang (*no cards-in-cards slop*).
  - State komprehensif: default, hover, focus-visible, active, disabled, loading/skeleton, empty, error.
- **Scroll & Motion Craft (`scroll-craft`, `animate`, `emil-design-eng`)**:
  - Transisi bertenaga dan fluid, kurva exponential (`ease-out-quart/expo`), tanpa bouncing kartun.
  - Dukungan wajib `@media (prefers-reduced-motion: reduce)`.
  - Scrollytelling dan timeline interaktif untuk eksplorasi metrik/dashboard secara dinamis tanpa monoton.

## 2. Anti-Bloat, Simplicity & YAGNI Engine (`ponytail`)
- **The Ponytail Ladder**:
  1. *Does it need to exist?* Jika spekulatif / "buat nanti" -> skip (YAGNI).
  2. *Sudah ada di codebase?* Reuse pattern/util yang ada.
  3. *Stdlib / native platform covers it?* Gunakan fitur bawaan browser/bahasa/DB constraint sebelum menarik dependensi pihak ketiga.
  4. *Minimal code that works*: Jangan tulis 50 baris jika 1 baris standar cukup.
  5. *Root cause fix*: Perbaiki di titik pusat sumber masalah, bukan tambal gejala di setiap caller.
  - Bebas over-engineering: tidak ada interface dengan 1 implementasi, tidak ada factory untuk 1 produk, tidak ada boilerplate kosong.

## 3. Humanized Communication & Clean Copy (`unslop`, `antislop-copywriting`, `caveman`)
- **Unslop & No AI Slop**: Hapus frasa klise AI ("In today's fast-paced landscape", "Here's the thing", "Delve", "Leverage"). Tulisan lugas, tajam, profesional, dan manusiawi.
- **High Signal-to-Noise (`caveman`)**: Komunikasi teknis padat, berbobot, langsung ke inti solusi tanpa basa-basi atau repetisi. Komentar kode hanya untuk logika non-trivial (*why*, bukan *what*).

## 4. Backend Architecture, Database & Security (`api-and-interface-design`, `security-and-hardening`, `accidental-data-loss-prevention`)
- **Modular & Clean Architecture**: Pemisahan layer yang jelas (Routing/Handler -> Service/Domain Logic -> Repository/PostgreSQL).
- **Security by Default**:
  - Sanitasi ketat untuk semua input pengguna dan parsing file CSV.
  - Parameterized queries wajib pada PostgreSQL (anti SQL Injection).
  - Penanganan error terstruktur (envelope konsisten, tanpa membocorkan stack trace internal ke klien).
- **Accidental Data Loss Prevention**: Tidak ada query mutasi destruktif tanpa konfirmasi dan klausa filter eksplisit.

## 5. Performance & Verification (`performance-optimization`, `systematic-debugging`, `verification-before-completion`)
- Profil performa render dan query efisien.
- Debugging berbasis investigasi akar masalah (*evidence first*).
- Verifikasi fungsional sebelum menandai task selesai.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) and then the skill for the task:
- UI / visual: `C:\Users\Lenovo\.gemini\config\skills\antislop-ui\SKILL.md`
- Copy & text: `C:\Users\Lenovo\.gemini\config\skills\antislop-copywriting\SKILL.md`
- People: `C:\Users\Lenovo\.gemini\config\skills\antislop-human\SKILL.md`
- Mobile / responsive: `C:\Users\Lenovo\.gemini\config\skills\antislop-layoutmobile\SKILL.md`
- Code comments: `C:\Users\Lenovo\.gemini\config\skills\antislop-code\SKILL.md`
<!-- antislop:end -->
