# Design Specification: Modern Fintech & Data Craft UI Overhaul

- **Status:** Approved
- **Date:** 2026-10-02
- **Author:** Antigravity Team & Lead UI/UX Design Engineer
- **Style Direction:** Modern Fintech & Data Craft (Anti-Slop, High-Contrast WCAG AAA, Fluid Mobile-First)

---

## 1. Overview & Objective

The current interface relies on generic AI design tropes: excessive purple-to-cyan gradients, heavy multi-layered backdrop blurs (`neoglass`), repetitive pill buttons, and fixed desktop-only layouts (`h-screen overflow-hidden` with a rigid `w-64` sidebar) that break on mobile and tablet devices.

This specification redesigns the entire application to an authoritative, human-crafted **Modern Fintech & Data Craft** standard:
1. **Premium Typographic Pairing**: **Plus Jakarta Sans** (Headings, Display & Body UI) paired with **JetBrains Mono** (Tabular numerical data & audit metrics), replacing generic AI display fonts and gratuitous monospace labels.
2. **Anti-Slop Surface & Color Architecture**: Moving from hazy glassmorphism to **Solid Matte Obsidian / Warm Alabaster Surfaces**, crisp hairline borders (`1px solid rgba(...)`), dual-layer ambient shadows, and a restrained **Precision Ultramarine** accent budget (max 3–5 placements per viewport).
3. **Full Fluid Responsiveness**:
   - Mobile Off-Canvas Drawer Navigation (`< 1024px`) with hamburger trigger and swipe-ready backdrop.
   - Bottom Mobile Navigation Dock for one-thumb access to core workflows (Dashboard, Analyze, Leaderboard, History).
   - Responsive Fluid Canvas replacing rigid height clipping, ensuring native momentum scrolling across iOS, Android, tablets, and desktop.
   - Responsive Header with collapsible search bar and touch-friendly controls (min 44px hit targets).

---

## 2. Typography Architecture

### 2.1 Font Stack Hierarchy
```css
/* Display & Primary Headings (H1 - H3) */
font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
font-weight: 700 / 800;
letter-spacing: -0.03em;
text-wrap: balance;
line-height: 1.15 - 1.25;

/* Body, Navigation, Inputs & Secondary Copy */
font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
font-weight: 400 / 500 / 600;
letter-spacing: -0.01em;
line-height: 1.55;
text-transform: none; /* Banning artificial all-caps on descriptive copy */

/* Numerical, ER Percentages, Financial Metrics & Audit Timestamps */
font-family: 'JetBrains Mono', ui-monospace, monospace;
font-feature-settings: "zero" 1, "tnum" 1;
font-variant-numeric: tabular-nums;
```

### 2.2 Google Fonts Embed
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
```

---

## 3. Surface & Color System (Anti-Slop Design Engine)

### 3.1 Design Tokens (CSS Variables)

| Token | Light Mode (Warm Alabaster) | Dark Mode (Deep Obsidian) | Usage |
|---|---|---|---|
| `--bg-canvas` | `#F8F9FA` | `#090A0E` | Page background |
| `--surface-solid` | `#FFFFFF` | `#11141B` | Primary cards, panels, tables |
| `--surface-subtle` | `#F1F3F5` | `#171B24` | Inset containers, search inputs |
| `--surface-elevated` | `#FFFFFF` | `#181C26` | Modals, floating dropdowns |
| `--border-hairline` | `rgba(15, 20, 28, 0.08)` | `rgba(255, 255, 255, 0.07)` | Structured card borders |
| `--border-hover` | `rgba(37, 99, 235, 0.35)` | `rgba(59, 130, 246, 0.40)` | Interactive focus & hover state |
| `--text-primary` | `#0F141C` (WCAG 16.5:1) | `#F8F9FA` (WCAG 17.2:1) | High-contrast headings & data |
| `--text-secondary` | `#475467` (WCAG 6.2:1) | `#98A2B3` (WCAG 6.8:1) | Body copy, secondary stats |
| `--text-tertiary` | `#667085` (WCAG 4.8:1) | `#667085` (WCAG 4.5:1) | Metadata, captions |
| `--accent-brand` | `#2563EB` (Ultramarine) | `#3B82F6` (Electric Blue) | Key CTA, active indicators |
| `--accent-brand-subtle` | `#EFF6FF` | `rgba(59, 130, 246, 0.12)` | Active pill badge background |

### 3.2 Shadow & Elevation Hierarchy (Dual-Layer Ambient)
- Flat Solid Card: `box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03)` with `1px solid var(--border-hairline)`.
- Interactive Card (Hover): `box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)`.
- Dark Mode Card: `box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.5)` with `1px solid var(--border-hairline)`.
- Strictly capped glassmorphism: Only the sticky Top Bar uses `backdrop-filter: blur(12px)` for smooth scroll bleed; cards and panels remain solid matte.

---

## 4. Responsive Layout Architecture

### 4.1 Breakpoint Strategy
- **Mobile (< 768px)**:
  - Hidden desktop sidebar.
  - Sticky Top Bar with hamburger button, compact ER logo, platform selector, and theme toggle.
  - Floating Bottom Navigation Dock for fast thumb switching (Dashboard, Analyze, Leaderboard, History).
  - Slide-out Off-Canvas Drawer triggered by hamburger menu for full access to all 7 tabs, filters, and profile details.
  - Single column grids (`grid-cols-1`).
- **Tablet (768px – 1023px)**:
  - Collapsible compact rail or off-canvas drawer.
  - 2-column KPI grids (`grid-cols-2`).
  - Fluid charts with horizontal swipe capability.
- **Desktop (≥ 1024px)**:
  - Permanent left Sidebar rail (`w-64`).
  - 4-column KPI grids (`grid-cols-4`).
  - Dual-column Chart + Side-panel composition.

### 4.2 Safe-Area Insets & Fluid Height
- Replace `h-screen overflow-hidden` with `min-h-screen flex flex-col lg:flex-row`.
- Main view has dynamic padding: `px-4 sm:px-6 lg:px-8 py-5 sm:py-7`.
- Safe area bottom padding for iPhone navigation bars: `pb-24 lg:pb-10`.

---

## 5. Component Refactoring Plan

1. **`index.html` & `tailwind.config.js`**:
   - Update fonts to `Plus Jakarta Sans` and `JetBrains Mono`.
   - Configure semantic colors (`canvas`, `surface`, `ink`, `brand`, `border`).
2. **`src/index.css`**:
   - Overhaul core styles: remove generic `.neoglass` on all cards, create `.craft-card`, `.craft-input`, `.craft-badge`.
   - Add hardware-accelerated animations (`cubic-bezier(0.16, 1, 0.3, 1)`).
3. **`src/components/Sidebar.tsx`**:
   - Support both Desktop Static Sidebar and Mobile Slide-Out Drawer with backdrop.
   - Refined typography and platform toggle.
4. **`src/components/Header.tsx`**:
   - Responsive layout with hamburger menu trigger for mobile.
   - Collapsible search input with responsive touch target (min 44px).
5. **`src/App.tsx`**:
   - Integrate mobile navigation state (`isMobileMenuOpen`).
   - Add Mobile Bottom Dock for instant navigation.
6. **`src/views/DashboardView.tsx` & `src/components/KpiCard.tsx`**:
   - Modernized KPI cards with clean typography and `tabular-nums`.
   - Responsive table with clean horizontal scroll and sticky first column.
