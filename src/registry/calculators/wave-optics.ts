import type { CalculatorEntry } from "../types";

export const waveOptics: CalculatorEntry[] = [
  {
    slug: "abcd-matrix",
    title: "ABCD Matrix Calculator",
    description: "Build an optical system from sequential elements and compute the ray transfer matrix.",
  },
  {
    slug: "attosecond-pulse",
    title: "Attosecond Pulse Generation",
    description: "High-harmonic generation and isolated attosecond pulse parameters.",
  },
  {
    slug: "beam-waist-matching",
    title: "Beam Waist Matching",
    description: "Find the optimal lens for coupling one Gaussian mode into another.",
  },
  {
    slug: "bessel-beam",
    title: "Bessel Beam Calculator",
    description: "Non-diffracting beam profiles and propagation.",
  },
  {
    slug: "cavity-dumped",
    title: "Cavity-Dumped Laser",
    description: "Energy extraction from a laser cavity using fast Q-switching or intracavity modulation.",
  },
  {
    slug: "cavity-mode-spacing",
    title: "Cavity Mode Spacing",
    description: "Axial and transverse mode structure of optical resonators.",
  },
  {
    slug: "cavity-stability",
    title: "Cavity Stability Diagram",
    description: "Two-mirror cavity stability: g = 1 - L/R, g = 1 - L/R. Stable when 0 ≤ gg ≤ 1.",
    lede: "Two-mirror cavity stability: g₁ = 1 - L/R₁, g₂ = 1 - L/R₂. Stable when 0 ≤ g₁g₂ ≤ 1.",
  },
  {
    slug: "cep-stabilization",
    title: "Carrier-Envelope Phase (CEP)",
    description: "CEP offset effects on few-cycle pulse electric field.",
  },
  {
    slug: "chirped-pulse",
    title: "Chirped Pulse Amplification (CPA)",
    description: "Stretch, amplify, compress — bypassing damage thresholds.",
  },
  {
    slug: "coupled-mode",
    title: "Coupled Mode Theory",
    description: "Power exchange between two coupled waveguides.",
  },
  {
    slug: "difference-frequency",
    title: "Difference Frequency Generation (DFG)",
    description: "Downconversion via χ⁽²⁾: p − s i for mid-IR generation.",
    lede: "Downconversion via χ⁽²⁾: ωp − ωs → ωi for mid-IR generation.",
  },
  {
    slug: "diffraction-integral",
    title: "Diffraction Integral Calculator",
    description: "Fresnel/Kirchhoff diffraction patterns.",
  },
  {
    slug: "diode-laser-resonator",
    title: "Diode Laser Resonator",
    description: "Threshold gain and current, differential efficiency and far-field divergence of a Fabry–Pérot diode laser from cavity length and facet reflectivity.",
  },
  {
    slug: "dye-laser-resonator",
    title: "Dye Laser Resonator",
    description: "Cavity stability, beam waist, small-signal and threshold gain, triplet loss versus flow speed and output power of a Rhodamine or Coumarin dye laser.",
  },
  {
    slug: "etalon-finesse",
    title: "Etalon / Fabry-Pérot Analysis",
    description: "Detailed etalon transmission, finesse, and spectral properties.",
  },
  {
    slug: "fiber-laser-resonator",
    title: "Fiber Laser Resonator",
    description: "V-number, mode field diameter, threshold gain and slope efficiency of a fiber laser cavity from fiber length, core, NA and mirror reflectivities.",
  },
  {
    slug: "filamentation",
    title: "Filamentation Dynamics",
    description: "Laser filamentation — balance of Kerr self-focusing, plasma defocusing, and diffraction.",
  },
  {
    slug: "four-wave-mixing",
    title: "Four-Wave Mixing (FWM)",
    description: "Degenerate FWM with energy conservation 2p = s + i in fibers and waveguides.",
    lede: "Degenerate FWM with energy conservation 2ωp = ωs + ωi in fibers and waveguides.",
  },
  {
    slug: "free-electron-laser",
    title: "Free-Electron Laser",
    description: "FEL resonance wavelength, Pierce parameter ρ, 1D gain length and saturation power from electron energy, undulator period, K and peak current.",
  },
  {
    slug: "gas-laser-resonator",
    title: "Gas Laser Resonator",
    description: "Stability g₁g₂, beam waist, Fresnel number, optimal output coupling and output power of a HeNe or CO₂ laser from tube size and mirror radii.",
  },
  {
    slug: "gaussian-beam",
    title: "Gaussian Beam Propagation",
    description: "Explore how wavelength and waist size shape Rayleigh range, divergence, and Gaussian beam envelope.",
    lede: "Explore how wavelength and waist size shape Rayleigh range, divergence, and beam envelope.",
    keywords: ["rayleigh range", "beam waist", "divergence"],
    priority: 100,
    related: [
      {
        href: "/wave-optics/m2-factor",
        note: "Compare ideal Gaussian behavior with real beams.",
      },
      { href: "/wave-optics/gouy-phase", note: "Phase evolution through focus." },
      {
        href: "/wave-optics/mode-matching",
        note: "Connect Gaussian beams to cavity/fiber coupling.",
      },
    ],
  },
  {
    slug: "gires-tournois",
    title: "Gires-Tournois Interferometer",
    description: "Dispersion control via a GTI — constant reflectivity with tunable group delay dispersion.",
  },
  {
    slug: "gouy-phase",
    title: "Gouy Phase Shift",
    description: "Gouy phase ψ(z) = arctan(z/zᵣ) accumulated by Gaussian beam. Total phase shift through focus.",
    lede: "Gouy phase ψ(z) = arctan(z/zᵣ) accumulated by Gaussian beam. Total π phase shift through focus.",
  },
  {
    slug: "hermite-gaussian",
    title: "Hermite-Gaussian Modes (TEMmn)",
    description: "Rectangular higher-order Gaussian beam modes.",
  },
  {
    slug: "injection-locking",
    title: "Injection Locking",
    description: "Phase-locking a slave laser to a master laser through optical injection.",
  },
  {
    slug: "interferometer",
    title: "Interferometer Visibility",
    description: "Michelson / Mach-Zehnder interferometer intensity vs path difference. Visibility limited by mirror reflectivity.",
  },
  {
    slug: "kerr-lens",
    title: "Kerr Lens Mode Locking",
    description: "Self-focusing and Kerr-lens effect in nonlinear media for ultrashort pulse generation.",
  },
  {
    slug: "laguerre-gaussian",
    title: "Laguerre-Gaussian Modes",
    description: "Donut modes with orbital angular momentum.",
  },
  {
    slug: "m2-factor",
    title: "Beam Quality Factor M²",
    description: "M² = ( w₀ )/. M² = 1 for ideal Gaussian, higher for multimode beams.",
    lede: "M² = (π w₀ θ)/λ. M² = 1 for ideal Gaussian, higher for multimode beams.",
    keywords: ["Beam Quality M² Measurement"],
  },
  {
    slug: "mode-locked-laser",
    title: "Mode-Locked Laser",
    description: "Ultrashort pulse generation through passive or active mode-locking.",
  },
  {
    slug: "mode-matching",
    title: "Mode Matching",
    description: "Find the optimal lens for coupling one Gaussian beam mode into another.",
  },
  {
    slug: "optical-frequency-comb",
    title: "Optical Frequency Comb",
    description: "Precision spectroscopy and metrology using a train of equally spaced narrow spectral lines.",
  },
  {
    slug: "optical-parametric-amplifier",
    title: "Optical Parametric Amplifier",
    description: "Parametric power gain of an OPA from pump intensity, d_eff, refractive indices and crystal length, versus pump power, length and signal wavelength.",
    keywords: ["OPA / OPO Design"],
  },
  {
    slug: "optical-parametric-oscillator",
    title: "Optical Parametric Oscillator",
    description: "Parametric gain, walk-off-limited interaction length and singly-resonant OPO threshold from pump wavelength, d_eff, beam radius and cavity loss.",
  },
  {
    slug: "optical-waveguide",
    title: "Optical Waveguide Modes",
    description: "Slab waveguide mode analysis: V-number, NA, and effective index.",
  },
  {
    slug: "parametric-amplification",
    title: "Parametric Amplification",
    description: "Optical parametric amplification (OPA) gain and bandwidth in χ⁽²⁾ nonlinear crystals.",
  },
  {
    slug: "photonic-bandgap",
    title: "Photonic Bandgap",
    description: "1D photonic crystal band structure and reflectivity.",
  },
  {
    slug: "pulse-compression",
    title: "Pulse Compression",
    description: "Transform-limited pulse compression via chirp compensation.",
  },
  {
    slug: "q-switched-laser",
    title: "Q-Switched Laser",
    description: "High-energy pulse generation through repetitive Q-switching of a laser cavity.",
  },
  {
    slug: "ring-cavity",
    title: "Ring Resonator Design",
    description: "Ring cavity stability, modes, and spectral analysis.",
  },
  {
    slug: "self-phase-modulation",
    title: "Self-Phase Modulation (SPM)",
    description: "Intensity-dependent phase shift and spectral broadening from the optical Kerr effect.",
  },
  {
    slug: "slab-laser",
    title: "Zigzag Slab Laser",
    description: "Bounce angle, temperature rise, optical path difference per bounce and slope efficiency of a zigzag slab laser from slab geometry and thermal load.",
  },
  {
    slug: "slow-light",
    title: "Slow Light Structures",
    description: "Group velocity reduction in photonic crystals and EIT media.",
  },
  {
    slug: "solid-state-laser-resonator",
    title: "Solid State Laser Resonator",
    description: "Two-mirror resonator stability g₁g₂, beam waist and radius along the cavity, and slope efficiency and output power of a solid-state laser.",
  },
  {
    slug: "soliton",
    title: "Soliton Propagation",
    description: "Fundamental and higher-order soliton dynamics via split-step Fourier simulation.",
  },
  {
    slug: "spatial-filter",
    title: "Spatial Filter Pinhole Sizing",
    description: "Calculate optimal pinhole diameter for spatial filtering.",
  },
  {
    slug: "sum-frequency",
    title: "Sum Frequency Generation (SFG)",
    description: "Upconversion via χ⁽²⁾: 1 + 2 3 with phase matching.",
    lede: "Upconversion via χ⁽²⁾: ω1 + ω2 → ω3 with phase matching.",
  },
  {
    slug: "supercontinuum",
    title: "Supercontinuum Generation",
    description: "Broadband SC generation in photonic crystal fibers via soliton fission, SPM, and dispersive wave generation.",
  },
  {
    slug: "thin-disk-laser",
    title: "Yb Thin-Disk Laser",
    description: "Multipass pump absorption, threshold, slope efficiency, temperature rise and thermal lens of a Yb thin-disk laser from disk thickness and doping.",
  },
];
