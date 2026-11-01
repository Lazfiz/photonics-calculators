# Roadmap — photonics-calculators

Open work only, in order. The history is in `docs/archive/roadmap-history.md`: the 2026-10-07 review, every finding's
evidence and the logs of sessions 1–40. Don't read it at session start (≈ 50k tokens). `grep -n "<slug>"` it when a task
needs old evidence. When a stage is done, tick it here with one line (session, branch, PR, headline numbers). The detail
goes in the PR description.

## Status (session 178, 2026-11-01)
- Phases 0–1 are done.
- Phase 2: registry, trust data, duplicate merge and lint rules are done; 2-inline-b done (b1–b6, session 156).
- Phase 3 done (3a–3e, sessions 157–161). Phase 5 spot-check done (session 162: 2 bugs in 20 pages). Phase 5w (full
  textbook-tier pass, user choice): 5w-1 to 5w-3 (detectors) and 5w-4 to 5w-6 (imaging) done, 5w-7 and 5w-8 (fiber-optics) and 5w-9, 5w-10 (wave-optics) and 5w-11 (free-space-comms) and 5w-12 (laser-safety) and 5w-13 (materials) and 5w-14 (spectroscopy) and 5w-15 (thin-film + polarization) done (sessions 163–177): 5w is complete; KRS-5
  Sellmeier done (session 178); next the Gemini hero. Phase 4: every page is tiered and imports a tested physics module; the open findings remain.

Model tiers: `npx tsx scripts/tier-status.ts` (add `<category>` to list its untiered pages).

| Category | Tiered | Notes |
|---|---|---|
| laser-safety | 40 / 40 | done (sessions 18, 23, 29–36) |
| thin-film | 45 / 45 | done (sessions 25–28, 54–55); small findings below |
| polarization | 33 / 33 | done: parts 1–4 (sessions 37–42), polarizer-types (session 137) |
| imaging | 61 / 61 | done: part 0 audit (session 78), fix parts 1–15b (sessions 79–95) |
| free-space-comms | 26 / 26 | done: part 0 audit (session 56), fix parts 1–6 (sessions 57–62); open findings below |
| spectroscopy | 41 / 41 | done: part 0 audit (session 96), fix parts 1–12b (sessions 97–109) |
| fiber-optics | 47 / 47 | done: part 0 (session 43), fix parts 1–11 (sessions 44–53); open findings below |
| materials | 27 / 27 | done: part 0 audit (session 124), fix parts 1–9 (sessions 125–136); open findings below |
| wave-optics | 37 / 37 | done: part 0 audit (session 110), fix parts 1–13 (sessions 111–123); open findings below |
| detectors | 54 / 54 | done: part 0 audit (session 63), parts 1–9b (sessions 64–77); leftovers below |
| **total** | **411 / 411** | 0 `knownIssue`s; every category audited |

## Next (Phase 4, in order)
Open findings, one PR each; each claim goes through an adversarial `physics-reviewer` pass against primary literature first.
- [x] **Findings 4b, FSO/comms bugs** (session 139, `phase-4/fso-comms-bugs`): log axes; LO-shot-noise P_req; exact diversity outage.
- [x] **Findings 4c-a** (session 140, `phase-4/findings-4c-leftovers`): scrambler locked-stage average with drive phases;
  wave-optical section beside Wilhelm; vacuum-photodiode measured dark emission + stray C; streak window min(N·p, L)/v.
- [x] **Findings 4c-b** (session 141, `phase-4/findings-4c-b`, PR #172): `intensified-ccd` K_f², Photek phosphor gains, Gaussian spot
  (κ 5.06, N_eff 10.1); default SNR 1.32 → 1.14.
- [x] **Findings 4c-c** (session 142, `phase-4/findings-4c-c`, PR #173): `streak-camera` C16910 defaults (M 2.77, 9.75 µm, 60 ps),
  35 lp/mm blur, `gaussianAllowance` (0.64 ps under < 800 fs); tube 0.8 → 0.5 ps. Imaging/spectroscopy leftovers stay below (features).
- [x] **Findings 4d-a** (session 143, `phase-4/findings-4d-a`, PR #174): `biaxial-data.ts` (Kato KTP, Umemura BiBO); KTP
  modulator V_π 213.6 V (633 nm, 1 mm/20 mm); BiBO cut 168.8° (CASTECH 168.9°). Photorefractive crystals stay open (below).
- [x] **Findings 4d-b** (session 144, `phase-4/findings-4d-b`, PR #175): TIE-19 365–1014 nm (N-BK7 table to 0.05); sourced α for 9 materials;
  sapphire (Archer, θ_D 990 K) and MgO (JANAF) presets; AMTIR-1 Sellmeier, band, dn/dT; NOA 61 within 5e-4 of Norland.
- [x] **Findings 4g-a** (session 145, `phase-4/findings-4g-a`, PR #176): TCSPC train periodic; square lock-in 3f → 0.2122 µV;
  scrambler `combinationLock` + Fourier lattice sum (13/17/30 kHz DOP 0.080756 = brute force).
- [x] **Findings 4g-b** (session 146, `phase-4/findings-4g-b`, PR #177): QKD μ_opt 0.4264 at 29.86 dB; OPA idler 1903.5 W at 3000 nm;
  graded index 10/wave up to 4000 steps (89 µm R 0.2268 %); SERS true max (320 nm equator 4.72); ui-check label.
- [x] **Findings 4d-c-a** (session 147, `phase-4/findings-4d-c-a`, PR #178): DeSalvo 1996 n₂ (5 media, KTP 2.37e-19 m²/W) and β (6 wide-gap,
  edge min(E_g, E′_g)); Si Bristow 2007 (n₂ 1.2e-17 at 1800 nm; indirect 2PA fit 1.839 cm/GW at 1220 nm vs 2.1 ± 0.4).
- [x] **Findings 4d-c-b** (session 148, `phase-4/findings-4d-c-b`, PR #179): Er Barnes 1991 / Yb Melkumov 2004 σ; Brillouin As₂Se₃, As₂S₃, diamond
  (measured g beside the formula); KGW/Ba(NO₃)₂ 532 nm Markevich, As₂S₃ Raman; TeO₂/LiNbO₃ M₂ from US 3,661,441.
- [x] **Findings 4e-a** (session 149, `phase-4/findings-4e`, PR #180): PPLN d_eff 12.4 pm/V (Shoji d₃₃ 19.5 at 1.313 µm); diode g₀ 1200,
  A 4e8, n_g 3.9 (De Koninck 2025, Wenzel 2021; I_th 12.03 mA, radiative share 44 %); injection k_c (1 − R)/(τ_rt√R) 24.51 GHz, α 1.
- [x] **Findings 4e-b** (session 150, `phase-4/findings-4e-b`, PR #181): OPO `bboTypeICut` (Tamošauskas 2018 BBO, θ 22.12°, ρ 3.114°, d_eff 2.068);
  thin-disk Chanteloup 2014 σ, τ 0.951 ms, η_h 1 − λ_p/λ, κ 7 (Chénais 2006); Rh6G Falkenstein 1978, Pavlopoulos 1988, Webb 1970.
- [x] **Findings 4f-a** (session 151, `phase-4/findings-4f`, PR #182): `useURLState(key, def, { min, max })` clamps; codemod gave 671
  bindings / 127 pages their field range; one `sinc` (9 files; no `erf` copies left); search needs every word to match.
- [x] **Findings 4f-b** (session 152, `phase-4/findings-4f-b`, PR #183): ranges on `blue-light-hazard`, `uv-exposure` (8 h), `wdm-coupler`
  (≤ 96 channels, ≤ 20 nm), `nonlinear-effects`, `dispersion-map` (λ field), `bpsk-qpsk`, `multi-core` (20 bindings); the other 50 were already guarded.
- [x] **Findings 4f-c** (session 153, `phase-4/findings-4f-cd`): all 56 materials, imaging, detectors, spectroscopy bindings were already guarded.
- [x] **Findings 4f-d** (session 153, `phase-4/findings-4f-cd`): stack indices 1–5 on 5 thin-film pages, design λ 100–20000 nm, film ≤ 20 µm,
  Poincaré θ 0–180°, Gires–Tournois λ and span ≤ λ (24 bindings on 7 pages); the other 35 were already guarded.
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
- [x] **Golden tests for every page** (session 154, `phase-4/golden-inline`): traffic (31 days, Hobby limit) was 6 visitors, too
  thin to rank, and 408/411 pages already ran on tested modules. The last 3 moved to modules: `dispersion-map` (on
  `dispersion-comp`), `power-density` (new `laser-safety/power-density`), `polarizer-extinction` (new; Mueller cross-check).

## Open findings (evidence; fix during that category's audit)
**Fiber optics**
- `photonic-crystal`: confinement loss isn't modelled (it needs the ring count N); an empirical fit could add it. The Saitoh–Koshiba fit is ≈ 20 % off the multipole D for Λ ≤ 1 µm.
**Materials**
- `raman-scattering` (session 162): no sourced UV edges for KGW, Ba(NO₃)₂ (pump input goes to 200 nm); the header calls the
  diamond gain linear in 1/λp, but the Savitski points aren't (42/41 at 532/670 nm).
- `x-ray-optics` (session 136): β is photoabsorption only (Henke f₂); CXRO adds Compton (Be +28 %, C +6 % at 10 keV). Hubbell's
  incoherent scattering functions could add it. Range 1–30 keV (Henke tables); Al, W, Ge filters/targets not in the presets.
- `polymer-optics` (session 136): dropped PDMS (Schneider 2009 Sylgard 184 fit 1.431 vs Zhang 2020 1.397 at 550 nm), CYTOP, OrmoComp
  and all loss, T_g, dn/dT and stress-optic data (unsourced). NOA 61 checked (session 144) against Norland's archived sheet.
- `thermal-expansion` (session 144: every α sourced): conventions are mixed (glasses: mean over a range; Kaye & Laby/NIST: 293 K).
  Invar is an endpoint fit slope (± 20 %). The table is page data without a test. No α(T) model (Okada & Tokumaru 1984 for Si).
- `thin-film/environmental-stability` (session 135): the H-layer (TiO₂ film) dn/dT 20 and α 8 × 10⁻⁶/K defaults are unsourced
  placeholders; free-film expansion ignores the substrate constraint and Poisson term. Peck's n and Eₐ (≈ 2.7, 0.79 eV in
  secondary sources) are unverified: the IRPS PDF 403s, so the page defaults to n = 0.
- `heat-capacity` (session 144: + sapphire, MgO): MgF₂, ZnSe, BaF₂ and fused silica have no cited θ_D. GaAs: Crystran's 360 J/(kg·K)
  exceeds 6R/M = 345 (Blakemore 1982 ≈ 327, unread). Diamond: θ_D 2250 K gives 266 vs 502 J/(kg·K) at 273 K. `damage-threshold` and `radiation-damage` have user inputs, no presets.
- `electro-optic`, `photorefractive` (session 143: KTP added): BaTiO₃, SBN, BSO and LiTaO₃ are still out. BaTiO₃ unclamped r₁₃ 8,
  r₃₃ 105, r₄₂ 1300 pm/V at 633 nm (Zgonik 1994 PRB 50, 5941, quoted in Petraru's thesis, `kups.ub.uni-koeln.de/1050/1/thesis_petraru_final.pdf`
  Table 2.2) needs ε and an r_eff(β) geometry on the photorefractive page; LiTaO₃ has only a vendor r₃₃ (Crylink 30.4, no r₁₃ or λ;
  Casson 2004 JOSA B is paywalled, OSTI refuses connections). Whether KTP's r (Cheng 1994) are clamped is unstated. Wilson & Hawkes
  Table 3.1 was read through a FOSSEE notebook; its edition is still not cited (git.fossee.in returned 502; HAL needs a browser).
- `nonlinear-crystals` (user decision, session 130: lean SHG page): CLBO, KTA, AgGaS₂, ZGP, GaSe and OP-GaAs and the walk-off,
  acceptance and damage columns were dropped (no downloadable source; CASTECH/findlight PDFs return HTML). OP-GaAs QPM
  d_eff ≈ 69 needs d₁₄ ≈ 94 pm/V (Skauli, unread). d_eff spread: KTP d₂₄ 3.9 (EKSMA) vs 3.64 (United Crystals); LN d₃₃
  25.0 (Shoji, read via WebFetch of the Optica page) vs 27–34 (vendors). BiBO n and cut now from Umemura 2007 (168.8° vs CASTECH 168.9°).
- `rare-earth-absorption` (+ `rare-earth-doped`, `fiber-amplifier`; session 148: Er Barnes 1991 Table V/Fig. 6(c), Yb Melkumov 2004):
  Er 1480/1550 nm σ are read off a figure (±0.15e-25 m², scale ±20 %). Nd, Tm, Ho still out. `color-centers`: F(KCl), Ti:sapphire, ruby and SiV⁻ dropped (no open
  source read); LiF F₂/F₂⁺ have no cited σ.
- `nonlinear-index` (session 147: + DeSalvo 1064 nm rows, Si at 1800 nm): GaAs, AlGaAs, CS₂, air, chalcogenide and SF glasses still out
  (Sheik-Bahae 1991 JQE has no open copy; CREOL hosts only the 1990 PRL, figures only). DeSalvo calcite dropped: Table II n 1.59 fits neither axis.
  Candidates: Dinu 2003 / Bristow 2007 (Si), Sheik-Bahae 1991 (semiconductors), Milam 1998 (silica 1064 nm).
- `brillouin-scattering` (session 148: + As₂Se₃ Abedin 2005, As₂S₃ Pant 2011, diamond Bai 2020): diamond's p² 0.0153 has no stated
  convention (standard p_eff² ≈ 0.0036 would give 4× less than measured). SMF-28/Ge-doped have only measured g (Niklès 1997);
  tellurite only M₁; Bi₂O₃ and PMMA second-hand. Candidates: Ogusu 2004 JOSA B, Kobyakov 2010.
- `raman-scattering` (session 148: KGW/Ba(NO₃)₂ 532 nm Markevich 2016, As₂S₃ Stegeman 2006): the 1064 nm KGW/Ba(NO₃)₂ gains are EKSMA
  vendor values and disagree with 1/λ_p from 532 nm by ≈ 2×. CS₂/benzene have only calculated g (Grun 1969) with Clements &
  Stoicheff linewidths; doped silica, water and KYW (no gain) still out. As₂S₃ below 650 nm is flagged, not cut.
- `low-water-peak` (session 132): the 1246 and 2212 nm OH combination bands are listed without a strength and not
  modelled (Humbach 1996 Table is paywalled; no open source found). Band widths are assumed (30 nm at 1383 nm, same in
  wavenumber elsewhere). The 1383 nm 62.7 dB/km/ppm is Humbach as quoted by arXiv:2303.17814.
- `two-photon-absorption` (session 147: + DeSalvo wide-gap rows, Si indirect fit): BK7, CS₂, water still out. DeSalvo E′_g scaling
  is order-of-magnitude off the measured λ (BBO 355 nm 0.076 vs 0.010); KTP at 520 nm gives 4× its 532 nm β (x_ref at the edge).
- `infrared-glass` (session 144: AMTIR-1, As₂S₃ from AMI's archived sheets): ZBLAN has no sourced band, dn/dT, conductivity or
  hardness (only reseller pages found); AMTIR-1's single dn/dT is 2× low below 1.5 µm. Gan's ZBLAN formula gives n_d 1.5011, the audit's
  1.499 is unverified (Gan 1995 is paywalled). Crystran's fused-silica "1.47012 at 4 µm" is n at 0.4 µm (Malitson).
- `crystal-properties`: old quartz-crystal and sapphire-properties links land on the calcite default (a redirect can't add
  `?crystal=`). `birefringent-crystals`: KDP type-I SHG 41.21° at 1064 nm is checked against the Dmitriev handbook value
  (≈ 41°) from memory, not a downloaded source.
- `acousto-optic` (session 148: TeO₂ and LiNbO₃ from US 3,661,441 Tables 1–2): PbMoO₄ and silica are Isomet vendor values (Jog 1957
  p₁₂ 0.237 would give silica M₂ 1.15e-15). Ge (Fox 1985 180e-15, v not given) and GaP still out.
- `magneto-optic`: the CeF₃ fit (Vojna Table 1) stops at 700 nm (39.5 against 46.3 rad/(T·m) measured at 1064 nm); Vojna’s
  Ce:TAG, TSLAG, Ho₂O₃ and Pr/Ho:TGG fits don’t reproduce their own tabulated values, so they are left out.
- `photoelastic`: the Schott sheet doesn’t state the wavelength of K, so the page claims none.
**Wave optics**
- `optical-parametric-oscillator` (session 162): L_eff = min(L, l_a) for walk-off; Boyd–Kleinman 1968 (doi:10.1063/1.1656831)
  low-gain scaling ∝ L·l_a (reviewer, from memory) would cut P_th ≈ 10× at defaults. Read BK §2 h(B, ξ) before changing.
- `injection-locking` (session 149): k_c is estimated as (1 − R)/(τ_rt√R) (Kondratiev 2023 Eq. 4; Kondratiev's B/A normalisation unread);
  α 1 is Berger et al. CLEO 1991 (conference abstract, below-threshold?); a journal α (Banerjee et al. APL 58, 2198 (1991)) unchecked. `four-wave-mixing`: no fiber loss in the gain (lossless OPA).
- `slow-light`: one isolated Lorentzian, no pulse distortion or saturation (a warning shows when the signal is wider than the line).
  Old `/wave-optics/interferometer?wavelength=633` links land on michelson-interferometer's µm input (clamped to 50 µm).
- χ⁽²⁾ pages (session 149): d_eff 12.4 pm/V from Shoji Table 10 (read on the Optica abstract page); Miller's rule gives ×0.87 for the
  3.39 µm idler (Shoji: Miller Δ not constant, so not applied). `optical-parametric-oscillator` (session 150): BBO type I only
  (d_eff from EKSMA d₂₂/d₃₁ at 1064 nm, no Miller scaling; d₃₁ sign taken as adding); no KTP/LBO/PPLN presets.
- `dye-laser-resonator`: (session 150) σₑ(590) 1.1e-16 cm² is read off Falkenstein 1978 Fig. 6 (±0.05);
  σ_T is a 77 K-glass value (no room-temperature liquid ε_T found); τ_T 0.25 µs is air-saturated (no degassed/COT value found). `gas-laser-resonator`: g₀ 0.15 /m and I_sat 25 W/cm² come from one
  HeNe course report (Ng et al. 2015); no sourced g₀/I_sat for Ar⁺ or CO₂, so the line buttons set λ only.
- `diode-laser-resonator` (session 149): hybrid set (De Koninck g₀/N_tr/B/C, Wenzel A/n_g); De Koninck's g₀ is Tsvid's dg/d ln J used as
  is (≈ 1750/cm in the N law); η_i·share 35 % vs Tsvid's 40–54 %. Coldren's gain tables have no open copy. Session 171: the
  log-gain cap g/g₀ ≤ 3 (N ≤ e³ N_tr) is a judgement, not a sourced fit range (Coldren, McIlroy paywalled; WIAS 2002 gives
  only N > 2.5e18); diode and dye modelNotes are ≈ 470–560 characters.
- `dye-laser-resonator` (session 171): τ_eff (erfcx closed form) is our own small-signal derivation; no textbook defines the jet
  transit time precisely (Hollberg 1990 gives only the regime). The slope uses Laporta–Brussard's near-threshold overlap.
- `thin-disk-laser` (session 150): Chanteloup's σ_e values are literature (Fan 2007, Brown 2005), σ_a measured; κ 7 is 8 at.%
  while the default doping is 10 at.% (Beil 2010 via Koerner 2012 Table 4: 5.7 at 12 at.%). Nd heat fraction 0.32 (Fan 1993,
  doi 10.1109/3.234394, paywalled) is still unsourced where it's used.
- Session 172 (5w-10, unverified, from memory): supercontinuum "N > 16 = MI-dominated" threshold and the 835 nm PCF defaults
  (Dudley 2006 Fig. 3; the femto-st PDF link is dead); DW cubic uses P₀, not the ≈ 4× ejected-soliton power. `q-switched-laser`:
  r is the input, so the Degnan optimum coupling can't show; a g₀l input would. `thin-disk` "heat higher below threshold" and
  `slab-laser` 0.32 heat fraction (Fan 1993, non-lasing?) unsourced. `ring-cavity` Siegman ch. 11/21 unchecked. `injection-locking`
  stable band at weak injection (Henry–Olsson–Dutta 1985, Mogensen 1985 Fig. 2) unchecked. `soliton` default T₀ 57 fs sits at the
  edge of Raman-free NLS. Kerr-lens title "Kerr Lens Mode Locking" while the page computes only the lens.
**Free-space comms**
- `aperture-averaging`: only the Gaussian aperture is modelled; a hard circular aperture gives a 5–11 % lower A at d² = 1–30 (two reviewers' quadrature),
  crossing near d² ≈ 100 and → 1.13× as d² → ∞ (checked in session 173 with GR 6.574.2). The page states this; a hard-aperture option could add it.
- `beam-wander` (unverified): 2.42 Cn²L³W₀^(−1/3) uses the exit radius W₀ in the large-scale filter; with diffraction W(z) the factor is
  3∫ξ²(1 + (ξL/z_R)²)^(−1/6)dξ (0.90 at the defaults, 0.49 at L/z_R = 12). Check Andrews & Phillips 2005 §6.5 for a near-field condition.
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
- 5w-15 (session 177), unverified or deferred: Benjamin–Weaver τ prefactor k (0.2–1 in reviews, code k = 1) unchecked against
  the 1960 paper; Fabry-Perot chart at R = 0.999 has ≈ 2.6 points per FWHM (20 000 cap); gradient-index lacks Southwell's quintic;
  plasma sweep starts at 0.3 mTorr (input 0.1); hard-coating Γ ignores mode mixity.
- `thermal-evaporation` (low): T_m for Ni, Ti and Pd is 1726, 1930 and 1825 K against CRC's 1728, 1941 and 1828 K
  (unchecked against Alcock's table).

**Free-space comms**
- `point-ahead` (low): the "≈ 18 µrad for GEO" chapter quote and eq. (8.4) in `point-ahead.ts` are unread (the 17.4 µrad value is derived).
- `DB_PER_NEPER` (low): 4.343 dB per power e-fold is called a neper; ISO 80000-3 has 1 Np = 8.686 dB. The atmospheric-loss page now says km⁻¹; other pages still use the name.
- `snow-attenuation` (low): the sources never define S (read as water-equivalent), and the 2005 ICTON origin of the law
  is unverified (joanneum PDF is an HTML wall). Check Awan et al. WOCN 2009 / ICTON 2005 in Chrome; tier could drop to illustrative.
- `geometric-loss` (low): the top-hat law (d_t + θR) is cited to Kim & Korevaar, SPIE 4530, 84 (2001) by DOI only; full text
  unread. Confirm in Chrome, or cite Ghassemlooy et al., Optical Wireless Communications (CRC 2019, doi:10.1201/9781315151724).
- `background-noise`, `receiver-fov` (low): sky radiances are Giggenbach 2022 Table 1 typical values (×10 spread), 850–1550 nm only, log-log across the 1.13/1.38 µm water bands; no night sky or Moon (his Moon row is ≈ 10× E_sun·albedo/π at 850/1064 nm). A sourced sky model (MODTRAN tables, ITU-R P.1621) would extend it.
- `receiver-fov` (low): field-stop clipping of the signal and turbulence spot growth (λ/r₀) are not modelled; only a 1.22λ/D warning.
- `channel-capacity` (low): the 3.8×10⁻³ pre-FEC default for 7 % HD-FEC is not checked against the ITU-T G.975.1 text (input, labelled typical).
- `acquisition-tracking` (low): Tyler & Fried NEA (3π/16)(λ/D)/SNR read from the JOSA 72, 804 abstract only; "rms per axis" is unconfirmed in the full text.
- `quantum-key-distribution` (low): asymptotic decoy BB84 only (no finite-key or intensity fluctuations); Y₀ capped at 0.01 because eq. (10) drops −Y₀(1 − e^(−ημ)).
- `point-ahead` (low): the LEO preset uses orbital velocity alone (as the cited chapter does); station rotation lowers it by ≈ 3 µrad.
- `optical-antenna` (low): M² is capped at 2 (θ × M², gain / M⁴). A Gaussian Schell-model far field would cover multimode beams.

**Imaging (session 166, unverified or deferred)**
- `adaptive-optics`: zonal κ_continuous 0.28 (Hudgin 1977); some tables give ≈ 0.23 for Gaussian influence functions (reviewer, from memory).
- `computational-imaging`: registry "0.08 + 0.42 = 0.5" synthetic NA (Zheng 2013): the 0.42 illumination NA not checked in the paper.
- `fcs`: SNR uses G = 1/N and ignores the triplet amplitude (≈ 9 % at defaults, within Koppel's estimate).
**Imaging (session 167, unverified or deferred)**
- `mtf`: high-NA defocus is only warned about; an exact-phase OTF (reviewer's scalar quadrature: Strehl 0.27 vs paraxial 0.555
  at NA 0.95, Δz 0.5 µm) is not modelled.
- `photoacoustic`: diffuse build-up factor k ≈ 2–5 (Jacques, from memory) is described but set to 1.
- `low-coherence`, `optical-coherence`: SNR prefactors ρP/(2eB) and ρPΔt/(2e) not checked against Choma 2003 eqs. 9/10 (PDF unread).
- `plenoptic-camera`: "12 usable pixels" and "prototype reached about half" (Ng 2005 tech report) unverified.
**Fiber optics (sessions 169–170, unverified or deferred)**
- `photonic-crystal`: Marcuse step-index MFD fit with V_SK vs Nielsen et al. OL 28, 2309 (2003) PCF fit (from memory: 6.69 vs 5.08 µm
  at the defaults; NKT LMA-5 ≈ 4.1 µm agrees with the page). Read the paper before changing. Mortensen OL 28, 1879 DOI unchecked (429).
- `fiber-optic-sensor`: K_T 9.56 pm/K (Cosme 2026) vs ≈ 10–13 pm/K in Kersey-era texts (from memory). `rare-earth-doped`: preset σ
  (Er 1480, Yb 976) unchecked against Barnes Fig. 6(c) / Melkumov App. 2. `splice-loss`: air-gap Fresnel loss (≤ 0.59 dB) not
  included (`gapEtalonTransmission` exists); the page says so. `nonlinear-effects`: SBS card is narrow-CW only (no K/linewidth option).
- `dispersion-shifted`: G.653/G.655 preset values (S₀ ≤ 0.085; G.655.C 1–10 ps/(nm·km)) not read in the Recommendations.
- `fiber-bragg-grating-sensor`: the ±50 K linear K_T range (Cosme 2026) unverified. `fiber-amplifier`: preset σ vs Barnes
  1991 Fig. 6(c) unverified. `dispersion-comp`: Agrawal §2.4.3/§5.4.4 numbers are 4th-edition; 5th-ed DOI 10.1002/9781119737391.
- `fiber-characterization`: "fibre cutoff (G.650.1) below theoretical LP11" from memory; the card now says theoretical.

**Imaging (session 168, unverified or deferred)**
- `spinning-disk`: crosstalk through neighbouring pinholes (the pitch) is not modelled; the pitch in AU is shown only.
- `three-photon`/`two-photon`: Zipfel's NA^0.91 lateral fit is used up to NA 1.7; its validity range is unchecked (abstract only).
- `stimulated-raman-microscopy`: the 10 cm⁻¹ "typical Raman line" warning threshold and SNR = δ√N as Ozeki 2009's form are from memory.
- `shack-hartmann` "Akondi & Dubra 2021 eq. 2" and `sensor-cmos` "EMVA 1288 Eq. (11), (48)" numbers not read in the sources.
- `super-resolution`: one wavelength input for STED (excitation) and PALM (emission); a separate STED λ would be cleaner.

**Imaging / spectroscopy** (found in the detectors part 0, session 63)
- Spectroscopy part 11 (session 107): `infrared-spectroscopy` has no Herman–Wallis factor or absolute band strength; `electron-spectroscopy` graphite ρ 2.2 (SRD 71 table value) vs 2.26 g/cm³ crystal; LHM water ε₂ = 3.52 + 7.52θ kept (fits Table I with RMS 0.43, against 0.49 with −), and the page allows only −5 to 40 °C.
- 5w-14 (session 176), unverified: `spectral-calibration` Hg lines labelled NIST ASD may be Sansonetti, Salit & Reader 1996 (doi:10.1364/AO.35.000074, ≈ 1 pm); `sum-frequency-gen` water preset gives 3200 and 3400 the same sign (Ji 2008 shows a positive 3200 band, later HD-SFG does not; amplitudes illustrative).
- `spectroscopy/conc-mirror` and `jacquinot` (session 104) both show the Jacquinot ratio π f/(h tan θ) from `throughput.ts`;
  conc-mirror adds the mirror cone and slit étendue. Merge into jacquinot only if the user asks.
- Imaging part 8 (session 86): `photoacoustic` applies only the single-pulse and ≥ 10 s skin limits (`pulse-train.ts` has no skin rules); `sum-frequency-microscopy` withholds the power for L > b (no non-degenerate Boyd–Kleinman); SRS δ is an input (no cross-section model).
- `streak-camera` (session 142): M taken equal on the time axis (no source); the data-sheet allowance holds only at the
  spec's sweep (C16910 fastest range factory-set 60–80 ps; at 80 ps it is 0.48 ps, under the 0.5 ps default).
- `intensified-ccd` (session 141): the gain sweep holds the data-sheet K_f down to unity gain (noted on the page).
- `imaging/fluorophores.ts` (session 84): log-normal bands are exactly 0 past their anti-Stokes cutoff (EGFP emission below 480 nm, mCherry excitation above 622 nm), so tail-only bleed-through reads 0; sampled FPbase spectra would fix it. Disclosed on the pages.
- 5w-1 (session 163), not fixed: `cosmic-rays` `poissonQuantile` ≈ 13 ms per call at the max inputs (μ ≈ 1.7e9), ≈ 0.7 s per render;
  `camera-snr.ts` 604 register stages are the CCD201 (iXon 888), the page models an 897 (CCD97, unverified count; F² changes < 0.2 %);
  `detectivity` D* uses the entered I_d at any area (no current density or R₀A); `em-gain` has no conventional-amplifier read-noise input.
- 5w-2 (session 164), not fixed: `linear-mode-avalanche` default bulk I_d 50 pA = total/M (upper bound; C30902EH noise-current spec
  unchecked, ≈ 1.5 pA from memory, M_opt ±3 %); `photodiode-speed` models no diffusion tail (Si 850 nm: 1/α 19 µm > W 10.5 µm);
  `gain-temperature` scales the Miller curve with V_br (shift model differs 8 %); `pmt` Hamamatsu eq. numbers unverified.
- `detectors/gain-temperature` PMT branch: the −0.3 %/°C default is an entered value; source a typical dynode-gain coefficient in part 7 (Hamamatsu handbook §13.1.1 gives no number).
**Detectors (session 165, unverified, sources unreachable)**
- `vacuum-photodiode`: S-20 dark emission 0.4 fA/cm² (Burle Table I); a reviewer recalled 0.3 (from memory). `streak-camera` note:
  transit-time prefactor 2.63·√Δε/E ps (Shakya & Chang 2005); first principles √(2m_eΔε)/(qE) give 3.37 ps. Note text only.
**Polarization**
- 5w-15 (session 177), unverified: optical-activity 34.614° (NIST SRM 17e) vs ICUMSA 100 °Z 34.626° (from memory); wire-grid uses DC σ at
  10.6 µm (Al ωτ ≈ 1.4, disclosed); Goldstein *Polarized Light* cited 2011, Crossref dates the DOI 2017; Cloude 1986 has no DOI.
- `polarization-scrambling` (session 140): near-locked (not exactly locked) stages still use the product of means; only p, q ≤ 4 get a
  beat-period warning (5:7 detuned 0.1 % gets none), and a 1e-9 lock tolerance makes the DOP jump at exact lock.

**Laser safety** (optional)
- A scanned-lidar mode on `lidar-safety`.
- Re-check the classes when IEC 60825-1 Ed. 4 is published (only a BSI draft in 2026).
- Session 174 (deferred): ICNIRP Table 5 note c (peak of a beam < 1 mm for t < 0.35 s) is applied only to the medical
  page's focus OD (`requiredOpticalDensity(…, { actualExposure: true })`); other pages average over 1 mm. `diffuse-reflection`
  only warns inside 10 spot diameters; the on-axis disk ρP/(π(r² + a²)) would fix the near zone. Outside 400–1400 nm the
  pages assume 10 s with a note (ICNIRP p. 285: the longest exposure expected). Unverified: the TRT shape factors
  (/27 sphere, 3/16 layer) against Anderson & Parrish 1983; the ANSI differences quoted from Schulmeister 2017 on
  `ansi-iec-comparison`; ICAO Doc 9815 levels and EN 207 test conditions (from memory).

**Codex review 2026-10-24** (each reproduced in session 144 with the repo's functions; golden cases for the tests)
- Fixed in 4g-b (session 146). Leftovers: the OPA page's linear-GVM spectrum can run past degeneracy ν_p/2 when |δ_si| is tiny,
  and its default δ_si (−97.7 fs/mm) is for 1550/3393 nm; graded-index spectra take ≈ 0.35 s at the 4000-step cap.
- Leftovers of 4g-a (session 145 review): scrambler relations above order 12 count as incommensurate (11/13/24 kHz at
  Γm 10: 4.4e-3 off; negligible at the J₀ zero); lock-in f_s = 2f_r ties the 1f and 3f beats at one Δf (coherent sum
  0.6–1.2× the shown envelope); `periodicDecay` takes up to ≈ 7e4 terms per chart point when σ ≫ T (could return Σαᵢτᵢ/T).

**Cross-cutting**
- `ui-check` (session 158): 9 checks fail on production too, stale since the pages changed: boxcar `pulseWidth` min is now
  0.01 (checks want "Min: 10"); gas-laser-resonator 'Wavelength (nm)' / 'Tube Length (mm)' labels not found; the
  `probeWavelength` slider page doesn't write the URL as expected. Update the checks to the current pages.
- Initial JS (session 158): thin-film metal pages (enhanced-aluminum, protected-silver, emissivity-control, heat-mirror)
  carry 24–28 KB gz of their own JS, likely n,k tables in the client chunk; the median page carries 14 KB.
- Charts (session 159): many pages wrap ChartPanel in their own bordered
  `p-4` box: double padding leaves a 245 px plot at 360 px.
- Charts (session 160): the PNG/CSV row adds ≈ 32 px above every SVG chart, including those whose page already prints a
  heading above the ChartPanel. Plotly-routed charts (heatmap, 3-D, polar) have Plotly's own hover but no export buttons.
- `ui-check` can't hydrate a page that has no `<input>` (`optical-glass-catalog`; `jones-calculus` until an element is
  added).

## Phase 2 — architecture (open)
- 2-inline-b: formulas inside page component bodies. `scripts/inline-inventory.ts` lists ≈ 550 math lines on 248 pages
  (after deg↔rad and log10 lines); ≈ 80 % are wiring and stay inline: log-spaced chart axes, √N or quadrature sums of
  module outputs, π multiples for display, demo signals, circle areas, 2^bits. The rest are 6 repeated families:
  - [x] b1 (session 156, PR #187): see Done.
  - [x] b2 (session 156, PR #188): see Done.
  - [x] b3a (session 156, PR #189): see Done.
  - [x] b3b (session 156, PR #190): see Done.
  - [x] b4 (session 156, PR #191): see Done.
  - [x] b5 (session 156, PR #192): see Done.
  - [x] b6 (session 156, PR #193): see Done. Inventory after b1–b6: 680 lines on 293 pages, all stay-inline classes.

## Phase 3 — graphics & performance
One box per session, in this order.
- [x] 3a Plotly partial bundle (session 157, PR #194): see Done.
- [x] 3b Initial JS and URL-state flash (session 158, PR #195): see Done.
- [x] 3c Chart layout (session 159, PR #196): see Done.
- [x] 3d Chart interaction (session 160, PR #197): see Done.
- [x] 3e Speed Insights and JS budget (session 161, PR #198): see Done.

## Phase 5 — after Phase 3 (user plan, session 156)
- [x] Spot-check (session 162, `phase-5/spot-check`, PR #199): 20 pages, 2 bugs (TIA noise, SIM note), both textbook tier.
- [x] KRS-5 Sellmeier (session 178, `phase-5/krs5-sellmeier`, PR #215): see Done.
- [ ] Last: replace the home-page hero with the one the user made in Gemini, and wire it in (ask the user for the files).

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
- KRS-5 Sellmeier (session 178, `phase-5/krs5-sellmeier`, PR #215): Rodney & Malitson 1956 Table III (25 °C, 0.577–39.38 µm) in
  `MATERIALS.krs5`, checked to 1e-5 against Table IV (2.37069 at 10 µm); window pages and chromatic-dispersion now use it.
- 5w full textbook-tier pass (sessions 163–177, PRs #200–#214): every textbook-tier page reviewed against primary literature.
  - 5w-15 thin-film + polarization (session 177, `phase-5/5w-15-thin-film-polarization`, PR #214): 24 pages, 4 bugs: depolarization
    Γ₀ at λ₀ not 1/σ₀ (2.8° → 0.6°), Kirsch image aliased (pixel-averaged now), environmental-stability and wedge-film spectra missed λ₀;
    heat-mirror T 200–600 K; ≈ 15 chart ranges/markers, Stoney warnings, FP exact FSR, wedge default n_f 2.35.
  - 5w-12 laser-safety (session 174, `phase-5/5w-12-laser-safety`, PR #211): 20 pages, 2 bugs: enclosure-class classed a beam
    clipped by the opening at its full width (1M for 3B; new `escapingBeam`), retinal-hazard's verdict ignored the anterior
    segment (binds from ≈ 1.3 µm); sub-ns cornea ≤ 10 % of the 1 ns limit (ICNIRP p. 287) in `pulseLimits`; note c on the
    medical focus OD (4.60 vs 2.91); 0.25 s / 10 s re-cited to ICNIRP p. 285; defaults (classification 20 mW, research-lab
    300 mW, atmospheric 1064 nm); chart ranges on 5 pages.
  - 5w-11 free-space-comms (session 173, `phase-5/5w-11-free-space-comms`, PR #210): 17 pages, 1 bug: AO servo-lag variance
    uncapped (AO "worse than none" below f_G; now ≤ open-loop); geometric-loss Gaussian keeps the exit aperture; QKD optimal-μ
    reach (142.21 km) and loss axis at α = 0; rain L ≤ 5 km (P.1814-1 PDF checked); chart spans and markers on 14 pages; 1176 tests.
  - 5w-10 wave-optics 2/2 (session 172, `phase-5/5w-10-wave-optics`, PR #209): 16 pages, 1 bug: supercontinuum DW from the full
    cubic β₂Ω²/2 + β₃Ω³/6 = γP₀/2 (745 vs 910 nm at old defaults; defaults now Dudley's 835 nm PCF, N 8.65); slow-light resonance
    signal in MHz; 13 pages got validity warnings or text fixes; Kerr waist 30 µm; 1173 tests.
  - 5w-9 wave-optics 1/2 (session 171, `phase-5/5w-9-wave-optics`, PR #208): 16 pages, 3 bugs: diffraction-integral on-axis value
    called exact (now Rayleigh–Sommerfeld, Heurtley 1973), FEL negative L_sat shown "saturated", gas-laser confocal banner; 7 defaults
    changed (abcd, chirped, DFG w 150 µm, FWM seed, FEL L_u 15 m, gas bore 3.2 mm, HG TEM₂₁); diode log-gain cap 3. Source check:
    dye τ_eff erfcx + Laporta–Brussard slope (P_out 0.43 → 0.64 W), attosecond Lorentz-drift flag (Klaiber 2008), filament
    clamp 4e13 (Kasparian 2000), gaussian-beam Gouy text (sed-garbled in 98a54033) rewritten.
  - 5w-8 fiber-optics 2/2 (session 170, `phase-5/5w-8-fiber-optics`, PR #207): 21 pages, 3 bugs: photonic-crystal V/guidance
    outside d/Λ 0.2–0.8, wdm-coupler (dead selector, echoed isolation; new `wdm-channel-plan.ts`, tier illustrative), nonzero-dispersion
    λ0 out of band; elasto-optic on by default on macro-bending-loss and mode-field-diameter; 14 chart ranges; 1167 tests.
  - 5w-7 fiber-optics 1/2 (session 169, `phase-5/5w-7-fiber-optics`, PR #206): 20 pages, 4 bugs: chromatic-dispersion penalty ignored a
    narrow source (now √(σ² − σ₀²)), dispersion-comp no limit at σ_λ 0 (optimum-pulse σ_b), fiber-bandwidth SMF < 1260 nm,
    fiber-amplifier > 25 dB unwarned; elasto-optic R/(1 − p_e) on bend-insensitive; 1163 tests.
  - 5w-6 imaging 3/3 (session 168, `phase-5/5w-6-imaging`, PR #205): 17 pages + airy-disk/sensor-cmos findings, 4 bugs: speckle contrast
    ignored N_c (Rician with N_c, MC-checked), multicolor lasers cancelled (new sequential spillover), SRS δ unbounded (NaN at δ ≥ 1), THG interface claim
  - 5w-5 imaging 2/3 (session 167, `phase-5/5w-5-imaging`, PR #204): 18 pages, 1 bug: mtf default NA 0.95 past paraxial W₀₂₀
    (now 0.4 + warning); light-field DOF N_u ≥ 1, plenoptic overlap 2p − D, high-NA widefield first zero; 1160 tests.
  - 5w-4 imaging 1/3 (session 166, `phase-5/5w-4-imaging`, PR #203): 18 pages, 1 bug: digital-holography NA was paraxial
    NΔx/2z (6.66 at 1 mm), now sin(atan) capped at λ/(2Δx) (`hologramEffectiveNA`); DR uses FW − D; ~25 minor fixes, 1159 tests.
  - 5w-3 detectors 3/3 (session 165, `phase-5/5w-3-detectors`, PR #202): 15 pages, 0 bugs; SINAD/ENOB include ADC quantisation
    (`sinadWithQuantizationDb`), saturation 12-bit default, thermal-noise Planck warning, sweeps follow inputs, 1158 tests.
  - 5w-2 detectors 2/3 (session 164, `phase-5/5w-2-detectors`, PR #201): 16 pages, 0 bugs; Hooge flicker defaults (corner in band),
    Si hole v_sat default (Jacoboni 1977), photon-transfer crossover with K²/12, QE flat-top range and InGaAs L = 0, 1155 tests.
  - 5w-1 detectors 1/3 (session 163, `phase-5/5w-1-detectors`, PR #200): 16 pages, 0 bugs; boxcar optimum from B (`optimalGateWidth`),
    ADC g/√12 (`quantizationNoiseElectrons`), E_g(T) default on cooling/dark-noise (fixed 1.12 eV understated Si ×1.5), 1152 tests.
  - Phase 5 spot-check (session 162, `phase-5/spot-check`, PR #199): 20 pages; `photodiode-tia-noise` now weights noise by the
    Butterworth |H|² up to B (`tiaFilteredNoise`; default 1.468 → 2.605 nA), SIM gap note at k₀ > 2k_c (`simSupportHasGap`);
    5 minor fixes. Both laser-safety reviewer claims refuted by ICNIRP 2013 Table 5. 1148 tests.
  - Phase 3e (session 161, `phase-3/speed-insights`, PR #198): `<SpeedInsights />` in the root layout (+3.5 KB gz shared);
    CI step `initial-js.mjs --max-shared 150 --max-page 32` (now 145.4 KB shared, page median 11.9, max 27.9); `ChartReserve`
    placeholder holds a SimpleChart's size before it loads or measures: CLS at 1200 px gires-tournois 0.095 → 0.002.
  - Phase 3d (session 160, `phase-3/chart-interaction`, PR #197): hover crosshair and readout on both SVG charts
    (`chart-hover.tsx`: snaps to the nearest x, touch scrub, ←/→ keys with a live region), PNG (2×, title + legend) and CSV
    download buttons (`chart-export.ts`, loaded on click); `formatValue`, `chartCsv`, `fileStem` in `chart-axes.ts`; 1145 tests.
  - Phase 3c (session 159, `phase-3/chart-layout`, PR #196): `SimpleChart` and `SimpleLineChart` lay out at the measured width
    (`useElementWidth`), 11–12 px text at 360 px; tick counts, label thinning and margins from pixels (`chart-axes.ts`); null
    and non-finite values break lines; HTML legend below the plot (`chart-legend.tsx`); marker colours/symbols/size, text labels.
  - Phase 3b (session 158, `phase-3/initial-js`, PR #195): initial JS 145–172 KB gz per page (141.5 KB shared React/Next; the
    110 KB chunk is noModule polyfills, never loaded); related-links chunk gone. Shared links hide the calculator until
    hydration (`url-state-pending.ts`); `scripts/initial-js.mjs`; ui-check frame test.
  - Phase 3a (session 157, `phase-3/plotly-bundle`, PR #194): `react-plotly.js/factory` over `plotly-bundle.ts` (core + bar, heatmap,
    scatter3d, surface, scatterpolar); Plotly chunk 4.85 → 1.72 MB min, 1.47 MB → 558 KB gz; `plotly.js-dist-min` dropped.
  - Phase 2 inline-b6 (session 156, `phase-2/inline-b6`, PR #193): `logarithmicLoss`, `math.GAUSSIAN_FWHM_PER_SIGMA`, `totalExitance`
    (IAU Sun 6.294e7 W/m²), `rayleighScatteringDbPerKm`, `plasmonEnergy` (Au 29.90 eV), detector `noise` helpers on 14 pages.
  - Phase 2 inline-b5 (session 156, `phase-2/inline-b5`, PR #192): `wavenumber.wavelengthWidth`/`frequencyWidth` (100 GHz =
    0.8014 nm at 1550), `retarders.retardanceFromPath`, FSR via `etalon.fsrWavelength`, `depth.absorptionCoefficient` on 11 pages.
  - Phase 2 inline-b4 (session 156, `phase-2/inline-b4`, PR #191): `threeWaveMismatch`, `qpmPeriod` (PPLN 1064 SHG 6.82 µm) in
    `optical-parametric-oscillator` (`phaseMismatch` delegates); `confocalParameter` on sum-, difference-frequency, OPA, OPO.
  - Phase 2 inline-b3b (session 156, `phase-2/inline-b3b`, PR #190): `divergenceHalfAngle` on pointing-loss, security,
    fiber-laser-safety, retinal-image-size; `visual-interference.peakIrradiance` (now NaN for d ≤ 0) on diode, fiber, skin-mpe.
  - Phase 2 inline-b3a (session 156, `phase-2/inline-b3a`, PR #189): `gaussian-beam.radiusAtDistance` (w₀√2 at z_R),
    `mode-matching.beamRadiusFromQ`; `rayleighRange`, `divergenceHalfAngle`, `gaussianPeakIntensity` on 7 wave-optics pages.
  - Phase 2 inline-b2 (session 156, `phase-2/inline-b2`, PR #188): `fresnel.normalIncidenceReflectance` (0.04 glass, 0.2 for 2 − i)
    replaces 4 module copies and 5 page formulas; `quarterWaveArIndex` √(n₀n_s) on quarter-wave, single-ar, double-layer-ar.
  - Phase 2 inline-b1 (session 156, `phase-2/inline-b1`, PR #187): inventory (`scripts/inline-inventory.ts`, 6 families b1–b6);
    `numericalAperture`, `coreIndexFromNA`, `relativeIndexDifference` on 10 fibre pages (NA 0.9 / Δ 0.18 at 1.5/1.2).
  - Phase 2 inline-a + lint (session 155, `phase-2/inline-a`, PR #186): heuristic-model box closed by the audits (10 illustrative
    pages, heuristic parts labelled); 7 page helpers with a raw formula moved (`refractionAngle`, `waistFromDivergence`,
    `demoSingleBeam`; reuse `diffractionMtf`, `cutoffWavelength`); memoization and explicit-any rules back to error (16 + 3 sites).
  - Findings 4a (session 138, `phase-4/fiber-smf-consistency`, PR #169): macro-bending n₁ 1.4494 (2.62 dB/turn at 10 mm), G.657 (08/2024)
    re-read (no A3, B2 withdrawn, MFD ≥ 8.2 µm for B3), MFD fit range, R_eq 1.27 stated; fibre open findings cleared.
  - Polarizer types (session 137, `phase-4/polarizer-types`, PR #168): `polarizer-types.ts`, Thorlabs specs for 8 families read in Chrome
    (wire grid 150:1, was 10 000:1; LIDT with test conditions), k₂ = k₁/ER, DOP (ER − 1)/(ER + 1). All 411 pages tiered.
  - Materials fix part 9 (session 136, `phase-4/materials-fix-9`, PR #167): x-ray-optics (`x-ray-optics.ts` + Henke tables, Be 10 keV
    δ 3.408e-6, Au 12 keV 1.840e-5 = CXRO), polymer-optics (`polymer-optics.ts`, Sultanova/Beadie, PMMA n(1550) 1.4809), thermal-expansion
    (Crystran values, Si 2.6 µm). Materials 27 / 27, 0 `knownIssue`s.
  - Materials fix part 8b (session 135, `phase-4/materials-fix-8b`, PR #166): aging-effects, contamination, humidity-effects → thin-film/environmental-stability
    (`environmental-stability.ts`: Macleod 1988 packing-density laws, filled pores 15.32 nm; CC1246 obscuration vs Ma 1990 eq. 17a; Arrhenius–Peck AF 96.0).
  - Materials fix part 8a (session 134, `phase-4/materials-fix-8a`, PR #165): heat-capacity (`heat-capacity.ts`, Debye scaled, Si 200 K = Desai
    0.5569 J/(g·K)), thermal-conductivity-optics (`thermal-conduction.ts`, ΔT 72.46 K, lens 21.40 m), damage-threshold (`laser-damage.ts`), radiation-damage.
  - Materials fix part 7b (session 133, `phase-4/materials-fix-7b`, PR #164): rare-earth-absorption (`dopant-absorption.ts`, Yb 976 nm 1000 wt-ppm
    α 19.149 m⁻¹ = 83.16 dB/m), color-centers (`color-centers.ts`: NV⁻ Doherty Table 9, Stokes 0.420 eV; LiF F₂ 7824 cm⁻¹); 414 pages.
  - Materials fix part 7a (session 132, `phase-4/materials-fix-7a`): oh-absorption → fiber-optics/low-water-peak (OH bands 943/1383/2722 nm
    in `silica-attenuation.ts`: 1.2, 62.7, 10 030 dB/km/ppm), absorption → spectroscopy/lambert-beer-law (bulk slab T = e^(−αd)); 414 pages.
  - Materials fix part 6 (session 131, `phase-4/materials-fix-6`, PR #162): brillouin (`brillouin.ts`, ν_B 11.15 GHz, g_B 3.650e-11 m/W), raman (`raman-gain.ts`, Savitski diamond 17 cm/GW), two-photon (`two-photon.ts`, Van Stryland 1985 Table 1, GaAs T 30.3 %).
  - Materials fix part 5b (session 130, `phase-4/materials-fix-5b`, PR #161): nonlinear-index on `kerr-index.ts` (Dubietis Table 1 n₂, φ 10.54 rad, γ 1.317 W⁻¹km⁻¹) and nonlinear-crystals on `nonlinear-crystals.ts` (lean SHG page, user decision: 6 crystals, Boyd–Kleinman at Δk = 0, BBO d_eff 2.06, PPLN 15.9 pm/V); 1021 tests.
  - Materials fix part 5a (session 129, `phase-4/materials-fix-5`, PR #160): electro-optic + photorefractive on `pockels.ts` (KDP V_π 7.48 kV at 546 nm, W&H Ex. 3.2 14 522 V; LN transverse V_π, Kukhtarev diffusion E_sc, Γ = 2πn³rE_sc/(λ cos θ) in cm⁻¹); 1014 tests.
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
