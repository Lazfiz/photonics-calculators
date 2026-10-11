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

export const polarization: CalculatorEntry[] = [
  {
    slug: "birefringence",
    title: "Birefringence & Retardation",
    description: "Phase retardation from crystal birefringence, thickness, and wavelength.",
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
    description: "Compare Glan, Wollaston, Rochon, and Senarmont polarizer designs using birefringent crystal prisms.",
    knownIssue: "The Glan field of view ignores total reflection of the e-ray (14.6° shown, about 5° real), the walk-off formula shown is not the one computed, and the rutile, YVO₄ and BBO presets have wrong indices.",
  },
  {
    slug: "brewster-polarizer",
    title: "Brewster-Angle Polarizer",
    description: "Design Brewster-angle polarizers using tilted glass plates. At Brewster's angle, p-polarized light has zero reflection.",
    heading: "Brewster Polarizer Design",
    knownIssue: "The reflectance chart uses the refraction angle where it needs its cosine (4.3 % at normal incidence shows as 16.8 %), and the plate stack ignores multiple reflections, which overstates the extinction.",
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
    description: "Model absorption-based dichroic polarizers using complex refractive indices. One polarization state is strongly absorbed while the other transmits.",
    knownIssue: "The default absorption index (k = 2) is metal-like, so both transmissions underflow to 0 % and the extinction ratio prints Infinity dB; the surface reflectance ignores k.",
  },
  {
    slug: "double-refraction",
    title: "Double Refraction (Birefringence)",
    description: "Calculate ordinary and extraordinary ray paths, walk-off angle, lateral separation, and retardation in uniaxial crystals.",
    knownIssue: "The angle of incidence is used as the angle to the optic axis, so the default shows no walk-off; the index jumps from n_e to n_o just off 0°, and the spectral chart plots half-waves as waves.",
  },
  {
    slug: "fresnel-polarization",
    title: "Fresnel Polarization Calculator",
    description: "Compute Fresnel reflection/transmission coefficients and analyze polarization-dependent effects at dielectric interfaces.",
    lede: "Compute Fresnel reflection/transmission coefficients and analyze polarization-dependent effects at dielectric interfaces. Uses Born & Wolf sign convention (r_p sign differs from thin-film Macleod convention).",
    keywords: ["Fresnel Equations"],
  },
  {
    slug: "glans-prism",
    title: "Glan Prism Polarizer Design",
    description: "Compare Glan-Taylor (air gap) and Glan-Thompson (cemented) polarizer designs based on calcite or other birefringent crystals.",
    knownIssue: "The Glan-Thompson mode returns NaN critical angles, the field of view shows a window where none exists (it takes an absolute value), and the wavelength input is not used.",
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
    knownIssue: "The twisted-nematic transmission is not the Gooch-Tarry result, the charts use a second formula (flat 99 % while the card shows 0.45 %), a twist of 0 gives NaN and the supertwisted formula has no source.",
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
  },
  {
    slug: "polarizer-types",
    title: "Polarizer Types Comparison",
    description: "Compare extinction ratio, transmission, damage threshold, and other specs across common polarizer types.",
  },
  {
    slug: "polarizing-beamsplitter",
    title: "Polarizing Beamsplitter (PBS) Design",
    description: "Design polarizing beamsplitter cubes and prisms based on birefringent crystals with air-gap TIR separation.",
    knownIssue: "This is not a cube-beamsplitter model: it checks total internal reflection in a calcite air-gap prism, mixes two angle conventions, fails at its own default cut and uses a Wollaston formula for the separation.",
  },
  {
    slug: "polymer-polarizer",
    title: "Polymer (Sheet) Polarizer",
    description: "Model iodine-doped PVA film polarizers (e.g., H-sheet). Absorption-based dichroic polarizers with selectable dichroic ratio and film thickness.",
    knownIssue: "The polarization efficiency has the wrong sign (−75 % at the defaults), the extinction ratio is defined three different ways on the page, and the presets give extinction ratios far below real sheet polarizers.",
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
    description: "Compare waveplate and retarder types: bandwidth, accuracy, temperature sensitivity.",
    knownIssue: "The achromatic and Fresnel-rhomb curves are random placeholder numbers, the zero-order curve is a 0.1 mm plate (562 % error at 550 nm), and the birefringence dispersion law is invented.",
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
  },
  {
    slug: "waveplate-thickness",
    title: "Waveplate Thickness Calculator",
    description: "Calculate required crystal thickness for waveplates of any retardance order.",
  },
  {
    slug: "wire-grid",
    title: "Wire Grid Polarizer Calculator",
    description: "Model wire grid polarizers — metallic wires on a substrate that reflect E∥ and transmit E⊥.",
    knownIssue: "The sheet-transmission formula gives more than 100 % transmission at the defaults (322 % for E parallel to the wires), the cards and charts use different models, and the period is not checked against λ.",
  },
];
