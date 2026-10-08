# Handover — 2026-10-08 (session 13 → session 14)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 2 and "Found during Phase 2").
- PR #8 (12 closed-form thin-film pages) was merged as `c3633aaa`. Production passed `ui-check` afterwards: 37/37, 0 console errors.
- Session 13 did the constants codemod on branch `phase-2/inline-constants` (**PR #9**).
- Next: merge PR #9 if it isn't merged yet (ask the user first), then the unit-scaled constants or the registry.

## State
- **`phase-2/inline-constants`** has three commits on top of `main`:
  1. `refactor(constants)`: `scripts/codemods/2026-10-08-inline-constants.ts` replaced 273 literals in 91 files with imports from `constants.ts`.
     - 122 declarations removed, 49 references renamed (`kB` → `k_B`, …), 5 hook-deps entries dropped.
     - `1.673e-27` (amu in 4 deposition pages) maps to `m_u`. μ₀ = 4π·1e-7 maps to `mu_0`.
     - Never-set state constants in `shot-noise`, `reset-noise` and `thermal-noise` are imports now.
     - Hand pre-edits: QKD's entropy `h` → `binaryEntropy`, SPM's `chirp.map(c => …)` → `w`.
  2. `test(constants)`: `tests/no-inline-constants.test.ts` fails on any literal within 1 % of an SI constant outside `constants.ts`. A mutation (the old `pmt` page) makes it fail.
  3. `docs`: this file and the ROADMAP.
- **Gates:**
  - `check`: 0 errors, 1,335 warnings (was 1,342), 79/79 tests (was 78).
  - `build`: 541 routes.
  - `ui-check` (local, port 3100): 37/37 PASS, 0 console errors. Load mode on 16 changed pages: 0 errors.

## Next actions
1. PR #9: check CI and the preview, ask the user, then `gh pr merge 9 --merge`. Run `ui-check` against production afterwards.
2. Unit-scaled constants (ROADMAP Phase 2, the unchecked sub-item): `1240` ×28 is hc in eV·nm *or* a wavelength, so classify each site by hand first. Then add the derived values to `constants.ts`, or convert at the call. More than 10 files → codemod with an explicit site list.
3. Phase 2, stage 2: the registry (see ROADMAP).
4. Optional: the committed `search-index.json` is stale.


## Ship flow (worked six times)
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
  - For renames and scope, see `2026-10-08-inline-constants.ts`: it uses `findReferencesAsNodes` and checks each name resolves with the type checker. Remove each file from the ts-morph project after use, or every check rebuilds the whole program (4.5 min → 38 s).
  - `scripts/` is type-checked by `tsc`, so a codemod with a type error turns the gate red.
- **`ui-check`:**
  - It flakes on Chrome startup, so loop up to 3 times until the log has `ALL PASS` or `FAILED`.
  - Load mode prints `ALL PASS` even when errors are logged, so read `console errors/warnings: N`.
  - In Git Bash, set `MSYS_NO_PATHCONV=1`.
- **`build` rewrites `src/generated/search-index.json`.** Run `git checkout --` on it before committing.
- **Local production server:** port 3000 can be taken by another project's dev server (`Solfa-Quest` react-scripts; leave it alone). Use `npx next start -p 3100` and pass `http://localhost:3100` to `ui-check`. Kill it with `netstat -ano | grep ':3100 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run them in the background.
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
- **Deliberately unfixed until Phase 4:** `ion-assisted-deposition`, `point-ahead` (×2), the `environmental-stability` coefficients, `thermal-evaporation`, and the thin-film models and labels listed in the ROADMAP.
- **Vercel:** project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`.
- **Chrome extension:** not connected in sessions 3–12, not tried in 13. Use `scripts/ui-check.mjs`.
