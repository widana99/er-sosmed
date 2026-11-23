# Modern Fintech & Data Craft UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the ER Social Media web application into a world-class, human-crafted Modern Fintech & Data Craft interface featuring Plus Jakarta Sans and JetBrains Mono typography, solid matte high-contrast surfaces (anti-slop), and seamless mobile/tablet responsive navigation.

**Architecture:** 
- Typography & Theme Token Layer: Google Fonts (Plus Jakarta Sans + JetBrains Mono) with three-layer semantic CSS variables and Tailwind extensions.
- Layout & Navigation Shell: Dual-mode responsive navigation comprising a desktop static rail (`≥ 1024px`), an off-canvas slide-out drawer (`< 1024px`), a mobile sticky command bar with hamburger trigger, and a floating bottom quick-nav dock.
- Component Craft: Solid matte surfaces with dual-layer ambient shadows, hairline borders, and strict 3–5 accent budget per viewport, eliminating AI-slop gradients and excessive blur.

**Tech Stack:** React 18, TypeScript 5.7, Tailwind CSS 3.4, Vite 6, Lucide Icons, Plus Jakarta Sans, JetBrains Mono.

## Global Constraints
- Typography: Headings must use `'Plus Jakarta Sans'` with `letter-spacing: -0.03em` and `text-wrap: balance`. Numerical/ER metrics must use `'JetBrains Mono'` with `tabular-nums`.
- Anti-Slop: No generic purple-to-cyan gradients, no page-wide blurs, no uniform pill-shaped cards. Max 1 glass element per view (Header bar only).
- Accessibility: Minimum 44x44px touch targets on mobile, WCAG AA/AAA contrast ratios on all text, support for `@media (prefers-reduced-motion: reduce)`.
- Responsive: Zero horizontal scroll overflow on viewports from 360px (mobile) to 1920px (ultrawide).

---

### Task 1: Typography & Design Tokens Foundation

**Files:**
- Modify: `frontend/index.html:8-13`
- Modify: `frontend/tailwind.config.js:10-58`
- Modify: `frontend/src/index.css:5-115`

**Interfaces:**
- Consumes: Google Fonts (`Plus Jakarta Sans`, `JetBrains Mono`)
- Produces: CSS variables (`--bg-canvas`, `--surface-solid`, `--surface-subtle`, `--border-hairline`, `--accent-brand`), utility classes (`.craft-card`, `.craft-input`, `.tabular-nums`)

- [ ] **Step 1: Update `frontend/index.html` font imports**
Replace Syne & Instrument Sans with Plus Jakarta Sans and JetBrains Mono.

- [ ] **Step 2: Update `frontend/tailwind.config.js`**
Configure font families (`font-sans: 'Plus Jakarta Sans'`, `font-display: 'Plus Jakarta Sans'`, `font-mono: 'JetBrains Mono'`) and semantic color tokens (`canvas`, `surface`, `ink`, `brand`).

- [ ] **Step 3: Update `frontend/src/index.css`**
Define high-contrast CSS variables, replace repetitive `.neoglass` with `.craft-card` (matte surface, hairline border, ambient dual-layer shadow), and add smooth exponential transitions.

- [ ] **Step 4: Verify Vite build**
Run: `npm run build` in `frontend/`
Expected: PASS with 0 errors.

---

### Task 2: Responsive Header with Mobile Hamburger Menu

**Files:**
- Modify: `frontend/src/components/Header.tsx`

**Interfaces:**
- Consumes: `onSearch`, `darkMode`, `setDarkMode`, `onToggleMobileMenu`
- Produces: Responsive Header component with mobile hamburger button, touch-friendly platform toggle, compact search bar, and clean language selector.

- [ ] **Step 1: Add hamburger toggle prop & button**
Update `HeaderProps` to accept `onToggleMobileMenu?: () => void` and render a hamburger button (`Menu` icon) on `<lg` screens.

- [ ] **Step 2: Make search input and platform switch responsive**
Refactor the search bar to fluid width with touch-friendly 44px min height, collapsing neatly on smaller screens without breaking layout.

- [ ] **Step 3: Clean solid styling for controls**
Remove excessive glass/blur pills in favor of crisp solid surfaces with fine hairline borders.

---

### Task 3: Dual-Mode Responsive Navigation (Desktop Sidebar & Mobile Drawer)

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: `activeTab`, `setActiveTab`, `selectedPlatform`, `setSelectedPlatform`, `isOpen` (mobile drawer), `onClose`
- Produces: Dual-mode navigation supporting desktop left rail and mobile animated off-canvas drawer with backdrop overlay.

- [ ] **Step 1: Implement mobile drawer overlay & slide animation**
Wrap the navigation in an off-canvas drawer container with backdrop blur overlay and `X` close button for mobile screens (`< 1024px`).

- [ ] **Step 2: Refactor brand badge & navigation items**
Update brand badge to clean Modern Fintech monogram (`ER` in Ultramarine), use Plus Jakarta Sans typography, and convert uppercase labels to clean sentence case.

- [ ] **Step 3: Add touch dismiss & Escape key accessibility**
Handle click outside backdrop and `Escape` key press to dismiss drawer on mobile.

---

### Task 4: Responsive App Shell & Mobile Quick Dock

**Files:**
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `Sidebar`, `Header`, view components
- Produces: Fluid `min-h-screen` layout with mobile drawer state and floating bottom navigation dock for fast one-thumb switching.

- [ ] **Step 1: Add mobile drawer state to `App.tsx`**
Initialize `const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)` and bind to `Header` and `Sidebar`.

- [ ] **Step 2: Implement Mobile Bottom Dock**
Render a fixed bottom navigation bar (`lg:hidden`) for the 4 core actions (Dashboard, Analyze, Leaderboard, History) with active indicators and safe-area padding.

- [ ] **Step 3: Update canvas container to fluid height**
Replace `h-screen overflow-hidden` with `min-h-screen flex flex-col lg:flex-row`, allowing natural scroll momentum on mobile browsers.

---

### Task 5: Dashboard & KPI Visual Craft Overhaul

**Files:**
- Modify: `frontend/src/components/KpiCard.tsx`
- Modify: `frontend/src/views/DashboardView.tsx`

**Interfaces:**
- Consumes: `DashboardKPI`, `KpiCard`
- Produces: Polished dashboard view with matte cards, JetBrains Mono numbers, responsive 1/2/4 column KPI grid, and horizontally scrollable audit table.

- [ ] **Step 1: Modernize `KpiCard.tsx`**
Update to `.craft-card`, use `JetBrains Mono` for tabular metrics, and apply clean high-contrast text hierarchy.

- [ ] **Step 2: Polish `DashboardView.tsx` layout**
Ensure responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`), add responsive table wrapper with overflow indicator, and align button CTAs to the new palette.

---

### Task 6: Build Verification & Final Polish

**Files:**
- Audit all touched files

- [ ] **Step 1: Run TypeScript & Vite build**
Run: `npm run build` in `frontend/`
Expected: Zero build errors.

- [ ] **Step 2: Verify responsive behavior & dark/light themes**
Ensure all components render smoothly without horizontal layout breaks on both light and dark themes.
