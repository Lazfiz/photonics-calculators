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
    title: "Acousto-Optic Materials",
    description: "Acousto-optic figure of merit, Bragg angle, and deflection calculations",
    knownIssue: "The M₂ values hold for acoustic modes and wavelengths the page does not show, and the Bragg angle is the isotropic one, which anisotropic TeO₂ shear cells do not follow.",
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
    description: "Ordinary (nₒ) and extraordinary (nₑ) refractive indices",
    knownIssue: "The Sellmeier sets are mis-transcribed for most crystals: quartz uses fused-silica data, and the calcite, BBO, KDP, LiNbO₃ and rutile indices are wrong by up to 0.5.",
  },
  {
    slug: "brewster-tir",
    title: "Brewster Angle & Total Internal Reflection",
    description: "Interactive Brewster-angle and critical-angle explorer with common material presets.",
    lede: "Interactive Brewster-angle and critical-angle explorer with common interface presets.",
    related: [
      { href: "/materials/aging-effects" },
      { href: "/materials/birefringent-crystals" },
      { href: "/materials/brillouin-scattering" },
      { href: "/materials/calcite-properties" },
    ],
  },
  {
    slug: "brillouin-scattering",
    title: "Brillouin Scattering",
    description: "Stimulated Brillouin scattering (SBS): frequency shift, gain coefficient, and power threshold in optical fibers and bulk materials.",
    knownIssue: "The Brillouin shift is shown 1000 times too large, the gain formula omits the acoustic velocity, and the SBS threshold uses fixed placeholders for the effective area and length.",
  },
  {
    slug: "calcite-properties",
    title: "Calcite (CaCO₃) Properties",
    description: "Uniaxial negative crystal with the largest birefringence of common optical crystals. Δn ≈ 0.172 at 589nm.",
    knownIssue: "The ordinary and extraordinary indices come from a wrong formula, so calcite shows a birefringence of +0.03 instead of −0.17 and the walk-off angle is wrong.",
  },
  {
    slug: "chalcogenide-glass",
    title: "Chalcogenide Glass Properties",
    description: "IR-transparent glasses for thermal imaging, sensing, and nonlinear optics",
    knownIssue: "The dispersion formulas have a resonance inside the transmission window, so the index is wrong or undefined between about 3 and 6 µm.",
  },
  {
    slug: "chromatic-dispersion",
    title: "Material Dispersion (Sellmeier)",
    description: "Refractive index, group index, GVD β₂ and dispersion D from published Sellmeier formulas for crystals, fused silica and SCHOTT glasses, with their coefficients and an n(λ) comparison.",
    keywords: ["Group Velocity Dispersion (GVD)", "Group Index (ng)", "Sellmeier Equation"],
    tier: "exact",
    modelNote: "Exact for the published Sellmeier formula inside its fit range, with analytic derivatives. The formula is itself a fit to measurements (typically ±1e-5 to ±1e-4 in n) at the temperature of those measurements.",
    references: [
      {
        citation: "refractiveindex.info database (CC0). Sellmeier data sets for fused silica and nine crystals, each with its original reference shown on the page.",
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
    slug: "crystal-birefringence",
    title: "Crystal Birefringence Data",
    description: "Δn = |nₒ − nₑ| for uniaxial and birefringent crystals at selected wavelength",
    knownIssue: "Rutile and YVO₄ indices are wrong and the BBO values are for 1064 nm, not 589 nm. The indices do not change with the wavelength you enter.",
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
    description: "Diamond — the ultimate optical material. Bandgap: 5.47 eV. n ≈ 2.42.",
    knownIssue: "The refractive index comes from an ad hoc fit that is 0.05 too high at 589 nm, and hardness, dn/dT and thermal expansion are shown with wrong values or units.",
  },
  {
    slug: "electro-optic",
    title: "Electro-Optic Coefficients",
    description: "Pockels effect materials for modulators, Q-switches, and phase shifters",
    knownIssue: "The half-wave voltage is the retardation value λ/(2n³r) while the phase shift is for one polarization, so they disagree by 2. The electrode gap input is not used.",
  },
  {
    slug: "fluoride-glass",
    title: "Fluoride Glass (ZBLAN)",
    description: "Heavy-metal fluoride glasses for mid-IR fiber optics and low-loss transmission",
    knownIssue: "The dispersion formula has a resonance near 3 µm and does not reproduce the listed n_d, so the index shown is wrong across most of the range.",
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
    description: "Compare IR transmitting materials (Ge, Si, ZnSe, ZnS, fluorides, NaCl): refractive index at any wavelength and temperature, transmission range and thermal properties.",
    lede: "Compare IR transmitting materials. n(λ, T) = n(λ, T₀) + (dn/dT)(T − T₀), with n(λ, T₀) from each material's published Sellmeier formula.",
    keywords: ["Infrared Materials"],
    tier: "textbook",
    modelNote: "Index from published Sellmeier fits inside their ranges, shifted linearly by one typical dn/dT. The dn/dT, thermal conductivity and Knoop hardness are data-sheet values not yet checked against sources.",
    references: [
      {
        citation: "refractiveindex.info database (CC0). Sellmeier data sets, each with its original reference shown on the page. Used for Ge, Si, ZnSe, ZnS, CaF₂, BaF₂, MgF₂ and NaCl.",
      },
      {
        citation: "Crystran data sheet (KRS-5) and Amorphous Materials data sheet (AMTIR-1). Index at 10 µm, the only dispersion data for these two.",
      },
    ],
  },
  {
    slug: "magneto-optic",
    title: "Magneto-Optic Materials",
    description: "Faraday rotation, Verdet constants, and isolator design calculations",
    knownIssue: "YIG and Bi:YIG are ferrimagnetic, so their rotation saturates near 0.2 T instead of growing as V·B·L, and the 1/λ² scaling misses the tabulated Verdet values by up to 20 %.",
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
    title: "Photoelastic Constants",
    description: "Stress-induced birefringence: Δn = C · σ, where C is the stress-optic coefficient",
    knownIssue: "Si, Ge, GaAs, BaF₂, diamond and ZnSe silently use a placeholder stress-optic coefficient, and water is given a stress birefringence that a liquid cannot sustain.",
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
    slug: "quartz-crystal",
    title: "Quartz Crystal (SiO₂) Properties",
    description: "Uniaxial positive, optically active, piezoelectric. Sellmeier dispersion for o & e rays.",
    knownIssue: "The Sellmeier formula is not the cited Ghosh fit: indices are off by about 0.001 and the birefringence is up to twice too large in the infrared.",
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
    slug: "sapphire-properties",
    title: "Sapphire (Al₂O₃) Properties",
    description: "Uniaxial crystal. Sellmeier equations for ordinary and extraordinary rays.",
    knownIssue: "Two extraordinary-ray Sellmeier terms are mis-transcribed, so nₑ and the birefringence are off in the UV, and the temperature chart is flat because dn/dT is scaled twice.",
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
    title: "Transparency Range",
    description: "UV cutoff to IR cutoff for common optical materials",
    knownIssue: "Transmission percentages come from an invented bell-shaped curve, not measured data, and exceed the Fresnel limit for high-index materials such as germanium.",
  },
  {
    slug: "two-photon-absorption",
    title: "Two-Photon Absorption",
    description: "Nonlinear absorption coefficient β₂PA and intensity-dependent transmission. TPA becomes significant at high peak intensities (pulsed lasers).",
    knownIssue: "β comes from an ad hoc (λg/λ)³ scaling that overestimates measured two-photon coefficients several-fold and jumps by 100× below λg/2.",
  },
  {
    slug: "uv-materials",
    title: "UV Optical Materials",
    description: "Deep UV to near-UV materials comparison. Sellmeier: n² = 1 + Σ Biλ²/(λ² - Ci)",
    knownIssue: "The LiF and CsI dispersion coefficients do not match published data, giving index errors near 0.1, and the MgF₂ curve deviates in the infrared.",
  },
  {
    slug: "verdet-constant",
    title: "Verdet Constant",
    description: "Faraday rotation: θ = V · B · L, where V ∝ 1/λ² for paramagnetic materials",
    knownIssue: "Diamagnetic materials carry the wrong sign, ZnSe is scaled from a 10.6 µm value to about 34000 rad/(T·m) at 633 nm, and the 45° isolator length comes out negative for TGG.",
  },
  {
    slug: "x-ray-optics",
    title: "X-ray Optics Materials",
    description: "X-ray refractive index: n = 1 - δ - iβ. For hard X-rays, δ,β ∝ λ² ∝ 1/E².",
    knownIssue: "The tabulated δ values disagree with the listed f₁ by up to a factor of 2.3, and β is scaled as 1/E² instead of about 1/E⁴, so penetration depths are wrong away from 10 keV.",
  },
];
