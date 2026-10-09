import type { CalculatorEntry } from "../types";

export const laserSafety: CalculatorEntry[] = [
  {
    slug: "ael-limits",
    title: "Accessible Emission Limits (AEL)",
    description: "IEC 60825-1 laser classification AEL thresholds. Simplified model for educational reference.",
  },
  {
    slug: "ansi-iec-comparison",
    title: "ANSI vs IEC MPE Comparison",
    description: "Compares Maximum Permissible Exposure (ANSI Z136.1) with Accessible Emission Limits (IEC 60825-1) across wavelengths.",
  },
  {
    slug: "atmospheric-attenuation",
    title: "Atmospheric Attenuation",
    description: "Beam attenuation along an outdoor path from Rayleigh scattering and visibility-based aerosol extinction (Beer-Lambert). Molecular absorption is left out, the conservative side for laser safety NOHD estimates.",
    tier: "textbook",
    modelNote: "Rayleigh plus an empirical aerosol law from the visibility, only a rough guide beyond 1.55 µm. Molecular absorption, rain and snow are not modelled, so transmission is overestimated (conservative for hazard distances).",
    references: [
      {
        citation: "Bucholtz A. (1995). Rayleigh-scattering calculations for the terrestrial atmosphere. Appl. Opt. 34, 2765. Rayleigh scattering of standard sea-level air, eqs. (2)–(4).",
        url: "https://doi.org/10.1364/ao.34.002765",
      },
      {
        citation: "Kim I. I., McArthur B., Korevaar E. (2001). Comparison of laser beam propagation at 785 nm and 1550 nm in fog and haze for optical wireless communications. Proc. SPIE 4214, 26–37. Visibility-based aerosol exponent q.",
        url: "https://doi.org/10.1117/12.417512",
      },
      {
        citation: "Peck E. R., Reeder K. (1972). Dispersion of Air. J. Opt. Soc. Am. 62, 958. Refractive index of standard air, fitted 0.23–1.69 µm.",
        url: "https://doi.org/10.1364/josa.62.000958",
      },
      {
        citation: "Hansen J. E., Travis L. D. (1974). Light scattering in planetary atmospheres. Space Sci. Rev. 16, 527–610. Cross-check of the Rayleigh coefficient (0.46 % difference).",
        url: "https://doi.org/10.1007/bf00168069",
      },
    ],
  },
  {
    slug: "aversion-response",
    title: "Aversion Response Time",
    description: "Calculates MPE at the natural aversion/blink response time (0.25 s) and Class 2 limits per ANSI Z136.1 / IEC 60825-1.",
  },
  {
    slug: "beam-diameter-conversion",
    title: "Beam Diameter Conversion",
    description: "Convert Gaussian beam diameters between the 1/e², 1/e and FWHM definitions and the waist radius w₀, with relative intensity levels.",
  },
  {
    slug: "beam-divergence-hazards",
    title: "Beam Divergence Hazards",
    description: "Model Gaussian beam propagation and hazard distance based on beam divergence and MPE limits.",
  },
  {
    slug: "beam-expander",
    title: "Beam Expander Safety",
    description: "Calculate power density reduction from beam expansion. Critical for ensuring safe irradiance levels.",
  },
  {
    slug: "blue-light-hazard",
    title: "Blue Light Hazard",
    description: "Simplified educational estimate of B(λ)-weighted blue-light irradiance and risk group. Not for safety decisions; use IEC 62471.",
    keywords: ["UV / Blue Light Hazard"],
    tier: "exact",
    modelNote: "Tabulated B(λ), small-source limits and IEC risk groups for a monochromatic beam; irradiance is the beam power over the 1/e² circle. Not modelled: extended sources, pulses and broadband spectra.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to incoherent visible and infrared radiation. Health Phys. 105(1), 74–96. Table 2 (B(λ)) and eqns 15–17 (small-source limits).",
        url: "https://doi.org/10.1097/hp.0b013e318289a611",
      },
      {
        citation: "IEC 62471:2006. Table 4.2 (B(λ) for 500–600 nm) and Table 6.1 (risk groups, small source).",
      },
    ],
  },
  {
    slug: "classification",
    title: "Laser Classification — IEC 60825-1:2014",
    description: "Laser product classification per IEC 60825-1 Edition 3.0 (2014). CW and pulsed AEL thresholds with C_A and C_B correction factors.",
    heading: "Laser Classification (IEC 60825-1:2014)",
    lede: "Laser product classification per IEC 60825-1 Edition 3.0 (2014). CW and simplified pulsed AEL thresholds with C_A and C_B correction factors.",
    hidden: true,
  },
  {
    slug: "corneal-limits",
    title: "Corneal Exposure Limits",
    description: "Corneal MPE across UV, visible, and IR spectral regions. Simplified model.",
  },
  {
    slug: "corneal-vs-retinal",
    title: "Corneal vs Retinal Limits",
    description: "Compares corneal MPE with equivalent retinal irradiance, showing the eye's focusing gain and which limit governs.",
  },
  {
    slug: "diffuse-reflection",
    title: "Diffuse Reflection Hazard",
    description: "Evaluate hazard from Lambertian (diffuse) reflections off matte surfaces. Uses extended-source MPE.",
  },
  {
    slug: "diode-laser-safety",
    title: "Diode Laser Safety Calculator",
    description: "Calculate MPE, NOHD, and OD requirements for diode laser bars/stacks with asymmetric divergence.",
  },
  {
    slug: "enclosure-class",
    title: "Enclosure Classification",
    description: "Determines laser enclosure safety class based on emission through apertures, per IEC 60825-1 and ANSI Z136.1. Evaluates whether the enclosure provides Class 1 protection.",
  },
  {
    slug: "exposure-duration",
    title: "Maximum Safe Exposure Duration",
    description: "Calculate the maximum safe exposure time for a CW laser beam based on MPE limits.",
    keywords: ["Maximum Exposure Duration"],
    tier: "exact",
    modelNote: "ICNIRP point-source eye limits (180 nm – 1 mm, 1 ns – 30 ks) for a CW round TEM₀₀ beam centred on the averaging aperture. Not modelled: extended sources, pulses, and the actual-irradiance advice for beams under 1 mm.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 3, 5, 7 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "EU Directive 2006/25/EC, Annex II, Table 2.3. Cross-check of the UV exposure limits from 10 s.",
      },
    ],
  },
  {
    slug: "extended-source",
    title: "Extended Source Correction (C₆)",
    description: "C₆ angular subtense correction factor for extended source laser hazard evaluation per ANSI Z136.",
  },
  {
    slug: "eye-safe-wavelength",
    title: "Eye-Safe Wavelength",
    description: "Identifies the eye-safe wavelength bands (1400–1500 nm, 1500–1800 nm) where corneal absorption protects the retina. Compare your laser's fluence against spectral MPE.",
    heading: "Eye-Safe Wavelength Region",
  },
  {
    slug: "fiber-laser-safety",
    title: "Fiber Laser Safety Calculator",
    description: "Analyze output power, fiber facet irradiance, and NOHD for fiber laser systems (1064/1550 nm typical).",
  },
  {
    slug: "green-laser-pointer",
    title: "Green Laser Pointer Safety",
    description: "Safety analysis for 532 nm DPSS green laser pointers — NOHD, flashblindness, retinal hazard, and classification.",
  },
  {
    slug: "industrial-laser-safety",
    title: "Industrial Laser Safety Calculator",
    description: "Assess direct beam, specular/diffuse reflections, NOHD, and OD for industrial cutting/welding lasers.",
  },
  {
    slug: "infrared-corneal",
    title: "IR Corneal Exposure",
    description: "Simplified educational estimate of the infrared corneal MPE and maximum safe power. Not for safety decisions; use ANSI Z136.1 or IEC 60825-1.",
  },
  {
    slug: "infrared-hazard",
    title: "Infrared Hazard Calculator",
    description: "Assess corneal and retinal IR hazard for 780 nm – 106 µm lasers. Covers IR-A, IR-B, and IR-C regions.",
  },
  {
    slug: "infrared-thermal",
    title: "Infrared Thermal Limits",
    description: "Calculates MPE for infrared lasers (780nm–1000µm) covering corneal thermal and retinal thermal hazards per ANSI Z136.1.",
  },
  {
    slug: "interlock-design",
    title: "Interlock Time Calculation",
    description: "Calculates required interlock/shutter response time based on laser hazard level. IEC 60825-1 and ANSI Z136.1 require interlocks to terminate emission before exposure exceeds MPE.",
    hidden: true,
  },
  {
    slug: "lidar-safety",
    title: "LiDAR Laser Safety Calculator",
    description: "Analyze pulse energy, PRF-corrected MPE, and NOHD for LiDAR systems (905/1550 nm).",
    hidden: true,
  },
  {
    slug: "medical-laser-safety",
    title: "Medical Laser Safety Calculator",
    description: "Analyze irradiance, fluence, thermal relaxation, and OD for medical/surgical laser systems.",
  },
  {
    slug: "mpe",
    title: "Maximum Permissible Exposure (MPE)",
    description: "Bounded CW point-source MPE pre-check for 400–1050 nm and 1 ms to 3×10⁴ s using explicitly implemented ANSI-style table slices.",
    lede: "Quarantined educational MPE view: bounded small-source ocular direct-beam branch with explicitly implemented ANSI-style time slices (1 ms to 3×10^4 s). Unsupported regimes are disabled instead of approximated.",
    keywords: ["maximum permissible exposure"],
    priority: 92,
  },
  {
    slug: "multiple-pulse",
    title: "Multiple Pulse Correction",
    description: "Evaluates all three ANSI Z136.1 rules for repetitive pulse exposure and selects the most restrictive MPE.",
    hidden: true,
  },
  {
    slug: "multiple-wavelength",
    title: "Multiple Wavelength MPE",
    description: "Calculates additive hazard ratios for multiple laser wavelengths. Sum of ratios must be < 1 for safety per ANSI Z136.1 Section 8.",
  },
  {
    slug: "nohd",
    title: "Nominal Ocular Hazard Distance (NOHD)",
    description: "Bounded CW point-source NOHD pre-check for educational use only. Based on ANSI Z136.1 direct-beam ocular MPE calculations.",
    lede: "Bounded engineering pre-check for CW point-source direct-beam NOHD using the same restricted MPE branch as the MPE page.",
    keywords: ["nominal ocular hazard distance"],
    priority: 90,
  },
  {
    slug: "od-requirements",
    title: "OD Requirements (manual validated-limit mode)",
    description: "Manual validated-limit optical-density math for laser safety workflows when the irradiance limit has already been obtained externally.",
    heading: "OD Requirements (manual validated-MPE mode)",
    lede: "Use this only when you already have a validated irradiance limit from a standards-backed calculation. This page is just the attenuation math wrapper.",
    priority: 86,
  },
  {
    slug: "optical-density",
    title: "Optical Density (CW point-source pre-check)",
    description: "Bounded CW point-source optical-density pre-check derived from the same MPE branch as the MPE page.",
    lede: "Required OD pre-check derived from the same bounded CW point-source MPE branch as the MPE page.",
    keywords: ["laser eyewear", "od calculator"],
    priority: 88,
  },
  {
    slug: "peak-power",
    title: "Peak Power Calculator",
    description: "Convert average power to peak power for pulsed lasers. Essential for assessing single-pulse hazards.",
  },
  {
    slug: "power-density",
    title: "Power Density Calculator",
    description: "Peak and average irradiance of a Gaussian beam from power and 1/e² diameter, with the beam area and the radial intensity profile.",
  },
  {
    slug: "prf-correction",
    title: "PRF Correction Factor",
    description: "Calculates the repetitive-pulse correction factor Cp for pulsed laser MPE per ANSI Z136.1 §8.",
  },
  {
    slug: "pulsed-mpe",
    title: "Pulsed Laser MPE",
    description: "Repetitive pulse MPE with N⁻⁰²⁵ correction factor. Simplified ANSI Z136 model.",
    lede: "Repetitive pulse MPE with N⁻⁰·²⁵ correction factor. Simplified ANSI Z136 model.",
    hidden: true,
  },
  {
    slug: "research-lab-safety",
    title: "Research Lab Laser Safety Calculator",
    description: "Evaluate laser hazard zones, OD requirements, beam path analysis, and room coverage for research labs.",
  },
  {
    slug: "retinal-hazard",
    title: "Retinal Hazard Calculator",
    description: "Estimate retinal irradiance and image size from corneal laser parameters. Simplified model assuming emmetropic eye.",
  },
  {
    slug: "retinal-image-size",
    title: "Retinal Image Size",
    description: "Calculates retinal spot size from corneal beam parameters, including diffraction and geometric contributions per ANSI Z136.1.",
  },
  {
    slug: "scan-failure",
    title: "Scan Failure Analysis",
    description: "Analyzes hazard when a scanning laser fails to scan, causing the beam to dwell on a single point. IEC 60825-1 scan failure assessment.",
  },
  {
    slug: "scanning-mpe",
    title: "Scanned Beam MPE",
    description: "Calculates the effective MPE for scanning laser beams where dwell time per retinal point is reduced compared to stationary exposure.",
    hidden: true,
  },
  {
    slug: "skin-hazard",
    title: "Skin Hazard Assessment",
    description: "Evaluate skin exposure risk from laser irradiation per ANSI Z136.1 simplified skin MPE.",
  },
  {
    slug: "skin-mpe",
    title: "Skin MPE Calculator",
    description: "Maximum permissible exposure for skin (ANSI Z136 simplified). Not for clinical safety decisions.",
  },
  {
    slug: "thermal-lens-hazard",
    title: "Thermal Lens Hazard",
    description: "Evaluate thermal lensing risk to protective eyewear and optical components from absorbed laser power.",
  },
  {
    slug: "thermal-vs-photochemical",
    title: "Thermal vs Photochemical MPE",
    description: "Educational comparison of thermal and photochemical retinal MPE versus wavelength and exposure time, showing which mechanism sets the limit.",
  },
  {
    slug: "ultrafast-laser-safety",
    title: "Ultrafast Laser Safety Calculator",
    description: "Evaluate single-pulse, average-power, and PRF-corrected MPE for femtosecond/picosecond laser systems.",
  },
  {
    slug: "uv-exposure",
    title: "UV Exposure Limits",
    description: "Simplified educational estimate of actinic UV exposure limits with S(λ) weighting. Not for safety decisions; use IEC 62471.",
    tier: "exact",
    modelNote: "Monochromatic source: S(λ)-weighted limit of 30 J/m² plus ICNIRP's unweighted UVA limit of 10⁴ J/m² (315–400 nm), within 8 h. ACGIH and IEC relax the UVA limit after 1000 s; ICNIRP, used here, does not.",
    references: [
      {
        citation: "ICNIRP (2004). Guidelines on limits of exposure to ultraviolet radiation of wavelengths between 180 nm and 400 nm (incoherent optical radiation). Health Phys. 87(2), 171–186. Table 1 (S(λ) and the exposure limits).",
        url: "https://doi.org/10.1097/00004032-200408000-00006",
      },
      { citation: "IEC 62471:2006. Table 4.1 (the same S(λ) values)." },
    ],
  },
  {
    slug: "uv-hazard",
    title: "UV Hazard Calculator",
    description: "UV hazard assessment with the ICNIRP/ACGIH actinic weighting function S(λ) and the UVA eye limit. Covers 180–400 nm.",
    tier: "exact",
    modelNote: "Monochromatic source: S(λ)-weighted limit of 30 J/m² plus ICNIRP's unweighted UVA limit of 10⁴ J/m² (315–400 nm), within 8 h. ACGIH and IEC relax the UVA limit after 1000 s; ICNIRP, used here, does not.",
    references: [
      {
        citation: "ICNIRP (2004). Guidelines on limits of exposure to ultraviolet radiation of wavelengths between 180 nm and 400 nm (incoherent optical radiation). Health Phys. 87(2), 171–186. Table 1 (S(λ) and the exposure limits).",
        url: "https://doi.org/10.1097/00004032-200408000-00006",
      },
      { citation: "IEC 62471:2006. Table 4.1 (the same S(λ) values)." },
    ],
  },
  {
    slug: "viewing-distance",
    title: "Safe Viewing Distance (CW point-source pre-check)",
    description: "Bounded CW point-source direct-beam viewing-distance pre-check using the same assumptions as the MPE and NOHD pages.",
    lede: "Simplified direct-beam viewing-distance estimate built from the same bounded CW point-source assumptions as the MPE and NOHD pages.",
    priority: 84,
  },
];
