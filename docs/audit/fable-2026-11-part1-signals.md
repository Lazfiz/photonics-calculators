# Physics review, part 1 of 3: detectors, fiber-optics, free-space-comms (2026-11-13)

Read-only review by Claude Fable 5.2 in the detached worktree `C:\dev\photonics-review` at `origin/main`
(`d531f2b5e4f1681d1bb42a2cb21ac2dbae6df0ec`). No code was changed, nothing was committed. Three Opus sub-reviewers
(R1 detectors, R2 fiber-optics, R3 free-space-comms) recomputed pages; the lead read and re-derived the 20 highest-risk
modules, re-ran its own numerical probes and checked every major finding against the code.

**Verdict.** No errors. Across 127 pages, 113 were recomputed independently (49 detectors, 38 fibre, 26 free-space,
4 of those partly) and every displayed number agreed with an independent derivation to better than 0.1 %, or stayed
inside the model the page states. One weak finding: the scintillation page's fade-probability card stays log-normal in
strong turbulence with no flag on the card, where it is 7× optimistic for a point receiver at −10 dB. Eight minor
points, mostly defaults and wording. No tier label overclaims, and no quantity coded twice gives two answers.

## How it was checked

- **Sources.** Andrews & Phillips, *Laser Beam Propagation through Random Media* (2nd ed., 2005) for Rytov variance,
  scintillation index, gamma-gamma and aperture averaging; Ma, Qi, Zhao, Lo, PRA 72, 012326 (2005) for decoy BB84;
  Klein & Degnan, Appl. Opt. 13, 2134 (1974); McIntyre, IEEE TED 13, 164 (1966); Robbins & Hadwen, IEEE TED 50, 1227
  (2003); Wiza, NIM 162, 587 (1979); Marcuse, JOSA 66, 216 (1976) and BSTJ 56, 703 (1977); Smith, Appl. Opt. 11, 2489
  (1972); Agrawal, *Fiber-Optic Communication Systems* and *Nonlinear Fiber Optics*; Saleh et al., IEEE PTL 2, 714
  (1990); Erdogan, JLT 15, 1277 (1997). Formulas were re-derived or taken from memory of these sources; no source PDF
  was opened in this session.
- **Code read by the lead (in full).** free-space-comms: `turbulence.ts` 1–240, `ber.ts`, `qkd.ts`, `link-budget.ts`,
  `bpsk-qpsk.ts`, `pointing-loss.ts`. detectors: `noise.ts`, `apd.ts`, `spad.ts`, `dead-time.ts`, `tia.ts`,
  `camera-snr.ts`, `electron-multiplier.ts`. fiber-optics: `fiber-nonlinear.ts`, `polarization-mode-dispersion.ts`,
  `macro-bending-loss.ts`, `chromatic-dispersion.ts` (header and core), `otdr.ts`, `sagnac.ts`, `doped-fiber-gain.ts`
  1–236. Page wiring read for detectivity, nep, linear-mode-avalanche, receiver-fov, background-noise,
  acquisition-tracking, scintillation, birefringence-fiber.
- **Hand calculations and probes** (scripts in `docs/audit/fable-p1-probes/`): `lead/probe-fso.ts`, `lead/probe-fiber.ts`,
  `lead/probe-scint.ts`; `r1/batch1–7.ts`, `r2/batch1–9.ts`, `r3/batch1–4.ts`. Each computes the value independently
  (own Bessel functions by integral representation, own RK4 for the amplifier rate equations, brute-force sums and
  quadratures, CODATA constants typed in) and prints it beside the module's value.
- **Boundary scans.** Miller gain at and above breakdown, excess noise with M < 1 and k outside [0, 1], junction
  capacitance at negative bias, EM stage probability > 1, MCP yield < 1, PRNU = 0, APD optimum at k = 0; FWM at α = 0,
  L_eff = 0, λ = 0, V > 2.405, bend radius down to the 1 mm page minimum; QKD past the cutoff, Friis cap in the near
  field, top-hat 0 dB floor, AO residual capped at open loop. All return NaN/∞ that the page shows as "—" or a flag.
- **Tests.** `npx tsx --test` on the 56 test files that import these three categories' physics: 416 pass, 0 fail.
- **Not run.** `npm run check`, the full test suite, build, dev server, any live page.

## 1. Errors

None found.

## 2. Weak

### W1. scintillation: fade-probability card is log-normal in strong turbulence, with no flag on the card

- **Where:** `src/app/free-space-comms/scintillation/page-client.tsx:43-44` (`lognormalFadeProbability`), card at
  `:99-100`, regime label `:73`.
- **What happens.** The card always shows the log-normal fade probability with the subtext "log-normal". The limit is
  stated only in the prose (`:128`) and the modelNote ("optimistic in moderate to strong turbulence"). The sibling
  pages aperture-averaging and diversity-reception flag σ_R² > 1 beside the result; fade-probability shows both models.
- **Cases** (1550 nm; expected = gamma-gamma CDF with A&P α, β for the same aperture, checked by my own brute-force
  double integral in `lead/probe-fso.ts`, which matches `gammaGammaCdf` to 6 digits; `lead/probe-scint.ts`):

| C_n² (m^-2/3) | L | D | σ_R² | σ_I² | P(−3 dB) card / gamma-gamma | P(−10 dB) card / gamma-gamma |
|---|---|---|---|---|---|---|
| 1.7e-14 (default) | 1 km | 0.1 m | 0.338 | 0.0279 | 2.25e-5 / 5.94e-5 | 1.4e-43 / 5.7e-31 |
| 1.7e-13 ("strong" preset) | 1 km | 0 | 3.39 | 1.137 | 0.361 / 0.399 | 1.37e-2 / 7.18e-2 |
| 1.7e-13 | 5 km | 0 | 64.7 | 1.161 | 0.364 / 0.412 | 1.45e-2 / 1.02e-1 |
| 1.7e-13 | 5 km | 0.1 m | 64.7 | 0.0878 | 1.27e-2 / 2.26e-2 | 3.3e-15 / 8.7e-9 |

- **Expected value and source.** For a point receiver in strong turbulence the accepted model is gamma-gamma
  (Al-Habash, Andrews, Phillips, Opt. Eng. 40, 1554 (2001); A&P 2005 ch. 9): 0.10 at −10 dB where the card shows
  0.0145. With a large aperture (rows 1 and 4) neither tail is established, so those rows show the size of the model
  spread, not an error; only the point-receiver rows are graded.
- **What the user sees.** A fade probability 5–7× too low at −10 dB for a small receiver once σ_R² > 1, labelled only
  "log-normal". Fix: show the gamma-gamma value beside it (the function is already in `turbulence.ts`), or flag the card
  when σ_R² > 1 as the sibling pages do.

## 3. Minor

| # | Where | Finding |
|---|---|---|
| M1 | `scintillation/page-client.tsx:73` | Regime label calls σ_R² < 5 "Moderate"; the page's own "strong" preset (σ_R² = 3.39 at 1 km) reads Moderate. The usual boundary is σ_R² ≈ 1. |
| M2 | `src/registry/calculators/free-space-comms.ts:286` (lasercom-link) | Description says "Gaussian-beam transmit and receive gains"; the code uses the uniform-aperture gain (πD/λ)²η. A truncated Gaussian reaches at most 0.8145 of that (−0.89 dB). The modelNote is accurate. |
| M3 | `src/physics/free-space-comms/turbulence.ts:107` | Comment says β₀² = 0.4 σ_R²; the code's 0.496/1.23 is 0.4033 (exact Kolmogorov ratio 0.4042). Code right, comment rounded. |
| M4 | `connector-insertion-loss/page-client.tsx:18`, `splice-loss/page-client.tsx:16-17` | Default MFD 9 µm at 1550 nm; G.652 is ≈ 10.4 µm (9.2 at 1310) and connector-return-loss, coupling-efficiency and otdr default to 10.4. Offset loss at 0.3 µm reads 0.0193 dB instead of 0.0145 dB. The URL key and variable are still `fiberCoreDiam`. |
| M5 | `src/physics/fiber-optics/gaussian-coupling.ts:222` | Tilt loss uses the fibre index at gap = 0 and the gap index for any gap > 0, so 0.3° tilt reads 0.0207 dB at 0 and 0.0099 dB at a 0.05 µm air gap (factor n²). Documented choice; worth one line on the page. |
| M6 | `birefringence-fiber/page-client.tsx:96` | The first-order-in-ε warning starts at ε > 0.2 (b/a < 0.8); inputs go to ε = 0.5. A first-order result is already doubtful near ε ≈ 0.1. (R2 graded this WEAK; the page does warn, so it is minor.) |
| M7 | fiber-optics/sbs-threshold | ν_B = 2nv_A/λ gives 11.15 GHz with the default v_A 5960 m/s; measured SMF-28 at 1550 nm is ≈ 10.8 GHz. Textbook value (Agrawal), fine as labelled. |
| M8 | detectors (notes) | InGaAs α(1550 nm) 6.0e3 cm⁻¹ vs Adachi ≈ 6.8e3 (inside the stated ±12 % fit band); InP edge 916 nm (Vurgaftman 1.353 eV) vs the common 922 nm. Both documented. |

## 4. Verified correct by independent calculation

Lead probes (ratio code/mine = 1.0000 to the digits shown unless noted):

| Module | Inputs | Independent value | Code |
|---|---|---|---|
| `scintillationIndex` (point) | σ_R² 0.01 … 400 | A&P closed form, 6 values | same |
| `gammaGammaCdf` | σ_R² 1, I/⟨I⟩ 0.1 (and 4 more) | 1.934077e-2 by double quadrature | same |
| `friedParameter`, `isoplanaticAngle` | C_n² 1e-14, 1550 nm, 1 km | 7.863 cm (0.185 form), 44.41 µrad | 7.848 cm (0.18 %), 44.45 µrad |
| `weakApertureFactor` (Gaussian) | d² 0.25, 1, 9, 100 | 0.7219, 0.4341, 0.06216, 0.003835 | within 0.04 % |
| `decoyBb84` | GYS, μ 0.48, 100 km | key 1.7185e-5 /pulse, QBER 3.758 % (Ma eqs) | ratio 1.00003 (exact-in-Y₀ form) |
| `ookPhotonCountingBer`, `dpskPhotonCountingBer` | n̄ 10 / 20, n_b 0; n̄ 8, n_b 1.5 | 1.0306e-9; 1.1980e-3 (best threshold), 4.8454e-3 (double sum) | same |
| `optimumTruncation` | γ = 0 | α 1.1209, g 0.81453 | same |
| `lp01Mode` | V 1.2, 2.0, 2.4, 3.5 | U 1.134126, 1.528184, 1.645311, 1.847349 | same |
| `bendLossCoefficient` | a 4.1 µm, NA 0.12, n₁ 1.4494, 1550 nm, R 5/10/15 mm | 871.36, 31.410, 1.3074 m⁻¹ | same |
| `petermannIIRadius`, `coreOverlap` | a 4.1 / 3 / 6 µm | 5.1012 / 5.2783 / 5.7855 µm; Γ 0.7391 / 0.5158 / 0.8903 | same |
| `amplifier` (Saleh closed form) | N 1e25, 50 mW 980 nm, 1 µW 1550 nm, L 3/10/25 m | RK4: G 432.05 / 25039 / 19689; NF 3.063 / 3.069 / 3.072 dB | same (NF within 2e-5) |
| `uniformReflectance` | (κL, σL) = (1,0), (2,1), (2,3), (0.3,5) | 0.58003, 0.90903, 0.33118, 3.3286e-3 | same |
| `sbsThreshold`, `srsThreshold` | A_eff 80 µm², 0.2 dB/km, 20 km | L_eff 13.070 km; 2.571 mW; 1.518 W | same |
| `fwmEfficiency` | Δβ 2e-4 m⁻¹, 20 km | 0.23334 by direct integration | same |
| `dgdExceedanceProbability` | 3× mean | 4.1998e-5 from the Maxwell pdf | same |

Hand-derived by the lead from the source formulas (no script): APD optimum gain kM³ + (1−k)M = 4kT/(qRI); Robbins–Hadwen
F² = 1.978 at G 300, N 604; Wiza optimum δ = √e and G_M = exp(A²V/2e); Butterworth TIA noise moments; coherent
quantum limits 18 (heterodyne) and 9 (homodyne) photons/bit; gyro shot-noise phase and ARW/√2; SPM rms broadening
√(1 + 4φ²/(3√3)); D(1550) = 17.46 ps/nm/km for λ₀ 1310, S₀ 0.092.

Sub-reviewer recomputes, defaults plus one other regime per page (selected rows; all rows agree):

| Page | Inputs | Value (mine = code) |
|---|---|---|
| detectors/excess-noise | M 100, k 0.02 | F 3.9502 |
| detectors/linear-mode-avalanche | 1 nW, 800 nm, QE 0.8, 100 MHz, 1 kΩ, M 100 | SNR 1.1533, M_opt 215.45 |
| detectors/em-gain | G 100, N 604, S 10 e⁻ | F² 1.97496, crossover 36.67 e⁻ |
| detectors/nep | 10 nA, 1 Hz, 50 Ω, 300 K, 0.8 A/W, 1 mm² | NEP 2.2754e-11 W, D* 4.3948e9 Jones |
| detectors/spad-dead-time | 1e7 /s, 25 ns | 8.0e6 (non-par.), 7.788e6 (par.) |
| detectors/photodiode-tia-noise | 1 MΩ, 10 pF, GBW 1 GHz | f_3dB 3.989 MHz, C_f = 1.4102× the 45° formula |
| detectors/microchannel-plate | 1000 V, L/d 50 | G 1024, (L/d)_opt 60.65, G_max 1568 |
| detectors/photon-transfer | read 10, well 5e4, PRNU 1 % | crossovers 100 and 1e4 e⁻, DR 73.98 dB |
| fiber/sbs-threshold | 10 km, 0.2 dB/km, 80 µm², Δν_s 1 MHz | 4.3126 mW |
| fiber/chromatic-dispersion | 80 km, σ_λ 0.1 nm, 50 ps FWHM | σ_out 147.39 ps |
| fiber/otdr-analysis | 100 ns, MFD 10.4, 20 dBm, 65536 avg | S 1.612e-3, DR 20.53 dB one-way |
| fiber/fiber-bragg-grating | L 10 mm, Δn 1e-4 | κ 202.7 m⁻¹, R 0.9329, FWHM 0.1499 nm |
| fiber/fiber-amplifier | 10 m, 200 mW, −10 dBm | 10.125 dB, NF 2.84 dB |
| fiber/multi-core | Λ 45 µm, R 100 mm | h 1.480e-8 m⁻¹ |
| fso/aperture-averaging | hard aperture, d² 0.01 … 100 | 0.9685 / 0.4135 / 0.04836 / 0.003875 (1e-4) |
| fso/adaptive-optics | defaults | f_G 54.41 Hz, Strehl 0.9812 |
| fso/quantum-key-distribution | GYS 0 / 50 / 140 km | 2.5546e-3 / 2.2260e-4 / 2.4647e-7, cutoff 29.823 dB |
| fso/bpsk-qpsk | Eb/N0 10 dB, 1 Gb/s, heterodyne | BER 3.872e-6, P_req 1.2816 nW |
| fso/diversity-reception | N 2–3, ρ 0–0.5 | 4e6-run Monte Carlo within 1.3σ |

**Same quantity in different modules.** Shot noise, Johnson noise, ENBW (π/2·f_c) and NEP/D* give the same numbers
wherever they appear. dB: power ratios use 10·log, amplitude SNR (`photodiodeSnr`) 20·log, each labelled. OTDR uses
5·log for one-way dB. `DB_PER_E_FOLD` is defined twice with the same value (`fiber-optics/macro-bending-loss.ts:151`,
`free-space-comms/atmospheric-attenuation.ts:40`), as are `dbPerKmToPerM` (`otdr.ts:25`) and `alphaFromDbPerKm`
(`fiber-nonlinear.ts:48`): duplicates, not disagreements. No inline c, h, q or k_B in the three categories.

**Tier labels.** None overclaims. The "exact" pages (v-number, link-budget, photon-counting) are definitions,
arithmetic, or state their limit in the modelNote.

**Judged correct after a second look.** Aperture-averaging factors differ 4–25 % from the Andrews/Churnside
interpolations because they are the exact weak-fluctuation integrals. Macro-bend uses the exact β² in Marcuse's
exponent (4–9 % below the β ≈ n₁k form). Kim/Kruse aerosol subtracts the 550 nm Rayleigh part (0.1–21 % below plain
Koschmieder). Gyro ARW divides by 60√2 (IEEE 952, one-sided PSD). em-gain's claim that F² = 2 − 1/G produces a false
optimum is confirmed.

## 5. Suggested fix order

1. W1 with M1: gamma-gamma value or a σ_R² > 1 flag on the scintillation fade card; regime boundary at 1.
2. M4: MFD default 10.4 µm on connector-insertion-loss and splice-loss.
3. M2: lasercom-link description ("uniform-aperture gains").
4. M6, M5: lower the ε warning to ≈ 0.1; one line on the contact/gap tilt convention.
5. M3: comment only.

## 6. Questions for the owner

1. W1: show both models on the scintillation card, or link to fade-probability and only flag?
2. M4: is 9 µm meant as a 1310 nm default? Then the wavelength default should be 1310 nm instead.
3. eye-safety-fso still gives NOHD 11.1 m on `main` (linear beam growth; Gaussian growth gives 23.9 m). This is the
   laser-safety audit's U1, fixed in 693ed6f2 on `fix/laser-safety-audit`. Is that branch merging before the next release?
4. Rain attenuation cites ITU-R P.1814-1 coefficients that nobody has checked against the Recommendation. Should that
   join the "unverified standards citations" list?
5. Should the two identical `DB_PER_E_FOLD` definitions move to one shared module?

## 7. Not covered

- **Detectors (5 pages):** afterpulsing and responsivity (in the earlier blind recompute); streak-camera,
  intensified-ccd, gain-temperature (accepted limits).
- **Fibre (9 pages):** d-shaped-fiber, side-polished, fiber-characterization, dispersion-comp, dispersion-map,
  specialty-fiber, and the accepted photonic-crystal, low-water-peak, rare-earth-doped.
- **Free-space, partial (4 pages):** eye-safety-fso beyond the NOHD and wavelength-selection's class limit (both
  laser-safety code); the rain coefficient tables; sky-radiance tables on receiver-fov and background-noise (accepted);
  lasercom-link and pointing-loss were read and hand-checked, not executed.
- No reference was opened: formulas were re-derived or recalled, so a misprint shared by my memory and the code
  would not show. Material data (Si, InGaAs absorption; Er cross-sections) were not checked against tables.
- No page was rendered: labels and units were read in the source, not in a browser.
