---
name: new-calculator
description: Add a new calculator page end-to-end - physics module, golden test, server page with metadata/JSON-LD, client page, and listing in sitemap/search/home. Use when asked to create or add a calculator.
---
# New calculator: `$ARGUMENTS`

0. **Check for duplicates first:** `git ls-files src/app | grep -i <keywords>`. About 40 duplicate pairs
   already exist (ROADMAP). If a close match exists, extend it instead.
1. **Physics module:** `src/physics/<category>/<slug>.ts`. Pure functions in SI that take one input object
   and return a results object. Constants come from `src/physics/constants.ts`. Put the reference in a
   comment and state the model tier. Follow `.claude/rules/physics.md`.
2. **Test:** `tests/<slug>.test.ts`, with `node:test` + `node:assert/strict`, ≥1 golden value from a cited
   source, and ≥1 edge case. Run `npm test`.
3. **Client page:** `src/app/<category>/<slug>/page-client.tsx` (`"use client"`). Wrap it in `CalculatorShell`
   and use `ValidatedNumberInput` / `InputSlider` with explicit `min`/`max`. Call the physics function in
   `useMemo` and show results in `ResultCard`. For charts, prefer `simple-chart`; use Plotly only if it's
   needed (via `chart-panel`).
4. **Server page:** `src/app/<category>/<slug>/page.tsx`. Copy the structure of a known-good page whose
   `generateCalculatorJsonLd(...)` call has plain string arguments (check with
   `git grep -c "const jsonLd" -- <file>`, which must be 1). Give it a real description (no "Interactive X
   calculator for photonics…" placeholder) and a canonical URL.
5. **Registry:** add an entry to `src/registry/calculators/<category>.ts` (sorted by slug) with the same
   `title` and `description` as the page's `metadata`; add `heading`/`lede` only if the `CalculatorShell`
   text differs. The sitemap, search index, counts and category list are generated from it, and
   `tests/registry.test.ts` checks it against the page.
6. `/verify`: check, then build. Open the page in `npm run dev` and try the defaults plus one edge input.
