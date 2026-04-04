# Usability & Content Quality Review — Photonics Calculators

**Reviewed:** 2026-04-04  
**Scope:** Homepage, 10 calculator pages, 3 category pages, shared components, navigation, content quality  
**Verdict:** Strong foundation with polished flagship pages, but massive quality inconsistency across 536 pages and critical UX gaps for discoverability and cross-navigation.

---

## 1. Homepage UX Deep Dive

### 1.1 First Impression — **Severity: Medium**
The hero communicates "Route light through the core domains of photonics" effectively. The badge "Digital optics bench" is evocative. However:
- The tagline is abstract. A first-time visitor won't know what a "digital optics bench" means.
- No mention of "calculators" or "free" in the hero h1 — the primary value proposition is buried in the paragraph below.
- **Recommendation:** Change h1 to something like "Free Interactive Photonics Calculators" or add a subtitle line.

### 1.2 Hero Map — **Severity: Low (positive)**
The SVG beam-splitting visualization is gorgeous and well-implemented. Good use of hover states, glow effects, and keyboard accessibility (`tabIndex`, `onKeyDown`, `role="link"`). Respects `prefers-reduced-motion`. Mobile fallback with button selector is smart.

### 1.3 Search Component — **Severity: High**
- **Always visible:** The search shows 8 results by default, taking up significant vertical space even when the user hasn't searched. This is distracting.
- **No keyboard shortcut:** No Cmd/Ctrl+K to focus search — a major discoverability miss for power users.
- **No debounce:** Results recompute on every keystroke (fine for 536 items, but poor pattern).
- **No visual focus indicator:** The search input lacks a prominent focus ring.
- **Label says "Search calculators and categories"** — good, but the component is below the fold on mobile.
- **Recommendation:** Collapse results by default. Show on focus/typing. Add Cmd+K shortcut. Move search higher on mobile.

### 1.4 Visual Hierarchy — **Severity: Medium**
- The hero competes for attention with the stats row (536 calculators, 10 domains, SVG hero).
- "Browse all categories" button is secondary styling — but it's the primary navigation action for most users.
- Category cards below are well-designed with accent colors, counts, and example pills.

### 1.5 Mobile — **Severity: Low**
- Responsive classes are present (`sm:`, `lg:`, `xl:`).
- The hero SVG map has a mobile fallback with button grid — good.
- Stats row goes from 3-col to 1-col — acceptable.
- Search component may push content below the fold on small screens.

### 1.6 Accessibility — **Severity: Medium**
- **Good:** SVG has `<title>` and `<desc>`, branches have `role="link"` and `tabIndex`.
- **Missing:** No skip-to-content link. No landmark roles (`<nav>`, `<aside>`). No `aria-live` for search results.
- **Missing:** Category cards are `<Link>` elements (good) but no `aria-label` differentiating them.
- **Missing:** No `<header>` or `<nav>` element on any page — just bare `<main>`.

---

## 2. Calculator Page UX

### 2.1 Input UX — Mixed Quality

**Flagship pages (Gaussian Beam, Single AR, Coupling Efficiency):** Excellent.
- Dual slider + number input via `InputSlider` component is great UX.
- Units are clear, ranges are appropriate, wavelength presets are helpful.
- Can type exact values in the number field.

**Typical pages (Blackbody, Airy Disk, Quantum Efficiency):** Inconsistent.
- Blackbody and Airy Disk use raw `<input type="number">` without sliders — no visual feedback on range.
- Quantum Efficiency doesn't use `CalculatorShell` at all — completely different layout.
- No consistent input pattern across the site.

**User Story:** *As an optical engineer, I want every calculator to have the same input pattern (slider + number field) so I don't have to re-learn the interface for each tool.*

**Severity: High** — Inconsistent input components across pages.

### 2.2 Output UX — **Severity: Medium**
- `ResultCard` component is clean and well-designed with color-coded tones.
- Flagship pages show 4 result cards in a responsive grid — good.
- Blackbody/Airy Disk use inline styled divs instead of `ResultCard` — inconsistency.
- No contextual interpretation: e.g., "Rayleigh range: 0.20 mm" — is that good or bad? What's typical?
- **Recommendation:** Add tooltip or helper text explaining what typical values look like.

### 2.3 Chart UX — **Severity: Medium**
- Plotly.js is powerful — interactive zoom, pan, hover.
- `displayModeBar: false` hides export/camera tools — consider showing on hover.
- No loading state while Plotly loads (~200KB). Charts appear after a flash.
- Colors: Blue/pink/green used consistently for s/p/unpolarized. Not colorblind-tested (no patterns or shapes for differentiation).
- Axis labels are present and clear. Grid lines visible.
- Chart height fixed at 400px — may be too tall on mobile.
- **Recommendation:** Add a loading skeleton/spinner for charts. Consider adding a "download as PNG" button.

### 2.4 Educational Value — **Severity: High**
- Flagship pages include formula display boxes (e.g., Gaussian beam: `w(z) = w₀√(1+(z/zR)²)`) — excellent.
- Laser safety pages have detailed disclaimers — responsible.
- **Most typical pages have NO educational content.** Blackbody shows results and a chart but doesn't explain Planck's law, Wien's displacement, or when you'd use this.
- No "Learn more" links or references to textbooks/papers.
- **User Story:** *As a graduate student, I want each calculator to briefly explain the underlying physics and link to references, so I can use this as a study tool, not just a calculator.*

### 2.5 Error States — **Severity: Medium**
- No validation on inputs. If you type a negative wavelength or NaN, the chart breaks silently.
- No error boundaries or fallback UI.
- The `InputSlider` component doesn't clamp values when typing in the number field.
- **Recommendation:** Add input validation with inline error messages. Clamp values to min/max.

### 2.6 Layout — **Severity: Low**
- Logical top-to-bottom flow: description → presets → inputs → results → formula → chart.
- Good use of responsive grids (`sm:grid-cols-2`, `xl:grid-cols-4`).
- Some pages put chart before results (Blackbody) — inconsistent ordering.

### 2.7 Comparison to Wolfram Alpha — **Severity: Low (informational)**
- Wolfram Alpha provides step-by-step solutions and references. This site doesn't.
- Wolfram handles units automatically. This site uses fixed units per slider.
- Advantage: This site has domain-specific interactive charts that Wolfram can't match.
- Advantage: Wavelength presets are photonics-specific and useful.

---

## 3. Content Quality Audit

### 3.1 Accuracy — **Severity: Medium**
- **MPE calculator:** The implementation is explicitly simplified with good disclaimers. However, the MPE formula for 1.05-1.4 µm (`exposure > 10 ? 100 : 0.01 * exposure * 1000`) gives `mJ/cm²` — the units and formula need verification against ANSI Z136.1. The jump from `0.01 * t * 1000 = 10t` to `100` at `t=10s` seems like a simplification that could mislead.
- **NOHD calculator:** Uses `divergence` in mrad but the code converts it as `(divergence/1000) * PI/180` which treats it as degrees first — **potential unit bug**. The variable name says mrad but the conversion assumes degrees.
- **Single AR:** Uses proper Fresnel equations with complex amplitude summation — appears correct.
- **Stokes page:** Poincaré sphere visualization is a nice touch. Math looks correct.

### 3.2 Grammar & Clarity — **Severity: Low**
- Generally well-written. Descriptions are concise and accurate.
- Some descriptions are too terse (e.g., Sellmeier: just shows data, no explanation of what Sellmeier equation is).

### 3.3 Terminology — **Severity: Low**
- Physics terms used correctly in flagship pages.
- Some category descriptions on homepage are vague ("Explore how guided modes, attenuation, dispersion, coupling, and nonlinear effects shape fiber systems").

### 3.4 Placeholder Content — **Severity: Critical**
- The About page says "113 interactive tools" but the homepage shows 536. **Stale content.**
- Many of the 536 pages are likely generated/scaffolded without real implementations. The search index scans all directories — are they all functional?
- Category pages list 30-52 calculators each, but only a handful appear to have real interactive implementations.
- **User Story:** *As a user, I want every listed calculator to actually work, so I don't waste time clicking dead links.*

### 3.5 Consistency — **Severity: High**
- Three different page layout patterns exist:
  1. `CalculatorShell` + `InputSlider` + `ResultCard` + `ChartPanel` (flagship)
  2. Raw layout with manual divs and inputs (Blackbody, Airy Disk)
  3. Completely custom layout without shared components (Quantum Efficiency)
- Category page descriptions don't match homepage descriptions.
- Some pages have `metadata` exports, others don't.

---

## 4. Category Pages

### 4.1 Structure — **Severity: Medium**
- Pure link dumps. Title, one-line description, then a grid of calculator cards.
- No grouping, no "popular" section, no visual hierarchy among calculators.
- Laser Safety has 52 calculators in a flat grid — overwhelming.
- No search/filter within category.
- **Recommendation:** Group calculators by sub-topic. Add "Most Popular" or "Start Here" section.

### 4.2 Educational Content — **Severity: Medium**
- No educational content on category pages. Just links.
- **Recommendation:** Add a 2-3 sentence overview of the domain and a "Key Concepts" section.

---

## 5. Cross-Page Navigation

### 5.1 Related Calculators — **Severity: High**
- **No "Related Calculators" or "See Also" links on any calculator page.**
- A user on the Gaussian Beam page has no path to ABCD Matrix, Cavity Stability, or Mode Matching.
- **User Story:** *As a photonics student, I want to discover related calculators from any page, so I can explore the topic without going back to the homepage.*

### 5.2 Breadcrumbs — **Severity: Medium**
- Only a "← Back to [Category]" link. No full breadcrumb trail.
- No way to navigate to sibling categories from a calculator page.

### 5.3 Homepage Access — **Severity: Low**
- Footer has "About & References" link but no explicit "Home" link on calculator pages.
- The back link goes to category, not home. Need two clicks to get home.

---

## 6. Performance Perception

### 6.1 Loading States — **Severity: Medium**
- Plotly.js is dynamically imported (`next/dynamic`, `ssr: false`) — good.
- No loading indicator while Plotly loads. Charts flash in after a delay.
- No Suspense boundaries visible.
- **Recommendation:** Add `loading.tsx` files or Suspense with skeletons.

### 6.2 Bundle Size — **Severity: Low (informational)**
- Each calculator page loads Plotly.js (~3MB uncompressed, ~800KB gzipped).
- With 536 pages using static generation, each page gets its own chunk — acceptable for a static site.
- First visit to any calculator will be slow due to Plotly download. Subsequent visits benefit from caching.

### 6.3 Chart Rendering — **Severity: Low**
- 150-300 data points per chart — smooth rendering expected.
- No animation on data change — charts re-render instantly (good for responsiveness).

---

## 7. Missing Features

### 7.1 For Graduate Students — **Severity: High**
- No export to CSV/PNG for data and charts.
- No save/share functionality (URL parameters for state).
- No references or bibliography links.
- No interactive tutorials or guided workflows.
- No unit conversion calculator (wavelength ↔ frequency ↔ energy).

### 7.2 For Working Optical Engineers — **Severity: High**
- No tolerance/sensitivity analysis (what happens if wavelength varies ±10nm?).
- No batch calculation mode.
- No comparison mode (compare two configurations side by side).
- No export to common formats (Zemax, Code V, MATLAB).
- URL doesn't encode input state — can't bookmark a specific configuration.

### 7.3 For Laser Safety Officers — **Severity: Medium**
- MPE/NOHD calculators are simplified — not suitable for compliance.
- No report generation (PDF with input parameters, results, disclaimers).
- No database of common laser types with pre-filled parameters.
- No interlock/shutter time calculator (listed but likely unimplemented).

### 7.4 For Undergraduate Physics Students — **Severity: High**
- No step-by-step solution display.
- No "how did we get this number?" expandable sections.
- No interactive diagrams showing what the parameters mean physically.
- No quiz/self-test mode.

### 7.5 Missing Calculators
- **Lens design:** Thin lens equation, thick lens, achromatic doublet
- **Radiometry:** Radiant/liminous conversions, etendue
- **Color science:** CIE chromaticity, color temperature
- **Optical fabrication:** Surface roughness → scatter, polishing specs
- **Coherent imaging:** OTF/MTF from pupil function
- **Interferometry:** Phase-shifting algorithms, fringe analysis
- **Metrology:** Fizeau, Twyman-Green setup calculators

---

## Summary of Critical/High Findings

| # | Finding | Severity |
|---|---------|----------|
| 1 | 536 pages listed but most are likely unimplemented scaffolding — stale About page says "113" | **Critical** |
| 2 | Potential unit bug in NOHD calculator (mrad vs degrees conversion) | **Critical** |
| 3 | No "Related Calculators" cross-navigation on any page | High |
| 4 | Three different page layout patterns — no design consistency | High |
| 5 | No educational content on typical calculator pages | High |
| 6 | No URL state encoding — can't bookmark/share configurations | High |
| 7 | Search always shows 8 items, no keyboard shortcut, no focus management | High |
| 8 | No input validation or error handling | Medium |
| 9 | Category pages are flat link dumps with no grouping | Medium |
| 10 | No loading states for Plotly charts | Medium |

---

## Top 10 Recommendations (Priority Order)

1. **Audit all 536 pages** — identify which have real implementations vs. scaffolding. Remove or mark incomplete pages.
2. **Fix the NOHD unit bug** — verify divergence conversion.
3. **Standardize on `CalculatorShell` + `InputSlider` + `ResultCard` + `ChartPanel`** for all interactive pages.
4. **Add "Related Calculators" section** to `CalculatorShell` — pass a `related` prop with links.
5. **Encode calculator state in URL params** — allows bookmarking and sharing.
6. **Collapse search results by default**, add Cmd+K shortcut.
7. **Add a "Learn" section** to each calculator — 2-3 sentences of physics + formula derivation.
8. **Group calculators on category pages** by sub-topic with "Start Here" highlights.
9. **Add input validation** with clamping and inline error messages.
10. **Add chart loading skeletons** and a Suspense boundary around `ChartPanel`.
