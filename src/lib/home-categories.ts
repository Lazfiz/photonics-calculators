export type HomeCategory = {
  id: string;
  href: string;
  title: string;
  eyebrow: string;
  description: string;
  hoverDescription: string;
  count: number;
  accentFrom: string;
  accentTo: string;
  examples: string[];
};

export const homeCategories: HomeCategory[] = [
  {
    id: "laser-safety",
    href: "/laser-safety",
    title: "Laser Safety",
    eyebrow: "Hazards & limits",
    description: "NOHD, MPE, OD calculations and eye safety tools.",
    hoverDescription:
      "Estimate hazard distances, exposure limits, optical density, and classification thresholds for safety-critical laser scenarios.",
    count: 52,
    accentFrom: "#fb7185",
    accentTo: "#f59e0b",
    examples: ["MPE", "NOHD", "Optical density"],
  },
  {
    id: "fiber-optics",
    href: "/fiber-optics",
    title: "Fiber Optics",
    eyebrow: "Guided light",
    description: "Attenuation, coupling, dispersion, nonlinear thresholds.",
    hoverDescription:
      "Explore how guided modes, attenuation, dispersion, coupling, and nonlinear effects shape fiber systems.",
    count: 54,
    accentFrom: "#38bdf8",
    accentTo: "#2dd4bf",
    examples: ["Coupling efficiency", "Dispersion", "V-number"],
  },
  {
    id: "thin-film",
    href: "/thin-film",
    title: "Thin Film",
    eyebrow: "Interference stacks",
    description: "AR coatings, dichroics, reflectors, stress and deposition.",
    hoverDescription:
      "Design multilayer stacks, anti-reflection coatings, filters, and angle-sensitive interference behavior.",
    count: 51,
    accentFrom: "#a78bfa",
    accentTo: "#f472b6",
    examples: ["Single AR", "Bragg reflector", "Dichroic filter"],
  },
  {
    id: "imaging",
    href: "/imaging",
    title: "Imaging",
    eyebrow: "Focus & sensing",
    description: "Resolution, DOF, microscopy, OCT, focal geometry.",
    hoverDescription:
      "From PSF and depth of field to wavefront sensing and OCT coherence, model how optics form images.",
    count: 80,
    accentFrom: "#60a5fa",
    accentTo: "#22d3ee",
    examples: ["Resolution", "Optical coherence", "PSF"],
  },
  {
    id: "spectroscopy",
    href: "/spectroscopy",
    title: "Spectroscopy",
    eyebrow: "Wavelength & signal",
    description: "Resolution, FTIR, Raman, line broadening, calibration.",
    hoverDescription:
      "Resolve spectra, calibrate dispersive systems, estimate line broadening, and reason about signal-to-noise.",
    count: 60,
    accentFrom: "#c084fc",
    accentTo: "#f472b6",
    examples: ["FTIR resolution", "Raman shift", "Spectral calibration"],
  },
  {
    id: "detectors",
    href: "/detectors",
    title: "Detectors",
    eyebrow: "Light to signal",
    description: "Responsivity, NEP, dark noise, avalanche gain, SPADs.",
    hoverDescription:
      "Understand how photons become current, noise, gain, and readout limits across detector families.",
    count: 60,
    accentFrom: "#f59e0b",
    accentTo: "#f97316",
    examples: ["NEP", "Responsivity", "SPAD dead time"],
  },
  {
    id: "materials",
    href: "/materials",
    title: "Materials",
    eyebrow: "Indices & media",
    description: "Sellmeier, dispersion, absorption, thermal and nonlinear properties.",
    hoverDescription:
      "Compare optical materials, refractive index models, absorption bands, and thermal or nonlinear behavior.",
    count: 49,
    accentFrom: "#34d399",
    accentTo: "#22c55e",
    examples: ["Sellmeier", "Abbe number", "Transparency range"],
  },
  {
    id: "wave-optics",
    href: "/wave-optics",
    title: "Wave Optics",
    eyebrow: "Interference & propagation",
    description: "Gaussian beams, cavities, diffraction, combs, nonlinear propagation.",
    hoverDescription:
      "Follow phase, coherence, cavity stability, diffraction, and ultrafast propagation through wave-optics tools.",
    count: 52,
    accentFrom: "#818cf8",
    accentTo: "#38bdf8",
    examples: ["Gaussian beam", "ABCD matrix", "Interferometer"],
  },
  {
    id: "polarization",
    href: "/polarization",
    title: "Polarization",
    eyebrow: "Vector states",
    description: "Jones, Stokes, retarders, birefringence and PMD.",
    hoverDescription:
      "Model polarization state evolution, retarders, Mueller/Jones formalisms, and birefringent systems.",
    count: 36,
    accentFrom: "#f472b6",
    accentTo: "#fb7185",
    examples: ["Jones calculus", "Poincaré sphere", "Waveplate thickness"],
  },
  {
    id: "free-space-comms",
    href: "/free-space-comms",
    title: "Free-Space Comms",
    eyebrow: "Links through air",
    description: "Pointing loss, BER, scintillation, weather attenuation.",
    hoverDescription:
      "Estimate atmospheric penalties, pointing sensitivity, channel capacity, and link margins for optical links.",
    count: 30,
    accentFrom: "#22d3ee",
    accentTo: "#a78bfa",
    examples: ["Link budget", "Pointing loss", "Scintillation"],
  },
];

export const featuredHeroCategoryIds = ["spectroscopy", "imaging", "thin-film"] as const;

export const featuredHeroCategories = homeCategories.filter((category) =>
  featuredHeroCategoryIds.includes(category.id as (typeof featuredHeroCategoryIds)[number])
);

export const totalCalculatorCount = homeCategories.reduce(
  (sum, category) => sum + category.count,
  0
);
