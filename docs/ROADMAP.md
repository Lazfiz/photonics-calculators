# Roadmap — photonics-calculators

Open work only, in order. The history is in `docs/archive/roadmap-history.md`: the 2026-10-07 review, every finding's
evidence and the logs of sessions 1–40. Don't read it at session start (≈ 50k tokens). `grep -n "<slug>"` it when a task
needs old evidence. When a stage is done, tick it here with one line (session, branch, PR, headline numbers). The detail
goes in the PR description.

## Status (session 57, 2026-10-14)
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
| free-space-comms | 9 / 26 | part 0 (session 56), part 1 (57) done: 17 `knownIssue`s; fix parts 2–6 below |
| spectroscopy | 5 / 54 | findings fixed (sessions 19–21); no full audit |
| fiber-optics | 47 / 47 | done: part 0 (session 43), fix parts 1–11 (sessions 44–53); open findings below |
| materials | 3 / 45 | Sellmeier sets fixed (session 20); no full audit |
| wave-optics | 2 / 49 | OPO (19), Gires-Tournois (14) fixed; no full audit |
| detectors | 0 / 54 | |
| **total** | **192 / 458** | 17 `knownIssue`s (free-space-comms) |

## Next (Phase 4, in order)
- [ ] `polarizer-types`: sourced specs. **Blocked until the user is at the laptop with Chrome open** (session 43:
  extension not connected). The Thorlabs, Edmund and Newport spec pages are JS-rendered or return 403 to WebFetch and
  curl. Also clear the eslint warning there (unused `wavelength` state).
- FSO fix parts (session 56 audit: 19 bugs, 1 questionable, 20 `knownIssue`s; reviewers had no web access, so verify every
  coefficient and DOI below before it goes in code or the registry; none of the 20 pages uses `src/physics/free-space-comms/`):
- [ ] **FSO part 2: precipitation** (new `precipitation.ts`): `rain-attenuation`, `snow-attenuation`. Source the
  coefficients first: ITU-R P.1814 rain 1.076·R^0.67 dB/km (25 mm/h → 9.30), λ-independent; Nadeem et al. 2009 snow
  (dry a = 5.42e-5λ + 5.4958776, b = 1.38; wet a = 1.023e-4λ + 3.7855466, b = 0.72; λ in nm; 5 mm/h, 1550 nm → 51.4
  and 12.6 dB/km). Is S water-equivalent? Drop the snow V_eq fudge and the rain λ^−0.2 term; add a λ input to snow.
- [ ] **FSO part 3: link budget** (new `link-budget.ts`: `fspl`, `apertureGain(D, λ, ε, η)`, `gaussianTxGain` 8/θ²,
  `friisReceivedPower` capped at Pt·η, `topHatGeometricLoss` ≥ 0 dB; Gaussian capture from `pointing-loss.ts`):
  `lasercom-link` (cm/m mix-up +40 dB, spreading counted twice; Friis default −33.42 dBm), `link-budget` (RF-scale
  gains; FSPL(1550 nm, 1 km) = 198.18 dB, G(10 cm) = 106.14 dBi), `geometric-loss` (η > 100 %, D_tx unused; top-hat
  20.04 dB vs Gaussian 17.03 dB), `optical-antenna` (W₀ = D/2, z_R = πW₀²/(M²λ): 49.43 mm, 4502.8 m).
- [ ] **FSO part 4: turbulence** (`turbulence.ts` + weak aperture averaging, Al-Habash α/β, beam wander, plane-wave ρ₀,
  irradiance covariance width): `aperture-averaging` (Andrews 1992 [1 + 1.062·kD²/4L]^(−7/6), spherical 0.333;
  defaults 0.0564/0.179), `beam-wander` (2.42 Cn² L³ W₀^(−1/3) → 8.915e-6 m²; loss 10 log(1 + 2⟨r²⟩/W(L)²) =
  0.076 dB), `fade-probability` (α/β 103.2/98.5 at σ_R² = 0.0199; log-normal vs γ-γ title; ad hoc fade time),
  `diversity-reception` (irradiance correlation; Lee & Chan 2004, Navidpour 2007 combiners; log-normal outage).
- [ ] **FSO part 5: receiver** (new `background-radiance.ts`: solar disc planckExitance/π at 5772 K with Ω ≤ 6.79e-5 sr,
  sourced λ-dependent sky radiance, L·A·Ω·Δλ·T, separate η_opt and QE): `background-noise` (in-band rejection 1000×),
  `receiver-fov` (η², SNR never shown; keep it, on the shared module: user, session 56), `channel-capacity` (exact AWGN;
  gate the rate on SNR; C(1 GHz, 20 dB) = 6.658 Gbps; IM/DD and Poisson scope note).
- [ ] **FSO part 6: pointing and QKD** (new `qkd.ts`, GLLP): `point-ahead` (2v⊥/c: 7 km/s → 46.70 µrad; inertial GEO
  preset; TOF ms label), `acquisition-tracking` (illustrative; mrad conversion, half-angle, aperture input instead of
  30 dBi; 5/1 mrad → 10 lines, 0.573 s at 10°/s), `quantum-key-distribution` (−f_EC·Q_μ·H₂(E_μ); μ input; Ma et al.
  2005 GYS ≈ 142 km, check), `security` (illustrative rewrite: Gaussian capture via `pointing-loss.ts`, bandwidth
  for C_s, drop the BB84 line).
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
- `point-ahead`: θ = v/c, but the point-ahead angle is 2v⊥/c (a factor of 2).
- `bpsk-qpsk`: "Required RX power" uses the RF floor kT = −174 dBm/Hz + 3 dB NF. Coherent optical detection is
  shot-noise limited at hν ≈ −159 dBm/Hz (1550 nm).
- `ber` and `bpsk-qpsk` plot log₁₀(BER) on a linear axis. Switch them back to log axes; the floor is gone.
- `diversity-reception`: a fixed "3σ" outage, and identical gain for SC, EGC and MRC.

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
  - Free-space-comms part 1 (session 57, PR #75): Kruse + Al Naboulsi in `atmospheric-attenuation.ts` (Kim fog 33.93 dB/km), `wavelength-selection.ts` (IEC Class 1 eye score); `atmosphere` → `atmospheric-loss`.
  - Free-space-comms part 0 (session 56, PR #73): 20 pages audited, 19 bugs + 1 questionable, 20 `knownIssue`s; fix parts 1–6.
  - Thin-film leftovers b (session 55, PR #71): `sputtering.ts` (L–W yields, cosine disk; 1.866 nm/s), `plasma-global-model.ts` (L&L argon, Tₑ 3.79 eV vs example 3.5; 2.59 eV default), `adhesion.ts` (Benjamin–Weaver 696 MPa, Kendall, D3359, H–S bend); ATM/TORR → constants; thin film 45/45; 598 tests.
  - Thin-film leftovers a (session 54, PR #69): `thermal-evaporation.ts` (Alcock fits, Hertz–Knudsen; 0.20 nm/s), `ion-assisted-deposition.ts` (ratio 0.283, QCM density), `angle-shift` (472.3 nm) tiered; 588 tests.
  - Fiber-optics part 7 (session 49, PR #58): `fiber-birefringence.ts` (Sakai–Kimura εn₁Δ²G(V), L_B 10.01 m; Lefèvre 0.882 rad/loop; PM crosstalk 26.99 dB); birefringence-fiber, polarization-maintaining, polarization-controller tiered; 525 tests.
- Codex review fixes (session 48, PR #55): `eye-safety-fso` on the ICNIRP modules (MPE was ×1000; NOHD 11.125 m, 3R); SimpleChart category axes and grouped bars (Mueller, IR glass, crystals were blank); 512 tests.
- Session 41: roadmap archived; `/ship` and `/handover` skills; `physics-reviewer` on Opus; `checker` agent on Haiku.
- [ ] Optional (user): a Defender exclusion for `C:\dev`.
