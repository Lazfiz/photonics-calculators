---
name: new-calculator
description: Add a new calculator page end-to-end - physics module, golden test, registry entry (metadata, JSON-LD, heading, listings), thin server page, client page. Use when asked to create or add a calculator.
---
# New calculator: `$ARGUMENTS`

0. **Check for duplicates first:** `git ls-files src/app | grep -i <keywords>`. About 40 duplicate pairs
   already exist (ROADMAP). If a close match exists, extend it instead.
1. **Physics module:** `src/physics/<category>/<slug>.ts`. Pure functions in SI that take one input object
   and return a results object. Constants come from `src/physics/constants.ts`. Put the reference in a
   comment and state the model tier. Follow `.claude/rules/physics.md`.
2. **Test:** `tests/<slug>.test.ts`, with `node:test` + `node:assert/strict`, ≥1 golden value from a cited
   source, and ≥1 edge case. Run `npm test`.
3. **Registry:** add an entry to `src/registry/calculators/<category>.ts` (sorted by slug): `title` (the
   `<title>`), a real `description` (no "Interactive X calculator for photonics…" placeholder), and
   `heading`/`lede` only if the `<h1>` and the text under it should differ, and the trust data: `tier`,
   `modelNote` (assumptions, what is not modelled) and `references` (`https://doi.org/…` URLs), shown on the page. The page's metadata, JSON-LD,
   heading, breadcrumbs and related links, plus the sitemap, search, counts and category list, all come
   from this entry.
4. **Server page:** `src/app/<category>/<slug>/page.tsx`. Copy any calculator's page.tsx and change its
   `href`: `const href = "/<category>/<slug>"`, `export const metadata = calculatorMetadata(href)` and
   `<CalculatorShell href={href}><PageClient /></CalculatorShell>` (add `maxWidthClassName` for wide
   layouts). No other text; `tests/calculator-pages.test.ts` checks it.
5. **Client page:** `src/app/<category>/<slug>/page-client.tsx` (`"use client"`). It returns only the
   inputs, results and charts: no `<h1>`, no shell (the server shell wraps it). Use `ValidatedNumberInput` /
   `InputSlider` with explicit `min`/`max`. Call the physics function in `useMemo` and show results in
   `ResultCard`. For charts, prefer `simple-chart`; use Plotly only if it's needed (via `chart-panel`).
   Never import `src/registry/` or `calculator-shell` here; `tests/registry.test.ts` fails on it.
6. `/verify`: check, then build. Open the page in `npm run dev` and try the defaults plus one edge input.
