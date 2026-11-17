# Physics review, part 2 of 3: imaging, spectroscopy, materials and the shared radiometry modules (2026-11-13)

Scope: imaging (61 pages), spectroscopy (41), materials (27) and the shared modules `src/physics/blackbody.ts`,
`cie-colour.ts`, `cie-photometry.ts` and `astm-g173.ts`, at `origin/main` d531f2b5. Read-only: no source file was
changed. The lead (Fable) read and probed 27 modules; three Opus sub-reviewers recomputed the pages (R1 imaging,
R2 spectroscopy and the shared modules, R3 materials). Every error and weak finding below was re-read in the code
by the lead. Probe scripts are in `docs/audit/fable-p2-probes/` (run with `npx tsx <script>` from the repo root).

**Verdict.** One error, three weak findings, eleven minors. The non-trivial models (Hopkins defocused OTF, high-NA
Strehl, the confocal table, Voigt and Faddeeva, the FTIR line shapes of all eight windows, etalon, ring-down,
Planck integrals, CIE and G173 tables, Sellmeier and the SCHOTT catalogue) all agree with independent numerics to
4–6 digits. The error is a literature value (CS₂ n₂) that its authors corrected in an erratum. The weak findings
are one tilted-plate delay that is wrong away from normal incidence, and two labels that claim more accuracy than
the data have.

## How it was checked

- **Sources.** Born & Wolf §8.5–8.8; Hopkins 1955 (defocused OTF); Wilhelm et al. (Zeiss 2003); Zipfel et al.
  2003; Mortensen et al. 2010; Olivero & Longbothum 1977; Norton & Beer 1976/77; Harris 1978; Malitson 1965; the
  SCHOTT catalogue values stored beside the coefficients; Vurgaftman 2001; Reichert et al., Optica 1, 436 (2014)
  and its erratum Optica 3, 657 (2016); CIE 1931/1924 tables; ASTM G173-03. Repo history: ROADMAP "Open findings"
  and "Known limitations" for these categories, and `docs/audit/9b-blind-audit.md`. Nothing accepted there, and
  nothing from part 1, is repeated here.
- **Code read by the lead.** Imaging: `diffraction-mtf`, `diffraction-psf`, `multiphoton-focus`, `oct`,
  `light-sheet`, `super-resolution`, `microscope`, `optical-sectioning-thickness`, `wavefront`, `shack-hartmann`,
  `confocal`. Spectroscopy: `line-broadening`, `etalon`, `ftir`, `apodization-comparison`, `cavity-ring-down`,
  `raman`, `spectral-resolution` (first part), `optical-path-length`. Shared: all four. Materials: `sellmeier`,
  `sellmeier-data` (sampled), `laser-damage`, `kerr-index`, `bandgap`, and the lines cited in the findings.
- **Hand calculations and probes.** Three lead probes (`lead/probe-imaging.ts`, `lead/probe-spectra.ts`,
  `lead/probe-shared-materials.ts`) compare module exports with brute-force numerics written without the module's
  formula: 2-D pupil-overlap OTF, Debye integrals, confocal PSF quadrature, Voigt by direct convolution, cosine
  transforms of each apodization window, Planck integration on a log grid, trapezoid over the G173 table.
  Sub-reviewer batches: `r1/batch1–7.ts`, `r2/batch1–5.ts`, `r3/batch1–6.ts`; each recomputed the default case
  and one other regime per page before reading the formula.
- **Boundary scans.** NA → n and NA > n; below-critical TIRF; defocus through the first contrast reversal; etalon
  coefficient of finesse < 1; Planck series branches at x = 1 and x = 0.01; every `MATERIALS` entry at its range
  edges and 20 % beyond; damage scaling across pulse lengths; plate tilt 0–89°; heat capacity down to 100 K.
- **Tests.** `npx tsx --test` once, on the 78 test files that import these categories' physics: 499 pass, 0 fail.
- **Not run.** `npm run check`, build, dev server, live pages. The CS₂ erratum was seen as a search-result
  excerpt only; the PDF was not opened (see E1).

## 1. Errors

### E1. nonlinear-index: CS₂ bound-electronic n₂ is the value its authors later corrected

- **Where.** `src/physics/materials/kerr-index.ts:149` (`cs2`, n₂ = 2.0e-19 m²/W), `:151` (`cs2-long`,
  (2.0 + 1.0 + 7.6 + 18)e-19 = 2.86e-18), header line 28. Pinned by `tests/materials-nonlinear.test.ts:101-102`.
- **Inputs.** Material preset CS₂ (short pulse) and CS₂ (long pulse) on `materials/nonlinear-index`.
- **Expected.** Reichert et al., Optica 1, 436 (2014) Table 1 gave n₂,el = 2.0 ± 0.4 ×10⁻¹⁹ m²/W. The erratum
  (Optica 3, 657 (2016), https://api.creol.ucf.edu/Publications/11187.pdf) says the electronic part was
  overestimated because the cuvette contributed, and gives electronic 1.5 ± 0.4 and collision 1.0 ± 0.2
  ×10⁻¹⁹ m²/W. Long-pulse sum with the other terms unchanged: 2.81e-18.
- **Code gives.** 2.0e-19 (33 % above the corrected value, just inside the combined uncertainty) and 2.86e-18
  (1.8 % high).
- **Caveat.** The erratum figures come from a search excerpt. Open the PDF and check the libration and
  reorientation rows before changing the preset and its test.

## 2. Weak

### W1. optical-path-length: "extra delay versus vacuum" is wrong for a tilted plate, on a page tiered exact "at any incidence angle"

- **Where.** `src/physics/spectroscopy/optical-path-length.ts:47-50` (`opdVacuum = (n − 1)·geometric`,
  `extraGroupDelay = (n_g − 1)·geometric/c`, with geometric = d/cos θ_t); card "Extra Delay vs Vacuum" at
  `src/app/spectroscopy/optical-path-length/page-client.tsx:89`; registry
  `src/registry/calculators/spectroscopy.ts:404-409` (tier "exact", "at any incidence angle"). The angle input
  goes to 89°.
- **Expected.** Inserting a plate of thickness d at incidence θ changes the path by
  OPD = d(n cos θ_t − cos θ) = d(√(n² − sin²θ) − cos θ) (Born & Wolf §7.6.1, plane-parallel plate; the ray inside
  replaces a vacuum segment of length d cos(θ − θ_t)/cos θ_t, not d/cos θ_t). Group delay, from d/dω of
  ω d(n cos θ_t − cos θ)/c: τ = (d/(c cos θ_t))(n_g − cos(θ − θ_t)).
- **Numbers** (d = 10 mm, n = n_g = 1.5):

  | θ | expected OPD / delay | code |
  |---|---|---|
  | 0° (default) | 5.000 mm / 16.68 ps | 5.000 mm / 16.68 ps |
  | 30° | 5.482 mm / 18.29 ps | 5.303 mm / 17.69 ps (−3.3 %) |
  | 60° | 7.247 mm / 24.17 ps | 6.124 mm / 20.43 ps (−15.5 %) |

- **Why weak, not error.** The docstring and lede define the quantity as "the same geometric path in vacuum",
  and the code computes that definition correctly. But that is not the delay an interferometer arm or a pulse
  sees when the plate is put in, which is what the card name says. Probe: `r2/batch5.ts`.

### W2. birefringent-crystals: modelNote claims 1e-4 in n; the repo's own tests allow up to 1.5e-2

- **Where.** `src/registry/calculators/materials.ts:37-38` (tier "exact", modelNote "the fits match measurements
  to about 1e-4 in n"). `tests/polarization-uniaxial.test.ts:121-134` allows YVO₄ versus Shi 2001 4e-3, rutile
  (DeVore) versus Bond 7e-3 in n_o and 1.5e-2 in n_e.
- **Inputs and values.** Rutile n_e minus Bond 1965: +8.6e-3 at 0.6 µm, +1.3e-2 at 1.4 µm, so Δn is about 2.5 %
  high. YVO₄ at 1064 nm: 1.95801 / 2.16745 against Shi's 1.95773 / 2.16590 (Δn_e 1.6e-3).
- **Expected.** A note that states the per-crystal accuracy (1e-4 holds for calcite, quartz, MgF₂, sapphire; 1e-3
  to 1e-2 for YVO₄ and rutile), or tier "textbook" for the page. Probe: `r3/batch6.ts`.

### W3. heat-capacity: silicon preset is 21 % low at 100 K, and silicon is missing from the page's low-temperature caveat

- **Where.** `src/physics/materials/heat-capacity.ts:106` (Si: c_ref 20.007 J/(mol·K) at 298.15 K, θ_D 645 K);
  page text `src/app/materials/heat-capacity/page-client.tsx:150-156` lists the low-T drift for sapphire, MgO,
  GaAs and diamond only. The temperature input goes down to 1 K.
- **Inputs.** Silicon, T = 100 K.
- **Expected.** ≈ 259 J/(kg·K) (7.27 J/(mol·K); Desai, J. Phys. Chem. Ref. Data 15, 967 (1986); Flubacher et al.
  1959). Silicon's effective Debye temperature falls to about 470 K near 40 K, so one θ_D cannot fit both ends.
- **Code gives.** 203.7 J/(kg·K) (−21 %). At 200 K it gives 556.9 against 557, and room temperature is exact.
  Probe: `r3/batch3.ts`.

## 3. Minor

1. **psf-calculator versus mtf: two pupil weightings under one "uniformly filled pupil" label.**
   `diffraction-psf.ts:84-88` (`axialIntensity`, sinc², FWHM 0.886 λ/(n − √(n² − NA²))) is exact for a pupil
   uniform in cos θ. The Airy lateral profile on the same page and `highNaDefocusStrehl`
   (`diffraction-mtf.ts:140`) use a pupil uniform in ρ. Registry `imaging.ts:743-747`. Same case, NA 0.95,
   Δz 0.5 µm, 550 nm: mtf page 0.2730, psf page 0.2211, aplanatic 0.2395. With the uniform-ρ pupil the axial FWHM
   coefficient is 0.8860 (NA/n 0.3), 0.8967 (0.8), 0.9362 (0.95). Below NA/n ≈ 0.7 the difference is under 1 %.
   Probes: `lead/probe-imaging.ts`, `lead/probe-shared-materials.ts`.
2. **Axial FWHM coefficient 0.88 versus 0.8859.** `optical-sectioning-thickness.ts:54` (`axialPsfFwhm`, used by
   resolution, light-sheet, 3d-reconstruction, cleared-tissue, super-resolution) uses 0.88; `confocal.ts` and
   `diffraction-psf.ts` use 0.886 for the same quantity. 0.67 % apart (NA 1.4 oil, 500 nm: 472.5 against
   475.7 nm). Probe: `r1/batch1.ts`.
3. **shack-hartmann "Fresnel number".** `shack-hartmann.ts:37` uses d²/(λf) with the full pitch; the textbook
   a²/(λf) with a = d/2 is four times smaller (633 nm, f 5 mm, d 150 µm: 7.109 against 1.777). The page's
   thresholds match its own definition, so no verdict changes. Probe: `r1/batch3.ts`.
4. **multiphoton-focus header.** The Gaussian fit quoted for k = 2 (2.0 % wide) and k = 3 (1.5 %) is 3.6 % wider
   than the Airy FWHM at k = 1, which the header does not say.
5. **`voigtFwhmOlivero` has no domain guard** (`line-broadening.ts:104`); the page clamps its inputs.
6. **`planckWeightedMean` on a step function**: 0.2706 against the exact 0.2745 with 400 trapezoid points
   (step at 10 µm, 300 K, 1–100 µm). No effect on smooth spectra.
7. **Fused silica range.** `sellmeier-data.ts:31-35` declares 0.21–6.7 µm and cites Malitson 1965 only; Malitson
   measured 0.21–3.71 µm. The range beyond needs its own reference or a shorter limit.
8. **YVO₄ range.** `uniaxial-data.ts:57-63` declares the one-term fit valid over 0.488–3.39 µm; the tests cover
   0.6–1.34 µm. At 3.39 µm n_o is 1.9424 against 1.9132 from the three-term Shi fit. Probe: `r3/batch1.ts`.
9. **Fused silica dn/dT preset.** `window-materials.ts:52` has 12.9e-6 /K (Crystran); Malitson and Leviton & Frey
   give about 9.5–10e-6 near room temperature in the visible. It pre-fills the thermal-lens input, so that focal
   length comes out about 25 % short.
10. **Quartz dn/dT label.** `window-materials.ts:47,71` uses −6.5e-6 /K as "ordinary".
    `crystal-properties.ts:30-32,58` reads the same Crystran entry as ∥ c = n_o = −5.5e-6 and −6.5e-6 = dn_e/dT.
    One of the two labels is wrong; the second reading looks right.
11. **Silicon two-photon absorption.** `two-photon.ts:158` (Bristow 2007 fit) gives β(1550 nm) = 1.33 cm/GW; most
    measurements are 0.7–0.9 (Dinu 2003: 0.79). The code reproduces its cited fit; the spread deserves a line in
    the note. Probe: `r3/batch2.ts`.

## 4. Verified correct by independent calculation

Values are "independent / module" where two are given.

**Imaging**
- Hopkins defocused OTF against a 2-D pupil-overlap integral: ν = 0.3, W₀₂₀ = 0.5λ: 0.22925 / 0.22926; W = 1λ:
  −0.0695; first contrast reversal at W₀₂₀ = 0.645λ.
- High-NA defocus: OTF(0.5) 0.0432, Strehl 0.27298 (NA 0.95, 0.5 µm, 550 nm).
- Airy FWHM 0.514497 λ/NA; first zero, encircled energy 83.8 %, Rayleigh, Abbe, axial first zero.
- Confocal at 1 AU by direct quadrature: lateral 0.50205, axial 0.70755, section 0.8780 against the table's
  0.50205 / 0.70754 / 0.87742; 0, 0.5 and 2 AU within 0.04 %.
- Strehl from the pupil integral: coma σ = 0.1λ 0.6693, spherical 0.6662; Maréchal 0.0752λ; PV/RMS ratios.
- Mortensen localization, N = 1000, a = 100 nm, b² = 10, 670 nm, NA 1.4: MLE 4.116 nm, least squares 4.737 nm.
- Zipfel two- and three-photon constants; OCT 2 ln 2/π; Wilhelm and Inoué forms; Shack-Hartmann factors; STED,
  SIM, expansion; TIRF (Axelrod s and p); light-sheet; speckle; holography; photoacoustic; SRS, SHG and SFG
  prefactors; FCS and FRAP; camera SNR; light field.
- Guards: NA > n, NA = 0 and below-critical TIRF return NaN. Tiers (55 textbook, 5 exact, 1 illustrative) do not
  overclaim.

**Spectroscopy**
- Voigt, f_G = f_L = 1, by convolution: V(0) 0.449111, FWHM 1.637595 (Olivero–Longbothum 1.637596);
  Faddeeva w(1) = 0.367879 + 0.607158i; Doppler width; Saha ratio.
- FTIR line-shape FWHM·L by cosine transform: boxcar 0.60335, triangular 0.88589, Happ-Genzel 0.90761,
  Norton–Beer weak/medium/strong 0.72404 / 0.84470 / 0.96536, Blackman–Harris 3-term 1.13698, 4-term 1.33322;
  boxcar sidelobe −0.2172. Coefficients match Norton & Beer and Harris.
- Etalon, 5 mm air: FSR 29.979 GHz; R = 0.95 exact FWHM 489.58 MHz; F < 1 returns NaN.
- Ring-down, L = 0.5 m, R = 0.9999: τ = 16.677 µs, finesse 31 414.
- Raman anti-Stokes/Stokes power ratio, 532 nm, 1000 cm⁻¹, 300 K: 0.012652.
- 31 pages recomputed numerically and 7 by reading (R2).

**Shared modules**
- Blackbody: σT⁴(5772 K) 6.29386e7 W/m²; 380–780 nm fraction 0.46496; F(0 → Wien peak) 0.25005; the two series
  branches meet at x = 1; Bernoulli coefficients checked by hand. One Planck implementation in `src`, in
  per-wavelength form; no second copy and no per-frequency variant.
- CIE: ΣV·5 nm = 106.857; 5772 K efficacy 92.0 lm/W; D65 xy 0.3127 / 0.3290; E 1/3, 1/3; 2856 K Planckian xy
  0.44754 / 0.40743; sRGB matrix and transfer curve. No 683 lm/W constant is redefined in these categories.
- ASTM G173: 2002 points, integral 1000.37 W/m², E(500) 1.5451, E(550) 1.5399, Jsc to 1107 nm 43.81 mA/cm².

**Materials**
- Fused silica: n_d 1.458464, n(1550) 1.444024, GVD(800) 36.162 fs²/mm, D(1550) 21.91 ps/(nm·km), zero
  dispersion 1.2728 µm, n_g(1550) 1.46260.
- All 10 SCHOTT glasses reproduce catalogue n_d (2e-5) and V_d (0.02); N-BK7 n(1064) 1.50663, absolute dn/dT
  1.62e-6 /K (546 nm) and 1.07e-6 /K (1060 nm).
- Every `MATERIALS` entry reports `inRange` false outside its declared range.
- Varshni and Vurgaftman parameters; InGaAs 0.7373 eV; BBO phase-matching angle 22.92°; Si δ(8.048 keV) 7.582e-6;
  Brillouin shift 11.15 GHz; NV zero-phonon line 637.45 nm.
- Damage threshold √τ scaling: 10 J/cm² at 10 ns → 7.071 at 5 ns; the page takes user inputs only (accepted).

## 5. Suggested fix order

1. E1: open the erratum, update the CS₂ rows and the test that pins them.
2. W1: compute the insertion OPD and group delay for the "versus vacuum" card (or rename the card and lower the
   tier), with a golden value at 60°.
3. W2 and W3: text-only changes to the modelNote and the page caveat.
4. Minors 9 and 10 (data values feeding other pages), then 2 (one coefficient), then the rest.

## 6. Questions for the owner

1. `kerr-index.ts` describes Wahlstrand & Cruz, RSI 97(8) (2026), doi 10.1063/5.0331814, as a Z-scan with 250 fs
   pulses. Crossref's title for that DOI is "Precise measurement of the Kerr coefficient using phase-sensitive
   pump–probe hyperspectral imaging". Is the method description right?
2. W1: is "same geometric path in vacuum" the intended meaning of the card, or the insertion delay?
3. Minor 1: should the psf page's axial profile move to the uniform-ρ pupil to match its lateral profile and the
   mtf page, or should the registry note state the two weightings?
4. Minor 11: keep the Bristow fit for silicon, or show the measured range beside it?

## 7. Not covered

- Imaging pages not reached or only partly checked: fluorescence-spectra, simultaneous-multicolor,
  spectral-unmixing (FPbase data and the linear algebra), hyperspectral-microscopy (only through camera SNR),
  plenoptic-camera, stitching (tile grid and blend profiles). About 52 of 61 recomputed.
- Spectroscopy: phase-correction and the page wiring of dispersive-element were not reached; michelson,
  fourier-transform, two-dimensional, sum-frequency-gen, spectral-calibration, conc-mirror and the
  apodization-comparison table were checked by reading only.
- Materials: rare-earth-absorption and crystal-properties were read, not recomputed. 23 of 27 recomputed.
- Pages already in the 9b blind audit were skipped or spot-checked: computer-generated-holography,
  image-distance, telecentricity; jacquinot, libs-analysis, penetration-depth; electro-optic, magneto-optic,
  optical-glass-catalog.
- Data tables were sampled at 2–3 points per material, not checked row by row. Charts, URL state and rendering
  were not looked at. Vectorial (polarization) focusing was not modelled; the pages disclose it.
