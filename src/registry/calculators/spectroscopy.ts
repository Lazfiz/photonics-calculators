import type { CalculatorEntry } from "../types";

export const spectroscopy: CalculatorEntry[] = [
  {
    slug: "absorption-cross-section",
    title: "Absorption Cross-Section Calculator",
    description: "= 1000 / (N_A ln 10) — convert molar extinction coefficient to molecular cross-section.",
    lede: "σ = ε · 1000 · ln(10) / N_A — convert molar extinction coefficient to molecular cross-section.",
  },
  {
    slug: "absorption-depth",
    title: "Absorption Depth Calculator",
    description: "Calculate absorption depth = 1/ and explore spectral dependence for common optical materials.",
    lede: "Calculate absorption depth δ = 1/α and explore spectral dependence for common optical materials.",
  },
  {
    slug: "apodization-comparison",
    title: "Apodization Comparison",
    description: "Compare 9 window functions and their instrument line shapes (ILS). Select windows to overlay.",
    keywords: ["Apodization Functions"],
    tier: "exact",
    modelNote: "Window definitions and their line shapes. Sidelobe and equivalent-noise-bandwidth values are measured from the windows at N = 512; Harris's Gaussian ENBW does not fit his own definition.",
    references: [
      {
        citation: "Harris F. J. (1978). On the use of windows for harmonic analysis with the discrete Fourier transform. Proc. IEEE 66, 51–83. Cosine-sum windows (eq. 30–32) and the coefficients of Table I.",
        url: "https://doi.org/10.1109/proc.1978.10837",
      },
      {
        citation: "Nuttall A. H. (1981). Some windows with very good sidelobe behavior. IEEE Trans. ASSP 29, 84–91. Four-term window with a continuous first derivative.",
        url: "https://doi.org/10.1109/tassp.1981.1163506",
      },
    ],
  },
  {
    slug: "blackbody",
    title: "Blackbody Radiation",
    description: "Planck's law spectral radiance, Wien displacement, and Stefan-Boltzmann total power.",
    lede: "Planck's law spectral radiance curve, Wien's displacement law, and Stefan-Boltzmann total power.",
    keywords: ["planck", "wien", "stefan boltzmann", "thermal radiation"],
    priority: 96,
    related: [
      {
        href: "/spectroscopy/ftir-resolution",
        note: "Connect source spectrum intuition to FTIR workflows.",
      },
      {
        href: "/spectroscopy/wavenumber-converter",
        note: "Switch between wavelength and wavenumber views.",
      },
      { href: "/spectroscopy/spectral-range", note: "Instrument window and coverage context." },
      {
        href: "/spectroscopy/infrared-spectroscopy",
        note: "Bridge blackbody intuition to IR instrumentation.",
      },
    ],
  },
  {
    slug: "cavity-ring-down",
    title: "Cavity Ring-Down Spectroscopy",
    description: "Model CRDS ring-down time, sensitivity, and finesse. Visualize exponential decay with and without sample absorption.",
  },
  {
    slug: "coherent-anti-stokes-raman",
    title: "Coherent Anti-Stokes Raman Scattering (CARS)",
    description: "Four-wave mixing process for label-free vibrational imaging with chemical specificity.",
    keywords: ["Coherent Anti-Stokes Raman Spectroscopy (CARS)"],
  },
  {
    slug: "conc-mirror",
    title: "Concave Mirror Throughput",
    description: "Connes advantage and throughput for concave mirror-based spectrometers (e.g., FTIR, concave grating).",
  },
  {
    slug: "concentration",
    title: "Concentration from Absorbance",
    description: "c = A / (l) — determine concentration from measured absorbance using Beer-Lambert law.",
    lede: "c = A / (ε·l) — determine concentration from measured absorbance using Beer-Lambert law.",
  },
  {
    slug: "dispersive-element",
    title: "Dispersive Element Design",
    description: "Diffraction grating parameters: grating equation, angular/linear dispersion, blaze profile.",
  },
  {
    slug: "doppler-broadening",
    title: "Doppler Broadening Calculator",
    description: "Calculate Doppler (thermal) line broadening FWHM from gas temperature and atomic/molecular mass.",
  },
  {
    slug: "dual-comb-spectroscopy",
    title: "Dual-Comb Spectroscopy Calculator",
    description: "Model dual-comb spectroscopy parameters: resolution, bandwidth, update rate, and multi-heterodyne RF spectrum.",
    tier: "exact",
    modelNote: "Comb equation and sampling arithmetic. The mapping from optical tooth to RF beat is alias-free only if the band's image stays in one half-band, which needs Δν ≤ f_r²/(2|Δf_r|) and suitable offset frequencies.",
    references: [
      {
        citation: "Coddington I., Newbury N., Swann W. (2016). Dual-comb spectroscopy. Optica 3, 414.",
        url: "https://doi.org/10.1364/optica.3.000414",
      },
    ],
  },
  {
    slug: "electron-spectroscopy",
    title: "Electron Spectroscopy (XPS/UPS)",
    description: "Photoelectron spectroscopy for surface composition, chemical state, and electronic structure.",
  },
  {
    slug: "emission-spectra",
    title: "Emission Spectra Fitting",
    description: "Model photoluminescence emission with asymmetric Gaussian line shapes.",
  },
  {
    slug: "etalon-fsr",
    title: "Etalon Free Spectral Range",
    description: "Fabry-Pérot etalon: FSR = ²/(2nd cos ). Transmission follows the Airy function.",
    lede: "Fabry-Pérot etalon: FSR = λ²/(2nd cos θ). Transmission follows the Airy function.",
  },
  {
    slug: "extinction-coefficient",
    title: "Extinction Coefficient",
    description: "Calculate molar and specific extinction coefficients from absorbance measurements. Beer-Lambert law: = A / (cl).",
    lede: "Calculate molar and specific extinction coefficients from absorbance measurements. Beer-Lambert law: ε = A / (c·l).",
  },
  {
    slug: "fluorescence-lifetime",
    title: "Fluorescence Lifetime Calculator",
    description: "Model single and bi-exponential fluorescence decay curves. Calculate intensity-weighted average lifetimes.",
    tier: "exact",
    modelNote: "Exact definitions of the fractional intensities and of the intensity- and amplitude-weighted averages of a multi-exponential decay. Φ = ⟨τ⟩_amp/τ_rad assumes one radiative rate for all components.",
    references: [
      {
        citation: "Lakowicz J. R. (2006). Principles of Fluorescence Spectroscopy, 3rd ed., ch. 4. Springer.",
      },
      {
        citation: "Sillen A., Engelborghs Y. (1998). The Correct Use of ‘Average’ Fluorescence Parameters. Photochem. Photobiol. 67, 475–486.",
        url: "https://doi.org/10.1111/j.1751-1097.1998.tb09443.x",
      },
    ],
  },
  {
    slug: "fluorescence-quantum-yield",
    title: "Fluorescence Quantum Yield",
    description: "Φ = Φ_ref (I_s/I_ref) (A_ref/A_s) (n_s/n_ref)² — comparative method using a reference standard.",
    lede: "Φ = Φ_ref · (I_s/I_ref) · (A_ref/A_s) · (n_s/n_ref)² — comparative method using a reference standard.",
  },
  {
    slug: "fourier-self-comb",
    title: "Fourier Self-Comb Spectroscopy",
    description: "Optical frequency comb from a single microresonator. Dual-comb spectroscopy without two separate lasers.",
  },
  {
    slug: "fourier-transform",
    title: "Fourier Transform Basics",
    description: "Decompose a composite time-domain signal into its frequency components via DFT.",
  },
  {
    slug: "ftir-resolution",
    title: "FTIR Resolution Calculator",
    description: "FTIR spectral resolution from maximum OPD, apodization, and scan parameters.",
    lede: "Spectral resolution from maximum optical path difference (OPD) and apodization function.",
    keywords: ["interferometer", "opd", "apodization", "resolution"],
    priority: 96,
    related: [
      {
        href: "/spectroscopy/apodization-comparison",
        note: "Windowing behavior and line-shape tradeoffs.",
      },
      {
        href: "/spectroscopy/phase-correction",
        note: "Follow-on FTIR signal-processing step.",
      },
      {
        href: "/spectroscopy/michelson-interferometer",
        note: "Physical interferometer foundation.",
      },
      { href: "/spectroscopy/blackbody", note: "Source spectrum intuition for FTIR systems." },
    ],
  },
  {
    slug: "grating-efficiency",
    title: "Grating Efficiency Calculator",
    description: "Estimate diffraction grating efficiency based on groove density, blaze angle, and wavelength.",
  },
  {
    slug: "infrared-spectroscopy",
    title: "Infrared (IR) Spectroscopy",
    description: "Molecular vibrational absorption in the mid-infrared region (400–4000 cm⁻¹).",
  },
  {
    slug: "jacquinot",
    title: "Jacquinot Advantage",
    description: "FTIR throughput advantage over dispersive instruments. G = 2/(̃2L) where L = max OPD.",
    lede: "Maximum solid angle of an FTIR interferometer: Ω = 2π/(ν̃·L). True Jacquinot advantage = T_FT/T_G is the throughput ratio vs a grating spectrometer.",
  },
  {
    slug: "lambert-beer-law",
    title: "Lambert-Beer Law Calculator",
    description: "Beer-Lambert absorbance, optical density, and transmission with interactive parameter sweeps.",
    lede: "Comprehensive Beer-Lambert law analysis with sliders, presets, and interactive parameter sweeps.",
    keywords: ["absorbance", "optical density", "transmission", "Beer-Lambert Absorption"],
    priority: 94,
    related: [
      { href: "/spectroscopy/infrared-spectroscopy" },
      { href: "/spectroscopy/jacquinot" },
      { href: "/spectroscopy/libs-analysis" },
      { href: "/spectroscopy/lineshape-fit" },
    ],
    tier: "exact",
    modelNote: "Exact for monochromatic light and a dilute solution of non-interacting absorbers. Not modelled: scattering, fluorescence and stray light; absorbers interact above about 10 mM and absorbance reads low above A ≈ 2.",
    references: [
      {
        citation: "IUPAC Compendium of Chemical Terminology (Gold Book), entries “absorbance” and “molar (decadic) absorption coefficient”.",
      },
    ],
  },
  {
    slug: "libs-analysis",
    title: "LIBS Analysis Calculator",
    description: "Laser-Induced Breakdown Spectroscopy: model plasma line broadening (Stark + Doppler) and estimate plasma conditions.",
  },
  {
    slug: "lineshape-fit",
    title: "Lineshape Fitting",
    description: "Voigt, Gaussian, and Lorentzian line profiles — compare convolution effects on spectral lines.",
  },
  {
    slug: "michelson-interferometer",
    title: "Michelson Interferometer",
    description: "Interferogram spectrum via Fourier transform. Core of FTIR spectroscopy.",
    lede: "Interferogram → spectrum via Fourier transform. Core of FTIR spectroscopy.",
  },
  {
    slug: "microwave-spectroscopy",
    title: "Microwave / Rotational Spectroscopy",
    description: "Pure rotational transitions for molecular structure determination (1–300 GHz).",
  },
  {
    slug: "near-infrared",
    title: "Near-Infrared (NIR) Spectroscopy",
    description: "Overtone and combination band analysis for non-destructive composition measurement.",
  },
  {
    slug: "optical-density",
    title: "Optical Density",
    description: "Convert optical density, transmission, and attenuation with interactive presets and slider-based exploration.",
    lede: "Convert optical density (OD), transmission, and attenuation with presets and interactive sliders.",
    related: [
      { href: "/spectroscopy/microwave-spectroscopy" },
      { href: "/spectroscopy/near-infrared" },
      { href: "/spectroscopy/optical-path-length" },
      { href: "/spectroscopy/penetration-depth" },
    ],
  },
  {
    slug: "optical-path-length",
    title: "Optical Path Length Calculator",
    description: "OPL = n d N / cos() — effective path through a medium.",
    lede: "OPL = n·d·N/cos(θ_internal). External angle converted via Snell's law.",
  },
  {
    slug: "penetration-depth",
    title: "Optical Penetration Depth",
    description: "Calculate optical penetration depth from complex refractive index ñ = n + ik. Includes oblique incidence via Snell's law.",
    heading: "Penetration Depth Calculator",
  },
  {
    slug: "phase-correction",
    title: "Phase Correction Methods",
    description: "Compare Mertz, Forman, and power spectrum methods for interferogram phase correction (FTIR).",
  },
  {
    slug: "pump-probe",
    title: "Pump-Probe Spectroscopy",
    description: "Ultrafast dynamics via time-resolved differential transmission. GSB, SE, and ESA contributions.",
  },
  {
    slug: "raman-shift",
    title: "Raman Shift Calculator",
    description: "Convert between Raman shift (cm⁻¹), scattered wavelength, and energy for any excitation laser.",
  },
  {
    slug: "raman-spectroscopy",
    title: "Raman Spectroscopy",
    description: "Stokes and anti-Stokes wavelength shift vs Raman shift. Inelastic scattering fundamentals.",
  },
  {
    slug: "signal-to-noise",
    title: "Signal-to-Noise Ratio",
    description: "Detailed SNR model: shot noise, dark current, read noise, and detector noise contributions.",
  },
  {
    slug: "snr-averaging",
    title: "SNR Improvement with Co-Adding",
    description: "SNR improves as N where N is the number of co-added scans. Signal adds linearly, noise as N.",
    lede: "SNR improves as √N where N is the number of co-added scans. Signal adds linearly, noise as √N.",
  },
  {
    slug: "spectral-calibration",
    title: "Spectral Calibration",
    description: "Wavelength calibration using known emission lines and linear/polynomial fitting.",
  },
  {
    slug: "spectral-deconvolution",
    title: "Spectral Deconvolution",
    description: "Decompose overlapping spectral bands into individual Gaussian components.",
  },
  {
    slug: "spectral-line-broadening",
    title: "Spectral Line Broadening",
    description: "Doppler, collisional, natural, and Voigt broadening mechanisms.",
  },
  {
    slug: "spectral-range",
    title: "Spectral Range Calculator",
    description: "Spectral coverage, resolution, and dispersion for a grating-based spectrometer.",
  },
  {
    slug: "spectral-resolution",
    title: "Spectral Resolution Calculator",
    description: "Compare spectral resolution across grating, prism, and Fabry-Pérot spectrometers.",
    tier: "textbook",
    modelNote: "The slit and diffraction limits are computed separately and the resolution is taken as the larger; the real line shape is their convolution. Aberrations and detector pixels are not modelled.",
    references: [
      { citation: "Palmer C., Loewen E. (2005). Diffraction Grating Handbook, 6th ed., ch. 2. Newport." },
      { citation: "Hecht E. (2016). Optics, 5th ed., §9.6.1. Fabry-Pérot resolution δλ = FSR/ℱ." },
    ],
  },
  {
    slug: "stimulated-raman",
    title: "Stimulated Raman Scattering (SRS)",
    description: "Coherent Raman gain/loss process for high-speed chemical imaging without non-resonant background.",
  },
  {
    slug: "stokes-shift",
    title: "Stokes Shift Calculator",
    description: "̃ = ̃_abs − ̃_em — energy difference between absorption and emission maxima.",
    lede: "Δν̃ = ν̃_abs − ν̃_em — energy difference between absorption and emission maxima.",
  },
  {
    slug: "stray-light",
    title: "Grating Ghosts & Stray Light",
    description: "Ghost order analysis and stray light estimation for grating-based spectrometers.",
  },
  {
    slug: "stray-light-rejection",
    title: "Stray Light Rejection",
    description: "Impact of stray light on photometric accuracy. Critical for high-absorbance measurements.",
  },
  {
    slug: "sum-frequency-gen",
    title: "Sum Frequency Generation Spectroscopy",
    description: "Surface-specific vibrational probe. SFG is forbidden in centrosymmetric media — only surfaces and interfaces contribute.",
  },
  {
    slug: "surface-enhanced-raman",
    title: "Surface-Enhanced Raman Spectroscopy (SERS)",
    description: "EM and chemical enhancement mechanisms, hotspots, and detection limit estimation.",
  },
  {
    slug: "terahertz-spectroscopy",
    title: "Terahertz (THz) Spectroscopy",
    description: "Probing low-energy excitations: phonon modes, hydrogen bonding, lattice vibrations (0.1–10 THz).",
  },
  {
    slug: "time-resolved",
    title: "Time-Resolved Spectroscopy",
    description: "TCSPC and streak camera fundamentals. IRF convolution, temporal resolution, and decay analysis.",
  },
  {
    slug: "transient-absorption",
    title: "Transient Absorption Spectroscopy",
    description: "A spectra vs delay time. Decompose into GSB, ESA, and SE contributions across the probe range.",
    lede: "ΔA spectra vs delay time. Decompose into GSB, ESA, and SE contributions across the probe range.",
  },
  {
    slug: "two-dimensional",
    title: "Two-Dimensional (2D) Spectroscopy",
    description: "Correlates excitation and detection frequencies via three-pulse photon echo. Reveals coupling, energy transfer, and homogeneous vs inhomogeneous broadening.",
  },
  {
    slug: "wavenumber-converter",
    title: "Wavenumber Converter",
    description: "Convert wavelength, wavenumber, frequency, and energy with sliders, presets, and range sweeps.",
    lede: "Convert wavelength, wavenumber, frequency, and energy with presets, sliders, and range sweeps.",
    related: [{ href: "/spectroscopy/transient-absorption" }, { href: "/spectroscopy/two-dimensional" }],
  },
];
