# Handover — 2026-10-08 (session 12 → session 13)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 2 and "Found during Phase 2").
- PR #7 (25 thin-film pages on the transfer matrix) was merged as `85f67a8e`. Production passed `ui-check` afterwards: 37/37, 0 console errors.
- Session 12 did Phase 2, stage 1c on branch `phase-2/thin-film-closed-form` (**PR #8**). It compared the 12 closed-form thin-film pages with the module.
- Next: merge PR #8 if it isn't merged yet (ask the user first), then the constants codemod.

## State
- **`phase-2/thin-film-closed-form`** has six commits on top of `main`:
  1. `feat(thin-film)`: `interference.ts` (F, finesse, Airy width, net reflection phase, first extrema), `ellipsometry.ts` (two-phase inversion) and `quarterQuarterArInnerIndex`.
     - 8 new golden tests, plus 1 in the transfer-matrix file. Six mutations each fail them.
  2. `fix(thin-film)`: `multilayer-ar`, `amplitude-splitting`, `interference-conditions` and `phase-shift-coating`. They showed wrong R, T or interference conditions.
  3. `fix(thin-film)`: `ellipsometry-measurement`. The signs of k and ε₂ were wrong, Rs and Rp were wrong, and the thickness was invented.
  4. `fix(thin-film)`: `fabry-perot-filter` (FWHM), `wedge-film` (aliased sampling) and `angle-shift` (a duplicate curve).
  5. `refactor(thin-film)`: `single-ar` and `quarter-wave` use the module. They were already exact.
  6. `docs`: this file and the ROADMAP.
- `fresnel-equations` was exact and is unchanged. `thermal-evaporation` isn't optics; its bugs are listed under Phase 4 in the ROADMAP.
- **Gates:**
  - `check`: 0 errors, 1,342 warnings (was 1,347), 78/78 tests (was 69).
  - `build`: 541 routes.
  - `ui-check` (local `npm run start`): 37/37 PASS, 0 console errors. Load mode on the 10 changed pages: 0 errors.
  - The prerendered pages show the harness values: multilayer-ar n₂ 1.701 and R 4.3033 %, interference 276.0/552.0 nm, ellipsometry ⟨k⟩ 4.3719, Fabry-Perot FWHM 14.384 nm, wedge Δx 0.105 mm.

## Next actions
1. PR #8: check CI and the preview, ask the user, then `gh pr merge 8 --merge`. Run `ui-check` against production afterwards.
2. Replace the inline constants in 46 files with imports from `constants.ts`, using a codemod (ROADMAP Phase 2).
   - `thermal-evaporation` uses `1.673e-27` as the atomic mass unit. Map it to `m_u`, not `m_p`, and say so in the commit.
   - Expect last-digit changes.
3. Phase 2, stage 2: the registry (see ROADMAP).
4. Optional: the committed `search-index.json` is stale.

## Ship flow (worked five times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** `get_access_to_vercel_url` (team `team_LaEJuanZGFVc5UHhLD6LRaiq`) returns a `?_vercel_share=` link. Or test a local `npm run start` instead.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **Physics modules:**
  - SI in, SI out. Pages convert nm with `* 1e-9` at the boundary.
  - Layers are listed from the incident side.
  - The transfer matrix uses e^(−iωt), N = n + iκ and r_p = r_s at normal incidence. Only R, T and A are convention-free.
  - Ellipsometry uses the Nebraska convention: r_p = −r_s at normal incidence and N = n − ik. Its ρ is the complex conjugate of the module's −r_p/r_s.
  - Tests use `node:test`. Check that a test can fail by mutating the module in place (`cp` it to the scratchpad and restore it afterwards).
- **Comparing a page:** copy the old code verbatim into `scratchpad/compareN.ts` and import the module by its absolute path (`C:/dev/photonics-calculators/src/...`). Run it with `npx tsx`.
- **Page edits:** use a Node script per file, guarded by markers: it throws if a marker isn't found. Put the script in a scratchpad `.cjs` file: an apostrophe in a `node -e '…'` string breaks the shell quoting. More than 10 files still needs the codemod skill.
- **`SimpleChart`** (used by `ChartPanel` for line charts):
  - It ignores `rangemode`.
  - `range: [0, "auto"]` gives a 0–1 axis with no ticks. Omit `range` to auto-scale.
  - It skips NaN points.
- **Fractional counts** (pairs, cavities) reach the physics because `ValidatedNumberInput` has step "any". Round them at the call.
- **Stopping `npm run check`:** use TaskStop. No `tsc` process is left behind. Don't edit `.ts` files while it runs.
- **Codemods:** template `scripts/codemods/2026-10-07-nested-labels.ts`. It's idempotent, verifies itself, and `CODEMOD_LIST=1` lists the changes.
- **`ui-check`:**
  - It flakes on Chrome startup, so loop up to 3 times until the log has `ALL PASS` or `FAILED`.
  - Load mode prints `ALL PASS` even when errors are logged, so read `console errors/warnings: N`.
  - In Git Bash, set `MSYS_NO_PATHCONV=1`.
- **`build` rewrites `src/generated/search-index.json`.** Run `git checkout --` on it before committing.
- **Local production server:** `npm run start` (port 3000). Kill it with `netstat -ano | grep ':3000 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run them in the background.
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
- **Deliberately unfixed until Phase 4:** `ion-assisted-deposition`, `point-ahead` (×2), the `environmental-stability` coefficients, `thermal-evaporation`, and the thin-film models and labels listed in the ROADMAP.
- **Vercel:** project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`.
- **Chrome extension:** not connected in sessions 3–12. Use `scripts/ui-check.mjs`.
