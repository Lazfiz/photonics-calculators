import type { CalculatorEntry } from "../types";

export const materials: CalculatorEntry[] = [
  {
    slug: "acousto-optic",
    title: "Acousto-Optic Bragg Cell",
    description: "Acousto-optic Bragg cell design: Bragg and deflection angles, scan range, Klein–Cook Q, first-order diffraction efficiency from the figure of merit M₂ and acoustic power, access time and resolvable spots, for TeO₂, LiNbO₃, PbMoO₄ and fused silica.",
    keywords: ["Acousto-Optic Materials", "AOM", "Acousto-Optic Deflector", "Figure of Merit M₂"],
    tier: "textbook",
    modelNote: "Isotropic Bragg diffraction of plane waves with acoustic attenuation ignored. M₂ and the sound velocity hold for the listed acoustic mode and light polarization at 632.8 nm; the PbMoO₄ and fused-silica values are from a vendor table. TeO₂ slow-shear deflectors use anisotropic diffraction, so their Bragg angles differ from the isotropic ones. The acoustic bandwidth of Bragg matching is not modelled, and below Q = 1 (Raman–Nath) the sin² efficiency is flagged as invalid.",
    references: [
      {
        citation: "Uchida N., Ohmachi Y., Niizeki N., Inamura T. (1972). Arrangement for acousto-optical light deflection. US Patent 3,661,441, Tables 1 and 2 (TeO₂, LiNbO₃).",
        url: "https://patents.google.com/patent/US3661441A/en",
      },
      {
        citation: "Isomet Corp. AO Scanning, application note AN4820 (PbMoO₄, fused silica; vendor table).",
        url: "https://isomet.com/App-Manual_pdf/AO%20Scanning%20(AN4820).pdf",
      },
      {
        citation: "Uchida N. (1971). Optical properties of single-crystal paratellurite (TeO₂). Phys. Rev. B 4, 3736–3745.",
        url: "https://doi.org/10.1103/PhysRevB.4.3736",
      },
      {
        citation: "Klein W. R., Cook B. D. (1967). Unified approach to ultrasonic light diffraction. IEEE Trans. Sonics Ultrason. 14, 123–134.",
        url: "https://doi.org/10.1109/T-SU.1967.29423",
      },
      { citation: "Yariv A., Yeh P. (1984). Optical Waves in Crystals. Wiley. Ch. 9, acousto-optics." },
    ],
  },
  {
    slug: "birefringent-crystals",
    title: "Birefringent Crystals",
    description: "Ordinary and extraordinary indices nₒ, nₑ and birefringence Δn = nₑ − nₒ versus wavelength for nine uniaxial crystals (quartz, calcite, MgF₂, sapphire, YVO₄, LiNbO₃, rutile, BBO, KDP) from published Sellmeier fits, with plate retardance.",
    lede: "nₒ(λ) and nₑ(λ) from each crystal's published Sellmeier formula; Δn = nₑ − nₒ, and a plate of thickness d with the optic axis in its face retards by |Δn|·d/λ waves.",
    keywords: ["Ordinary and Extraordinary Index", "Birefringence Δn", "BBO and KDP Refractive Index", "Crystal Birefringence Data"],
    tier: "exact",
    modelNote: "Exact for each published Sellmeier fit inside its wavelength range (outside it the page shows no value); the fits match measurements to about 1e-4 in n. Retardance assumes normal incidence with the optic axis in the plate face, at the fit's temperature.",
    references: [
      {
        citation: "refractiveindex.info database (CC0). Sellmeier data sets, each with its original reference shown on the page.",
        url: "https://refractiveindex.info",
      },
      {
        citation: "Ghosh G. (1999). Dispersion-equation coefficients for the refractive index and birefringence of calcite and quartz crystals. Opt. Commun. 163, 95–102.",
        url: "https://doi.org/10.1016/S0030-4018(99)00091-7",
      },
      {
        citation: "Eimerl D., Davis L., Velsko S., Graham E. K., Zalkin A. (1987). Optical, mechanical, and thermal properties of barium borate. J. Appl. Phys. 62, 1968–1983.",
        url: "https://doi.org/10.1063/1.339536",
      },
      {
        citation: "Zernike F. (1964). Refractive indices of ammonium dihydrogen phosphate and potassium dihydrogen phosphate between 2000 Å and 1.5 µ. J. Opt. Soc. Am. 54, 1215–1220.",
        url: "https://doi.org/10.1364/JOSA.54.001215",
      },
    ],
  },
  {
    slug: "brillouin-scattering",
    title: "Brillouin Scattering",
    description: "Brillouin scattering: frequency shift ν_B = 2nv_A/λ, Stokes wavelength, acoustic wavelength, phonon lifetime and peak gain g_B = 2πn⁷p₁₂²/(cλ²ρv_AΔν_B), for fused silica, As₂Se₃, As₂S₃, diamond or your own medium.",
    keywords: ["Brillouin Shift", "Brillouin Gain Coefficient", "Stimulated Brillouin Scattering", "Acoustic Phonon"],
    tier: "textbook",
    modelNote: "Backward scattering from one longitudinal acoustic mode, with a Lorentzian gain line and a pump narrower than Δν_B. Δν_B is an input at the pump wavelength (it scales as λ⁻²). Bulk values: acoustic guiding and the overlap integral of a real fibre are not modelled. The As₂Se₃, As₂S₃ and diamond presets come from papers that measured ν_B, Δν_B and g_B, shown beside the result (formula within 9 % for the glasses; diamond 17.4 against 60 ± 9 cm/GW: the elasto-optic p from Grimsditch & Ramdas underestimates the measured gain 3–4×). The fibre SBS threshold has its own page.",
    references: [
      {
        citation: "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed. Academic Press. Brillouin shift ν_B = 2nv_A/λ_p, peak gain g_B and fused-silica n, v_A, ρ₀ and p₁₂.",
        url: "https://doi.org/10.1016/C2018-0-01168-8",
      },
      {
        citation: "Kobyakov A., Sauer M., Chowdhury D. (2010). Stimulated Brillouin scattering in optical fibers. Adv. Opt. Photon. 2, 1–59.",
        url: "https://doi.org/10.1364/AOP.2.000001",
      },
      {
        citation: "Abedin K. S. (2005). Observation of strong stimulated Brillouin scattering in single-mode As₂Se₃ chalcogenide fiber. Opt. Express 13, 10266–10271. Table 1.",
        url: "https://doi.org/10.1364/OPEX.13.010266",
      },
      {
        citation: "Pant R., Poulton C. G., Choi D.-Y., et al. (2011). On-chip stimulated Brillouin scattering. Opt. Express 19, 8285–8290. As₂S₃ n, ρ, p₁₂ and measured ν_B, Δν_B, g_B.",
        url: "https://doi.org/10.1364/OE.19.008285",
      },
      {
        citation: "Bai Z., Williams R. J., Kitzler O., et al. (2020). Diamond Brillouin laser in the visible. APL Photonics 5, 031301. Longitudinal phonons along [110], pump polarized along ⟨111⟩: ν_B 167 GHz, Δν_B 11.9 ± 4.3 MHz, g 60 ± 9 cm/GW from the threshold at 532 nm (79 cm/GW in the abstract). Their p² 0.0153 is about (2p)²; the page uses p = (p₁₁ + 2p₁₂ − 2p₄₄)/3 = 0.0600.",
        url: "https://doi.org/10.1063/1.5134907",
      },
      {
        citation: "Grimsditch M. H., Ramdas A. K. (1975). Brillouin scattering in diamond. Phys. Rev. B 11, 3139–3148. Photoelastic constants p₄₄ = −0.172, p₁₁ − p₁₂ = −0.292, p₁₁ + 2p₁₂ = −0.1640 (abstract).",
        url: "https://doi.org/10.1103/PhysRevB.11.3139",
      },
    ],
    related: [
      { href: "/fiber-optics/sbs-threshold", note: "SBS threshold of a fibre span from A_eff, length, loss and linewidth." },
    ],
  },
  {
    slug: "chromatic-dispersion",
    title: "Material Dispersion (Sellmeier)",
    description: "Refractive index, group index, GVD β₂ and dispersion D from published Sellmeier formulas for crystals, fused silica, IR glasses and SCHOTT glasses, with their coefficients and an n(λ) comparison.",
    keywords: ["Group Velocity Dispersion (GVD)", "Group Index (ng)", "Sellmeier Equation"],
    tier: "exact",
    modelNote: "Exact for the published Sellmeier formula inside its fit range, with analytic derivatives. The formula is itself a fit to measurements (typically ±1e-5 to ±1e-4 in n) at the temperature of those measurements.",
    references: [
      {
        citation: "refractiveindex.info database (CC0). Sellmeier data sets for fused silica, As₂S₃ and ZBLAN glass and thirteen crystals, each with its original reference shown on the page.",
      },
      {
        citation: "SCHOTT optical glass catalog (Zemax AGF 2017-01-20). Sellmeier coefficients of 10 glasses.",
      },
      {
        citation: "Agrawal G. P. Nonlinear Fiber Optics, §1.2.3. Group-velocity dispersion β₂ and dispersion parameter D.",
      },
      { citation: "Saleh B. E. A., Teich M. C. Fundamentals of Photonics, ch. 5. Dispersion parameter D." },
      {
        citation: "Malitson I. H. (1965). Interspecimen comparison of the refractive index of fused silica. J. Opt. Soc. Am. 55, 1205.",
        url: "https://doi.org/10.1364/JOSA.55.001205",
      },
      {
        citation: "Peter F. (1923). Über Brechungsindizes und Absorptionskonstanten des Diamanten zwischen 644 und 226 mµ. Z. Phys. 15, 358.",
        url: "https://doi.org/10.1007/BF01330487",
      },
    ],
  },
  {
    slug: "color-centers",
    title: "Color Centers in Crystals",
    description: "Stokes shift, quantum defect and absorption of colour centres (NV⁻ in diamond, F₂ and F₂⁺ in LiF) from their absorption and emission band maxima, cross-section and density.",
    tier: "textbook",
    modelNote: "Stokes shift ΔE = hc(1/λ_abs − 1/λ_em) between room-temperature band maxima and quantum defect 1 − λ_abs/λ_em; α = σN, T = e^(−αd) without surface reflections. Band shapes, the Huang–Rhys factor (ΔE ≈ 2Sħω only approximately) and quantum yields are not modelled. Only NV⁻ has a cited cross-section (532 nm).",
    references: [
      {
        citation: "Doherty M. W., Manson N. B., Delaney P., Jelezko F., Wrachtrup J., Hollenberg L. C. L. (2013). The nitrogen-vacancy colour centre in diamond. Phys. Rep. 528, 1–45. Table 9: NV⁻ absorption 2.180 eV, ZPL 1.945 eV, emission 1.760 eV (Davies & Hamer 1976).",
        url: "https://doi.org/10.1016/j.physrep.2013.02.001",
      },
      {
        citation: "Wee T.-L. et al. (2007). Two-photon excited fluorescence of nitrogen-vacancy centers in proton-irradiated type Ib diamond. J. Phys. Chem. A 111, 9379–9386. NV⁻ σ = (3.1 ± 0.8)e-17 cm² at 532 nm.",
        url: "https://doi.org/10.1021/jp073938o",
      },
      {
        citation: "Baldacchini G. (2002). Colored LiF: an optical material for all seasons. J. Lumin. 100, 333–343. F₂ 443 → 678 nm and F₂⁺ 645 → 910 nm, as tabulated in Guerrero Perez M. et al., arXiv:2412.21060 (2024), Table I.",
        url: "https://doi.org/10.1016/S0022-2313(02)00460-X",
      },
      {
        citation: "de Jong M., Seijo L., Meijerink A., Rabouw F. T. (2015). Resolving the ambiguity in the relation between Stokes shift and Huang–Rhys parameter. Phys. Chem. Chem. Phys. 17, 16959–16969.",
        url: "https://doi.org/10.1039/C5CP02093J",
      },
    ],
  },
  {
    slug: "crystal-properties",
    title: "Calcite, Quartz & Sapphire Properties",
    description: "Uniaxial crystal data for calcite, crystal quartz and sapphire: nₒ, nₑ and Δn at any wavelength from published Sellmeier fits, e-ray walk-off and beam displacement for a cut angle, quartz optical rotation, and thermal and mechanical properties.",
    lede: "Walk-off tan ρ = (nₒ² − nₑ²) sin 2θ / (2(nₑ² cos²θ + nₒ² sin²θ)), with nₒ and nₑ from the crystal's Sellmeier fit; quartz rotation ρ = kλ²/(λ² − λ₀²)².",
    keywords: ["Walk-off Angle", "Beam Displacer", "Quartz Optical Rotation", "Calcite (CaCO₃) Properties", "Quartz Crystal (SiO₂) Properties", "Sapphire (Al₂O₃) Properties"],
    tier: "textbook",
    modelNote: "Indices from published Sellmeier fits (exact for the fit, inside its range); walk-off from the uniaxial index ellipsoid (exact). Quartz rotation is Chandrasekhar's one-oscillator fit to Lowry & Coode-Adams' measurements, 0.2 % high at 589 nm. Thermal and mechanical values are single room-temperature data-sheet values.",
    references: [
      {
        citation: "Ghosh G. (1999). Dispersion-equation coefficients for the refractive index and birefringence of calcite and quartz crystals. Opt. Commun. 163, 95–102.",
        url: "https://doi.org/10.1016/S0030-4018(99)00091-7",
      },
      {
        citation: "Malitson I. H., Dodge M. J. (1972). Refractive index and birefringence of synthetic sapphire. J. Opt. Soc. Am. 62, 1405 (abstract); formula in Dodge M. J., Handbook of Laser Science and Technology, vol. IV, part 2 (CRC Press, 1986).",
      },
      {
        citation: "Chandrasekhar S. (1952). The optical rotatory power of quartz and its variation with temperature. Proc. Indian Acad. Sci. A 35, 103–113.",
        url: "https://doi.org/10.1007/BF03172225",
      },
      {
        citation: "Lowry T. M., Coode-Adams W. R. C. (1927). Optical rotatory dispersion. Part III: the rotatory dispersion of quartz in the infra-red, visible and ultra-violet regions of the spectrum. Phil. Trans. R. Soc. A 226, 391–466.",
        url: "https://doi.org/10.1098/rsta.1927.0010",
      },
      { citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed. Cambridge University Press. Ch. 15, optics of crystals." },
      {
        citation: "Crystran. Handbook of Infrared and Ultraviolet Optical Materials, data sheets: transmission range, dn/dT, thermal conductivity and expansion, hardness, density, specific heat, Young's modulus.",
        url: "https://www.crystran.com/optical-materials",
      },
    ],
  },
  {
    slug: "damage-threshold",
    title: "Laser Damage Threshold",
    description: "Scale an optic's rated pulsed laser damage threshold (LIDT) to your pulse duration with the √τ law and compare it with the 2E/(πw²) peak fluence of your Gaussian beam: margin and energy at threshold.",
    tier: "textbook",
    modelNote: "F_th(τ) = F_ref (τ/τ_ref)^a with a = ½ (heat diffusion), measured above about 20 ps; real optics scatter around it. Peak fluence 2E/(πw²) of a TEM₀₀ beam (ISO 21254 effective area πw²/2). Above about 1 µs heating approaches the CW regime and the √τ law is not validated (the page warns). Wavelength, spot-size and repetition-rate effects are not modelled; the rated value comes from the optic's data sheet.",
    references: [
      {
        citation: "Stuart B. C., Feit M. D., Herman S., Rubenchik A. M., Shore B. W., Perry M. D. (1996). Nanosecond-to-femtosecond laser-induced breakdown in dielectrics. Phys. Rev. B 53, 1749–1761. √τ scaling above about 20 ps (fused silica, CaF₂).",
        url: "https://doi.org/10.1103/PhysRevB.53.1749",
      },
      {
        citation: "Wood R. M. (2003). Laser-Induced Damage of Optical Materials. IOP Publishing (CRC Press).",
        url: "https://doi.org/10.1201/9781420034059",
      },
      { citation: "ISO 21254-1:2011. Lasers and laser-related equipment — Test methods for laser-induced damage threshold — Part 1: Definitions and general principles. Effective area of a Gaussian beam πw²/2." },
    ],
  },
  {
    slug: "diamond-optics",
    title: "Diamond Optics",
    description: "Refractive index of diamond from 226 nm to 20 µm (Peter's Sellmeier formula, Palik's infrared values), Fresnel-limited window transmission, transmission bands, and thermal and mechanical properties.",
    lede: "n(λ) from Peter's Sellmeier formula to 644 nm and Palik's tabulated values beyond; an uncoated, non-absorbing plate transmits at most 2n/(n² + 1) (reflections added incoherently).",
    keywords: ["Diamond Refractive Index", "CVD Diamond Window"],
    tier: "textbook",
    modelNote: "Peter's Sellmeier fit is exact for the fit over his 226–644 nm; beyond that the index is interpolated linearly in 1/λ² between Palik's values to 20 µm (on a smooth dispersion curve this adds under 1e-4; linear in λ it was up to 3e-3 between 0.66 and 2 µm). Transmission is the lossless two-surface Fresnel limit; the 2.5–7 µm multiphonon band and impurities lower it. Properties are room-temperature data-sheet values.",
    references: [
      {
        citation: "Peter F. (1923). Über Brechungsindizes und Absorptionskonstanten des Diamanten zwischen 644 und 226 mμ. Z. Phys. 15, 358–368.",
        url: "https://doi.org/10.1007/BF01330487",
      },
      { citation: "Palik E. D. (ed.) (1985). Handbook of Optical Constants of Solids, vol. 1. Academic Press. Diamond, as tabulated by Crystran." },
      {
        citation: "Clark C. D., Dean P. J., Harris P. V. (1964). Intrinsic edge absorption in diamond. Proc. R. Soc. A 277, 312–329. Indirect band gap.",
        url: "https://doi.org/10.1098/rspa.1964.0025",
      },
      {
        citation: "Crystran. Handbook of Infrared and Ultraviolet Optical Materials, data sheets: diamond: transmission range, dn/dT, thermal conductivity and expansion, Knoop hardness, density, specific heat, Young's modulus.",
        url: "https://www.crystran.com/optical-materials",
      },
      { citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed. Cambridge University Press. Fresnel formulae at normal incidence." },
    ],
  },
  {
    slug: "electro-optic",
    title: "Electro-Optic Coefficients",
    description: "Pockels-effect half-wave voltage of longitudinal KDP, KD*P and ADP cells and transverse LiNbO₃, LiTaO₃, KTP, BaTiO₃ and BSO modulators: retardation and single-polarization phase, V_π·L, the index change −½n³rE and the crossed-polarizer transmission, with BSO's optical activity.",
    keywords: ["Pockels Effect", "Half-Wave Voltage", "Pockels Cell", "Electro-Optic Modulator"],
    tier: "textbook",
    modelNote: "Principal-axis geometries with r fixed at its reference wavelength; only n follows the Sellmeier fits (Zernike KDP, Zelmon LiNbO₃, Kato KTP, Wemple BaTiO₃ over 0.4–0.7 µm), and KD*P and ADP use one published index. LiTaO₃'s unclamped r₃₃ and r₁₃ are Casson et al.'s at 632.8, 980, 1330 and 1558 nm (scaled to r₃₃ = 30.5 pm/V at 632.8 nm), interpolated linearly, with Bond's tabulated indices; it is offered over 632.8–1558 nm only. LiNbO₃ uses clamped (high-frequency) coefficients; KTP's 633 nm r₃₃ and r₂₃ are low-frequency measurements whose clamping the source doesn't state. BaTiO₃ comes unclamped (r₃₃ 105, r₁₃ 8 pm/V) and clamped (40.6, 10.2); r₄₂ = 1300 (clamped 730) pm/V needs a field across c and is not modelled. The z–o retardation of a transverse modulator adds to the natural birefringence. BSO (field along [110]): Efremidis et al.'s r₄₁, n and optical activity at 500–800 nm (Fig. 3, interpolated; below 560 nm r₄₁ may read low from screening), with the rotation in the crossed-polarizer transmission.",
    references: [
      {
        citation: "Wilson J., Hawkes J. F. B. (1998). Optoelectronics: An Introduction, 3rd ed. Prentice Hall Europe, ISBN 0-13-103961-X (the same Table 3.1 in the 1983 and 1989 editions). Table 3.1 (r₆₃ of KDP, KD*P, ADP) and Example 3.2 (KDP V_π = 14.5 kV at 1.06 µm).",
      },
      {
        citation: "Weis R. S., Gaylord T. K. (1985). Lithium niobate: summary of physical properties and crystal structure. Appl. Phys. A 37, 191–203.",
        url: "https://doi.org/10.1007/BF00614817",
      },
      {
        citation: "Zelmon D. E., Small D. L., Jundt D. (1997). Infrared corrected Sellmeier coefficients for congruently grown lithium niobate and 5 mol.% magnesium oxide–doped lithium niobate. J. Opt. Soc. Am. B 14, 3319.",
        url: "https://doi.org/10.1364/JOSAB.14.003319",
      },
      {
        citation: "Casson J. L., Gahagan K. T., Scrymgeour D. A., Jain R. K., Robinson J. M., Gopalan V., Sander R. K. (2004). Electro-optic coefficients of lithium tantalate at near-infrared wavelengths. J. Opt. Soc. Am. B 21, 1948–1952. Table 2: unclamped r₃₃ and r₁₃ of LiTaO₃ at 632.8, 980, 1330 and 1558 nm.",
        url: "https://doi.org/10.1364/JOSAB.21.001948",
      },
      {
        citation: "Onuki K., Uchida N., Saku T. (1972). Interferometric method for measuring electro-optic coefficients in crystals. J. Opt. Soc. Am. 62, 1030–1032. LiTaO₃ r₃₃ = 30.5 pm/V at 632.8 nm, which sets Casson et al.'s scale.",
        url: "https://doi.org/10.1364/JOSA.62.001030",
      },
      {
        citation: "Bond W. L. (1965). Measurement of the refractive indices of several crystals. J. Appl. Phys. 36, 1674–1677. LiTaO₃ n_o and n_e, tabulated (via the refractiveindex.info database).",
        url: "https://doi.org/10.1063/1.1703106",
      },
      {
        citation: "Xie D., Pfister O. (2005). Low-frequency measurements of electro-optic coefficients of Na:KTiOPO₄ and RbTiOAsO₄. arXiv:physics/0507123. Eqs. 3–4 (Δn_y, Δn_z of a z field) and KTP r₂₃ = 15.7, r₃₃ = 36.3 pm/V at 633 nm (low-frequency, unclamped), quoted from Cheng L. K. et al. (1994), J. Cryst. Growth 137, 107–115.",
        url: "https://arxiv.org/abs/physics/0507123",
      },
      {
        citation: "Kato K., Takaoka E. (2002). Sellmeier and thermo-optic dispersion formulas for KTP. Appl. Opt. 41, 5040–5044 (coefficients via the refractiveindex.info database).",
        url: "https://doi.org/10.1364/AO.41.005040",
      },
      {
        citation: "Zgonik M., Bernasconi P., Duelli M., Schlesser R., Günter P., Garrett M. H., Rytz D., Zhu Y., Wu X. (1994). Dielectric, elastic, piezoelectric, electro-optic, and elasto-optic tensors of BaTiO₃ crystals. Phys. Rev. B 50, 5941–5949. Table II (clamped r) and Table III (stress-free r), 633 nm, 23 °C.",
        url: "https://doi.org/10.1103/PhysRevB.50.5941",
      },
      {
        citation: "Wemple S. H., DiDomenico M. Jr., Camlibel I. (1968). Dielectric and optical properties of melt-grown BaTiO₃. J. Phys. Chem. Solids 29, 1797–1803 (n_o, n_e single-oscillator fits, 0.4–0.7 µm, via the refractiveindex.info database).",
        url: "https://doi.org/10.1016/0022-3697(68)90164-9",
      },
      {
        citation: "Efremidis A. T., Deliolanis N. C., Manolikas C., Vanidhis E. D. (2009). Dispersion of electro-optic coefficients in sillenite crystals. Appl. Phys. B 95, 467–473. Eqs. 8–10 (BSO field along [110], light along [1̄10]) and Fig. 3: r₄₁, n and optical activity of BSO at 500–800 nm.",
        url: "https://doi.org/10.1007/s00340-009-3498-8",
      },
    ],
  },
  {
    slug: "heat-capacity",
    title: "Heat Capacity of Optical Materials",
    description: "Specific heat c_p(T) of Si, Ge, GaAs, CaF₂, LiF, MgO, sapphire and diamond from the Debye model scaled to the measured room-temperature value, volumetric heat capacity, and the heat to warm a part from T₁ to T₂.",
    tier: "textbook",
    modelNote: "c_p(T) = c_p(T_ref)·D(θ_D/T)/D(θ_D/T_ref) with the Debye function D and one Debye temperature; Q = m∫c_p dT. Harmonic, so it runs low above room temperature (Si at 1000 K: 8 % below Desai's value) and misses the dip of θ_D near 40 K; sapphire is within 1.1 % of JANAF from 300 to 1000 K (5 % low at 200 K, 21 % at 100 K), MgO 8–9 % above JANAF from 500 to 1000 K. Diamond takes its caloric θ_D of 1860 K (Pässler 2021), not the elastic 2250 K: within 0.9 % of the SGTE c_p from 298 to 1000 K. GaAs: 2 % low at 500 K, 9.5 % at 1000 K against Chatillon et al. 1990. No presets for glasses.",
    references: [
      {
        citation: "Debye P. (1912). Zur Theorie der spezifischen Wärmen. Ann. Phys. 344, 789–839.",
        url: "https://doi.org/10.1002/andp.19123441404",
      },
      {
        citation: "Råsander M., Moram M. A. (2015). On the accuracy of commonly used density functional approximations in determining the elastic constants of insulators and semiconductors. J. Chem. Phys. 143, 144104. Table VII: experimental Debye temperatures (Landolt–Börnstein): Si 645, Ge 373, GaAs 344, LiF 732, CaF₂ 510, MgO 945 K.",
        url: "https://doi.org/10.1063/1.4932334",
      },
      {
        citation: "Archer D. G. (1993). Thermodynamic properties of synthetic sapphire (α-Al₂O₃), Standard Reference Material 720, and the effect of temperature-scale differences on thermodynamic properties. J. Phys. Chem. Ref. Data 22, 1441–1453. Debye temperature 990 K (§2).",
        url: "https://doi.org/10.1063/1.555931",
      },
      {
        citation: "Chase M. W. (1998). NIST-JANAF Thermochemical Tables, 4th ed. J. Phys. Chem. Ref. Data Monograph 9. MgO (cr), table Mg-008: c_p 37.106 J/(mol·K) at 298.15 K, 45.544 at 500 K; α-Al₂O₃, table Al-096: 79.416 J/(mol·K) at 300 K; CaF₂, table Ca-014: 68.588 J/(mol·K) at 298.15 K; LiF, table F-021: 41.815 J/(mol·K) at 298.15 K.",
        url: "https://janaf.nist.gov/tables/Mg-008.txt",
      },
      {
        citation: "Desai P. D. (1986). Thermodynamic properties of iron and silicon. J. Phys. Chem. Ref. Data 15, 967–983. Si c_p 20.007 J/(mol·K) at 298.15 K (Table 4), 26.569 at 1000 K (Table 5).",
        url: "https://doi.org/10.1063/1.555761",
      },
      {
        citation: "Pässler R. (2021). Efficient Debye function interpolation formulae: sample applications to diamond. Recent Prog. Mater. 3(4), 042. Fig. 2: caloric θ_D of diamond 1857 ± 12 K from 140 to 700 K.",
        url: "https://doi.org/10.21926/rpm.2104042",
      },
      {
        citation: "Dinsdale A. T. (1991). SGTE data for pure elements. Calphad 15, 317–425. Gibbs energies GDIAC (diamond: c_p 6.1197 J/(mol·K) at 298.15 K) and GHSERGE (Ge: 23.347 J/(mol·K)).",
        url: "https://doi.org/10.1016/0364-5916(91)90030-N",
      },
      {
        citation: "Chatillon C., Ansara I., Watson A., Argent B. B. (1990). Re-assessment of the thermodynamic properties and phase diagrams of the Ga-As and In-As systems. Calphad 14, 203–214. GaAs Gibbs energy GB3GAAS: c_p 46.855 J/(mol·K) at 298.15 K.",
        url: "https://doi.org/10.1016/0364-5916(90)90021-Q",
      },
      {
        citation: "Piesbergen U. (1963). Die durchschnittlichen Atomwärmen der AIIIBV-Halbleiter AlSb, GaAs, GaSb, InP, InAs, InSb und die Atomwärme des Elements Germanium zwischen 12 und 273 °K. Z. Naturforsch. 18a, 141. Tab. 3: the GaAs preset is within 2.4 % from 100 to 273 K, 24 % low at 50 K.",
        url: "https://doi.org/10.1515/zna-1963-0206",
      },
      {
        citation: "Crystran. Handbook of Infrared and Ultraviolet Optical Materials, data sheets: density of Si, Ge, CaF₂, LiF, MgO and sapphire.",
        url: "https://www.crystran.com/optical-materials",
      },
    ],
  },
  {
    slug: "infrared-glass",
    title: "Infrared Optical Materials",
    description: "Compare IR materials (Ge, Si, ZnSe, ZnS, fluorides, alkali halides, KRS-5, As₂S₃, AMTIR-1 and ZBLAN glass): refractive index at any wavelength and temperature, Fresnel-limited transmission, transmission band, dn/dT, thermal conductivity and hardness.",
    lede: "Compare IR transmitting materials and glasses. n(λ, T) = n(λ, T₀) + (dn/dT)(T − T₀), with n(λ, T₀) from each material's published Sellmeier formula.",
    keywords: ["Infrared Materials", "Chalcogenide Glass Properties", "Fluoride Glass (ZBLAN)"],
    tier: "textbook",
    modelNote: "Index from published Sellmeier fits inside their ranges, shifted linearly by one room-temperature dn/dT; transmission is the lossless two-surface Fresnel limit 2n/(n² + 1). Bands, dn/dT, conductivity and hardness are Crystran data-sheet values, and Amorphous Materials' for AMTIR-1 and As₂S₃ (AMTIR-6: band and hardness only, its dn/dT changes sign across the band); ZBLAN's Knoop 250 kg/mm² and dn/dT −11.5 ×10⁻⁶/K (midpoint of −8 to −15 for fluoride glasses) are from Poulain's 2024 review, with no band or conductivity. AMTIR-1's single dn/dT is about 2× low below 1.5 µm.",
    references: [
      {
        citation: "refractiveindex.info database (CC0). Sellmeier data sets, each with its original reference shown on the page. Used for Ge, Si, ZnSe, ZnS, CaF₂, BaF₂, MgF₂, NaCl, KBr, CsI, KRS-5, As₂S₃ and ZBLAN.",
      },
      {
        citation: "Rodney W. S., Malitson I. H. (1956). Refraction and dispersion of thallium bromide iodide. J. Opt. Soc. Am. 46, 956. KRS-5 Sellmeier formula at 25 °C (0.577–39.38 µm) and dn/dT.",
        url: "https://doi.org/10.1364/JOSA.46.000956",
      },
      {
        citation: "Rodney W. S., Malitson I. H., King T. A. (1958). Refractive index of arsenic trisulfide. J. Opt. Soc. Am. 48, 633.",
        url: "https://doi.org/10.1364/JOSA.48.000633",
      },
      {
        citation: "Gan F. (1995). Optical properties of fluoride glasses: a review. J. Non-Cryst. Solids 184, 9. ZBLAN dispersion formula (n_d 1.5011).",
        url: "https://doi.org/10.1016/0022-3093(94)00592-3",
      },
      {
        citation: "Zhu X., Peyghambarian N. (2010). High-power ZBLAN glass fiber lasers: review and prospect. Adv. OptoElectron. 2010, 501956. Table 1: ZBLAN n 1.499 at 589 nm, Abbe number 76; n_d varies with composition by a few 10⁻³.",
        url: "https://doi.org/10.1155/2010/501956",
      },
      {
        citation: "Poulain M. (2024). Heavy metal fluoride glasses: A tutorial review. APL Photonics 9, 091103. Knoop hardness about 250 kg/mm² for ZBLAN (Table IV: fluorozirconates 190–250) and dn/dT −8 to −15 ×10⁻⁶/K for fluoride glasses.",
        url: "https://doi.org/10.1063/5.0226668",
      },
      {
        citation: "Li H. H. (1976). Refractive index of alkali halides and its wavelength and temperature derivatives. J. Phys. Chem. Ref. Data 5, 329.",
        url: "https://doi.org/10.1063/1.555536",
      },
      {
        citation: "Crystran. Handbook of Infrared and Ultraviolet Optical Materials, data sheets: transmission range, dn/dT, thermal conductivity, Knoop hardness.",
        url: "https://www.crystran.com/optical-materials",
      },
      {
        citation: "Amorphous Materials Inc. (2024). AMTIR-1 data sheet: Sellmeier fit at 22 °C, index and dn/dT table 1–14 µm at 20 °C (2.49701 and 71 ×10⁻⁶/K at 10 µm), thermal conductivity 0.25 W/(m·K), Knoop hardness 170.",
        url: "https://web.archive.org/web/20241204053433/https://www.amorphousmaterials.com/app/download/6552854504/AMTIR-1+Datasheet+%282024-11-21%29.pdf",
      },
      {
        citation: "Amorphous Materials Inc. Comparison of IR transmitting glasses produced by AMI, ver. 5: transmission ranges AMTIR-1 0.7–12 µm, AMTIR-6 (As₂S₃) 0.6–8 µm; Knoop 170 and 109.",
        url: "https://web.archive.org/web/20231207100003/https://www.amorphousmaterials.com/app/download/6541860504/Comparison+of+IR+Materials+ver+5.pdf",
      },
      {
        citation: "Amorphous Materials Inc. (2020). AMTIR-6 data sheet: As₂S₃ index 2.4994, 2.4202, 2.4070, 2.3976 and dn/dT 20.7, 4.19, −2.65, −3.54 ×10⁻⁶/K at 0.9, 3, 6, 8 µm (22 °C).",
        url: "https://web.archive.org/web/20200922065735/http://www.amorphousmaterials.com/app/download/6552919404/AMTIR-6+Datasheet.pdf",
      },
      { citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed. Cambridge University Press. Fresnel formulae at normal incidence." },
    ],
  },
  {
    slug: "magneto-optic",
    title: "Faraday Rotation & Verdet Constants",
    description: "Faraday rotation θ = VBL in TGG, TSAG, CeF₃ and fused silica, with the Verdet constant's dispersion from published fits, the field or length for a 45° isolator rotator, and YIG's saturated rotation at 1550 nm.",
    keywords: ["Verdet Constant", "Faraday Isolator", "Faraday Rotator", "TGG"],
    tier: "textbook",
    modelNote: "θ = VBL is exact for a uniform field. V(λ) at room temperature comes from published fits inside their ranges: the single-transition model for the Tb³⁺ and Ce³⁺ paramagnets (Vojna et al.), a dispersion fit for fused silica (Tran et al.). YIG is ferrimagnetic, so only its saturated rotation at 1550 nm is given.",
    references: [
      {
        citation: "Vojna D., Slezák O., Lucianetti A., Mocek T. (2019). Verdet constant of magneto-active materials developed for high-power Faraday devices. Appl. Sci. 9, 3160. Eq. 13 and Tables 1–3.",
        url: "https://doi.org/10.3390/app9153160",
      },
      {
        citation: "Tran D.-B.-A., Edwards E., Tew D. P., Peverall R., Ritchie G. A. D. (2024). Continuous-wave cavity ringdown for high-sensitivity polarimetry and magnetometry measurements. J. Chem. Phys. 160, 054201. Fused silica Verdet dispersion, eq. 2.",
        url: "https://doi.org/10.1063/5.0187832",
      },
    ],
  },
  {
    slug: "nonlinear-crystals",
    title: "Nonlinear Crystal Comparison",
    description: "Second-harmonic generation of 1064 nm in BBO, LBO, KTP, BiBO, bulk MgO:LiNbO₃ and PPLN: d_eff of each phase-matched cut, and the focused-beam (Boyd–Kleinman) SH power and efficiency for a crystal length, pump power and waist.",
    keywords: ["Second Harmonic Generation", "d_eff", "Boyd–Kleinman Focusing", "PPLN", "BBO"],
    tier: "textbook",
    modelNote: "Boyd–Kleinman focused Gaussian beam with walk-off, h(σ, B, ξ) with B = ρ√(Lk_ω)/2, focus at the crystal centre, undepleted pump, no absorption; for type II the one-walking-wave form is approximate. d_eff comes from each source's d_ij and cut at 1064 nm (BBO's and BiBO's angles from their indices); published values differ by tens of per cent between sources. Mid-IR crystals (AgGaS₂, ZGP, GaSe, OP-GaAs) and acceptance and damage data are not included until sourced.",
    references: [
      {
        citation: "Boyd G. D., Kleinman D. A. (1968). Parametric Interaction of Focused Gaussian Light Beams. J. Appl. Phys. 39, 3597–3639. Focusing function h(σ, ξ).",
        url: "https://doi.org/10.1063/1.1656831",
      },
      {
        citation: "Shoji I. et al. (1997). Absolute scale of second-order nonlinear-optical coefficients. J. Opt. Soc. Am. B 14, 2268. Table 10: 5 % MgO:LiNbO₃ d₃₃ = 25.0, d₃₁ = 4.4 pm/V at 1064 nm.",
        url: "https://doi.org/10.1364/JOSAB.14.002268",
      },
      {
        citation: "EKSMA Optics data sheets for BBO, LBO and KTP crystals: d_ij, indices at 1064 and 532 nm, cut angles, walk-off, transparency.",
        url: "https://eksmaoptics.com/out/media/EKSMA_Optics_BBO_Crystals.pdf",
      },
      {
        citation: "CASTECH. BiB₃O₆ (BiBO) properties: d_eff 3.0 pm/V and θ = 168.9° for SHG of 1064 nm.",
        url: "https://www.castech-us.com/casbib3o6.htm",
      },
      {
        citation: "Umemura N., Miyata K., Kato K. (2007). New data on the optical properties of BiB₃O₆. Opt. Mater. 30, 532–534. Sellmeier equations (via the refractiveindex.info database): BiBO n_x(532 nm) and the type I cut computed from them (168.8°).",
        url: "https://doi.org/10.1016/j.optmat.2006.12.014",
      },
      {
        citation: "Zelmon D. E., Small D. L., Jundt D. (1997). Infrared corrected Sellmeier coefficients for congruently grown lithium niobate and 5 mol.% magnesium oxide–doped lithium niobate. J. Opt. Soc. Am. B 14, 3319.",
        url: "https://doi.org/10.1364/JOSAB.14.003319",
      },
    ],
  },
  {
    slug: "nonlinear-index",
    title: "Nonlinear Refractive Index (n₂)",
    description: "Kerr effect n = n₀ + n₂I: index change, nonlinear phase over a length, fibre nonlinear coefficient γ = 2πn₂/(λA_eff) and the self-focusing critical power, with n₂ of silica fibre, silicon, air and its gases, CS₂ and 17 crystals, glasses and water.",
    keywords: ["Kerr Effect", "Nonlinear Refractive Index", "B-Integral", "Self-Phase Modulation", "Critical Power"],
    tier: "textbook",
    modelNote: "Instantaneous electronic Kerr effect for linear polarization and uniform intensity over L. n₂ is fixed at the wavelength it was measured at; its dispersion is not modelled, except for sapphire (E ∥ c), which follows Major et al.'s empirical fit over 270–1550 nm (±25–30 %), held at its 1550 nm value above and not given below 270 nm. Gases are electronic only at 1 atm (≲ 50 fs; longer pulses add rotation); the CS₂ > 10 ps row includes the nuclear response. DeSalvo's esu values are converted with n₂(m²/W) = 40π n₂(esu)/(c n₀). P_cr is the Gaussian-beam value 3.77 λ²/(8π n₀ n₂).",
    references: [
      {
        citation: "Dubietis A., Tamošauskas G., Šuminas R., Jukna V., Couairon A. (2017). Ultrafast supercontinuum generation in bulk condensed media. Lith. J. Phys. 57(3). Table 1: n₂ and n₀ at 800 nm.",
        url: "https://doi.org/10.3952/physics.v57i3.3541",
      },
      {
        citation: "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed. Academic Press. n₂ = 2.6e-20 m²/W for silica fibre and γ = 2πn₂/(λA_eff).",
        url: "https://doi.org/10.1016/C2018-0-01168-8",
      },
      {
        citation: "Fibich G., Gaeta A. L. (2000). Critical power for self-focusing in bulk media and in hollow waveguides. Opt. Lett. 25, 335–337.",
        url: "https://doi.org/10.1364/OL.25.000335",
      },
      {
        citation: "DeSalvo R., Said A. A., Hagan D. J., Van Stryland E. W., Sheik-Bahae M. (1996). Infrared to ultraviolet measurements of two-photon absorption and n₂ in wide bandgap solids. IEEE J. Quantum Electron. 32, 1324–1333. Tables I–II: n₂ and n₀ at 1064 nm.",
        url: "https://doi.org/10.1109/3.511545",
      },
      {
        citation: "Bristow A. D., Rotenberg N., van Driel H. M. (2007). Two-photon absorption and Kerr coefficients of silicon for 850–2200 nm. Appl. Phys. Lett. 90, 191104. Peak n₂ = 1.2e-13 cm²/W at 1800 nm.",
        url: "https://doi.org/10.1063/1.2737359",
      },
      {
        citation: "Major A., Yoshino F., Nikolakakos I., Aitchison J. S., Smith P. W. E. (2004). Dispersion of the nonlinear refractive index in sapphire. Opt. Lett. 29, 602–604. Eq. 2: empirical n₂(λ) of sapphire for E ∥ c, 270–1550 nm.",
        url: "https://doi.org/10.1364/OL.29.000602",
      },
      {
        citation: "Malitson I. H., Dodge M. J. (1972). Refractive index and birefringence of synthetic sapphire. J. Opt. Soc. Am. 62, 1405 (meeting abstract). n_e of sapphire.",
      },
      {
        citation: "Salzberg C. D., Villa J. J. (1957). Infrared refractive indexes of silicon, germanium, and modified selenium glass. J. Opt. Soc. Am. 47, 244. n₀ of silicon.",
        url: "https://doi.org/10.1364/JOSA.47.000244",
      },
      {
        citation: "Malitson I. H. (1965). Interspecimen comparison of the refractive index of fused silica. J. Opt. Soc. Am. 55, 1205.",
        url: "https://doi.org/10.1364/JOSA.55.001205",
      },
      {
        citation: "Zahedpour S., Wahlstrand J. K., Milchberg H. M. (2015). Measurement of the nonlinear refractive index of air constituents at mid-infrared wavelengths. Opt. Lett. 40, 5794. Table 1: electronic and rotational n₂ of N₂, O₂ and Ar at 1 atm.",
        url: "https://doi.org/10.1364/OL.40.005794",
      },
      {
        citation: "U.S. Standard Atmosphere, 1976 (NOAA, NASA, USAF). Dry-air mole fractions N₂ 0.78084, O₂ 0.209476, Ar 0.00934.",
        url: "https://ntrs.nasa.gov/citations/19770009539",
      },
      {
        citation: "Peck E. R., Reeder K. (1972). Dispersion of Air. J. Opt. Soc. Am. 62, 958. n₀ of the gases.",
        url: "https://doi.org/10.1364/josa.62.000958",
      },
      {
        citation: "Reichert M., Hu H., Ferdinandus M. R., Seidel M., Zhao P., Ensley T. R., Peceli D., Reed J. M., Fishman D. A., Webster S., Hagan D. J., Van Stryland E. W. (2014). Temporal, spectral, and polarization dependence of the nonlinear optical response of carbon disulfide. Optica 1, 436. Table 1 and Eq. 18: CS₂ electronic and long-pulse n₂.",
        url: "https://doi.org/10.1364/OPTICA.1.000436",
      },
      {
        citation: "Kedenburg S., Vieweg M., Gissibl T., Giessen H. (2012). Linear refractive index and absorption measurements of nonlinear optical liquids in the visible and near-infrared spectral region. Opt. Mater. Express 2, 1588. n₀ of CS₂.",
        url: "https://doi.org/10.1364/OME.2.001588",
      },
      {
        citation: "Wahlstrand J. K., Cruz C. D. (2026). Precise measurement of the Kerr coefficient using phase-sensitive pump–probe hyperspectral imaging. Rev. Sci. Instrum. 97(8). Fused silica n₂ = 2.18 ± 0.14 × 10⁻¹⁶ cm²/W at 1024 nm (Z-scan).",
        url: "https://doi.org/10.1063/5.0331814",
      },
      {
        citation: "Boyd R. W. (2020). Nonlinear Optics, 4th ed. Academic Press. The nonlinear index, its polarization dependence (⅔ for circular light, electronic response) and self-focusing.",
        url: "https://doi.org/10.1016/C2015-0-05510-1",
      },
    ],
  },
  {
    slug: "optical-glass-catalog",
    title: "Optical Glass Catalog",
    description: "Interactive glass map and dispersion curves for SCHOTT optical glasses, with catalog n_d, V_d, density and dn/dT, the Abbe number of glasses and crystals, and dn/dT and Δn over temperature.",
    lede: "Interactive glass map and dispersion curves. Sellmeier: n²(λ) = 1 + Σ Bᵢλ²/(λ² − Cᵢ), with SCHOTT catalog coefficients.",
    keywords: ["Schott Glass Catalog", "Abbe Number (Vd)", "Thermo-Optic Coefficient (dn/dT)"],
    tier: "exact",
    modelNote: "SCHOTT catalog values: Sellmeier fits that reproduce each glass's catalog n_d to 1e-5 and V_d to 0.01. V_d of the crystals and fused silica comes from their published formulas. dn/dT and Δn are TIE-19's absolute (vacuum) values for −100 to +140 °C and 365–1014 nm (SCHOTT's stated range); values relative to air are larger by about n × 0.9e-6 /K. Valid inside each fit's wavelength range.",
    references: [
      {
        citation: "SCHOTT optical glass catalog (Zemax AGF 2017-01-20). Sellmeier coefficients, n_d, V_d and density.",
      },
      {
        citation: "SCHOTT (2016). TIE-19, temperature coefficient of the absolute refractive index (D₀, D₁, D₂, E₀, E₁, λ_TK).",
      },
      {
        citation: "SCHOTT optical glass data sheets (2017-01-20), Explanations: the dn/dT constants are valid from −100 to +140 °C and 0.365 to 1.014 µm. N-BK7 sheet: Δn_abs/ΔT at 1060 nm, e and g of 0.3, 0.8, 1.2 (−40/−20 °C) and 1.1, 1.6, 2.1 ×10⁻⁶/K (+20/+40 °C).",
        url: "https://refractiveindex.info/download/data/2017/schott_2017-01-20.pdf",
      },
      {
        citation: "Malitson I. H. (1965). Interspecimen comparison of the refractive index of fused silica. J. Opt. Soc. Am. 55, 1205. Fused silica V_d 67.82.",
        url: "https://doi.org/10.1364/JOSA.55.001205",
      },
    ],
  },
  {
    slug: "photoelastic",
    title: "Stress Birefringence in Optical Glass",
    description: "Stress birefringence of optical glass: Δn = C(σ₁ − σ₂) and the retardance R = C d (σ₁ − σ₂) for fused silica and twelve Schott glasses, in nm/cm as glass catalogs quote it, with the stress that gives a half-wave retardance.",
    keywords: ["Photoelastic Constants", "Stress-Optic Coefficient", "Stress Optical Coefficient K"],
    tier: "textbook",
    modelNote: "Linear stress-optic law for isotropic glass at one wavelength (C varies a few percent across the visible; the page warns outside 0.4–2.5 µm). Crystals are not covered: they have a stress-optic tensor, so their birefringence depends on the stress and light directions.",
    references: [
      {
        citation: "SCHOTT AG (2017). Optical glass data sheets, 2017-01-20: stress optical coefficient K.",
        url: "https://refractiveindex.info/download/data/2017/schott_2017-01-20.pdf",
      },
      {
        citation: "Jog E. S. (1957). The dispersion of the stress optical coefficient of vitreous silica. J. Indian Inst. Sci. 39(2), 93. Table I.",
        url: "https://journal.iisc.ac.in/index.php/iisc/article/view/2928",
      },
      { citation: "Dally J. W., Riley W. F. (2005). Experimental Stress Analysis, 4th ed. College House Enterprises. Theory of photoelasticity." },
    ],
  },
  {
    slug: "photorefractive",
    title: "Photorefractive Effect",
    description: "Light-induced refractive index changes via space-charge fields in electro-optic materials. Key for holographic storage, phase conjugation, and beam coupling.",
    keywords: ["Two-Beam Coupling", "Space-Charge Field", "Kukhtarev Model", "Photorefractive Gain"],
    tier: "textbook",
    modelNote: "Steady-state Kukhtarev diffusion grating, small m: E_sc = E_D/(1 + E_D/E_q), Γ = 2πn³r_eff E_sc/(λ cos θ). e-beams: Feinberg's tensor r_eff with cos 2θ contrast and ε along K. BaTiO₃ clamped and free sets as limits; no grating piezo/elasto-optic terms, walk-off, photovoltaic current or applied field.",
    references: [
      {
        citation: "Kukhtarev N. V., Markov V. B., Odulov S. G., Soskin M. S., Vinetskii V. L. (1978). Holographic storage in electrooptic crystals. I. Steady state. Ferroelectrics 22, 949–960.",
        url: "https://doi.org/10.1080/00150197908239450",
      },
      {
        citation: "Yeh P. (1989). Two-wave mixing in nonlinear media. IEEE J. Quantum Electron. 25, 484–519.",
        url: "https://doi.org/10.1109/3.18564",
      },
      {
        citation: "Feinberg J., Heiman D., Tanguay A. R. Jr., Hellwarth R. W. (1980). Photorefractive effects and light-induced charge migration in barium titanate. J. Appl. Phys. 51, 1297–1305. Eq. 7 (ε along K), eqs. 13 and 19 (tensor coupling of the two beams); the e-wave r_eff(β, θ) on this page is contracted from them.",
        url: "https://doi.org/10.1063/1.327824",
      },
      {
        citation: "Zgonik M., Bernasconi P., Duelli M., Schlesser R., Günter P., Garrett M. H., Rytz D., Zhu Y., Wu X. (1994). Dielectric, elastic, piezoelectric, electro-optic, and elasto-optic tensors of BaTiO₃ crystals. Phys. Rev. B 50, 5941–5949. Table II (clamped r₁₃, r₃₃, r₄₂, ε₁₁, ε₃₃) and Table III (stress-free values), 633 nm, 23 °C.",
        url: "https://doi.org/10.1103/PhysRevB.50.5941",
      },
      {
        citation: "Wemple S. H., DiDomenico M. Jr., Camlibel I. (1968). Dielectric and optical properties of melt-grown BaTiO₃. J. Phys. Chem. Solids 29, 1797–1803 (n_o, n_e single-oscillator fits, 0.4–0.7 µm, via the refractiveindex.info database).",
        url: "https://doi.org/10.1016/0022-3697(68)90164-9",
      },
      {
        citation: "Weis R. S., Gaylord T. K. (1985). Lithium niobate: summary of physical properties and crystal structure. Appl. Phys. A 37, 191–203.",
        url: "https://doi.org/10.1007/BF00614817",
      },
      {
        citation: "Zelmon D. E., Small D. L., Jundt D. (1997). Infrared corrected Sellmeier coefficients for congruently grown lithium niobate and 5 mol.% magnesium oxide–doped lithium niobate. J. Opt. Soc. Am. B 14, 3319.",
        url: "https://doi.org/10.1364/JOSAB.14.003319",
      },
    ],
  },
  {
    slug: "polymer-optics",
    title: "Polymer Optical Materials",
    description: "Refractive index, group index and Abbe number of PMMA, polycarbonate, polystyrene, Zeonex, NOA 61 and SU-8 from published dispersion fits, with surface reflectance and the NA of a polymer core/cladding pair.",
    tier: "textbook",
    modelNote: "Published fits (Sellmeier, n² power series, Cauchy), each valid only in its measured range; Sultanova's fits match her data within 0.001. Grade, cure and temperature shift n by ~0.003, so V_d is good to ~10 %. No loss model: C–H overtones make these polymers lossy in the near infrared.",
    references: [
      {
        citation: "Sultanova N., Kasarova S., Nikolov I. (2009). Dispersion properties of optical polymers. Acta Phys. Pol. A 116, 585–587. Table: measured indices (±0.001, 20 °C) and Abbe numbers of PMMA, PC, PS and Zeonex E48R.",
        url: "https://doi.org/10.12693/APhysPolA.116.585",
      },
      {
        citation: "Beadie G., Brindza M., Flynn R. A., Rosenberg A., Shirk J. S. (2015). Refractive index measurements of poly(methyl methacrylate) (PMMA) from 0.4–1.6 μm. Appl. Opt. 54, F139–F143.",
        url: "https://doi.org/10.1364/AO.54.00F139",
      },
      {
        citation: "Polyanskiy M. N. refractiveindex.info database: Sellmeier fits of Sultanova's data; Norland NOA 61 and MicroChem SU-8 2000 (uncured) Cauchy coefficients.",
        url: "https://refractiveindex.info",
      },
      {
        citation: "Norland Products. NOA 61 technical data sheet: cured-polymer index 1.56 and 1.5562, 1.5594, 1.5634, 1.5691, 1.5754 at 643.8, 589.6, 546.1, 480.0, 435.8 nm.",
        url: "https://web.archive.org/web/20220326214528/https://norlandprod.com/literature/61tds.pdf",
      },
    ],
  },
  {
    slug: "radiation-damage",
    title: "Radiation Damage Effects",
    description: "Radiation-induced attenuation of glass and fibre as a power law of dose, A₁D^f: induced loss in dB/m and dB, internal transmission, and the dose that uses up a loss budget.",
    tier: "illustrative",
    modelNote: "A(D) = A₁D^f with 0 < f ≤ 1, fitted per glass, wavelength, dose rate and temperature; no material presets. Recovery after exposure, dose-rate and temperature effects and index changes are not modelled.",
    references: [
      {
        citation: "Griscom D. L., Gingerich M. E., Friebele E. J. (1994). Model for the dose, dose-rate and temperature dependence of radiation-induced loss in optical fibers. IEEE Trans. Nucl. Sci. 41, 523–527.",
        url: "https://doi.org/10.1109/23.299793",
      },
    ],
  },
  {
    slug: "raman-scattering",
    title: "Raman Scattering",
    description: "Stimulated Raman gain of diamond, Ba(NO₃)₂, KGW, As₂S₃ glass and fused silica: Stokes wavelength, peak gain at your pump wavelength, Lorentzian gain line, dephasing time and single-pass gain e^(gIL).",
    keywords: ["Raman Gain Coefficient", "Stimulated Raman Scattering", "Raman Crystal", "Stokes Wavelength", "Diamond Raman Laser"],
    tier: "textbook",
    modelNote: "Steady-state SRS (pulses much longer than T₂) of an undepleted plane-wave pump, with a homogeneous Lorentzian line. Gains are interpolated in pump wavenumber between measured points (diamond: six Savitski 2013 points; KGW and Ba(NO₃)₂: 532 nm measured, 1064 nm vendor; the two do not follow one 1/λ_p law, so between them the gain is good to about ±40 %); outside the measured pump range a gain is scaled as 1/λ_p and flagged as an estimate. The silica and As₂S₃ glass lines are broad and not Lorentzian; As₂S₃ absorbs visible pumps; no UV absorption edge is applied for KGW and Ba(NO₃)₂.",
    references: [
      {
        citation: "Savitski V. G., Reilly S., Kemp A. J. (2013). Steady-state Raman gain in diamond as a function of pump wavelength. IEEE J. Quantum Electron. 49, 218–223. Table 1.",
        url: "https://doi.org/10.1109/JQE.2012.2237505",
      },
      {
        citation: "Basiev T. T., Sobol A. A., Zverev P. G., Osiko V. V., Powell R. C. (1999). Comparative spontaneous Raman spectroscopy of crystals for Raman lasers. Appl. Opt. 38, 594–598. Raman shifts and linewidths.",
        url: "https://doi.org/10.1364/AO.38.000594",
      },
      {
        citation: "EKSMA Optics. KGW / Ba(NO₃)₂ crystals for stimulated Raman scattering, data sheet. Raman gain at 1064 nm (vendor values; KGW 901 cm⁻¹ p[mm]p, 768 cm⁻¹ p[gg]p).",
        url: "https://eksmaoptics.com/out/media/EKSMA_Optics_KGW-BaNO32_Crystal.pdf",
      },
      {
        citation: "Markevich V. U., Chulkov R. V. (2016). Determination of the steady-state Raman gain coefficients of potassium-gadolinium tungstate at 532 nm. Vestsi NAN Belarusi, Ser. Fiz.-Mat. Navuk, no. 1, 102–106. KGW 14 ± 3 (901 cm⁻¹, E ∥ N_m) and 11 ± 3 cm/GW (767 cm⁻¹, E ∥ N_g); Ba(NO₃)₂ 43 ± 5 cm/GW.",
        url: "https://vestifm.belnauka.by/jour/article/view/15",
      },
      {
        citation: "Stegeman R., Stegeman G., Delfyett P., et al. (2006). Raman gain measurements and photo-induced transmission effects of germanium- and arsenic-based chalcogenide glasses. Opt. Express 14, 11702–11708. Table 1: As₂S₃ 74 ± 15e-13 m/W at 10 THz, 1064 nm pump.",
        url: "https://doi.org/10.1364/OE.14.011702",
      },
      {
        citation: "Stolen R. H., Ippen E. P. (1973). Raman gain in glass optical waveguides. Appl. Phys. Lett. 22, 276–278.",
        url: "https://doi.org/10.1063/1.1654637",
      },
      {
        citation: "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed. Academic Press. Silica Raman gain ≈ 1e-13 m/W at 1 µm, peak near 13.2 THz, scaling as 1/λ_p.",
        url: "https://doi.org/10.1016/C2018-0-01168-8",
      },
    ],
    related: [
      { href: "/fiber-optics/srs-threshold", note: "SRS threshold and Raman gain of a silica fibre span." },
      { href: "/spectroscopy/raman-shift", note: "Raman shift between laser and scattered wavelengths." },
    ],
  },
  {
    slug: "rare-earth-absorption",
    title: "Rare-Earth Dopant Absorption",
    keywords: ["Rare Earth Absorption Spectra"],
    description: "Absorption coefficient of Er³⁺, Yb³⁺, Tm³⁺ or Ho³⁺ in silica from the cross-section and wt-ppm concentration: α in m⁻¹ and dB/m, absorption length and transmission over a path.",
    tier: "textbook",
    modelNote: "Small-signal absorption α = Γσ_aN of an unpumped sample (no bleaching or excited-state absorption) and T = e^(−αL) without surface reflections. N from wt-ppm in silica (2201 kg/m³). Preset cross-sections, shared with the fibre amplifier pages, are measured in one fibre each: Er³⁺ in GeO₂–Al₂O₃–SiO₂ (Barnes 1991; 980 nm from Table V, 1480 and 1550 nm read from Fig. 6 to ±0.15e-25 m²), Yb³⁺ in aluminosilicate (Melkumov 2004) and Tm³⁺ in Al/La silica (Agger & Povlsen 2006; ³F₄ band only, 1740 and 1900 nm read from Figs. 3–4) and Ho³⁺ in silica (Le Gouët et al. 2020; ⁵I₇ band only, σ_a(1946) 4.3 ± 0.2e-25 m², 1995 and 2120 nm read from Fig. 1). They vary with the host by tens of percent. Nd is not offered.",
    references: [
      {
        citation: "Giles C. R., Desurvire E. (1991). Modeling erbium-doped fiber amplifiers. J. Lightwave Technol. 9, 271–283. Absorption α = Γσ_aN, eqs. (6)–(9).",
        url: "https://doi.org/10.1109/50.65886",
      },
      {
        citation: "Barnes W. L., Laming R. I., Tarbox E. J., Morkel P. R. (1991). Absorption and emission cross section of Er³⁺ doped silica fibers. IEEE J. Quantum Electron. 27, 1004–1010. GeO₂–Al₂O₃–SiO₂: Table V, Fig. 6(c), τ 10.2 ms; absolute scale ±20 % (Table VI).",
        url: "https://doi.org/10.1109/3.83335",
      },
      {
        citation: "Melkumov M. A., Bufetov I. A., Kravtsov K. S., Shubin A. V., Dianov E. M. (2004). Lasing parameters of ytterbium-doped fibres doped with P₂O₅ and Al₂O₃. Quantum Electron. 34, 843–848. Full report arXiv:1502.02885, Appendix 2 (aluminosilicate), τ 0.83 ms.",
        url: "https://arxiv.org/abs/1502.02885",
      },
      {
        citation: "Agger S. D., Povlsen J. H. (2006). Emission and absorption cross section of thulium doped silica fibers. Opt. Express 14, 50–57. Al/La-silica fibre Tm1: σ_a(1600) 3.5e-25 m², σ_e/σ_a 0.10 (1600 nm) and 1.20 (1740 nm), τ 650 µs; 1740 and 1900 nm read from the vector data of Figs. 3–4.",
        url: "https://doi.org/10.1364/OPEX.14.000050",
      },
      {
        citation: "Le Gouët J., Gustave F., Bourdon P., Robin T., Laurent A., Cadier B. (2020). Realization and simulation of high-power holmium doped fiber lasers for long-range transmission. Opt. Express 28, 22307; arXiv:2003.14188. Silica fibre: σ_a(1946) 4.3 ± 0.2e-25 m² (fibre #2, 425 dB/m), σ_e/σ_a 1.40 ± 0.06 at the peaks, 1.9/1.6e-25 m² at 1908 nm, τ 0.7 ms; 1995 and 2120 nm read from the raster Fig. 1.",
        url: "https://doi.org/10.1364/OE.394011",
      },
    ],
    related: [
      { href: "/fiber-optics/rare-earth-doped", note: "Pumped Er, Yb, Tm or Ho fibre: overlap, gain, saturation power and noise figure." },
      { href: "/spectroscopy/lambert-beer-law", note: "Beer–Lambert absorbance from ε, concentration and path." },
    ],
  },
  {
    slug: "semiconductor-bandgap",
    title: "Semiconductor Bandgap",
    description: "Bandgap energy and absorption edge vs temperature using the Varshni equation. Direct vs indirect gap materials.",
    tier: "textbook",
    modelNote: "Varshni E_g(T) = E_g(0) − αT²/(T + β) with Sze's sets for Si and Ge and Vurgaftman's for the III–V compounds (GaP: indirect X gap; GaN: wurtzite). In₀.₅₃Ga₀.₄₇As interpolates the GaAs and InAs gaps with bowing 0.477 eV. The fits are made for roughly 0–500 K; the slider goes to 700 K. The absorption edge hc/E_g ignores excitons and the Urbach tail.",
    references: [
      {
        citation: "Varshni Y. P. (1967). Temperature dependence of the energy gap in semiconductors. Physica 34, 149–154.",
        url: "https://doi.org/10.1016/0031-8914(67)90062-6",
      },
      {
        citation: "Vurgaftman I., Meyer J. R., Ram-Mohan L. R. (2001). Band parameters for III–V compound semiconductors and their alloys. J. Appl. Phys. 89, 5815–5875. Varshni sets (Tables I–X) and the Ga₁₋ₓInₓAs bowing C = 0.477 eV (Table XIII).",
        url: "https://doi.org/10.1063/1.1368156",
      },
      {
        citation: "Sze S. M. (1981). Physics of Semiconductor Devices, 2nd ed. Wiley, ch. 1. Si (1.17 eV, 4.73e-4 eV/K, 636 K) and Ge (0.7437 eV, 4.774e-4 eV/K, 235 K), as tabulated in V. Palankovski, PhD thesis, TU Wien (2000), §3.3.1.1.",
        url: "https://www.iue.tuwien.ac.at/phd/palankovski/node37.html",
      },
    ],
  },
  {
    slug: "thermal-conductivity-optics",
    title: "Thermal Conductivity for Optics",
    description: "Room-temperature thermal conductivity of window materials (Crystran) and what it means for an absorbing optic: thermal resistance, face-to-face and beam centre-to-edge temperature rise, and the dn/dT thermal lens.",
    tier: "textbook",
    modelNote: "Steady state, constant room-temperature k (Si: Crystran's 273 K value). ΔT = Pd/(kA) through a slab absorbing at one face (half that for uniform bulk absorption); P/(4πkd) beam centre to edge for uniform heating with radial flow; dn/dT lens f = 2kA/(P dn/dT) (Koechner's rod). Stress-optic and end-bulging lens terms, Gaussian heating, axial flow and k(T) are not modelled.",
    references: [
      {
        citation: "Koechner W. (2006). Solid-State Laser Engineering, 6th ed. Springer. Ch. 7: temperature profile and thermal lens of a uniformly heated rod.",
        url: "https://doi.org/10.1007/0-387-29338-8",
      },
      {
        citation: "Crystran. Handbook of Infrared and Ultraviolet Optical Materials, data sheets: thermal conductivity and dn/dT.",
        url: "https://www.crystran.com/optical-materials",
      },
      {
        citation: "Glassbrenner C. J., Slack G. A. (1964). Thermal conductivity of silicon and germanium from 3 °K to the melting point. Phys. Rev. 134, A1058–A1069.",
        url: "https://doi.org/10.1103/PhysRev.134.A1058",
      },
    ],
  },
  {
    slug: "thermal-expansion",
    title: "Thermal Expansion",
    description: "Length change ΔL = α·L·ΔT, strain and the change in 633 nm waves, with room-temperature expansion coefficients of optical glasses, crystals and mount metals, and silicon's α(T) integrated from 120 to 1500 K.",
    keywords: ["Coefficient of Thermal Expansion"],
    tier: "textbook",
    modelNote: "ΔL = αLΔT with one room-temperature α, good over tens of kelvin. Silicon: Okada & Tokumaru's α(T) (120–1500 K, ±0.2 ×10⁻⁶/K; 2.57 at 300 K, 4.56 at 1500 K) integrated in closed form, ΔL = L·expm1(∫α dT). Crystals from Crystran; glasses from SCHOTT, Corning (ULE and Zerodur: the specified limit) and Kaye & Laby; metals at 293 K from Kaye & Laby or the slope of NIST's fits. Alloys vary with heat treatment (Invar 0.13–1.2).",
    references: [
      {
        citation: "Okada Y., Tokumaru Y. (1984). Precise determination of lattice parameter and thermal expansion coefficient of silicon between 300 and 1500 K. J. Appl. Phys. 56, 314–320.",
        url: "https://doi.org/10.1063/1.333965",
      },
      {
        citation: "Crystran. Handbook of Infrared and Ultraviolet Optical Materials, data sheets: thermal expansion of fused silica, N-BK7, sapphire, CaF₂, MgF₂, Si, Ge, ZnSe and diamond.",
        url: "https://www.crystran.com/optical-materials",
      },
      {
        citation: "SCHOTT optical glass data sheets (2017-01-20): SF11 α 6.1, N-SF11 8.5 ×10⁻⁶/K (−30 to +70 °C).",
        url: "https://refractiveindex.info/download/data/2017/schott_2017-01-20.pdf",
      },
      {
        citation: "SCHOTT. ZERODUR technical details: CTE grades, mean α (0 to 50 °C) 0 ± 0.100 (class 2), 0.050 (class 1), 0.020 (class 0), 0.010, 0.007 ×10⁻⁶/K.",
        url: "https://www.schott.com/en-cz/products/zerodur-p1000269/technical-details",
      },
      {
        citation: "Corning (2016). ULE Corning Code 7972 Ultra Low Expansion Glass, product information: mean CTE 0 ± 30 ppb/°C, 5 to 35 °C.",
        url: "https://web.archive.org/web/20251216175218/https://www.corning.com/media/worldwide/csm/documents/7972%20ULE%20Product%20Information%20Jan%202016.pdf",
      },
      {
        citation: "Kaye & Laby Tables of Physical and Chemical Constants, §2.3.5 Thermal expansion (NPL, archived web edition): α at 293 K of Cu 16.5, borosilicate (Pyrex) 2.8, Invar 0.13, austenitic stainless 14.1 ×10⁻⁶/K.",
        url: "https://web.archive.org/web/2019/http://www.kayelaby.npl.co.uk/general_physics/2_3/2_3_5.html",
      },
      {
        citation: "NIST Cryogenic Technologies Group. Material properties of 6061-T6 aluminum, Invar (Fe-36Ni) and 304 stainless: fits of (L − L₂₉₃)/L₂₉₃ over 4–300 K, whose slopes at 293 K give 22.6, 0.9 and 15.4 ×10⁻⁶/K.",
        url: "https://trc.nist.gov/cryogenics/materials/materialproperties.htm",
      },
    ],
  },
  {
    slug: "transparency-range",
    title: "Window Materials Transparency Range",
    description: "Transmission bands of UV, visible and IR window materials (LiF, MgF₂, CaF₂, fused silica, sapphire, alkali halides, ZnSe, Si, Ge), with the refractive index and the Fresnel-limited transmission 2n/(n² + 1) at any wavelength.",
    keywords: ["UV Optical Materials"],
    tier: "textbook",
    modelNote: "An uncoated, non-absorbing window at normal incidence, its two surfaces' multiple reflections added in intensity: T = 2n/(n² + 1), an upper bound inside the band. n from published Sellmeier fits (the ordinary ray for uniaxial crystals); the bands are Crystran data-sheet ranges, whose edges depend on thickness and grade.",
    references: [
      { citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed. Cambridge University Press. Fresnel formulae at normal incidence." },
      {
        citation: "Crystran. Handbook of Infrared and Ultraviolet Optical Materials, data sheets: transmission ranges and two-surface reflection losses.",
        url: "https://www.crystran.com/optical-materials",
      },
      {
        citation: "refractiveindex.info database (CC0). Sellmeier data sets, each with its original reference shown on the page.",
      },
      {
        citation: "Li H. H. (1976). Refractive index of alkali halides and its wavelength and temperature derivatives. J. Phys. Chem. Ref. Data 5, 329. LiF, NaCl, KBr, CsI.",
        url: "https://doi.org/10.1063/1.555536",
      },
      {
        citation: "Dodge M. J. (1984). Refractive properties of magnesium fluoride. Appl. Opt. 23, 1980.",
        url: "https://doi.org/10.1364/AO.23.001980",
      },
      {
        citation: "Malitson I. H. (1965). Interspecimen comparison of the refractive index of fused silica. J. Opt. Soc. Am. 55, 1205.",
        url: "https://doi.org/10.1364/JOSA.55.001205",
      },
      {
        citation: "Rodney W. S., Malitson I. H. (1956). Refraction and dispersion of thallium bromide iodide. J. Opt. Soc. Am. 46, 956. KRS-5.",
        url: "https://doi.org/10.1364/JOSA.46.000956",
      },
    ],
  },
  {
    slug: "two-photon-absorption",
    title: "Two-Photon Absorption",
    description: "Two-photon absorption of semiconductors (GaAs, CdTe, ZnSe and others), silicon, fused silica, sapphire, BaF₂, BBO, LiNbO₃ and KTP: measured β scaled across the 2PA window, induced absorption βI and slab transmission 1/(1 + βI₀L).",
    keywords: ["Two-Photon Absorption Coefficient", "Nonlinear Absorption", "Optical Limiting", "Band-Gap Scaling"],
    tier: "textbook",
    modelNote: "Degenerate 2PA between two parabolic bands, valid for E_g/2 < ħω < E_g. A measured β is moved to another wavelength by the ratio of F₂(x) = (x − 1)^(3/2)/x⁵, with n held constant. Wide-gap solids use DeSalvo's fitted effective gap E′_g; away from their measured wavelength the scaling is order-of-magnitude (the two-band model diverges near the 2PA edge). Indirect-gap silicon uses Bristow's phonon-assisted fit β = Σₙ 2C F₂⁽ⁿ⁾(ħω/E_gi), C = 43 cm/GW, 850–2214 nm. Transmission is for a plane wave of constant intensity, without linear, free-carrier or reflection losses. Measured β carry about ±20–40 % error.",
    references: [
      {
        citation: "Van Stryland E. W., Woodall M. A., Vanherzeele H., Soileau M. J. (1985). Energy band-gap dependence of two-photon absorption. Opt. Lett. 10, 490–492. Eq. 1–2 and Table 1.",
        url: "https://doi.org/10.1364/OL.10.000490",
      },
      {
        citation: "Sheik-Bahae M., Hagan D. J., Van Stryland E. W. (1990). Dispersion and band-gap scaling of the electronic Kerr effect in solids associated with two-photon absorption. Phys. Rev. Lett. 65, 96–99.",
        url: "https://doi.org/10.1103/PhysRevLett.65.96",
      },
      {
        citation: "DeSalvo R., Said A. A., Hagan D. J., Van Stryland E. W., Sheik-Bahae M. (1996). Infrared to ultraviolet measurements of two-photon absorption and n₂ in wide bandgap solids. IEEE J. Quantum Electron. 32, 1324–1333. Tables I–II: β, E′_g and n.",
        url: "https://doi.org/10.1109/3.511545",
      },
      {
        citation: "Bristow A. D., Rotenberg N., van Driel H. M. (2007). Two-photon absorption and Kerr coefficients of silicon for 850–2200 nm. Appl. Phys. Lett. 90, 191104. β = 2.1 cm/GW at 1220 nm; indirect-gap fit C = 43 cm/GW.",
        url: "https://doi.org/10.1063/1.2737359",
      },
    ],
  },
  {
    slug: "x-ray-optics",
    title: "X-ray Optics Materials",
    description: "X-ray refractive index n = 1 − δ − iβ of Be, diamond, Si, Ni, Cu, Mo, Pt, Au, Kapton and Si₃N₄ from 1 to 30 keV, from the Henke scattering factors: critical angle, attenuation length, μ/ρ and transmission, with absorption edges.",
    tier: "textbook",
    modelNote: "δ, β = (r_e λ²/2π) Σ n_q f₁,₂ with the Henke f₁, f₂ of independent atoms (CXRO tables, interpolated within 0.2 %); θ_c = √(2δ), μ = 4πβ/λ. Approximate within ~50 eV of an edge. β adds Compton scattering, (λ/4π) Σ n_q σ_inc,q with the NIST XCOM σ_inc (Hubbell et al. 1975), as CXRO does (within 0.2 % of CXRO's β). Rayleigh scattering is left out, as in CXRO: it would add 18 % to Be's narrow-beam attenuation at 10 keV and about 10 % to Be's and Si's at 30 keV.",
    references: [
      {
        citation: "Henke B. L., Gullikson E. M., Davis J. C. (1993). X-ray interactions: photoabsorption, scattering, transmission, and reflection at E = 50–30,000 eV, Z = 1–92. At. Data Nucl. Data Tables 54, 181–342.",
        url: "https://doi.org/10.1006/adnd.1993.1013",
      },
      {
        citation: "CXRO X-ray Database (Lawrence Berkeley National Laboratory). Atomic scattering factor files (sf/<element>.nff) and index-of-refraction calculator; default densities.",
        url: "https://henke.lbl.gov/optical_constants/",
      },
      {
        citation: "Kaloyeros A. E., Pan Y., Goff J., Arkles B. (2020). Review—Silicon nitride and silicon nitride-rich thin film technologies: state-of-the-art processing technologies, properties, and applications. ECS J. Solid State Sci. Technol. 9, 063006. Table I: bulk Si₃N₄ 3.10–3.20 g/cm³ (α 3.184), CVD films ≈ 2.8; the Si₃N₄ preset uses 3.18, not CXRO's 3.44.",
        url: "https://doi.org/10.1149/2162-8777/aba447",
      },
      {
        citation: "Hubbell J. H., Veigele W. J., Briggs E. A., Brown R. T., Cromer D. T., Howerton R. J. (1975). Atomic form factors, incoherent scattering functions, and photon scattering cross sections. J. Phys. Chem. Ref. Data 4, 471–538.",
        url: "https://doi.org/10.1063/1.555523",
      },
      {
        citation: "Berger M. J., Hubbell J. H., Seltzer S. M. et al. XCOM: Photon Cross Sections Database (NIST Standard Reference Database 8). Incoherent scattering cross-sections, queried 2026-11-03.",
        url: "https://physics.nist.gov/PhysRefData/Xcom/html/xcom1.html",
      },
      {
        citation: "Als-Nielsen J., McMorrow D. (2011). Elements of Modern X-ray Physics, 2nd ed., Wiley. Ch. 3: refractive index and critical angle.",
        url: "https://doi.org/10.1002/9781119998365",
      },
    ],
  },
];
