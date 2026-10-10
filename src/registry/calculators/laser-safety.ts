import type { CalculatorEntry } from "../types";

export const laserSafety: CalculatorEntry[] = [
  {
    slug: "ael-limits",
    title: "Accessible Emission Limits (AEL)",
    description: "IEC 60825-1 laser classification AEL thresholds. Simplified model for educational reference.",
    knownIssue: "Pulsed AELs are 1000× too high (mW·s multiplied by 1000 and labelled mJ), Class 1 outside the visible is a flat 1 µW, and Class 2 is offered at every wavelength.",
  },
  {
    slug: "ansi-iec-comparison",
    title: "ANSI vs IEC MPE Comparison",
    description: "Compares Maximum Permissible Exposure (ANSI Z136.1) with Accessible Emission Limits (IEC 60825-1) across wavelengths.",
    knownIssue: "The IEC column uses 7.9×10⁻⁴ (the AEL factor is 7×10⁻⁴), the C_A exponent is 100× off, and UV and wavelengths above 1050 nm are flat placeholders, so the ANSI/IEC differences shown are artefacts.",
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
    description: "Retinal limit at the 0.25 s blink response and the power it allows into a 7 mm pupil, about 1 mW: the basis of Class 2. Visible beams only.",
    tier: "exact",
    modelNote: "ICNIRP retinal thermal limit 18 t^0.75 J/m² at t = 0.25 s, 400–700 nm only, and the power it allows through a 7 mm pupil: 0.98 mW, rounded to the 1 mW Class 2 limit. Not modelled: extended sources.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Table 5 (eye) and Table 8 (apertures).",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "IEC 60825-1:2014, Safety of laser products: the Class 2 AEL of 1 mW for 400–700 nm, with a 0.25 s time base.",
      },
    ],
  },
  {
    slug: "beam-diameter-conversion",
    title: "Beam Diameter Conversion",
    description: "Convert Gaussian beam diameters between the 1/e², 1/e and FWHM definitions and the waist radius w₀, with relative intensity levels.",
    tier: "exact",
    modelNote: "TEM₀₀ round beam I = I₀ exp(−2r²/w²): d(1/e²) = 2w, d(1/e) = d(1/e²)/√2, FWHM = √(ln2/2) d(1/e²) = 0.5887 d(1/e²). Not modelled: elliptical or non-Gaussian beams, second-moment widths.",
    references: [
      {
        citation: "Saleh B. E. A., Teich M. C. (1991). Fundamentals of Photonics, ch. 3 (Beam Optics): Gaussian beam intensity and power. Wiley.",
        url: "https://doi.org/10.1002/0471213748",
      },
    ],
  },
  {
    slug: "beam-divergence-hazards",
    title: "Beam Divergence Hazards",
    description: "Model Gaussian beam propagation and hazard distance based on beam divergence and MPE limits.",
    knownIssue: "The MPE is a fixed 0.1 or 0.01 W/cm² whatever the wavelength and time (up to 60× too high in the near IR), so the NOHD is 4–10× too short; the divergence input is not used.",
  },
  {
    slug: "beam-expander",
    title: "Beam Expander Safety",
    description: "Irradiance of a beam before and after an M× expander: it falls by M², while the divergence falls by M, so far from it the hazard distance grows.",
    tier: "exact",
    modelNote: "Irradiance 4P/(πd²) before and after an ideal M× expander, no losses; with the 1/e diameter d it is the Gaussian peak. Not modelled: aperture averaging and the far-field NOHD, which grows about M-fold.",
    references: [
      {
        citation: "Saleh B. E. A., Teich M. C. (1991). Fundamentals of Photonics, ch. 3 (Beam Optics): Gaussian beam intensity and power. Wiley.",
        url: "https://doi.org/10.1002/0471213748",
      },
    ],
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
    knownIssue: "Class 1 is set at 100 mW beyond 1400 nm (the limit is about 10 mW) and at 0.39 mW in the UV (the limit is microwatts or less), so some Class 3R and 3B lasers are shown as Class 1.",
  },
  {
    slug: "corneal-vs-retinal",
    title: "Corneal vs Retinal Limits",
    description: "Which part of the eye limits a laser exposure from 180 nm to 1 mm: the largest safe power under the ICNIRP 2013 retinal and corneal limits, the retinal image size and the cornea-to-retina gain.",
    tier: "textbook",
    modelNote: "Limits: ICNIRP 2013, point source (exact). Retinal image: a 17 mm eye focusing a TEM₀₀ beam to 4λf/(πd), at least 25.5 µm (α_min); no absorption in the eye. Pulse trains not covered.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 2, 3, 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "Sliney, D. H. & Wolbarsht, M. L. (1980). Safety with Lasers and Other Optical Sources. Plenum, New York. The 17 mm reduced eye.",
        url: "https://doi.org/10.1007/978-1-4899-3596-0",
      },
    ],
  },
  {
    slug: "diffuse-reflection",
    title: "Diffuse Reflection Hazard",
    description: "Evaluate hazard from Lambertian (diffuse) reflections off matte surfaces. Uses extended-source MPE.",
    knownIssue: "The irradiance uses the pupil area instead of the spot area (51× too low for a 50 mm spot), the extended-source factor is inverted, and the UV limit is 33× too high.",
  },
  {
    slug: "diode-laser-safety",
    title: "Diode Laser Safety Calculator",
    description: "Calculate MPE, NOHD, and OD requirements for diode laser bars/stacks with asymmetric divergence.",
    knownIssue: "The MPE falls as t^−0.75 instead of t^−0.25 (2–32× too high below 1 s), 808 nm uses the 0.25 s blink time, UV gets a flat 0.01 W/cm², and the NOHD formula is off by a factor 1/a.",
  },
  {
    slug: "enclosure-class",
    title: "Enclosure Classification",
    description: "Determines laser enclosure safety class based on emission through apertures, per IEC 60825-1 and ANSI Z136.1. Evaluates whether the enclosure provides Class 1 protection.",
    knownIssue: "A 50 mW invisible leak is labelled a Class 2 enclosure protected by the blink reflex; the 1 % leakage is invented, the opening size is unused and the thresholds mix W and mW.",
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
    title: "Extended Source Correction (C_E)",
    description: "ICNIRP 2013 extended-source correction C_E (C₆ in IEC 60825-1), α_max and T₂, and the retinal thermal limit of a source larger than 1.5 mrad against a point source.",
    keywords: ["Extended Source Correction (C₆)"],
    tier: "exact",
    modelNote: "ICNIRP 2013 C_E with γ = α_max, the time-dependent α_max and T₂, on the retinal thermal limit (400–1400 nm). Not modelled: the photochemical field of view and the radiance limits.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 2, 3, 4 and 5.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
    ],
  },
  {
    slug: "eye-safe-wavelength",
    title: "Eye-Safe Wavelength",
    description: "Largest single-pulse energy within the ICNIRP 2013 eye limits across the spectrum for your pulse width and beam, showing why 1.4–2.6 µm lasers are called eye-safe.",
    heading: "Eye-Safe Wavelength Region",
    tier: "exact",
    modelNote: "ICNIRP 2013 point-source eye limits for one pulse of 1 ns – 30 ks, round Gaussian beam averaged over each aperture. Pulse trains (average power, N^−0.25) are not applied.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 3, 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
    ],
  },
  {
    slug: "fiber-laser-safety",
    title: "Fiber Laser Safety Calculator",
    description: "Analyze output power, fiber facet irradiance, and NOHD for fiber laser systems (1064/1550 nm typical).",
    knownIssue: "The two MPE values are swapped (0.1 W/cm² for retinal wavelengths, 8–60× too high), the NOHD formula is off by a factor 1/a, and arcsin(NA), a half-angle, is used as the full angle.",
  },
  {
    slug: "green-laser-pointer",
    title: "Green Laser Pointer Safety",
    description: "Safety analysis for 532 nm DPSS green laser pointers — NOHD, flashblindness, retinal hazard, and classification.",
    knownIssue: "A 5 mW pointer is labelled Class 2 (it is 3R) and 50–500 mW as 2M or 3R (they are 3B); the NOHD formula is off by a factor 1/a (16.7 km instead of about 12 m).",
  },
  {
    slug: "industrial-laser-safety",
    title: "Industrial Laser Safety Calculator",
    description: "Assess direct beam, specular/diffuse reflections, NOHD, and OD for industrial cutting/welding lasers.",
    knownIssue: "The NOHD formula is off by a factor 1/a (4507 km at the defaults), the MPE ignores exposure time, C_A and UV, and the exposure-time input is unused.",
  },
  {
    slug: "infrared-hazard",
    title: "Infrared and Corneal Eye Limits",
    description: "ICNIRP 2013 eye exposure limits at any wavelength from 180 nm to 1 mm: corneal, anterior-eye and retinal limits with their apertures, and the largest safe power for an exposure time.",
    keywords: ["Corneal Exposure Limits", "IR Corneal Exposure", "Infrared Thermal Limits", "Infrared Hazard Calculator"],
    tier: "exact",
    modelNote: "ICNIRP 2013 point-source eye limits (180 nm – 1 mm, 1 ns – 30 ks) for a round TEM₀₀ beam centred on each averaging aperture. Not modelled: pulse trains, extended sources, beams under 1 mm.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 3, 5, 7 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
    ],
  },
  {
    slug: "interlock-design",
    title: "Interlock Time Calculation",
    description: "Calculates required interlock/shutter response time based on laser hazard level. IEC 60825-1 and ANSI Z136.1 require interlocks to terminate emission before exposure exceeds MPE.",
    hidden: true,
    knownIssue: "Above 1050 nm the maximum safe time has no basis (0.39 ms shown, about 80 ns by ICNIRP), visible times are floored at 1 µs, and the approach speed is 1 m/s instead of 1.6–2 m/s.",
  },
  {
    slug: "lidar-safety",
    title: "LiDAR Laser Safety Calculator",
    description: "Analyze pulse energy, PRF-corrected MPE, and NOHD for LiDAR systems (905/1550 nm).",
    hidden: true,
    knownIssue: "The visible average-power limit is 2.5 W/cm² (1000× too high), the pulse limit has a 10⁻³ slip above 100 ns, 1550 nm uses the retinal limit, and the NOHD formula is off by a factor 1/a.",
  },
  {
    slug: "medical-laser-safety",
    title: "Medical Laser Safety Calculator",
    description: "Analyze irradiance, fluence, thermal relaxation, and OD for medical/surgical laser systems.",
    knownIssue: "The thermal relaxation time is 10⁴× too small (m² mixed with cm²/s), the 1400–2600 nm limit is up to 3× too high, and the UV limit is a flat 3 mW/cm² (up to 100× too high).",
  },
  {
    slug: "mpe",
    title: "Maximum Permissible Exposure (MPE)",
    description: "Bounded CW point-source MPE pre-check for 400–1050 nm and 1 ms to 3×10⁴ s using explicitly implemented ANSI-style table slices.",
    lede: "Bounded pre-check: CW point-source retinal limit for 400–1050 nm and 1 ms to 3×10⁴ s, matching ICNIRP 2013. Unsupported regimes are disabled instead of approximated.",
    keywords: ["maximum permissible exposure"],
    priority: 92,
    tier: "exact",
    modelNote: "CW point-source retinal limits through the 7 mm aperture, 400–1050 nm and 1 ms to 3×10⁴ s; they match ICNIRP 2013 Table 5 to 0.25 %. Not modelled: pulses, extended sources, UV and above 1050 nm, skin.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Table 5 (eye) and Table 8 (apertures).",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers. Table 5a: point-source ocular MPE.",
      },
    ],
  },
  {
    slug: "multiple-pulse",
    title: "Multiple Pulse Correction",
    description: "Evaluates all three ANSI Z136.1 rules for repetitive pulse exposure and selects the most restrictive MPE.",
    hidden: true,
    knownIssue: "The pulse energy is read as energy per cm², so a beam inside the 7 mm aperture is 2.6× more hazardous than shown; the single-pulse limit and C_A are not the ICNIRP values.",
  },
  {
    slug: "multiple-wavelength",
    title: "Multiple Wavelength MPE",
    description: "Calculates additive hazard ratios for multiple laser wavelengths. Sum of ratios must be < 1 for safety per ANSI Z136.1 Section 8.",
    knownIssue: "The 1050–1400 nm limit is a constant 0.01 J/cm² (up to 200× too high at 1 ms), the visible limits miss the photochemical limit beyond 10 s, and the irradiance uses a fixed 2 mm area instead of the 7 mm aperture.",
  },
  {
    slug: "nohd",
    title: "Nominal Ocular Hazard Distance (NOHD)",
    description: "Bounded CW point-source NOHD pre-check for educational use only. Based on ANSI Z136.1 direct-beam ocular MPE calculations.",
    lede: "Bounded engineering pre-check for CW point-source direct-beam NOHD using the same restricted MPE branch as the MPE page.",
    keywords: ["nominal ocular hazard distance"],
    priority: 90,
    tier: "textbook",
    modelNote: "NOHD = (√(4P/(πE)) − a)/φ with 1/e values (1/e² inputs ÷ √2), averaged over the 7 mm aperture, on the MPE page's limit. Round beam; not modelled: atmosphere, optical aids, pulses.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Table 5 (eye) and Table 8 (apertures).",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers: direct-beam NOHD and optical density of a CW point source.",
      },
    ],
  },
  {
    slug: "od-requirements",
    title: "OD Requirements (manual validated-limit mode)",
    description: "Manual validated-limit optical-density math for laser safety workflows when the irradiance limit has already been obtained externally.",
    heading: "OD Requirements (manual validated-MPE mode)",
    lede: "Use this only when you already have a validated irradiance limit from a standards-backed calculation. This page is just the attenuation math wrapper.",
    priority: 86,
    tier: "textbook",
    modelNote: "OD = log₁₀(E/E_limit) for an irradiance limit you supply, with E averaged over the 7 mm aperture (the 1/e peak of a wider beam). No wavelength, time or pulse logic is applied.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Table 5 (eye) and Table 8 (apertures).",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers: direct-beam NOHD and optical density of a CW point source.",
      },
    ],
  },
  {
    slug: "optical-density",
    title: "Optical Density (CW point-source pre-check)",
    description: "Bounded CW point-source optical-density pre-check derived from the same MPE branch as the MPE page.",
    lede: "Required OD pre-check derived from the same bounded CW point-source MPE branch as the MPE page.",
    keywords: ["laser eyewear", "od calculator"],
    priority: 88,
    tier: "textbook",
    modelNote: "OD = log₁₀(E/E_MPE), E averaged over the 7 mm aperture (the 1/e peak of a wider beam), on the MPE page's limit. CW and one wavelength; filter damage and EN 207 ratings are not modelled.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Table 5 (eye) and Table 8 (apertures).",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers: direct-beam NOHD and optical density of a CW point source.",
      },
    ],
  },
  {
    slug: "peak-power",
    title: "Peak Power Calculator",
    description: "Pulse energy, duration and peak power of a pulsed laser from average power, repetition rate and duty cycle, for rectangular, Gaussian and sech² pulses.",
    tier: "exact",
    modelNote: "E = P/f, τ = D/f and P_peak = P/D for rectangular pulses; Gaussian and sech² pulses of the same FWHM peak at 0.939 and 0.881 E/τ. Not modelled: pulse pedestals or an MPE comparison.",
    references: [
      {
        citation: "Diels J.-C., Rudolph W. (2006). Ultrashort Laser Pulse Phenomena, 2nd ed., ch. 1 (Fundamentals): pulse shapes and their FWHM. Academic Press.",
        url: "https://doi.org/10.1016/b978-012215493-5/50002-1",
      },
    ],
  },
  {
    slug: "power-density",
    title: "Power Density Calculator",
    description: "Peak and average irradiance of a Gaussian beam from power and 1/e² diameter, with the beam area and the radial intensity profile.",
    tier: "exact",
    modelNote: "Closed forms for a round beam: Gaussian peak 2P/(πw²) = 8P/(πd²), mean over the 1/e² disc P/(πw²), top-hat P/A. Not modelled: aperture averaging for an MPE, clipping, non-Gaussian profiles.",
    references: [
      {
        citation: "Saleh B. E. A., Teich M. C. (1991). Fundamentals of Photonics, ch. 3 (Beam Optics): Gaussian beam intensity and power. Wiley.",
        url: "https://doi.org/10.1002/0471213748",
      },
    ],
  },
  {
    slug: "prf-correction",
    title: "PRF Correction Factor",
    description: "Calculates the repetitive-pulse correction factor Cp for pulsed laser MPE per ANSI Z136.1 §8.",
    knownIssue: "C_P = N^−0.25 is not floored at one pulse, so below N = 1 the corrected limit exceeds the single-pulse limit. The average-power rule and pulse grouping are missing.",
  },
  {
    slug: "pulsed-mpe",
    title: "Pulsed Laser MPE",
    description: "Repetitive pulse MPE with N⁻⁰²⁵ correction factor. Simplified ANSI Z136 model.",
    lede: "Repetitive pulse MPE with N⁻⁰·²⁵ correction factor. Simplified ANSI Z136 model.",
    hidden: true,
    knownIssue: "The t^0.75 law is used below 5 µs, where the limit is flat, so nanosecond limits are 100–1000× too low; pulses are counted over 0.25 s even for invisible beams, which makes that limit up to 2.5× too high.",
  },
  {
    slug: "research-lab-safety",
    title: "Research Lab Laser Safety Calculator",
    description: "Evaluate laser hazard zones, OD requirements, beam path analysis, and room coverage for research labs.",
    knownIssue: "The class table is wrong (4 mW shown as Class 1, 1 W visible as Class 2, Class 3B up to 500 W), and the NOHD formula is off by a factor 1/a (hundreds of km).",
  },
  {
    slug: "retinal-hazard",
    title: "Retinal Hazard Calculator",
    description: "Retinal image size and irradiance of a laser beam viewed directly, from its wavelength, power, diameter and the pupil, compared with the ICNIRP 2013 retinal limits.",
    tier: "textbook",
    modelNote: "A 17 mm eye focusing a TEM₀₀ beam to 4λf/(πd), at least 25.5 µm (α_min); retinal irradiance before absorption. Limits: ICNIRP 2013 retinal, point source, 400–1400 nm.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 2, 3, 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "Sliney, D. H. & Wolbarsht, M. L. (1980). Safety with Lasers and Other Optical Sources. Plenum, New York. The 17 mm reduced eye.",
        url: "https://doi.org/10.1007/978-1-4899-3596-0",
      },
    ],
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
    knownIssue: "The scanning benefit compares a single-pass limit with a 10 s limit, the dwell time ignores the time the beam takes to cross the pupil, and C_A is wrong.",
  },
  {
    slug: "skin-mpe",
    title: "Skin MPE and Hazard Calculator",
    description: "ICNIRP 2013 skin exposure limit from 180 nm to 1 mm: the limit for your exposure time, the beam's irradiance over 3.5 mm and the largest safe power.",
    keywords: ["Skin Hazard Assessment", "Skin MPE Calculator"],
    tier: "exact",
    modelNote: "ICNIRP 2013 Table 7 skin limit, 1 ns – 30 ks, with the large-area rule above 1400 nm; round Gaussian beam averaged over 3.5 mm. Not modelled: pulse trains, and beams under 1 mm.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 3, 5, 7 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
    ],
  },
  {
    slug: "thermal-lens-hazard",
    title: "Thermal Lens Hazard",
    description: "Evaluate thermal lensing risk to protective eyewear and optical components from absorbed laser power.",
  },
  {
    slug: "thermal-vs-photochemical",
    title: "Thermal vs Photochemical Retinal Limits",
    description: "The two ICNIRP 2013 retinal limits at 400–600 nm against exposure time, for a point or an extended source, and the time from which the blue-light (photochemical) limit governs.",
    keywords: ["Thermal vs Photochemical MPE"],
    tier: "exact",
    modelNote: "ICNIRP 2013 retinal thermal (with C_E and T₂) and photochemical limits, 400–600 nm, as corneal exposure over 7 mm. The photochemical field of view of an extended source is not applied.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 2, 3, 4 and 5.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
    ],
  },
  {
    slug: "ultrafast-laser-safety",
    title: "Ultrafast Laser Safety Calculator",
    description: "Evaluate single-pulse, average-power, and PRF-corrected MPE for femtosecond/picosecond laser systems.",
    knownIssue: "The OD comes from the single-pulse limit only and ignores the average-power limit that governs MHz trains (OD 2 shown where about OD 7 is needed); the femtosecond limit is 21× too high.",
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
    tier: "textbook",
    modelNote: "The NOHD model: (√(4P/(πE)) − a)/φ with 1/e values (1/e² inputs ÷ √2), averaged over the 7 mm aperture, on the MPE page's limit. Round beam; not modelled: atmosphere, optical aids, pulses.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Table 5 (eye) and Table 8 (apertures).",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers: direct-beam NOHD and optical density of a CW point source.",
      },
    ],
  },
];
