# Photonics calculators: physics and correctness review, 2026-11-20

Scope: `git log d531f2b5..b4005fd9` (94 non-merge commits), checked out read-only in `C:\dev\photonics-review`.
Method: diffs read file by file; golden values recomputed by hand or in scratch scripts
(`silica.mjs`, `gg.mjs` in this folder). No tests, builds or lint were run (no node_modules, 2-core laptop).

## Totals

| Severity | Count |
|---|---:|
| Errors | 0 |
| Weak | 1 |
| Minor | 6 |

Severity as in the 2026-11 reports: Error = a shown number is wrong; Weak = a shown number or label is
doubtful or inconsistent with the cited source; Minor = small, documented or boundary-only.

## Findings

### W1. Segmented tip-tilt DM fitting coefficient 0.134 is not on the same footing as the other two

- Where: `src/physics/free-space-comms/turbulence.ts:606-607` (`DM_FITTING_COEFFICIENT`), header lines 29-35;
  `src/schemas/imaging/adaptive-optics.ts:7-8` (citation text).
- What: `continuous: 0.28` and `segmentedPiston: 1.26` are Hudgin's square-cell values. The header itself derives
  1.26 as Noll's 1.0299 scaled to a square cell, `1.0299·(4/π)^(5/6) = 1.2596`. `segmentedTipTilt: 0.134` is Noll's
  Δ₃ for a circular aperture, used unscaled. With the same square-cell scaling it would be
  `0.134·(4/π)^(5/6) = 0.164`. Hudgin's commonly quoted piston + tilt value is about 0.18 (I cannot confirm the
  figure without the paper; the header says the same). So the segmented tip-tilt fitting variance is shown 18-26 %
  low relative to the two neighbouring entries' convention.
- Recomputed: scaling factor (4/π)^(5/6) = 1.2230; 0.134 → 0.164. Site: 0.134.
- Confidence: medium-high on the inconsistency, medium on 0.18.
- Fix: scale to 0.164 and say so, or cite a source for 0.18; state in the schema citation which convention each
  value uses. Test values for the tip-tilt kind change accordingly.

### M1. T_i boundary 1050 nm vs 1051 nm

- Where: `src/physics/laser-safety/pulse-train.ts:73` (`timeTi`: 13 µs from 1051 nm);
  `src/physics/laser-safety/eye-exposure-limits.ts:18` and `pulse-train.ts:87` (C_C and the 13 µs piece from 1050 nm).
- What: between 1050 and 1051 nm `timeTi` returns 5 µs while the limit table switches at 1050 nm. The header
  admits it. Only pulse trains at exactly 1050.x nm are affected; T_i then errs short (more conservative).
- Fix: use 1050 in `timeTi`.

### M2. Still-open items from the 2026-11 laser-safety audit carry a warning only

- Where: `src/physics/laser-safety/laser-classes.ts:42-49` (TODO block), `:278-283`
  (`condition1MayRaiseClass`); `src/schemas/laser-safety/classification.ts` (`CONDITION1_WARNING`).
- What: LS-E1 (Condition 1 at 302.5-400 nm and 1400-4000 nm), LS-M6 (3B through 7 mm at every wavelength),
  LS-M8 (Condition 2) are not modelled. The page now warns that the class "may be higher". The shown class can
  still be too low for a collimated UV or 1.4-4 µm beam. This is the previous E1, not a new one; it needs
  IEC 60825-1:2014 Table 10, which was not available.
- Fix: as the TODO says. Until then keep the warning prominent on classification and ael-limits.

### M3. A11 skin AEL applied 1x to Class 3R is unverified

- Where: `src/physics/laser-safety/laser-classes.ts:17-22, 189`.
- What: the code takes the EN 60825-1/A11:2021 skin cap for Class 3R at the same value as Class 1, based on
  Schulmeister's white paper, and says the A11 text is unread. The 1310 nm check values (energy1A11 0.097193 J,
  cw1A11 94.930 mW at 0.35 s through 1 mm) follow from ICNIRP's skin table and are right for that reading.
  Whether 3R gets a factor in A11 cannot be settled here.
- Fix: none until A11 is read; keep the "unverified" note in the output text, not only the code.

### M4. Scintillation page: regime label at exactly σ_R² = 1

- Where: `src/app/free-space-comms/scintillation/page-client.tsx:86`.
- What: `sigmaR2 < 1 ? "Weak" : "Moderate to strong"`. Fine as a label; the gamma-gamma numbers are valid in all
  regimes. Recomputed at the defaults (α 66.6233, β 78.6379): σ_I² 0.027917, P(I < 10^-0.3) = 5.9362e-5
  (site 5.9362e-5), lognormal 2.2523e-5 (site 2.2523e-5). No number is wrong; only noting that the "weak" boundary
  is a convention (Andrews & Phillips use σ_R² < 1) and the text should say so.
- Fix: one sentence on the page.

### M5. OH 1383 nm band: Gaussian wings give almost no excess at 1310 nm

- Where: `src/physics/fiber-optics/silica-attenuation.ts` (`oh1383Shape`, `silicaLossDbPerKm`).
- What: with a 2 dB/km OH peak the model adds 0.013 dB/km at 1310 nm and 0.0003 at 1550 nm (scratch `silica.mjs`).
  The four-Gaussian fit is Humbach's and matches his half points (1374.0/1398.1 nm, FWHM 24.0 nm). Real wet
  fibres show a broader skirt than a Gaussian sum, so the 1310 nm total for a high-OH fibre is slightly
  optimistic. Model tier says illustrative; no number is wrong against the cited fit.
- Fix: none needed; a note that the wings are the fit's, not measured, would help.

### M6. Heat capacity: silicon preset still 21 % low at 100 K

- Where: `src/app/materials/heat-capacity/page-client.tsx` (caveat), `src/schemas/materials/heat-capacity.ts`.
- What: P2-W3 was answered by extending the caveat (silicon 204 vs 259 J/(kg K) at 100 K, Desai 1986). The number
  itself is unchanged. A user reading only the result card still gets the low value.
- Fix: a second Debye temperature or a warning on the card below 150 K.

## Verified (no finding)

Recomputed by hand or script and matching the site:

- Humbach 1383 nm fit: sum 1.01357 at 1383 nm, max 1.016 at 1383.6 nm, FWHM 24.06 nm; header 0.323/0.187 dB/km
  (0.32286/0.18740); Table 3 strengths and 2722 nm (10030 dB/km/ppm, FWHM 92.97 nm) consistent with the tests.
- Sensor MTF `columnShares` floor and tail handling (`sensor-mtf.ts:83-108`).
- Gamma-gamma α, β, σ_I², fade probabilities (see M4); lognormal 3 dB fade.
- Thin-film environmental stability 0.2909 nm (clamped-film strain form).
- CHARMS absolute dn/dT entries (Ge 4.16e-4 at 5.5 µm; silica 8.86e-6; CaF₂ −1.2e-5) and the absolute/relative note.
- Laser safety: green pointer 8705.9 µW/cm² and 94.02/420.52/4205.2 m; NOHD 316.28 (ANSI, 1/e divergence) and
  316.20 m (7 mm average), 315.28 (linear), 79.896 m, 149.05 m; header 7.9 m linear vs 11.9 m Gaussian
  (d = 12.896 mm at MPE); eye-safety-fso 23.849/126.09 m; medical 1.9984 m; ultrafast 7.6242e-6 µJ (100 C_A at
  10 s, conservative against the 101.2 C_A t^0.75 row; documented); OSHA OD 5.9; scanning-mpe 0.97966 mW and
  3.6843e-4 s; A11 0.097193 J and 94.930 mW; classification 400 mW 1310 nm rank 1 / A11 rank 6.
- Optical path length insertion: 0.54818816 cm and 0.0218236 ns (group form (n n_g − sin²θ)/(n cos θ_t) − cos θ).
- Zipfel vectorial volume: 0.0765/0.68 = 0.1125 µm³ (NA 1.2, 900 nm, n 1.33).
- Connector page: 0.0207 dB in contact, 0.0099 dB at an air gap (0.3°, 9 µm MFD, 1550 nm).
- Ellipsometry alternative root condition n_s < sin θ (total reflection at the substrate).
- `spliceLossSummary` is a pure move of the page formulas; defaults 10.4 µm.
- Input parsing (`DECIMAL`), MCP batch rate limiting, openapi 404, `reason` on API outputs.

## Cannot verify without the source

- Humbach 1996 Table 2 (σ as standard deviation, four-Gaussian coefficients) and Table 3 strengths.
- McIlroy 1985 eq. 6 and the 2 G₀ (N ≤ e² N_tr) limit.
- Zipfel 2003 "68 %" single ratio.
- ITU-R P.1814-1 fog tables (Kim 272 and 340 dB/km reproduce the code's own citations).
- Hudgin 1977 α values read from Fig. 1 (0.28, 1.26, 0.23) and whether 0.18 is tabulated.
- Giles & Desurvire eq. 11 coefficients.
- EN 60825-1/A11:2021 text (3R factor), IEC 60825-1:2014 Table 10.
- ICNIRP 2013 Table 4 T_i rows (1050 vs 1051 nm) and Table 7 skin 1.1e4 C_A t^0.25.

## 2026-11 audit follow-up

| Item | Status | Note |
|---|---|---|
| P1-W1 | Fixed | |
| P1-M1, M2, M6 | Fixed | ε warning now at ratio < 0.9 |
| P1-M3 | Documented | comment 0.4033, value unchanged |
| P1-M4 | Fixed | connector-insertion-loss and splice-loss default 10.4 µm; contact/gap tilt sentence |
| P1-M5 | Not touched | gaussian-coupling.ts unchanged |
| P1-M7 | Not touched | ν_B from v_A, textbook, acceptable as labelled |
| P1-M8 | Already documented | ingaas.ts 916.4 nm note |
| P2-E1 | Fixed | CS₂ |
| P2-W1 | Fixed | OPL insertion outputs, values verified |
| P2-W2 | Fixed | modelNote now 1e-3 to 1e-2 for YVO₄ and rutile |
| P2-W3 | Documented only | silicon caveat extended; number unchanged (M6 above) |
| P2-M1 | Documented | registry text says which pupil each profile takes; code unchanged |
| P2-M2 | Fixed | 0.8858929 |
| P2-M3 | Documented | comment |
| P2-M4 | Fixed | k = 1 3.6 % added; vectorial volume output |
| P2-M5 | Fixed | Voigt guard |
| P2-M6 | Not checked | planckWeightedMean diff not read |
| P2-M7, M9, M10 | Fixed | |
| P2-M8 | Documented | YVO₄ range kept with explanation |
| P2-M11 | Not touched | two-photon.ts unchanged |
| P3-W1 | Partly | `reasons` mechanism added; ~436-entry pending backlog remains |
| P3-M1 | Fixed | alternative root and page status |
| P3-M2 | Fixed | ⌈N + ½⌉ − 1 |
| P3-M3 | No action by design | |
| P3-M4 | Documented | page states the sign convention; module unchanged |
| P3-M5 | Documented | OPO page states beam-average vs on-axis intensity |
| P3-M6 | Not touched | conoscopic.ts unchanged |
| P3-M7, M8, M9 | Fixed | DECIMAL, batch limiter, 404 |
| LS-E1 | Stopgap | warning only (M2 above) |
| LS-U1..U4 | Fixed | Gaussian default, A11 outputs, scan caveats, 10 s invisible |
| LS-M1, M2, M3, M4, M5 | Fixed | Table 6 removed; aperture text; sub-ns; validation doc; UVB comment |
| LS-M6, M7, M8 | Stopgap | TODO pending Table 10 |
| LS-M9 | Not touched | CLAUDE.md |

## Proposed fix order

1. PR A (physics): W1 (DM coefficient and its tests), M1 (timeTi 1050).
2. PR B (text only, no gate): M3 output note, M4 regime sentence, M5 OH wings note, M6 card warning.
3. PR C (later, needs sources): LS-E1/M6/M8 via IEC Table 10; A11 3R factor; Hudgin 0.18.
4. Ongoing: shrink `tests/null-reasons-pending.json`.

## Not checked

- The "page summaries move into physics modules" refactors (spectral-unmixing, rare-earth-doped,
  quantum-efficiency, sensor-cmos) were read for structure only; formulas were not recomputed except
  splice-loss.
- New schemas: only the check values listed under "Verified" were recomputed; the rest were read for units and
  `reasons` coverage.
- CGH alias distance 218.3886 mm and the Noll tail seeds were not recomputed this round.
- Registry and page text for calculators outside the diff.
- `planckWeightedMean` (P2-M6).
- No test suite, build or lint was run; tests/ diffs were read for consistency with the modules.
