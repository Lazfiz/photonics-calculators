import type { CalculatorEntry } from "../types";

export const spectroscopy: CalculatorEntry[] = [
  {
    slug: "absorption-cross-section",
    title: "Absorption Cross-Section Calculator",
    description: "σ = ε · 1000 · ln(10) / N_A — convert the molar absorption (extinction) coefficient to the cross-section per molecule and back, with number density and Napierian absorption coefficient.",
    related: [
      { href: "/spectroscopy/lambert-beer-law" },
      { href: "/spectroscopy/optical-density" },
      { href: "/spectroscopy/absorption-depth" },
    ],
    tier: "exact",
    modelNote: "Exact conversion σ = ln 10 · ε / N_A between the decadic molar coefficient and the Napierian cross-section, with α = σ·N_A·c. The typical values quoted are peak values for single absorbers in dilute solution or vapour.",
    references: [
      {
        citation: "IUPAC Compendium of Chemical Terminology (Gold Book), entries “absorption cross section” and “molar (decadic) absorption coefficient”.",
      },
      {
        citation: "Pace C. N., Vajdos F., Fee L., Grimsley G., Gray T. (1995). How to measure and predict the molar absorption coefficient of a protein. Protein Sci. 4, 2411–2423.",
        url: "https://doi.org/10.1002/pro.5560041120",
      },
      {
        citation: "Lambert T. J. (2019). FPbase: a community-editable fluorescent protein database. Nat. Methods 16, 277–278 (EGFP ε).",
        url: "https://doi.org/10.1038/s41592-019-0352-8",
      },
      {
        citation: "Foot C. J. (2005). Atomic Physics. Oxford University Press (resonant cross-section 3λ²/2π).",
      },
    ],
  },
  {
    slug: "absorption-depth",
    title: "Absorption Depth Calculator",
    description: "Calculate absorption depth δ = 1/α and explore spectral dependence for common optical materials.",
    knownIssue: "The silicon absorption curve is invented and underestimates α several-fold (550 nm gives 12.8 µm instead of 1.56 µm), and the water curve wrongly makes water opaque at 200–240 nm.",
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
    tier: "exact",
    modelNote: "Exact decay envelope of a two-mirror cavity filled with the sample (single-mode excitation); the detection limit assumes the stated ring-down-time noise per decay and white-noise averaging.",
    references: [
      { citation: "O'Keefe A., Deacon D. A. G. (1988). Cavity ring-down optical spectrometer for absorption measurements using pulsed laser sources. Rev. Sci. Instrum. 59, 2544–2551.", url: "https://doi.org/10.1063/1.1139895" },
      { citation: "Berden G., Peeters R., Meijer G. (2000). Cavity ring-down spectroscopy: experimental schemes and applications. Int. Rev. Phys. Chem. 19, 565–607.", url: "https://doi.org/10.1080/014423500750040627" },
      { citation: "Siegman A. E. (1986). Lasers, ch. 11. University Science Books." },
    ],
  },
  {
    slug: "conc-mirror",
    title: "Concave Mirror Throughput",
    description: "Solid angle, f-number and slit étendue of a spherical-mirror spectrometer, with its slit-limited resolving power and the Jacquinot advantage of an FTIR of the same aperture.",
    tier: "textbook",
    modelNote: "Geometric optics: exact cone to the mirror rim including the sag, Lambertian slit filling the mirror, Littrow grating limited by the slit width, not by diffraction or aberrations.",
    references: [
      { citation: "Jacquinot P. (1954). The luminosity of spectrometers with prisms, gratings, or Fabry-Perot etalons. J. Opt. Soc. Am. 44, 761–765.", url: "https://doi.org/10.1364/JOSA.44.000761" },
      { citation: "Smith W. J. (2008). Modern Optical Engineering, 4th ed., ch. 12 (radiometry and photometry). McGraw-Hill." },
      { citation: "Palmer C., Loewen E. (2005). Diffraction Grating Handbook, 6th ed., ch. 2. Newport Corporation." },
    ],
  },
  {
    slug: "dispersive-element",
    title: "Dispersive Element Design",
    description: "Diffraction grating parameters: grating equation, angular/linear dispersion, blaze profile.",
    tier: "textbook",
    modelNote: "Grating equation and dispersion are exact geometry; the blaze efficiency is scalar theory for a right-angle sawtooth, shared over the propagating orders with facet shadowing (no coating reflectance or polarization; fair for λ/d below about 0.2).",
    references: [
      { citation: "Palmer C., Loewen E. (2005). Diffraction Grating Handbook, 6th ed., ch. 2. Newport." },
      {
        citation: "Casini R., Nelson P. G. (2014). On the intensity distribution function of blazed reflective diffraction gratings. J. Opt. Soc. Am. A 31, 2179–2184 (eqs. 18–25).",
        url: "https://doi.org/10.1364/JOSAA.31.002179",
      },
    ],
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
    knownIssue: "The simulated XPS spectrum uses a fixed made-up peak list that ignores the inputs, and its Shirley-type background steps the wrong way, rising toward low binding energy.",
  },
  {
    slug: "etalon-fsr",
    title: "Etalon Free Spectral Range",
    description: "Fabry-Pérot etalon: FSR = λ²/(2nd cos θ). Transmission follows the Airy function.",
    tier: "exact",
    modelNote: "Ideal etalon: lossless identical mirrors without reflection phase, non-dispersive gap, plane-wave illumination; absorption, flatness and beam divergence lower the real finesse.",
    references: [
      { citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., §7.6.1. Cambridge University Press.", url: "https://doi.org/10.1017/CBO9781139644181" },
      { citation: "Hecht E. (2017). Optics, 5th ed., §9.6.1. Pearson." },
    ],
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
    knownIssue: "Divide-by-zero cases show 0 instead of an error, results above 1 are not flagged, and the absorbance ratio stands in for the absorbed-photon fraction, which is valid only for A below about 0.1.",
  },
  {
    slug: "fourier-self-comb",
    title: "Fourier Self-Comb Spectroscopy",
    description: "Optical frequency comb from a single microresonator. Dual-comb spectroscopy without two separate lasers.",
    knownIssue: "Plots up to millions of comb teeth with arbitrary CEO offsets scaled by a 0.3 fudge factor, can freeze the browser, and does not model dual-comb or microresonator physics.",
  },
  {
    slug: "fourier-transform",
    title: "Fourier Transform Basics",
    description: "Sample two sinusoids plus white noise and read their amplitudes from a windowed FFT: bin spacing, Nyquist aliasing, scalloping and the noise floor.",
    tier: "exact",
    modelNote: "Discrete Fourier transform of the sampled record with coherent-gain correction; the signal is synthetic (two tones, Gaussian noise with a fixed seed).",
    references: [
      { citation: "Harris F. J. (1978). On the use of windows for harmonic analysis with the discrete Fourier transform. Proc. IEEE 66, 51–83.", url: "https://doi.org/10.1109/PROC.1978.10837" },
      { citation: "Oppenheim A. V., Schafer R. W. (2010). Discrete-Time Signal Processing, 3rd ed., chs. 4 and 10. Pearson." },
      { citation: "Cooley J. W., Tukey J. W. (1965). An algorithm for the machine calculation of complex Fourier series. Math. Comput. 19, 297–301.", url: "https://doi.org/10.1090/S0025-5718-1965-0178586-1" },
    ],
  },
  {
    slug: "ftir-resolution",
    title: "FTIR Resolution Calculator",
    description: "FTIR spectral resolution from maximum OPD, apodization (Norton–Beer, Happ–Genzel, Blackman–Harris) and scan parameters, with computed instrument line shapes.",
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
    tier: "exact",
    modelNote: "Ideal interferometer: the instrument line shape is the cosine transform of the apodization over ±L, computed numerically; beam divergence and phase errors are not included.",
    references: [
      { citation: "Griffiths P. R., de Haseth J. A. (2007). Fourier Transform Infrared Spectrometry, 2nd ed., chs. 2 and 4. Wiley." },
      { citation: "Norton R. H., Beer R. (1976). New apodizing functions for Fourier spectrometry. J. Opt. Soc. Am. 66, 259–264; errata 67, 419 (1977).", url: "https://doi.org/10.1364/JOSA.66.000259" },
      { citation: "Naylor D. A., Tahic M. K. (2007). Apodizing functions for Fourier transform spectroscopy. J. Opt. Soc. Am. A 24, 3644–3648.", url: "https://doi.org/10.1364/JOSAA.24.003644" },
      { citation: "Harris F. J. (1978). On the use of windows for harmonic analysis with the discrete Fourier transform. Proc. IEEE 66, 51–83.", url: "https://doi.org/10.1109/PROC.1978.10837" },
    ],
  },
  {
    slug: "grating-efficiency",
    title: "Grating Efficiency Calculator",
    description: "Scalar blaze efficiency of a ruled grating in Littrow versus wavelength, with the order cutoff and Rayleigh anomalies.",
    tier: "textbook",
    modelNote: "Scalar theory for a right-angle sawtooth in Littrow, with the envelopes of all propagating orders sharing the incident power; no coating reflectance or polarization. Fair for λ/d below about 0.2; above that TE and TM split.",
    references: [
      {
        citation: "Casini R., Nelson P. G. (2014). On the intensity distribution function of blazed reflective diffraction gratings. J. Opt. Soc. Am. A 31, 2179–2184 (eqs. 18–25).",
        url: "https://doi.org/10.1364/JOSAA.31.002179",
      },
      { citation: "Palmer C., Loewen E. (2005). Diffraction Grating Handbook, 6th ed., ch. 2. Newport." },
      {
        citation: "Lord Rayleigh (1907). On the dynamical theory of gratings. Proc. R. Soc. Lond. A 79, 399–416.",
        url: "https://doi.org/10.1098/rspa.1907.0051",
      },
    ],
  },
  {
    slug: "infrared-spectroscopy",
    title: "Infrared (IR) Spectroscopy",
    description: "Molecular vibrational absorption in the mid-infrared region (400–4000 cm⁻¹).",
    knownIssue: "The absorption bands and molar absorptivities are a made-up illustrative set summed into one spectrum, not data for any real molecule.",
  },
  {
    slug: "jacquinot",
    title: "Jacquinot Advantage",
    description: "Maximum solid angle of an FTIR interferometer, Ω = 2π/(ν̃·L) with L the maximum OPD, which sets its throughput advantage over a grating spectrometer.",
    lede: "Field of view, field-stop size and étendue of an FTIR interferometer, and its throughput ratio to a grating spectrometer of the same resolving power.",
    tier: "textbook",
    modelNote: "Geometric optics: unapodized resolution 1/L, circular field stop, grating spectrometer in Littrow limited by its slit width; both instruments share the beam area.",
    references: [
      { citation: "Jacquinot P. (1954). The luminosity of spectrometers with prisms, gratings, or Fabry-Perot etalons. J. Opt. Soc. Am. 44, 761–765.", url: "https://doi.org/10.1364/JOSA.44.000761" },
      { citation: "Griffiths P. R., de Haseth J. A. (2007). Fourier Transform Infrared Spectrometry, 2nd ed., ch. 7. Wiley." },
    ],
  },
  {
    slug: "lambert-beer-law",
    title: "Lambert-Beer Law Calculator",
    description: "Beer-Lambert law A = ε·c·l: solve for absorbance, concentration or the molar absorption (extinction) coefficient, with transmittance, mass concentration and mass absorption coefficient.",
    lede: "Solve A = ε·c·l for absorbance, concentration or ε, and sweep concentration, path length or ε.",
    keywords: ["absorbance", "optical density", "transmission", "Beer-Lambert Absorption", "Concentration from Absorbance", "Extinction Coefficient", "molar absorption coefficient", "mass absorption coefficient", "specific extinction coefficient"],
    priority: 94,
    related: [
      { href: "/spectroscopy/optical-density" },
      { href: "/spectroscopy/absorption-cross-section" },
      { href: "/spectroscopy/absorption-depth" },
      { href: "/spectroscopy/infrared-spectroscopy" },
    ],
    tier: "exact",
    modelNote: "Exact for monochromatic light and a dilute solution of non-interacting absorbers; concentration and ε are A = ε·c·l solved for each, and a = ε/M. Not modelled: scattering, fluorescence and stray light; absorbers interact above about 10 mM and absorbance reads low above A ≈ 2.",
    references: [
      {
        citation: "IUPAC Compendium of Chemical Terminology (Gold Book), entries “absorbance”, “molar (decadic) absorption coefficient” and “mass absorption coefficient”.",
      },
    ],
  },
  {
    slug: "libs-analysis",
    title: "LIBS Analysis Calculator",
    description: "Laser-Induced Breakdown Spectroscopy: Stark width from electron density or electron density from a measured Stark width, Doppler and instrument widths, the Saha ionisation ratio and the McWhirter LTE check.",
    lede: "Stark and Doppler widths of a LIBS plasma line, electron density from a Stark width, the Saha ratio and the McWhirter LTE limit.",
    keywords: ["LIBS", "Stark broadening", "electron density", "Saha equation", "McWhirter criterion", "plasma temperature"],
    related: [
      { href: "/spectroscopy/spectral-line-broadening" },
      { href: "/spectroscopy/spectral-resolution" },
      { href: "/spectroscopy/spectral-deconvolution" },
    ],
    tier: "textbook",
    modelNote: "Isolated-line electron-impact Stark width linear in nₑ (w from tables, ion broadening neglected), Doppler and instrument Gaussians in quadrature, exact Voigt; Saha in LTE for single ionisation without ionisation-potential lowering. Not for hydrogen Balmer lines.",
    references: [
      {
        citation: "Konjević N., Lesage A., Fuhr J. R., Wiese W. L. (2002). Experimental Stark widths and shifts for spectral lines of neutral and ionized atoms. J. Phys. Chem. Ref. Data 31, 819–927.",
        url: "https://doi.org/10.1063/1.1486456",
      },
      {
        citation: "Cristoforetti G., De Giacomo A., Dell'Aglio M., et al. (2010). Local thermodynamic equilibrium in laser-induced breakdown spectroscopy: beyond the McWhirter criterion. Spectrochim. Acta B 65, 86–95.",
        url: "https://doi.org/10.1016/j.sab.2009.11.005",
      },
      {
        citation: "Griem H. R. (1997). Principles of Plasma Spectroscopy. Cambridge University Press (Saha equation, Stark broadening).",
      },
      {
        citation: "NIST Atomic Spectra Database, ionization energies.",
        url: "https://physics.nist.gov/PhysRefData/ASD/ionEnergy.html",
      },
    ],
  },
  {
    slug: "michelson-interferometer",
    title: "Michelson Interferometer",
    description: "Interferogram of Gaussian spectral lines and the spectrum recovered by cosine transform: resolution 1/L, resolving power, Nyquist aliasing and fringe visibility.",
    lede: "Interferogram → spectrum via Fourier transform. Core of FTIR spectroscopy.",
    tier: "exact",
    modelNote: "Ideal two-beam interferometer with Gaussian lines, sampled single-sided from zero path difference; no beam divergence, phase error or detector response.",
    references: [{ citation: "Griffiths P. R., de Haseth J. A. (2007). Fourier Transform Infrared Spectrometry, 2nd ed., chs. 2 and 4. Wiley." }],
  },
  {
    slug: "microwave-spectroscopy",
    title: "Microwave / Rotational Spectroscopy",
    description: "Pure rotational transitions for molecular structure determination (1–300 GHz).",
    knownIssue: "The default reduced mass of 14 amu gives B about half that of CO, line intensities omit the frequency factor, and the symmetric-top option actually uses spherical-top degeneracy.",
  },
  {
    slug: "near-infrared",
    title: "Near-Infrared (NIR) Spectroscopy",
    description: "Overtone and combination band analysis for non-destructive composition measurement.",
    knownIssue: "Band strengths, widths and the scattering baseline are illustrative placeholders, water bands are several times too weak, and the C-H combination band sits near 2100 nm instead of about 2300 nm.",
  },
  {
    slug: "optical-density",
    title: "Optical Density",
    description: "Convert optical density, transmission, attenuation in dB and filter factor (photographic stops) with presets.",
    lede: "Convert optical density (OD), transmission, dB attenuation and ND filter factor with presets.",
    related: [
      { href: "/spectroscopy/lambert-beer-law" },
      { href: "/laser-safety/optical-density", note: "OD that laser eyewear needs for a given beam." },
      { href: "/spectroscopy/absorption-cross-section" },
      { href: "/spectroscopy/optical-path-length" },
    ],
    tier: "exact",
    modelNote: "Exact definitions: OD = −log₁₀ T, attenuation 10·OD dB, filter factor 1/T and log₂(1/T) stops. For a sample, OD includes scattering losses as well as absorption.",
    references: [
      {
        citation: "IUPAC Compendium of Chemical Terminology (Gold Book), entries “absorbance” and “transmittance”.",
      },
    ],
  },
  {
    slug: "optical-path-length",
    title: "Optical Path Length Calculator",
    description: "OPL = n·d·N/cos θ — optical path through a medium, with the internal angle from Snell's law.",
    lede: "OPL = n·d·N/cos(θ_internal). External angle converted via Snell's law.",
    knownIssue: "The time shown as retardation is the phase transit time OPL over c rather than the delay relative to vacuum, and group index is not modelled.",
  },
  {
    slug: "penetration-depth",
    title: "Optical Penetration Depth",
    description: "Calculate optical penetration depth from complex refractive index ñ = n + ik. Includes oblique incidence via Snell's law.",
    heading: "Penetration Depth Calculator",
    knownIssue: "The angle of incidence does not change any displayed result, the 1/e intensity depth 1/alpha is mislabelled as skin depth, and k equal to zero shows a fake finite depth.",
  },
  {
    slug: "phase-correction",
    title: "Phase Correction Methods",
    description: "Mertz and Forman phase correction run on a simulated single-sided FTIR interferogram with ZPD offset, phase offset, dispersion and noise, compared with the magnitude spectrum.",
    tier: "exact",
    modelNote: "The algorithms run on a synthetic interferogram of a known spectrum, so the error against the truth is computed, not modelled; the instrument is ideal apart from the phase error and white noise.",
    references: [
      { citation: "Griffiths P. R., de Haseth J. A. (2007). Fourier Transform Infrared Spectrometry, 2nd ed., chs. 2 and 4. Wiley." },
      { citation: "Mertz L. (1967). Auxiliary computation for Fourier spectrometry. Infrared Phys. 7, 17–23.", url: "https://doi.org/10.1016/0020-0891(67)90026-7" },
      { citation: "Forman M. L., Steel W. H., Vanasse G. A. (1966). Correction of asymmetric interferograms obtained in Fourier spectroscopy. J. Opt. Soc. Am. 56, 59–63.", url: "https://doi.org/10.1364/JOSA.56.000059" },
    ],
  },
  {
    slug: "pump-probe",
    title: "Pump-Probe Spectroscopy",
    description: "Ultrafast dynamics via time-resolved differential transmission. GSB, SE, and ESA contributions.",
    knownIssue: "Ground-state bleach recovers with the fast lifetime while the intermediate state is still populated, which breaks population balance; the band amplitudes are arbitrary.",
  },
  {
    slug: "raman-shift",
    title: "Raman Shift Calculator",
    description: "Convert between Raman shift (cm⁻¹) and Stokes or anti-Stokes wavelength for any laser, with the vibrational energy and the anti-Stokes/Stokes ratio.",
    keywords: ["Raman Spectroscopy", "Anti-Stokes Raman", "Raman Thermometry"],
    related: [{ href: "/spectroscopy/surface-enhanced-raman" }, { href: "/imaging/coherent-raman" }, { href: "/imaging/stimulated-raman-microscopy" }],
    tier: "exact",
    modelNote: "Exact conversions by energy conservation, in vacuum wavelengths. The anti-Stokes/Stokes ratio assumes a harmonic vibration in thermal equilibrium and equal Raman cross-sections on both sides (not under resonance excitation).",
    references: [
      {
        citation: "Long D. A. (2002). The Raman Effect: A Unified Treatment of the Theory of Raman Scattering by Molecules. Wiley. Stokes and anti-Stokes intensities and their temperature dependence.",
        url: "https://doi.org/10.1002/0470845767",
      },
      {
        citation: "McCreery R. L. (2000). Raman Spectroscopy for Chemical Analysis. Wiley. Raman shift standards (silicon, cyclohexane, diamond).",
        url: "https://doi.org/10.1002/0471721646",
      },
    ],
  },
  {
    slug: "signal-to-noise",
    title: "Signal-to-Noise Ratio",
    description: "Detailed SNR model: shot noise, dark current, read noise, and detector noise contributions.",
    knownIssue: "Signal photons are treated as photoelectrons with no quantum efficiency, dark current is entered as dark charge per exposure, and URL values are not range-checked.",
  },
  {
    slug: "snr-averaging",
    title: "SNR Improvement with Co-Adding",
    description: "SNR improves as √N where N is the number of co-added scans. Signal adds linearly, noise as √N.",
    knownIssue: "A zero or negative Max Scans value from the URL gives NaN results, the scan grid stops short of Max Scans, and the √N gain is shown without its white-noise assumption.",
  },
  {
    slug: "spectral-calibration",
    title: "Spectral Calibration",
    description: "Wavelength calibration of a Czerny–Turner spectrograph from mercury lines: linear, quadratic and cubic fits against the grating-equation pixel map.",
    tier: "textbook",
    modelNote: "The true pixel-to-wavelength map is the grating equation on a flat detector normal to the central ray (no aberrations, tilt or focal-plane curvature); line centroids carry seeded Gaussian noise.",
    references: [
      { citation: "Palmer C., Loewen E. (2005). Diffraction Grating Handbook, 6th ed., ch. 2. Newport." },
      { citation: "Kramida A., Ralchenko Yu., Reader J., NIST ASD Team. NIST Atomic Spectra Database (Hg I air wavelengths).", url: "https://doi.org/10.18434/T4W30F" },
    ],
  },
  {
    slug: "spectral-deconvolution",
    title: "Spectral Deconvolution & Band Model",
    description: "Overlapping Gaussian, Lorentzian or pseudo-Voigt bands: areas, band width and centroid, whether neighbours resolve, and least-squares heights with standard errors from a simulated noisy spectrum; or a vibronic (Huang–Rhys) absorption and emission band with its Stokes shift.",
    lede: "Build a spectrum from overlapping peaks and see how well their areas can be recovered, or model the vibronic shape of an emission band.",
    keywords: ["Emission Spectra Fitting", "peak fitting", "band decomposition", "overlapping peaks", "Huang–Rhys factor", "vibronic progression", "Franck–Condon", "emission spectrum", "Jacobian conversion"],
    related: [
      { href: "/spectroscopy/spectral-line-broadening" },
      { href: "/spectroscopy/stokes-shift" },
    ],
    tier: "textbook",
    modelNote: "Sums of height-normalised Gaussian, Lorentzian or pseudo-Voigt peaks; the heights are fitted by linear least squares with the centres and widths held at their true values, so the errors are a best case. The vibronic band has one displaced harmonic mode at T ≈ 0 (Poisson Franck–Condon factors), ν̃ and ν̃³ frequency factors and the λ⁻² Jacobian for emission.",
    references: [
      {
        citation: "Huang K., Rhys A. (1950). Theory of light absorption and non-radiative transitions in F-centres. Proc. R. Soc. Lond. A 204, 406–423.",
        url: "https://doi.org/10.1098/rspa.1950.0184",
      },
      {
        citation: "Strickler S. J., Berg R. A. (1962). Relationship between absorption intensity and fluorescence lifetime of molecules. J. Chem. Phys. 37, 814–822.",
        url: "https://doi.org/10.1063/1.1733166",
      },
      {
        citation: "Mooney J., Kambhampati P. (2013). Get the basics right: Jacobian conversion of wavelength and energy scales for quantitative analysis of emission spectra. J. Phys. Chem. Lett. 4, 3316–3318.",
        url: "https://doi.org/10.1021/jz401508t",
      },
      {
        citation: "Press W. H., Teukolsky S. A., Vetterling W. T., Flannery B. P. (2007). Numerical Recipes, 3rd ed. Cambridge University Press, ch. 15 (general linear least squares).",
      },
    ],
  },
  {
    slug: "spectral-line-broadening",
    title: "Spectral Line Broadening",
    description: "Doppler, pressure and natural line widths and the exact Voigt profile, with the Olivero and pseudo-Voigt (TCH) approximations; or combine any Gaussian and Lorentzian widths.",
    lede: "Doppler (Gaussian) and pressure plus natural (Lorentzian) widths of a gas line, combined into the exact Voigt profile.",
    keywords: ["Doppler Broadening", "Doppler width", "Voigt profile", "Voigt FWHM", "pseudo-Voigt", "Lorentzian", "pressure broadening", "lineshape", "natural linewidth"],
    related: [
      { href: "/spectroscopy/libs-analysis" },
      { href: "/spectroscopy/spectral-resolution" },
      { href: "/spectroscopy/wavenumber-converter" },
      { href: "/spectroscopy/absorption-cross-section" },
    ],
    tier: "exact",
    modelNote: "Exact Voigt convolution (Faddeeva function, ≈ 1e-13) of a Maxwell-Doppler Gaussian and a Lorentzian from natural decay plus impact-approximation collisions, with γ entered at the gas temperature. Not modelled: Dicke narrowing, speed-dependent broadening, line mixing and pressure shifts.",
    references: [
      {
        citation: "Demtröder W. (2014). Laser Spectroscopy 1: Basic Principles, 5th ed. Springer, ch. 3 (line widths and profiles).",
      },
      {
        citation: "Olivero J. J., Longbothum R. L. (1977). Empirical fits to the Voigt line width: a brief review. J. Quant. Spectrosc. Radiat. Transfer 17, 233–236.",
        url: "https://doi.org/10.1016/0022-4073(77)90161-3",
      },
      {
        citation: "Thompson P., Cox D. E., Hastings J. B. (1987). Rietveld refinement of Debye–Scherrer synchrotron X-ray data from Al₂O₃. J. Appl. Cryst. 20, 79–83 (pseudo-Voigt).",
        url: "https://doi.org/10.1107/S0021889887087090",
      },
      {
        citation: "Weideman J. A. C. (1994). Computation of the complex error function. SIAM J. Numer. Anal. 31, 1497–1518.",
        url: "https://doi.org/10.1137/0731077",
      },
    ],
  },
  {
    slug: "spectral-range",
    title: "Spectral Range Calculator",
    description: "Spectral coverage, resolution, and dispersion for a grating-based spectrometer.",
    tier: "textbook",
    modelNote: "Exact grating geometry for a flat detector normal to the central ray at a fixed deviation angle (α < 90° needs mλ_c < d(1 + cos D_v)); the resolution is the largest of the slit, two-pixel and diffraction limits, without aberrations or focal-plane tilt.",
    references: [
      { citation: "Palmer C., Loewen E. (2005). Diffraction Grating Handbook, 6th ed., ch. 2. Newport." },
    ],
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
    slug: "stokes-shift",
    title: "Stokes Shift Calculator",
    description: "Δν̃ = ν̃_abs − ν̃_em — energy difference between absorption and emission maxima.",
    lede: "The Stokes shift between absorption and emission maxima in nm, cm⁻¹ and eV.",
    related: [{ href: "/spectroscopy/spectral-deconvolution" }],
    tier: "exact",
    modelNote: "Exact conversion between the two maxima (vacuum wavelengths). The band shapes in the chart are Gaussians in wavelength, for illustration only.",
    references: [
      {
        citation: "Lakowicz J. R. (2006). Principles of Fluorescence Spectroscopy, 3rd ed., ch. 1. Springer.",
      },
    ],
  },
  {
    slug: "stray-light",
    title: "Stray Light & Order Overlap Calculator",
    description: "Absorbance error and highest readable absorbance from a spectrophotometer's stray light ratio, and the grating orders that overlap a set wavelength.",
    keywords: ["Stray Light Rejection", "photometric error", "stray radiant power ratio", "order sorting filter", "grating ghosts"],
    tier: "textbook",
    modelNote: "Stray light is a fixed fraction s of the detected reference power, attenuated by one effective sample transmittance; its spectrum, the slit function and true ruling-error ghosts are not modelled. Order overlap is exact for a fixed grating angle.",
    references: [
      { citation: "ASTM E387-04 (reapproved 2022). Standard Test Method for Estimating Stray Radiant Power Ratio of Dispersive Spectrophotometers by the Opaque Filter Method. ASTM International.", url: "https://doi.org/10.1520/E0387-04R22" },
      { citation: "Skoog D. A., Holler F. J., Crouch S. R. Principles of Instrumental Analysis, ch. 13 (stray radiation). Cengage." },
      { citation: "Palmer C., Loewen E. (2005). Diffraction Grating Handbook, 6th ed., ch. 2. Newport." },
    ],
  },
  {
    slug: "sum-frequency-gen",
    title: "Sum Frequency Generation Spectroscopy",
    description: "Surface-specific vibrational probe. SFG is forbidden in centrosymmetric media — only surfaces and interfaces contribute.",
    knownIssue: "The SFG spectrum is a fixed set of illustrative CH and OH Gaussians added without the χ(2) interference it states. Only the SFG wavelength is computed.",
  },
  {
    slug: "surface-enhanced-raman",
    title: "Surface-Enhanced Raman Spectroscopy (SERS)",
    description: "Electromagnetic SERS enhancement factor of a silver nanosphere: local field, |E|⁴ enhancement at the pole and over the surface, resonance and distance decay.",
    keywords: ["SERS Enhancement Factor", "Plasmonic Enhancement", "Localized Surface Plasmon"],
    related: [{ href: "/spectroscopy/raman-shift" }],
    tier: "textbook",
    modelNote: "Quasistatic (dipole) silver sphere with measured silver permittivity (Yang et al. 2015) and the |E|⁴ approximation, at the pole and averaged over the surface. Not modelled: retardation and radiation damping (spheres above about λ/10), surface damping in very small spheres, particle gaps (hot spots) and chemical enhancement.",
    references: [
      {
        citation: "Bohren C. F., Huffman D. R. (1983). Absorption and Scattering of Light by Small Particles, ch. 5. Wiley. Field of a sphere small compared with the wavelength.",
        url: "https://doi.org/10.1002/9783527618156",
      },
      {
        citation: "Le Ru E. C., Etchegoin P. G. (2006). Rigorous justification of the |E|⁴ enhancement factor in Surface Enhanced Raman Spectroscopy. Chem. Phys. Lett. 423, 63–66.",
        url: "https://doi.org/10.1016/j.cplett.2006.03.042",
      },
      {
        citation: "Le Ru E. C., Blackie E., Meyer M., Etchegoin P. G. (2007). Surface Enhanced Raman Scattering Enhancement Factors: A Comprehensive Study. J. Phys. Chem. C 111, 13794–13803. Maximum and surface-averaged enhancement factors.",
        url: "https://doi.org/10.1021/jp0687908",
      },
      {
        citation: "Yang H. U. et al. (2015). Optical dielectric function of silver. Phys. Rev. B 91, 235137. Silver permittivity.",
        url: "https://doi.org/10.1103/PhysRevB.91.235137",
      },
    ],
  },
  {
    slug: "terahertz-spectroscopy",
    title: "Terahertz (THz) Spectroscopy",
    description: "Probing low-energy excitations: phonon modes, hydrogen bonding, lattice vibrations (0.1–10 THz).",
    knownIssue: "The absorption features and Debye parameters are fixed made-up values, α ∝ f² is a heuristic, transmission leaves out reflection losses, and the refractive index is shown but never used.",
  },
  {
    slug: "time-resolved",
    title: "Time-Resolved Spectroscopy",
    description: "TCSPC and streak camera fundamentals. IRF convolution, temporal resolution, and decay analysis.",
    knownIssue: "The IRF is centred at zero and is far narrower than the time step, so the IRF-convolved curve is identical to the plain decay and the resolution check always passes.",
  },
  {
    slug: "transient-absorption",
    title: "Transient Absorption Spectroscopy",
    description: "A spectra vs delay time. Decompose into GSB, ESA, and SE contributions across the probe range.",
    lede: "ΔA spectra vs delay time. Decompose into GSB, ESA, and SE contributions across the probe range.",
    knownIssue: "The ΔA spectra use fixed hidden time constants and band shapes, the bleach recovers at a different rate than the excited state decays, and the kinetic trace ignores the SE centre.",
  },
  {
    slug: "two-dimensional",
    title: "Two-Dimensional (2D) Spectroscopy",
    description: "Correlates excitation and detection frequencies via three-pulse photon echo. Reveals coupling, energy transfer, and homogeneous vs inhomogeneous broadening.",
    knownIssue: "The 2D map is a sketch made of Gaussians: peaks are not stretched along the diagonal by inhomogeneous width, there are no negative ESA peaks, and coupling is used as the full state splitting.",
  },
  {
    slug: "wavenumber-converter",
    title: "Wavenumber Converter",
    description: "Convert wavelength, wavenumber, frequency, and energy with sliders, presets, and range sweeps.",
    lede: "Convert wavelength, wavenumber, frequency, and energy with presets, sliders, and range sweeps.",
    related: [{ href: "/spectroscopy/transient-absorption" }, { href: "/spectroscopy/two-dimensional" }],
  },
];
