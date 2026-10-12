# Handover — 2026-10-12 (session 44 → session 45)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 44 shipped **fiber-optics fix part 1** (PR #45, merged as `3b06bc9f`; production check passed). **Next: fix part
2**: new `chromatic-dispersion.ts` for `chromatic-dispersion`, `dispersion-shifted`, `fiber-delay-line`,
`fiber-bandwidth` and [`nonzero-dispersion`].

## State
- 146 of 461 pages are tiered, 32 `knownIssue`s (all fiber-optics), 466 tests pass.
- New `src/physics/fiber-optics/gaussian-coupling.ts`: `gaussianCoupling({w1, w2, lambda, n, offset, tilt, gap})`
  (general Gaussian overlap), `gaussianCouplingWorstTilt`, `gapEtalonTransmission` (Airy), `angledFaceReflectance`,
  `waistFromNA`, `stepReflectance`, `lossDb`, `returnLossDb`. Reuse it for `fiber-coupler`, lens-to-fibre or MFD
  mismatch pages.
- Other fiber modules: `dispersion-comp.ts`, `macro-bending-loss.ts` (`vNumber`, `lp01Mode`, `modeFieldRadius`,
  `bendLossPerTurnDb`), `polarization-mode-dispersion.ts` (`pmdLimitedLength`, `dispersionLimitedBitRate`, …).
- Per-page reviewer evidence for parts 2–11 (formulas, page vs correct numbers, candidate DOIs) is in the PR #43
  description: `gh pr view 43 --json body -q .body`.
- `polarizer-types` is blocked until the user is at the laptop with Chrome and the Claude extension connected.

## Next actions
1. Fix part 2: G.652 form D(λ) = S₀/4 (λ − λ₀⁴/λ³), S₀ 0.092 ps/(nm²·km), λ₀ 1310 nm → 17.46 ps/(nm·km) at 1550 (ITU-T
   G.652). Presets linear about 1550 nm for G.653/G.655/DCF (DCF ≈ −80). D↔β₂ = −λ²D/(2πc). Thermal delay of fibre
   ≈ 7.4 ppm/K. `fiber-bandwidth`: modal bandwidth ÷1000 bug, PMD via `pmdLimitedLength`.
2. Each fixed page: remove its `knownIssue`, set tier, `modelNote` (≤ 220 chars), references (check DOIs with
   `scripts/crossref.mjs`).
3. Run one `physics-reviewer` pass on the new module and pages **before** the PR. In session 44 it found six real issues
   that the golden tests could not catch: the tilt sign, the tilt medium, group vs phase index, the model validity range,
   NaN/∞ display and an over-broad citation.
4. After merge: `node scripts/post-merge-check.mjs <sha> "fiber-optics/<slug>=<default>" …`. Read the defaults from the
   built HTML first: `.next/server/app/fiber-optics/<slug>.html`, strip tags, grep the card label.

## Non-obvious facts
- **SMF-28 index:** 1.4682 is its *group* index (delay, OTDR, gyro). Fresnel, V and n_eff need the phase index ≈ 1.447.
  About 20 fibre pages mix them (ROADMAP open finding).
- **Standards values:** IEC 61753-1 connector grades come from Kolesar, IEEE 802.3bm (2013), slide 6 (a PDF on
  grouper.ieee.org: `curl` + `pdftotext`). IEEE 802.3 ad-hoc slides are a good open source for paywalled standard tables.
- **Audit procedure (part 0):** four `physics-reviewer` batches in parallel, grouped by topic (≈ 12 pages each), ≤ 12
  lines per page. Spot-check a few bug claims against the code before writing `knownIssue`s (40–240 chars, full stop).
- **Registry edits** on one file go through a scratchpad `.cjs` script with a dry run and anchor checks
  (`slug: "<x>",` → entry ends at the next `\n  },`). Make it re-runnable: strip an existing `tier:` block first.
- **eslint** reports ≈ 916 pre-existing warnings. `check` passes; don't chase them outside the pages being fixed.
- **Connectors:** claude.ai connectors are switched per project in `~/.claude.json`
  (`projects["C:/dev/photonics-calculators"].disabledMcpServers`). Vercel is on; the other 10 are off.
- **Polarization conventions:** Goldstein/Collett signs, +θ counter-clockwise looking into the beam. Fibre pages that
  rotate Stokes vectors (e.g. `polarization-controller`) must chain `mueller.ts` `muellerRetarder`.
- **Sources:**
  - Crossref chapter DOIs: Goldstein 3rd ed. `10.1201/b10436-n`; Shurcliff 1962 `10.4159/harvard.9780674424135.cN`;
    Macleod 4th ed. `10.1201/9781420073034-cN`; Agrawal FOCS 4th ed. `10.1002/9780470918524`; Born & Wolf 7th ed.
    `10.1017/CBO9781139644181`.
  - Jacobi–Anger is DLMF 10.12.2 (https://dlmf.nist.gov/10.12).
  - WebFetch returns PDFs as binary: save the file with `curl` and run `pdftotext -layout` on it.
- **Independent checks that worked:** a brute-force numerical overlap integral checks the closed-form Gaussian
  coupling, and a coherent multi-pass beam sum checks the Airy × η gap model. Prefer a second model over re-typing the
  same formula.
- **Mutation checks need a transcription test:** independent data sets agree only to about 1e-4.
- **React Compiler lint:** `useMemo` deps that are results of plain function calls can trip
  `preserve-manual-memoization`. Build the objects inside the memo from primitive deps.
- **Deleted pages or modules break `tsc`** through a stale `.next/types/validator.ts`: `rm -rf .next/types`, then
  `npm run check`.
- **Line endings:** some files are CRLF. Node edit scripts must `.replace(/\r\n/g, "\n")` before matching anchors.
- **Shell:**
  - Edit scripts go in scratchpad `.cjs` files; run them with `< /dev/null`. `node -e "…"` mangles backslashes and
    quotes, and a bare `cat > file` with no heredoc waits on stdin forever.
  - Write `.tsx` pages with the Write tool: a Git Bash heredoc of a long TSX file failed to parse.
  - `python -` with no stdin hangs.
  - In Git Bash a `/a/b` argument becomes `C:/Program Files/Git/a/b`. Use `MSYS_NO_PATHCONV=1`.
  - A quick physics probe: copy the `.ts` file under `src/` so imports resolve, run `npx tsx`, then delete it.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a /b`. It can't hydrate-check a
  page with no `<input>`. Never run `taskkill /IM chrome.exe`.
- **Dev/prod server:** port 3100 (`npx next start -p 3100` after a build). `TaskStop` leaves the `node` child on the
  port: `netstat -ano | grep :3100`, then `taskkill //PID <pid> //T //F`. Restore `next-env.d.ts` after a dev run.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min, CI ≈ 2–3 min. Background them; don't edit `.ts`
  files while `check` runs.
- **`useURLState` doesn't clamp:** clamp in the page. It also takes string defaults (used for select keys).
- **Plotly can't draw Infinity:** map non-finite values to `null` before passing them to `ChartPanel`.
- **`SimpleChart`:** no `shapes` (use a `mode: "markers"` trace); skips NaN and values ≤ 0 on log axes; legend text is
  literal (use ₛ, ₚ, ₜ).
