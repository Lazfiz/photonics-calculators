# Handover — 2026-10-08 (session 16 → session 17)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 2).
- PR #11 (registry, stage 2a) was merged this session. Production `ui-check` passed 37/37 with 0 console
  errors; `/fiber-optics` lists 54 calculators and `/search-index.json` has 528 entries.
- Session 16 built stage 2b on branch `phase-2/pages-from-registry` (**PR #12**).
- Next: merge PR #12 (ask the user first), then the next unchecked ROADMAP item.

## State
- **`phase-2/pages-from-registry`**, two commits on `main`:
  1. `refactor(pages)`: server `CalculatorShell`, `src/registry/metadata.ts`, the codemod and its output
     (1,048 files), 8 laser-safety pages by hand, tests.
  2. `docs`: CLAUDE.md, the `new-calculator` skill, the `nextjs` rule, the ROADMAP and this file.
- **Gates:** see the PR (filled in at the end of the session).

## How a calculator page works now
- `page.tsx` (15 lines, no text): `const href = "/<category>/<slug>"`, `metadata = calculatorMetadata(href)`,
  `<CalculatorShell href={href} [maxWidthClassName]><PageClient /></CalculatorShell>`.
- `src/components/calculator-shell.tsx` is a **server** component. It reads the registry entry and renders
  the JSON-LD (WebPage + BreadcrumbList), breadcrumbs, `<h1>` = `heading ?? title`, lede =
  `lede ?? description`, `ShareButton` (`share-button.tsx`, client), `ErrorBoundary` around the children,
  and the related links (only entries with `related`, at most 4).
- `page-client.tsx` returns a fragment: inputs, results and charts. No `<h1>`, no shell, no registry.
- **Guards:** `tests/calculator-pages.test.ts` (each page.tsx holds only its own href; no client `<h1>`;
  golden metadata and JSON-LD; `<` escaped). `tests/registry.test.ts` fails if any `"use client"` file
  reaches `src/registry/` (no exceptions left; a client importing `calculator-shell` trips it).
- **Changing a heading, description or related links** = edit the registry entry only.

## Decisions (user-approved this session)
- The generated FAQPage JSON-LD is gone: its questions weren't on the page (Google's rules), and FAQ rich
  results are limited to government/health sites. Don't add structured data the page doesn't show.
- The 8 laser-safety pages that had their own `<h1>` now show the registry's cautious descriptions.

## Next actions
1. PR #12: check CI and the preview, ask the user, then `gh pr merge 12 --merge`. Then run `ui-check`
   against production, and check one page's JSON-LD (no FAQPage, BreadcrumbList present).
2. Next ROADMAP items: 2c (tier/references, with Phase 4), the ~40 duplicates with 301 redirects, or the
   small `chromatic-dispersion` Sellmeier module (Malitson 1965).

## Ship flow (worked nine times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** `list_deployments` (filter by `sha`) gives the URL; `web_fetch_vercel_url` fetches it
  (team `team_LaEJuanZGFVc5UHhLD6LRaiq`, project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`). Big pages are saved
  to a file; grep it. Or test a local `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **Physics modules:** SI in, SI out; pages convert at the boundary. For the conventions (layer order,
  e^(−iωt), the Nebraska convention in ellipsometry), see the module headers and `git show cc452854:docs/HANDOVER.md`.
- **Tests:** `node:test`. Check that a test can fail by mutating in place (`cp` the file to the
  scratchpad and restore it afterwards).
- **Scratch scripts that import `typescript`** from the scratchpad need the absolute path
  `C:/dev/photonics-calculators/node_modules/typescript/lib/typescript.js`.
- **Shell quoting:** `node -e '…'` breaks on any apostrophe in the script; use a scratchpad `.cjs` file.
- **Page edits:** use a Node script per file, guarded by markers (it throws if a marker isn't found). More
  than 10 files needs the codemod skill (latest template: `scripts/codemods/2026-10-08-pages-from-registry.ts`).
- **`SimpleChart`:** it ignores `rangemode`, `range: [0, "auto"]` breaks the axis, and it skips NaN.
- **`ui-check`:** flakes on Chrome startup (loop up to 3 times until `ALL PASS` or `FAILED`); load mode
  prints `ALL PASS` even with errors (read `console errors/warnings: N`); in Git Bash set `MSYS_NO_PATHCONV=1`;
  pages without an `<input>` always report "not hydrated".
- **Local production server:** port 3000 may be another project's dev server (leave it alone). Use
  `npx next start -p 3100`. Kill it with `netstat -ano | grep ':3100 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min, the codemod dry run ≈ 40 s. Run long ones
  in the background. Don't edit `.ts` files while `check` runs.
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
- **Deliberately unfixed until Phase 4:** `ion-assisted-deposition`, `point-ahead` (×2),
  `environmental-stability`, `thermal-evaporation`, and the thin-film items in the ROADMAP.
