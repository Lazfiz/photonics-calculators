# Handover — 2026-10-12 (session 43 → session 44)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 43 shipped the **fiber-optics audit, part 0** (PR #43, merged as `648bfb89`; production check passed). 46 pages
were audited: 3 OK and tiered, 9 questionable, 34 with a `knownIssue`. **Next: fiber-optics fix part 1**
(`gaussian-coupling.ts`: `splice-loss`, `connector-insertion-loss`, `coupling-efficiency`, `connector-return-loss`).

## State
- 142 of 461 pages are tiered, 34 `knownIssue`s (all fiber-optics), 456 tests pass.
- Fix parts 1–11 are in ROADMAP, grouped by shared module, with golden values. Per-page reviewer evidence (formulas,
  page vs correct numbers, candidate DOIs) is in the PR #43 description: `gh pr view 43 --json body -q .body`.
- Existing fiber modules: `src/physics/fiber-optics/{dispersion-comp,macro-bending-loss,polarization-mode-dispersion}.ts`
  (`vNumber`, `lp01Mode`, `modeFieldRadius`, `lp11CutoffWavelength`, `bendLossPerTurnDb`, `pmdLimitedLength`,
  `dispersionLimitedBitRate`, `dispersionPenaltyDb`, `rmsBroadening`, `dcfLength`, `residualSlope`).
- `polarizer-types` is blocked until the user is at the laptop with Chrome and the Claude extension connected.

## Next actions
1. Fix part 1: new `src/physics/fiber-optics/gaussian-coupling.ts` (Marcuse 1977, BSTJ 56, 703,
   https://doi.org/10.1002/j.1538-7305.1977.tb00534.x): offset exp(−2d²/(w₁²+w₂²)), tilt, gap in medium n
   1/(1+(λz/(2πnw²))²) for equal w, and the general w₁≠w₂ form. Golden: gap 10 µm, w 4.5 µm, λ 1.55 µm, n 1 →
   0.0640 dB; offset 0.5 µm, w 4.5 → 0.0536 dB. `connector-return-loss` reuses `polarization/fresnel.ts`
   (n 1.4682/1 → RL 14.44 dB) and needs a guard at n₁ = n₂.
2. Each fixed page: remove its `knownIssue`, set tier, `modelNote` (≤ 220 chars), references (check DOIs with
   `scripts/crossref.mjs`; reviewers had no web access).
3. After merge: `node scripts/post-merge-check.mjs <sha> "fiber-optics/splice-loss=<default total>" …` with the page's
   prerendered default values (read them from a local `next start` first; the HTML shows rounded values).

## Non-obvious facts
- **Audit procedure (part 0):** four `physics-reviewer` batches in parallel, grouped by topic (≈ 12 pages each), ≤ 12
  lines per page plus cross-page notes. Save each report as a short summary in the scratchpad as it arrives. Spot-check
  a few bug claims against the code before writing `knownIssue`s (40–240 chars, ends with a full stop, no tier).
- **Registry edits** on one file go through a scratchpad `.cjs` script with a dry run and anchor checks
  (`slug: "<x>",` → insert before the entry's `\n  },`).
- **eslint** reports ≈ 920 pre-existing warnings (mostly `no-explicit-any`, unused vars). `check` passes; don't chase
  them outside the pages being fixed.
- **Connectors:** the claude.ai connectors are switched per project in `~/.claude.json`
  (`projects["C:/dev/photonics-calculators"].disabledMcpServers`). Vercel was re-enabled in session 43; the other 10
  stay off here. Phone settings don't change it. Chrome needs the extension running in the laptop's Chrome.
- **Polarization conventions:** Goldstein/Collett signs, +θ counter-clockwise looking into the beam. Fibre pages that
  rotate Stokes vectors (e.g. `polarization-controller`) must chain `mueller.ts` `muellerRetarder`.
- **Sources:**
  - Crossref chapter DOIs: Goldstein 3rd ed. `10.1201/b10436-n`; Shurcliff 1962 `10.4159/harvard.9780674424135.cN`;
    Macleod 4th ed. `10.1201/9781420073034-cN`; Agrawal FOCS 4th ed. `10.1002/9780470918524`.
  - Jacobi–Anger is DLMF 10.12.2 (https://dlmf.nist.gov/10.12).
  - WebFetch returns arXiv PDFs as binary: save the file and run `pdftotext -layout` on it.
- **Mutation checks need a transcription test:** independent data sets agree only to about 1e-4.
- **React Compiler lint:** `useMemo` deps that are results of plain function calls can trip
  `preserve-manual-memoization`. Build the objects inside the memo from primitive deps.
- **Deleted pages or modules break `tsc`** through a stale `.next/types/validator.ts`: `rm -rf .next/types`, then
  `npm run check`.
- **Line endings:** some files are CRLF. Node edit scripts must `.replace(/\r\n/g, "\n")` before matching anchors.
- **Shell:**
  - Edit scripts go in scratchpad `.cjs` files. `node -e "…"` breaks on apostrophes and runs backticks.
  - `python -` with no stdin hangs.
  - In Git Bash a `/a/b` argument becomes `C:/Program Files/Git/a/b`. Use `MSYS_NO_PATHCONV=1`. `post-merge-check`
    takes paths without the leading slash.
  - A quick physics probe: copy the `.ts` file under `src/` so imports resolve, run `npx tsx`, then delete it.
- **ui-check:** `scripts/ui-check.mjs <base> load /a /b`. It can't hydrate-check a page with no `<input>`. Never run
  `taskkill /IM chrome.exe`.
- **Dev/prod server:** port 3100. Stop it before `npm run build` (both use `.next`). `TaskStop` leaves the `node` child
  on the port: `netstat -ano | grep :3100`, then `taskkill //PID <pid> //T //F`. Restore `next-env.d.ts` after a dev run.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min, CI ≈ 3 min. Background them; don't edit `.ts`
  files while `check` runs.
- **`useURLState` doesn't clamp:** clamp in the page. It also takes string defaults.
- **`SimpleChart`:** no `shapes` (use a `mode: "markers"` trace); skips NaN and values ≤ 0 on log axes; legend text is
  literal (use ₛ, ₚ, ₜ).
