# Handover — 2026-10-07 (session 6 → session 7)

**Start here:** read this file, then `docs/ROADMAP.md`. Phase 0 is done but not pushed: the user's manual step 0.1 is still open.
At the start of session 6 the `origin` URL still embedded a credential. Phase 1 items 1–4 are done on `phase-1`.
Next: Phase 1 item 5 (`label="{label}"` codemod, and render `CalculatorShell` in the 64 pages that don't).

## State
- **`phase-0`**: 5 commits ahead of `main` (`0749eb58`), **not pushed**.
- **`phase-1`** is stacked on `phase-0` and also not pushed. Session 6 added:
  - `fix(ui)`: `ShareButton` hydration (store-backed, `useSyncExternalStore`) and the breadcrumb markup.
  - `fix(seo)`: generated `src/generated/calculator-counts.json` replaces the hard-coded "541" (524 pages).
  - then a docs commit (ROADMAP tick, this file).
- **Gates on `phase-1`:** `check` gave 0 errors, 1,439 warnings, 46/46 tests. `build` green (541 static routes; built home page says 524, no "541" left). 541 was the route count, not the calculator count.
- **UI check** (`node scripts/ui-check.mjs` against `npm run dev`): 30/30 PASS. The one console error is the known 1-ulp `SimpleLineChart` path on `detectors/quantum-efficiency` (Phase 3), now seen with a fresh profile too.

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
     - the home page title and the search box say 524
   - The preview may need Vercel auth; the production URL works after merge.
3. Phase 1 item 5 (`/codemod`):
   - `label="{label}"` → `label={label}` in 40 `page-client.tsx` files (44 sites): `git grep -l 'label="{label}"' -- src`.
   - Render `CalculatorShell` in the 64 pages that import it without using it (e.g. `free-space-comms/ber`). Each needs `title`, `description` (from its `page.tsx` metadata), `backHref` and `backLabel`. Look at 3 of them first: their layouts differ.
   - After that, `ui-check` section 3 (ber) also exercises the shell.
4. Phase 1 item 6: a seeded PRNG for the 6 `Math.random` pages, then `purity` back to `error`.

## Decisions made this session
- **Counts are generated, not typed.** `scripts/generate-search-index.mjs` (predev/prebuild) writes `calculator-counts.json`, which is committed. `home-categories.ts` throws at import if a listed category has no pages. `tests/calculator-counts.test.ts` fails when the committed JSON is stale; the fix is to rerun the script. The `/new-calculator` skill says so.
- **The total includes the 7 quarantined laser-safety pages** that are hidden from search: they are still live pages.
- **`ShareButton` follows `useURLState`:** prerender and hydration see no params, and the real query follows right after. `currentQuery(pathname)` in `url-state-store` is the share link's query (URL plus pending writes).
- **JSON-LD comes from `metadata`** (session 5). To change a title or description, edit `metadata`, then run `npx tsx scripts/codemods/2026-10-07-rebuild-json-ld.ts --write`.
- **Codemods are idempotent and verify themselves.** Keep that pattern.

## Non-obvious facts
- **Timings on this disk:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Use `run_in_background` and read only the tail.
- **Proving a UI check catches a bug:** swap the old file in with `git show HEAD:<path> > <path>` under `next dev` and rerun. The first run after a swap printed no PASS/FAIL lines (likely mid-HMR); write the output to a file and rerun.
- **Codemods:** parsing all 524 pages with ts-morph takes about 5 s. The Write tool turns backslash-u-2028 escapes into raw U+2028 characters, which broke a regex literal.
- **Don't `cd` inside Bash commands** without a path back: the working directory persists.
- **Python is `python` / `py` (3.14), not `python3`, in Git Bash.**
- **Don't add, delete or rename files while `check` runs.** ESLint lists files up front. `scripts/` is linted too.
- **Chrome extension:** not connected in sessions 3–6. Use `scripts/ui-check.mjs` (Chrome at the default path, or set `CHROME`).
- **Dev server cleanup:**
  - `TaskStop` leaves `node …/start-server.js` on :3000. Find it with `netstat -ano | grep :3000` and `taskkill //PID <pid> //F`.
  - `next dev` rewrites `next-env.d.ts` and `src/generated/search-index.json`; `build` rewrites only the index. Restore them with `git checkout -- <path>`, and never commit them. `calculator-counts.json` is rewritten too, but identically.
- **SimpleChart:** it floors log axes at 1e-10, and `Number(null)` becomes 0, so trim arrays instead of inserting nulls.
- **Committing:** `git commit -F msg -- <paths>` commits only those paths, but untracked files need `git add` first.
- **Agents:** `.claude/agents/implementer.md` and `physics-reviewer.md` exist, but sessions 3–6 didn't list them as Agent types.
- **TDZ errors** that `tsc` misses show up in `next build`. Sweep with `@typescript-eslint/no-use-before-define`.
- **ESLint baseline:** 3 rules are still `warn`: `purity` (Phase 1), plus memoization and `any` (Phase 2).
- **`ion-assisted-deposition` is deliberately unfixed** (Phase 4 rewrite), and `point-ahead` is off by a factor of 2 (Phase 4).
- **Commit hook:** it runs `node .claude/hooks/block-secrets.mjs` on Bash calls and blocks token shapes in commits.
- **npm 12 skips install scripts** for esbuild, sharp and unrs-resolver. Harmless: the prebuilt win32-x64 packages are present.
- **Vercel:** project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq` (scope `mariusrut-8463s-projects`). The MCP returned 403 until re-authentication.

## Working style (quota)
- One phase or stage per session, then a handover and `/clear`.
- Keep tool output small: tail and failures only.
