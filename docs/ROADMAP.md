# Roadmap — photonics-calculators

Open work only, in order. The history is in `docs/archive/roadmap-history.md`: the 2026-10-07 review, every finding's
evidence and the logs of sessions 1–40. Don't read it at session start (≈ 50k tokens). `grep -n "<slug>"` it when a task
needs old evidence. When a stage is done, tick it here with one line (session, branch, PR, headline numbers). The detail
goes in the PR description.

## Status (session 74, 2026-10-15)
- Phases 0–1 are done.
- Phase 2: the registry, trust data and the duplicate merge are done. The physics modules grow with each Phase 4 stage.
- Phase 3 hasn't started. Phase 4 is ongoing.

Model tiers: `npx tsx scripts/tier-status.ts` (add `<category>` to list its untiered pages).

| Category | Tiered | Notes |
|---|---|---|
| laser-safety | 40 / 40 | done (sessions 18, 23, 29–36) |
| thin-film | 45 / 45 | done (sessions 25–28, 54–55); small findings below |
| polarization | 32 / 33 | parts 1–4 done (sessions 37–42); `polarizer-types` left |
| imaging | 9 / 65 | findings fixed (sessions 19, 22); no full audit |
| free-space-comms | 26 / 26 | done: part 0 audit (session 56), fix parts 1–6 (sessions 57–62); open findings below |
| spectroscopy | 5 / 54 | findings fixed (sessions 19–21); no full audit |
| fiber-optics | 47 / 47 | done: part 0 (session 43), fix parts 1–11 (sessions 44–53); open findings below |
| materials | 4 / 45 | Sellmeier sets fixed (session 20), `semiconductor-bandgap` (68); no full audit |
| wave-optics | 2 / 49 | OPO (19), Gires-Tournois (14) fixed; no full audit |
| detectors | 43 / 54 | part 0 audit (session 63), parts 1–7b (sessions 64–74); 5 `knownIssue`s left; fix parts 8–9 below |
| **total** | **253 / 458** | 5 `knownIssue`s (detectors) |

## Next (Phase 4, in order)
- [ ] `polarizer-types`: sourced specs. **Blocked until the user is at the laptop with Chrome open** (session 43:
  extension not connected). The Thorlabs, Edmund and Newport spec pages are JS-rendered or return 403 to WebFetch and
  curl. Also clear the eslint warning there (unused `wavelength` state).
- [ ] **Detectors part 8: EM and camera SNR** (new `camera-snr.ts`: Robbins & Hadwen F² = 2(G−1)G^{−(N+1)/N} + 1/G,
  `cameraSnr`, `dynamicRangeDb`): `ccd-vs-cmos` (EMCCD DR from the register well; photons × QE; saturation),
  `em-gain` (no argmax; F²(100, 604) = 1.9750), `electron-multiplying` (2.236 vs 2.857 at defaults), `well-capacity`
  (5.341 fF, 80.00 dB), `saturation` (S(1 − nl·S/FWC); DR 72.04, SNR 43.00 dB).
- [ ] **Detectors part 9: sensor noise and MTF** (new `sensor-noise.ts` with PRNU/DSNU, `sensor-mtf.ts`):
  `photon-transfer` (PRNU regime; 223.83 e⁻), `uniformity` (547.84 e⁻; heatmap RMS), `antiblooming` (illustrative;
  cap leaked charge), `modulation-transfer` (2/π at f_N; rename "diffusion length"), `pixel-crosstalk` (Seib 1974
  field-free diffusion, 3-tap MTF 0.5730 at X = 0.05), `cosmic-rays` (thickness input, L = t/cosθ; O(μ²) loop; PDG 2024).
- [ ] **Next category audit (ask the user which):** wave-optics 2/49, materials 3/45, spectroscopy 5/54 or imaging 9/65.
  Part 0 = `physics-reviewer` batches → `knownIssue`s + fix parts, as for FSO (session 56) and detectors (session 63).
- [ ] Golden-value tests for the top 50 calculators by traffic (needs traffic data, e.g. Vercel Analytics).
- [ ] Rewrite each heuristic model, or label it illustrative, during its category's audit. Macro-bend and
  second-harmonic are done.

## Open findings (evidence; fix during that category's audit)
**Fiber optics**
- `photonic-crystal`: confinement loss isn't modelled (it needs the ring count N); an empirical fit could add it. The Saitoh–Koshiba fit is ≈ 20 % off the multipole D for Λ ≤ 1 µm.
- `multi-core`: crosstalk papers often use an equivalent bend radius R_eq ≈ 1.28 R_b (photoelastic effect, ≈ +1.1 dB); the
  reviewer was unsure and the page uses R_b as given. Check Koshiba 2012 / Hayashi 2011 text, then add it or drop this note.
- `bend-insensitive` (`g657.ts`): the physics review recalls a G.657.A3 category (2016) that shares the B3 limits. Unverified
  because the ITU PDF is blocked to scripts; check the ITU text in Chrome, then add A3 or drop the note.
**Free-space comms**
- `diversity-reception`: for N ≥ 3 the Fenton–Wilkinson margin is 0.07–0.41 dB high at σ_I² ≤ 0.5 and ≈ 1–1.2 dB at σ_I² = 1, and MRC is capped at
  EGC (exact MRC 0.1–0.2 dB lower); the exact N = 3 nested integral (in the tests) is too slow for the chart (~40 ms per threshold).
- `aperture-averaging`: only the Gaussian aperture is modelled; a hard circular aperture gives a 5–11 % lower A at d² = 1–30 (reviewer quadrature, unchecked).
**Thin film**
- `sputtering-deposition` (low): no gas scattering (defaults sit at d ≈ 5.7 λ_Ar, rate is an upper bound); Westwood
  thermalisation could add it. Cr and Nb dropped: no sourced 500 eV Ar⁺ yield (M&G 600 eV: 1.3, 0.65).
- `plasma-deposition` (low): h-factors are low-pressure only (flagged, chart cut); L&L's high-pressure diffusion term
  would extend it. The Table 3.3 fits' T_e range is unchecked (solve allows 0.5–30 eV).
- `ellipsometry-measurement` (optional): a film thickness needs a film model, e.g. a known film index and Azzam &
  Bashara's transparent-film inversion.
- `thermal-evaporation` (low): T_m for Ni, Ti and Pd is 1726, 1930 and 1825 K against CRC's 1728, 1941 and 1828 K
  (unchecked against Alcock's table).

**Wave optics**
- `filamentation`: Marburger's z_sf gives a finite collapse distance for P < P_cr.
- `four-wave-mixing`: β₂ is fixed at 20 ps²/km and n₀ at 1.45 in χ³. Reuse `fiber-nonlinear.ts` (Inoue η, Δβ with β₃).
- `self-phase-modulation`: rms broadening uses √(1 + (4 ln2/π)φ²); for an unchirped Gaussian it is √(1 + 4φ²/(3√3)) (`spmRmsBroadening`).
- `dye-laser-resonator`: k_ISC = (1 − Φ_f)/τ counts all non-radiative decay as ISC.
- `mode-matching`: the η conjugate sign was fixed in Phase 0 (0.64 for a 2× waist mismatch). It still needs a module
  and a golden test. The single-lens search misses the exact solution: 1550 nm, w 50 → 200 µm over 1000 mm has
  s ≈ 200.769 mm, f ≈ 160.872 mm, but the page reports 0.033 % and 0.053 % overlaps (Codex review, 2026-10-13). The
  brute-force search also runs during render; solve it in closed form (Kogelnik & Li) in the module.
- `abcd-matrix`: shared links drop the element list (it is in `useState`; only the input ray is in the URL), and the
  per-element controls have no `<label>` or `aria-label` (Codex review, 2026-10-13).

**Free-space comms**
- `snow-attenuation` (low): the sources never define S (read as water-equivalent), and the 2005 ICTON origin of the law
  is unverified (joanneum PDF is an HTML wall). Check Awan et al. WOCN 2009 / ICTON 2005 in Chrome; tier could drop to illustrative.
- `bpsk-qpsk`: "Required RX power" uses the RF floor kT = −174 dBm/Hz + 3 dB NF. Coherent optical detection is
  shot-noise limited at hν ≈ −159 dBm/Hz (1550 nm).
- `ber` and `bpsk-qpsk` plot log₁₀(BER) on a linear axis. Switch them back to log axes; the floor is gone.
- `diversity-reception`: a fixed "3σ" outage, and identical gain for SC, EGC and MRC.
- `geometric-loss` (low): the top-hat law (d_t + θR) is cited to Kim & Korevaar, SPIE 4530, 84 (2001) by DOI only; full text
  unread. Confirm in Chrome, or cite Ghassemlooy et al., Optical Wireless Communications (CRC 2019, doi:10.1201/9781315151724).
- `background-noise`, `receiver-fov` (low): sky radiances are Giggenbach 2022 Table 1 typical values (×10 spread), 850–1550 nm only, log-log across the 1.13/1.38 µm water bands; no night sky or Moon (his Moon row is ≈ 10× E_sun·albedo/π at 850/1064 nm). A sourced sky model (MODTRAN tables, ITU-R P.1621) would extend it.
- `receiver-fov` (low): field-stop clipping of the signal and turbulence spot growth (λ/r₀) are not modelled; only a 1.22λ/D warning.
- `channel-capacity` (low): the 3.8×10⁻³ pre-FEC default for 7 % HD-FEC is not checked against the ITU-T G.975.1 text (input, labelled typical).
- `acquisition-tracking` (low): Tyler & Fried NEA (3π/16)(λ/D)/SNR read from the JOSA 72, 804 abstract only; "rms per axis" is unconfirmed in the full text.
- `quantum-key-distribution` (low): asymptotic decoy BB84 only (no finite-key or intensity fluctuations); Y₀ capped at 0.01 because eq. (10) drops −Y₀(1 − e^(−ημ)).
- `point-ahead` (low): the LEO preset uses orbital velocity alone (as the cited chapter does); station rotation lowers it by ≈ 3 µrad.
- `optical-antenna` (low): M² is capped at 2 (θ × M², gain / M⁴). A Gaussian Schell-model far field would cover multimode beams.

**Fiber optics** (part 0, session 43; per-page evidence in PR #43)
- `birefringence-fiber` cites Sakai & Kimura 1981 for G(V) (Optiwave attributes it there); the reviewer couldn't confirm the equation in that paper. The formula itself is checked by perturbation (session 49). Confirm the page/equation when a copy is at hand.
- The SMF core is redefined on six pages (a 4.1/4.5 µm, NA 0.12/0.1246/0.14). Use a = 4.1 µm, NA 0.1246 → MFD 10.08 µm.
- D(1550) for SMF is 13.4/17/17.46/22.1 on different pages. Use G.652 S₀/4(λ−λ₀⁴/λ³), S₀ 0.092, λ₀ 1310 → 17.46.
- `macro-bending-loss.ts` `MIN_V = 0.5` lets the Marcuse fit run far below its 1.2–2.4 range.
- Silica n₂, g_B, g_R are now `SILICA_*` in `fiber-nonlinear.ts`; other pages still inline them.
- `v-number` (minor): it shows floor(V²/2) modes for V < 2.405; literal "&lt;" in the text.
- 1.4682 is SMF-28's group index (fine for delay, OTDR, gyro); ≈ 20 pages also use it as the phase index (Fresnel, V, n_eff). Use ≈ 1.447.
- Out of scope: `materials/brillouin-scattering` P_th = 21·1e-3/(g_B·L): 1e-3 in place of A_eff, L in place of L_eff (use `sbsThreshold`); `wave-optics/fiber-laser-resonator` may
  overlap `fiber-laser`; `fiber-coupler` vs `wave-optics/coupled-mode` unchecked.

**Imaging / spectroscopy** (found in the detectors part 0, session 63)
- `imaging/dynamic-range`: `prnu` defaults to 0.01 on an input labelled "%" (0.01 %); probably meant 1 %.
- `spectroscopy/absorption-depth`: Si at 550 nm gives 12.8 µm; Green 2008 gives 1.56 µm. Use `silicon-absorption.ts`.
- `detectors/pixel-crosstalk`: its own silicon absorption; switch to `materials/silicon-absorption.ts` (noted in part 4c).
- Detectors part 7b leftovers (session 74 review): `streak-camera` window ignores the usable screen length and reads one pixel (not 2, Nyquist); `intensified-ccd` puts each electron's light in one pixel (no spot spread); `vacuum-photodiode` has one φ for threshold and dark emission and no stray capacitance.
- `detectors/gain-temperature` PMT branch: the −0.3 %/°C default is an entered value; source a typical dynode-gain coefficient in part 7 (Hamamatsu handbook §13.1.1 gives no number).
**Materials**
- `birefringent-crystals` lists the fused-silica Malitson set as quartz.
- `crystal-birefringence` has rutile at 2.454/2.493. Use `materials/uniaxial-data.ts`.

**Polarization**
- `polarization-scrambling` multiplies the stage means, which holds only for incommensurate frequencies. Near-resonant
  stages (q·f_i ≈ p·f_j, p, q ≤ 4) only get a warning: locked 1 kHz stages give 0.5118 in the product but 0.8848 averaged
  in time (`tests/polarization-scrambler.test.ts`). An exact average over the beat period would fix it.

**Laser safety** (optional)
- A scanned-lidar mode on `lidar-safety`.
- Re-check the classes when IEC 60825-1 Ed. 4 is published (only a BSI draft in 2026).

**Cross-cutting**
- `erf` had three implementations. `src/physics/math.ts` replaced five pages' copies; others may remain.
- `useURLState` only rejects non-finite values, so a crafted `?na=0` reaches the physics unclamped. Clamp in the page,
  or give `useURLState` an optional range.
- Search returns unrelated pages for nonsense queries; it needs a relevance floor (Codex review, 2026-10-13).
- `ui-check` can't hydrate a page that has no `<input>` (`optical-glass-catalog`; `jones-calculus` until an element is
  added).

## Phase 2 — architecture (open)
- [ ] Pure SI physics functions in `src/physics/<category>/`, with golden tests. They grow with each Phase 4 stage.
- [ ] Set `preserve-manual-memoization` and `no-explicit-any` back to `error` once the pages are on modules
  (`eslint.config.mjs`).

## Phase 3 — graphics & performance
- [ ] Chart rewrite:
  - Real pixel width instead of a scaled viewBox; labels now render at 4–5 px on phones.
  - Hover crosshair and readout; PNG/CSV export.
  - Open bugs: `SimpleChart` reads `null` as 0, so a break in a line needs separate traces. `SimpleLineChart` prints
    coordinates at full precision, so Node and Chrome can differ by 1 ulp (a hydration error on
    `detectors/quantum-efficiency`). Round to 0.01 px. `SimpleChart` ignores `layout.legend`: it pins the legend to the
    plot's right edge, so names over ≈ 9 characters are clipped and overlap `yaxis2` ticks; `marker.color` of a markers
    trace is replaced by the palette. `otdr-analysis` and `link-budget` use `showlegend: false` plus a caption.
  - Done: ticks (session 26); log axes with no floor, non-finite values dropped (session 34).
- [ ] Plotly:
  - 18 pages use it. `react-plotly.js` imports the full `plotly.js/dist/plotly` (4.8 MB min), and both `plotly.js` and
    `plotly.js-dist-min` are dependencies.
  - Use `react-plotly.js/factory` with a partial bundle, and drop one dependency.
- [ ] Initial JS was 190–240 KB gz per page (2026-10-07).
  - The ~46 KB gz related-links chunk should be gone since stage 2b (the links are server-rendered). Confirm with a
    bundle check.
  - Read URL state before first paint: today the defaults render first, then the URL values (a flash).
- [ ] Vercel Speed Insights and a JS budget in CI.

## Decisions (keep)
- **Polarization:** Goldstein/Collett convention site-wide.
  - e^{i(ωt − kz)}; RCP = [1, i]/√2, and S3 = 2 Im(Ex* Ey) > 0 for RCP.
  - A retarder with its fast axis at 0° is diag(1, e^{−iΓ}). +θ is counter-clockwise looking into the beam.
  - Fresnel: r_p = −r_s at normal incidence, as in `thin-film/ellipsometry.ts`. `transfer-matrix.ts` uses e^{−iωt} and
    r_p = r_s.
  - Each page states its convention in its `modelNote`.
- **Laser safety:**
  - Use ICNIRP 2013 where IEC values can't be verified (the IEC text is paywalled).
  - ANSI tables aren't public, so the site has no ANSI numbers.
- **Trust data:**
  - Untiered pages say "Not yet reviewed".
  - A page with a known error shows a red `knownIssue` box and no tier; the fix removes it.
- **Duplicates:** merged only with the user's yes, via `src/registry/redirects.json` and the merge codemod.
- **Git:** `main` changes only through a PR, and merges need the user's yes.

## Done (one line each; detail in the archive and the PR descriptions)
  - Detectors part 7b photoemission (session 74, PR #105): new `detectors/photoemission.ts` (Richardson A₀ from constants, Ramo f_tr = 0.5533/τ, Child, phosphor η·qV/E_ph = 329.7 at 5 kV, cascade F = F_MCP + 1/G_e, rect⊗rect⊗Gauss FWHM) + 4 tests; `intensified-ccd` SNR 1.3163, `vacuum-photodiode` −18.7 dB with load Johnson noise, `streak-camera` 7.500 ps (exact convolution; quadrature 7.870); 3 pages tiered.
  - Detectors part 7a electron multipliers (session 73, PR #103): new `detectors/electron-multiplier.ts` (Hamamatsu dynode F, Schagen/Wiza channel gain + optimum, 10⁸·d/mm space-charge limit, counting vs analog SNR, pulse resolution with F) + 5 tests; `pmt` F 1.3999985, `microchannel-plate` 1.02e3 per plate, `channel-photomultiplier` rewritten as a single-channel CPM; 3 pages tiered.
  - Detectors part 6b SPAD (session 72, PR #102): new `detectors/spad.ts` (Otte P_t, Arrhenius DCR, V_br(T), trap ∝ ΔV·P_t, dead-time corrected counting SNR checked by Monte Carlo to Rτ = 5) + 6 tests; 3 pages tiered on sourced defaults (S13360 PDE 40.0 %, Korzh NFAD SNR 29.36, SPCM-AQRH SNR 1421.6); old `src/lib/geiger-mode-avalanche.ts` removed.
  - Detectors part 6a dead time + afterpulsing (session 71, PR #101): new `detectors/dead-time.ts` (NP/P rates, loss, R at loss, 1/(eτ) peak, NP Fano 1/(1+Rτ)² checked by Monte Carlo, Σ η·e^{−t_d/τ}) + 5 tests; 3 pages tiered (8.000/7.788 Mcps, P_ap 0.410 %).
  - Detectors part 5 linear APD (session 70, PR #100): new `detectors/apd.ts` (Miller gain + one-point n fit, McIntyre moved from FSO, sourced k table, V_br(T) drift, Personick SNR + closed-form M_opt) + 5 tests; 4 pages tiered (M_opt 208.9, C30662 drift −3.18 %/°C).
  - Detectors part 4c Si vs InGaAs (session 69, PR #99): `si-vs-inge` → `si-vs-ingaas` + redirect, `ingaasPinQe` + InP window edge 916.4 nm, `photodiodeSnr`, `qeRatioSnrGain` + 2 tests; 2 pages tiered, InGaAs back in `quantum-efficiency`; BI SNR 2.84 dB at defaults.
  - Detectors part 4b InGaAs band gap (session 68, PR #97): Vurgaftman 2001 `materials/bandgap.ts`, `detectors/ingaas.ts` (n_i Paul 1991, α fit to Adachi 1989) + 7 tests, 2 pages tiered; E_g(0.53, 300 K) 0.7373 eV, ℛ(1550) 1.023 A/W.
  - Detectors part 4a silicon QE (session 67, PR #95): Green 2008 `materials/silicon-absorption.ts`, Gärtner `photodiode-qe.ts`, `responsivity.ts` + 11 tests, 4 pages tiered; Si PD ℛ(900) 0.18 → 0.563 A/W.
  - Detectors part 3 dark current and signal recovery (session 66, PR #93): Varshni + doubling law in `dark-current.ts`, new `lockin.ts` and `boxcar.ts` + 8 tests, 5 pages tiered; ENBW 1/4τ…5/64τ, optimum gate 1.189·FWHM.
  - Detectors part 2 front end (session 65, PR #91): `photodiode-rc.ts`, `tia.ts`, `dark-current.ts` + 9 tests, 7 pages tiered, `hybrid-detector` → `photodiode-tia-noise`; TIA NEP 3.816e-9 W.
  - Detectors part 1 noise (session 64, PR #89): `detectors/noise.ts` + 7 tests, 8 pages tiered, flicker/temporal fixed; ENOB 2.9607 (exact constants).
  - Detectors part 0 (session 63, PR #87): 54 pages audited, 11 bugs + 21 questionable = 32 `knownIssue`s, 22 OK; fix parts 1–9 (4a/4b); renames and the CPM rewrite agreed.
- Phase 0 (session 8, PR #2): build fixed, CI, `main` protected, PAT revoked, Claude Code set up.
- Phase 1 (PR #3): erfc and BER, URL state and inputs, JSON-LD rebuild, shell, input labels, seeded PRNG.
- Phase 2:
  - Thin-film transfer matrix (by session 12) and constants codemods (sessions 13–14).
  - Registry 2a and 2b (PRs #11–12), duplicates merged (session 17, PR #13), trust data 2c (session 24, PR #21).
- Phase 4:
  - Findings batches (sessions 18–23, PRs #14–20).
  - Thin film parts 1–4 (sessions 25–28, PRs #22–25).
  - Laser safety audit, parts 2–5b and loose ends (sessions 29–36, PRs #26–33).
  - Polarization audit and parts 1–3 (sessions 37–40, PRs #34–37).
  - Polarization part 4 (session 42, PR #40): 8 pages on 9 tested modules (optical activity, CD, spectral
    depolarization, scrambler, CIE colour, interference colours, conoscopy, photoelasticity, microscope extinction);
    456 tests; 0 `knownIssue`s left.
  - Fiber-optics part 0 (session 43, PR #43): 46 pages audited; 3 OK tiered, 9 questionable, 34 `knownIssue`s.
  - Fiber-optics part 1 (session 44, PR #45): `gaussian-coupling.ts`; splice, connector IL/RL, coupling-efficiency tiered; 466 tests.
  - Fiber-optics part 2 (session 45, PR #47): `chromatic-dispersion.ts` (optimum-pulse limits, β₃, modal in quadrature); 5 dispersion pages tiered; 480 tests.
  - Fiber-optics part 3 (session 46, PR #49): `fiber-nonlinear.ts` (Smith ×K, linear linewidth, Inoue FWM); sbs/srs-threshold, nonlinear-effects tiered; 488 tests.
  - Fiber-optics part 4 (session 47, PR #51): `fiber-bragg-grating.ts` (Erdogan uniform, TMM apodized/chirped, strain/thermal) + `fiber-sensors.ts`; 3 FBG/sensor pages tiered; 499 tests.
  - Fiber-optics part 5 (session 48, PR #53): `sagnac.ts` (S 0.67608 s; ARW as Allan N 2.571e-5 °/√h, not 3.636e-5) + `fiber-bundle.ts`; gyroscope, loop mirror, bundle, pump combiner tiered; 507 tests.
  - Fiber-optics part 6 (session 48, PR #56): `doped-fiber-gain.ts` (Saleh closed form, NF, Gloge Γ, Rigrod T_opt 51.5 %); amplifier, rare-earth-doped (+ rare-earth-fiber merged), fiber-laser tiered; 519 tests.
  - Fiber-optics part 8 (session 50, PR #60): `step-index-modes.ts` (PII MFD 9.886 µm, Γ, exact mode count), `microbend.ts` (exact-LP01 Hankel overlap 1.17 dB/m, Gaussian 1.85× low), `g657.ts`, scaled besselK; MFD, bend-insensitive, micro-bend, v-number, fiber-characterization tiered; 538 tests.
  - Fiber-optics part 9 (session 51, PR #62): `coupled-mode.ts` (Snyder κ 4.447e-3 /m, Koshiba h̄ → Hayashi, XT −38.3 dB/10 km; K₀ tail 18.3 % not 26.2 %; half-plane η; Digonnet–Shaw coupler); multi-core, side-polished, d-shaped, fiber-coupler tiered; 542 tests.
  - Fiber-optics part 10 (session 52, PRs #64–65): `fiber-taper.ts` (+ `tapered-fiber` merged; Birks–Li, three-layer LP0m, Love Ω_d; waist 27.9 µm), `silica-attenuation.ts` (0.187 dB/km at 1550, min 1550.8 nm) for attenuation + low-water-peak, `otdr.ts` (Barnoski–Jensen × Brinkmeyer η −82.5 dB at 1 ns, DR 20.5 dB), `link-budget.ts` (margin held, −12 dBm); 565 tests.
  - Fiber-optics part 11 (session 53, PR #67): `photonic-crystal.ts` (Saitoh–Koshiba V/W, ESM d/Λ 0.4275 vs FEM 0.424, D 74.4/22.0 vs MPM 71.3/23.1), `specialty-fiber.ts` (6 data-sheet fibres, illustrative). Fiber-optics fully tiered.
  - Free-space-comms part 6 (session 62, PR #85): `point-ahead.ts` (2v⊥/c, inertial GEO 2.61 km/s → 17.4 µrad), `acquisition.ts` (10 lines, 0.573 s; Tyler–Fried NEA), `qkd.ts` (GLLP decoy BB84, GYS 142.01 km vs 142.05; PLOB), `physical-layer-security.ts` (exact Gaussian capture, wiretap C_s); FSO 26/26, 0 `knownIssue`s.
  - Free-space-comms part 5 (session 61, PR #83): `background-radiance.ts` (Giggenbach sky table, 5772 K Sun capped at 6.794e-5 sr, ∫ = 1361 W/m²; APD noise, equal-noise FOV 18.75 mrad), `channel-capacity.ts` (exact AWGN BER incl. Craig 8-PSK 13.396 dB, SNR-gated rate, HD bound 3.74 %); 3 pages tiered; 645 tests.
  - Free-space-comms part 4 (session 60, PR #81): `turbulence.ts` (exact weak aperture integral A 0.0544/0.1436, γ-γ α/β 103.2/98.5, wander rms 0.299 cm/0.076 dB, b_I table + SC/EGC/MRC outage), Temme `regularizedGammaP`; 4 pages tiered; 634 tests.
  - Free-space-comms part 3 (session 59, PR #79): `link-budget.ts` (Friis capped, Klein–Degnan g, Fraunhofer width of a clipped Gaussian: 1.44× at α = 1); lasercom −33.42 dBm, link-budget exact capture, top-hat 20.04 vs Gaussian 17.03 dB, optical-antenna W₀ = a/α; 623 tests.
  - Free-space-comms part 2 (session 58, PR #77): `precipitation.ts` (ITU-R P.1814-1 2025 rain: µ table, F, G_ms; 25 mm/h, 1 km → 10.09 dB; Graz snow law, S read as water-equivalent); rain/snow tiered; 613 tests.
  - Free-space-comms part 1 (session 57, PR #75): Kruse + Al Naboulsi in `atmospheric-attenuation.ts` (Kim fog 33.93 dB/km), `wavelength-selection.ts` (IEC Class 1 eye score); `atmosphere` → `atmospheric-loss`.
  - Free-space-comms part 0 (session 56, PR #73): 20 pages audited, 19 bugs + 1 questionable, 20 `knownIssue`s; fix parts 1–6.
  - Thin-film leftovers b (session 55, PR #71): `sputtering.ts` (L–W yields, cosine disk; 1.866 nm/s), `plasma-global-model.ts` (L&L argon, Tₑ 3.79 eV vs example 3.5; 2.59 eV default), `adhesion.ts` (Benjamin–Weaver 696 MPa, Kendall, D3359, H–S bend); ATM/TORR → constants; thin film 45/45; 598 tests.
  - Thin-film leftovers a (session 54, PR #69): `thermal-evaporation.ts` (Alcock fits, Hertz–Knudsen; 0.20 nm/s), `ion-assisted-deposition.ts` (ratio 0.283, QCM density), `angle-shift` (472.3 nm) tiered; 588 tests.
  - Fiber-optics part 7 (session 49, PR #58): `fiber-birefringence.ts` (Sakai–Kimura εn₁Δ²G(V), L_B 10.01 m; Lefèvre 0.882 rad/loop; PM crosstalk 26.99 dB); birefringence-fiber, polarization-maintaining, polarization-controller tiered; 525 tests.
- Codex review fixes (session 48, PR #55): `eye-safety-fso` on the ICNIRP modules (MPE was ×1000; NOHD 11.125 m, 3R); SimpleChart category axes and grouped bars (Mueller, IR glass, crystals were blank); 512 tests.
- Session 41: roadmap archived; `/ship` and `/handover` skills; `physics-reviewer` on Opus; `checker` agent on Haiku.
- [ ] Optional (user): a Defender exclusion for `C:\dev`.
