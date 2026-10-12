# Handover — 2026-10-12 (session 46 → session 47)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 46 shipped **fiber-optics fix part 3** (PR #49, merged as `21357ac3`). **Production deploy of 21357ac3 failed
on Vercel with `git_info_fail`** (no build ran; the branch preview of the same tree was READY). Check that the merge of
this handover PR deployed it (step 1). **Next: fix part 4**, `fiber-bragg-grating.ts`.

## State
- 154 of 461 pages are tiered, 26 `knownIssue`s (all fiber-optics), 488 tests pass.
- New `src/physics/fiber-optics/fiber-nonlinear.ts`:
  - `alphaFromDbPerKm`, `effectiveLength` (expm1, = L at α = 0), `nonlinearCoefficient` γ, `nonlinearPhase`,
    `xpmPhaseMax`, `spmRmsBroadening` √(1 + 4φ²/(3√3)).
  - `sbsThreshold({Aeff, gB, Leff, K, sourceLinewidth, brillouinLinewidth})`, `sbsLinewidthFactor`, `srsThreshold`,
    `SBS_POLARIZATION_FACTOR` (1 / 1.5 / 2), `SRS_POLARIZATION_FACTOR` (1 / 2), `ramanGainAt` (1e-13·1 µm/λ),
    `ramanOnOffGain`, `brillouinShift`, `stokesWavelength`.
  - FWM: `fwmPhaseMismatch(β₂, Δf_ik, Δf_jk, β₃)`, `fwmEfficiency` (Inoue), `fwmProductRatio(η, φ, degenerate)`.
  - `SILICA_N2`, `SILICA_BRILLOUIN_GAIN`, `SILICA_RAMAN_GAIN_1UM`, `SILICA_RAMAN_SHIFT`: reuse instead of inline values.
- Other fiber modules: `chromatic-dispersion.ts` (D(λ), β₂/β₃, pulses, channels, presets), `gaussian-coupling.ts`,
  `dispersion-comp.ts`, `macro-bending-loss.ts` (`DB_PER_NEPER`), `polarization-mode-dispersion.ts`.
- Per-page reviewer evidence for parts 4–11 is in the PR #43 description: `gh pr view 43 --json body -q .body`.
- `polarizer-types` is blocked until the user is at the laptop with Chrome and the Claude extension connected.

## Next actions
1. Production: `node scripts/post-merge-check.mjs <sha> "fiber-optics/sbs-threshold=6.469 mW"
   "fiber-optics/srs-threshold=2.457 W" "fiber-optics/nonlinear-effects=1.317"` on the latest `main` sha. If Vercel
   again posts no status, list deployments with the Vercel MCP; a production redeploy needs the user (auto mode blocks it).
2. Fix part 4, `fiber-bragg-grating.ts` (Erdogan JLT 15 1277, doi:10.1109/50.618322):
   - R = κ² sinh²(γL)/(κ² cosh²(γL) − σ̂²), γ² = κ² − σ̂² (imaginary outside the band). Golden: Δn 1e-4, L 10 mm,
     n 1.468, 1550 nm → R₀ 0.93291, R(σ̂ = κ) 0.8043, first-zero width 0.19476 nm, FWHM 0.1478 nm.
   - `fiber-bragg-grating-sensor`: invented bandwidth; Λ 535 nm → λ_B 1570.76 nm, first zero 0.19924 nm (Kersey JLT 15
     1442, doi:10.1109/50.618377).
   - `fiber-optic-sensor`: MZI rad/µε ×1e-6 twice (0.04642 rad/µε at 10 mm); water dn/dT ≈ −1e-4/K (Thormählen JPCRD
     14 933, doi:10.1063/1.555743); FBG 1.209 pm/µε, 11.19 pm/K.
3. Each fixed page: remove its `knownIssue`, set tier, `modelNote` (≤ 220 chars), references (`scripts/crossref.mjs`).
4. One `physics-reviewer` pass before the PR. In session 46 it caught β₃ missing from FWM (η = 1 at D = 0) and an
   unsourced K = 2; it also flagged sibling bugs, now in ROADMAP open findings.

## Non-obvious facts
- **Smith thresholds** (16 SRS, 21 SBS) are co-polarized. g_R ≈ 1e-13 m/W is for a 1 µm pump; at 1550 nm ≈ 6.5e-14.
- **Vercel `git_info_fail`:** a production deploy can fail before building with no logs and no GitHub status;
  `post-merge-check` then exits after "pending". `get_deployment` shows the `errorCode`.
- **Bit-rate limits:** never use only the broad-source 4Bσ_D ≤ 1. For narrow sources the output width is set by the
  input pulse, so minimise over σ₀ (`optimumOutputRmsWidth`): σ² = σ_D² + |β₂|L; at λ₀, B(|β₃|L)^⅓ ≤ 0.324.
- **calculator-pages test:** the JSON-LD base-graph fixture is `chromatic-dispersion` with `references: undefined`. If you
  change that fixture, keep the override.
- **SMF-28 index:** 1.4682 is its *group* index (delay, OTDR, gyro). Fresnel, V and n_eff need the phase index ≈ 1.447.
  About 20 fibre pages mix them (ROADMAP open finding).
- **Standards values:** IEEE 802.3 ad-hoc slides on grouper.ieee.org are a good open source for paywalled standard
  tables (`curl` + `pdftotext`). Fibre datasheets (Prysmian, Corning) give λ₀/S₀ bounds.
- **Registry edits** on one file go through a scratchpad `.cjs` script with a dry run and anchor checks
  (`slug: "<x>",` → entry ends at the next `\n  },`). Make it re-runnable: strip an existing `tier:` block first.
  Session 46's `registry-fix3.cjs` (scratchpad) also rewrote `description`.
- **eslint** reports ≈ 900 pre-existing warnings. `check` passes; lint only the changed files.
- **Connectors:** claude.ai connectors are switched per project in `~/.claude.json`
  (`projects["C:/dev/photonics-calculators"].disabledMcpServers`). Vercel is on; the other 10 are off.
- **Polarization conventions:** Goldstein/Collett signs, +θ counter-clockwise looking into the beam. Fibre pages that
  rotate Stokes vectors (e.g. `polarization-controller`) must chain `mueller.ts` `muellerRetarder`.
- **Sources:** Agrawal FOCS 4th ed. `10.1002/9780470918524`; Marcuse 1980 `10.1364/AO.19.001653`; Goldstein 3rd ed.
  `10.1201/b10436-n`; Born & Wolf 7th ed. `10.1017/CBO9781139644181`. WebFetch returns PDFs as binary: `curl` +
  `pdftotext -layout`.
- **Independent checks that worked:** a brute-force overlap integral (coupling), a coherent multi-pass sum (Airy gap),
  a spectral-mixture integral (partially coherent β₂ + β₃). Prefer a second model over re-typing the formula, and
  mutate the code once to prove the test bites.
- **React Compiler lint:** build memo objects from primitive deps (`preserve-manual-memoization`).
- **Deleted pages or modules break `tsc`** through a stale `.next/types/validator.ts`: `rm -rf .next/types`.
- **Line endings:** some files are CRLF. Node edit scripts must `.replace(/\r\n/g, "\n")` before matching anchors.
- **Shell:**
  - Edit scripts go in scratchpad `.cjs` files; run them with `< /dev/null`. Write `.tsx` pages with the Write tool.
  - Physics probe: a scratchpad `.ts` importing `"C:/dev/photonics-calculators/src/…"` (absolute path) runs with `npx tsx`.
  - `python -` with no stdin hangs. In Git Bash a `/a/b` argument becomes `C:/Program Files/Git/a/b`
    (`MSYS_NO_PATHCONV=1`).
  - Wait on a background log with `Monitor` + an `until grep -q "^exit "` loop (foreground `sleep` is blocked).
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a /b`. Never run
  `taskkill /IM chrome.exe`. `TaskStop` leaves `node` on port 3100: `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`.
- **Timings:** `check` ≈ 6 min, `build` ≈ 6–10 min, CI ≈ 2 min. Background them; don't edit `.ts` files while `check` runs.
- **`useURLState` doesn't clamp:** clamp in the page. String defaults work for select keys.
- **Plotly can't draw Infinity:** map non-finite values to `null`. **`SimpleChart`:** no `shapes`; skips values ≤ 0
  on log axes.
