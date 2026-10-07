# Handover — 2026-10-07 (session 9 → session 10)

**Start here:** read this file, then `docs/ROADMAP.md`.
- Phases 0 and 1 are on `main` (PRs #2, #3, #4).
- Session 9 fixed the nested-`<label>` item on branch `fix/nested-labels`, in **PR #5**.
- Next: merge PR #5 if it isn't merged yet (ask the user first), then **Phase 2**.

## State
- **`main`** is at `47f8fa74` (merge of PR #4). Production is deployed from it.
- **PR #5** (`fix/nested-labels`) has three commits:
  - `716b892b` `refactor(ui)`: `scripts/codemods/2026-10-07-nested-labels.ts` unwrapped 138 card `<label>`s around a `ValidatedNumberInput` in 53 files.
    - 0 were skipped, and every caption matched its input's old label.
    - Captions with `<sub>` now go in `label={<>…</>}`.
    - `ui-check` has 2 new checks on `/thin-film/angle-tuning`. Both fail on the old pages.
  - `6d2a9270` `fix(laser-safety)`: the `mpe` description said "310^4 s". It now says "3×10⁴ s".
  - A `docs` commit with this file and the ROADMAP.
- **Gates on the branch:**
  - `check`: 0 errors, 1,365 warnings, 51/51 tests.
  - `build`: 541 routes.
  - `ui-check` (local `npm run start`): 37/37 PASS, 0 console errors.
  - Load check of the 53 pages: 1 error, which production also has (below).
- If PR #5 is merged: run `ui-check` against production and expect 37/37.

## Next actions
1. PR #5: check CI and the preview, ask the user, then `gh pr merge 5 --merge`. Verify production afterwards.
   - The `phase-0`, `phase-1` and `docs/session-8-ship` branches can be deleted on the remote.
2. **Phase 2, stage 1:** `src/physics/constants.ts` (CODATA 2018 exact values for `c`, `h`, `e`, `k_B`, `N_A`, plus measured values with their uncertainty noted).
   - Then pilot `src/physics/<category>/<slug>.ts` on one category with golden tests, before any codemod.
   - Suggested pilot: thin-film. Its pages share a transfer-matrix `computeRT`, so one module serves many pages.
3. Phase 2, stage 2: the registry (slug, title, description, category, tier, references, aliases). It generates the sitemap, search index, metadata, JSON-LD and related links.
4. Optional cleanup:
   - `/thin-film/dielectric-high-reflector` throws React #418 on every load (see ROADMAP).
   - The committed `search-index.json` is stale.

## Ship flow (worked twice)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** `get_access_to_vercel_url` (team `team_LaEJuanZGFVc5UHhLD6LRaiq`) returns a `?_vercel_share=` link. Open it with a cookie jar, or test a local `npm run start` instead.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status, then run `ui-check` against production.

## Non-obvious facts
- **Codemods:**
  - ts-morph parses all 524 pages in about 5 s.
  - Template: `scripts/codemods/2026-10-07-nested-labels.ts`. It is idempotent and verifies itself (parse, node counts, nothing left over). It reports skips, and `CODEMOD_LIST=1` lists the changes.
- **Testing `ui-check` assertions:** run a new check against production (old code) before merging, to prove it fails there.
  - The first `n<sub>substrate</sub>` check passed on the old page, because the outer wrapper matched. Anchor on `input.closest("label")`.
- **`ui-check` output:**
  - It flakes on Chrome startup (`webSocketDebuggerUrl`), so loop up to 3 times until the log has `ALL PASS` or `FAILED`.
  - Load mode prints `ALL PASS` even when errors are logged, so read the `console errors/warnings: N` line.
  - In Git Bash, set `MSYS_NO_PATHCONV=1`.
- **`build` rewrites `src/generated/search-index.json`** (about 5k lines on `main` today). Run `git checkout --` on it before committing, unless the commit is meant to refresh it.
- **Local production server:** `npm run start` on port 3000. Kill it with `netstat -ano | grep ':3000 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run them in the background, and don't add or rename files while `check` runs.
- **Committing:**
  - `git commit -F msg -- <paths>` commits only those paths. Untracked files need `git add` first.
  - Python is `py`/`python`.
- **Comparing lint per file:** `git show HEAD:<p> | npx eslint --stdin --stdin-filename <p>` (about 20 s per file).
- **Deliberately unfixed until Phase 4:** `ion-assisted-deposition`, and `point-ahead` (off by a factor of 2).
- **Vercel:** project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`.
- **Chrome extension:** not connected in sessions 3–9. Use `scripts/ui-check.mjs`.
