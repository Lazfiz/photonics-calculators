# Handover — 2026-10-07 (session 11 → session 12)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 2 and "Found during Phase 2").
- PR #6 (constants and the thin-film pilot) was merged to `main` as `4c4a6755`. Production passed `ui-check` afterwards: 37/37.
- The old remote branches were deleted: `phase-0`, `phase-1`, `docs/session-8-ship` and `fix/nested-labels`.
- Session 11 did Phase 2, stage 1b on branch `phase-2/thin-film-1b` (**PR #7**, see below).
- Next: merge PR #7 if it isn't merged yet (ask the user first), then the next Phase 2 box.

## State
- **`phase-2/thin-film-1b`** has six commits on top of `main`:
  1. `feat(thin-film)`: `src/physics/thin-film/cavity-filter.ts` with `cavityFilterLayers()`.
     - It builds Fabry-Perot designs: each cavity is (HL)^p S (LH)^p, and cavities are joined by a quarter-wave L.
     - 4 golden tests in `tests/thin-film-cavity-filter.test.ts` use absentee-layer hand values. Two mutations of the module each fail them.
  2. `fix(thin-film)`: `bandpass-filter`, `narrow-bandpass` and `notch-filter`. Their mirrors were not mirrored, so the bandpasses had no passband at λ₀.
  3. `fix(thin-film)`: 7 pages with a real matrix (the `i` was lost).
  4. `fix(thin-film)`: 8 more pages (real matrix, ABCD sign error, wrong closed-form peak R).
  5. `fix(thin-film)`: the last 7 pages (bragg r formula, absorbing-metal matrix, three heuristics).
  6. `docs`: this file and the ROADMAP.
- 32 thin-film pages use `transfer-matrix.ts`, and none has an inline matrix left. The bugs found in each page are in ROADMAP → "Found during Phase 2".
- **Gates:**
  - `check`: 0 errors, 1,347 warnings (was 1,359), 69/69 tests.
  - `build`: 541 routes.
  - `ui-check` (local `npm run start`): 37/37 PASS, 0 console errors. Load mode on the 25 changed pages: 0 errors, `dielectric-high-reflector` included (its #418 is gone). The prerendered pages show the harness values: dielectric-stack 98.72 %, long-pass 97.9171 %, short-pass 95.2531 %, notch depth 99.94 %, narrow-bandpass 98.74 %.

## Next actions
1. PR #7: check CI and the preview, ask the user, then `gh pr merge 7 --merge`. Run `ui-check` against production afterwards.
2. Phase 2: compare the 12 closed-form thin-film pages with the module (ROADMAP has the list). Use the same method:
   - Copy the old code verbatim into `scratchpad/compareN.ts`.
   - Compute the module's response at the page's defaults and print max |old − new|.
   - Then restore the old geometry with the bug fixed (for example, put the `i` back). It should agree with the new page code to about 1e-14. This proves the layer order is right.
3. Inline constants in 46 files → imports from `constants.ts` (codemod).
4. Phase 2, stage 2: the registry (see ROADMAP).
5. Optional: the committed `search-index.json` is stale.

## Ship flow (worked four times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** `get_access_to_vercel_url` (team `team_LaEJuanZGFVc5UHhLD6LRaiq`) returns a `?_vercel_share=` link. Or test a local `npm run start` instead.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **Physics modules:**
  - SI in, SI out. Pages convert nm with `* 1e-9` at the boundary.
  - Layers are listed from the incident side. Most of the old pages listed them from the substrate, with η₀ and η_sub swapped in r. Reverse those lists.
  - The module's sign convention is e^(−iωt), N = n + iκ. Only R, T and A are convention-free.
  - Tests use `node:test`. Check that a test can fail by mutating the module in place (`cp` it to the scratchpad and restore it afterwards).
- **Page edits:** pages with the same template were edited with a Node script per file, guarded by markers: it throws if a marker isn't found. That's not a bulk regex. More than 10 files still needs the codemod skill.
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
- **Deliberately unfixed until Phase 4:** `ion-assisted-deposition`, `point-ahead` (×2), the `environmental-stability` coefficients, and the thin-film models and labels listed in the ROADMAP.
- **Vercel:** project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`.
- **Chrome extension:** not connected in sessions 3–11. Use `scripts/ui-check.mjs`.
