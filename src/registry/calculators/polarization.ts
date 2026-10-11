import type { CalculatorEntry, Reference } from "../types";

// Chapters of the 3rd edition, titles and pages checked on Crossref (doi:10.1201/b10436-n): The Polarization
// Ellipse pp. 49–58, Stokes Polarization Parameters pp. 59–91, Mueller Matrices for Polarizing Components
// pp. 93–115, The Jones Matrix Formalism pp. 201–231.
const goldstein = (where: string): Reference => ({
  citation: `Goldstein D. H. (2011). Polarized Light, 3rd ed., ${where}. CRC Press.`,
  url: "https://doi.org/10.1201/b10436",
});
const jones1941: Reference = {
  citation: "Jones R. C. (1941). A new calculus for the treatment of optical systems, I. Description and discussion of the calculus. J. Opt. Soc. Am. 31(7), 488–493.",
  url: "https://doi.org/10.1364/JOSA.31.000488",
};
const collett: Reference = {
  citation: "Collett E. (2005). Field Guide to Polarization, SPIE Field Guides FG05: the Stokes parameters and the Poincaré sphere. SPIE Press.",
  url: "https://doi.org/10.1117/3.626141",
};
const cloude: Reference = {
  citation: "Cloude S. R. (1986). Group theory and polarisation algebra. Optik 75(1), 26–36: a Mueller matrix is physical when its coherency matrix has no negative eigenvalue.",
};
const goldsteinJones = goldstein("ch. The Jones Matrix Formalism, pp. 201–231");
const goldsteinStokes = goldstein("chs. The Polarization Ellipse, pp. 49–58, and Stokes Polarization Parameters, pp. 59–91");
const goldsteinMueller = goldstein("ch. Mueller Matrices for Polarizing Components, pp. 93–115");

// Born & Wolf 7th ed. chapters checked on Crossref (doi:10.1017/CBO9781139644181.0nn): Basic properties of the
// electromagnetic field pp. 1–74 (.010), Optics of crystals pp. 790–852 (.024).
const bornWolfCrystals: Reference = {
  citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., ch. 15 Optics of crystals, pp. 790–852. Cambridge University Press.",
  url: "https://doi.org/10.1017/CBO9781139644181.024",
};
const bornWolfTir: Reference = {
  citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., §1.5.4 Total reflection (Fresnel rhomb). Cambridge University Press.",
  url: "https://doi.org/10.1017/CBO9781139644181.010",
};
const hechtRetarders: Reference = {
  citation: "Hecht E. (2002). Optics, 4th ed., §8.4 Birefringence and §8.7 Retarders. Addison-Wesley.",
};
const veiras2010: Reference = {
  citation: "Veiras F. E., Perez L. I., Garea M. T. (2010). Phase shift formulas in uniaxial media: an application to waveplates. Appl. Opt. 49, 2769.",
  url: "https://doi.org/10.1364/AO.49.002769",
};
const ghosh1999: Reference = {
  citation: "Ghosh G. (1999). Dispersion-equation coefficients for the refractive index and birefringence of calcite and quartz crystals. Opt. Commun. 163, 95–102.",
  url: "https://doi.org/10.1016/S0030-4018(99)00091-7",
};
const dodge1984: Reference = {
  citation: "Dodge M. J. (1984). Refractive properties of magnesium fluoride. Appl. Opt. 23, 1980–1985.",
  url: "https://doi.org/10.1364/AO.23.001980",
};
// The 1972 paper is a meeting abstract; refractiveindex.info takes the formula from Dodge's 1986 handbook chapter.
const malitsonDodge1972: Reference = {
  citation: "Malitson I. H., Dodge M. J. (1972). Refractive index and birefringence of synthetic sapphire. J. Opt. Soc. Am. 62, 1405 (abstract); formula in Dodge M. J. (1986), Handbook of Laser Science and Technology vol. IV, part 2, p. 30, CRC Press.",
};
const lomheim1978: Reference = {
  citation: "Lomheim T. S., DeShazer L. G. (1978). Optical-absorption intensities of trivalent neodymium in the uniaxial crystal yttrium orthovanadate. J. Appl. Phys. 49, 5517–5522: YVO₄ dispersion formula.",
  url: "https://doi.org/10.1063/1.324471",
};
const zelmon1997: Reference = {
  citation: "Zelmon D. E., Small D. L., Jundt D. (1997). Infrared corrected Sellmeier coefficients for congruently grown lithium niobate and 5 mol% magnesium oxide-doped lithium niobate. J. Opt. Soc. Am. B 14, 3319–3322.",
  url: "https://doi.org/10.1364/JOSAB.14.003319",
};
const devore1951: Reference = {
  citation: "DeVore J. R. (1951). Refractive indices of rutile and sphalerite. J. Opt. Soc. Am. 41, 416–419.",
  url: "https://doi.org/10.1364/JOSA.41.000416",
};
const crystalData = [ghosh1999, dodge1984, malitsonDodge1972, lomheim1978, zelmon1997, devore1951];
const schottBk7: Reference = {
  citation: "SCHOTT optical glass catalog (Zemax AGF 2017-01-20): N-BK7 Sellmeier coefficients.",
};
const goochTarry: Reference = {
  citation: "Gooch C. H., Tarry H. A. (1975). The optical properties of twisted nematic liquid crystal structures with twist angles ≤90 degrees. J. Phys. D: Appl. Phys. 8, 1575–1584.",
  url: "https://doi.org/10.1088/0022-3727/8/13/020",
};
const yehGu: Reference = {
  citation: "Yeh P., Gu C. (1999). Optics of Liquid Crystal Displays: Jones matrix of a twisted nematic layer. Wiley.",
};

const goldsteinFresnel = goldstein("ch. Fresnel Equations, pp. 117–147");
const goldsteinPlates = goldstein("ch. Mueller Matrices for Dielectric Plates, pp. 177–199");
const bornWolfFresnel: Reference = {
  citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., §1.5 Reflection and refraction of a plane wave (Fresnel formulae, total reflection). Cambridge University Press.",
  url: "https://doi.org/10.1017/CBO9781139644181.010",
};
// Shurcliff's chapters, titles and pages from Crossref (doi:10.4159/harvard.9780674424135.cN).
const shurcliff = (chapter: string, n: number): Reference => ({
  citation: `Shurcliff W. A. (1962). Polarized Light: Production and Use, ch. ${chapter}. Harvard University Press.`,
  url: `https://doi.org/10.4159/harvard.9780674424135.c${n}`,
});
const shurcliffParameters = shurcliff("3 Polarizers: classes and performance parameters, pp. 32–42 (principal transmittances k₁, k₂)", 4);
const shurcliffDichroic = shurcliff("4 Dichroic polarizers, pp. 43–64", 5);
const shurcliffBirefringence = shurcliff("5 Birefringence polarizers, pp. 65–77", 6);
const shurcliffReflection = shurcliff("6 Reflection polarizers, pp. 78–86", 7);
const archardTaylor1948: Reference = {
  citation: "Archard J. F., Taylor A. M. (1948). Improved Glan-Foucault prism. J. Sci. Instrum. 25, 407–409: the Glan-Taylor design, optic axis in the plane of incidence.",
  url: "https://doi.org/10.1088/0950-7671/25/12/304",
};
const macNeille1946: Reference = {
  citation: "MacNeille S. M. (1946). Beam splitter. US patent 2,403,731 (Eastman Kodak): quarter-wave layers at Brewster's angle between glass prisms.",
  url: "https://patents.google.com/patent/US2403731A/en",
};
const macleodBasic: Reference = {
  citation: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 Basic Theory, pp. 13–71. CRC Press.",
  url: "https://doi.org/10.1201/9781420073034-c2",
};
const macleodTilted: Reference = {
  citation: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 9 Tilted Coatings (MacNeille polarizer), pp. 403–469. CRC Press.",
  url: "https://doi.org/10.1201/9781420073034-c9",
};
const marcuvitz: Reference = {
  citation: "Marcuvitz N. (1951; IET reprint 1986). Waveguide Handbook, ch. 5 Four-terminal structures, pp. 217–335: inductive and capacitive strip gratings.",
  url: "https://doi.org/10.1049/PBEW021E_ch5",
};
const ulrich1967: Reference = {
  citation: "Ulrich R. (1967). Far-infrared properties of metallic mesh and its complementary structure. Infrared Phys. 7, 37–55.",
  url: "https://doi.org/10.1016/0020-0891(67)90028-0",
};

export const polarization: CalculatorEntry[] = [
  {
    slug: "birefringence",
    title: "Birefringence & Retardation",
    description: "Phase retardation from crystal birefringence, thickness, and wavelength.",
    tier: "exact",
    modelNote: "Γ = 2πΔn·d/λ at normal incidence on a plate with its optic axis in the faces; Δn(λ) from published Sellmeier fits, or constant. Not modelled: tilt, temperature, reflections.",
    references: [hechtRetarders, bornWolfCrystals, ...crystalData],
  },
  {
    slug: "birefringence-imaging",
    title: "Birefringence Imaging",
    description: "Simulate quantitative birefringence imaging with polarizer/analyzer rotation and compensators. Visualize stress-induced birefringence patterns.",
    knownIssue: "The crossed-polarizer default puts the sample axis along the polarizer, so the output is always dark; the axis labelled in waves plots half-waves, and the sensitivity is not dI/dδ.",
  },
  {
    slug: "birefringent-polarizer",
    title: "Birefringent Polarizer Design",
    description: "Compare Glan-Taylor, Wollaston, Rochon and Sénarmont prism polarizers: exact beam deviations and the Glan field of view from crystal dispersion data.",
    tier: "exact",
    modelNote: "Normal incidence on two-wedge splitters: tangential wave vector kept at each face, e waves on the index ellipsoid; Glan field from total reflection at the gap. Not modelled: off-axis rays in splitters, losses.",
    references: [bornWolfCrystals, shurcliffBirefringence, archardTaylor1948, ...crystalData],
  },
  {
    slug: "brewster-polarizer",
    title: "Brewster-Angle Polarizer",
    description: "Design pile-of-plates polarizers at Brewster's angle: transmittance and degree of polarization of m glass plates, with the multiple reflections between surfaces.",
    heading: "Brewster Polarizer Design",
    tier: "exact",
    modelNote: "Lossless plane-parallel plates in air, Fresnel reflectance per surface, multiple reflections added in power: T = (1 − r)/(1 + (2m − 1)r). Not modelled: absorption, interference, beam offset.",
    references: [goldsteinPlates, shurcliffReflection, bornWolfFresnel],
  },
  {
    slug: "circular-dichroism",
    title: "Circular Dichroism",
    description: "Calculate CD parameters: A, , molar ellipticity, and g-factor from absorbance of left and right circularly polarized light.",
    lede: "Calculate CD parameters: ΔA, Δε, molar ellipticity, and g-factor from absorbance of left and right circularly polarized light.",
    knownIssue: "The secondary-structure percentages are fixed numbers that ignore the inputs, the mean-residue ellipticity repeats the molar ellipticity, and the formula shown for θ has a stray division by 2.",
  },
  {
    slug: "conoscopic",
    title: "Conoscopic Observation",
    description: "Simulate conoscopic interference figures (isochromates and isogyres) for uniaxial and biaxial crystals between crossed polarizers.",
    knownIssue: "The retardation uses the angle in air instead of the angle inside the crystal, so it is about 2.4 times too large; an NA above 1 gives NaN, and the biaxial 2V is the obtuse angle.",
  },
  {
    slug: "degree-polarization",
    title: "Degree of Polarization",
    description: "Calculate DoP from Stokes parameters, decompose into polarized and unpolarized components.",
    tier: "exact",
    modelNote: "DOP = √(S₁² + S₂² + S₃²)/S₀, ψ = ½ atan2(S₂, S₁), χ = ½ asin(S₃/I_p) for physical vectors. Spectral mode: a fixed-Δn retarder at 45°, light flat in wavelength, Stokes vectors averaged over the band.",
    references: [goldsteinStokes],
  },
  {
    slug: "depolarization",
    title: "Depolarization",
    description: "Calculate depolarization effects via Mueller matrix model or spectral averaging.",
    knownIssue: "The spectral mode samples an 83-wave plate with 50 points, so its degree of polarization can be 20 times too high; the Unpolarized preset is 99.9 % polarized and the spectral controls are hidden.",
  },
  {
    slug: "dichroic-polarizer",
    title: "Dichroic Polarizer",
    description: "Model absorbing dichroic polarizers from the complex index of each principal axis: principal transmittances, extinction ratio and crossed-pair leakage.",
    tier: "exact",
    modelNote: "Slab at normal incidence, N = n − iκ per principal axis, face reflectance including κ, multiple reflections added in power; ratios from logs. Not modelled: dispersion, scattering, oblique light.",
    references: [shurcliffParameters, shurcliffDichroic, macleodBasic, bornWolfFresnel],
  },
  {
    slug: "double-refraction",
    title: "Double Refraction (Birefringence)",
    description: "Calculate ordinary and extraordinary ray paths, walk-off angle, lateral separation, and retardation in uniaxial crystals.",
    tier: "exact",
    modelNote: "Plane waves into a lossless uniaxial plate, optic axis in the plane of incidence: e wave on the index ellipsoid, ray along its normal, Γ = k₀d(k_z,e − k_z,o). Not modelled: reflections, optical activity.",
    references: [bornWolfCrystals, veiras2010, ...crystalData],
  },
  {
    slug: "fresnel-polarization",
    title: "Fresnel Polarization Calculator",
    description: "Compute Fresnel reflection and transmission coefficients, their phases, and the Brewster and critical angles at an interface, including absorbing media and total internal reflection.",
    lede: "Fresnel reflection and transmission coefficients, their phases, and the Brewster and critical angles at an interface, including absorbing media and total internal reflection. r_p = −r_s at normal incidence (Born & Wolf; the thin-film pages use Macleod's opposite sign).",
    keywords: ["Fresnel Equations"],
    tier: "exact",
    modelNote: "Plane wave at a flat interface from a lossless medium onto N₂ = n₂ − iκ₂; complex coefficients in total reflection; time factor e^i(ωt − kz), r_p = −r_s at normal incidence. Not modelled: films, roughness.",
    references: [bornWolfFresnel, goldsteinFresnel],
  },
  {
    slug: "glans-prism",
    title: "Glan Prism Polarizer Design",
    description: "Design Glan-Taylor, Glan-Foucault and Glan-Thompson prism polarizers: the field of view from total internal reflection of the o and e rays, with crystal dispersion.",
    tier: "exact",
    modelNote: "Plane waves in the hypotenuse's plane of incidence; tangential wave vector kept, total reflection when k_t ≥ n_gap; Sellmeier indices. Not modelled: out-of-plane rays, gap interference, losses.",
    references: [bornWolfCrystals, bornWolfTir, archardTaylor1948, shurcliffBirefringence, ...crystalData],
  },
  {
    slug: "jones-calculus",
    title: "Jones Calculus",
    description: "Chain Jones matrices for polarizers, waveplates, and rotators. Up to 5 elements.",
    tier: "exact",
    modelNote: "Ideal Jones matrices applied in turn, Goldstein convention: RCP = [1, i]/√2 with S₃ > 0, a retarder is diag(1, e^(−iΓ)) with its fast axis at 0°, a rotator by +θ turns counter-clockwise. Not modelled: losses.",
    references: [jones1941, goldsteinJones],
  },
  {
    slug: "jones-chain",
    title: "Jones Matrix Chain",
    description: "Chain Jones matrices to transform input polarization states and visualize the output ellipse.",
    tier: "exact",
    modelNote: "Ideal polarizers and waveplates as Jones matrices, element 1 first, on unit-intensity inputs. Goldstein convention: RCP = [1, i]/√2 and S₃ > 0 is right-handed. Not modelled: losses, partial polarization.",
    references: [jones1941, goldsteinJones],
  },
  {
    slug: "liquid-crystal-polarizer",
    title: "Liquid Crystal Polarizer",
    description: "Model transmission through twisted nematic (TN), super-twisted nematic (STN), vertically aligned (VA), and electrically controlled birefringence (ECB) LC cells.",
    tier: "textbook",
    modelNote: "Uniformly twisted layer in the cell plane (Jones matrix, Gooch-Tarry), or a uniformly tilted VA layer; ideal polarizers, normal incidence. Not modelled: pretilt, field-driven director profile, Δn dispersion.",
    references: [goochTarry, yehGu, bornWolfCrystals],
  },
  {
    slug: "microscope-polarizer",
    title: "Microscope Polarizer Calculator",
    description: "Analyze polarization effects in microscopy: extinction, retardance sensitivity, NA degradation, and Michel-Lévy colors.",
    knownIssue: "The transmission against analyzer angle stays at 0.5 instead of falling to the extinction minimum; the loss of extinction with NA is an unsourced curve, and the analyzer and condenser inputs do nothing.",
  },
  {
    slug: "mueller-matrix",
    title: "Mueller Matrix Calculator",
    description: "Chain optical elements using Mueller matrices and compute output Stokes vector.",
    tier: "exact",
    modelNote: "Ideal Mueller matrices chained in the order the light meets them; the rotator turns +45° counter-clockwise. Inputs need √(S₁² + S₂² + S₃²) ≤ S₀. Not modelled: real extinction ratios or retardance errors.",
    references: [goldsteinMueller],
  },
  {
    slug: "mueller-polarimetry",
    title: "Mueller Polarimetry",
    description: "Build optical systems using Mueller matrices and analyze polarization transformations.",
    tier: "exact",
    modelNote: "Ideal polarizer, retarder, rotator and depolarizer diag(1, d, d, d) with d = 1 − p/100, element 1 first, Goldstein signs; then an ideal analyzer, I = ½(S₀ + S₁ cos 2θ + S₂ sin 2θ).",
    references: [goldsteinMueller, cloude],
  },
  {
    slug: "optical-activity",
    title: "Optical Activity",
    description: "Calculate optical rotation from specific rotation, concentration, and path length with wavelength/temperature corrections.",
  },
  {
    slug: "orthoconoscopic",
    title: "Orthoscopic Observation",
    description: "Model orthoscopic observation of birefringent samples with rotating stage. Calculate intensity vs rotation angle and interference colors.",
  },
  {
    slug: "poincare-sphere",
    title: "Poincaré Sphere",
    description: "Interactive visualization of polarization states on the Poincaré sphere.",
    tier: "exact",
    modelNote: "A fully polarized state from azimuth ψ and ellipticity χ: S = I(1, cos 2χ cos 2ψ, cos 2χ sin 2ψ, sin 2χ), with Goldstein's Jones vector. χ > 0 is right-handed, clockwise as seen by the receiver.",
    references: [goldsteinStokes, collett],
  },
  {
    slug: "polarimetry",
    title: "Polarimetry Basics",
    description: "Explore Stokes parameters, Poincaré sphere representation, and analyzer measurements for polarization state characterization.",
    tier: "exact",
    modelNote: "Stokes analysis of a physical vector (DOP, DOLP, DOCP, ψ, χ) and an ideal linear analyzer, I(θ) = ½(S₀ + S₁ cos 2θ + S₂ sin 2θ). Not modelled: analyzer extinction, measurement noise.",
    references: [goldsteinStokes, collett],
  },
  {
    slug: "polarization-scrambling",
    title: "Polarization Scrambling",
    description: "Simulate polarization scrambling: how randomizing polarization state reduces residual polarization.",
    knownIssue: "The scrambler only rotates about S3, so circular light is never scrambled; the elliptical input is partly unpolarized, and the residual-against-segments curve uses the wrong segment counts.",
  },
  {
    slug: "polarizer-extinction",
    title: "Polarizer Extinction Ratio",
    description: "Analyze extinction ratio, Malus's law with imperfect polarizers, and cascaded extinction performance.",
    tier: "exact",
    modelNote: "Ideal diattenuators: linearly polarized light at θ to the pass axis gives T∥cos²θ + T⊥sin²θ; aligned polarizers in series multiply both. Not modelled: depolarization, misalignment, reflections.",
    references: [goldsteinMueller, shurcliffParameters],
  },
  {
    slug: "polarizer-types",
    title: "Polarizer Types Comparison",
    description: "Compare extinction ratio, transmission, damage threshold, and other specs across common polarizer types.",
  },
  {
    slug: "polarizing-beamsplitter",
    title: "Polarizing Beamsplitter (PBS) Design",
    description: "Design a MacNeille polarizing beamsplitter cube: a quarter-wave high/low-index stack at Brewster's angle between glass prisms, with its extinction against wavelength and angle.",
    tier: "exact",
    modelNote: "(HL)ᴺH quarter-wave stack between glass by the characteristic-matrix method: coherent, lossless, constant indices. Not modelled: the cube's outer faces, dispersion, absorption.",
    references: [macNeille1946, macleodTilted, macleodBasic],
  },
  {
    slug: "polymer-polarizer",
    title: "Polymer (Sheet) Polarizer",
    description: "Model iodine-PVA sheet polarizers (H-sheet type): principal transmittances k₁ and k₂, extinction ratio and efficiency from the film's absorption, dichroic ratio and thickness.",
    tier: "exact",
    modelNote: "Homogeneous film at one wavelength: Beer–Lambert absorption per axis (α∥ = R_d α⊥), face reflections, multiple reflections added in power. Not modelled: spectra, scattering, protective layers.",
    references: [shurcliffParameters, shurcliffDichroic, macleodBasic],
  },
  {
    slug: "retarder",
    title: "Waveplate / Retarder",
    description: "Polarization state transformation by a birefringent waveplate with variable retardance and fast-axis orientation.",
    tier: "exact",
    modelNote: "Ideal lossless linear retarder R(−θ)·diag(1, e^(−iΓ))·R(θ) on linearly polarized light, Goldstein convention (S₃ > 0 is right-handed). Not modelled: dispersion of Γ, reflections, tilt.",
    references: [goldsteinJones, jones1941],
  },
  {
    slug: "retarder-types",
    title: "Retarder Types Comparison",
    description: "Compare zero-order, multi-order, compound, achromatic and Fresnel-rhomb retarders: retardance against wavelength and tilt.",
    tier: "exact",
    modelNote: "Ideal plates, Γ = 2πΔn·d/λ (tilted: k₀d(k_z,e − k_z,o)), Δn(λ) from Sellmeier fits; rhomb phase from total internal reflection in N-BK7. Not modelled: temperature, reflections, coatings.",
    references: [hechtRetarders, veiras2010, bornWolfTir, ghosh1999, dodge1984, schottBk7],
  },
  {
    slug: "stokes",
    title: "Stokes Parameters",
    description: "Analyze polarization state from Stokes vector components with Poincaré-sphere visualization.",
    lede: "Analyze polarization state from Stokes vector components with sliders, presets, and Poincaré sphere visualization.",
    keywords: ["poincare sphere", "polarization state", "stokes vector"],
    priority: 94,
    tier: "exact",
    modelNote: "DOP, DOLP, signed DOCP and the ellipse angles ψ = ½ atan2(U, Q), χ = ½ asin(V/I_p) of a physical Stokes vector, √(Q² + U² + V²) ≤ I. V > 0 is right-handed (Goldstein).",
    references: [goldsteinStokes, collett],
    related: [
      { href: "/polarization/retarder-types" },
      { href: "/polarization/retarder" },
      { href: "/polarization/waveplate-order" },
      { href: "/polarization/waveplate-thickness" },
    ],
  },
  {
    slug: "waveplate-order",
    title: "Waveplate Order",
    description: "Calculate waveplate order, retardation, and wavelength-dependent performance.",
    tier: "exact",
    modelNote: "Order and leftover fraction of |Δn|·d/λ; crossed-polarizer transmission sin²(Γ/2) with the plate at 45°; Δn(λ) from published Sellmeier fits. Not modelled: tilt, temperature, reflections.",
    references: [hechtRetarders, ...crystalData],
  },
  {
    slug: "waveplate-thickness",
    title: "Waveplate Thickness Calculator",
    description: "Calculate required crystal thickness for waveplates of any retardance order.",
    tier: "exact",
    modelNote: "d = (m + f)λ/|Δn| for a plate with its optic axis in the faces at normal incidence; Δn(λ) from published Sellmeier fits. Compound plates: axes crossed, d₁ − d₂. Not modelled: tilt, temperature.",
    references: [hechtRetarders, ...crystalData],
  },
  {
    slug: "wire-grid",
    title: "Wire Grid Polarizer Calculator",
    description: "Model wire-grid polarizers as a grating of metal strips much finer than the wavelength: transmission for E across and along the strips, reflection, ohmic loss and extinction ratio.",
    tier: "textbook",
    modelNote: "Quasi-static shunt sheet for p ≪ λ: Marcuvitz strip reactances (capacitive by Babinet), normal incidence, free-standing; loss from DC conductivity. Not modelled: strip height, substrate.",
    references: [marcuvitz, ulrich1967],
  },
];
