# Handover — 2026-10-07 (session 8 → session 9)

**Start here:** read this file, then `docs/ROADMAP.md`.
- Phase 0 is done but not pushed. In session 8 the user confirmed 0.1 (remove the PAT from the `origin` URL and revoke it) is **still not done**.
- The **Phase 1 checklist is complete** on `phase-1` (items 1–6).
- Next: the nested-`<label>` codemod from "Found during Phase 1". Ship once 0.1 is done.

## State
- **`phase-0`**: 5 commits ahead of `main` (`0749eb58`), **not pushed**.
- **`phase-1`** is stacked on `phase-0` and also not pushed. Session 8 added:
  - `5f706727` `fix(physics)`: `src/physics/random.ts` (mulberry32 `createRng`, `uniform`, Box–Muller `gaussian`) replaces `Math.random` in render in 6 pages. `react-hooks/purity` is `error` again.
  - then a docs commit (ROADMAP tick, this file).
- **Gates on `phase-1`:**
  - `check`: 0 errors, 1,365 warnings (was 1,374; the 9 purity warnings are gone), 51/51 tests.
  - Headless Chrome on the 6 pages (`ui-check … load`): 0 console errors. The control run with the old pages logged 2 "Hydration failed" errors.
  - `build`: not re-run in session 8 (last green in session 7). Run it before the first push.

## Next actions
1. Ask the user whether 0.1 is done.
   - The session-7 check command (reads the remote URL, prints only `with-credential`/`clean`) was **denied by the permission system** in session 8. Ask the user instead.
2. If it's done, ship (0.6). The steps are unchanged:
   - Run `npm run build` on `phase-1`.
   - Push `phase-0`, then PR, CI, preview, merge.
   - Then push `phase-1` and PR it.
   - On the preview, run `node scripts/ui-check.mjs <preview-url>` and spot-check:
     - ber/bpsk-qpsk charts
     - `/fiber-optics/fiber-gyroscope` JSON-LD
     - the "524" count
     - one shell page (e.g. `/free-space-comms/ber`: title, breadcrumb, share)
     - `/spectroscopy/spectral-calibration`: no hydration error
3. Nested-label codemod (ROADMAP "Found during Phase 1"): 138 `<label>` cards in 53 files wrap a `ValidatedNumberInput`.
   - Model it on `scripts/codemods/2026-10-07-input-captions.ts`: move the span content into `label={<>…</>}` and drop the wrapper.
   - Use the `codemod` skill: dry run, then a 5-file sample diff, then the tsc gate, then apply.
4. Then Phase 2 (constants + physics modules, registry).

## Decisions made this session
- **One fixed seed per page, created inside the memo** (`createRng(1)`), not a module-level generator.
  - Every recompute draws the same sequence, so the server and client agree.
  - Changing an input rescales one noise realization rather than redrawing it.
  - There's no "new sample" button. That would be a feature: keep the initial seed fixed and put any reseed in `useState`.
- **polarization-scrambling still draws a random input angle (seeded).** The residual DoP doesn't depend on it, because rotating every Stokes vector about S3 leaves |⟨S⟩| unchanged. Only the displayed S1/S2 components change.
- **mulberry32** was chosen for simplicity (32-bit state, period 2³²). That's fine for visual noise, but not for long Monte Carlo runs. Golden values come from an independent Python port of the C reference; no published test vectors were used.

## Non-obvious facts
- **`ui-check` load mode prints `ALL PASS` even when it logs console errors.** Read the `console errors/warnings: N` line instead.
  - The full mode also doesn't fail on console errors, because of the known 1-ulp `quantum-efficiency` error.
- **Git Bash rewrites `/path` arguments into Windows paths** (`C:/Program Files/Git/...`). Set `MSYS_NO_PATHCONV=1` before `node scripts/ui-check.mjs <base> load /a /b`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run them in the background.
- **Comparing lint before and after per file:** `git show HEAD:<p> | npx eslint --stdin --stdin-filename <p>`. It's slow (~20 s per file).
- **`ui-check` flakes on Chrome startup** ("reading 'webSocketDebuggerUrl'"). Rerun until the log has `ALL PASS` or `FAILED`.
- **Don't write `\n` inside a Python heredoc that patches TS source** (it becomes a raw newline). Patching through a `py - <<'EOF'` script with `str.count(old) == 1` asserts worked well for ≤10 files.
- **Codemods:** ts-morph parses all 524 pages in about 5 s. Keep the pattern: idempotent, self-verifying, dry run first.
- **Committing:**
  - `git commit -F msg -- <paths>` commits only those paths; untracked files need `git add` first.
  - Python is `python`/`py`, not `python3`.
- **Dev server cleanup:**
  - Kill it with `netstat -ano | grep :3000` → `taskkill //PID <pid> //F //T`.
  - Then `git checkout -- next-env.d.ts src/generated/search-index.json`.
- **Don't add, delete or rename files while `check` runs.** `scripts/` is linted too.
- **`ion-assisted-deposition` is deliberately unfixed** (Phase 4), and `point-ahead` is off by a factor of 2 (Phase 4).
- **Vercel:** project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`.
- **Chrome extension:** not connected in sessions 3–8. Use `scripts/ui-check.mjs`.
