# Roadmap — photonics-calculators

Open work only, in order. The history is in `docs/archive/roadmap-history.md`: the 2026-10-07 review, every finding's
evidence and the logs of sessions 1–40. Don't read it at session start (≈ 50k tokens). `grep -n "<slug>"` it when a task
needs old evidence. When a stage is done, tick it here with one line (session, branch, PR, headline numbers). The detail
goes in the PR description.

## Status (session 128, 2026-10-21)
- Phases 0–1 are done.
- Phase 2: the registry, trust data and the duplicate merge are done. The physics modules grow with each Phase 4 stage.
- Phase 3 hasn't started. Phase 4 is ongoing.

Model tiers: `npx tsx scripts/tier-status.ts` (add `<category>` to list its untiered pages).

| Category | Tiered | Notes |
|---|---|---|
| laser-safety | 40 / 40 | done (sessions 18, 23, 29–36) |
| thin-film | 45 / 45 | done (sessions 25–28, 54–55); small findings below |
| polarization | 32 / 33 | parts 1–4 done (sessions 37–42); `polarizer-types` left |
| imaging | 61 / 61 | done: part 0 audit (session 78), fix parts 1–15b (sessions 79–95) |
| free-space-comms | 26 / 26 | done: part 0 audit (session 56), fix parts 1–6 (sessions 57–62); open findings below |
| spectroscopy | 41 / 41 | done: part 0 audit (session 96), fix parts 1–12b (sessions 97–109) |
| fiber-optics | 47 / 47 | done: part 0 (session 43), fix parts 1–11 (sessions 44–53); open findings below |
| materials | 11 / 32 | part 0 audit (session 124): 39 `knownIssue`s, 18 merges decided; fix parts 1–4 done (sessions 125–128); parts 5–9 next |
| wave-optics | 37 / 37 | done: part 0 audit (session 110), fix parts 1–13 (sessions 111–123); open findings below |
| detectors | 54 / 54 | done: part 0 audit (session 63), parts 1–9b (sessions 64–77); leftovers below |
| **total** | **394 / 416** | 20 `knownIssue`s (materials) |

## Next (Phase 4, in order)
- [ ] `polarizer-types`: sourced specs. **Blocked until the user is at the laptop with Chrome open** (session 43:
  extension not connected). The Thorlabs, Edmund and Newport spec pages are JS-rendered or return 403 to WebFetch and
  curl. Also clear the eslint warning there (unused `wavelength` state).
- [x] Detectors part 9b (session 77, `phase-4/detectors-mtf-cosmic`): `sensor-mtf.ts` (Seib diffusion, column shares),
  `cosmic-rays.ts` (MPV 23 075 e⁻ in 300 µm vs PDG 23 000), `poissonQuantile`; detectors 54/54, 0 `knownIssue`s.
- [x] **Imaging audit, part 0** (session 78, branch `phase-4/imaging-audit`). Eight `physics-reviewer` batches of 7
  audited all 56 untiered pages: **29 bugs, 22 questionable, 5 OK** (airy-disk, dof, pixel-fov, fov-calculator,
  signal-to-noise); the 51 get a registry `knownIssue` (40–240 characters, see the registry test). Common: URL values skip
  the input ranges, so `?na=0` and similar hang or crash structured-illumination, mtf, light-field, stitching,
  wavefront-error, resolution and fluorescence-spectra; spectral-unmixing, registration, denoising-algorithms and
  deconvolution show fabricated outputs (hard-coded gains or curves, "results" built from the ground truth). Confirmed
  the old open finding: `dynamic-range` prnu 0.01 on a "%" input. Reviewer DOIs were checked with crossref; section and
  equation numbers were not. **User decisions:** merge, each with a redirect from the old URL, `selective-plane` →
  `light-sheet`, `working-distance` → `image-distance`, `strehl-ratio` + `wavefront-error` into one page, `sensor-ccm` +
  `sensor-cmos` into one page with CCD/CMOS presets. Not decided, so keep separate: dynamic-range vs
  detectors/well-capacity, stimulated-raman-microscopy vs coherent-raman, resolution vs airy-disk.
- [ ] **Materials fix parts** (part 0 audit, session 124, PR #155: per-page findings, golden values and references are
  in the PR description; OK pages: brewster-tir, thermal-expansion). Every merge below is a user decision (session 124)
  and gets a redirect. Every page: clamp URL values, material in the URL, physics into `src/physics/materials/` (or reuse the named module), golden test, tier +
  `modelNote` + references, drop the `knownIssue`. About 4 pages each; 45 → 27 pages (32 after part 4).
  5. Pockels and χ⁽²⁾/χ⁽³⁾ tables: electro-optic + photorefractive on one `pockels.ts` EO table (KDP V_π 7.48 kV, Γ in
     cm⁻¹); nonlinear-crystals (length and power wired, d_eff fixes); nonlinear-index (`kerr.ts`, γ with A_eff).
  6. Scattering and TPA: brillouin-scattering (`fiber-nonlinear.ts`: ν_B 11.15 GHz, g_B 3.65e-11 m/W, `sbsThreshold`);
     raman-scattering (gains, Lorentzian lines, `stokesWavelength`); two-photon-absorption (Sheik-Bahae F₂ scaling).
  7. Absorption: oh-absorption → fiber-optics/low-water-peak (add the 0.945, 1.24, 2.2, 2.72 µm bands to
     `silica-attenuation.ts`); absorption → spectroscopy/lambert-beer-law; rare-earth-absorption (`DOPANT_PRESETS`,
     α in m⁻¹ and dB/m); color-centers (Stokes shift, drop η = σ_em/σ_abs).
  8. Thermal and damage: heat-capacity (Debye scaled to Cp300; Si 0.7125 J/(g·K)); thermal-conductivity-optics (k300
     table, slab ΔT 72.46 K); damage-threshold (ns label, Gaussian peak 2E/(πw²), √τ ≥ 20 ps); radiation-damage (mm,
     power law A·D^f); aging-effects, contamination, humidity-effects → thin-film/environmental-stability.
  9. Leftovers: polymer-optics (Sultanova PMMA 1.4906), x-ray-optics (δ, β from Henke f₁, f₂: Be 3.41e-6), thermal-expansion
     (tier only).
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
**Materials**
- `optical-glass-catalog`: the TIE-19 limits (−100 to +140 °C; data sheets tabulate dn/dT 435.8–1060 nm) are from memory, since the
  TIE-19 PDF doesn't download to scripts. Check them in Chrome (SCHOTT TIE-19 or an N-BK7 data sheet), then drop this note.
- `infrared-glass`: As₂S₃, ZBLAN and AMTIR-1 have no sourced transmission band, dn/dT, conductivity or hardness (Amorphous
  Materials' site doesn't serve scripts); AMTIR-1 n(10 µm) 2.4981 is unchecked. Gan's ZBLAN formula gives n_d 1.5011, the audit's
  1.499 is unverified (Gan 1995 is paywalled). Crystran's fused-silica "1.47012 at 4 µm" is n at 0.4 µm (Malitson).
- `crystal-properties`: old quartz-crystal and sapphire-properties links land on the calcite default (a redirect can't add
  `?crystal=`). `birefringent-crystals`: KDP type-I SHG 41.21° at 1064 nm is checked against the Dmitriev handbook value
  (≈ 41°) from memory, not a downloaded source.
- `acousto-optic`: the 4 presets (TeO₂ shear/long, PbMoO₄, silica) take n, v and M₂ from secondary listings; the primary
  tables (Uchida & Niizeki 1973, Dixon 1967) didn’t download. Ge, GaP and LiNbO₃ were dropped until they can be checked.
- `magneto-optic`: the CeF₃ fit (Vojna Table 1) stops at 700 nm (39.5 against 46.3 rad/(T·m) measured at 1064 nm); Vojna’s
  Ce:TAG, TSLAG, Ho₂O₃ and Pr/Ho:TGG fits don’t reproduce their own tabulated values, so they are left out.
- `photoelastic`: the Schott sheet doesn’t state the wavelength of K, so the page claims none.
**Wave optics**
- `injection-locking`: default k_c/2π 10 GHz is an order-of-magnitude diode value, not sourced; k_c(R, τ_in) conventions differ
  by O(1) factors between Lang, Mogensen and Schunk, so it stays an input. `four-wave-mixing`: no fiber loss in the gain (lossless OPA).
- `slow-light`: one isolated Lorentzian, no pulse distortion or saturation (a warning shows when the signal is wider than the line).
  Old `/wave-optics/interferometer?wavelength=633` links land on michelson-interferometer's µm input (clamped to 50 µm).
- χ⁽²⁾ pages (`sum-frequency`, `difference-frequency`, `optical-parametric-amplifier`): default d_eff 14 pm/V is a typical PPLN value, not
  sourced; Shoji et al. 1997 (doi 10.1364/josab.14.002268) d₃₃ table is paywalled. Source it or keep it labelled as an input.
- `dye-laser-resonator`: default σₑ 2e-16 cm², τ 4 ns, σ_T 1e-17 cm², k_ST 5e6 s⁻¹, τ_T 1 µs are Rh6G-order examples (page says so);
  source them from Webb et al. 1970 (doi 10.1063/1.1673926, paywalled). `gas-laser-resonator`: g₀ 0.15 /m and I_sat 25 W/cm² come from one
  HeNe course report (Ng et al. 2015); no sourced g₀/I_sat for Ar⁺ or CO₂, so the line buttons set λ only.
- Defaults from memory, not yet sourced (session 116): `diode-laser-resonator` g₀ 1800/cm, N_tr 1.8e18 cm⁻³, A 1e8/s, B 1e-10 cm³/s,
  C 3.5e-30 cm⁶/s, n_g 3.7 (Coldren's gain tables are in the book only); `thin-disk-laser` Yb:YAG σ_e(1030) 2.0, σ_a(1030) 0.11,
  σ_ap(940) 0.75, σ_ep(940) 0.16 × 10⁻²⁰ cm² (check Koerner 2012, doi 10.1364/JOSAB.29.002493); heat fractions 0.32 (Nd) and 0.11 (Yb)
  attributed to Fan 1993 (doi 10.1109/3.234394, paywalled); κ 14 W/(m K) for YAG (Koechner), lower when heavily Yb-doped.
**Free-space comms**
- `diversity-reception`: for N ≥ 3 the Fenton–Wilkinson margin is 0.07–0.41 dB high at σ_I² ≤ 0.5 and ≈ 1–1.2 dB at σ_I² = 1, and MRC is capped at
  EGC (exact MRC 0.1–0.2 dB lower); the exact N = 3 nested integral (in the tests) is too slow for the chart (~40 ms per threshold).
- `aperture-averaging`: only the Gaussian aperture is modelled; a hard circular aperture gives a 5–11 % lower A at d² = 1–30 (reviewer quadrature, unchecked).
- `adaptive-optics` (FSO): the actuator count is fed to Noll's fit 0.2944 J^(−√3/2) as a mode count (input up to 10⁵). The
  exact residual falls as J^(−5/6): 8 % above the fit at J = 1000, 12 % at 4000. Use `nollResidual` (J ≤ 5000) or Hudgin's
  `dmFittingVariance` with the pitch, as the imaging page now does.
**Thin film**
- `sputtering-deposition` (low): no gas scattering (defaults sit at d ≈ 5.7 λ_Ar, rate is an upper bound); Westwood
  thermalisation could add it. Cr and Nb dropped: no sourced 500 eV Ar⁺ yield (M&G 600 eV: 1.3, 0.65).
- `plasma-deposition` (low): h-factors are low-pressure only (flagged, chart cut); L&L's high-pressure diffusion term
  would extend it. The Table 3.3 fits' T_e range is unchecked (solve allows 0.5–30 eV).
- `ellipsometry-measurement` (optional): a film thickness needs a film model, e.g. a known film index and Azzam &
  Bashara's transparent-film inversion.
- `thermal-evaporation` (low): T_m for Ni, Ti and Pd is 1726, 1930 and 1825 K against CRC's 1728, 1941 and 1828 K
  (unchecked against Alcock's table).

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

**Imaging / spectroscopy** (found in the detectors part 0, session 63)
- Spectroscopy part 11 (session 107): `infrared-spectroscopy` has no Herman–Wallis factor or absolute band strength; `electron-spectroscopy` graphite ρ 2.2 (SRD 71 table value) vs 2.26 g/cm³ crystal; LHM water ε₂ = 3.52 + 7.52θ kept (fits Table I with RMS 0.43, against 0.49 with −), and the page allows only −5 to 40 °C.
- `spectroscopy/conc-mirror` and `jacquinot` (session 104) both show the Jacquinot ratio π f/(h tan θ) from `throughput.ts`;
  conc-mirror adds the mirror cone and slit étendue. Merge into jacquinot only if the user asks.
- Imaging part 8 (session 86): `photoacoustic` applies only the single-pulse and ≥ 10 s skin limits (`pulse-train.ts` has no skin rules); `sum-frequency-microscopy` withholds the power for L > b (no non-degenerate Boyd–Kleinman); SRS δ is an input (no cross-section model).
- Detectors part 7b leftovers (session 74 review): `streak-camera` window ignores the usable screen length and reads one pixel (not 2, Nyquist); `intensified-ccd` puts each electron's light in one pixel (no spot spread); `vacuum-photodiode` has one φ for threshold and dark emission and no stray capacitance.
- `imaging/optical-sectioning-thickness` (session 80): Wilhelm's geometric section √[(0.88 λ/d)² + (√2 n PH/NA)²] is 40 % above the scalar wave-optical plane response at 1 AU and 25 % at 2 AU (`confocal.ts`); show both there too.
- `imaging/fluorophores.ts` (session 84): log-normal bands are exactly 0 past their anti-Stokes cutoff (EGFP emission below 480 nm, mCherry excitation above 622 nm), so tail-only bleed-through reads 0; sampled FPbase spectra would fix it. Disclosed on the pages.
- `detectors/gain-temperature` PMT branch: the −0.3 %/°C default is an entered value; source a typical dynode-gain coefficient in part 7 (Hamamatsu handbook §13.1.1 gives no number).
**Polarization**
- `polarization-scrambling` multiplies the stage means, which holds only for incommensurate frequencies. Near-resonant
  stages (q·f_i ≈ p·f_j, p, q ≤ 4) only get a warning: locked 1 kHz stages give 0.5118 in the product but 0.8848 averaged
  in time (`tests/polarization-scrambler.test.ts`). An exact average over the beat period would fix it.

**Laser safety** (optional)
- A scanned-lidar mode on `lidar-safety`.
- Re-check the classes when IEC 60825-1 Ed. 4 is published (only a BSI draft in 2026).

**Cross-cutting**
- `erf` had three implementations. `src/physics/math.ts` replaced five pages' copies; others may remain.
- `sinc` (sin x/x) is in `math.ts` since session 85; local copies remain in `detectors/sensor-mtf.ts`,
  `imaging/diffraction-psf.ts`, `polarization/spectral-depolarization.ts` (exported) and `polarization/twisted-nematic.ts`.
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
  - Open bugs: `SimpleChart` reads `null` as 0, so a break in a line needs separate traces.
    `SimpleChart` ignores `layout.legend`: it pins the legend to the
    plot's right edge, so names over ≈ 9 characters are clipped and overlap `yaxis2` ticks; `marker.color` of a markers
    trace is replaced by the palette. `otdr-analysis` and `link-budget` use `showlegend: false` plus a caption.
  - Done: ticks (session 26); log axes with no floor, non-finite values dropped (session 34); `SimpleLineChart` coordinates rounded to 0.01 px, no 1-ulp hydration mismatch (session 117).
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
  - Materials fix part 4 (session 128, `phase-4/materials-fix-4`): verdet-constant → magneto-optic (`faraday.ts`: Vojna fits, TGG −130.6 rad/(T·m) at 633 nm, silica Tran 2024, YIG saturated); brewster-tir → fresnel-polarization; photoelastic (`stress-optic.ts`, Schott K, silica 3.55); acousto-optic (`acousto-optic.ts`: mode, η, P₁₀₀, Q).
  - Materials fix part 3 (session 127, `phase-4/materials-fix-3`, PR #158): crystal-birefringence → birefringent-crystals (n(λ)/Δn of all `uniaxial-data` crystals, + BBO Eimerl with Sellmeier `K` term, KDP Zernike; SHG type I 22.88°/41.21°); calcite-properties, quartz-crystal, sapphire-properties → crystal-properties (`crystal-properties.ts`: walk-off 6.232° at 45°, quartz rotation 21.75 °/mm Chandrasekhar); diamond-optics (Peter 2.4173 + Palik IR, T 70.65 %); 421 → 418 pages, 995 tests.
  - Materials fix part 2 (session 126, `phase-4/materials-fix-2`, PR #157): chalcogenide-glass, fluoride-glass → infrared-glass; uv-materials → transparency-range (window page, Fresnel limit 2n/(n²+1), Ge 47.0 %); `window-materials.ts` (Crystran table), `TransmissionBands`; As₂S₃ Rodney, ZBLAN Gan, LiF/KBr/CsI Li in `sellmeier-data`; 988 tests.
  - Materials fix part 1 (session 125, `phase-4/materials-fix-1`, PR #156): gvd, group-index, sellmeier → chromatic-dispersion (presets, coefficients, n(λ) compare); abbe-number, thermal-dndt → optical-glass-catalog (V_d of glasses + crystals, FS 67.82; TIE-19 `schottDeltaN`, N-BK7 Δn 20→60 °C 6.997e-5); diamond range 644 nm + DOI; 983 tests.
  - Materials audit part 0 (session 124, `phase-4/materials-audit`, PR #155): 41 untiered pages in 6 reviewer batches, 30 bugs / 9 questionable / 2 OK, 39 `knownIssue`s, 13 descriptions and 3 titles restored; 18 merges decided; fix parts 1–9 planned.
  - Wave-optics fix part 13 (session 123, `phase-4/wave-optics-fix-13`, PR #154): new `photonic-crystal.ts` (gap/midgap 52.68 %, κ ln(n_H/n_L), TMM tanh²(Nκ)),
    `two-beam.ts` (V 0.95831; MZ outputs A/B), `slow-light.ts` (τ 33.3564 ps, G/Γ 53.05 ns); 3 merges; wave-optics complete; 982 tests.
  - Wave-optics fix part 12 (session 122, `phase-4/wave-optics-fix-12`, PR #153): new `four-wave-mixing.ts` (FOPA G 512.10 = 27.09 dB, RK4-checked; peak cosh²γPL),
    `slab-waveguide.ts` (b 0.453753 at V 1, 0.791313 at 2.4), `injection-locking.ts` (−3.162 … +1 GHz), co-directional transfer (0.5 at 2.2214 mm); 973 tests.
  - Wave-optics fix part 11 (session 121, `phase-4/wave-optics-fix-11`, PR #152): new `three-wave.ts` (SFG 9.0637 µW part 0, 91.87 µW PPLN default;
    DFG 18.92 µW; OPA Γ 202.18 /m, G 813.7; GVM bandwidth 0.88589/(|δ|L) → Cerullo high gain, 616.16 GHz); PPLN defaults from Zelmon; 966 tests.
  - Wave-optics fix part 10 (session 120, `phase-4/wave-optics-fix-10`, PR #151): new `kerr.ts` (P_cr 3.77λ²/(8πn₀n₂) 1.7046 MW; f 9.8175 mm;
    φ 1.2025e-3 rad; Marburger 0.322376 z_R; lens 1/z′; SPM FFT spectrum matches rms √(1+4φ²/3√3), √(1+32φ²/35)); 958 tests.
  - Wave-optics fix part 9 (session 119, `phase-4/wave-optics-fix-9`, PR #150): new `soliton.ts` (sech T₀ 56.7296 fs; L_D 0.272042 m, P₁ 2827.62 W,
    N 1.32976; SC N 53.2586, L_fiss 0.6043 cm; Ω = −3β₂/β₃ → 909.8 nm; split-step NLS checked against the exact N = 2 breather); 950 tests.
  - Wave-optics fix part 8 (session 118, `phase-4/wave-optics-fix-8`, PR #149): new `chirped-pulse.ts` (τ₀ 94.2067 fs, stretch 1000 → 3.20094 ps², Treacy 14.1916 ps²/m, G 225.55 mm, TOD = dφ₂/dω), `frequency-comb.ts` (Δφ_CE π/2 at 20/80 MHz, tooth 773658 at 193.414520 THz) and `high-harmonic.ts` (U_p 11.9517 eV, E_c(H) 51.485 eV, q 33, I_BS(H) 1.37e14 W/cm²); 2 merges with redirects.
  - Wave-optics fix part 7 (session 117, `phase-4/wave-optics-fix-7`, PR #148): new `pulsed-laser.ts` (Q-switch η(3) 0.94048, 2.635 mJ, FWHM 2.704 τ_c,
    146.9 kW; τ_RT 10.007 ns; Δλ 25.23 nm, L 1.8737 m) and `free-electron-laser.ts` (Huang–Kim ρ, Xie L_G: Xie 1995 table 1 3.12 m / 57.8 m,
    LCLS ρ 4.49e-4); `SimpleLineChart` 0.01 px rounding; 937 tests.
  - Wave-optics fix part 6 (session 116, `phase-4/wave-optics-fix-6`, PR #147): new `diode-laser.ts` (Γg_th 47.98/cm, η_d 0.6333, I_th 4.957 mA,
    θ⊥ 37.63°), `slab-laser.ts` (θ 17.74°, ΔT 0.2273 K; P_th 57.43 W, 72.23 W out), `quasi-three-level.ts` (A16 0.9636; β_th 0.0869,
    P_th 39.77 W, slope 0.6507); fiber-laser-resonator merged into fiber-laser (V, modes, Petermann II MFD); 929 tests.
  - Wave-optics fix part 5 (session 115, `phase-4/wave-optics-fix-5`, PR #146): new `laser-resonator.ts` (four-level P_th δhcA/(2ηστλₚ): audit 5.4604 W, 7.3254 W at 808 nm; Nd:YAG I_sat 2.899 kW/cm²; Rigrod slope K, K = 1 at R₁ = 1; low-loss T_opt 0.0247 within 2 %; dye triplet factor 0.76923; HeNe 0.94372 mW); 3 pages tiered.
  - Wave-optics fix part 4 (session 114, `phase-4/wave-optics-fix-4`, PR #145): new `two-mirror-resonator.ts` (w₀ 0.38295 mm; Δν_T 0.666205 / 0.333103 GHz on Siegman's sign branch; asymmetric z_R 0.3 m, z₁ 0.1 m), `ring-cavity.ts` (ℱ 102.422, τ 16.3129 ns, spot 0.278745 mm, R cos α / R/cos α astigmatism), `periodicEigenmode` in `abcd.ts`; cavity-stability merged; 437 pages.
  - Wave-optics fix part 2 (session 112, `phase-4/wave-optics-fix-2`, PR #143): new `mode-matching.ts` (closed form f 36.21766 mm, s₁ 43.72147 mm, η 1; 115.2041 / 169.1225 mm; overlap 4/4.25² 0.2214533) and `spatial-filter.ts` (w_f 33.86817 µm, T 0.8646647 / 0.9888910, far field checked by an incomplete-gamma series); beam-waist-matching merged into mode-matching (redirect); 357/439 tiered.
  - Wave-optics fix part 1 (session 111, `phase-4/wave-optics-fix-1`, PR #142): new `gaussian-beam.ts` (z_R 0.202683 mm, ψ 7.71504°, M² 1.476312) and `abcd.ts` (2f–2f → [[−1, 0], [−1/f, −1]]); gouy-phase merged into gaussian-beam; M² < 1 flagged; ABCD elements in the URL; 3 pages tiered.
  - Wave-optics audit part 0 (session 110, `phase-4/wave-optics-audit`, PR #141): 47 untiered pages in 7 reviewer batches, 28 bugs / 13 questionable / 6 OK, 41 `knownIssue`s, 6 stripped descriptions restored; 12 merges decided; fix parts 1–13 planned.
  - Spectroscopy fix parts 1–12b (sessions 97–109, PRs #128–#140): 41/41 tiered, 0 `knownIssue`s; part 12b (`phase-4/spectroscopy-sfg`, PR #140) `sum-frequency.ts` (λ_SFG 452.550 nm, |χ_NR e^{iφ} + Σ A/(ν̃ − ν̃_q + iΓ)|², peak shift √89 − 8 cm⁻¹), blackbody exitance/radiance/band fraction (0.465261 in 380–780 nm at 5778 K), `wavenumber.ts`.
  - Spectroscopy audit part 0 (session 96, `phase-4/spectroscopy-audit`, PR #127): 49 untiered pages in 7 reviewer batches, 27 bugs / 15 questionable / 7 OK, 42 `knownIssue`s, 9 stripped descriptions restored; 10 merges decided; fix parts 1–12 planned.
  - Imaging part 15b denoising and computational imaging (session 95, `phase-4/imaging-denoising`, PR #126): new `denoising.ts` (box 3×3 → 9.54 dB, f₅₀ 0.20978 cy/px; median var exact by quadrature, n = 3 → 1 − √3/π; VisuShrink 4.9953σ at 512²) and `computational-imaging.ts` (SNR₁ 31.404 → 157.02 at N 25; fixed dose 30.015; FPM NA 0.08 + 0.42); imaging 61/61, no `knownIssue`s left.
  - Imaging part 15a registration and stitching (session 94, `phase-4/imaging-registration`, PR #125): new `registration.ts`; RMS displacement 934.0 nm (was 1067), 2-D Fitzpatrick TRE checked by Monte Carlo (3 %), Robinson–Milanfar bound ℓ/(SNR·√N_px); stitching 51 px, 2356², 84.70 %, global error √R_eff (2×2 → 1, 3×3 → √1.5, 5×5 → 1.46σ vs chained 2.83σ).
  - Imaging part 14 light field (session 93, `phase-4/imaging-light-field`, PR #124): new `light-field.ts`; Levoy 2006 Table 1 reproduced (40×/0.95: R_obj 10.59 µm, N_u 11.81, 4.09 / 41.91 µm), defaults 7.5 µm, N_u 5.80, 53.64 µm; plenoptic on Ng 2005 prototype (288², 13×13, ±36 µm, ±6.5 mm → 0.809–1.343 m).
  - Imaging part 13 sensors (session 92, `phase-4/imaging-sensors`, PR #123): `sensor-ccm` merged into `sensor-cmos` (sCMOS/CCD presets, redirect); DR 84.437 dB, SNR 26.41, 2^(−95/6) 1.713e-5, crossover 15.14 °C; `dynamic-range` PRNU 1 % → 77.45; `signal-to-noise` 56.391 with charge/digital binning.
  - Imaging part 12 AO and speckle (session 91, PR #122): `turbulence.ts` gains exact Noll `nollResidual` (Γ-function covariances scaled to 1.0299: Δ₃ 0.1343, Δ₁₅ 0.0279, Δ₂₁ 0.0207; fit 0.02821 at J 15) and Hudgin `dmFittingVariance` (0.28(d/r₀)^(5/3), default 0.040294); new `speckle.ts` (λz/D 21.28 µm, 1.22× first zero, λ(1 + M)N, C = √(1 − e^(−2σ_φ²)) 0.92987 / 0.62727); 2 pages textbook.
  - Imaging part 11 MTF and wavefront (session 90, PR #121): new `diffraction-mtf.ts` (MTF(0.5) 0.39100, cutoff 3.4545 lp/µm, Hopkins OTF(0.5, kW₀₂₀ 2.578) 0.15592, Wiener ½ at H = √NSR) and `wavefront.ts` (Maréchal 0.9060 vs exact defocus 0.9051, σ(S 0.8) 0.0752λ, exact Strehl per Zernike term, PV/RMS per term); `wavefront-error` merged into `strehl-ratio` with a redirect; `integrateSimpson` shared in math.ts; 3 pages tiered.
  - Imaging part 10b field of view (session 89, PR #120): `field-of-view.ts` (sensor/M 0.6668 × 0.5008 mm, 325 nm, IFOV 26.81″/53.63″, λ/(4NA)) + new `telecentric.ts` (Δm/m = −Δz/(s_EP + Δz) = −4.76 %, first order −5 %; DoF 1.68 mm); 3 pages tiered.
  - Imaging part 10a microscope (session 88, PR #119): new `microscope.ts` (f_TL/f_obj, adapter 0.5 → 10×, exit pupil 500 mm·NA/M 0.9375 / 1.25 mm, useful 500–1000·NA, λ/(NA_o + NA_c) 297.3 nm) and `field-of-view.ts` (FN/M 500 µm); `inoueDepthOfField` (dry 40×/0.4 3.84375 µm, 100×/1.4 oil 0.49547 µm) and non-paraxial `quarterWaveDepth` (0.2938 µm); `magnification`, `pupil-matching`, `dof`, `illumination` tiered; dof n is now the immersion index (default 1).
  - Imaging part 9 Gaussian optics (session 87, PR #118): `gaussian-optics.ts`; `working-distance` merged into `image-distance`; `afocal` from the ABCD matrix (EFL 400 mm at 250 mm); `optical-power` two-element eye (Gullstrand 58.635 D, 24 mm → +0.80 D).
  - Imaging part 8 nonlinear and photoacoustic (session 86, PR #117): `srsShotNoiseSnr` δ√(ηPτλ/hc) 6.460 (Ozeki 2009), `mixedFocusFwhm` (SRS 342.69 nm), thin-slab `sfgCoefficient` (Boyd 2.2.10, 4× SHG when degenerate; 452.1739 nm), new `photoacoustic.ts` (p₀ 2.0e4 Pa, μ_eff 15 cm⁻¹, R_A 0.88 v/Δf 271.04 µm, R_L 0.71 v/(NA f₀) 437.36 µm, ICNIRP skin 200 C_A); 3 pages tiered, 23 `knownIssue`s.
  - Imaging part 7 OCT and holography (session 85, PR #116): new `oct.ts` (Δz 0.4413λ²/(nΔλ) 5.6937 µm, l_c = 2Δz, Choma eqs. 9–10 SNR 98.7 dB, V 0.132743, 2v/λ 76.92 kHz) and `holography.ts` (λz/(NΔx) 3.99639 µm, NA 0.06656, in-line z_min 168.8 mm, replay 39.5625 mm, sinc²(π/8) 0.949641); `sinc` in `math.ts`; 4 pages tiered, 26 `knownIssue`s.
  - Imaging part 6 fluorophores and unmixing (session 84, PR #115): new `fluorophores.ts` (8 FPbase FPs, Siano–Metzler bands fitted to FPbase spectra; R₀ EGFP→mCherry 5.05 nm vs 5.11 raw; prefactor 0.021084 nm) and `linear-unmixing.ts` (OLS/NNLS/FCLS, MATLAB lsqnonneg 0/0.6929, sandwich covariance, delta-method shares); multicolor SNR 21.16, hyperspectral 40.0 MiB / 32.0 s; 4 pages tiered, 30 `knownIssue`s.
  - Imaging part 5 fluorescence dynamics and phase contrast (session 83, PR #114): new `fluorescence-dynamics.ts` (V_eff 0.7517 fL, N 22.63, G(0⁺) 1/(N(1−T)) 0.04909, Koppel ε√(Δτ T)/√(1+1/N) 94.87 → 92.84 at N 22.6; Soumpasis γ 0.8946, D 0.1118 µm²/s; Axelrod γ(K 1) 1.0967) and `phase-contrast.ts` (Zernike 0.6445, reversal at tan(φ/2) = a; DIC sin² with bias and stray light); `fcs`, `frap`, `contrast-methods` tiered, 34 `knownIssue`s.
  - Imaging part 4 super-resolution (session 82, PR #113): `super-resolution.ts` gains Mortensen eqs. 5–6 (4.2857 nm LS, 3.6836 nm MLE), Nyquist 2/ρ^(1/D), Legant 61.79 nm, SIM 1/k_c 89.91 nm, raw images 3(2m+1), ExM pre 65.05 / post 62.66 nm (the reviewer's 63.79 follows from no consistent model); `palm-storm`, `structured-illumination`, `expansion-microscopy` tiered, 37 `knownIssue`s.
  - Imaging part 3 light sheet and TIRF (session 81, PR #112): new `imaging/tirf.ts` (d = λ/(4π√…) 110.34 nm, Axelrod I_s/I_p) and `cleared-tissue.ts` (ballistic exp(−µ_t z), paraxial/marginal focal shift); `selective-plane` → `light-sheet` (eff. axial 1.0301 µm); 3 pages tiered, 40 `knownIssue`s.
  - Imaging part 2 confocal (session 80, PR #111): new `imaging/confocal.ts` (scalar paraxial confocal PSF, FWHM table 0–5 AU: lateral 0.3693→0.5145 λ/NA, axial 0.638→0.886, section 0.677 at 0 AU, 0.877 at 1 AU) and `light-sheet.ts`; 4 pages tiered, 44 `knownIssue`s.
  - Imaging part 1 diffraction PSF (session 79, PR #110): new `imaging/diffraction-psf.ts` (Airy via besselJ, r₀ 0.6098 λ/NA, FWHM 0.5145 λ/NA, EE 1−J0²−J1² = 0.838 at 1 AU and 0.588 at 0.5 AU, Debye on-axis sinc² → paraxial sinc²(u/4), NA = 1/(2N)); `airy-disk`, `resolution`, `psf-calculator`, `na-fnumber` tiered, 3 knownIssues removed.
  - Detectors part 9a sensor noise (session 76, PR #107): new `detectors/sensor-noise.ts` (EMVA 1288 Eq. 48 temporal + DSNU + PRNU, PTC crossovers σ_r² and 1/P², seeded unit-rms PRNU map) and `antiblooming.ts` (spill, onset N_b); `photon-transfer` 547.81 e⁻, `uniformity` 547.84 e⁻ (DSNU in e⁻, key `dsnu`), `antiblooming` onset 1.04e6 e⁻.
  - Detectors part 8 camera SNR (session 75, PR #106): new `detectors/camera-snr.ts` (Robbins–Hadwen F² checked against Galton–Watson moments, `cameraSnr`, register-well `emMaxSignal`, DR, C = Nq/V, Δ/√12, S(1 − n·S/W)) + 4 tests; 5 pages tiered; EMCCD DR 120 → 79.1 dB (iXon Ultra 897), F²(100, 604) 1.9750, EMCCD 2.249 vs sCMOS 2.857.
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
