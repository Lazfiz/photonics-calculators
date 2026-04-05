# Gemini Review — Architecture, UX, and Product Trust

**Date:** April 4, 2026  
**Scope:** Full codebase review (Architecture, UX, SEO, Content) of the Photonics Calculators repository.

---

## Executive Summary
The Photonics Calculators project is a massive undertaking with 536 domain-specific physics tools. It demonstrates an impressive breadth of knowledge and successfully utilizes a modern tech stack (Next.js 16, React 19). Encouragingly, recent hot-fixes have addressed several critical physics bugs identified in earlier internal reviews. 

However, the repository's architecture relies on patterns that severely compromise its potential as an authoritative, discoverable, and maintainable platform. The blanket use of `"use client"` across all calculator pages has crippled SEO, type safety is completely bypassed, and the application relies on monolithic client-side charting bundles. Resolving these structural issues is mandatory before scaling or monetizing.

---

## What is already strong
- **Agile Physics Corrections:** Prior critical bugs cited in internal reports (e.g., NOHD divergence math, Airy disk radius denominator) have already been fixed in the repo (`src/app/laser-safety/nohd/page.tsx`, `src/app/imaging/airy-disk/page.tsx`). This shows active maintenance and a commitment to technical accuracy.
- **Robust Component Architecture:** The isolation of complex visualization logic into `ChartPanel` and the use of Next.js `dynamic` imports is a good foundational decision for client-side rendering.
- **Scope & Ambition:** Maintaining hundreds of distinct physics calculators represents a tremendous value proposition for the photonics community.

---

## Critical Issues

🔴 **Severity: Critical** | **Missing SEO Metadata on All Calculators**
- **Evidence:** `src/app/detectors/dark-current/page.tsx` and all other calculator pages begin with `"use client";` and lack an `export const metadata` block. 
- **Reference:** [Next.js Documentation on Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata): "You can define metadata in any Server Component... It is not supported in Client Components."
- **Why it matters:** Google will index 536 unique pages with the exact same title ("Photonics Calculators - 100+ Interactive Optics Tools" inherited from `src/app/layout.tsx`). The primary growth vector for this product is long-tail organic search, which is entirely broken by this pattern.
- **Specific Fix:** Wrap every calculator with a Server Component that exports metadata and imports the interactive client component.

🔴 **Severity: Critical** | **Type Safety and Strict Mode Disabled**
- **Evidence:** `next.config.js` explicitly sets `ignoreBuildErrors: true` for typescript and `reactStrictMode: false`.
- **Reference:** [React Docs on Strict Mode](https://react.dev/reference/react/StrictMode) & TypeScript compiler best practices.
- **Why it matters:** Disabling type checking and strict mode masks underlying architectural flaws, double-mounting bugs, and props mismatches (such as the `any[]` typing in `src/components/chart-panel.tsx`). At this scale, refactoring without type safety guarantees regression bugs.
- **Specific Fix:** Remove these flags. Fix the `any` types in `ChartPanel` and ensure React components handle double-mounting cleanly.

---

## High-Leverage Improvements

🟠 **Severity: High** | **Filesystem Search Indexing at Request Time**
- **Evidence:** `src/lib/search-index.ts` uses synchronous `readFileSync` and `readdirSync` to build the search array, running across 500+ files on demand.
- **Reference:** [Node.js FS Documentation](https://nodejs.org/api/fs.html#synchronous-example) and Next.js optimization guides.
- **Why it matters:** Scanning the filesystem synchronously blocks the event loop and heavily penalizes Time to First Byte (TTFB). Even with edge caching, cold starts will be painfully slow.
- **Specific Fix:** Generate a static `search-index.json` during the build step (e.g., via a custom webpack plugin or pre-build script) and import it statically.

🟠 **Severity: High** | **Bloated JavaScript Bundles**
- **Evidence:** `package.json` includes `react-plotly.js` and `plotly.js`, which are dynamically imported in `src/components/chart-panel.tsx` via `import("react-plotly.js")`.
- **Reference:** [Core Web Vitals (LCP & TBT)](https://web.dev/articles/vitals).
- **Why it matters:** Plotly is an enormous library (~3MB+). Shipping it for simple 2D line charts drastically degrades performance on mobile networks.
- **Specific Fix:** Migrate 95% of the standard 2D line/scatter calculators to a lightweight library like Recharts or uPlot, reserving Plotly exclusively for complex 3D or surface plots.

---

## Architecture Review

🟡 **Severity: Medium** | **Inconsistent Page Assembly**
- **Evidence:** While `CalculatorShell` exists, calculators use disparate input handling. For example, `src/app/detectors/dark-current/page.tsx` relies on raw `<input>` elements mapped to state, while `src/components/input-slider.tsx` exists but isn't universally adopted.
- **Reference:** [Refactoring to Patterns (Fowler)](https://martinfowler.com/books/eaa.html).
- **Why it matters:** Updating the UI across 500+ pages requires manual regex replacements instead of a single component update.
- **Specific Fix:** Standardize a unified `<CalculatorTemplate>` that accepts a configuration object for inputs, physical formulas, and outputs.

---

## UX / Usability Review

🟠 **Severity: High** | **Unconstrained Inputs and Missing Validation**
- **Evidence:** In `src/components/input-slider.tsx`, the number input maps `e.target.value` directly to `onChange` via `Number()`. A user can type values outside the `min`/`max` bounds, or strings that resolve to `NaN`, instantly breaking equations and the chart.
- **Reference:** [NNG: Preventing User Errors](https://www.nngroup.com/articles/slips/).
- **Why it matters:** Engineering tools must be robust against edge-case inputs. Silent chart failures erode product trust.
- **Specific Fix:** Implement bounding validation (`Math.max(min, Math.min(max, value))`) before triggering the `onChange` callback and display inline warnings for invalid states.

🟡 **Severity: Medium** | **Search UI Dominating the Fold**
- **Evidence:** `src/app/page.tsx` mounts `<SiteSearch>` below the hero text, pushing the core value propositions down the page.
- **Reference:** [NNG: Search interface guidelines](https://www.nngroup.com/articles/search-visible-and-simple/).
- **Why it matters:** On mobile, the massive list of dynamically generated search results clutters the viewport.
- **Specific Fix:** Collapse the search results by default, showing them only on focus or typing. Add a keyboard shortcut (Cmd/Ctrl+K).

---

## Accessibility Review

🟠 **Severity: High** | **Missing Programmatic Labels for Assistive Tech**
- **Evidence:** `src/components/input-slider.tsx` relies on a wrapper `<label>` but visually renders the label as a `<span>`. The underlying `type="range"` input completely lacks an `aria-label`. 
- **Reference:** [WCAG 2.1 Success Criterion 4.1.2: Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html).
- **Why it matters:** Screen readers will not properly announce the purpose of the slider, leaving visually impaired users unable to navigate the calculator.
- **Specific Fix:** Use explicit `htmlFor` on labels mapping to input `id`s, or attach explicit `aria-label` attributes to the range sliders.

🟡 **Severity: Medium** | **No Navigational Landmarks**
- **Evidence:** `src/app/layout.tsx` and `src/components/calculator-shell.tsx` provide a `<main>` tag, but lack standard landmarks like `<header>`, `<nav>`, or a "Skip to Content" link.
- **Reference:** [WCAG 2.1 Success Criterion 2.4.1: Bypass Blocks](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html).
- **Why it matters:** Keyboard users must tab through everything repeatedly to reach the physics calculators.
- **Specific Fix:** Implement semantic HTML5 landmarks across the layout template.

---

## SEO / Discoverability Review

*(See "Missing SEO Metadata on All Calculators" under Critical Issues for the primary blocker)*

🟡 **Severity: Medium** | **Canonical URLs and Slugs**
- **Evidence:** The search index crawler (`titleFromPath` in `src/lib/search-index.ts`) dynamically infers titles based on route structure. Overlapping directories risk duplicate content penalties.
- **Reference:** [Google Search Central: Consolidate duplicate URLs](https://developers.google.com/search/docs/advanced/guidelines/consolidate-duplicate-urls).
- **Why it matters:** Overlapping tools split organic ranking power.
- **Specific Fix:** Audit overlapping slugs, consolidate functionality into single pages, and use 301 redirects for deprecated routes.

---

## Content / Educational Value Review

🟡 **Severity: Medium** | **Dry Mathematical Output**
- **Evidence:** Reviewing pages like `src/app/imaging/airy-disk/page.tsx` shows numerical outputs and a chart, but zero contextual explanation of the Abbe limit or the Rayleigh criterion.
- **Reference:** [NNG: Contextual Help & Documentation](https://www.nngroup.com/articles/help-and-documentation/).
- **Why it matters:** A pure utility is easily replaced; an educational reference becomes a bookmarked staple for students and engineers.
- **Specific Fix:** Expand `CalculatorShell` to include an "Educational Context" property that renders a markdown block beneath the chart explaining the physics and formulas in use.

---

## Additional Risks / Blind Spots

- **Lack of URL State:** The use of simple `useState` (e.g., in `dark-current/page.tsx`) means users cannot bookmark, share, or embed a specific configuration of a calculator. For an engineering utility, shareability is a primary growth loop.
- **Global Error Handling:** While `CalculatorShell` contains an `ErrorBoundary`, if a chart fails due to a `NaN` calculation inside Plotly, the error boundary will trigger a full component crash rather than a graceful "Invalid Parameters" UI state on the chart.

---

## Prioritized Action Plan (Top 15)

1. **[Critical]** Wrap all 536 calculators in a Server Component pattern to enable `export const metadata`.
2. **[Critical]** Remove `ignoreBuildErrors: true` from `next.config.js` and enforce basic TypeScript compilation.
3. **[High]** Refactor `src/lib/search-index.ts` into a pre-build script that emits a static JSON file.
4. **[High]** Sync calculator states to URL query parameters (`nuqs` or native router) to allow bookmarking and sharing.
5. **[High]** Replace Plotly with Recharts/uPlot for standard 2D calculators to slash JavaScript payloads.
6. **[High]** Enforce strict value bounding (min/max clamps) in `src/components/input-slider.tsx`.
7. **[High]** Add explicit `aria-label` or `id`/`htmlFor` bindings to all interactive form controls.
8. **[Medium]** Create a unified `CalculatorTemplate` interface to eliminate UI code duplication across the 500+ tools.
9. **[Medium]** Remove `reactStrictMode: false` and resolve the resulting React warnings.
10. **[Medium]** Update the SiteSearch component to visually collapse by default and respond to Cmd+K.
11. **[Medium]** Add an "Educational Context" block to standard calculator outputs.
12. **[Medium]** Implement a "Related Calculators" linking widget to retain users and lower bounce rates.
13. **[Medium]** Review and consolidate overlapping calculator paths to prevent SEO cannibalization.
14. **[Low]** Implement semantic landmarks (`<header>`, `<nav>`, skip links) in the global layout.
15. **[Low]** Build a graceful fallback state inside `ChartPanel` for `NaN` or `Infinity` data arrays to prevent full application crashes.
