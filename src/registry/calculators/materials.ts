import type { CalculatorEntry } from "../types";

export const materials: CalculatorEntry[] = [
  {
    slug: "absorption",
    title: "Absorption Coefficient",
    description: "Wavelength-dependent absorption coefficient α(λ) and transmission through material thickness.",
    knownIssue: "The material absorption coefficients are invented and wrong by orders of magnitude, so the transmission is only a Beer–Lambert illustration.",
  },
  {
    slug: "acousto-optic",
    title: "Acousto-Optic Bragg Cell",
    description: "Acousto-optic Bragg cell design: Bragg and deflection angles, scan range, Klein–Cook Q, first-order diffraction efficiency from the figure of merit M₂ and acoustic power, access time and resolvable spots, for TeO₂, PbMoO₄ and fused silica.",
    keywords: ["Acousto-Optic Materials", "AOM", "Acousto-Optic Deflector", "Figure of Merit M₂"],
    tier: "textbook",
    modelNote: "Isotropic Bragg diffraction of plane waves with acoustic attenuation ignored. M₂ and the sound velocity hold for the listed acoustic mode at 633 nm. TeO₂ slow-shear deflectors use anisotropic diffraction, so their Bragg angles differ from the isotropic ones.",
    references: [
      {
        citation: "Uchida N., Niizeki N. (1973). Acoustooptic deflection materials and techniques. Proc. IEEE 61, 1073–1092.",
        url: "https://doi.org/10.1109/PROC.1973.9212",
      },
      {
        citation: "Dixon R. W. (1967). Photoelastic properties of selected materials and their relevance for applications to acoustic light modulators and scanners. J. Appl. Phys. 38, 5149–5153.",
        url: "https://doi.org/10.1063/1.1709293",
      },
      {
        citation: "Klein W. R., Cook B. D. (1967). Unified approach to ultrasonic light diffraction. IEEE Trans. Sonics Ultrason. 14, 123–134.",
        url: "https://doi.org/10.1109/T-SU.1967.29423",
      },
      { citation: "Yariv A., Yeh P. (1984). Optical Waves in Crystals. Wiley. Ch. 9, acousto-optics." },
    ],
  },
  {
    slug: "aging-effects",
    title: "Aging of Optical Materials",
    description: "Long-term degradation: transmission loss, solarization, compaction, stress relaxation",
    knownIssue: "All degradation rates are invented placeholders, compaction multiplies a per-GPa·hour rate by pulse fluence, and transmission starts at 100 % with no Fresnel loss.",
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
    description: "Stimulated Brillouin scattering (SBS): frequency shift, gain coefficient, and power threshold in optical fibers and bulk materials.",
    knownIssue: "The Brillouin shift is shown 1000 times too large, the gain formula omits the acoustic velocity, and the SBS threshold uses fixed placeholders for the effective area and length.",
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
        citation: "refractiveindex.info database (CC0). Sellmeier data sets for fused silica, As₂S₃ and ZBLAN glass and twelve crystals, each with its original reference shown on the page.",
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
    description: "Point defects and impurity centers: absorption/emission spectra, cross-sections, and ZPL characteristics. Key for quantum emitters and tunable lasers.",
    knownIssue: "Emission spectra are drawn at the absorption wavelength without the Stokes shift, the quantum-efficiency formula is wrong, and the concentration slider changes nothing.",
  },
  {
    slug: "contamination",
    title: "Contamination Effects",
    description: "Particle contamination impact on optical surfaces",
    knownIssue: "Wavelength has no effect, repeated cleaning makes contamination decay toward zero, and the ppm-based scatter and absorption coefficients are invented rather than sourced.",
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
    description: "LIDT for pulsed and CW laser optics",
    knownIssue: "Pulse duration is labelled in seconds but read in nanoseconds, and fluence uses a flat-top area, so the peak fluence of a Gaussian beam and the damage risk are understated twofold.",
  },
  {
    slug: "diamond-optics",
    title: "Diamond Optics",
    description: "Refractive index of diamond from 226 nm to 20 µm (Peter's Sellmeier formula, Palik's infrared values), Fresnel-limited window transmission, transmission bands, and thermal and mechanical properties.",
    lede: "n(λ) from Peter's Sellmeier formula to 644 nm and Palik's tabulated values beyond; an uncoated, non-absorbing plate transmits at most 2n/(n² + 1).",
    keywords: ["Diamond Refractive Index", "CVD Diamond Window"],
    tier: "textbook",
    modelNote: "Peter's Sellmeier fit is exact for the fit over his 226–644 nm; beyond that the index is interpolated linearly between Palik's values (to 20 µm, changes of a few 1e-4). Transmission is the lossless two-surface Fresnel limit; the 2.5–7 µm multiphonon band and impurities lower it. Properties are room-temperature data-sheet values.",
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
    description: "Pockels effect materials for modulators, Q-switches, and phase shifters",
    knownIssue: "The half-wave voltage is the retardation value λ/(2n³r) while the phase shift is for one polarization, so they disagree by 2. The electrode gap input is not used.",
  },
  {
    slug: "heat-capacity",
    title: "Heat Capacity of Optical Materials",
    description: "Specific heat and thermal energy storage",
    knownIssue: "Cp(T) comes from a broken interpolation that gives about a tenth of the room-temperature value, the heat input treats °C as kelvin, and ρ·Cp is shown 1000 times too small.",
  },
  {
    slug: "humidity-effects",
    title: "Humidity Effects on Optics",
    description: "Water absorption, refractive index changes, and surface degradation",
    knownIssue: "The Relative Humidity field actually sets the exposure days, so humidity cannot be changed, and water uptake, index change and scatter come from invented coefficients.",
  },
  {
    slug: "infrared-glass",
    title: "Infrared Optical Materials",
    description: "Compare IR materials (Ge, Si, ZnSe, ZnS, fluorides, alkali halides, KRS-5, As₂S₃ and ZBLAN glass): refractive index at any wavelength and temperature, Fresnel-limited transmission, transmission band, dn/dT, thermal conductivity and hardness.",
    lede: "Compare IR transmitting materials and glasses. n(λ, T) = n(λ, T₀) + (dn/dT)(T − T₀), with n(λ, T₀) from each material's published Sellmeier formula.",
    keywords: ["Infrared Materials", "Chalcogenide Glass Properties", "Fluoride Glass (ZBLAN)"],
    tier: "textbook",
    modelNote: "Index from published Sellmeier fits inside their ranges, shifted linearly by one room-temperature dn/dT; transmission is the lossless two-surface Fresnel limit 2n/(n² + 1). Bands, dn/dT, conductivity and hardness are Crystran data-sheet values; none are sourced yet for As₂S₃, ZBLAN and AMTIR-1.",
    references: [
      {
        citation: "refractiveindex.info database (CC0). Sellmeier data sets, each with its original reference shown on the page. Used for Ge, Si, ZnSe, ZnS, CaF₂, BaF₂, MgF₂, NaCl, KBr, CsI, As₂S₃ and ZBLAN.",
      },
      {
        citation: "Rodney W. S., Malitson I. H., King T. A. (1958). Refractive index of arsenic trisulfide. J. Opt. Soc. Am. 48, 633.",
        url: "https://doi.org/10.1364/JOSA.48.000633",
      },
      {
        citation: "Gan F. (1995). Optical properties of fluoride glasses: a review. J. Non-Cryst. Solids 184, 9. ZBLAN dispersion formula.",
        url: "https://doi.org/10.1016/0022-3093(94)00592-3",
      },
      {
        citation: "Li H. H. (1976). Refractive index of alkali halides and its wavelength and temperature derivatives. J. Phys. Chem. Ref. Data 5, 329.",
        url: "https://doi.org/10.1063/1.555536",
      },
      {
        citation: "Crystran. Handbook of Infrared and Ultraviolet Optical Materials, data sheets: transmission range, dn/dT, thermal conductivity, Knoop hardness; KRS-5 index at 10 µm.",
        url: "https://www.crystran.com/optical-materials",
      },
      { citation: "Amorphous Materials AMTIR-1 data sheet. Index at 10 µm." },
      { citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed. Cambridge University Press. Fresnel formulae at normal incidence." },
    ],
  },
  {
    slug: "magneto-optic",
    title: "Faraday Rotation & Verdet Constants",
    description: "Faraday rotation θ = VBL in TGG, TSAG, CeF₃ and fused silica, with the Verdet constant's dispersion from published fits, the field or length for a 45° isolator rotator, and YIG's saturated rotation at 1550 nm.",
    keywords: ["Verdet Constant", "Faraday Isolator", "Faraday Rotator", "TGG"],
    tier: "textbook",
    modelNote: "θ = VBL is exact for a uniform field. V(λ) comes from published fits inside their ranges: the single-transition model for the Tb³⁺ and Ce³⁺ paramagnets (Vojna et al.), a dispersion fit for fused silica (Tran et al.). YIG is ferrimagnetic, so only its saturated rotation at 1550 nm is given.",
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
    description: "SHG, OPO, and frequency conversion crystal properties",
    knownIssue: "Crystal length and pump power inputs have no effect, and some d_eff and walk-off values (bulk LiNbO₃, OP-GaAs, ZGP, GaSe) disagree with published data.",
  },
  {
    slug: "nonlinear-index",
    title: "Nonlinear Refractive Index (n₂)",
    description: "Kerr effect: Δn = n₂ · I, where I is the optical intensity",
    knownIssue: "The n₂ input box actually sets the wavelength, there is no intensity input, and the γ value omits the effective area so its units are wrong.",
  },
  {
    slug: "oh-absorption",
    title: "OH Absorption in Silica",
    description: "Hydroxyl (OH⁻) absorption peaks in silica fibers and bulk glass. The fundamental OH stretch at 2.72 µm and overtones at 1.38 µm and 0.94 µm dominate loss spectra.",
    knownIssue: "The concentration input actually sets the fibre length, and Rayleigh scattering is about six times too high, so the 1550 nm loss is about 1 dB/km instead of 0.2 dB/km.",
  },
  {
    slug: "optical-glass-catalog",
    title: "Optical Glass Catalog",
    description: "Interactive glass map and dispersion curves for SCHOTT optical glasses, with catalog n_d, V_d, density and dn/dT, the Abbe number of glasses and crystals, and dn/dT and Δn over temperature.",
    lede: "Interactive glass map and dispersion curves. Sellmeier: n²(λ) = 1 + Σ Bᵢλ²/(λ² − Cᵢ), with SCHOTT catalog coefficients.",
    keywords: ["Schott Glass Catalog", "Abbe Number (Vd)", "Thermo-Optic Coefficient (dn/dT)"],
    tier: "exact",
    modelNote: "SCHOTT catalog values: Sellmeier fits that reproduce each glass's catalog n_d to 1e-5 and V_d to 0.01. V_d of the crystals and fused silica comes from their published formulas. dn/dT and Δn are TIE-19's absolute (vacuum) values for −100 to +140 °C; values relative to air are larger by about n × 0.9e-6 /K. Valid inside each fit's wavelength range.",
    references: [
      {
        citation: "SCHOTT optical glass catalog (Zemax AGF 2017-01-20). Sellmeier coefficients, n_d, V_d and density.",
      },
      {
        citation: "SCHOTT (2016). TIE-19, temperature coefficient of the absolute refractive index (D₀, D₁, D₂, E₀, E₁, λ_TK).",
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
    modelNote: "Linear stress-optic law for isotropic glass at one wavelength (C varies a few percent across the visible). Crystals are not covered: they have a stress-optic tensor, so their birefringence depends on the stress and light directions.",
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
    knownIssue: "The two-beam coupling gain is computed in m⁻¹ but labelled cm⁻¹, so it reads 100 times too large, and several electro-optic coefficients are wrong.",
  },
  {
    slug: "polymer-optics",
    title: "Polymer Optical Materials",
    description: "Refractive index, dispersion, and loss data for optical polymers",
    knownIssue: "The 1300 and 1550 nm losses of PMMA, polycarbonate and polystyrene are far too low, and the index fits differ from the listed values by up to 0.02.",
  },
  {
    slug: "radiation-damage",
    title: "Radiation Damage Effects",
    description: "Radiation-induced absorption and transmission loss in optical materials",
    knownIssue: "Thickness entered in millimetres is used as centimetres, so transmission is far too low, and induced absorption is linear in dose with invented coefficients and no wavelength dependence.",
  },
  {
    slug: "raman-scattering",
    title: "Raman Scattering",
    description: "Spontaneous and stimulated Raman scattering cross-sections and gain spectra for common optical materials.",
    knownIssue: "Peak Raman gains for CS₂, benzene and diamond appear about 100 times too low and their linewidths too wide, and the chart misses narrow lines.",
  },
  {
    slug: "rare-earth-absorption",
    title: "Rare Earth Absorption Spectra",
    description: "Absorption cross-sections for common rare-earth dopants in silica: Er³⁺, Nd³⁺, Yb³⁺, Tm³⁺, Ho³⁺.",
    knownIssue: "The absorption coefficient is displayed 100 times too large, the Nd 1064 nm emission line is counted as absorption, and the Yb 975 nm cross-section is about 6 times too low.",
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
    description: "Heat transport in optical substrates",
    knownIssue: "The k(T) fit does not reproduce its own room-temperature values (32 W/(m·K) for fused silica instead of 1.38), so k and the temperature rise are off by factors of 6 to 30.",
  },
  {
    slug: "thermal-expansion",
    title: "Thermal Expansion",
    description: "ΔL = α · ΔT · L — dimensional change from temperature",
    keywords: ["Coefficient of Thermal Expansion"],
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
    ],
  },
  {
    slug: "two-photon-absorption",
    title: "Two-Photon Absorption",
    description: "Nonlinear absorption coefficient β₂PA and intensity-dependent transmission. TPA becomes significant at high peak intensities (pulsed lasers).",
    knownIssue: "β comes from an ad hoc (λg/λ)³ scaling that overestimates measured two-photon coefficients several-fold and jumps by 100× below λg/2.",
  },
  {
    slug: "x-ray-optics",
    title: "X-ray Optics Materials",
    description: "X-ray refractive index: n = 1 - δ - iβ. For hard X-rays, δ,β ∝ λ² ∝ 1/E².",
    knownIssue: "The tabulated δ values disagree with the listed f₁ by up to a factor of 2.3, and β is scaled as 1/E² instead of about 1/E⁴, so penetration depths are wrong away from 10 keV.",
  },
];
