# Architecture & Code Quality Review — Photonics Calculators

**Reviewer:** Senior Photonics Engineer / Software Architect  
**Date:** 2026-04-04  
**Scope:** Full codebase — 536 pages, shared components, build config, SEO, accessibility

---

## Executive Summary

This is an impressive scope of content — 524 calculator pages across 10 photonics domains with real physics, interactive charts, and a polished dark UI. However, the project has **critical architectural problems** that will hurt SEO, performance, and maintainability at scale. The biggest issues: (1) every calculator page is a client component with no metadata, (2) Plotly.js (~4.8 MB minified) ships on 45+ pages, (3) `ignoreBuildErrors: true` hides TypeScript problems, and (4) duplicate/overlapping slugs exist. Below is the full breakdown.

---

## 1. Project Structure

```
src/app/
├── page.tsx (homepage — server component ✓)
├── layout.tsx (root layout — server component ✓)
├── sitemap.ts ✓
├── robots.ts ✓
├── about/ (1 page)
├── detectors/ (1 category + ~59 calculators)
├── fiber-optics/ (1 category + ~53 calculators)
├── free-space-comms/ (1 category + ~29 calculators)
├── imaging/ (1 category + ~79 calculators)
├── laser-safety/ (1 category + ~51 calculators)
├── materials/ (1 category + ~48 calculators)
├── polarization/ (1 category + ~35 calculators)
├── spectroscopy/ (1 category + ~59 calculators)
├── thin-film/ (1 category + ~50 calculators)
└── wave-optics/ (1 category + ~51 calculators)
```

10 categories × ~50 calculators each = 524 individual pages + 10 category pages + root + about = 536 total. Flat URL hierarchy: `/category/slug`. Clean and sensible.

### 1.1 🔴 Critical: All 524 calculator pages are `"use client"` with ZERO metadata

Every single individual calculator page has `"use client"` at the top and **no `export const metadata`** or `generateMetadata`. Only the 10 category landing pages and root layout export metadata.

**Impact:**
- Google indexes 524 pages with **no title, no description** — they'll all show as "Photonics Calculators - 100+ Interactive Optics Tools" (from the root layout) or get auto-generated titles from `<h1>`.
- Client components cannot export `metadata` in Next.js — this is a fundamental framework constraint being violated.
- **Every page needs to be split into a server component wrapper (with metadata) and a client component for interactivity.**

**Fix pattern:**
```tsx
// page.tsx (server component)
import { Metadata } from "next";
import DarkCurrentClient from "./dark-current-client";

export const metadata: Metadata = {
  title: "Dark Current vs Temperature Calculator",
  description: "Silicon detector dark current exponential doubling model..."
};

export default function DarkCurrentPage() {
  return <DarkCurrentClient />;
}
```

### 1.2 🔴 Critical: `ignoreBuildErrors: true` in next.config.js

```js
typescript: { ignoreBuildErrors: true }
```

With 524 client pages, there are almost certainly TypeScript errors being silently ignored. This is a ticking bomb — type errors can cause runtime bugs that slip through. The `CalculatorTemplate` component exists but isn't used by any calculator page, suggesting it was an abandoned refactor.

**Fix:** Remove this flag and fix all type errors incrementally.

### 1.3 🟠 Major: `reactStrictMode: false`

Strict mode catches common React bugs (double-mounting effects, stale state). Disabling it in production suggests the codebase has issues that only appear in strict mode.

---

## 2. Component Review

### 2.1 `CalculatorShell` (shared wrapper)

```tsx
"use client";
export default function CalculatorShell({ title, description, backHref, backLabel, children, maxWidthClassName = "max-w-4xl" }: CalculatorShellProps) {
```

**Issues:**
- 🔵 **Nit:** `"use client"` is unnecessary here — it only renders static HTML + a Link. But it wraps client children, so it's forced. The metadata problem (§1.1) is the real issue.
- 🔵 **Nit:** No `<nav>` element or `aria-label` on the back link.

### 2.2 `ChartPanel` (Plotly wrapper)

```tsx
"use client";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
```

**Issues:**
- 🟠 **Major:** `any` types on `data` and `layout` props — no type safety for Plotly config.
- 🟡 **Minor:** The `Plot` import uses `react-plotly.js` which depends on the full `plotly.js` (~8MB unminified). The `plotly.js-dist-min` package (4.8 MB) is in `package.json` but `react-plotly.js` doesn't use it by default.
- 🔵 **Nit:** No loading skeleton while Plotly loads.

### 2.3 `InputSlider`

```tsx
"use client";
export default function InputSlider({ label, value, onChange, min, max, step = 1, unit }: InputSliderProps) {
```

**Issues:**
- 🟡 **Minor:** The `<label>` wraps the slider but uses a `<span>` for the label text, so the `for`/`htmlFor` association is implicit. This works but isn't ideal for accessibility.
- 🟡 **Minor:** No `aria-label` on the range input — screen readers may not announce the purpose clearly.
- 🟡 **Minor:** The number input allows values outside min/max — no `clamp` or validation.

### 2.4 `ResultCard`

Clean, simple. No issues beyond being `"use client"` unnecessarily (it's purely presentational).

### 2.5 `CalculatorTemplate` (UNUSED)

This component exists in `src/lib/calculator-template.tsx` but is **not imported by any page**. It provides a generic calculator UI with inputs, outputs, and optional Plotly chart — but all 524 actual calculator pages use `CalculatorShell` + inline JSX instead.

🟠 **Major:** Dead code. Either delete it or refactor pages to use it. The inconsistency suggests abandoned plans.

### 2.6 `complex.ts` (complex number library)

Clean utility. Used by `CalculatorTemplate` (which is unused) and possibly some calculators. The Jones calculus page has its own inline complex math (`cmul`, `cadd`, etc.) instead of using this shared module.

🟡 **Minor:** Code duplication — Jones calculus page reimplements what `complex.ts` provides.

---

## 3. Homepage Components

### 3.1 `PhotonicsHeroMap`

**The good:** Beautiful SVG interactive hero with beam splitting animation, keyboard accessibility, `prefers-reduced-motion` support, mobile fallback. This is genuinely impressive work.

**Issues:**
- 🟡 **Minor:** `"use client"` — the entire hero map is client-side including the SVG paths which are static. Could be a server component with a thin client island for hover/selection state.
- 🟡 **Minor:** Desktop hero image (`photonics-hero-desktop.jpg`) is used for mobile too — should have a separate mobile crop for performance.
- 🔵 **Nit:** `useRouter` for navigation — `Link` would be more appropriate for the SVG click handlers.

### 3.2 `SiteSearch`

```tsx
const results = useMemo(() => {
  if (!q) return items.slice(0, 8);
  // ...filters 536 items client-side
}, [items, q]);
```

🟠 **Major:** The search index (`getSearchIndex()`) is built at **request time by scanning the filesystem** with `readdirSync`/`readFileSync`. This runs on every page load. For 536 pages, this means reading 536 files from disk on every request.

- In dev mode: slow but tolerable.
- In production on Vercel: this runs at the edge and the filesystem scan is cached per deployment, but it's still a cold-start penalty.
- **Fix:** Generate a static JSON search index at build time and import it.

🟡 **Minor:** Linear scan of 536 items with no fuzzy matching — acceptable for now but won't scale past ~1000 items.

### 3.3 `CategoryDetailPanel`

Server-compatible (no `"use client"`). Clean. No issues.

---

## 4. Architecture Critique

### 4.1 Shared Component Pattern

The pattern is: `CalculatorShell` (wrapper) → inline inputs + `ResultCard` + `ChartPanel`. This is **acceptable but inconsistent**:

- The dark current page uses inline `<label>` + `<input>` for all controls
- The FTIR page uses inline `<label>` + `<input>` + `<select>`  
- The Jones calculus page uses inline buttons and tables
- `InputSlider` exists but is barely used

🟠 **Major:** No consistent input pattern across calculators. Some have range sliders, some have number inputs, some have both, some have buttons. `InputSlider` is a good component but it's orphaned.

### 4.2 Data Flow

All calculators use `useState` + `useMemo` — simple, correct, no external state management needed. This is fine for isolated calculators.

### 4.3 🟠 Major: Plotly.js Bundle Impact

`plotly.js-dist-min` is 4.8 MB minified (gzipped: ~1.5 MB). It's loaded via `dynamic()` import with `ssr: false` on 45+ pages that use `ChartPanel`. 

**Problems:**
- Each page loads Plotly independently — no shared bundle across pages (dynamic import means separate chunks, but Next.js should deduplicate if the same import path is used).
- 4.8 MB of JavaScript for a line chart is absurd. Most calculators only need scatter/line plots.
- **Recommendation:** Replace with a lightweight charting library (Chart.js ~65KB, uPlot ~45KB, or SVG-based Recharts ~200KB). Reserve Plotly only for the few calculators that need 3D plots or interactivity beyond basic charts.

### 4.4 🔴 Critical: `CalculatorTemplate` vs Actual Pages

The `CalculatorTemplate` in `src/lib/` provides a clean declarative API:

```tsx
<CalculatorTemplate
  title="..."
  inputs={[{ name, label, min, max, default, step, unit }]}
  calculate={(inputs) => ({ result: ... })}
  outputs={[{ name, label, unit }]}
  plot={{ data: (inputs) => [...], layout: {...} }}
/>
```

But **zero pages use it**. Instead, every page has ~100-200 lines of boilerplate recreating the same pattern. This means:
- Changing the UI requires editing 524 pages instead of 1 component
- Input validation, error handling, and a11y improvements must be repeated 524 times
- The `InputSlider` component is wasted

---

## 5. Calculator Page Consistency

### Sampled pages:
- **Detectors:** `dark-current/page.tsx` — uses CalculatorShell + inline inputs + ResultCard + ChartPanel. Formula shown. Good.
- **Polarization:** `jones-calculus/page.tsx` — uses CalculatorShell but no ChartPanel. Custom table UI. Reinvents complex math locally.
- **Spectroscopy:** `ftir-resolution/page.tsx` — uses CalculatorShell + ChartPanel (double-nested!). Formula shown.
- **Materials:** `uv-materials/page.tsx` (first in dir) — uses CalculatorShell + ChartPanel. Has `baseLayout` and `plotConfig` constants defined after the component (works due to hoisting but confusing).

### Consistency findings:

🟠 **Major:** Inconsistent input UIs — some pages use range sliders, some use number inputs, some use both. No standard pattern.

🟡 **Minor:** Formula display is inconsistent — some pages show formulas in a gray box, some don't. The FTIR page shows HTML subscripts, the dark current page shows Unicode.

🟡 **Minor:** ChartPanel is sometimes double-wrapped (FTIR page wraps it in another `bg-gray-900` div, but ChartPanel already has that background).

🟡 **Minor:** The UV materials page defines `baseLayout` and `plotConfig` as module-level constants after the component export — works but violates convention.

---

## 6. Category Landing Pages

Reviewed: spectroscopy, laser-safety, thin-film.

All follow the same pattern: `Metadata` export + hardcoded array of calculators + grid of links.

🟠 **Major:** The calculator lists are **hardcoded** and can get out of sync with actual pages. E.g., thin-film has 18 items in its list but claims 51 calculators in `home-categories.ts`. If a page exists on disk but isn't in the category list, it's orphaned.

🟡 **Minor:** These are just link lists with no introductory content, no visual hierarchy, no search/filter. Compare to the homepage which is much more polished.

🟡 **Minor:** Some category pages have duplicate entries in their lists (spectroscopy has "Stray Light Rejection" twice with different slugs).

---

## 7. Specific Checks

### 7.1 SEO Metadata

🔴 **Critical:** 524 of 536 pages have **no metadata**. Only category pages and root have metadata. Google will index these as untitled/undescribed pages. This is the single biggest problem for discoverability.

🔵 **Nit:** The about page has no metadata either.

### 7.2 Duplicate/Overlapping Slugs

🟠 **Major:** Multiple overlapping calculator pairs exist:
- `detectors/ccd-cmos` and `detectors/ccd-vs-cmos` — likely the same topic
- `fiber-optics/connector-return` and `fiber-optics/connector-return-loss`
- `fiber-optics/dispersion-comp` and `fiber-optics/dispersion-compensation`
- `fiber-optics/micro-bend` and `fiber-optics/micro-bending-loss`
- `fiber-optics/macro-bend` and `fiber-optics/macro-bending-loss`

These create confusing URLs, split SEO authority, and risk having near-duplicate content.

### 7.3 Dead Code

- 🟠 `src/lib/calculator-template.tsx` — unused, 100+ lines
- 🟡 `src/lib/complex.ts` — used by `calculator-template.tsx` (which is unused) and possibly not by any active page
- 🟡 `src/components/input-slider.tsx` — appears to be unused by most pages

### 7.4 Internal Link Validity

🟡 **Minor:** Category pages have hardcoded link arrays that may reference non-existent pages or miss existing ones. No automated validation.

### 7.5 Dark Theme Consistency

🟡 **Minor:** Mostly consistent (`bg-gray-950`, `bg-gray-900`, `text-white`), but the homepage uses `bg-[#040712]` and `bg-[#050814]` while calculators use `bg-gray-950`. Minor visual inconsistency.

### 7.6 Mobile Responsiveness

🟡 **Minor:** Calculators use `grid-cols-1 sm:grid-cols-2` and `max-w-4xl` — functional but basic. The hero map has a mobile fallback. No dedicated mobile testing is evident but the Tailwind responsive classes suggest it should work.

### 7.7 Accessibility (a11y)

🟠 **Major:** 
- Range inputs lack `aria-label` or associated labels in many pages
- No skip-to-content link
- No focus management between sections
- Color contrast: `text-gray-500` on `bg-gray-900` may fail WCAG AA
- The SVG hero has good keyboard support but most calculator pages don't

🟡 **Minor:**
- No `lang` attribute issues (it's set in layout)
- No landmark regions (`<nav>`, `<aside>`, `<section>` with labels)
- No ARIA live regions for dynamic result updates

### 7.8 Error Boundaries

🟠 **Major:** No error boundaries anywhere. If a calculator's `calculate()` function throws (e.g., `Math.log` of negative number, division by zero), the entire page crashes with a white screen. With 524 pages of physics calculations, this **will** happen.

### 7.9 Performance

🟠 **Major:** Plotly.js loading on 45+ pages (see §4.3). Each chart page ships ~1.5 MB gzipped JS just for charting.

🟡 **Minor:** No image optimization evidence beyond Next.js Image defaults. The hero background image loads at full resolution.

🟡 **Minor:** The search index filesystem scan at request time (see §3.2).

### 7.10 Security

🟡 **Minor:** No user input is persisted or sent to a server — all calculations are client-side. Low risk. The `Number(e.target.value)` pattern doesn't validate for NaN/Infinity in some places.

🟡 **Minor:** No CSP headers configured in `next.config.js`.

---

## 8. Physics Accuracy Spot-Check

As a photonics engineer:

- ✅ Dark current doubling model: correct (`I = I₀ · 2^((T-25)/T_d)`)
- ✅ Jones calculus: correct matrix definitions for polarizers and waveplates
- ✅ FTIR resolution: correct (`δν = 1/Δ_max`), apodization factors reasonable
- ✅ Sellmeier equation: correct implementation
- ⚠️ Jones QWP: uses `cos(-π/2)` = 0 for diagonal, `sin(-π/2)` = -1 for off-diagonal. The sign convention is non-standard (usually QWP has `e^{-iπ/2}` = `-i` for the slow axis). The math works but the phase convention should be documented.
- ⚠️ UV materials: CsI Sellmeier coefficients look approximate (B and C values seem fitted rather than from standard references)

---

## 9. Priority Fix List

| # | Severity | Issue | Effort |
|---|----------|-------|--------|
| 1 | 🔴 Critical | Add metadata to all 524 calculator pages (split into server+client) | High |
| 2 | 🔴 Critical | Remove `ignoreBuildErrors: true`, fix TS errors | Medium |
| 3 | 🔴 Critical | Replace Plotly.js with lightweight chart library | High |
| 4 | 🟠 Major | Add error boundaries around calculators | Low |
| 5 | 🟠 Major | Deduplicate overlapping calculator slugs | Low |
| 6 | 🟠 Major | Fix search index to be build-time generated | Low |
| 7 | 🟠 Major | Consolidate calculator pages to use shared input/output pattern | High |
| 8 | 🟠 Major | Add `aria-label` to all interactive inputs | Medium |
| 9 | 🟠 Major | Delete dead code (`calculator-template.tsx` if unused, or adopt it) | Low |
| 10 | 🟡 Minor | Add CSP headers | Low |
| 11 | 🟡 Minor | Synchronize category page lists with actual pages | Medium |
| 12 | 🟡 Minor | Consistent formula display across pages | Medium |

---

## 10. What's Done Well

- **Scope and content:** 524 calculators with real physics is genuinely impressive. The domain coverage is comprehensive.
- **Hero map:** The SVG interactive beam-splitting visualization is beautiful, accessible, and well-engineered.
- **Category organization:** Clean URL structure, sensible domain grouping.
- **Sitemap/robots:** Properly implemented with build-time filesystem scanning.
- **Dark theme:** Visually cohesive and professional.
- **Complex number library:** Clean, correct implementation.
- **Physics formulas:** Generally accurate with proper notation.

---

## 11. Recommended Architecture

```
For each calculator:
  src/app/category/slug/
    page.tsx          ← Server component: metadata + SEO
    calculator.tsx    ← "use client": interactive UI

  Or use generateMetadata + a shared client wrapper:
    page.tsx          ← Server: metadata export + <CalculatorPage {...props} />
```

Replace Plotly with Recharts or uPlot for 95% of charts. Keep Plotly only for 3D/interactive-heavy pages.

Generate `search-index.json` at build time (via `next.config.js` `webpack` plugin or a build script).

Add a `<CalculatorErrorBoundary>` wrapper to catch calculation crashes gracefully.
