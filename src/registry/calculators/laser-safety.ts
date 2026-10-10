import type { CalculatorEntry } from "../types";

export const laserSafety: CalculatorEntry[] = [
  {
    slug: "ael-limits",
    title: "Accessible Emission Limits (AEL)",
    description: "IEC 60825-1:2014 accessible emission limits of Classes 1, 2, 3R and 3B from 180 nm to 1 mm: for one emission of a given duration, and for a CW laser over the class time base.",
    tier: "textbook",
    modelNote: "AELs rebuilt from the limits they come from (ICNIRP 2013 from 400 nm, IEC's UV values over 1 mm), so within IEC's two-figure rounding; Class 3B cap at 1250–1400 nm, EU A11 optional. Not modelled: pulse trains, Class 1C.",
    references: [
      {
        citation: "IEC 60825-1:2014. Safety of laser products – Part 1: Equipment classification and requirements. 4.3 e) (time bases), Tables 3–8 (AELs), Table 10 (measurement conditions).",
        url: "https://webstore.iec.ch/en/publication/3587",
      },
      {
        citation: "IEC 60825-1:1993+A1:1997+A2:2001. Tables 1–4 (AELs of Classes 1, 2, 3R and 3B) and Table 10: the UV and Class 3B values used here.",
      },
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 2–5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "Schulmeister, K. (2017). The new edition of the international laser product safety standard IEC 60825-1. White paper, Seibersdorf Laboratories. AELs from the MPEs; Class 3B cap at 1250–1400 nm.",
        url: "https://www.seibersdorf-laboratories.at/fileadmin/user_upload/docs/le/las/publ/whitepaper_iec-60825-1.pdf",
      },
      {
        citation: "Schulmeister, K. (2022). The European Amendment A11:2021 to EN 60825-1. White paper, Seibersdorf Laboratories. Skin AEL at 1250–1400 nm.",
        url: "https://www.seibersdorf-laboratories.at/fileadmin/user_upload/docs/le/las/publ/whitepaper_a11_to_en_60825-1.pdf",
      },
    ],
  },
  {
    slug: "ansi-iec-comparison",
    title: "Exposure Limit (MPE) vs Emission Limit (AEL)",
    description: "The eye exposure limit (MPE, ICNIRP 2013) against the Class 1 accessible emission limit (AEL, IEC 60825-1:2014) from 180 nm to 1 mm: where they agree, where they part, and how ANSI Z136.1 differs.",
    keywords: ["ANSI vs IEC", "MPE vs AEL", "ANSI IEC comparison"],
    tier: "textbook",
    modelNote: "MPE: least ICNIRP 2013 eye limit over its aperture. AEL: IEC 60825-1:2014 Class 1 rebuilt from it (IEC's own UV values, Class 3B cap at 1250–1400 nm). ANSI Z136.1 values not computed (tables not public).",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 2–5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "IEC 60825-1:2014. Safety of laser products – Part 1: Equipment classification and requirements. Tables 3–8 (AELs), Annex A (MPEs).",
        url: "https://webstore.iec.ch/en/publication/3587",
      },
      {
        citation: "Schulmeister, K. (2017). The new edition of the international laser product safety standard IEC 60825-1. White paper, Seibersdorf Laboratories. AELs from the MPEs; ANSI Z136.1-2014 differences.",
        url: "https://www.seibersdorf-laboratories.at/fileadmin/user_upload/docs/le/las/publ/whitepaper_iec-60825-1.pdf",
      },
    ],
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
    description: "Class of a CW laser under IEC 60825-1:2014 (1, 1M, 2, 2M, 3R, 3B or 4) from its power, wavelength, beam diameter and divergence, with the naked-eye and binocular measurement conditions.",
    heading: "Laser Classification (IEC 60825-1:2014)",
    lede: "Class of a CW laser product from 180 nm to 1 mm: the accessible emission limits rebuilt from the eye limits, with the beam measured through the naked-eye and binocular stops.",
    keywords: ["laser class calculator", "IEC 60825-1 classification"],
    tier: "textbook",
    modelNote: "CW AELs rebuilt from ICNIRP 2013 (IEC's UV values) over each stop: 100 mm from the waist (Condition 3), 50 mm at 2 m (Condition 1, 400–1400 nm only); within IEC's rounding. Not modelled: pulses, scanning, Class 1C.",
    references: [
      {
        citation: "IEC 60825-1:2014. Safety of laser products – Part 1: Equipment classification and requirements. 4.3 e) (time bases), 5.3 (classes), Tables 3–8 (AELs), Table 10 (measurement conditions).",
        url: "https://webstore.iec.ch/en/publication/3587",
      },
      {
        citation: "IEC 60825-1:1993+A1:1997+A2:2001. Tables 1–4 (AELs of Classes 1, 2, 3R and 3B) and Table 10: the UV and Class 3B values used here.",
      },
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 2–5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "Schulmeister, K. (2017). The new edition of the international laser product safety standard IEC 60825-1. White paper, Seibersdorf Laboratories. Measurement conditions; Class 3B cap at 1250–1400 nm.",
        url: "https://www.seibersdorf-laboratories.at/fileadmin/user_upload/docs/le/las/publ/whitepaper_iec-60825-1.pdf",
      },
      {
        citation: "Schulmeister, K. (2022). The European Amendment A11:2021 to EN 60825-1. White paper, Seibersdorf Laboratories. Skin AEL at 1250–1400 nm.",
        url: "https://www.seibersdorf-laboratories.at/fileadmin/user_upload/docs/le/las/publ/whitepaper_a11_to_en_60825-1.pdf",
      },
    ],
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
    description: "Eye hazard of viewing a laser spot on a matte (Lambertian) surface: corneal irradiance, extended-source limit, diffuse hazard distance and OD, on the ICNIRP 2013 limits.",
    tier: "textbook",
    modelNote: "Lambertian spot ρP/(πr²) (r ≫ spot), an extended source of α = d₆₃/r with ICNIRP 2013 C_E (open field of view, eqn 5); one exposure up to t. Errs high close up, and for blue light from spots over 11 mrad.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Table 2 and eqn 5 (C_E), Tables 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "IEC 60825-1:2014, Safety of laser products – Part 1. Clause 3.10: angular subtense from the 63 % (1/e) diameter.",
      },
      {
        citation: "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers. Appendix B: nominal hazard zone, NOHD and optical density.",
      },
    ],
  },
  {
    slug: "diode-laser-safety",
    title: "Diode Laser Safety Calculator",
    description: "NOHD and eyewear OD for a diode laser beam with different slow- and fast-axis divergence (1/e² or FWHM), on the ICNIRP 2013 eye limits.",
    tier: "textbook",
    modelNote: "Elliptical beam as the round beam of equal peak irradiance (√(d_x d_y)), each axis a + rφ; ICNIRP 2013 point-source eye limits averaged over each aperture, one exposure up to t. Not modelled: extended-source bars, pulses.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers. Appendix B: nominal hazard zone, NOHD and optical density.",
      },
      {
        citation: "IEC TR 60825-14:2004, Safety of laser products – Part 14: A user's guide. Hazard distances and protective eyewear.",
      },
    ],
  },
  {
    slug: "enclosure-class",
    title: "Enclosure Classification",
    description: "Class of a product that encloses a stronger laser, from the beam escaping through an opening and the window over it (IEC 60825-1:2014), and the optical density the opening needs for Class 1.",
    tier: "textbook",
    modelNote: "Accessible emission: the centred Gaussian's share through the opening × 10^−OD, classed with the IEC 60825-1:2014 CW AELs (classification page). Not modelled: scattered leakage, several openings, pulses, guard damage.",
    references: [
      {
        citation: "IEC 60825-1:2014. Safety of laser products – Part 1: Equipment classification and requirements. Protective housing, accessible emission, Tables 3–8 (AELs).",
        url: "https://webstore.iec.ch/en/publication/3587",
      },
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 2–5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "IEC 60825-4:2006+A1:2008+A2:2011. Safety of laser products – Part 4: Laser guards.",
      },
    ],
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
    description: "Largest energy per pulse within the ICNIRP 2013 eye limits across the spectrum for your pulse width, repetition rate and beam: why 1.4–2.6 µm lasers are called eye-safe, and how a pulse train narrows the margin.",
    heading: "Eye-Safe Wavelength Region",
    tier: "exact",
    modelNote: "ICNIRP 2013 point-source eye limits with the repetitive-pulse rules (single pulse, pulse groups, C_P) and the sub-ns rows; round Gaussian beam averaged over each aperture.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 3, 5 and 8; repetitive pulse exposures (p. 287).",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
    ],
  },
  {
    slug: "fiber-laser-safety",
    title: "Fiber Laser Safety Calculator",
    description: "Output power, NOHD and eyewear OD of a bare fiber end (single-mode or multimode), on the ICNIRP 2013 eye limits.",
    tier: "textbook",
    modelNote: "Fiber end as a Gaussian waist: single-mode diffracts at λ/(πw₀), multimode fills the NA; ICNIRP 2013 eye limits averaged over each aperture, one exposure up to t. Real multimode profiles aren't Gaussian.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers. Appendix B: nominal hazard zone, NOHD and optical density.",
      },
      {
        citation: "IEC TR 60825-14:2004, Safety of laser products – Part 14: A user's guide. Hazard distances and protective eyewear.",
      },
    ],
  },
  {
    slug: "green-laser-pointer",
    title: "Green Laser Pointer Safety",
    description: "Class, NOHD and dazzle distances of a laser pointer: its IEC 60825-1:2014 class, the nominal ocular hazard distance on the ICNIRP 2013 limits, and how far it causes flash-blindness, glare and distraction (ICAO levels).",
    tier: "textbook",
    modelNote: "Class: IEC 60825-1:2014 CW AELs. NOHD: ICNIRP 2013, 0.25 s if visible (else 10 s), beam d + rφ. Dazzle: peak irradiance vs the ICAO levels, not weighted by eye sensitivity. Not modelled: IR leakage, atmosphere.",
    references: [
      {
        citation: "IEC 60825-1:2014. Safety of laser products – Part 1: Equipment classification and requirements. Tables 3–8 (AELs), Table 10 (measurement conditions).",
        url: "https://webstore.iec.ch/en/publication/3587",
      },
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "ICAO (2003). Doc 9815, Manual on Laser Emitters and Flight Safety; Annex 11. Laser-beam free (50 nW/cm²), critical (5 µW/cm²) and sensitive (100 µW/cm²) flight zones.",
      },
    ],
  },
  {
    slug: "industrial-laser-safety",
    title: "Industrial Laser Safety Calculator",
    description: "Direct-beam NOHD, diffuse-reflection hazard distance and eyewear OD for industrial cutting and welding lasers, on the ICNIRP 2013 eye limits.",
    tier: "textbook",
    modelNote: "Direct-beam NOHD (a + rφ) and Lambertian diffuse reflection (extended source, ICNIRP C_E with an open field of view) on the ICNIRP 2013 eye limits, one exposure up to t. Not checked: filter damage, plume.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Table 2 and eqn 5 (C_E), Tables 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers. Appendix B: nominal hazard zone, NOHD and optical density.",
      },
      {
        citation: "IEC TR 60825-14:2004, Safety of laser products – Part 14: A user's guide. Hazard distances and protective eyewear.",
      },
    ],
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
    description: "Eye safety of a stationary lidar beam (905 or 1550 nm) on the ICNIRP 2013 limits: the repetitive-pulse rule that binds, NOHD, exposure at a viewing distance and eyewear OD.",
    tier: "textbook",
    modelNote: "ICNIRP 2013 repetitive-pulse rules on the eye limits; round Gaussian beam widening as a + rφ, averaged over each aperture. Stationary beam (the worst case, a scanner failure); scanning not modelled.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Repetitive pulse exposures (p. 287), Tables 4, 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
    ],
  },
  {
    slug: "medical-laser-safety",
    title: "Medical Laser Safety Calculator",
    description: "Surgical laser with a focusing handpiece: NOHD beyond the focus and eyewear OD on the ICNIRP 2013 eye limits, with the spot's power density, fluence and the target's thermal relaxation time.",
    tier: "textbook",
    modelNote: "Lens-on-laser beam spreading at b₀/f from the focus; ICNIRP 2013 point-source eye limits over each aperture, exposures up to t; TRT: a Gaussian centre temperature halves. Not modelled: bare fibres, pulses, skin.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers, Appendix B (lens-on-laser hazard zone); ANSI Z136.3-2018, Safe Use of Lasers in Health Care.",
      },
      {
        citation: "Anderson, R. R. & Parrish, J. A. (1983). Selective photothermolysis: precise microsurgery by selective absorption of pulsed radiation. Science 220, 524–527.",
        url: "https://doi.org/10.1126/science.6836297",
      },
    ],
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
    slug: "multiple-wavelength",
    title: "Multiple Wavelength MPE",
    description: "Eye exposure to a beam with several wavelengths on the ICNIRP 2013 limits: lines absorbed in the same tissue add, while the retina and the cornea count independently.",
    tier: "exact",
    modelNote: "ICNIRP 2013 eye limits per line (point source, averaged over each aperture, exposures up to t); shares add per tissue (retina; cornea and lens) as on p. 279. Not modelled: skin, pulses, lines of different beam size.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. p. 279 (multiple wavelengths), Tables 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
    ],
  },
  {
    slug: "nohd",
    title: "Nominal Ocular Hazard Distance (NOHD)",
    description: "Nominal ocular hazard distance of a direct laser beam at any wavelength from 180 nm to 1 mm, on the ICNIRP 2013 eye limits, with linear or Gaussian beam spread.",
    lede: "Distance beyond which a direct beam is within every eye exposure limit for an exposure of up to t, from the beam's power, diameter and divergence.",
    keywords: ["nominal ocular hazard distance", "Beam Divergence Hazards", "Safe Viewing Distance"],
    priority: 90,
    tier: "exact",
    modelNote: "ICNIRP 2013 eye limits (180 nm – 1 mm, one exposure up to t) for a Gaussian beam averaged over each limit's aperture, spreading as a + rφ or √(a² + (rφ)²). Not modelled: atmosphere, optical aids, pulse trains.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 2, 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers. Appendix B: nominal hazard zone, NOHD and optical density.",
      },
      {
        citation: "IEC TR 60825-14:2004, Safety of laser products – Part 14: A user's guide. Hazard distances and protective eyewear.",
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
    slug: "pulsed-mpe",
    title: "Pulsed Laser MPE",
    description: "Largest energy per pulse of a repetitively pulsed laser within the ICNIRP 2013 eye limits: single pulse, average power over every pulse group, and the C_P = N^−0.25 rule, from 100 fs pulses to CW-like trains.",
    lede: "Eye exposure limit of a pulse train, 180 nm to 1 mm: the three repetitive-pulse rules, which one binds, and the eyewear OD needed.",
    keywords: ["Multiple Pulse Correction", "PRF Correction Factor", "repetitive pulse MPE", "C_P correction factor"],
    tier: "exact",
    modelNote: "ICNIRP 2013 repetitive-pulse rules 1–3 (C_P with T_i grouping) on the eye limits, sub-ns rows included; regular train, round Gaussian beam over each aperture. Not modelled: bursts, scanning, skin.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Repetitive pulse exposures (p. 287), Tables 4, 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "Schulmeister, K. (2017). The new edition of the international laser product safety standard IEC 60825-1. White paper, Seibersdorf Laboratories. Multiple pulses, C₅ and pulse groups.",
        url: "https://www.seibersdorf-laboratories.at/fileadmin/user_upload/docs/le/las/publ/whitepaper_iec-60825-1.pdf",
      },
    ],
  },
  {
    slug: "research-lab-safety",
    title: "Research Lab Laser Safety Calculator",
    description: "Class, NOHD, eyewear OD and diffuse-reflection hazard of a CW laser in a lab, and whether the direct beam is still hazardous at the walls (IEC 60825-1:2014 class, ICNIRP 2013 eye limits).",
    tier: "textbook",
    modelNote: "Class: IEC 60825-1:2014 CW AELs. NOHD (d + rφ), eyewear OD and white-wall diffuse reflection on the ICNIRP 2013 eye limits for the exposure time. Not modelled: pulses, specular paths, skin, several beams.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 2–5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "IEC 60825-1:2014. Safety of laser products – Part 1: Equipment classification and requirements. Tables 3–8 (AELs).",
        url: "https://webstore.iec.ch/en/publication/3587",
      },
      {
        citation: "IEC TR 60825-14:2004, Safety of laser products – Part 14: A user's guide. Hazard distances, protective eyewear, controls.",
      },
    ],
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
    description: "Apparent source of a laser beam: retinal image diameter and angular subtense α with the eye accommodating from 100 mm to infinity, for any waist size and beam quality M².",
    tier: "textbook",
    modelNote: "Embedded-Gaussian beam (M²) from its waist; 17 mm air-equivalent eye accommodating 0–10 D; 7 mm pupil diffraction; α from the 63 % image diameter. Not modelled: aberrations of the eye, beams converging behind it.",
    references: [
      {
        citation: "IEC 60825-1:2014, Safety of laser products – Part 1. Definitions of the apparent source and the angular subtense (63 % energy diameter); accommodation from 100 mm to infinity.",
      },
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Table 2 (α_min, α_max, C_E).",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "ISO 11146-1:2021, Lasers and laser-related equipment – Test methods for laser beam widths, divergence angles and beam propagation ratios (M²).",
      },
    ],
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
    description: "Temperature rise of a laser eyewear filter or lens at the beam centre, absorbed at the face or through the thickness, and the time until it softens.",
    tier: "textbook",
    modelNote: "Gaussian beam heating a laterally infinite plate with insulated faces, absorbed at the face or evenly in depth; constant properties and no cooling, so long exposures err high. Not modelled: thermal stress, dye bleaching.",
    references: [
      {
        citation: "Carslaw, H. S. & Jaeger, J. C. (1959). Conduction of Heat in Solids, 2nd ed. Oxford University Press. Instantaneous point source and the method of images.",
      },
      {
        citation: "Lax, M. (1977). Temperature rise induced by a laser beam. J. Appl. Phys. 48, 3919–3924.",
        url: "https://doi.org/10.1063/1.324265",
      },
      {
        citation: "EN 207:2017, Personal eye-protection equipment – Filters and eye-protectors against laser radiation (5 s CW test).",
      },
    ],
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
    description: "Eye safety of femtosecond and picosecond lasers on the ICNIRP 2013 limits: sub-ns single-pulse limits, the average-power rule that governs MHz trains, eyewear OD and NOHD.",
    tier: "textbook",
    modelNote: "ICNIRP 2013 repetitive-pulse rules with the sub-ns rows (1 mJ/m² from 100 fs to 10 ps); round Gaussian beam over each aperture, NOHD with a + rφ. Not modelled: bursts, harmonics, eyewear saturation.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Repetitive pulse exposures (p. 287), Tables 4, 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
    ],
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
  }
];
