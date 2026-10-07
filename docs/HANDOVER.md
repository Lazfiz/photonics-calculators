# Handover — 2026-10-07 (session 10 → session 11)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 2 and "Found during Phase 2").
- Phases 0 and 1 and PR #5 are on `main`. Production passes `ui-check`: 37/37, 0 console errors.
- Session 10 did Phase 2, stage 1 on branch `phase-2/constants-thin-film` (**PR #6**).
- Next: merge PR #6 if it isn't merged yet (ask the user first), then the next Phase 2 box.

## State
- **`main`** is at `4e6e1ffb` (merge of PR #5). Production is deployed from it.
- **PR #6** (`phase-2/constants-thin-film`) has five commits:
  1. `feat(physics)`: `src/physics/constants.ts` holds the exact SI constants, the constants derived from them, and the CODATA 2022 measured values. `src/lib/complex.ts` moved to `src/physics/complex.ts` and gained `sqrt`, `abs2` and `scale`. `.claude/rules/physics.md` points at both files.
  2. `feat(thin-film)`: `src/physics/thin-film/transfer-matrix.ts`.
     - It handles complex N, s and p, and returns r, R, T and A. It's overflow-safe and returns NaN for bad input.
     - Exports: `stackResponse`, `unpolarizedResponse`, `reflectanceSpectrum`, `quarterWaveThickness`, `quarterWaveLayers`, `quarterWaveStackReflectance`.
     - 11 golden tests. Three deliberately broken copies of the module each fail them.
  3. `refactor(thin-film)`: `angle-tuning` and `beamsplitter` use the module. Their output is unchanged (3e-15).
  4. `fix(thin-film)`: `cold-mirror`, `heat-mirror`, `partial-reflector`, `wavelength-separation` and `environmental-stability` were wrong (see ROADMAP), and now use the module.
  5. `docs`: this file and the ROADMAP.
- **Gates on the branch:**
  - `check`: 0 errors, 1,359 warnings (was 1,365), 65/65 tests.
  - `build`: 541 routes.
  - `ui-check` (local `npm run start`): 37/37 PASS, 0 console errors. Load mode on the 7 pages: 0 errors.
  - The prerendered pages show the hand-calculated values: partial-reflector R_design 9.65 % (was 4.26 %), cold-mirror 99.6954 %, heat-mirror 95.2531 %.

## Next actions
1. PR #6: check CI and the preview, ask the user, then `gh pr merge 6 --merge`. Run `ui-check` against production afterwards.
   - The `phase-0`, `phase-1`, `docs/session-8-ship` and `fix/nested-labels` branches can be deleted on the remote (ask first).
2. **Phase 2, stage 1b:** migrate the other 26 thin-film pages that have an inline matrix.
   - List them with `git grep -l -E "m11|cosD" -- 'src/app/thin-film/*/page-client.tsx'`.
   - Work in batches of ≤10 files. That's under the codemod threshold, but the pages' code differs anyway.
   - For each page, copy the old inline code into a scratch script and compare it with the module at the defaults, as session 10 did with `computeRT` (`scratchpad/compare.ts` pattern). That's how the bugs were found: 3 of 7 pages were wrong.
   - Metals (`enhanced-aluminum`, `protected-silver`, `metal-dielectric`) need `k`. The module supports it.
3. Inline constants in 46 files → imports from `constants.ts` (codemod).
4. Phase 2, stage 2: the registry (see ROADMAP).
5. Optional: `/thin-film/dielectric-high-reflector` throws React #418; the committed `search-index.json` is stale.

## Ship flow (worked three times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** `get_access_to_vercel_url` (team `team_LaEJuanZGFVc5UHhLD6LRaiq`) returns a `?_vercel_share=` link. Or test a local `npm run start` instead.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **Physics modules:**
  - SI in, SI out. Pages convert nm with `* 1e-9` at the boundary.
  - The module's sign convention is e^(−iωt), N = n + iκ. Its r_p equals r_s at normal incidence (admittance convention). Only R, T and A are convention-free.
  - Tests use `node:test`. Check that a test can fail by mutating the module in place (`cp` it to the scratchpad and restore it afterwards).
- **Stopping `npm run check`:** use TaskStop. No `tsc` process is left behind. Don't edit `.ts` files while it runs.
- **Codemods:** template `scripts/codemods/2026-10-07-nested-labels.ts`. It's idempotent, verifies itself, and `CODEMOD_LIST=1` lists the changes.
- **`ui-check`:**
  - It flakes on Chrome startup, so loop up to 3 times until the log has `ALL PASS` or `FAILED`.
  - Load mode prints `ALL PASS` even when errors are logged, so read `console errors/warnings: N`.
  - In Git Bash, set `MSYS_NO_PATHCONV=1`.
- **`build` rewrites `src/generated/search-index.json`.** Run `git checkout --` on it before committing.
- **Local production server:** `npm run start` (port 3000). Kill it with `netstat -ano | grep ':3000 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run them in the background.
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first. Python is `py`/`python`.
- **Deliberately unfixed until Phase 4:** `ion-assisted-deposition`, `point-ahead` (×2), and the `environmental-stability` coefficients.
- **Vercel:** project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`.
- **Chrome extension:** not connected in sessions 3–10. Use `scripts/ui-check.mjs`.
