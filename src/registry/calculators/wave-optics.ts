import type { CalculatorEntry } from "../types";

export const waveOptics: CalculatorEntry[] = [
  {
    slug: "abcd-matrix",
    title: "ABCD Matrix Calculator",
    description: "Build an optical system from sequential elements and compute the ray transfer matrix.",
    tier: "textbook",
    modelNote: "Paraxial ray matrices with real ray angles, so a flat interface gives det = n₁/n₂. Thin lenses, unfolded mirrors and no aberrations; valid for small angles and heights.",
    references: [
      {
        citation: "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567.",
        url: "https://doi.org/10.1364/ao.5.001550",
      },
      { citation: "Gerrard A., Burch J. M. (1975). Introduction to Matrix Methods in Optics. Wiley." },
    ],
  },
  {
    slug: "attosecond-pulse",
    title: "Attosecond Pulse Generation",
    description: "High-harmonic generation and isolated attosecond pulse parameters.",
    knownIssue: "The transform-limited pulse duration is about 15 times too short (2.4 as instead of about 35 as at default inputs), and the plotted spectrum ignores the computed cutoff and the pulse duration input.",
  },
  {
    slug: "bessel-beam",
    title: "Bessel Beam Calculator",
    description: "Core radius, FWHM and non-diffracting range of a Bessel beam from its cone angle and input beam radius, with J₀ and J₁ profiles.",
    keywords: ["axicon", "non-diffracting beam", "J0 beam", "cone angle"],
    tier: "textbook",
    modelNote: "Ideal scalar Bessel beam from plane waves on a cone. The range z_max = R/tan θ is the geometric estimate for an input of radius R; the core intensity along z of a real axicon beam is not modelled.",
    references: [
      {
        citation: "Durnin J., Miceli J. J., Eberly J. H. (1987). Diffraction-free beams. Phys. Rev. Lett. 58, 1499–1501.",
        url: "https://doi.org/10.1103/physrevlett.58.1499",
      },
      {
        citation: "McGloin D., Dholakia K. (2005). Bessel beams: diffraction in a new light. Contemp. Phys. 46, 15–28.",
        url: "https://doi.org/10.1080/0010751042000275259",
      },
    ],
  },
  {
    slug: "cavity-dumped",
    title: "Cavity-Dumped Laser",
    description: "Energy extraction from a laser cavity using fast Q-switching or intracavity modulation.",
    knownIssue: "The default 80 MHz dump rate is close to the 100 MHz round-trip rate of a 1.5 m cavity, which cavity dumping cannot reach, so the 800 W average power is unrealistic.",
  },
  {
    slug: "cavity-mode-spacing",
    title: "Cavity Mode Spacing and Stability",
    description: "Two-mirror resonator: g-parameters and stability diagram, free spectral range, transverse mode spacing, TEM₀₀ waist size and position, and spot sizes on the mirrors.",
    keywords: ["Cavity Stability Diagram", "g-parameters", "resonator stability", "transverse mode spacing", "Gouy phase", "free spectral range"],
    tier: "textbook",
    modelNote: "Paraxial Gaussian modes of two spherical mirrors (Kogelnik–Li), with a medium of index n filling the cavity. The transverse spacing takes the Gouy phase on the branch set by the sign of g, so cavities with g < 0 space their modes by more than FSR/2. Aperture losses and mirror tilt are ignored.",
    references: [
      {
        citation: "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567.",
        url: "https://doi.org/10.1364/ao.5.001550",
      },
      { citation: "Siegman A. E. (1986). Lasers, ch. 19. University Science Books." },
    ],
  },
  {
    slug: "cep-stabilization",
    title: "Carrier-Envelope Phase (CEP)",
    description: "CEP offset effects on few-cycle pulse electric field.",
    knownIssue: "The phase-slip formula shown is wrong and the page computes no CEP stabilization quantity such as the offset frequency or phase slip per pulse. Only the period, cycle count and bandwidth are valid.",
  },
  {
    slug: "chirped-pulse",
    title: "Chirped Pulse Amplification (CPA)",
    description: "Stretch, amplify, compress — bypassing damage thresholds.",
    knownIssue: "Recompressed duration is fixed at 1.1 times the input, the grating line density has no effect, and the recompressed pulse plots as a single point. No stretcher or compressor dispersion is calculated.",
  },
  {
    slug: "coupled-mode",
    title: "Coupled Mode Theory",
    description: "Power exchange between two coupled waveguides.",
  },
  {
    slug: "difference-frequency",
    title: "Difference Frequency Generation (DFG)",
    description: "Downconversion via χ⁽²⁾: ωp − ωs → ωi for mid-IR generation.",
    knownIssue: "Beam radius (40 µm) and refractive index (2.2) are fixed and hidden, and when the signal wavelength is shorter than the pump the page still shows an efficiency and power for an invalid process.",
  },
  {
    slug: "diffraction-integral",
    title: "Diffraction Integral Calculator",
    description: "Fresnel diffraction pattern of a circular aperture or slit at any distance, with the Fresnel number, on-axis intensity and the far-field Fraunhofer limit.",
    keywords: ["fresnel diffraction", "fresnel number", "fraunhofer diffraction", "fresnel integrals", "circular aperture"],
    tier: "textbook",
    modelNote: "Scalar Fresnel (paraxial) diffraction of a plane wave, intensities relative to the incident one. Valid for z ≫ a and small angles; the circular aperture is computed up to N_F = 20.",
    references: [
      { citation: "Goodman J. W. (2005). Introduction to Fourier Optics, 3rd ed. Roberts & Company, ch. 4." },
      {
        citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed. Cambridge University Press, ch. 8.",
        url: "https://doi.org/10.1017/cbo9781139644181",
      },
    ],
  },
  {
    slug: "diode-laser-resonator",
    title: "Diode Laser Resonator",
    description: "Threshold gain and current, differential efficiency and far-field divergence of a Fabry–Pérot diode laser from cavity length and facet reflectivity.",
    knownIssue: "Threshold current shows 0.0 mA because the formula uses modal gain in place of carrier density, and the fast-axis divergence is about 4 degrees instead of the usual 30 to 40.",
  },
  {
    slug: "dye-laser-resonator",
    title: "Dye Laser Resonator",
    description: "CW dye jet laser in a two-mirror cavity: TEM₀₀ waist, triplet loss versus flow speed, threshold pump power, small-signal gain, output power and slope efficiency.",
    keywords: ["rhodamine 6G", "dye jet", "triplet absorption", "intersystem crossing", "CW dye laser threshold", "Rigrod"],
    tier: "textbook",
    modelNote: "Four-level dye with the pump fully absorbed in a jet at the cavity waist; the Gaussian pump and mode overlap over π(w₀² + wₚ²)/2. Triplets reduce the gain cross-section to σₑ − σ_T k_ST τ_eff, with τ_eff set by the triplet lifetime and the flow transit across the pump spot. Output from Rigrod's homogeneous plane-wave model. The default dye constants are example values of the Rhodamine 6G order, not measured data: enter your dye's values. Ground-state reabsorption and the gain spectrum are ignored.",
    references: [
      { citation: "Peterson O. G., Tuccio S. A., Snavely B. B. (1970). CW operation of an organic dye solution laser. Appl. Phys. Lett. 17, 245–247.", url: "https://doi.org/10.1063/1.1653384" },
      { citation: "Webb J. P., McColgin W. C., Peterson O. G. et al. (1970). Intersystem crossing rate and triplet state lifetime for a lasing dye. J. Chem. Phys. 53, 4227–4229.", url: "https://doi.org/10.1063/1.1673926" },
      { citation: "Svelto O. (2010). Principles of Lasers, 5th ed., ch. 6–7. Springer.", url: "https://doi.org/10.1007/978-1-4419-1302-9" },
      { citation: "Rigrod W. W. (1965). Saturation effects in high-gain lasers. J. Appl. Phys. 36, 2487–2490.", url: "https://doi.org/10.1063/1.1714517" },
    ],
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
    knownIssue: "The threshold uses the signal saturation intensity with no pump absorption, and the default 10 µm core with NA 0.12 is multimode at 1064 nm (V = 3.5), outside the mode-field fit.",
  },
  {
    slug: "filamentation",
    title: "Filamentation Dynamics",
    description: "Laser filamentation — balance of Kerr self-focusing, plasma defocusing, and diffraction.",
    knownIssue: "Filament length and B-integral are rough guesses, a self-focusing distance is still shown below the critical power, and the beam-radius plot collapses at a different distance than the readout.",
  },
  {
    slug: "four-wave-mixing",
    title: "Four-Wave Mixing (FWM)",
    description: "Degenerate FWM with energy conservation 2ωp = ωs + ωi in fibers and waveguides.",
    knownIssue: "The idler power chart is 1000 times too high for the stated 1 mW seed, and the idler wavelength can come out negative when the signal is below half the pump wavelength.",
  },
  {
    slug: "free-electron-laser",
    title: "Free-Electron Laser",
    description: "FEL resonance wavelength, Pierce parameter ρ, 1D gain length and saturation power from electron energy, undulator period, K and peak current.",
    knownIssue: "The Pierce parameter ignores the transverse beam size, giving 1.4e-5 instead of about 6e-4 for LCLS-like inputs. The power growth plot is inverted and the energy spread input has no effect.",
  },
  {
    slug: "gas-laser-resonator",
    title: "Gas Laser Resonator",
    description: "Stability g₁g₂, TEM₀₀ waist and spot sizes against the bore, Fresnel number, threshold gain, output power and the optimum output coupler of a HeNe, Ar⁺ or CO₂ laser.",
    keywords: ["HeNe laser", "CO2 laser", "argon ion laser", "optimum output coupling", "Rigrod", "Fresnel number"],
    tier: "textbook",
    modelNote: "Kogelnik–Li TEM₀₀ mode; gain filling the whole mirror spacing; output and optimum coupler from Rigrod's homogeneous plane-wave model with the saturation power I_sat π⟨w²⟩/2 over the mode's mean-square radius. HeNe and Ar⁺ lines are Doppler (inhomogeneously) broadened, so the output is an estimate. The default g₀ = 0.15 /m and I_sat ≈ 25 W/cm² are values measured on one 3.2 mm-bore HeNe tube (Ng et al.); enter your tube's values for other lines. Bore clipping is shown but not added to the loss.",
    references: [
      { citation: "Rigrod W. W. (1965). Saturation effects in high-gain lasers. J. Appl. Phys. 36, 2487–2490.", url: "https://doi.org/10.1063/1.1714517" },
      { citation: "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567.", url: "https://doi.org/10.1364/ao.5.001550" },
      { citation: "Siegman A. E. (1986). Lasers, ch. 12 and 19. University Science Books." },
      { citation: "Ng E., Onodera T., Stansbury C., Zhang L. (2015). Light amplification and oscillation in the HeNe resonator. Stanford University course report.", url: "https://web.stanford.edu/~edwin98/HeNe.pdf" },
    ],
  },
  {
    slug: "gaussian-beam",
    title: "Gaussian Beam Propagation",
    description: "Rayleigh range, divergence, beam radius, wavefront curvature and Gouy phase of a Gaussian beam at any distance from its waist.",
    keywords: ["rayleigh range", "beam waist", "divergence", "Gouy Phase Shift", "wavefront curvature"],
    tier: "textbook",
    modelNote: "Paraxial TEM₀₀ beam with a 1/e² intensity radius, in air or vacuum: use the wavelength in the medium otherwise. Accurate while the divergence stays below about 0.1 rad.",
    references: [
      {
        citation: "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567.",
        url: "https://doi.org/10.1364/ao.5.001550",
      },
      {
        citation: "Feng S., Winful H. G. (2001). Physical origin of the Gouy phase shift. Opt. Lett. 26, 485–487.",
        url: "https://doi.org/10.1364/ol.26.000485",
      },
    ],
    priority: 100,
    related: [
      {
        href: "/wave-optics/m2-factor",
        note: "Compare ideal Gaussian behavior with real beams.",
      },
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
    tier: "exact",
    modelNote: "Lossless GTI: a layer of index n between a front reflector of reflectance R₁ and a 100 % back mirror, normal incidence, constant n and mirror phase. Real mirrors add loss, dispersion and a finite bandwidth.",
    references: [
      { citation: "Gires F., Tournois P. (1964). C. R. Acad. Sci. Paris 258, 6112. The lossless GTI phase." },
      {
        citation: "Kuhl J., Heppner J. (1986). Compression of femtosecond optical pulses with dielectric multilayer interferometers. IEEE J. Quantum Electron. 22, 182–185.",
        url: "https://doi.org/10.1109/jqe.1986.1072855",
      },
    ],
  },
  {
    slug: "hermite-gaussian",
    title: "Hermite-Gaussian and Laguerre-Gaussian Modes",
    description: "Intensity of TEMmn and LGpl modes at any distance, with second-moment radius, M², Gouy phase, peak intensity and orbital angular momentum.",
    keywords: ["TEMmn", "higher-order modes", "donut mode", "orbital angular momentum", "optical vortex"],
    tier: "textbook",
    modelNote: "Exact unit-power solutions of the paraxial wave equation, indices up to 10. Every mode shares the TEM₀₀ waist, Rayleigh range and w(z); the second-moment radius and M² follow from the indices.",
    references: [
      {
        citation: "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567.",
        url: "https://doi.org/10.1364/ao.5.001550",
      },
      {
        citation: "Carter W. H. (1980). Spot size and divergence for Hermite Gaussian beams of any order. Appl. Opt. 19, 1027.",
        url: "https://doi.org/10.1364/ao.19.001027",
      },
      {
        citation: "Phillips R. L., Andrews L. C. (1983). Spot size and divergence for Laguerre Gaussian beams of any order. Appl. Opt. 22, 643.",
        url: "https://doi.org/10.1364/ao.22.000643",
      },
      {
        citation: "Allen L., Beijersbergen M. W., Spreeuw R. J. C., Woerdman J. P. (1992). Orbital angular momentum of light and the transformation of Laguerre-Gaussian laser modes. Phys. Rev. A 45, 8185–8189.",
        url: "https://doi.org/10.1103/physreva.45.8185",
      },
    ],
  },
  {
    slug: "injection-locking",
    title: "Injection Locking",
    description: "Phase-locking a slave laser to a master laser through optical injection.",
    knownIssue: "The locking range is the entered bandwidth times the square root of the power ratio, with that bandwidth undefined and no diode-laser asymmetry from the linewidth enhancement factor.",
  },
  {
    slug: "interferometer",
    title: "Interferometer Visibility",
    description: "Michelson / Mach-Zehnder interferometer intensity vs path difference. Visibility limited by mirror reflectivity.",
    knownIssue: "Switching between Michelson and Mach-Zehnder or changing mirror R2 does not update the fringes, phase, visibility or plot until another input changes. The current-point marker lies outside the plot.",
  },
  {
    slug: "kerr-lens",
    title: "Kerr Lens Mode Locking",
    description: "Self-focusing and Kerr-lens effect in nonlinear media for ultrashort pulse generation.",
    knownIssue: "The Kerr focal length is about 3.5 times the parabolic thin-lens value, and the beam waist vs power plot uses an invented formula. At the 1 W default every result is negligible.",
  },
  {
    slug: "m2-factor",
    title: "Beam Quality Factor M²",
    description: "M² = (π w₀ θ)/λ. M² = 1 for ideal Gaussian, higher for multimode beams.",
    keywords: ["Beam Quality M² Measurement"],
    tier: "exact",
    modelNote: "M² from the second-moment waist radius and far-field half angle, as ISO 11146 defines it. The result is only as good as the widths: a 1/e² or knife-edge width of a non-Gaussian beam gives a different M².",
    references: [
      {
        citation: "Siegman A. E. (1990). New developments in laser resonators. Proc. SPIE 1224, 2.",
        url: "https://doi.org/10.1117/12.18425",
      },
      { citation: "ISO 11146-1:2021. Lasers and laser-related equipment: test methods for laser beam widths, divergence angles and beam propagation ratios, part 1." },
    ],
  },
  {
    slug: "mode-locked-laser",
    title: "Mode-Locked Laser",
    description: "Ultrashort pulse generation through passive or active mode-locking.",
    knownIssue: "Only the cavity length c/(2 f_rep) is calculated. Pulse duration and wavelength change only the plot, and no bandwidth, peak power or mode count is given.",
  },
  {
    slug: "mode-matching",
    title: "Mode Matching",
    description: "The single lens, and its position, that couples one Gaussian beam waist into another, plus the best coupling of a lens you already have.",
    keywords: ["Beam Waist Matching", "Gaussian beam coupling", "mode overlap", "fiber coupling lens"],
    tier: "textbook",
    modelNote: "Paraxial TEM₀₀ beams and a thin lens, closed-form solution. Coupling η is the exact overlap of the two Gaussian beams, including wavefront curvature; aberrations, tilt and lateral offset are ignored.",
    references: [
      {
        citation: "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567.",
        url: "https://doi.org/10.1364/ao.5.001550",
      },
      {
        citation: "Self S. A. (1983). Focusing of spherical Gaussian beams. Appl. Opt. 22, 658.",
        url: "https://doi.org/10.1364/ao.22.000658",
      },
      {
        citation: "Joyce W. B., DeLoach B. C. (1984). Alignment of Gaussian beams. Appl. Opt. 23, 4187.",
        url: "https://doi.org/10.1364/ao.23.004187",
      },
    ],
  },
  {
    slug: "optical-frequency-comb",
    title: "Optical Frequency Comb",
    description: "Precision spectroscopy and metrology using a train of equally spaced narrow spectral lines.",
    knownIssue: "The plot draws a smooth envelope instead of separate comb teeth and ignores the carrier-envelope offset frequency, and a very large Comb Lines value can freeze or crash the page.",
  },
  {
    slug: "optical-parametric-amplifier",
    title: "Optical Parametric Amplifier",
    description: "Parametric power gain of an OPA from pump intensity, d_eff, refractive indices and crystal length, versus pump power, length and signal wavelength.",
    knownIssue: "Gain assumes perfect phase matching at every signal wavelength, so the gain-versus-wavelength curve shows no phase-matching bandwidth; a signal at or below the pump wavelength gives NaN or Infinity.",
    keywords: ["OPA / OPO Design"],
  },
  {
    slug: "optical-parametric-oscillator",
    title: "Optical Parametric Oscillator",
    description: "Parametric gain, walk-off-limited interaction length and singly-resonant OPO threshold from pump wavelength, d_eff, beam radius and cavity loss.",
    tier: "textbook",
    modelNote: "Plane-wave estimate: perfect phase matching, no pump depletion, no focusing optimisation, idler not resonated. Walk-off enters only by capping the crystal length at the aperture length.",
    references: [
      {
        citation: "Boyd R. W. (2008). Nonlinear Optics, 3rd ed., §2.8 and §2.9. Academic Press. Parametric gain coefficient and singly resonant threshold.",
      },
      {
        citation: "Boyd G. D., Kleinman D. A. (1968). Parametric Interaction of Focused Gaussian Light Beams. J. Appl. Phys. 39, 3597–3639. Walk-off aperture length l_a = √π w/ρ.",
        url: "https://doi.org/10.1063/1.1656831",
      },
      {
        citation: "Myers L. E. et al. (1995). Quasi-phase-matched optical parametric oscillators in bulk periodically poled LiNbO₃. J. Opt. Soc. Am. B 12, 2102. Wavelength form of the gain coefficient, equal to Boyd's.",
        url: "https://doi.org/10.1364/josab.12.002102",
      },
    ],
  },
  {
    slug: "optical-waveguide",
    title: "Optical Waveguide Modes",
    description: "Slab waveguide mode analysis: V-number, NA, and effective index.",
    knownIssue: "The effective-index curve is not a slab-waveguide solution and overstates the fundamental-mode index, most at small V. A cladding index above the core index gives NaN instead of a no-guidance warning.",
  },
  {
    slug: "parametric-amplification",
    title: "Parametric Amplification",
    description: "Optical parametric amplification (OPA) gain and bandwidth in χ⁽²⁾ nonlinear crystals.",
    knownIssue: "The gain coefficient is twice the textbook value at a hidden 5 µm beam radius, and the bandwidth uses wrong units so it reads 0.0 nm; gain and bandwidth are not reliable.",
  },
  {
    slug: "photonic-bandgap",
    title: "Photonic Bandgap",
    description: "1D photonic crystal band structure and reflectivity.",
    knownIssue: "The transmission chart disagrees with the result cards: its stop band is about 20 % wide instead of 53 %, its centre transmission is 100 times too high, and it jumps at the band edges.",
  },
  {
    slug: "pulse-compression",
    title: "Pulse Compression",
    description: "Transform-limited pulse compression via chirp compensation.",
    knownIssue: "Output duration is the input divided by the compression ratio with no transform limit: the defaults give 10 fs, but a 10 nm bandwidth at 800 nm supports no less than about 94 fs.",
  },
  {
    slug: "q-switched-laser",
    title: "Q-Switched Laser",
    description: "High-energy pulse generation through repetitive Q-switching of a laser cavity.",
    knownIssue: "Peak power is shown 1000 times too high: 1 mJ in 10 ns reads 100000 kW instead of 100 kW. Average power and duty cycle are correct.",
  },
  {
    slug: "ring-cavity",
    title: "Ring Resonator Design",
    description: "Ring laser cavity of N curved mirrors: free spectral range, finesse, linewidth, photon lifetime, stability and the astigmatic mode sizes from the tilted mirrors.",
    keywords: ["ring laser", "ring cavity finesse", "astigmatism", "tilted mirror", "travelling-wave resonator"],
    tier: "textbook",
    modelNote: "N identical concave mirrors on a regular polygon, one output coupler. Finesse and linewidth from the Airy response of a one-way ring; modes from the paraxial period matrix with R cos α and R/cos α for the tilted mirrors. Image rotation in non-planar rings and thermal lensing are not modelled.",
    references: [
      {
        citation: "Kogelnik H., Ippen E. P., Dienes A., Shank C. V. (1972). Astigmatically compensated cavities for CW dye lasers. IEEE J. Quantum Electron. 8, 373–379.",
        url: "https://doi.org/10.1109/jqe.1972.1076964",
      },
      {
        citation: "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567.",
        url: "https://doi.org/10.1364/ao.5.001550",
      },
      { citation: "Siegman A. E. (1986). Lasers, ch. 11 and 21. University Science Books." },
    ],
  },
  {
    slug: "self-phase-modulation",
    title: "Self-Phase Modulation (SPM)",
    description: "Intensity-dependent phase shift and spectral broadening from the optical Kerr effect.",
    knownIssue: "The nonlinear phase is wrong because it includes the refractive index and halves the Gaussian peak intensity. The default intensity shows as 0.00 and the spectrum is an illustrative shape.",
  },
  {
    slug: "slab-laser",
    title: "Zigzag Slab Laser",
    description: "Bounce angle, temperature rise, optical path difference per bounce and slope efficiency of a zigzag slab laser from slab geometry and thermal load.",
    knownIssue: "Slope efficiency is negative (about -42 %) at default settings, the bounce angle uses slab width instead of length, and the temperature chart peaks at 4 times the displayed rise.",
  },
  {
    slug: "slow-light",
    title: "Slow Light Structures",
    description: "Group velocity reduction in photonic crystals and EIT media.",
    knownIssue: "The wavelength input has no effect on any result, and the dispersion plot is an illustrative Lorentzian fixed at 193.4 THz. Delay per mm shows NaN when the structure length is 0.",
  },
  {
    slug: "solid-state-laser-resonator",
    title: "Solid State Laser Resonator",
    description: "Nd:YAG-type rod laser: two-mirror stability and TEM₀₀ mode with the crystal in the cavity, threshold pump power, small-signal gain, Rigrod output power and slope efficiency.",
    keywords: ["Nd:YAG laser", "laser threshold", "slope efficiency", "four-level laser", "Rigrod", "saturation intensity"],
    tier: "textbook",
    modelNote: "Four-level rod pumped uniformly over its cross-section with a multimode output filling it: P_th = δhcA/(2ηₚστλₚ), output from Rigrod's homogeneous plane-wave model. The TEM₀₀ mode is Kogelnik–Li with the crystal (against the HR) folded into the effective length L − l(1 − 1/n). No thermal lens, no ground-state absorption (not for quasi-three-level media such as Yb:YAG).",
    references: [
      { citation: "Koechner W. (2006). Solid-State Laser Engineering, 6th ed., ch. 2–3. Springer.", url: "https://doi.org/10.1007/0-387-29338-8" },
      { citation: "Svelto O. (2010). Principles of Lasers, 5th ed., ch. 6–7. Springer.", url: "https://doi.org/10.1007/978-1-4419-1302-9" },
      { citation: "Rigrod W. W. (1965). Saturation effects in high-gain lasers. J. Appl. Phys. 36, 2487–2490.", url: "https://doi.org/10.1063/1.1714517" },
      { citation: "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567.", url: "https://doi.org/10.1364/ao.5.001550" },
    ],
  },
  {
    slug: "soliton",
    title: "Soliton Propagation",
    description: "Fundamental and higher-order soliton dynamics via split-step Fourier simulation.",
    knownIssue: "The simulation never applies dispersion in the frequency domain, so the plotted peak power and width stay constant for any input. T0 uses the Gaussian, not the sech, conversion.",
  },
  {
    slug: "spatial-filter",
    title: "Spatial Filter Pinhole Sizing",
    description: "Focal spot, recommended pinhole diameter, throughput of any pinhole and the output beam profile of a lens–pinhole spatial filter.",
    keywords: ["pinhole size", "spatial filter", "beam cleanup", "pinhole throughput"],
    tier: "textbook",
    modelNote: "Paraxial Gaussian beam focused by an ideal lens onto a centred pinhole. For M² > 1 the spot and throughput use the embedded Gaussian, an estimate. The output profile is the Fraunhofer pattern of the cut Gaussian.",
    references: [
      {
        citation: "Uehara K., Kikuchi H. (1986). Transmission of a Gaussian beam through a circular aperture. Appl. Opt. 25, 4514.",
        url: "https://doi.org/10.1364/ao.25.004514",
      },
      {
        citation: "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567.",
        url: "https://doi.org/10.1364/ao.5.001550",
      },
    ],
  },
  {
    slug: "sum-frequency",
    title: "Sum Frequency Generation (SFG)",
    description: "Upconversion via χ⁽²⁾: ω1 + ω2 → ω3 with phase matching.",
    knownIssue: "Conversion efficiency and SFG power are divided by the beam area twice, so the defaults show 6.4 million percent and 321 W from 150 mW of input instead of about 0.018 % and 9 µW.",
  },
  {
    slug: "supercontinuum",
    title: "Supercontinuum Generation",
    description: "Broadband SC generation in photonic crystal fibers via soliton fission, SPM, and dispersive wave generation.",
    knownIssue: "A unit error makes the dispersion length, soliton power, soliton number, fission length and bandwidth wrong by many orders of magnitude. N shows 0.0 instead of about 53 at default inputs.",
  },
  {
    slug: "thin-disk-laser",
    title: "Yb Thin-Disk Laser",
    description: "Multipass pump absorption, threshold, slope efficiency, temperature rise and thermal lens of a Yb thin-disk laser from disk thickness and doping.",
    knownIssue: "Pump absorption is about 20 times too low (15 % after 16 passes instead of over 90 %), the temperature chart is 10 000 times too high, and quasi-three-level reabsorption is ignored.",
  },
];
