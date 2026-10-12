# Handover — 2026-10-12 (session 47 → session 48)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 47 shipped **fiber-optics fix part 4** (PR #51, merged as `98a6f87d`; production checked). **Next: fix part 5**,
`sagnac.ts` (`polarizer-types` stays blocked until the user is at the laptop with Chrome and the extension connected).

## State
- 157 of 461 pages are tiered, 23 `knownIssue`s (all fiber-optics), 499 tests pass.
- New `src/physics/fiber-optics/fiber-bragg-grating.ts`:
  - `braggWavelength`, `couplingCoefficient` (πΔn/λ), `detuning`, `uniformReflectance(κL, σ̂L)`, `peakReflectance`,
    `uniformGratingReflectance(g, λ)`, `firstZeroBandwidth`, `uniformFwhm`.
  - `gratingSections(profile)` (uniform / Gaussian / raised-cosine apodization, linear chirp ≤ `maxChirp` = 0.1λ_B/L),
    `defaultSectionCount`, `transferMatrixReflectance(sections, nEff, λ)` (Erdogan F-matrices, overflow-safe),
    `spectrumFwhm`, `chirpedBandwidth`, `chirpedGratingDispersion` (Ouellette).
  - Sensors: `FIBER_P11/P12`, `SILICA_POISSON`, `SMF28_THERMAL_COEFFICIENT` (6.165e-6/K, Cosme 2026),
    `effectivePhotoelastic`, `strainGaugeFactor` (1 − p_e = 0.7973 at n 1.447), `braggShift`, `phaseStrainSensitivity`,
    `phaseTemperatureSensitivity`.
- New `fiber-sensors.ts`: `freeSpectralRange`, `cavityReflectance` (Airy, reuses thin-film `coefficientOfFinesse`),
  `evanescentDecay`, `penetrationDepth`, `penetrationDepthSensitivity`, `WATER_DN_DT` −1e-4, `WATER_INDEX_1550` 1.318.
- Other fiber modules: `fiber-nonlinear.ts`, `chromatic-dispersion.ts`, `gaussian-coupling.ts`, `dispersion-comp.ts`,
  `macro-bending-loss.ts` (`DB_PER_NEPER`), `polarization-mode-dispersion.ts`.
- Per-page reviewer evidence for parts 5–11 is in the PR #43 description: `gh pr view 43 --json body -q .body`.

## Next actions
1. Fix part 5, `sagnac.ts` (see the ROADMAP box for golden values):
   - `fiber-gyroscope`: Sagnac scale factor S = 2πLD/(λc) → 0.67608 s, ARW 3.636e-5 °/√h. L·D uses the loop
     geometry; group index matters only for the transit time / eigenfrequency (1.4682 there, not 1.447).
   - `fiber-loop-mirror`: R = 4k(1 − k), T = (1 − 2k)² for a lossless coupler (find and crossref a source).
   - `fiber-bundle` (37 × 125 µm → Ø 0.875 mm, core fill 0.1888) and `pump-combiner` (étendue conservation).
2. Each fixed page: remove its `knownIssue`, set tier, `modelNote` (≤ 220 chars), references (`scripts/crossref.mjs`).
3. One `physics-reviewer` pass before the PR. In session 47 it found 7 edge-of-range problems (chirp to negative λ,
   too few sections, overflow at large κL, unbounded ΔT); expect that class of finding.

## Leftovers from part 4 (not done, low priority)
- FBG group delay output: the RK4 cross-check lights the other end, so a delay plot would need the sections reversed.
- EFPI: the real gap strain is ε·L_gauge/d; the page states it but takes ε as the gap strain.
- K_T 6.165e-6/K was measured on UV-exposed SMF-28; hydrogen-loaded or other fibres differ by ~10 %.

## Non-obvious facts
- **SMF-28 index:** 1.4682 is its *group* index (delay, OTDR, gyro transit). Bragg λ, Fresnel, V and n_eff need the
  phase index ≈ 1.447. Many fibre pages still mix them (ROADMAP open finding).
- **Vercel status:** GitHub often gets no commit status for production deploys, so `post-merge-check` waits on
  "pending" (up to 20 min) and prints nothing until done. Check with Vercel MCP `list_deployments` (project
  `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`, filter `sha`) and `curl` the live page.
  A `git_info_fail` deploy has no logs; a production redeploy needs the user (auto mode blocks it).
- **Smith thresholds** (16 SRS, 21 SBS) are co-polarized. g_R ≈ 1e-13 m/W is for a 1 µm pump; at 1550 nm ≈ 6.5e-14.
- **Bit-rate limits:** for narrow sources minimise over σ₀ (`optimumOutputRmsWidth`), not the broad-source 4Bσ_D ≤ 1.
- **calculator-pages test:** the JSON-LD fixture is `chromatic-dispersion` with `references: undefined`; keep it.
- **Registry edits** on one file go through a scratchpad `.cjs` script with a dry run and anchor checks
  (`slug: "<x>",` → entry ends at the next `\n  },`). Strip an existing `tier:` block first so it re-runs. Session 47's
  `registry-fix4.cjs` wrote `url: undefined` for a book reference: build the reference object without empty keys.
- **Independent checks that worked:** an RK4 integration of the coupled-mode equations (FBG TMM, 1e-9 uniform), the
  Landau–Zener limit for strong chirp, a coherent multi-pass sum (Airy), brute-force overlap integrals. Mutate the
  code once to prove the test bites.
- **eslint** reports ≈ 870 pre-existing warnings. `check` passes; lint only the changed files.
- **Connectors:** per project in `~/.claude.json` (`disabledMcpServers`). Vercel is on; the other 10 are off.
- **Polarization conventions:** Goldstein/Collett signs. Fibre pages that rotate Stokes vectors must chain
  `mueller.ts` `muellerRetarder`.
- **Sources:** Agrawal FOCS 4th ed. `10.1002/9780470918524`; Erdogan `10.1109/50.618322`; Kersey `10.1109/50.618377`;
  Born & Wolf 7th ed. `10.1017/CBO9781139644181`. WebFetch returns PDFs as binary: `curl` + `pdftotext -layout`.
- **React Compiler lint:** build memo objects from primitive deps (`preserve-manual-memoization`).
- **Deleted pages or modules break `tsc`** through a stale `.next/types/validator.ts`: `rm -rf .next/types`.
- **Line endings:** some files are CRLF. Node edit scripts must `.replace(/\r\n/g, "\n")` before matching anchors.
- **Shell:**
  - Edit scripts go in scratchpad `.cjs` files (`mkdir -p` the scratchpad first); run them with `< /dev/null`.
    Write `.tsx` pages with the Write tool.
  - Physics probe: a scratchpad `.ts` importing `"C:/dev/photonics-calculators/src/…"` runs with `npx tsx`.
  - `python -` with no stdin hangs. In Git Bash a `/a/b` argument becomes `C:/Program Files/Git/a/b`
    (`MSYS_NO_PATHCONV=1`).
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a /b`. Never run
  `taskkill /IM chrome.exe`. `TaskStop` leaves `node` on port 3100: `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`.
- **Timings:** `check` ≈ 6 min, `build` ≈ 6–10 min, CI ≈ 3 min. Background them; don't edit `.ts` while `check` runs.
- **`useURLState` doesn't clamp:** clamp in the page. **Plotly can't draw Infinity:** map to `null`.
