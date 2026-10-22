import type { CalculatorEntry } from "../types";

export const fiberOptics: CalculatorEntry[] = [
  {
    slug: "attenuation",
    title: "Fiber Attenuation Calculator",
    description: "Spectral attenuation of silica single-mode fiber: Rayleigh scattering, infrared and ultraviolet absorption tails and the 1383 nm water peak, with the minimum-loss wavelength and span loss.",
    heading: "Wavelength-Dependent Attenuation",
    lede: "Fiber loss versus wavelength from Rayleigh scattering, the infrared and ultraviolet absorption tails and the OH water peak, and the loss of a span at your wavelength.",
    tier: "textbook",
    modelNote: "Rayleigh A/λ⁴ plus Keiser's empirical IR and UV tails for GeO₂-doped silica; the 1383 nm OH band is an illustrative Gaussian of input height. Bends, splices and other impurities not included.",
    references: [
      {
        citation: "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed. Wiley. Fiber losses: Rayleigh scattering A/λ⁴ with A ≈ 0.7–0.9 dB·km⁻¹·µm⁴.",
        url: "https://doi.org/10.1002/9780470918524",
      },
      {
        citation: "Keiser G. (2010). Optical Fiber Communications, 4th ed. McGraw-Hill. Attenuation chapter: empirical infrared and ultraviolet absorption of GeO₂-doped silica.",
      },
      {
        citation: "Osanai H., Shioda T., Moriyama T., Araki S., Horiguchi M., Izawa T., Takata H. (1976). Effect of dopants on transmission loss of low-OH-content optical fibres. Electron. Lett. 12, 549. Source of the absorption fits.",
        url: "https://doi.org/10.1049/el:19760418",
      },
      {
        citation: "Humbach O., Fabian H., Grzesik U., Haken U., Heitmann W. (1996). Analysis of OH absorption bands in synthetic silica. J. Non-Cryst. Solids 203, 19. OH band positions and the 1383 nm strength, 62.7 dB/km per ppm (as quoted in arXiv:2303.17814, Table I).",
        url: "https://doi.org/10.1016/0022-3093(96)00329-8",
      },
      {
        citation: "Philen D. L. (1982). Measurements of OH diffusion in optical-fiber cores. Bell Syst. Tech. J. 61, 283. 10 ppm of OH adds about 12 dB/km at 0.95 µm.",
        url: "https://doi.org/10.1002/j.1538-7305.1982.tb03407.x",
      },
      {
        citation: "Hetherington G., Jack K. H. (1962). Water in vitreous silica. Part I. Influence of 'water' content on the properties of vitreous silica. Phys. Chem. Glasses 3, 129. Molar absorption coefficient 77.5 L·mol⁻¹·cm⁻¹ at 2.72 µm.",
      },
    ],
  },
  {
    slug: "bend-insensitive",
    title: "Bend-Insensitive Fiber Calculator",
    description: "Compare the macrobend loss of standard single-mode fibre with a reduced-MFD step-index design and check the design against the ITU-T G.657 limits.",
    heading: "Bend-Insensitive Fiber Design",
    tier: "textbook",
    modelNote: "Marcuse curvature loss of LP01 for two step-index fibres, checked against the G.657 (2016) macrobend limits. Not modelled: trench profiles, the elasto-optic correction (R_eff ≈ 1.28R), coating, transitions.",
    references: [
      {
        citation: "Marcuse D. (1976). Curvature loss formula for optical fibers. J. Opt. Soc. Am. 66, 216. Bend loss of LP01.",
        url: "https://doi.org/10.1364/josa.66.000216",
      },
      {
        citation: "ITU-T G.657 (11/2016). Characteristics of a bending-loss insensitive single-mode optical fibre and cable. Macrobend loss limits of categories A1, A2, B2 and B3.",
        url: "https://www.itu.int/rec/T-REC-G.657",
      },
      {
        citation: "Gloge D. (1971). Weakly Guiding Fibers. Appl. Opt. 10, 2252. LP modes, eigenvalue equation and core power fraction.",
        url: "https://doi.org/10.1364/ao.10.002252",
      },
    ],
  },
  {
    slug: "birefringence-fiber",
    title: "Birefringence Fiber Calculator",
    description: "Geometric (elliptical-core) and stress-induced birefringence and beat length of a single-mode fiber from core and cladding indices and core shape.",
    tier: "textbook",
    modelNote: "Sakai–Kimura first-order geometric birefringence B = εn₁Δ²G(V) of a slightly elliptical step-index core and its group value, plus a stress term you enter. Not modelled: large ellipticity, material dispersion.",
    references: [
      {
        citation: "Sakai J., Kimura T. (1981). Birefringence and polarization characteristics of single-mode optical fibers under elastic deformations. IEEE J. Quantum Electron. 17, 1041. G(V) for an elliptical core.",
        url: "https://doi.org/10.1109/jqe.1981.1071213",
      },
      {
        citation: "Rashleigh S. C. (1983). Origins and control of polarization effects in single-mode fibers. J. Lightwave Technol. 1, 312.",
        url: "https://doi.org/10.1109/jlt.1983.1072121",
      },
    ],
  },
  {
    slug: "chromatic-dispersion",
    title: "Chromatic Dispersion Calculator",
    description: "Calculate chromatic dispersion, pulse broadening, and system penalties for single-mode fiber.",
    heading: "Chromatic Dispersion (CD)",
    tier: "textbook",
    modelNote: "G.652 Sellmeier D(λ) and Gaussian-pulse broadening with source width, β₂ and β₃ (no chirp). Bit-rate limit 4Bσ ≤ 1 with the optimum input pulse (broad and narrow sources). The penalty assumes a broad source.",
    references: [
      {
        citation: "ITU-T G.652 (11/2016). Characteristics of a single-mode optical fibre and cable. D(λ) = (S₀/4)(λ − λ₀⁴/λ³) with 1300 ≤ λ₀ ≤ 1324 nm and S₀ ≤ 0.092 ps/(nm²·km).",
        url: "https://www.itu.int/rec/T-REC-G.652",
      },
      {
        citation: "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed., §2.3–2.4 (β₂, β₃, pulse broadening, bit-rate limits) and §5.4.4 (penalty). Wiley.",
        url: "https://doi.org/10.1002/9780470918524",
      },
      {
        citation: "Marcuse D. (1980). Pulse distortion in single-mode fibers. Appl. Opt. 19, 1653. Gaussian-pulse broadening with source spectral width.",
        url: "https://doi.org/10.1364/AO.19.001653",
      },
    ],
  },
  {
    slug: "connector-insertion-loss",
    title: "Connector Insertion Loss Calculator",
    description: "Calculate single-mode connector insertion loss from offset, tilt and gap, and build link budgets from IEC 61753-1 grades.",
    heading: "Connector Insertion Loss",
    tier: "textbook",
    modelNote: "Gaussian mode overlap for offset, tilt (in glass at contact) and a gap of up to 5 µm, times the gap's Airy transmission. Budgets use IEC 61753-1 single-mode grades (random mate). No MFD mismatch.",
    references: [
      {
        citation: "Marcuse D. (1977). Loss analysis of single-mode fiber splices. Bell Syst. Tech. J. 56, 703. Gaussian offset, tilt and spot-size mismatch formulas.",
        url: "https://doi.org/10.1002/j.1538-7305.1977.tb00534.x",
      },
      {
        citation: "Nemoto S., Makimoto T. (1979). Analysis of splice loss in single-mode fibres using a Gaussian field approximation. Opt. Quantum Electron. 11, 447. Gap and combined misalignments.",
        url: "https://doi.org/10.1007/BF00619826",
      },
      {
        citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., §7.6.1. Cambridge University Press. Airy transmission of the gap.",
        url: "https://doi.org/10.1017/CBO9781139644181",
      },
      {
        citation: "Kolesar P. (2013). IEC single-mode connection performance grades (IEC 61753-1), slide 6. IEEE 802.3bm SMF ad hoc, 30 April 2013.",
        url: "https://grouper.ieee.org/groups/802/3/bm/public/smfadhoc/meetings/apr30_13/kolesar_01a_0413_smf.pdf",
      },
    ],
  },
  {
    slug: "connector-return-loss",
    title: "Connector Return Loss Calculator",
    description: "Calculate the return loss of a flat or angle-polished fiber end face from the index step, and compare with IEC 61753-1 grades.",
    heading: "Connector Return Loss",
    tier: "textbook",
    modelNote: "Fresnel reflection of an open end face (phase index); an angled face adds Gaussian back-coupling at 2α, an optimistic bound (APC is specified at ≥ 55 dB unmated). Mated values: IEC 61753-1 grades.",
    references: [
      {
        citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., §1.5.2. Cambridge University Press. Fresnel reflection coefficients.",
        url: "https://doi.org/10.1017/CBO9781139644181",
      },
      {
        citation: "Marcuse D. (1989). Reflection loss of laser mode from tilted end mirror. J. Lightwave Technol. 7, 336. Back-coupling of a beam reflected at an angled face.",
        url: "https://doi.org/10.1109/50.17776",
      },
      {
        citation: "Kolesar P. (2013). IEC single-mode connection performance grades (IEC 61753-1), slide 6. IEEE 802.3bm SMF ad hoc, 30 April 2013.",
        url: "https://grouper.ieee.org/groups/802/3/bm/public/smfadhoc/meetings/apr30_13/kolesar_01a_0413_smf.pdf",
      },
    ],
  },
  {
    slug: "coupling-efficiency",
    title: "Fiber Coupling Efficiency Calculator",
    description: "Estimate Gaussian-beam-to-single-mode-fiber coupling efficiency from beam NA, mode field diameter, lateral offset and tilt.",
    heading: "Fiber Coupling Efficiency",
    keywords: ["fiber coupling", "alignment", "insertion loss"],
    priority: 98,
    related: [
      {
        href: "/fiber-optics/mode-field-diameter",
        note: "Fiber mode size and coupling sensitivity.",
      },
      { href: "/fiber-optics/v-number", note: "Single-mode / multimode guidance." },
      {
        href: "/wave-optics/gaussian-beam",
        note: "Beam waist and divergence feeding coupling performance.",
      },
      {
        href: "/fiber-optics/splice-loss",
        note: "Another alignment-sensitive fiber insertion problem.",
      },
    ],
    tier: "textbook",
    modelNote: "Single-mode Gaussian overlap of a beam waist w₀ = λ/(π·NA) on the fibre face with the fibre mode (MFD/2), with offset and tilt. Paraxial (NA ≲ 0.3); not for multimode fibre or extended sources.",
    references: [
      {
        citation: "Joyce W. B., DeLoach B. C. (1984). Alignment of Gaussian beams. Appl. Opt. 23, 4187. Combined offset, tilt, gap and waist mismatch.",
        url: "https://doi.org/10.1364/AO.23.004187",
      },
      {
        citation: "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550. Waist from far-field divergence, w₀ = λ/(π·NA).",
        url: "https://doi.org/10.1364/AO.5.001550",
      },
    ],
  },
  {
    slug: "d-shaped-fiber",
    title: "D-Shaped Fiber Calculator",
    description: "Evanescent power at the flat, external-index shift of the effective index and refractometric sensitivity of a D-shaped single-mode fiber.",
    heading: "D-Shaped Fiber",
    tier: "textbook",
    modelNote: "Exact LP01 K₀ tail, power beyond the flat by quadrature. First-order index shift: too large for n_ext < n₂, too small as n_ext → n_eff (warned). Scalar; no D-shape birefringence.",
    references: [
      {
        citation: "Gloge D. (1971). Weakly guiding fibers. Appl. Opt. 10, 2252. LP01 field, eigenvalue equation and power normalization.",
        url: "https://doi.org/10.1364/ao.10.002252",
      },
      {
        citation: "Snyder A. W., Love J. D. (1983). Optical Waveguide Theory. Chapman & Hall (Springer reprint). Step-profile modes, perturbation theory and weakly coupled fibres.",
        url: "https://doi.org/10.1007/978-1-4613-2813-1",
      },
    ],
  },
  {
    slug: "dispersion-comp",
    title: "Dispersion Compensation Calculator",
    description: "Calculates chromatic dispersion limits and DCF (dispersion-compensating fiber) requirements.",
    heading: "Dispersion Compensation",
    lede: "Calculates chromatic dispersion limits and DCF (dispersion-compensating fiber) requirements: the rms pulse broadening of a span, the 4Bσ ≤ 1 bit-rate limit and power penalty, the DCF length that cancels the dispersion at one wavelength, and the residual dispersion that a slope mismatch leaves across the band.",
    tier: "textbook",
    modelNote: "Linear dispersion model D(λ) = D + S(λ − λ₀) for a broad Gaussian source. Not included: narrow-linewidth sources, dispersion curvature, PMD, nonlinear effects and DCF loss.",
    references: [
      {
        citation: "Agrawal G. P. (2021). Fiber-Optic Communication Systems, 5th ed., §2.4.3 and §5.4.4. Wiley.",
      },
      {
        citation: "NPTEL, Optical Communication, Module 12, “System degradation and power penalty”. Tabulated power-penalty values used as a check.",
      },
    ],
  },
  {
    slug: "dispersion-map",
    title: "Dispersion Map Calculator",
    description: "Design a dispersion map for a fiber link using SMF and DCF segments.",
    tier: "textbook",
    modelNote: "Linear D(λ) per segment: net dispersion L_s D_s + L_c D_c and residual slope L_s S_s + L_c S_c. Not modelled: dispersion curvature (strong in DCF), loss, nonlinearity, PMD.",
    references: [
      { citation: "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed. Wiley. Dispersion-management chapter.", url: "https://doi.org/10.1002/9780470918524" },
    ],
  },
  {
    slug: "dispersion-shifted",
    title: "Dispersion-Shifted Fiber Calculator",
    description: "Compare DSF, NZ-DSF, and DCF dispersion characteristics.",
    tier: "textbook",
    modelNote: "Typical presets, linear about 1550 nm (G.652 uses its Sellmeier form), valid over 1460–1625 nm. Length limit 4Bσ ≤ 1 with the optimum input pulse. Attenuations are typical values; use your fibre's datasheet.",
    references: [
      {
        citation: "ITU-T G.652 (11/2016). Characteristics of a single-mode optical fibre and cable. D(λ) = (S₀/4)(λ − λ₀⁴/λ³) with 1300 ≤ λ₀ ≤ 1324 nm and S₀ ≤ 0.092 ps/(nm²·km).",
        url: "https://www.itu.int/rec/T-REC-G.652",
      },
      {
        citation: "ITU-T G.653. Characteristics of a dispersion-shifted single-mode optical fibre and cable (λ₀ near 1550 nm, S₀ ≤ 0.085 ps/(nm²·km)).",
        url: "https://www.itu.int/rec/T-REC-G.653",
      },
      {
        citation: "ITU-T G.655. Characteristics of a non-zero dispersion-shifted single-mode optical fibre and cable (G.655.C: 1 ≤ |D| ≤ 10 ps/(nm·km) over 1530–1565 nm).",
        url: "https://www.itu.int/rec/T-REC-G.655",
      },
      {
        citation: "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed., §2.3–2.4. Wiley.",
        url: "https://doi.org/10.1002/9780470918524",
      },
    ],
  },
  {
    slug: "fiber-amplifier",
    title: "Fiber Amplifier Calculator",
    description: "EDFA and YDFA signal gain, output power, residual pump and noise figure from pump power, fiber length, doping and cross-sections, with gain against pump and length.",
    tier: "textbook",
    modelNote: "Two-level rate equations solved exactly: co-propagating pump, no ASE self-saturation (it matters above about 20–25 dB), ESA or clustering. Preset cross-sections are typical values; edit them for a fibre.",
    references: [
      {
        citation: "Giles C. R., Desurvire E. (1991). Modeling erbium-doped fiber amplifiers. J. Lightwave Technol. 9, 271. Two-level rate equations, eqs. (6)–(9), and the saturation power hνA/(Γ(σa + σe)τ).",
        url: "https://doi.org/10.1109/50.65886",
      },
      {
        citation: "Saleh A. A. M., Jopson R. M., Evankow J. D., Aspell J. (1990). Modeling of gain in erbium-doped fiber amplifiers. IEEE Photon. Technol. Lett. 2, 714. Closed-form solution for co-propagating beams.",
        url: "https://doi.org/10.1109/68.60769",
      },
      {
        citation: "Desurvire E. (1994). Erbium-Doped Fiber Amplifiers: Principles and Applications, ch. 2. Wiley. Noise figure (1 + 2n_ASE)/G from the inversion profile.",
      },
    ],
  },
  {
    slug: "fiber-bandwidth",
    title: "Fiber Bandwidth Calculator",
    description: "Calculate bandwidth limitations from chromatic dispersion, modal dispersion, and PMD.",
    heading: "Fiber Bandwidth Calculation",
    lede: "Calculate bandwidth limitations from chromatic dispersion, modal dispersion (MMF), and PMD for various fiber types and link configurations.",
    tier: "textbook",
    modelNote: "Gaussian rms budget, 4Bσ ≤ 1: chromatic (spec-limit λ₀, S₀, optimum input pulse) and modal (rated 850 nm bandwidth) add in quadrature; PMD by ⟨Δτ⟩ ≤ 0.1 T. Ignores DMD, launch and transceiver limits.",
    references: [
      {
        citation: "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed., §2.4.3 (4Bσ ≤ 1). Wiley.",
        url: "https://doi.org/10.1002/9780470918524",
      },
      {
        citation: "ITU-T G.652 (11/2016). Characteristics of a single-mode optical fibre and cable. D(λ) = (S₀/4)(λ − λ₀⁴/λ³) with 1300 ≤ λ₀ ≤ 1324 nm and S₀ ≤ 0.092 ps/(nm²·km).",
        url: "https://www.itu.int/rec/T-REC-G.652",
      },
      {
        citation: "Prysmian BendBright OM3 datasheet (IEC 60793-2-10 A1a.2): 1295 ≤ λ₀ ≤ 1340 nm, S₀ ≤ 0.105 ps/(nm²·km).",
        url: "https://www.prysmian.com/sites/www.prysmian.com/files/media/documents/Prysmian_BendBright_OM3_Datasheet.pdf",
      },
      {
        citation: "ISO/IEC 11801-1:2017. Information technology — Generic cabling for customer premises. Minimum modal bandwidth at 850 nm: OM1 200, OM2 500, OM3 2000 (EMB), OM4 4700 (EMB) MHz·km.",
      },
      {
        citation: "Poole C. D. (1988). Statistical treatment of polarization dispersion in single-mode fiber. Opt. Lett. 13, 687. Maxwellian statistics of the DGD.",
        url: "https://doi.org/10.1364/ol.13.000687",
      },
    ],
  },
  {
    slug: "fiber-bragg-grating",
    title: "Fiber Bragg Grating Calculator",
    description: "Calculate the reflection spectrum, peak reflectance, FWHM and first-zero bandwidth of uniform, Gaussian-apodized and linearly chirped fiber Bragg gratings.",
    tier: "textbook",
    modelNote: "Lossless coupled-mode theory, closed form for uniform gratings. Gaussian (FWHM L/2, ac only) and linear chirp (|chirp|·L ≤ 0.1λ_B) by transfer matrices. Phase n_eff for detuning and delay: no waveguide dispersion.",
    references: [
      {
        citation: "Erdogan T. (1997). Fiber grating spectra. J. Lightwave Technol. 15, 1277. Coupled-mode reflectance (eq. 20), bandwidth, transfer matrices.",
        url: "https://doi.org/10.1109/50.618322",
      },
      {
        citation: "Yamada M., Sakuda K. (1987). Analysis of almost-periodic distributed feedback slab waveguides via a fundamental matrix approach. Appl. Opt. 26, 3474. Transfer-matrix method.",
        url: "https://doi.org/10.1364/AO.26.003474",
      },
      {
        citation: "Ouellette F. (1987). Dispersion cancellation using linearly chirped Bragg grating filters in optical waveguides. Opt. Lett. 12, 847. Chirped-grating dispersion.",
        url: "https://doi.org/10.1364/OL.12.000847",
      },
    ],
  },
  {
    slug: "fiber-bragg-grating-sensor",
    title: "Fiber Bragg Grating Sensor Calculator",
    description: "Calculate FBG wavelength shift for strain and temperature sensing applications.",
    heading: "Fiber Bragg Grating Sensor",
    tier: "textbook",
    modelNote: "Uniform-grating spectrum (Erdogan). Linear shift Δλ/λ = (1 − p_e)ε + K_T·ΔT: p_e from strain-optic coefficients, K_T measured on SMF-28 at 20 °C, linear within ~±50 K. Strain and ΔT not separable.",
    references: [
      {
        citation: "Kersey A. D. et al. (1997). Fiber grating sensors. J. Lightwave Technol. 15, 1442. Strain and temperature response.",
        url: "https://doi.org/10.1109/50.618377",
      },
      {
        citation: "Erdogan T. (1997). Fiber grating spectra. J. Lightwave Technol. 15, 1277. Coupled-mode reflectance (eq. 20), bandwidth, transfer matrices.",
        url: "https://doi.org/10.1109/50.618322",
      },
      {
        citation: "Bertholds A., Dändliker R. (1988). Determination of the individual strain-optic coefficients in single-mode optical fibres. J. Lightwave Technol. 6, 17. p₁₁ = 0.113, p₁₂ = 0.252.",
        url: "https://doi.org/10.1109/50.3956",
      },
      {
        citation: "Cosme M. et al. (2026). Accurate determination of the temperature sensitivity of UV-induced fiber Bragg gratings. Sensors 26, 435. SMF-28: K_T = 6.165e-6 /K at 20 °C.",
        url: "https://doi.org/10.3390/s26020435",
      },
    ],
  },
  {
    slug: "fiber-bundle",
    title: "Fiber Bundle Design Calculator",
    description: "Calculate bundle diameter, cladding and core fill, packing-fraction loss and étendue for hexagonal or square fiber bundles.",
    heading: "Fiber Bundle Design",
    tier: "textbook",
    modelNote: "Equal touching round fibres in full-diameter hexagonal rings or a square grid, no adhesive or buffer; packing loss for a uniform spot filling the bundle circle.",
    references: [
      {
        citation: "OEIS A003215. Hex (centered hexagonal) numbers 3n(n + 1) + 1: fibres in n full hexagonal rings.",
        url: "https://oeis.org/A003215",
      },
      {
        citation: "Kosterin A., Temyanko V., Fallahi M., Mansuripur M. (2004). Tapered fiber bundles for combining high-power diode lasers. Appl. Opt. 43, 3893. Étendue conservation, taper NA.",
        url: "https://doi.org/10.1364/AO.43.003893",
      },
    ],
  },
  {
    slug: "fiber-characterization",
    title: "Fiber Characterization Calculator",
    description: "Step-index fiber parameters from the core and cladding indices and core radius: V, cutoff, MFD, effective area and index, nonlinear γ, core confinement and datasheet dispersion.",
    heading: "Fiber Characterization",
    tier: "textbook",
    modelNote: "Step-index LP01 (Gloge): V, cutoff, b, n_eff, core power, Petermann II and Marcuse-fit MFD, A_eff and γ. D uses the G.652 λ₀/S₀ form you enter, not the geometry.",
    references: [
      {
        citation: "Gloge D. (1971). Weakly Guiding Fibers. Appl. Opt. 10, 2252. LP modes, eigenvalue equation and core power fraction.",
        url: "https://doi.org/10.1364/ao.10.002252",
      },
      {
        citation: "Marcuse D. (1977). Loss Analysis of Single-Mode Fiber Splices. Bell Syst. Tech. J. 56, 703–718. Gaussian fit of the mode-field radius.",
        url: "https://doi.org/10.1002/j.1538-7305.1977.tb00534.x",
      },
      {
        citation: "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed., §2.3. Academic Press. Nonlinear coefficient γ = 2πn₂/(λA_eff).",
        url: "https://doi.org/10.1016/C2018-0-01168-8",
      },
      {
        citation: "ITU-T G.652 (11/2016). Characteristics of a single-mode optical fibre and cable. D(λ) = (S₀/4)(λ − λ₀⁴/λ³).",
        url: "https://www.itu.int/rec/T-REC-G.652",
      },
    ],
  },
  {
    slug: "fiber-coupler",
    title: "Fiber Coupler Calculator",
    description: "Calculate power splitting, transfer curves, and spectral response for directional fiber couplers.",
    lede: "Power splitting, transfer curve and spectral response of a directional coupler of two identical single-mode cores, with the coupling coefficient computed from the core spacing and fibre parameters.",
    tier: "textbook",
    modelNote: "Two identical parallel step-index cores: Snyder κ(λ) from the exact LP01 mode, transfer sin²(κL). Fused biconical tapers (cladding-mode coupling), unequal cores and dispersion are not modelled.",
    references: [
      {
        citation: "Snyder A. W. (1972). Coupled-mode theory for optical fibers. J. Opt. Soc. Am. 62, 1267. Coupling coefficient of two identical step-index cores.",
        url: "https://doi.org/10.1364/josa.62.001267",
      },
      {
        citation: "Snyder A. W., Love J. D. (1983). Optical Waveguide Theory. Chapman & Hall (Springer reprint). Step-profile modes, perturbation theory and weakly coupled fibres.",
        url: "https://doi.org/10.1007/978-1-4613-2813-1",
      },
    ],
  },
  {
    slug: "fiber-delay-line",
    title: "Fiber Delay Line Calculator",
    description: "Calculate group delay, dispersive pulse spread, thermal delay drift and loop FSR for fiber optic delay lines.",
    tier: "textbook",
    modelNote: "Group delay n_g·L/c, loop FSR and G.652 dispersion. Thermal coefficient 37.4 ps/(km·K) measured on SMF-28 (special coatings differ). The dispersive spread assumes a broad Gaussian source.",
    references: [
      {
        citation: "Slavík R. et al. (2015). Ultralow thermal sensitivity of phase and propagation delay in hollow core optical fibres. Sci. Rep. 5, 15447. SMF-28: 37.4 ps/(km·K) measured, 39 calculated.",
        url: "https://doi.org/10.1038/srep15447",
      },
      {
        citation: "ITU-T G.652 (11/2016). Characteristics of a single-mode optical fibre and cable. D(λ) = (S₀/4)(λ − λ₀⁴/λ³) with 1300 ≤ λ₀ ≤ 1324 nm and S₀ ≤ 0.092 ps/(nm²·km).",
        url: "https://www.itu.int/rec/T-REC-G.652",
      },
      {
        citation: "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed., §2.4. Wiley.",
        url: "https://doi.org/10.1002/9780470918524",
      },
    ],
  },
  {
    slug: "fiber-gyroscope",
    title: "Fiber Optic Gyroscope (FOG)",
    description: "Sagnac scale factor, shot-noise angle random walk, Earth-rate phase, transit time and proper frequency of an interferometric fiber optic gyroscope.",
    tier: "textbook",
    modelNote: "Ideal reciprocal I-FOG at the ±π/2 bias point, shot-noise limit only (no source excess noise, backscatter or Kerr bias). ARW is the Allan N: one-sided rate ASD/√2.",
    references: [
      {
        citation: "Arditty H. J., Lefèvre H. C. (1981). Sagnac effect in fiber gyroscopes. Opt. Lett. 6, 401. Δφ = 2πLDΩ/(λc), independent of the index.",
        url: "https://doi.org/10.1364/OL.6.000401",
      },
      {
        citation: "Lefèvre H. C. (2014). The Fiber-Optic Gyroscope, 2nd ed., §2.1, §3.1–3.2 (Sagnac phase, photon-noise limit, proper frequency). Artech House.",
      },
      {
        citation: "IEEE Std 952-1997. Specification format guide and test procedure for single-axis interferometric fiber optic gyros. Annex C: angle random walk from the Allan variance.",
        url: "https://doi.org/10.1109/IEEESTD.1998.86153",
      },
    ],
  },
  {
    slug: "fiber-laser",
    title: "Fiber Laser Output Power",
    description: "Fiber laser output power, optical and Stokes efficiency, efficiency beyond the quantum defect, the Rigrod optimum output coupling from gain and cavity loss, and the signal core's V number, mode count and mode-field diameter.",
    keywords: ["Fiber Laser Resonator", "fiber laser V number", "single-mode fiber laser", "mode field diameter"],
    tier: "textbook",
    modelNote: "Output from your slope and threshold. Optimum coupler from Rigrod's standing-wave model (four-level saturation, g₀ fixed), internal loss lumped into the rear mirror; output relative to the optimum. Core: weakly guiding step-index LP modes (Gloge), exact LP01 Petermann II diameter.",
    references: [
      {
        citation: "Gloge D. (1971). Weakly guiding fibers. Appl. Opt. 10, 2252. V number, LP mode cutoffs and the LP01 field.",
        url: "https://doi.org/10.1364/ao.10.002252",
      },
      {
        citation: "Rigrod W. W. (1965). Saturation effects in high-gain lasers. J. Appl. Phys. 36, 2487. Output power of a homogeneously broadened standing-wave laser against mirror reflectances.",
        url: "https://doi.org/10.1063/1.1714517",
      },
      {
        citation: "Zervas M. N., Codemard C. A. (2014). High Power Fiber Lasers: A Review. IEEE J. Sel. Top. Quantum Electron. 20(5), 219–241. Quantum defect and slope efficiency of Yb fibre lasers.",
        url: "https://doi.org/10.1109/JSTQE.2014.2321279",
      },
    ],
  },
  {
    slug: "fiber-loop-mirror",
    title: "Fiber Loop Mirror (Sagnac)",
    description: "Sagnac fiber loop mirror reflectance and transmission versus coupling ratio and loss, and the comb filter made by a polarization-maintaining section.",
    tier: "textbook",
    modelNote: "Coupler with wavelength-flat coupling k; losses lumped into τ. PM comb at the full-contrast setting (counter-propagating waves on opposite axes); phase birefringence, no dispersion.",
    references: [
      {
        citation: "Mortimore D. B. (1988). Fiber loop reflectors. J. Lightwave Technol. 6, 1217. R = 4k(1 − k), T = (1 − 2k)².",
        url: "https://doi.org/10.1109/50.4119",
      },
      {
        citation: "Fang X., Claus R. O. (1995). Polarization-independent all-fiber wavelength-division multiplexer based on a Sagnac interferometer. Opt. Lett. 20, 2146. T = sin²(πBL/λ).",
        url: "https://doi.org/10.1364/OL.20.002146",
      },
    ],
  },
  {
    slug: "fiber-optic-sensor",
    title: "Fiber Optic Sensors",
    description: "Calculate the strain and temperature response of FBG and Mach-Zehnder fiber sensors, the fringes of an air-gap Fabry-Pérot cavity, and the evanescent penetration depth.",
    tier: "textbook",
    modelNote: "FBG, MZI: linear (1 − p_e)ε + K_T·ΔT, free fibre. EFPI: lossless plane-wave Airy cavity, no gap diffraction loss (d ≤ 50 µm), gap carries ε. Evanescent: planar decay; water dn/dT −1e-4/K near 25 °C.",
    references: [
      {
        citation: "Kersey A. D. et al. (1997). Fiber grating sensors. J. Lightwave Technol. 15, 1442. Strain and temperature response.",
        url: "https://doi.org/10.1109/50.618377",
      },
      {
        citation: "Bertholds A., Dändliker R. (1988). Determination of the individual strain-optic coefficients in single-mode optical fibres. J. Lightwave Technol. 6, 17. p₁₁ = 0.113, p₁₂ = 0.252.",
        url: "https://doi.org/10.1109/50.3956",
      },
      {
        citation: "Cosme M. et al. (2026). Accurate determination of the temperature sensitivity of UV-induced fiber Bragg gratings. Sensors 26, 435. SMF-28: K_T = 6.165e-6 /K at 20 °C.",
        url: "https://doi.org/10.3390/s26020435",
      },
      {
        citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., §7.6.1 (Airy formulae, coefficient of finesse). Cambridge University Press.",
        url: "https://doi.org/10.1017/CBO9781139644181",
      },
      {
        citation: "Harrick N. J. (1967). Internal Reflection Spectroscopy, ch. 2 (evanescent penetration depth). Wiley.",
      },
      {
        citation: "Hale G. M., Querry M. R. (1973). Optical constants of water in the 200-nm to 200-μm wavelength region. Appl. Opt. 12, 555. n ≈ 1.318 at 1550 nm.",
        url: "https://doi.org/10.1364/AO.12.000555",
      },
      {
        citation: "Thormählen I., Straub J., Grigull U. (1985). Refractive index of water and its dependence on wavelength, temperature, and density. J. Phys. Chem. Ref. Data 14, 933.",
        url: "https://doi.org/10.1063/1.555743",
      },
    ],
  },
  {
    slug: "fiber-taper",
    title: "Fiber Taper Calculator",
    description: "Heat-and-pull fiber taper: Birks–Li waist diameter and profile, core–cladding transition, waist mode and evanescent field, and Love's adiabaticity criterion.",
    heading: "Fiber Taper Calculation",
    lede: "Waist and profile of a heat-and-pull fiber taper from the hot-zone length and elongation, where the light leaves the core, and whether the taper is adiabatic.",
    keywords: ["Tapered Fiber Design", "adiabatic taper", "delineation curve", "microfiber", "taper waist"],
    tier: "textbook",
    modelNote: "Birks–Li volume-conservation shape (exact for its hot-zone model); scalar three-layer LP0m modes along the taper; Love's length-scale adiabaticity criterion, approximate to a factor of order one.",
    references: [
      {
        citation: "Birks T. A., Li Y. W. (1992). The shape of fiber tapers. J. Lightwave Technol. 10, 432. Waist radius, transition profile and lengths for a hot zone L₀ + αx.",
        url: "https://doi.org/10.1109/50.134196",
      },
      {
        citation: "Love J. D., Henry W. M., Stewart W. J., Black R. J., Lacroix S., Gonthier F. (1991). Tapered single-mode fibres and devices. Part 1: Adiabaticity criteria. IEE Proc. J 138, 343. Delineation curve Ω = ρ(β₁ − β₂)/2π.",
        url: "https://doi.org/10.1049/ip-j.1991.0060",
      },
      {
        citation: "Snyder A. W., Love J. D. (1983). Optical Waveguide Theory. Chapman & Hall (Springer reprint). Scalar modes of step profiles; TE01/TM01 cutoff at V = 2.405.",
        url: "https://doi.org/10.1007/978-1-4613-2813-1",
      },
    ],
  },
  {
    slug: "link-budget",
    title: "Fiber Link Budget Calculator",
    description: "Calculate total optical link loss, received power, and link margin for fiber optic systems.",
    heading: "Fiber Link Budget",
    lede: "Total optical link loss budget calculator. Power budget vs. accumulated losses.",
    tier: "exact",
    modelNote: "Decibel power budget P_tx = P_rx + C_L + M_s, with the margin held above the receiver sensitivity rather than subtracted from the received power. Dispersion and other penalties belong in the margin; overload not checked.",
    references: [
      {
        citation: "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed. Wiley. Ch. 5, lightwave system design: power budget P_tr = P_rec + C_L + M_s.",
        url: "https://doi.org/10.1002/9780470918524",
      },
    ],
  },
  {
    slug: "low-water-peak",
    title: "Low Water Peak Fiber",
    description: "Compare low-water-peak (G.652.D) and older single-mode fiber: loss at the 1383 nm OH peak, OH content, E-band average, the span loss of each CWDM channel, and the OH absorption bands of silica at 943, 1383 and 2722 nm.",
    keywords: ["OH absorption", "water peak", "hydroxyl absorption in silica", "zero water peak fiber", "OH Absorption in Silica"],
    tier: "illustrative",
    modelNote: "Shared silica loss model (Rayleigh, Keiser IR/UV tails) plus Gaussian OH bands at 943, 1383 and 2722 nm scaled by the OH content (62.7, 1.2 and 1.0e4 dB/km per ppm); widths are assumed (30 nm FWHM at 1383 nm, the same in wavenumber elsewhere), the 1246 and 2212 nm bands are not modelled, and the OH peak heights are inputs, not data for a particular fibre.",
    references: [
      {
        citation: "Humbach O., Fabian H., Grzesik U., Haken U., Heitmann W. (1996). Analysis of OH absorption bands in synthetic silica. J. Non-Cryst. Solids 203, 19. OH band strength (≈ 63 dB/km per ppm at the 1383 nm peak).",
        url: "https://doi.org/10.1016/0022-3093(96)00329-8",
      },
      {
        citation: "Keiser G. (2010). Optical Fiber Communications, 4th ed. McGraw-Hill. Attenuation chapter: empirical infrared and ultraviolet absorption of GeO₂-doped silica.",
      },
      {
        citation: "ITU-T G.694.2 (2003). Spectral grids for WDM applications: CWDM wavelength grid, 1271–1611 nm in 20 nm steps.",
        url: "https://www.itu.int/rec/T-REC-G.694.2",
      },
      {
        citation: "ITU-T G.652 (2016). Characteristics of a single-mode optical fibre and cable. G.652.C/D: 1383 nm loss after hydrogen ageing at or below the 1310–1625 nm maximum (0.40 dB/km for cable).",
        url: "https://www.itu.int/rec/T-REC-G.652",
      },
    ],
  },
  {
    slug: "macro-bending-loss",
    title: "Macrobending Loss",
    description: "Detailed macrobending loss calculation using the curvature radiation model for single-mode fiber.",
    keywords: ["Macro Bending Loss", "Macro Bend Loss"],
    tier: "textbook",
    modelNote: "Marcuse's asymptotic curvature loss (R much larger than a) for the LP01 mode of a step-index, weakly guiding fibre. Not modelled: the elasto-optic correction (R_eff ≈ 1.28 R), coating reflections, transition loss.",
    references: [
      {
        citation: "Marcuse D. (1976). Curvature loss formula for optical fibers. J. Opt. Soc. Am. 66, 216. Curvature loss formula for an LP_ν mode, used here for LP01.",
        url: "https://doi.org/10.1364/josa.66.000216",
      },
      {
        citation: "Snyder A. W., Love J. D. (1983). Optical Waveguide Theory, bend-loss chapter. Chapman and Hall. Normalized power attenuation coefficient of the fundamental mode of a step profile.",
      },
      {
        citation: "Gloge D. (1971). Weakly Guiding Fibers. Appl. Opt. 10, 2252. Eigenvalue equation of the LP01 mode (U and W).",
        url: "https://doi.org/10.1364/ao.10.002252",
      },
      {
        citation: "Marcuse D. (1977). Loss Analysis of Single-Mode Fiber Splices. Bell Syst. Tech. J. 56, 703–718. Gaussian fit of the mode-field radius.",
        url: "https://doi.org/10.1002/j.1538-7305.1977.tb00534.x",
      },
    ],
  },
  {
    slug: "micro-bend",
    title: "Micro Bend Loss",
    description: "Microbending loss of a single-mode fiber with a sinusoidal axis deformation, and the critical period beyond which it vanishes.",
    lede: "Microbending loss of a single-mode fiber with a sinusoidal axis deformation, from first-order coupled-mode theory, and the critical period beyond which it vanishes.",
    keywords: ["Microbending Loss"],
    tier: "textbook",
    modelNote: "First-order coupling of the exact step-index LP01 (closed-form Hankel transform) to plane-wave radiation modes for one weak sinusoid; Gaussian mode shown too. Not modelled: random spectra, cladding modes, elasto-optics.",
    references: [
      {
        citation: "Petermann K. (1976). Microbending loss in monomode fibres. Electron. Lett. 12, 107–109. Plane-wave radiation-mode microbending theory (Gaussian mode).",
        url: "https://doi.org/10.1049/el:19760084",
      },
      {
        citation: "Marcuse D. (1991). Theory of Dielectric Optical Waveguides, 2nd ed., ch. 3 (coupled mode theory). Academic Press.",
        url: "https://doi.org/10.1016/b978-0-12-470951-5.50009-3",
      },
      {
        citation: "Marcuse D. (1977). Loss Analysis of Single-Mode Fiber Splices. Bell Syst. Tech. J. 56, 703–718. Mode-field fit and the tilt loss used to check the coupling strength.",
        url: "https://doi.org/10.1002/j.1538-7305.1977.tb00534.x",
      },
    ],
  },
  {
    slug: "mode-coupling",
    title: "Coupled-Mode Power Transfer",
    description: "Coupled-mode power transfer between two waveguides: coupled and through power, maximum transfer κ²/ψ² and the length that reaches it, power along the coupler and the response to the mismatch Δβ.",
    keywords: ["Coupled Mode Theory", "directional coupler", "coupling length", "phase mismatch"],
    tier: "textbook",
    modelNote: "Lossless co-directional coupled-mode theory for two modes with constant κ and mismatch Δβ: P₂ = (κ/ψ)² sin²(ψL), ψ = √(κ² + (Δβ/2)²). Not modelled: taper profile, κ(λ), polarization, excess loss.",
    references: [
      { citation: "Yariv A. (1973). Coupled-mode theory for guided-wave optics. IEEE J. Quantum Electron. 9, 919. Two-mode co-directional coupling.", url: "https://doi.org/10.1109/JQE.1973.1077767" },
    ],
  },
  {
    slug: "mode-field-diameter",
    title: "Mode Field Diameter",
    description: "Mode-field diameter (Petermann II and Gaussian fit), effective area, V, b and core confinement of a step-index single-mode fiber, with its bend loss.",
    tier: "textbook",
    modelNote: "Exact LP01 of a weakly guiding step-index fibre: Petermann II MFD in closed form, Marcuse's Gaussian-fit MFD and πw² area, Marcuse bend loss. Graded and trench profiles need a mode solver.",
    references: [
      {
        citation: "Gloge D. (1971). Weakly Guiding Fibers. Appl. Opt. 10, 2252. LP modes, eigenvalue equation and core power fraction.",
        url: "https://doi.org/10.1364/ao.10.002252",
      },
      {
        citation: "Petermann K. (1983). Constraints for fundamental-mode spot size for broadband dispersion-compensated single-mode fibres. Electron. Lett. 19, 712–714. Petermann II spot size.",
        url: "https://doi.org/10.1049/el:19830485",
      },
      {
        citation: "Marcuse D. (1977). Loss Analysis of Single-Mode Fiber Splices. Bell Syst. Tech. J. 56, 703–718. Gaussian fit of the mode-field radius.",
        url: "https://doi.org/10.1002/j.1538-7305.1977.tb00534.x",
      },
      {
        citation: "Marcuse D. (1976). Curvature loss formula for optical fibers. J. Opt. Soc. Am. 66, 216. Bend loss of LP01.",
        url: "https://doi.org/10.1364/josa.66.000216",
      },
    ],
  },
  {
    slug: "multi-core",
    title: "Multi-Core Fiber Crosstalk",
    description: "Inter-core coupling coefficient, bend-averaged power coupling and crosstalk of a multi-core fiber versus core pitch, bend radius, core mismatch and length.",
    tier: "textbook",
    modelNote: "Snyder κ (identical cores, exact LP01); Koshiba bend/twist-averaged h̄ → Hayashi 2κ²R/(βΛ) for Δβ = 0, d ≫ R/(βΛ); XT = tanh(h̄L). LP01 only; no trenches; worst core sums neighbours.",
    references: [
      {
        citation: "Snyder A. W. (1972). Coupled-mode theory for optical fibers. J. Opt. Soc. Am. 62, 1267. Coupling coefficient of two identical step-index cores.",
        url: "https://doi.org/10.1364/josa.62.001267",
      },
      {
        citation: "Hayashi T. et al. (2011). Design and fabrication of ultra-low crosstalk and low-loss multi-core fiber. Opt. Express 19, 16576. h = 2κ²R/(βΛ), XT = tanh(hL).",
        url: "https://doi.org/10.1364/oe.19.016576",
      },
      {
        citation: "Koshiba M., Saitoh K., Takenaga K., Matsuo S. (2012). Analytical expression of average power-coupling coefficients for estimating intercore crosstalk in multicore fibers. IEEE Photonics J. 4, 1987.",
        url: "https://doi.org/10.1109/jphot.2012.2221085",
      },
    ],
  },
  {
    slug: "nonlinear-effects",
    title: "Nonlinear Effects in Fiber",
    description: "Calculate the nonlinear coefficient γ, SPM and XPM phase, four-wave-mixing efficiency and SBS/SRS thresholds of a fiber span.",
    tier: "textbook",
    modelNote: "γ = 2πn₂/(λA_eff), SPM phase and Gaussian rms broadening, XPM upper bound (no walk-off), Inoue FWM efficiency (β₂, β₃) for the nearest product, worst-case CW SBS/SRS thresholds. Not a Q penalty.",
    references: [
      {
        citation: "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed., §2.3 (γ), §4.1 (SPM), §7.1 (XPM). Academic Press.",
        url: "https://doi.org/10.1016/C2018-0-01168-8",
      },
      {
        citation: "Inoue K. (1992). Four-wave mixing in an optical fiber in the zero-dispersion wavelength region. J. Lightwave Technol. 10, 1553. FWM efficiency η.",
        url: "https://doi.org/10.1109/50.184893",
      },
      {
        citation: "Smith R. G. (1972). Optical power handling capacity of low loss optical fibers as determined by stimulated Raman and Brillouin scattering. Appl. Opt. 11, 2489. Critical powers 16 (SRS) and 21 (SBS).",
        url: "https://doi.org/10.1364/AO.11.002489",
      },
    ],
  },
  {
    slug: "nonzero-dispersion",
    title: "Non-Zero Dispersion Shifted Fiber (NZ-DSF)",
    description: "Design NZ-DSF fibers (G.655) with optimized dispersion for DWDM systems — balancing dispersion and nonlinearity.",
    tier: "textbook",
    modelNote: "Linear D(λ) about 1550 nm from your D and slope, compared with G.652 (Sellmeier) and G.653 presets; valid over 1460–1625 nm. FWM phase mismatch Δβ = |β₂|(2πΔν)² ignores β₃.",
    references: [
      {
        citation: "ITU-T G.655. Characteristics of a non-zero dispersion-shifted single-mode optical fibre and cable (G.655.C: 1 ≤ |D| ≤ 10 ps/(nm·km) over 1530–1565 nm).",
        url: "https://www.itu.int/rec/T-REC-G.655",
      },
      {
        citation: "ITU-T G.652 (11/2016). Characteristics of a single-mode optical fibre and cable. D(λ) = (S₀/4)(λ − λ₀⁴/λ³) with 1300 ≤ λ₀ ≤ 1324 nm and S₀ ≤ 0.092 ps/(nm²·km).",
        url: "https://www.itu.int/rec/T-REC-G.652",
      },
      {
        citation: "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed., §2.3 (β₂). Wiley.",
        url: "https://doi.org/10.1002/9780470918524",
      },
    ],
  },
  {
    slug: "otdr-analysis",
    title: "OTDR Analysis",
    description: "Model an OTDR on single-mode fiber: two-point resolution, Rayleigh backscatter coefficient, one-way dynamic range versus pulse width and averaging, cumulative splice steps and Fresnel peaks.",
    tier: "textbook",
    modelNote: "Barnoski–Jensen backscatter with Brinkmeyer's Gaussian-mode capture fraction; ideal matched receiver, SNR = 1 noise. Receiver recovery, fading noise and the 98 % DR convention not included.",
    references: [
      {
        citation: "Barnoski M. K., Jensen S. M. (1976). Fiber waveguides: a novel technique for investigating attenuation characteristics. Appl. Opt. 15, 2112. Backscattered power P₀ S α_s (v_g τ/2) e^(−2αz).",
        url: "https://doi.org/10.1364/AO.15.002112",
      },
      {
        citation: "Brinkmeyer E. (1980). Analysis of the backscattering method for single-mode optical fibers. J. Opt. Soc. Am. 70, 1010. Capture fraction S = (3/2)(λ/(2πnw))² for a Gaussian mode.",
        url: "https://doi.org/10.1364/JOSA.70.001010",
      },
      {
        citation: "Corning (2024). SMF-28 Ultra Optical Fiber, product information PI 1424. Rayleigh backscatter coefficient −82 dB (1 ns) at 1550 nm, MFD 10.4 µm, used as the check value.",
        url: "https://csmedia.corning.com/media/worldwide/coc/documents/Fiber/product-information-sheets/PI-1424-AEN.pdf",
      },
    ],
  },
  {
    slug: "photonic-crystal",
    title: "Photonic Crystal Fiber",
    description: "Effective V-number, single-mode cutoff, effective index, mode-field diameter and chromatic dispersion of a solid-core photonic crystal fiber from hole pitch Λ and diameter d (Saitoh–Koshiba relations).",
    tier: "textbook",
    modelNote: "Saitoh–Koshiba empirical V and W (FEM fits, 0.2 ≤ d/Λ ≤ 0.8, λ/Λ ≤ 2), a_eff = Λ/√3, silica Sellmeier core; V < 2.405 single-mode; Marcuse spot size (V ≥ 1.2). Blank where the fit gives W ≤ 0. No confinement loss.",
    references: [
      {
        citation: "Saitoh K., Koshiba M. (2005). Empirical relations for simple design of photonic crystal fibers. Opt. Express 13, 267. Eqs. (1)–(4), Tables 1–2.",
        url: "https://doi.org/10.1364/opex.13.000267",
      },
      {
        citation: "Koshiba M., Saitoh K. (2004). Applicability of classical optical fiber theories to holey fibers. Opt. Lett. 29, 1739. a_eff = Λ/√3.",
        url: "https://doi.org/10.1364/ol.29.001739",
      },
      {
        citation: "Saitoh K., Tsuchida Y., Koshiba M., Mortensen N. A. (2005). Endlessly single-mode holey fibers: the influence of core design. Opt. Express 13, 10833. ESM limit d/Λ = 0.424.",
        url: "https://doi.org/10.1364/opex.13.010833",
      },
      {
        citation: "Birks T. A., Knight J. C., Russell P. St. J. (1997). Endlessly single-mode photonic crystal fiber. Opt. Lett. 22, 961.",
        url: "https://doi.org/10.1364/ol.22.000961",
      },
      {
        citation: "Marcuse D. (1977). Loss analysis of single-mode fiber splices. Bell Syst. Tech. J. 56, 703. w/a = 0.65 + 1.619V^−1.5 + 2.879V^−6.",
        url: "https://doi.org/10.1002/j.1538-7305.1977.tb00534.x",
      },
      {
        citation: "Malitson I. H. (1965). Interspecimen comparison of the refractive index of fused silica. J. Opt. Soc. Am. 55, 1205.",
        url: "https://doi.org/10.1364/josa.55.001205",
      },
    ],
  },
  {
    slug: "polarization-controller",
    title: "Fiber Polarization Controller",
    description: "Retardance per paddle from bend-induced birefringence, quarter- and half-wave loop diameters and the output polarization state of a three-paddle fiber polarization controller.",
    tier: "textbook",
    modelNote: "Lefèvre loop paddles: bend birefringence 0.133(d/D)², retardance 2π²·0.133·Nd²/(λD) per paddle, chained as rotated linear retarders (Mueller). Not modelled: twist between paddles, tension, bend loss.",
    references: [
      {
        citation: "Lefèvre H. C. (1980). Single-mode fibre fractional wave devices and polarisation controllers. Electron. Lett. 16, 778.",
        url: "https://doi.org/10.1049/el:19800552",
      },
      {
        citation: "Ulrich R., Rashleigh S. C., Eickhoff W. (1980). Bending-induced birefringence in single-mode fibers. Opt. Lett. 5, 273. B = 0.133 (r/R)².",
        url: "https://doi.org/10.1364/ol.5.000273",
      },
      { citation: "Goldstein D. H. (2011). Polarized Light, 3rd ed. CRC Press. Mueller matrices of rotated retarders." },
    ],
  },
  {
    slug: "polarization-maintaining",
    title: "Polarization-Maintaining Fiber",
    description: "Birefringence, beat length, h-parameter and output extinction ratio of PANDA, bow-tie and elliptical-core PM fibers versus length and input PER.",
    tier: "textbook",
    modelNote: "Exact solution of the PM-fibre coupled power equations with h-parameter h: Py/Px = (1−r)/(1+r), r = e^(−2hL)(1−ε₀)/(1+ε₀). Beat length λ/B, DGD B/c. B and h are inputs (typical presets).",
    references: [
      {
        citation: "Noda J., Okamoto K., Sasaki Y. (1986). Polarization-maintaining fibers and their applications. J. Lightwave Technol. 4, 1071. h-parameter and crosstalk.",
        url: "https://doi.org/10.1109/jlt.1986.1074847",
      },
    ],
  },
  {
    slug: "polarization-mode-dispersion",
    title: "Polarization Mode Dispersion (PMD)",
    description: "Calculate PMD-induced differential group delay (DGD), its Maxwellian outage probability, and PMD-limited reach.",
    tier: "textbook",
    modelNote: "First-order PMD of a long, randomly coupled fibre: Maxwellian DGD with mean PMD·√L. The 10 % bit-period limit is a design rule of thumb. Not modelled: second-order PMD, component PMD and the penalty itself.",
    references: [
      {
        citation: "Kogelnik H., Jopson R. M., Nelson L. E. (2002). Polarization-mode dispersion. In Optical Fiber Telecommunications IVB.",
      },
      {
        citation: "Poole C. D. (1988). Statistical treatment of polarization dispersion in single-mode fiber. Opt. Lett. 13, 687. Maxwellian statistics of the DGD.",
        url: "https://doi.org/10.1364/ol.13.000687",
      },
      { citation: "ITU-T G.650.2. The PMD value as the mean DGD." },
      {
        citation: "Duelk M. (2006). IEEE 802.3 HSSG, Nov. 2006, duelk_02_1106. Probability 4.2×10⁻⁵ that the DGD exceeds 3 times its mean.",
      },
    ],
  },
  {
    slug: "pump-combiner",
    title: "Fiber Pump Combiner",
    description: "Combined pump power, étendue budget, tapered-bundle diameter and pump NA after the taper for an N×1 or (N+1)×1 fiber pump combiner.",
    tier: "textbook",
    modelNote: "Lossless adiabatic taper (NA × taper ratio) of a hexagonal bundle of equal fibres; étendue π·A·NA² of the cores. Transmission and signal loss are inputs, not modelled.",
    references: [
      {
        citation: "Kosterin A., Temyanko V., Fallahi M., Mansuripur M. (2004). Tapered fiber bundles for combining high-power diode lasers. Appl. Opt. 43, 3893. Étendue conservation, taper NA.",
        url: "https://doi.org/10.1364/AO.43.003893",
      },
    ],
  },
  {
    slug: "rare-earth-doped",
    title: "Rare-Earth-Doped Fiber Amplifier",
    description: "Ion density from wt-ppm, LP01 overlap, pump and signal absorption, 90 % absorption length, saturation power, gain and noise figure of an Er- or Yb-doped fiber.",
    keywords: ["Rare-Earth Fiber Dopants"],
    tier: "textbook",
    modelNote: "Two-level Er or Yb; Γ from the exact LP01 field for a core doped to its edge (an upper bound). Preset cross-sections are typical values. Tm, Ho, Nd and Er/Yb co-doping are not covered.",
    references: [
      {
        citation: "Gloge D. (1971). Weakly Guiding Fibers. Appl. Opt. 10, 2252. LP01 power fraction in the core, Γ = 1 − (U²/V²)(1 − K₀²(W)/K₁²(W)).",
        url: "https://doi.org/10.1364/AO.10.002252",
      },
      {
        citation: "Giles C. R., Desurvire E. (1991). Modeling erbium-doped fiber amplifiers. J. Lightwave Technol. 9, 271. Two-level rate equations, eqs. (6)–(9), and the saturation power hνA/(Γ(σa + σe)τ).",
        url: "https://doi.org/10.1109/50.65886",
      },
      {
        citation: "Saleh A. A. M., Jopson R. M., Evankow J. D., Aspell J. (1990). Modeling of gain in erbium-doped fiber amplifiers. IEEE Photon. Technol. Lett. 2, 714. Closed-form solution for co-propagating beams.",
        url: "https://doi.org/10.1109/68.60769",
      },
    ],
  },
  {
    slug: "sbs-threshold",
    title: "SBS Threshold Power",
    description: "Calculate Stimulated Brillouin Scattering threshold for optical fibers.",
    tier: "textbook",
    modelNote: "Smith critical power 21·K·A_eff·(1 + Δν_s/Δν_B)/(g_B·L_eff) for a CW pump: K = 1 co-polarized, 1.5 standard fibre, 2 scrambled; Lorentzian source linewidth. Undepleted pump. ν_B = 2n·v_A/λ.",
    references: [
      {
        citation: "Smith R. G. (1972). Optical power handling capacity of low loss optical fibers as determined by stimulated Raman and Brillouin scattering. Appl. Opt. 11, 2489. Critical powers 16 (SRS) and 21 (SBS).",
        url: "https://doi.org/10.1364/AO.11.002489",
      },
      {
        citation: "van Deventer M. O., Boot A. J. (1994). Polarization properties of stimulated Brillouin scattering in single-mode fibers. J. Lightwave Technol. 12, 585. Polarization factor K = 1.5.",
        url: "https://doi.org/10.1109/50.285349",
      },
      {
        citation: "Kobyakov A., Sauer M., Chowdhury D. (2010). Stimulated Brillouin scattering in optical fibers. Adv. Opt. Photon. 2, 1. Review; depolarized pump K = 2.",
        url: "https://doi.org/10.1364/AOP.2.000001",
      },
      {
        citation: "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed., §9.1 (Brillouin shift, gain g_B, linewidth). Academic Press.",
        url: "https://doi.org/10.1016/C2018-0-01168-8",
      },
    ],
  },
  {
    slug: "side-polished",
    title: "Side-Polished Fiber",
    description: "Evanescent power beyond the polished face, overlay index shift and polished-coupler transfer of a side-polished single-mode fiber.",
    tier: "textbook",
    modelNote: "Exact LP01 K₀ tail: power beyond the face by quadrature, first-order overlay shift of n_eff; twin-fibre coupler, Snyder κ over D(z) = D₀ + z²/R. Scalar; mode change near the face not modelled.",
    references: [
      {
        citation: "Gloge D. (1971). Weakly guiding fibers. Appl. Opt. 10, 2252. LP01 field, eigenvalue equation and power normalization.",
        url: "https://doi.org/10.1364/ao.10.002252",
      },
      {
        citation: "Snyder A. W. (1972). Coupled-mode theory for optical fibers. J. Opt. Soc. Am. 62, 1267. Coupling coefficient of two identical step-index cores.",
        url: "https://doi.org/10.1364/josa.62.001267",
      },
      {
        citation: "Digonnet M. J. F., Shaw H. J. (1982). Analysis of a tunable single mode optical fiber coupler. IEEE J. Quantum Electron. 18, 746. Polished-coupler geometry and effective interaction length.",
        url: "https://doi.org/10.1109/jqe.1982.1071574",
      },
      {
        citation: "Snyder A. W., Love J. D. (1983). Optical Waveguide Theory. Chapman & Hall (Springer reprint). Step-profile modes, perturbation theory and weakly coupled fibres.",
        url: "https://doi.org/10.1007/978-1-4613-2813-1",
      },
    ],
  },
  {
    slug: "specialty-fiber",
    title: "Specialty Fiber Types",
    description: "Compare data-sheet properties of specialty optical fibers (PM, erbium-, ytterbium- and thulium-doped, ZBLAN, chalcogenide): V-number, cutoff, mode-field diameter and loss.",
    tier: "illustrative",
    modelNote: "Typical data-sheet values for one commercial fibre per class (linked). V = 2πa·NA/λ, step-index cutoff and Marcuse MFD from the sheet's core and NA. Losses are single-wavelength figures, not spectra.",
    references: [
      { citation: "Thorlabs PM1550-XP spec sheet TTN019885-S01 (PANDA PM fibre).", url: "https://www.thorlabs.com/item/pm1550-xp" },
      { citation: "nLIGHT LIEKKI Er16-8/125 and Yb1200-4/125 data sheets (via Thorlabs).", url: "https://www.thorlabs.com/item/er16-8_125" },
      { citation: "Coherent SM-TSF-9/125 thulium-doped fibre data.", url: "https://www.coherent.com/components-accessories/specialty-optical-fibers/single-mode/SM-TSF-9-125" },
      { citation: "Thorlabs IRZS23 ZBLAN single-mode fibre spec sheet TTN028984-S01.", url: "https://www.thorlabs.com/item/irzs23" },
      { citation: "IRflex IRF-S series As₂S₃ fibre data sheet (V202408) and product page.", url: "https://irflex.com/products/irf-s-series/" },
      {
        citation: "Gloge D. (1971). Weakly guiding fibers. Appl. Opt. 10, 2252. V and the LP11 cutoff.",
        url: "https://doi.org/10.1364/ao.10.002252",
      },
      {
        citation: "Marcuse D. (1977). Loss analysis of single-mode fiber splices. Bell Syst. Tech. J. 56, 703.",
        url: "https://doi.org/10.1002/j.1538-7305.1977.tb00534.x",
      },
    ],
  },
  {
    slug: "splice-loss",
    title: "Fiber Splice Loss",
    description: "Estimate single-mode splice loss from lateral offset, tilt, end-face gap and mode-field-diameter mismatch with the Gaussian mode model.",
    tier: "textbook",
    modelNote: "Paraxial Gaussian mode overlap for offset, tilt (unfavourable sense), a gap in a medium of index n and unequal mode-field diameters, combined. Not included: Fresnel reflection at an air gap, mode ellipticity.",
    references: [
      {
        citation: "Marcuse D. (1977). Loss analysis of single-mode fiber splices. Bell Syst. Tech. J. 56, 703. Gaussian offset, tilt and spot-size mismatch formulas.",
        url: "https://doi.org/10.1002/j.1538-7305.1977.tb00534.x",
      },
      {
        citation: "Nemoto S., Makimoto T. (1979). Analysis of splice loss in single-mode fibres using a Gaussian field approximation. Opt. Quantum Electron. 11, 447. Gap and combined misalignments.",
        url: "https://doi.org/10.1007/BF00619826",
      },
      {
        citation: "Joyce W. B., DeLoach B. C. (1984). Alignment of Gaussian beams. Appl. Opt. 23, 4187. Combined offset, tilt, gap and waist mismatch.",
        url: "https://doi.org/10.1364/AO.23.004187",
      },
    ],
  },
  {
    slug: "srs-threshold",
    title: "SRS Threshold Power",
    description: "Calculate Stimulated Raman Scattering threshold for optical fibers.",
    tier: "textbook",
    modelNote: "Smith critical power 16·K·A_eff/(g_R·L_eff) for forward SRS of a CW pump at the gain peak: K = 1 co-polarized, 2 standard fibre. Undepleted pump; on-off gain exp(g_R·P·L_eff/(K·A_eff)).",
    references: [
      {
        citation: "Smith R. G. (1972). Optical power handling capacity of low loss optical fibers as determined by stimulated Raman and Brillouin scattering. Appl. Opt. 11, 2489. Critical powers 16 (SRS) and 21 (SBS).",
        url: "https://doi.org/10.1364/AO.11.002489",
      },
      {
        citation: "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed., §8.1 (Raman gain g_R ∝ 1/λ_p, 13.2 THz shift, polarization). Academic Press.",
        url: "https://doi.org/10.1016/C2018-0-01168-8",
      },
      {
        citation: "Stolen R. H., Ippen E. P. (1973). Raman gain in glass optical waveguides. Appl. Phys. Lett. 22, 276.",
        url: "https://doi.org/10.1063/1.1654637",
      },
    ],
  },
  {
    slug: "v-number",
    title: "Fiber V-Number",
    description: "Normalized frequency V = 2πa·NA/λ of a step-index fiber, NA from core and cladding indices, the single-mode check (V < 2.405) and the exact guided-mode count.",
    tier: "exact",
    modelNote: "V = 2πa·NA/λ and the LP mode count from Bessel-function zeros (weak guidance; V²/2 estimate above V = 40). Step-index profile only.",
    references: [
      {
        citation: "Gloge D. (1971). Weakly Guiding Fibers. Appl. Opt. 10, 2252. LP modes, eigenvalue equation and core power fraction.",
        url: "https://doi.org/10.1364/ao.10.002252",
      },
      {
        citation: "NIST DLMF §10.21. Zeros of Bessel functions (LP mode cutoffs).",
        url: "https://dlmf.nist.gov/10.21",
      },
    ],
  },
  {
    slug: "wdm-coupler",
    title: "WDM Channel Plan",
    description: "WDM channel wavelengths, frequency spacing, ITU-T grid type (CWDM or DWDM), total bandwidth, insertion loss and isolation from channel count and spacing.",
    tier: "textbook",
    modelNote: "Equally spaced channel plan with Δν = cΔλ/λ² at the centre wavelength; Gaussian passbands are illustrative. Not modelled: grid anchoring to 193.1 THz, filter technology, isolation from the passband.",
    references: [
      { citation: "ITU-T G.694.1. Spectral grids for WDM applications: DWDM frequency grid." },
    ],
  },
];
