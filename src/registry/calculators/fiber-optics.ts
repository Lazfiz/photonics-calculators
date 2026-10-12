import type { CalculatorEntry } from "../types";

export const fiberOptics: CalculatorEntry[] = [
  {
    slug: "attenuation",
    title: "Fiber Attenuation Calculator",
    description: "Wavelength-dependent fiber attenuation: Rayleigh scattering, IR absorption, and OH peak.",
    heading: "Wavelength-Dependent Attenuation",
    lede: "Fiber attenuation spectrum showing Rayleigh scattering, IR absorption, and OH peak for standard fiber types.",
    knownIssue: "The infrared-absorption term is about 10× too small, so the loss minimum falls at 1654 nm instead of about 1550 nm, and the 1550 nm loss is below standard fibre's.",
  },
  {
    slug: "bend-insensitive",
    title: "Bend-Insensitive Fiber Calculator",
    description: "Design and analyze bend-insensitive fibers with depressed cladding trenches (ITU-T G.657).",
    heading: "Bend-Insensitive Fiber Design",
    knownIssue: "The bend-loss formula underflows to 0 dB, so standard single-mode fibre at 7.5 mm radius (about 16 dB/turn) is classed as G.657.B3. The trench factor has no source.",
  },
  {
    slug: "birefringence-fiber",
    title: "Birefringence Fiber Calculator",
    description: "Geometric (elliptical-core) and stress-induced birefringence and beat length of a single-mode fiber from core and cladding indices and core shape.",
    knownIssue: "Geometric birefringence scales with Δ instead of Δ², so the beat length is about 45 mm instead of tens of metres, and the stress term treats OPD/λ as an index difference.",
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
    description: "Birefringence, evanescent field, and polarization properties of D-shaped (flat) fibers.",
    heading: "D-Shaped Fiber",
    knownIssue: "The default flat depth lies outside the cladding yet birefringence is shown, the birefringence formula has an uncited ×0.1 factor, and the evanescent tail is Gaussian instead of K₀.",
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
    description: "EDFA and YDFA gain, saturation, and noise figure analysis.",
    knownIssue: "Gain assumes full inversion and ignores pump power and absorption, so the YDFA preset gives 292 dB; several inputs have no effect.",
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
    description: "Calculate FBG reflectivity, bandwidth, and spectrum for uniform, apodized, and chirped gratings.",
    knownIssue: "The off-centre reflectance formula is wrong near the band edge (0.008 instead of 0.80), and the first-zero bandwidth is labelled FWHM.",
  },
  {
    slug: "fiber-bragg-grating-sensor",
    title: "Fiber Bragg Grating Sensor Calculator",
    description: "Calculate FBG wavelength shift for strain and temperature sensing applications.",
    heading: "Fiber Bragg Grating Sensor",
    knownIssue: "The bandwidth formula has no source and diverges as Δn → 0, and the reflection spectrum uses the same wrong off-centre formula as the Bragg-grating page.",
  },
  {
    slug: "fiber-bundle",
    title: "Fiber Bundle Design Calculator",
    description: "Calculate bundle geometry, fill factor, étendue, and coupling efficiency for fiber optic bundles.",
    heading: "Fiber Bundle Design",
    knownIssue: "Fibre areas in µm² are divided by a bundle area in mm², so the fill factor reads 388 272× and the loss is negative; the hexagonal ring count is also off by one.",
  },
  {
    slug: "fiber-characterization",
    title: "Fiber Characterization Calculator",
    description: "Comprehensive fiber parameter calculation: V-number, MFD, effective area, nonlinear coefficient, dispersion, and confinement.",
    heading: "Fiber Characterization",
  },
  {
    slug: "fiber-coupler",
    title: "Fiber Coupler Calculator",
    description: "Calculate power splitting, transfer curves, and spectral response for directional fiber couplers.",
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
    description: "Sagnac effect, scale factor, angle random walk, and bias stability for fiber optic gyroscopes.",
    knownIssue: "Angle random walk is converted with ×3600 instead of ×60, so it is 60× too high (2.2e-3 instead of 3.6e-5 °/√h at the defaults).",
  },
  {
    slug: "fiber-laser",
    title: "Fiber Laser Output Power",
    description: "Fiber laser output power, optical, Stokes and quantum efficiency, and output-coupler and cavity losses from pump power, wavelengths and slope efficiency.",
    knownIssue: "Quantum efficiency is the product of slope and Stokes efficiency instead of their ratio (73 % instead of 87 %), and the optimum coupling uses pump absorption as the gain.",
  },
  {
    slug: "fiber-loop-mirror",
    title: "Fiber Loop Mirror (Sagnac)",
    description: "Sagnac fiber loop mirror reflectance, spectral response, and birefringent filter design.",
    knownIssue: "Reflectance includes a sin²(βL) factor that cancels in a reciprocal loop: a 50 % coupler shows 50 % reflection instead of 100 %, and the spectrum is zero.",
  },
  {
    slug: "fiber-optic-sensor",
    title: "Fiber Optic Sensors",
    description: "Calculate sensitivity, resolution, and response for FBG, MZI, Fabry-Pérot, and evanescent fiber sensors.",
    knownIssue: "The interferometer's phase sensitivity is scaled by 10⁻⁶ twice and shows 0 rad/µε, and the water index changes with temperature with the wrong sign and 10× too fast.",
  },
  {
    slug: "fiber-taper",
    title: "Fiber Taper Calculator",
    description: "Calculate fiber taper waist diameter, evanescent field penetration, and coupling parameters from pull length.",
    heading: "Fiber Taper Calculation",
    lede: "Calculate fiber taper waist diameter, evanescent field, and coupling parameters from pull length.",
    knownIssue: "The waist uses a hot zone that grows with the pull instead of Birks–Li's constant hot zone: the defaults give 66.8 µm instead of 35.8 µm.",
  },
  {
    slug: "link-budget",
    title: "Fiber Link Budget Calculator",
    description: "Calculate total optical link loss, received power, and link margin for fiber optic systems.",
    heading: "Fiber Link Budget",
    lede: "Total optical link loss budget calculator. Power budget vs. accumulated losses.",
  },
  {
    slug: "low-water-peak",
    title: "Low Water Peak Fiber",
    description: "Analyze low water peak (LWP) fibers that reduce the OH⁻ absorption peak at 1383 nm, enabling E-band and full CWDM operation.",
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
    description: "Calculate microbending loss from periodic perturbations in fiber geometry.",
    lede: "Calculate microbending loss from periodic perturbations using Marcuse mode coupling theory.",
    keywords: ["Microbending Loss"],
    knownIssue: "The resonant deformation period is λ/NA (13 µm) instead of the LP01–cladding beat length (about 0.8 mm), and the loss uses uncited fudge factors.",
  },
  {
    slug: "mode-coupling",
    title: "Coupled-Mode Power Transfer",
    description: "Coupled-mode power transfer between two waveguides: coupled and through power, coupling efficiency and full-transfer length from κ and Δβ.",
    tier: "textbook",
    modelNote: "Lossless co-directional coupled-mode theory for two modes with constant κ and mismatch Δβ: P₂ = (κ/κ_eff)² sin²(κ_eff L). Not modelled: taper profile, κ(λ), polarization, excess loss.",
    references: [
      { citation: "Yariv A. (1973). Coupled-mode theory for guided-wave optics. IEEE J. Quantum Electron. 9, 919. Two-mode co-directional coupling.", url: "https://doi.org/10.1109/JQE.1973.1077767" },
    ],
  },
  {
    slug: "mode-field-diameter",
    title: "Mode Field Diameter",
    description: "Calculate MFD, effective area, and spot size for single-mode fibers.",
    knownIssue: "The SMF-28 preset (NA 0.14, a = 4.5 µm) is multimode at 1550 nm, the bend-loss chart is ad hoc, and the row labelled Petermann II is the Marcuse fit.",
  },
  {
    slug: "multi-core",
    title: "Multi-Core Fiber Crosstalk",
    description: "Simplified coupled-mode estimate of inter-core coupling, crosstalk and packing density in a homogeneous multi-core fiber versus core pitch and length.",
    knownIssue: "The core-to-core coupling coefficient is about 10 orders of magnitude too small and the crosstalk formula is dimensionally wrong, so crosstalk shows −300 dB instead of about −40 dB.",
  },
  {
    slug: "nonlinear-effects",
    title: "Nonlinear Effects in Fiber",
    description: "Calculate SPM, XPM, FWM penalties, SBS/SRS thresholds, and nonlinear phase shift.",
    knownIssue: "The SBS linewidth factor is a square root instead of linear, and the four-wave-mixing efficiency has wrong units, so FWM always shows 0 dB.",
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
    description: "Simulate OTDR traces, calculate spatial resolution, dynamic range, dead zones, and event analysis for fiber characterization.",
    knownIssue: "Splice losses recover after the event instead of stepping the trace down, and the dynamic range ignores pulse width (about 11 dB instead of about 31 dB at 100 ns).",
  },
  {
    slug: "photonic-crystal",
    title: "Photonic Crystal Fiber",
    description: "Approximate NA, V-number, mode area, dispersion and confinement loss of an index-guiding photonic crystal fiber from hole pitch Λ and diameter d.",
    knownIssue: "The NA and V-number formulas are ad hoc: the defaults give NA = 1 and V = 18, the effective area is about 4× too small and the dispersion sign is reversed.",
  },
  {
    slug: "polarization-controller",
    title: "Fiber Polarization Controller",
    description: "Retardation per paddle, bend-induced birefringence, quarter- and half-wave coil lengths and output polarization state of a fiber polarization controller.",
    knownIssue: "Retardance comes from a PM-fibre Δn instead of the coil's bend birefringence, the paddles have no angles, and the S₃ sign is opposite to the site's convention.",
  },
  {
    slug: "polarization-maintaining",
    title: "Polarization-Maintaining Fiber",
    description: "Birefringence, beat length, h-parameter and output extinction ratio of PANDA, bow-tie and elliptical-core PM fibers versus length and input PER.",
    knownIssue: "Crosstalk is added to the input extinction ratio linearly instead of as 10^(−ER/10) + tanh(hL): 30 dB in, h = 1e-6 /m, 1 km gives 29.99 dB instead of 26.99 dB.",
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
    description: "Combined pump power, loss, pump brightness and the NA² brightness-conservation check for an N×1 fiber pump combiner, plus signal insertion loss.",
    knownIssue: "The brightness test compares pump NA with the signal-core NA and has no fibre diameters, so a standard (6+1)×1 combiner is shown as infeasible.",
  },
  {
    slug: "rare-earth-doped",
    title: "Rare-Earth-Doped Fiber Amplifier",
    description: "Ion density, pump absorption, small-signal gain, saturation power and noise figure of an Er, Yb, Tm or Nd-doped fiber from doping and pump power.",
    knownIssue: "Gain assumes full inversion regardless of pump (172 dB at the defaults), the saturation power leaves out the absorption cross-section, and the noise figure rises with pump.",
  },
  {
    slug: "rare-earth-fiber",
    title: "Rare-Earth Fiber Dopants",
    description: "Pump bands, cross-sections, lifetime, absorption, small-signal gain and optimal length of Er, Yb, Tm and Ho-doped fibers from concentration and core size.",
    knownIssue: "Absorption in dB/m is used as if it were in nepers: the 90 %-absorption length is 2.8 m instead of 12.3 m and the plotted absorption is too high.",
  },
  {
    slug: "sbs-threshold",
    title: "SBS Threshold Power",
    description: "Calculate Stimulated Brillouin Scattering threshold for optical fibers.",
    knownIssue: "Smith's factor 21 already assumes co-polarized light, but the page halves it for polarized light, so the threshold is 2× too low; zero loss gives NaN.",
  },
  {
    slug: "side-polished",
    title: "Side-Polished Fiber",
    description: "Evanescent field interaction, phase matching, and spectral response of side-polished fiber devices.",
    knownIssue: "The effective index sits at the cutoff value, so the evanescent decay is 16× too slow (92 % instead of 26 % of the power at 2 µm), and the coupling length has no second guide.",
  },
  {
    slug: "specialty-fiber",
    title: "Specialty Fiber Types",
    description: "Compare properties of specialty optical fibers: PM, PCF, rare-earth doped, chalcogenide, and fluoride.",
    knownIssue: "The V-number treats a core radius as a diameter for some rows, and the chalcogenide and ZBLAN losses at 1550 nm are listed below silica's.",
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
  },
  {
    slug: "tapered-fiber",
    title: "Tapered Fiber Design",
    description: "Design adiabatic fiber tapers for mode conversion, evanescent field enhancement, and coupler fabrication.",
    knownIssue: "The Marcuse mode-size fit is used far outside its range (a 1.8 mm waist mode), and the waist is labelled single-mode although the cladding guide there is multimode.",
  },
  {
    slug: "v-number",
    title: "Fiber V-Number",
    description: "Normalized frequency V = 2πa·NA/λ of a step-index fiber, NA from core and cladding indices, the single-mode check (V < 2.405) and the mode count.",
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
