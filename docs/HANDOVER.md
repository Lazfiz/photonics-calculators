# Handover — 2026-10-07 (session 7 → session 8)

**Start here:** read this file, then `docs/ROADMAP.md`.
- Phase 0 is done but not pushed. At the start of session 7 the `origin` URL **still embedded a credential**, so 0.1 (user, manual) is still open.
- Phase 1 items 1–5 are done on `phase-1`.
- Next: Phase 1 item 6 (seeded PRNG), then the nested-label codemod found in item 5.

## State
- **`phase-0`**: 5 commits ahead of `main` (`0749eb58`), **not pushed**.
- **`phase-1`** is stacked on `phase-0` and also not pushed. Session 7 added:
  - `77d31e60` `fix(ui)`: one label per number input. 532 duplicate captions removed in 150 files, including the 44 `{label}` sites. 18 wrong or shifted labels were corrected, `ValidatedNumberInput` `label` is now `ReactNode`, and the photorefractive "Applied Field" input was bound to `wavelength` (fixed).
  - `19d11cda` `fix(ui)`: `CalculatorShell` rendered in 68 pages, so all 524 pages now have it. 4 detector pages lacked the import. `ui-check` gained 4 checks.
  - then a docs commit (ROADMAP tick, this file).
- **Gates on `phase-1`:**
  - `check`: 0 errors, 1,374 warnings (was 1,439; removed code carried warnings), 46/46 tests.
  - UI check (`node scripts/ui-check.mjs` against `npm run dev`): 35/35 PASS. The 4 new checks fail on the old pages (proved by swapping in `HEAD` versions). The only console error is the known 1-ulp `SimpleLineChart` path on `detectors/quantum-efficiency` (Phase 3).
  - `build`: green, 541 static routes. The built `ber` page has the shell's h1 and breadcrumb, `sbs-threshold` has no "{label}", and the gas-laser input labels are in row order.

## Next actions
1. Ask the user whether 0.1 is done.
   - Check without printing the URL: `u=$(git config --get remote.origin.url); case "$u" in https://*@*) echo with-credential;; *) echo clean;; esac`
2. If it's done, ship (0.6). The steps are unchanged from session 6:
   - Push `phase-0`, then PR, CI, preview, merge.
   - Then push `phase-1` and PR it.
   - On the preview, run `node scripts/ui-check.mjs <preview-url>` and spot-check:
     - ber/bpsk-qpsk charts
     - `/fiber-optics/fiber-gyroscope` JSON-LD
     - the "524" count
     - one shell page (e.g. `/free-space-comms/ber`: title, breadcrumb, share)
3. Phase 1 item 6: a seeded PRNG (`src/physics/random.ts`) for the 6 `Math.random` pages, then `react-hooks/purity` back to `error`.
4. Then (ROADMAP "Found during Phase 1"): 138 nested `<label>` cards in 53 files wrap a `ValidatedNumberInput`. Codemod them like `2026-10-07-input-captions.ts`: span content → `label={<>…</>}`, drop the wrapper.

## Decisions made this session
- **Caption beats input label.** Where a caption `<label>` and the input's `label` disagreed, the caption matched the bound `value` in every case checked (the resonator pages were shifted by one row). The codemod keeps the caption's text.
- **Pages fixed by the shell codemod use `metadata` for title and description.** The ~456 older shells use their own titles, which drift from `metadata`. That's logged for the Phase 2 registry and deliberately not changed now.
- **Split commits by re-running codemods.** The two codemods touched 49 of the same files. To commit them separately:
  - save the final files and revert the overlap
  - re-run the first codemod only, gate it, commit
  - restore the final files and `cmp` the full diff against the saved patch
- **OPA/OPO** use `max-w-6xl`. They were full-width with their own description `<p>`, which the metadata description now replaces.

## Non-obvious facts
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run them in the background.
- **`ui-check` flakes on Chrome startup** ("reading 'webSocketDebuggerUrl'"). Rerun until the log has `ALL PASS` or `FAILED`.
- **Don't write `\n` inside a Python heredoc that patches TS source.** It became a raw newline in a string literal: unterminated string, and `tsx` crashed.
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
- **Chrome extension:** not connected in sessions 3–7. Use `scripts/ui-check.mjs`.

