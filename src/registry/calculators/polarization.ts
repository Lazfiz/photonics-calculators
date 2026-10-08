import type { CalculatorEntry } from "../types";

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
  },
  {
    slug: "birefringent-polarizer",
    title: "Birefringent Polarizer Design",
    description: "Compare Glan, Wollaston, Rochon, and Senarmont polarizer designs using birefringent crystal prisms.",
  },
  {
    slug: "brewster-polarizer",
    title: "Brewster-Angle Polarizer",
    description: "Design Brewster-angle polarizers using tilted glass plates. At Brewster's angle, p-polarized light has zero reflection.",
    heading: "Brewster Polarizer Design",
    lede: "Design Brewster-angle polarizers using tilted glass plates. At Brewster&apos;s angle, p-polarized light has zero reflection.",
  },
  {
    slug: "circular-dichroism",
    title: "Circular Dichroism",
    description: "Calculate CD parameters: A, , molar ellipticity, and g-factor from absorbance of left and right circularly polarized light.",
    lede: "Calculate CD parameters: ΔA, Δε, molar ellipticity, and g-factor from absorbance of left and right circularly polarized light.",
  },
  {
    slug: "conoscopic",
    title: "Conoscopic Observation",
    description: "Simulate conoscopic interference figures (isochromates and isogyres) for uniaxial and biaxial crystals between crossed polarizers.",
  },
  {
    slug: "degree-polarization",
    title: "Degree of Polarization",
    description: "Calculate DoP from Stokes parameters, decompose into polarized and unpolarized components.",
  },
  {
    slug: "depolarization",
    title: "Depolarization",
    description: "Calculate depolarization effects via Mueller matrix model or spectral averaging.",
  },
  {
    slug: "dichroic-polarizer",
    title: "Dichroic Polarizer",
    description: "Model absorption-based dichroic polarizers using complex refractive indices. One polarization state is strongly absorbed while the other transmits.",
  },
  {
    slug: "double-refraction",
    title: "Double Refraction (Birefringence)",
    description: "Calculate ordinary and extraordinary ray paths, walk-off angle, lateral separation, and retardation in uniaxial crystals.",
  },
  {
    slug: "ellipsometry",
    title: "Ellipsometry",
    description: "Calculate Ψ, from Fresnel equations; model thin film interference in ellipsometry.",
    lede: "Calculate Ψ, Δ from Fresnel equations; model thin film interference in ellipsometry.",
  },
  {
    slug: "extinction-ratio",
    title: "Extinction Ratio",
    description: "Calculate polarizer extinction ratio, transmission, and cascaded performance.",
  },
  {
    slug: "fresnel-polarization",
    title: "Fresnel Polarization Calculator",
    description: "Compute Fresnel reflection/transmission coefficients and analyze polarization-dependent effects at dielectric interfaces.",
    lede: "Compute Fresnel reflection/transmission coefficients and analyze polarization-dependent effects at dielectric interfaces. Uses Born &amp; Wolf sign convention (r_p sign differs from thin-film Macleod convention).",
  },
  {
    slug: "glans-prism",
    title: "Glan Prism Polarizer Design",
    description: "Compare Glan-Taylor (air gap) and Glan-Thompson (cemented) polarizer designs based on calcite or other birefringent crystals.",
  },
  {
    slug: "jones-calculus",
    title: "Jones Calculus",
    description: "Chain Jones matrices for polarizers, waveplates, and rotators. Up to 5 elements.",
  },
  {
    slug: "jones-chain",
    title: "Jones Matrix Chain",
    description: "Chain Jones matrices to transform input polarization states and visualize the output ellipse.",
  },
  {
    slug: "liquid-crystal-polarizer",
    title: "Liquid Crystal Polarizer",
    description: "Model transmission through twisted nematic (TN), super-twisted nematic (STN), vertically aligned (VA), and electrically controlled birefringence (ECB) LC cells.",
  },
  {
    slug: "microscope-polarizer",
    title: "Microscope Polarizer Calculator",
    description: "Analyze polarization effects in microscopy: extinction, retardance sensitivity, NA degradation, and Michel-Lévy colors.",
  },
  {
    slug: "mueller-matrix",
    title: "Mueller Matrix Calculator",
    description: "Chain optical elements using Mueller matrices and compute output Stokes vector.",
  },
  {
    slug: "mueller-polarimetry",
    title: "Mueller Polarimetry",
    description: "Build optical systems using Mueller matrices and analyze polarization transformations.",
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
    slug: "pmd",
    title: "Polarization Mode Dispersion",
    description: "Calculate PMD-induced DGD, Maxwellian statistics, and system penalties.",
  },
  {
    slug: "poincare-sphere",
    title: "Poincaré Sphere",
    description: "Interactive visualization of polarization states on the Poincaré sphere.",
  },
  {
    slug: "polarimetry",
    title: "Polarimetry Basics",
    description: "Explore Stokes parameters, Poincaré sphere representation, and analyzer measurements for polarization state characterization.",
  },
  {
    slug: "polarization-scrambling",
    title: "Polarization Scrambling",
    description: "Simulate polarization scrambling: how randomizing polarization state reduces residual polarization.",
  },
  {
    slug: "polarizer-extinction",
    title: "Polarizer Extinction Ratio",
    description: "Analyze extinction ratio, Malus's law with imperfect polarizers, and cascaded extinction performance.",
    lede: "Analyze extinction ratio, Malus&apos;s law with imperfect polarizers, and cascaded extinction performance.",
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
  },
  {
    slug: "polymer-polarizer",
    title: "Polymer (Sheet) Polarizer",
    description: "Model iodine-doped PVA film polarizers (e.g., H-sheet). Absorption-based dichroic polarizers with selectable dichroic ratio and film thickness.",
  },
  {
    slug: "retarder",
    title: "Waveplate / Retarder",
    description: "Polarization state transformation by a birefringent waveplate with variable retardance and fast-axis orientation.",
  },
  {
    slug: "retarder-types",
    title: "Retarder Types Comparison",
    description: "Compare waveplate and retarder types: bandwidth, accuracy, temperature sensitivity.",
  },
  {
    slug: "stokes",
    title: "Stokes Parameters",
    description: "Analyze polarization state from Stokes vector components with Poincaré-sphere visualization.",
    lede: "Analyze polarization state from Stokes vector components with sliders, presets, and Poincaré sphere visualization.",
    keywords: ["poincare sphere", "polarization state", "stokes vector"],
    priority: 94,
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
  },
];
