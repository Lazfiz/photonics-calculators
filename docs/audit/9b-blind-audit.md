# Blind audit, 2026-11-06 (ROADMAP 9b)

**Result: 0 errors in 30 random pages. 7 pages have a minor issue (wording, a label, a 0.02-point rounding gap); 23
are clean.** With 0 errors in 30 pages, the site-wide rate of pages with a wrong result is below 9.5 % at 95 %
confidence (Clopper–Pearson, 1 − 0.05^(1/30)). The audit can't show that the rate is zero.

## Method
- **Sample.** `npx tsx scripts/audit-sample.ts 20261106 3` draws 3 tiered pages per category (30 of 411) with a seeded
  PRNG, so anyone can redraw the same pages. Nobody picked them.
- **Captures.** `scripts/page-capture.mjs` saved each production page as text (inputs, results, formulas, model note,
  references): `9b/<cat>__<slug>.default.txt`. Production was `release` at `1968d6e1`, whose physics is the same as
  `main`'s.
- **Blind recompute.** Five reviewers each took 6 pages. They recomputed every displayed result from the capture alone,
  before opening the page's code, with their own `node` scripts and CODATA constants.
- **Second point.** Each reviewer then chose one non-default input set in another regime (URL keys only), captured it
  (`9b/<cat>__<slug>.second.txt`) and recomputed that too. Only after both points did they read the code, and only to
  explain mismatches and check domain guards.
- **References.** Each DOI was checked with `scripts/crossref.mjs`.
- **Grades.**
  - ERROR: a displayed number, unit, formula or physics claim is wrong beyond rounding or the stated model, or a
    reference doesn't exist or doesn't support the claim.
  - MINOR: wording, a misleading label, rounding, or a citation detail.
  - OK: everything agrees.

**Limits, stated plainly.**
- The reviewers were AI models (Claude Opus subagents), the same model family that wrote the code. They are not
  independent human experts.
- 8 pages were checked against fetched source text:
  - ICNIRP 2013 for the 3 laser-safety pages;
  - the Hamamatsu C16910 data sheet (`streak-camera`);
  - Ziarkash 2018 Table 1 (`afterpulsing`);
  - SCHOTT AGF/TIE-19 data (`optical-glass-catalog`);
  - Sellmeier data (`electro-optic`);
  - Dubietis 2017 (`filamentation`).
- The other 22 were checked against the standard textbook result, recalled by the reviewer and recomputed
  numerically, not against the cited book's text.

## Results
| Page | Grade | Points | Finding |
|---|---|---|---|
| detectors/afterpulsing | MINOR | 2/2 | Model note mixes two approximations: no cascades is first order in P_ap, no trap saturation is first order in R·τ. η₁+η₂ can show a "probability" > 100 % (warned above 10 %). |
| detectors/streak-camera | OK | 2/2 | Note: M = 2.77 is inferred from the data-sheet geometry; 2.63·√Δε/E (Shakya 2005) text not reachable. |
| detectors/responsivity | OK | 2/2 | — |
| fiber-optics/dispersion-comp | MINOR | 2/2 | "4Bσ" under the broadening card uses the added broadening (4πc), the B_max card the total width (2πc), both called σ; the note says the 4πc term sets the limit. Both formulas follow Agrawal; only the labels are wrong. |
| fiber-optics/side-polished | OK | 2/2 | — |
| fiber-optics/fiber-characterization | OK | 2/2 | — |
| free-space-comms/fade-probability | MINOR | 2/2 | Uncorrelated receivers "≫ √(λL)" is the weak-turbulence width; strong turbulence needs ≫ L/(kρ₀) too. |
| free-space-comms/atmospheric-loss | OK | 2/2 | — |
| free-space-comms/link-budget | MINOR | 2/2 | "Friis: 7.40 dBm" is capped at P_t without saying so (raw 30.41 dBm) when the note is hidden; G_tG_r/FSPL = D²/(2θ²R²) takes θ as the half-angle, the paragraph defines it as the full divergence. |
| imaging/image-distance | OK | 2/2 | — |
| imaging/computer-generated-holography | OK | 2/2 | The binary-amplitude branch was checked in code only. |
| imaging/telecentricity | OK | 2/2 | — |
| laser-safety/scanning-mpe | OK | 2/2 | Cosmetic: "across 7.00 mm" names the stop; the pass width used is 6.93 mm. |
| laser-safety/exposure-duration | OK | 2/2 | — |
| laser-safety/ael-limits | OK | 2/2 | Class 3R at 905 nm rebuilt 4.95 mW vs IEC table 5.14 mW; the page states the IEC rounding. |
| materials/optical-glass-catalog | OK | 2/2 | All 10 glasses match the SCHOTT data. |
| materials/magneto-optic | OK | 2/2 | Vojna 2019 Table 2 coefficients not reachable (MDPI blocks bots); TGG within 3 % of the literature. |
| materials/electro-optic | OK | 2/2 | Note: KD\*P and ADP stop at 1060 nm, so 1064 nm shows "—". |
| polarization/retarder | OK | 2/2 | — |
| polarization/mueller-polarimetry | OK | 2/2 | Note: the input Stokes vector and element types aren't in the share URL. Cloude 1986 (Optik 75) not in Crossref. |
| polarization/dichroic-polarizer | OK | 2/2 | Note: the exit-face transmittance of an absorbing slab is (1−R)(1+κ²/n²); below 4e-5 for κ ≤ 0.01, so "Exact" is generous but no shown digit changes. |
| spectroscopy/libs-analysis | MINOR | 2/2 | "ground-state weights … ⅙ for Al" should be ground-term; text cites Griem's 1974 tables, the list has only Griem 1997. |
| spectroscopy/penetration-depth | MINOR | 2/2 | Absorbing medium beyond the critical angle is labelled "frustrated TIR"; it is attenuated total reflection (ATR). |
| spectroscopy/jacquinot | OK | 2/2 | Griffiths & de Haseth ch. 7 is "Signal-to-Noise Ratio"; that it holds the Ω_max discussion is unconfirmed. |
| thin-film/dielectric-high-reflector | OK | 2/2 | — |
| thin-film/adhesion-testing | OK | 2/2 | — |
| thin-film/narrow-bandpass | MINOR | 1/2 | Default point: peak T 99.67 % at 1549.590/1550.410 nm; transfer matrix gives 99.691 % at 1549.586/1550.414 nm. The peak is the best sample of the scan grid, never refined (`cavity-filter.ts` `cavityPassband`). FWHM is right. |
| wave-optics/slab-laser | OK | 2/2 | The blind 0.05 % gap came from the reviewer's lumped output formula; the page uses exact Rigrod. |
| wave-optics/mode-locked-laser | OK | 2/2 | — |
| wave-optics/filamentation | OK | 2/2 | Kasparian's 4e13 W/cm² clamping value from memory. |

Points: 59 of 60 rendered points agree with the recomputation within display rounding; the 60th is the
narrow-bandpass peak, 0.02 percentage points low.

## Follow-up (9b-2)
Fix the 7 MINOR pages (the narrow-bandpass fix ships a golden test: default stack → peak T 0.996913 at 1549.586 and
1550.414 nm, T(λ₀) 0.957420, FWHM 1.13437 nm, transfer matrix, Macleod 2010 ch. 8). Optional notes: KD\*P/ADP range to
1064 nm, Stokes input in the URL on `mueller-polarimetry`, the `dichroic-polarizer` tier.
