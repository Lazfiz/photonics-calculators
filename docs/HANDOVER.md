# Handover — 2026-10-08 (session 14 → session 15)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 2 and "Found during Phase 2").
- PR #9 (constants codemod) was merged as `5bda6545` before this session.
- Session 14 did the unit-scaled constants on branch `phase-2/unit-scaled-constants` (**PR #10**).
- Next: merge PR #10 (ask the user first), then the registry (Phase 2, stage 2).

## State
- **`phase-2/unit-scaled-constants`** has four commits on top of `main`:
  1. `fix(gires-tournois)`: c was 299792.458 "nm/fs" (it's 299.79), so τ was 10³ and the GDD 10⁶ too small. The GDD sign was flipped too.
     - New `src/physics/wave-optics/gires-tournois.ts` with 3 golden tests. A mutation of the sign or of c fails them.
     - Defaults: GDD −0.0024 → +2,404 fs², τ 0.065 → 65.3 fs.
  2. `refactor(constants)`: `scripts/codemods/2026-10-08-unit-scaled-constants.ts` changed 38 hand-listed sites in 33 files.
     - New `hc_eV_nm` and `k_B_eV` in `constants.ts`. Other scales convert at the call (`c * 100`, `b_Wien * 1e9`, …).
     - Hand pre-edits: the CARS page's `cars.map(c => …)` → `v`, and `raman-shift`'s comment (GHz, not THz).
  3. `test(constants)`: the guard test covers the scaled forms (tolerance per entry; hc in eV·nm only as `1240 / x`).
  4. `docs`: this file and the ROADMAP.
- **Gates:**
  - `check`: 0 errors, 1,331 warnings (was 1,335), 82/82 tests (was 79).
  - `build`: 541 routes.
  - `ui-check` (local, port 3100): 37/37 PASS, 0 console errors. Load mode on the 34 changed pages: 0 console errors.
- **Open, logged in the ROADMAP:** `chromatic-dispersion` shows β₂ = +0.0219 "ps²/km" for fused silica at 1550 nm, where the value is −27.95 ps²/km. It drops the sign of dn/dλ and labels −D as β₂.

## Next actions
1. PR #10: check CI and the preview, ask the user, then `gh pr merge 10 --merge`. Run `ui-check` against production afterwards.
2. Phase 2, stage 2: the registry (see ROADMAP). It's the biggest remaining Phase 2 item. Design it first (schema, where it lives, what it generates).
3. Small, self-contained: fix `chromatic-dispersion` with a Sellmeier module and golden values (Malitson 1965). See the ROADMAP's Phase 2 findings.
4. Optional: the committed `search-index.json` is stale.

## Ship flow (worked seven times)
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
  - Group delay τ = dφ/dω (e^(−iωt)) and GDD = dτ/dω. A numerical derivative of arg r is a good independent oracle (see `tests/gires-tournois.test.ts`).
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
  - When matching by value is ambiguous, list the sites by hand with expected counts, as `2026-10-08-unit-scaled-constants.ts` does. A count mismatch skips the file.
  - The resolve check flags *any* identifier spelled like an import, even an unrelated arrow parameter (`map(c => …)`). Rename those by hand first.
  - `scripts/` is type-checked by `tsc`, so a codemod with a type error turns the gate red.
- **`ui-check`:**
  - It flakes on Chrome startup, so loop up to 3 times until the log has `ALL PASS` or `FAILED`.
  - Load mode prints `ALL PASS` even when errors are logged, so read `console errors/warnings: N`.
  - In Git Bash, set `MSYS_NO_PATHCONV=1`.
  - The hydration probe needs an `<input>`. Pages without one (`x-ray-optics`) always report "not hydrated", on production too.
- **`build` rewrites `src/generated/search-index.json`.** Run `git checkout --` on it before committing.
- **Local production server:** port 3000 can be taken by another project's dev server (`Solfa-Quest` react-scripts; leave it alone). Use `npx next start -p 3100` and pass `http://localhost:3100` to `ui-check`. Kill it with `netstat -ano | grep ':3100 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run them in the background.
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
- **Deliberately unfixed until Phase 4:** `ion-assisted-deposition`, `point-ahead` (×2), the `environmental-stability` coefficients, `thermal-evaporation`, and the thin-film models and labels listed in the ROADMAP.
- **Vercel:** project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`.
- **Chrome extension:** not connected in sessions 3–12, not tried in 13–14. Use `scripts/ui-check.mjs`.
