# Handover — 2026-10-12 (session 45 → session 46)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 45 shipped **fiber-optics fix part 2** (PR #47, merged as `18536858`; production check passed). **Next: fix part
3**: new `fiber-nonlinear.ts` for `sbs-threshold`, `nonlinear-effects` and [`srs-threshold`].

## State
- 151 of 461 pages are tiered, 28 `knownIssue`s (all fiber-optics), 480 tests pass.
- New `src/physics/fiber-optics/chromatic-dispersion.ts`:
  - D(λ): `sellmeierDispersion`/`sellmeierSlope`/`sellmeierAt` (G.652 form), `linearDispersion`, `presetDispersion`;
    conversions `beta2FromD`, `dFromBeta2`, `beta3FromDS`, `sigmaOmegaFromLambda`, `dispersionLength`.
  - Pulses: `gaussianPulseRmsWidth` (σ₀, β₂, β₃, σ_ω, chirp), `optimumOutputRmsWidth`, `transformLimitedBitRate`.
  - Channels: `channelAt({D,S}, λ, σλ, extraRmsPerM)`, `channelRmsWidth`, `dispersionLimitedLength(ch, B)`.
  - Also `gaussianBandwidth`/`gaussianRmsFromBandwidth`, `groupDelay`, `loopFsr`.
  - Presets: `FIBER_PRESETS` (G652, DSF, NZDSF±, DCF) and `SELLMEIER_FIBERS` (SMF, OM1–OM4 with modal BW).
  - Reuse it wherever β₂ or D(λ) appears (nonlinear pages: FWM phase matching, L_D vs L_NL; soliton pages).
- Other fiber modules: `gaussian-coupling.ts`, `dispersion-comp.ts` (`rmsBroadening`), `macro-bending-loss.ts`,
  `polarization-mode-dispersion.ts` (`meanDgd`, `pmdLimitedLength`, `MEAN_DGD_BIT_FRACTION`).
- Per-page reviewer evidence for parts 3–11 is in the PR #43 description: `gh pr view 43 --json body -q .body`.
- `polarizer-types` is blocked until the user is at the laptop with Chrome and the Claude extension connected.

## Next actions
1. Fix part 3, `fiber-nonlinear.ts`:
   - L_eff = (1 − e^(−αL))/α, finite (→ L) at α = 0; γ = 2πn₂/(λA_eff).
   - Smith SBS threshold P = 21·K·A_eff/(g_B·L_eff) with the polarization factor K and a linear linewidth factor.
     Golden: A 80 µm², g_B 5e-11 m/W, 10 km, 0.2 dB/km → 4.193 mW co-polarized.
   - SRS → 1.5973 W; Inoue FWM efficiency (use `beta2FromD` for Δβ).
2. Each fixed page: remove its `knownIssue`, set tier, `modelNote` (≤ 220 chars), references (check DOIs with
   `scripts/crossref.mjs`). Citations must not end in a space (the trust-data test checks it).
3. Run one `physics-reviewer` pass **before** the PR. In session 45 it caught broad-source-only limits, a 1e16× ratio at
   λ₀, a weak β₃ test, out-of-band ranges and an over-broad citation.
4. After merge: `node scripts/post-merge-check.mjs <sha> "fiber-optics/<slug>=<default>" …`, with the defaults read from
   `.next/server/app/fiber-optics/<slug>.html` (strip tags, grep the card label).

## Non-obvious facts
- **Bit-rate limits:** never use only the broad-source 4Bσ_D ≤ 1. For narrow sources the output width is set by the
  input pulse, so minimise over σ₀ (`optimumOutputRmsWidth`): σ² = σ_D² + |β₂|L; at λ₀, B(|β₃|L)^⅓ ≤ 0.324.
- **Spectral width:** the pages now take **rms** σ_λ. A 10G VCSEL is ≈ 0.45 nm rms; MMF modal bandwidth is rated at
  850 nm (ISO/IEC 11801-1). The 10G reach comes out at OM3 237 m, OM4 402 m (IEEE 300 / 400 m from its own link model).
- **Thermal delay:** SMF-28 is 37.4 ps/(km·K) measured (Slavík 2015, doi:10.1038/srep15447), ≈ 7.6 ppm/K.
- **calculator-pages test:** the JSON-LD base-graph fixture is `chromatic-dispersion` with `references: undefined`. If you
  change that fixture, keep the override.
- **SMF-28 index:** 1.4682 is its *group* index (delay, OTDR, gyro). Fresnel, V and n_eff need the phase index ≈ 1.447.
  About 20 fibre pages mix them (ROADMAP open finding).
- **Standards values:** IEEE 802.3 ad-hoc slides on grouper.ieee.org are a good open source for paywalled standard
  tables (`curl` + `pdftotext`). Fibre datasheets (Prysmian, Corning) give λ₀/S₀ bounds.
- **Registry edits** on one file go through a scratchpad `.cjs` script with a dry run and anchor checks
  (`slug: "<x>",` → entry ends at the next `\n  },`). Make it re-runnable: strip an existing `tier:` block first.
  Session 45's `registry-fix2.cjs` is a template.
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
