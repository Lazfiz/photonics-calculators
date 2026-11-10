# Laser-safety core: physics audit (2026-11-10)

Read-only audit by Claude Fable 5.2 on branch `phase-11/11c-8b-fiber-optics` (54e30506). No code was changed.

**Verdict.** No wrong number was found in the ICNIRP 2013 limits, correction factors, extended-source handling,
repetitive-pulse rules, scanned-beam power, NOHD or OD. The one error is in classification: Condition 1 is skipped
outside 400–1400 nm, so wide beams at the page's own default wavelength (1550 nm) can be given too low a class.
Everything that rests on IEC 60825-1 is marked **[IEC]**: I did not have the standard and checked those items from
memory only.

## How it was checked

- **Source.** ICNIRP, Health Phys. 105(3), 271–295 (2013), downloaded from icnirp.org and read as text: Tables 2, 3,
  4, 5, 7, 8, eqn 5, and "Repetitive pulse exposures" (p. 287). Every table row was compared with the code.
- **Code read.** All 20 modules in `src/physics/laser-safety/`, the three schemas, the three pages' caveat text and
  `docs/laser-safety-cw-validation.md`. `src/lib/laser-safety-*` no longer exists (CLAUDE.md still names it).
- **Hand calculations.** Worked on paper first, then compared with the code (tables below). They do not reuse the
  repo's golden values.
- **Brute force.** `limitMaxPower` against a 4000-point scan in t (12 636 cases: 15 wavelengths, 5 α, both fields of
  view, 6 beam sizes, 9 durations) and rule 2 against every group size n = 2…N (552 cases). Neither found a case where
  the code allows more than the brute-force minimum. At the NOHD, P / P_max = 1.0000000 in 6 cases.
- **Not run:** `npm test`, `npm run check`. Nothing was changed, so the gates are as they were.

## 1. Errors (wrong results)

### E1. Condition 1 is not applied outside 400–1400 nm, so the class can be too low **[IEC]**

- **Where:** `src/physics/laser-safety/laser-classes.ts:259-262` (`condition1Modelled`), used at `:309`;
  `src/schemas/laser-safety/classification.ts:57` (`warnings: []`);
  `src/app/laser-safety/classification/page-client.tsx:100`.
- **What happens:** with "telescopes foreseeable" ticked (the default), the telescope condition is silently dropped
  at 302.5–400 nm and 1400–4000 nm.
- **Cases (1550 nm, 30 mm 1/e² beam, 0.1 mrad):**

  | Power | Code says | Expected with Condition 1 | Why |
  |---|---|---|---|
  | 100 mW | Class 1 (`class1Max` = 358 mW) | Class 1M | a 24.5 mm stop at 2 m collects 1 − exp(−2·(24.5/30)²) = 73.7 % = 74 mW, above the 10 mW Class 1 AEL |
  | 1 W | Class 3R (`class3RMax` = 1.79 W) | Class 4 | the same stop collects 0.74 W, above the 0.5 W Class 3B AEL |

- **Correct value and source:** IEC 60825-1:2014 Table 10. From memory, Condition 1 at 1400–4000 nm is a stop of
  7 × the Condition 3 stop (24.5 mm from 10 s) at 2 m, and at 302.5–400 nm a 7 mm stop at 2 m. The module header
  already lists this as not modelled; the stop sizes need checking against the standard.
- **What the user sees:** the page adds "Condition 1 not assessed: may be 1M" only for a Class 1 or 2 result. A 3R or
  3B result gets no caveat. The API schema returns the class with no warning at all.

No other wrong number was found.

## 2. Unsafe defaults and wording

### U1. Direct-beam NOHD defaults to the less conservative beam model

- **Where:** `src/physics/laser-safety/hazard-distance.ts:44` (`roundBeam` defaults to `"linear"`), `:48`. Used by
  the industrial, research-lab, green-pointer, medical, ultrafast, diode and lidar pages.
- **Why it matters:** a + rφ is never smaller than √(a² + (rφ)²), so the linear model always gives the shorter NOHD.
  Far from the aperture the difference vanishes (1 W, 532 nm, 1 mm, 1 mrad: 315.2 m vs 316.2 m). Near threshold it
  does not: 2.2 mW, 532 nm, 5 mm, 1 mrad, 0.25 s gives **7.9 m linear vs 11.9 m Gaussian**.
- **Wording:** `industrial-laser-safety/page-client.tsx:153` and `schemas/laser-safety/research-lab-safety.ts:65`
  attribute a + rφ to ANSI Z136.1. From memory, ANSI Z136.1 Appendix B uses the hyperbolic form
  (1/φ)·√(4Φ/(π·MPE) − a²); the linear one is IEC TR 60825-14's. Not verified: I had neither document.
- **Suggested fix:** default to `"gaussian"`, or state on each page that the linear form is the shorter of the two.

### U2. EU amendment A11 is off by default **[IEC]**

- **Where:** `laser-classes.ts:148`, `schemas/laser-safety/classification.ts:25`.
- **Effect:** 1310 nm, 400 mW is reported as Class 1 (limit 0.499 W). With A11 the code's own skin AEL caps it near
  0.1 W. An EU user who leaves the box unticked gets the pre-2021 class. The page text does mention A11.

### U3. API output of the scanning page has none of the page's caveats

- **Where:** `src/schemas/laser-safety/scanning-mpe.ts:53-60`.
- **Effect:** the page says the eye is on the centre of the scan line and that turning points (slower, passes in
  pairs) are not modelled. The schema returns `maxPowerScanned` with no such warning. Turning points are the more
  hazardous place for a bidirectional scan.

### U4. Scanning default exposure of 0.25 s carries over to invisible wavelengths

- **Where:** `scanning-mpe.ts:31`, `scanning-mpe/page-client.tsx:27`.
- **Effect:** changing the wavelength to 905 or 1550 nm keeps 0.25 s. ICNIRP 2013 p. 286 allows 0.25 s only for
  400–700 nm without intended viewing, and gives 10 s for 700–1400 nm. The page text says so, but nothing warns when
  the inputs disagree. At 1550 nm the scanned limit falls from the single-pass value to 1.53 W at 10 s (rule 2).

## 3. Minor issues

| # | Where | Issue | Correct value / source |
|---|---|---|---|
| M1 | `scanning-mpe.ts:7` | Cites "Table 6 / p. 287" for the repetitive-pulse rules. | Table 6 is the radiance limits. The rules are on p. 287 only. |
| M2 | `scanning-mpe.ts:55` | Warning says "the 7 mm pupil" for every limit. | The corneal limits use 1–3.5 mm (Table 8). |
| M3 | `pulse-train.ts:90` | Below 1 ns the anterior-segment limit only holds the 1 ns irradiance. | It is the skin limit, for which p. 287 suggests 10 % of the 1 ns limit as the interim value, as the code does for the cornea. At 0.5 ns the code allows 5× more. It can bind near 1400 nm, where C_C makes the retinal limit large. |
| M4 | `docs/laser-safety-cw-validation.md:5-16, 39` | Stale: says ANSI-style slices, 400–1050 nm only, and points to `tests/laser-safety-cw.test.ts`, which does not exist. | The seven values in the table are correct against ICNIRP 2013 Table 5. |
| M5 | `eye-exposure-limits.ts:114-117` | Matches ICNIRP 2013 Table 5 exactly (302 ≤ λ < 303: 40 J/m² … 313 ≤ λ < 315: 6.3 kJ/m²). Worth a comment: at whole nanometres this is one step laxer than IEC's C₂ and the EU Directive. | 308 nm (XeCl): 630 J/m² here; 10^(0.2·13) = 398 J/m² in IEC. The class AELs do use the IEC form (`laser-classes.ts:111-113`). |
| M6 | `laser-classes.ts:122-137` | Class 3B is measured through 7 mm at every wavelength. **[IEC]** | Table 10's stops are 1 mm (UV) and up to 3.5 mm (above 1400 nm). 7 mm collects more of a wide beam, so this errs safe. |
| M7 | `laser-classes.ts:323-337` | A beam within Class 1 for the naked eye but above Class 3B through the telescope falls through to Class 4. **[IEC]** | Safe direction; check 5.3 of the standard for the intended class. |
| M8 | `laser-classes.ts` | Condition 2 (7 mm stop at 70 mm, eye loupe) is not modelled or mentioned. **[IEC]** | Check whether the 2014 edition still requires it for strongly diverging sources. |
| M9 | CLAUDE.md, Architecture | Names `src/lib/laser-safety-*`. | The modules are in `src/physics/laser-safety/`. |

## 4. Verified correct against ICNIRP 2013

- **Table 5 joins.** Wavelength edges 302…315, 400, 700, 1050, 1400, 1500, 1800, 2600 nm are all lower-inclusive, as
  in the table. Duration joins 5 µs / 13 µs, 100 ns, 1 ms, 10 s, T₂ match. The ≥ 10 s rows: 10 C_A C_C W/m² for a
  point source, 18 C_A C_C C_E T₂^−0.25 above α_min, 100 C_B J/m² then C_B W/m² (400–600 nm), 10⁴ J/m² (315–400 nm),
  1 kW/m² (above 1400 nm). The 1 % step at 10 s (18·10^−0.25 = 10.1) is the table's own rounding.
- **C-factors (Table 3).** C_A, C_B, C_C including the 1150 and 1200 nm joins (C_C(1200) = 7.94 → 8.01).
- **Extended sources (Table 2, Table 4, eqn 5).** α_min, α_max(t), C_E in both fields of view, T₂. Spot values:
  α = 50 mrad, 10 ms: 7.589 J/m² (limited), 47.43 J/m² (open); α = 200 mrad, 100 s: 379.5 W/m².
- **Apertures (Table 8)** and the actual-exposure notes (Table 5 note c, Table 7 note b, 1/e diameter from p. 288).
- **Repetitive pulses (p. 287).** Rules 1–3, C_P cases a, b, c, n counted within T₂, T_i. No 0.4 floor, as ICNIRP
  states none; this is stricter than IEC.
- **Below 1 ns.** 1.0 C_E mJ/m² (× C_C from 1050 nm, no C_A) for 100 fs – 10 ps; 10 % interim value for the cornea.
- **Skin (Table 7)** including note c's large-area rule.

## 5. Hand-calculated cases

### Scanning MPE (`/laser-safety/scanning-mpe`)

| Case | Hand | Code |
|---|---|---|
| Default: 532 nm, 2 mm beam at 1 m, 30°, 100 Hz both ways, 0.25 s. v = 104.7 m/s, pass ≈ 7 mm/v, L ≈ 6.93 mm, H = 18 τ^0.75, rule 1 | ≈ 7.74 mW (pass 66.8 µs, 50 passes) | 7.68 mW (66.2 µs, 50), rule 1 |
| Same, held still | 18·0.25^0.75·A / 0.25 = 0.980 mW | 0.9797 mW |
| 1550 nm, 10 s. Rule 2 over all 2000 passes, aperture 3.56 mm, L ≈ 3.42 mm | ≈ 1.52 W; held still 9.64 mW | 1.528 W, rule 2; 9.642 mW |
| 905 nm, 10°, 10 Hz one way, 0.5 m, 10 s. C_A = 2.570, pass ≈ 7.97 ms | ≈ 5.96 mW (rule 1); held still 0.989 mW | 5.958 mW, rule 1; 0.9892 mW |

The 0.8 % gap in the first row is my 7 mm approximation of the half-power width (the code finds 6.93 mm).

### Industrial laser safety (`/laser-safety/industrial-laser-safety`)

| Case | Hand | Code |
|---|---|---|
| Default: 4 kW, 1070 nm, 5 mm, 2 mrad, 10 s. Limit 50 W/m²; d = √(8P/(πE)) = 14.27 m | NOHD 7134 m; OD 6.309 | 7134.0 m; 6.3091 |
| Default diffuse: ρP = 1200 W at 0.3 m, α = 0.71 mrad (point source) | E = 4244 W/m², ratio 84.9, OD 1.93, distance 2.764 m | 84.88, 1.929, 2.7640 m |
| CO₂: 2 kW, 10.6 µm, 20 mm, 1 mrad, 10 s. Limit 5.6·10^0.25 kJ/m² / 10 s = 995.8 W/m² | NOHD 2241.5 m; OD 4.093; diffuse (200 W) 0.2528 m | 2241.47 m; 4.0931; 0.25284 m |
| 515 nm, 100 W, 5 mm spot seen from 0.2 m, 0.25 s. α = 17.7 mrad, C_E = 11.79, limit 300 W/m² | ratio 0.796; diffuse distance 0.159 m; direct NOHD 3160 m | 0.7958; 0.15915 m; 3159.8 m |

### Classification (`/laser-safety/classification`) **[IEC]** for the AEL values

| Case | Hand | Code |
|---|---|---|
| Default: 1550 nm, 20 mW, 1 mm. Class 1 = 10³ W/m² × π(3.5 mm)²/4 | 9.62 mW; 3R 48.1 mW; 3B 0.5 W → Class 3R | 9.621 mW; 48.11 mW; 0.5 W; 3R |
| 633 nm, 0.3 mW. Class 1 = 10 W/m² × 38.48 mm² | 0.385 mW → Class 1 | 0.3848 mW; Class 1 |
| 405 nm, 0.1 mW. Photochemical 100 J/m² in 100 s | 38.5 µW → Class 2 | 38.48 µW; Class 2 |
| 1310 nm. C_C = 8 + 10^2.4 = 259.2; 10·5·C_C × 38.48 mm² | 0.4987 W, just under the 0.5 W cap | 0.49874 W |
| 905 nm, 2 mW. 10·C_A × 38.48 mm² | 0.989 mW → Class 3R | 0.9892 mW; 3R |
| UV AELs: 266 nm 30 J/m² × 0.785 mm² / 30 ks; 308 nm C₂ = 398 J/m²; 355 nm 10 W/m² | 0.785 nW; 10.4 nW; 7.85 µW | 0.7854 nW; 10.42 nW; 7.854 µW |

### Core: pulse trains, NOHD, OD

| Case | Hand | Code |
|---|---|---|
| 532 nm, 10 ns, 10 kHz, 10 s. C_P = 5·(10⁵)^−0.25 = 0.2812 | 2.16×10⁻⁸ J, rule 3 | 2.164×10⁻⁸ J, rule 3 |
| 905 nm, 100 ns, 100 kHz, 10 s. Average-power rule | 1.001×10⁻⁸ J, rule 2 | 1.0013×10⁻⁸ J, rule 2 |
| 532 nm, 1 ms, 100 Hz, 10 s, α = 20 mrad. α > α_max(1 ms) = 6.3 mrad, n = 1000 > 625 | C_P = 0.2; single pulse 1.642×10⁻⁵ J | 0.2; 1.6425×10⁻⁵ J |
| 800 nm, 100 fs, single pulse | 1 mJ/m² × 38.48 mm² = 3.85×10⁻⁸ J | 3.848×10⁻⁸ J |
| NOHD, Gaussian growth: 355 nm 0.5 W 30 ks; 1064 nm 50 W; 10.6 µm 100 W; 1320 nm 20 W | 1954 m; 798 m; 168.6 m; 51.0 m (anterior segment) | 1954.4; 797.9; 168.5; 50.9 m |
| OD: 1 W, 532 nm, 2 mm, 0.25 s | log₁₀(1 / 0.98 mW) = 3.009 | 3.0089 |
| OD: 50 W, 10.6 µm, 0.5 mm, 10 s. Peak rule at 0.35 s | P_max = 1.208 mW → 4.617 | 1.2082 mW; 4.6168 |

## 6. Cannot be verified without IEC 60825-1:2014

1. Table 10: stop sizes and distances for Conditions 1, 2 and 3 at each wavelength (E1, M6, M8).
2. Tables 3–8: the AEL values. The ones I compared from memory agree to the standard's two-figure rounding.
3. The Class 3B joint at 0.06 C₄ s and the UV 3B values (`laser-classes.ts:127-136`).
4. The 1250–1400 nm cap of Classes 1 and 3R at the 3B AEL, and the A11:2021 skin AEL (U2). The code cites
   Schulmeister's white papers, which I did not read.
5. 4.3 e (time bases) and 4.3 f (pulses within T_i counted as one; the C₅ floor of 0.4).
6. 5.3: the class of a beam that passes Condition 3 but exceeds Class 3B under Condition 1 (M7).
7. 5.4.2: that a stationary retinal image is the default evaluation for scanned emission (`scanned-beam.ts:5-6`).
8. ANSI Z136.1 Appendix B: the form of the NOHD formula (U1).
