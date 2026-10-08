# Handover — 2026-10-08 (session 15 → session 16)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 2, registry stages 2a–2c).
- PR #10 (unit-scaled constants) was merged before this session; production `ui-check` passed 37/37.
- Session 15 built the registry, stage 2a, on branch `phase-2/registry` (**PR #11**).
- Next: merge PR #11 (ask the user first), then stage 2b.

## State
- **`phase-2/registry`**, two commits on `main`:
  1. `feat(registry)`: `src/registry/` (types, 10 categories, 524 entries in `calculators/<category>.ts`).
     It generates the sitemap, `/search-index.json` (route handler), counts, home categories, the 9
     category index pages, and the related links. It also deletes the old generator, `src/generated/`,
     the stale `public/search-*.json` files and `flagship-related.ts`.
  2. `docs`: CLAUDE.md, skills (`new-calculator`, `verify`), the `nextjs` rule, the ROADMAP and this file.
- **Gates:** `check` 0 errors, 1,331 warnings, 88/88 tests. `build` 542 routes (+`/search-index.json`).
  `ui-check` (local, port 3100): 37/37 PASS, 0 console errors. Load mode on home, about, 4 category pages
  and 4 related-link pages: 0 console errors (`/about` is "not hydrated": no `<input>`, same on production).
- **User-visible changes:**
  - Site search now shows the right titles (production showed "S₁/Q" for Stokes and "Ber" for BER).
  - Category pages list every visible calculator (they listed 254 of 524), with a count.
  - `/about` has its own canonical (it inherited `/`) and the real count.
  - Related links on 17 pages use the registry's labels and descriptions; the hrefs are unchanged.

## Next actions
1. PR #11: check CI and the preview, ask the user, then `gh pr merge 11 --merge`. Then run `ui-check`
   against production, and check that `/search-index.json` and `/fiber-optics` serve the new content.
2. Stage 2b (see ROADMAP): codemod the 524 `page.tsx` → `metadata = calculatorMetadata(href)` + JSON-LD
   from the entry. Move `related` to a server prop on the 17 pages; drop `CLIENT_ALLOWED` in the test.
   Design how `CalculatorShell` gets its heading/back link without the text in `page-client.tsx`.
3. Small and self-contained: `chromatic-dispersion` (Sellmeier module, Malitson 1965), as in session 14.

## Registry facts
- **Entry fields:** `title` and `description` equal the page's `metadata`. `heading` and `lede` are set
  only where the `CalculatorShell` text differs (36 and 115 entries); the test rejects a redundant one.
- **Name on cards and links:** `displayName(c)` = `heading ?? title`.
- **Hidden (7 laser-safety pages):** left out of search and the category lists; still in the sitemap.
- **Server-only:** `tests/registry.test.ts` walks every `"use client"` file's value imports (relative and
  `@/`), and fails if one reaches `src/registry/`. `related-calculators.ts` is the one allowed path.
- **Card order:** `priority` first (search ranking, default 50), then by name.
- **Not committed:** the extraction script (it imported files this PR deletes). It's in the session-15
  scratchpad. The test checks its output against every page, so it isn't needed again.
- **Laser safety:** `src/app/laser-safety/page.tsx` stays hand-curated (bounded / educational /
  quarantined). The test checks that it lists exactly the visible laser-safety entries.

## Ship flow (worked eight times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** `get_access_to_vercel_url` (team `team_LaEJuanZGFVc5UHhLD6LRaiq`) returns a share link. Or test a local `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **Physics modules:** SI in, SI out; pages convert at the boundary. For the conventions (layer order,
  e^(−iωt), the Nebraska convention in ellipsometry), see the module headers and `git show cc452854:docs/HANDOVER.md`.
- **Tests:** `node:test`. Check that a test can fail by mutating in place (`cp` the file to the
  scratchpad and restore it afterwards).
- **Scratch scripts that import `typescript`** from the scratchpad need the absolute path
  `C:/dev/photonics-calculators/node_modules/typescript/lib/typescript.js`.
- **Page edits:** use a Node script per file, guarded by markers (it throws if a marker isn't found). Put
  it in a scratchpad `.cjs` file. More than 10 files needs the codemod skill (template:
  `scripts/codemods/2026-10-08-inline-constants.ts`; remove each file from the ts-morph project after use).
- **`SimpleChart`:** it ignores `rangemode`, `range: [0, "auto"]` breaks the axis, and it skips NaN.
- **`ui-check`:**
  - It flakes on Chrome startup, so loop up to 3 times until the log has `ALL PASS` or `FAILED`.
  - Load mode prints `ALL PASS` even when errors are logged, so read `console errors/warnings: N`.
  - In Git Bash, set `MSYS_NO_PATHCONV=1`.
  - Pages without an `<input>` always report "not hydrated".
- **Local production server:** port 3000 may be another project's dev server (leave it alone). Use
  `npx next start -p 3100`. Kill it with `netstat -ano | grep ':3100 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run them in the background. Don't edit
  `.ts` files while `check` runs.
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
- **Deliberately unfixed until Phase 4:** `ion-assisted-deposition`, `point-ahead` (×2),
  `environmental-stability`, `thermal-evaporation`, and the thin-film items in the ROADMAP.
- **Vercel:** project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`.
