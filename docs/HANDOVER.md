# Handover — 2026-10-07 (session 5 → session 6)

**Start here:** read this file, then `docs/ROADMAP.md`. Phase 0 is done but not pushed: the user's manual step 0.1 is still open.
The `origin` URL still embedded a credential at the start of session 5. Phase 1 items 1–3 are done on `phase-1`.
Next: Phase 1 item 4 (ShareButton hydration, breadcrumb, computed "541").

## State
- **`phase-0`**: 5 commits ahead of `main` (`0749eb58`), **not pushed**.
- **`phase-1`** is stacked on `phase-0` and also not pushed. Session 5 added:
  - `chore(deps)`: `ts-morph` dev dependency (for `/codemod`).
  - `refactor(seo)`: `scripts/codemods/2026-10-07-rebuild-json-ld.ts` rebuilt the JSON-LD in 429 pages from `metadata`.
  - `fix(seo)`: 55 placeholder descriptions and 33 slug-derived titles, written by `…-placeholder-descriptions.ts` + `.json`, then JSON-LD re-synced.
  - `test(seo)`: `tests/page-json-ld.test.ts`, plus JSON-LD added to `nohd`, `blackbody` and `single-ar`.
  - then a docs commit (ROADMAP tick, findings, this file).
- **Gates on `phase-1`:** `check` gave 0 errors, 1,440 warnings, 43/43 tests. `build` was not run this session (nothing to push), so run it before pushing.

## Next actions
1. Ask the user whether 0.1 is done.
   - Check without printing the URL: `u=$(git config --get remote.origin.url); case "$u" in https://*@*) echo with-credential;; *) echo clean;; esac`
   - `git remote -v` / `get-url` are denied.
2. If it's done, ship (0.6):
   - Push `phase-0`, open a PR and merge after CI and the preview.
   - Then push `phase-1` and open a PR against `main`.
   - On the preview:
     - check the ber and bpsk-qpsk charts (log₁₀ axis, dotted no-noise curves)
     - run `node scripts/ui-check.mjs <preview-url>`
     - view-source on `/fiber-optics/fiber-gyroscope`: the JSON-LD name must be exactly "Fiber Optic Gyroscope (FOG)"
   - The preview may need Vercel auth; the production URL works after merge.
3. Phase 1 item 4: the ShareButton hydration mismatch and the breadcrumb bug, and make "541" a computed value. The page count is 524 (`git ls-files 'src/app/*/*/page.tsx'`). "541" appears in `layout.tsx` and elsewhere (`git grep -n 541 -- src`).
4. Later Phase 1 items:
   - The `label="{label}"` codemod (40 files) and rendering `CalculatorShell` in the 64 pages that don't.
   - A seeded PRNG for the 6 `Math.random` pages, then `purity` back to `error`.

## Decisions made this session
- **JSON-LD comes from `metadata`:**
  - Until the Phase 2 registry, `page.tsx` keeps both, and `tests/page-json-ld.test.ts` enforces that they match.
  - To change a title or description, edit `metadata`, then run `npx tsx scripts/codemods/2026-10-07-rebuild-json-ld.ts --write`.
- **Codemods are idempotent and verify themselves:** they re-parse the output and compare the values before writing, and skip (and report) anything off-shape. Keep that pattern.
- **Descriptions are ≤155 characters,** say what is computed from what, and don't overclaim.
  - Quarantined laser-safety pages and `eye-safety-fso` say "Simplified educational estimate … Not for safety decisions; use <standard>".
  - The `scanned-mpe` title was kept (it duplicates `scanning-mpe`; merge in Phase 2).
- **The committed `src/generated/search-index.json` is still stale** (known Phase 2 item). `prebuild` regenerates it, so production picks up the new titles and descriptions.

## Non-obvious facts
- **Timings on this disk:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Use `run_in_background` and read only the tail.
- **Codemods:**
  - Parsing all 524 pages with ts-morph takes about 5 s.
  - **The Write tool turned ` ` escapes into raw U+2028 characters,** which broke a regex literal. Avoid writing those escapes in source.
- **Don't `cd` inside Bash commands** without a path back: the working directory persists (session 5 briefly ended up in `src/app`).
- **Python is `python` / `py` (3.14), not `python3`, in Git Bash.**
- **Don't add, delete or rename files while `check` runs.** ESLint lists files up front. `scripts/` is linted too.
- **Chrome extension:** not connected in sessions 3–5. Use `scripts/ui-check.mjs` instead (Chrome at the default path, or set `CHROME`). It uses a fresh profile; a warm one exposes 1-ulp SSR/client chart differences.
- **Dev server cleanup:**
  - `TaskStop` leaves `node …/start-server.js` on :3000. Find it with `netstat -ano | grep :3000` and `taskkill //PID <pid> //F`.
  - `next dev` rewrites `next-env.d.ts` and `src/generated/search-index.json`; `build` rewrites only the index. Restore them with `git checkout -- <path>`, and never commit them.
- **SimpleChart:** it floors log axes at 1e-10, and `Number(null)` becomes 0, so trim arrays instead of inserting nulls.
- **Committing:** `git commit -F msg -- <paths>` commits only those paths, but untracked files need `git add` first.
- **Agents:** `.claude/agents/implementer.md` and `physics-reviewer.md` exist, but sessions 3–5 didn't list them as Agent types.
- **TDZ errors** that `tsc` misses show up in `next build`. Sweep with `@typescript-eslint/no-use-before-define`.
- **ESLint baseline:** 3 rules are still `warn`: `purity` (Phase 1), plus memoization and `any` (Phase 2).
- **`ion-assisted-deposition` is deliberately unfixed** (Phase 4 rewrite). New Phase 4 item: `point-ahead` is off by a factor of 2 (see ROADMAP).
- **Commit hook:** it runs `node .claude/hooks/block-secrets.mjs` on Bash calls and blocks token shapes in commits.
- **npm 12 skips install scripts** for esbuild, sharp and unrs-resolver. Harmless: the prebuilt win32-x64 packages are present.
- **Vercel:** project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq` (scope `mariusrut-8463s-projects`). The MCP returned 403 until re-authentication.

## Working style (quota)
- One phase or stage per session, then a handover and `/clear`.
- Keep tool output small: tail and failures only.
