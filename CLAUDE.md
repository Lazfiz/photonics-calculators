# Photonics Calculators

~524 interactive optics/photonics calculators (laser safety, fiber, thin film, imaging,
spectroscopy, detectors, materials, wave optics, polarization, free-space comms).
Next.js 16 App Router + React 19 + TypeScript (strict) + Tailwind 4, statically prerendered on
Vercel: https://photonics-calculators.vercel.app. Developed with Claude Code only.

**Plan & status:** `docs/ROADMAP.md` (phases, known issues with evidence). Session handover:
`docs/HANDOVER.md`. Continue from the first unchecked ROADMAP box; don't re-review the codebase.

## Next.js 16 warning
This is NOT the Next.js in your training data — APIs, conventions and file structure changed.
Read the relevant guide in `node_modules/next/dist/docs/` before writing code that uses a Next API,
and heed deprecation notices.

## Commands (Windows 11, Git Bash or PowerShell, Node 24)
| Task | Command | Notes |
|---|---|---|
| Install | `npm ci` | slow on this disk; run in background |
| Dev server | `npm run dev` | regenerates search index first |
| Gate (pre-commit) | `npm run check` | tsc + eslint + tests; tsc alone ≈ 4 min → background |
| Type-check only | `npm run typecheck` | ≈ 4 min |
| Tests | `npm test` | `node:test` via tsx, files in `tests/*.test.ts` |
| Build (pre-push) | `npm run build` | ≈ 6–10 min → background |
| CI | `.github/workflows/ci.yml` | Node 24: `npm ci` → `check` → `build` on PRs and `main` |

Searching: use `git grep` / `git ls-files`. Recursive `grep -r` / `Get-ChildItem -Recurse` over
the repo times out (Defender + `node_modules`). Keep tool output small: tail and failures only.

## Architecture
**Current**
- `src/app/<category>/<slug>/page.tsx`: 15 lines, no text. `const href`, `metadata =
  calculatorMetadata(href)`, `<CalculatorShell href={href}><PageClient /></CalculatorShell>`
  (`tests/calculator-pages.test.ts`).
- `src/components/calculator-shell.tsx`: **server** component. From the registry entry it renders the
  JSON-LD (WebPage + BreadcrumbList), breadcrumbs, `<h1>`, lede, `ShareButton` (client) and related links.
- `src/app/<category>/<slug>/page-client.tsx`: `"use client"`; inputs, **physics inline**, charts. No
  `<h1>`, no shell.
- `src/components/`: `validated-number-input`, `input-slider`, `result-card`,
  `simple-chart` / `simple-line-chart` (SVG), `chart-panel` / `plotly-chart` (Plotly).
- `src/hooks/use-url-state.ts`: input state mirrored to the URL query.
- `src/registry/`: one entry per calculator (title, description, heading/lede overrides, keywords,
  priority, hidden, related) in `calculators/<category>.ts`, plus `categories.ts`. It generates each
  page's metadata and JSON-LD (`metadata.ts`), its heading, breadcrumbs and related links (the shell), the
  sitemap, `/search-index.json` (`src/app/search-index.json/route.ts`), counts, home categories and the
  category index pages (`components/category-index.tsx`). **Server-only:** client components get data as
  props; `tests/registry.test.ts` fails on any client import chain that reaches it.
- `src/lib/`: a few extracted physics modules (`geiger-mode-avalanche`, `laser-safety-*`),
  `home-categories.ts` (a view of the registry).

**Target** (ROADMAP Phase 2+)
- `src/physics/constants.ts` (CODATA) + `src/physics/<category>/<slug>.ts` pure SI functions,
  each with golden-value tests in `tests/`.
- Registry entries gain model tier and references (stage 2c), shown on each page.
- `page-client.tsx` only wires inputs → physics function → results/charts.

## Hard rules
1. **No credentials** in git remotes, files or commits. A commit hook blocks token shapes; never
   bypass it. Never read `.env*`, `.secrets/**` or `.vercel/.env*`.
2. **Gates:** `npm run check` green before every commit; `npm run build` green before every push.
   Never commit with a known-red gate.
3. **Bulk edits:** an edit touching >10 files goes only through an AST codemod (ts-morph): dry
   run → review a 5-file sample diff → `tsc` gate → apply. **Never regex/sed/Python rewrites
   across files**: that is how 427 pages' JSON-LD and the 5 build-breaking files got corrupted.
   Use the `codemod` skill.
4. **Physics:** SI units internally; constants only from `src/physics/constants.ts` (CODATA;
   create it on first need, never redefine `c`, `h`, `q`, `k_B` inline); guard domains (no ÷0,
   sqrt/log of negatives); every formula change ships a golden-value test citing a reference.
5. **Git:** one topic per commit, conventional messages (`fix(scope): …`), work on branches,
   merge via PR. No force-push.

## Working style (quota)
- One ROADMAP phase/stage per session; end with an updated `docs/HANDOVER.md` (≤80 lines),
  ticked ROADMAP boxes, then `/clear`.
- Main session designs and reviews. Routine multi-file edits → `implementer` agent (Sonnet) with
  goal, allowed files, gates, ≤40-line report. Physics review of a batch → `physics-reviewer`.
- Long commands (`tsc`, `build`, `npm ci`) run in the background; don't poll.

## Skills & rules
- Skills: `/verify` (gates + live check), `/physics-audit <slug>`, `/new-calculator`, `/codemod`.
- Path-scoped rules in `.claude/rules/`: `physics.md`, `ui.md`, `nextjs.md`.
- Old AI-tool reviews are in `docs/archive/reviews/`. They're stale; don't trust them.
