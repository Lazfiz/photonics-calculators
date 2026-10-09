import type { CalculatorEntry } from "../types";

export const imaging: CalculatorEntry[] = [
  {
    slug: "3d-reconstruction",
    title: "3D Reconstruction Methods",
    description: "Compare 3D reconstruction approaches: resolution, sampling, voxel budgets, and method tradeoffs.",
  },
  {
    slug: "adaptive-optics",
    title: "Adaptive Optics Calculator",
    description: "AO correction performance, Strehl ratio, and deformable mirror requirements.",
    keywords: ["Adaptive Optics in Microscopy"],
  },
  {
    slug: "afocal",
    title: "Afocal System Calculator",
    description: "Design and analyze afocal (telescopic) relay systems — Keplerian and Galilean configurations.",
  },
  {
    slug: "airy-disk",
    title: "Airy Disk Size Calculator",
    description: "Calculate the Airy disk radius and Abbe diffraction limit from wavelength and numerical aperture.",
    lede: "Calculate the Airy disk radius and Abbe diffraction limit based on wavelength and numerical aperture.",
    keywords: ["diffraction limit", "abbe", "spot size"],
    priority: 94,
    related: [
      { href: "/imaging/adaptive-optics" },
      { href: "/imaging/afocal" },
      { href: "/imaging/cleared-tissue" },
      { href: "/imaging/coherent-raman" },
    ],
  },
  {
    slug: "cleared-tissue",
    title: "Cleared Tissue Imaging Calculator",
    description: "Optical clearing tissue imaging: resolution, transmission, ballistic photon fraction, and RI matching.",
  },
  {
    slug: "coherent-raman",
    title: "Coherent Raman (CARS/SRS) Calculator",
    description: "Coherent Anti-Stokes Raman Scattering and Stimulated Raman Scattering signal estimation.",
    keywords: ["CARS Imaging", "Coherent Raman Microscopy"],
    tier: "textbook",
    modelNote: "Wavelengths follow from energy conservation (exact); lineshapes are a single Lorentzian Raman line; focal intensity uses Zipfel's Gaussian fit. Signal levels are relative, as they need χ⁽³⁾ and the detection chain.",
    references: [
      {
        citation: "Cheng J.-X., Xie X. S. (2004). Coherent Anti-Stokes Raman Scattering Microscopy: Instrumentation, Theory, and Applications. J. Phys. Chem. B 108, 827–840. CARS and SRS signals and the Raman lineshape.",
        url: "https://doi.org/10.1021/jp035693v",
      },
      {
        citation: "Freudiger C. W. et al. (2008). Label-Free Biomedical Imaging with High Sensitivity by Stimulated Raman Scattering Microscopy. Science 322, 1857–1861. SRS; check case: a 816.8 nm pump and a 2845 cm⁻¹ shift give a 1064.07 nm Stokes beam.",
        url: "https://doi.org/10.1126/science.1165758",
      },
      {
        citation: "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. Nat. Biotechnol. 21, 1369–1377. Focal radius ω_xy at each beam's wavelength.",
        url: "https://doi.org/10.1038/nbt899",
      },
    ],
  },
  {
    slug: "computational-imaging",
    title: "Computational Imaging",
    description: "Multi-view fusion, resolution scaling, and SNR improvement through computational techniques.",
  },
  {
    slug: "computer-generated-holography",
    title: "Computer-Generated Holography",
    description: "CGH fundamentals: SLM parameters, diffraction efficiency, hologram memory, and reconstruction geometry.",
  },
  {
    slug: "confocal-pin-hole",
    title: "Confocal Pinhole Size",
    description: "Optimal pinhole 1 Airy unit (dAU/M). Trade-off: resolution vs signal.",
    lede: "Optimal pinhole ≈ 1 Airy unit (dAU/M). Trade-off: resolution vs signal.",
  },
  {
    slug: "confocal-resolution",
    title: "Confocal Resolution Calculator",
    description: "Compare lateral and axial resolution between widefield and confocal microscopy with adjustable pinhole size.",
  },
  {
    slug: "contrast-methods",
    title: "Phase Contrast & DIC Calculator",
    description: "Contrast calculations for phase contrast and differential interference contrast microscopy.",
  },
  {
    slug: "deconvolution",
    title: "Image Deconvolution",
    description: "Compare deconvolution algorithms: OTF analysis, convergence behavior, and resolution recovery.",
  },
  {
    slug: "denoising-algorithms",
    title: "Denoising Algorithms",
    description: "Compare denoising methods: noise reduction, detail preservation, and SNR improvement tradeoffs.",
  },
  {
    slug: "digital-holography",
    title: "Digital Holography",
    description: "Hologram recording, numerical reconstruction, resolution limits, and sampling criteria.",
  },
  {
    slug: "dof",
    title: "Depth of Field",
    description: "Microscope depth of field including diffraction and detector contributions.",
  },
  {
    slug: "dynamic-range",
    title: "Dynamic Range Calculator",
    description: "Imaging system dynamic range, noise floor, and ADC-limited performance analysis.",
    keywords: ["Full Well Capacity vs SNR"],
  },
  {
    slug: "expansion-microscopy",
    title: "Expansion Microscopy Calculator",
    description: "ExM effective resolution, probe size reduction, and expansion trade-offs.",
  },
  {
    slug: "fcs",
    title: "FCS Calculator",
    description: "Fluorescence Correlation Spectroscopy — diffusion time, concentration, and confocal volume.",
  },
  {
    slug: "fluorescence-spectra",
    title: "Fluorescence Spectra Overlap Calculator",
    description: "Compare excitation/emission spectra, spectral overlap, and filter crosstalk.",
  },
  {
    slug: "fov-calculator",
    title: "Field of View Calculator",
    description: "Calculate sample FOV from sensor dimensions and system magnification.",
  },
  {
    slug: "frap",
    title: "FRAP Diffusion Coefficient Calculator",
    description: "Calculate diffusion coefficients from Fluorescence Recovery After Photobleaching data.",
  },
  {
    slug: "hyperspectral-microscopy",
    title: "Hyperspectral Microscopy",
    description: "Configure hyperspectral data cubes: spectral range, bands, data size, acquisition time, and SNR tradeoffs.",
  },
  {
    slug: "illumination",
    title: "Köhler Illumination Calculator",
    description: "Design parameters for Köhler illumination including conjugate planes, fill factor, and field of view.",
  },
  {
    slug: "image-distance",
    title: "Thin Lens Image Distance",
    description: "Calculate image distance, magnification, and conjugate ratio for a thin lens.",
  },
  {
    slug: "light-field",
    title: "Light Field Microscopy",
    description: "Angular resolution, spatial-angular tradeoff, and synthetic aperture parameters.",
  },
  {
    slug: "light-sheet",
    title: "Light Sheet Microscopy Calculator",
    description: "Light sheet thickness, resolution, and Rayleigh range for LSFM/SPIM.",
    keywords: ["Light Sheet Microscopy Design", "Light Sheet Thickness"],
  },
  {
    slug: "low-coherence",
    title: "Low Coherence Interferometry",
    description: "Interferogram modelling, coherence gating, fringe visibility, and depth scanning parameters.",
  },
  {
    slug: "magnification",
    title: "Total Magnification Calculator",
    description: "Calculate total system magnification from objective, tube lens, and camera adapter lens.",
  },
  {
    slug: "mtf",
    title: "Modulation Transfer Function",
    description: "Diffraction-limited incoherent MTF with defocus effects.",
  },
  {
    slug: "multiphoton-depth",
    title: "Multiphoton Imaging Depth Calculator",
    description: "Two-photon excitation depth penetration, resolution, and laser parameters.",
    tier: "textbook",
    modelNote: "Zipfel's Gaussian focus fit plus exp(−µz) attenuation with one extinction coefficient, counting ballistic photons only. The default µ_s = 6 mm⁻¹ is in vivo mouse cortex at 800 nm.",
    references: [
      {
        citation: "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. Nat. Biotechnol. 21, 1369–1377. Gaussian fit to the squared illumination PSF.",
        url: "https://doi.org/10.1038/nbt899",
      },
      {
        citation: "Kobat D., Horton N. G., Xu C. (2011). In vivo two-photon microscopy to 1.6-mm depth in mouse cortex. J. Biomed. Opt. 16, 106014. Depth limit of 5–6 attenuation lengths in in vivo mouse cortex at 800 nm, behind the default µ_s.",
        url: "https://doi.org/10.1117/1.3646209",
      },
    ],
  },
  {
    slug: "na-fnumber",
    title: "NA f/# Conversion",
    description: "NA = 1/(2f/#) for objects at infinity. Relates numerical aperture to f-number.",
    heading: "NA ↔ f/# Conversion",
    lede: "NA = 1/(2·f/#) for objects at infinity. Relates numerical aperture to f-number.",
  },
  {
    slug: "optical-coherence",
    title: "Optical Coherence Theory",
    description: "Temporal coherence, coherence length, axial resolution, and SNR estimation for OCT systems.",
  },
  {
    slug: "optical-power",
    title: "Optical Power (Diopters)",
    description: "Convert between focal length and optical power, with an eye model reference.",
  },
  {
    slug: "optical-sectioning-thickness",
    title: "Optical Sectioning Thickness Calculator",
    description: "Compare optical sectioning capability across widefield, confocal, and multiphoton microscopy techniques.",
    tier: "textbook",
    modelNote: "Paraxial and fitted formulas: confocal sections for a finite (≥ 1 AU) and a point-like pinhole, two-photon from Zipfel's fit. Widefield has no optical sectioning; its depth of field is the first axial zero.",
    references: [
      {
        citation: "Wilhelm R., Gröbler B., Gluch M., Heinz H. (2003). Confocal Laser Scanning Microscopy: Principles. Carl Zeiss. Optical-section FWHM for a finite and a point-like pinhole.",
      },
      {
        citation: "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. Nat. Biotechnol. 21, 1369–1377. Axial radius of the two-photon excitation (fit for NA > 0.7).",
        url: "https://doi.org/10.1038/nbt899",
      },
      {
        citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., §8.8. Cambridge University Press. Widefield depth of field 2nλ/NA².",
      },
    ],
  },
  {
    slug: "palm-storm",
    title: "PALM/STORM Localization Calculator",
    description: "Estimate effective resolution for single-molecule localization microscopy (PALM/STORM) based on localization precision and labeling density.",
  },
  {
    slug: "photoacoustic",
    title: "Photoacoustic Imaging Calculator",
    description: "Imaging depth, resolution, and signal estimation for photoacoustic microscopy/tomography.",
  },
  {
    slug: "pixel-fov",
    title: "Pixel Field of View",
    description: "Calculate the angular field of view per pixel from pixel size and focal length.",
  },
  {
    slug: "plenoptic-camera",
    title: "Plenoptic Camera Design",
    description: "Light field camera parameters: spatial-angular tradeoff, refocusing range, and data budgets.",
  },
  {
    slug: "psf-calculator",
    title: "Point Spread Function Calculator",
    description: "Visualize the 2D and 1D point spread function (PSF) for a diffraction-limited system.",
  },
  {
    slug: "pupil-matching",
    title: "Pupil Matching in Microscopy",
    description: "Exit pupil = (2ftubeNA)/(MobjMeyepiece). Match to eye pupil (2-8mm) for optimal brightness.",
    lede: "Exit pupil = (2·ftube·NA)/(Mobj·Meyepiece). Match to eye pupil (2-8mm) for optimal brightness.",
  },
  {
    slug: "registration",
    title: "Image Registration",
    description: "Calculate transformation parameters, registration accuracy, and evaluate different registration approaches.",
  },
  {
    slug: "resolution",
    title: "Resolution Calculator",
    description: "Abbe and Rayleigh lateral resolution limits for diffraction-limited imaging.",
  },
  {
    slug: "second-harmonic-generation",
    title: "Second Harmonic Generation (SHG) Calculator",
    description: "SHG signal properties, wavelength conversion, and imaging resolution for collagen and other non-centrosymmetric structures.",
    keywords: ["Harmonic Generation Microscopy", "Second-Harmonic Generation Microscopy"],
    tier: "textbook",
    modelNote: "Focused Gaussian beam in a uniform slab, focus at the centre; no walk-off or absorption, undepleted pump, paraxial (indicative above NA ≈ 0.5). The Gouy phase cancels SHG from a thick uniform slab in normal dispersion.",
    references: [
      {
        citation: "Boyd G. D., Kleinman D. A. (1968). Parametric Interaction of Focused Gaussian Light Beams. J. Appl. Phys. 39, 3597–3639.",
        url: "https://doi.org/10.1063/1.1656831",
      },
      {
        citation: "Boyd R. W. (2008). Nonlinear Optics, 3rd ed., §2.7 and §2.10. Academic Press. Plane-wave limit and Gouy-phase cancellation.",
      },
      {
        citation: "Xu C., Webb W. W. (1996). Measurement of two-photon excitation cross sections of molecular fluorophores with data from 690 to 1050 nm. J. Opt. Soc. Am. B 13, 481. Peak-power factor g_p of a Gaussian pulse.",
        url: "https://doi.org/10.1364/josab.13.000481",
      },
      {
        citation: "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. Nat. Biotechnol. 21, 1369–1377. Gaussian focus w₀ = 2ω_xy.",
        url: "https://doi.org/10.1038/nbt899",
      },
    ],
  },
  {
    slug: "selective-plane",
    title: "Selective Plane Illumination Calculator",
    description: "SPIM illumination parameters: sheet thickness, beam waist, Rayleigh range, and confocal parameter.",
  },
  {
    slug: "sensor-ccm",
    title: "CCD/CCM Sensor Design",
    description: "CCD sensor parameters, cooling requirements, dark current, and dynamic range analysis.",
  },
  {
    slug: "sensor-cmos",
    title: "CMOS Sensor Design",
    description: "Pixel design parameters, dynamic range, noise floor, and sensitivity calculations.",
  },
  {
    slug: "shack-hartmann",
    title: "Shack-Hartmann Sensor",
    description: "SHWFS design: spot size, centroid precision, sensitivity, dynamic range, and sub-aperture layout.",
    keywords: ["Wavefront Sensing", "Shack-Hartmann Wavefront Sensor"],
    tier: "textbook",
    modelNote: "Diffraction-limited lenslet spots; dynamic range is the tilt at which a spot stays inside its own sub-aperture. Centroid noise is the photon limit for a Gaussian spot; read noise, background and pixelation are neglected.",
    references: [
      {
        citation: "Akondi V., Dubra A. (2021). Shack-Hartmann wavefront sensor optical dynamic range. Opt. Express 29, 8417. Eq. 2 (lenslet-bound dynamic range).",
        url: "https://doi.org/10.1364/oe.419311",
      },
      {
        citation: "Mahajan V. N. (1983). Strehl ratio for primary aberrations in terms of their aberration variance. J. Opt. Soc. Am. 73, 860. Extended Maréchal approximation of the Strehl ratio.",
        url: "https://doi.org/10.1364/josa.73.000860",
      },
    ],
  },
  {
    slug: "signal-to-noise",
    title: "Imaging Signal-to-Noise Ratio",
    description: "Comprehensive SNR calculation for microscopy imaging systems.",
  },
  {
    slug: "simultaneous-multicolor",
    title: "Simultaneous Multicolor Imaging",
    description: "Calculate spectral separation, crosstalk, timing budgets, and SNR for multi-channel fluorescence imaging.",
  },
  {
    slug: "speckle-imaging",
    title: "Speckle Imaging",
    description: "Speckle size, contrast, averaging strategies, and surface roughness effects.",
  },
  {
    slug: "spectral-unmixing",
    title: "Spectral Unmixing",
    description: "Decompose mixed spectral signals into constituent endmember abundances using linear unmixing methods.",
  },
  {
    slug: "spinning-disk",
    title: "Spinning Disk Confocal Calculator",
    description: "Pinhole size, optical sectioning, and frame rate for spinning disk confocal microscopy.",
  },
  {
    slug: "stimulated-raman-microscopy",
    title: "Stimulated Raman Scattering Microscopy Calculator",
    description: "Calculate SRS signal levels, SNR, resolution, and imaging speed for label-free chemical imaging.",
  },
  {
    slug: "stitching",
    title: "Image Stitching",
    description: "Calculate tile grid parameters, overlap, blending profiles, and stitching accuracy for large-area microscopy.",
  },
  {
    slug: "strehl-ratio",
    title: "Strehl Ratio Calculator",
    description: "Estimate the Strehl ratio from wavefront error using the Maréchal approximation.",
  },
  {
    slug: "structured-illumination",
    title: "Structured Illumination Microscopy",
    description: "SIM resolution enhancement and OTF expansion via patterned illumination.",
  },
  {
    slug: "sum-frequency-microscopy",
    title: "Sum-Frequency Generation Microscopy Calculator",
    description: "Calculate SFG wavelengths, energies, and beam parameters for sum-frequency generation microscopy.",
  },
  {
    slug: "super-resolution",
    title: "Super-Resolution Calculator",
    description: "STED and PALM/STORM resolution limits beyond the diffraction barrier.",
    keywords: ["STED Super-Resolution"],
    tier: "textbook",
    modelNote: "STED resolution law and the shot-noise limit of single-molecule localization. Pixelation, background and EMCCD excess noise (×√2) make real localization worse; 2D localization gives no axial position.",
    references: [
      {
        citation: "Westphal V., Hell S. W. (2005). Nanoscale Resolution in the Focal Plane of an Optical Microscope. Phys. Rev. Lett. 94, 143903. STED resolution d = λ/(2NA√(1 + I/I_s)).",
        url: "https://doi.org/10.1103/physrevlett.94.143903",
      },
      {
        citation: "Zhang B., Zerubia J., Olivo-Marin J.-C. (2007). Gaussian approximations of fluorescence microscope point-spread function models. Appl. Opt. 46, 1819. Gaussian width 0.21 λ/NA that best fits the Airy PSF.",
        url: "https://doi.org/10.1364/ao.46.001819",
      },
      {
        citation: "Thompson R. E., Larson D. R., Webb W. W. (2002). Precise Nanometer Localization Analysis for Individual Fluorescent Probes. Biophys. J. 82, 2775–2783. Shot-noise limit of localization precision.",
        url: "https://doi.org/10.1016/s0006-3495(02)75618-x",
      },
      {
        citation: "Mortensen K. I. et al. (2010). Optimized localization analysis for single-molecule tracking and super-resolution microscopy. Nat. Methods 7, 377–381. Pixelation and EMCCD excess noise (×√2) make localization worse.",
        url: "https://doi.org/10.1038/nmeth.1447",
      },
    ],
  },
  {
    slug: "telecentricity",
    title: "Telecentric Lens Design",
    description: "Telecentric lenses maintain constant magnification regardless of object distance. Chief rays are parallel to optical axis.",
  },
  {
    slug: "third-harmonic-microscopy",
    title: "Third-Harmonic Generation Microscopy Calculator",
    description: "Calculate THG wavelength, signal intensity, and resolution for label-free interface and heterogeneity imaging.",
    keywords: ["Third Harmonic Generation (THG)"],
    tier: "textbook",
    modelNote: "Focal size from Zipfel's Gaussian fit (I³ source). The signal is not predicted: in a homogeneous medium the Gouy phase cancels THG, so it appears only at interfaces, and the charts show scaling only.",
    references: [
      {
        citation: "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. Nat. Biotechnol. 21, 1369–1377. Gaussian fit to the squared illumination PSF.",
        url: "https://doi.org/10.1038/nbt899",
      },
      { citation: "Boyd R. W. (2008). Nonlinear Optics, 3rd ed., §2.10. Academic Press. Gouy-phase cancellation of the third harmonic." },
      {
        citation: "Barad Y. et al. (1997). Nonlinear scanning laser microscopy by third harmonic generation. Appl. Phys. Lett. 70, 922–924. Cited for THG appearing only where χ⁽³⁾ or n changes within the focus.",
        url: "https://doi.org/10.1063/1.118442",
      },
    ],
  },
  {
    slug: "three-photon-microscopy",
    title: "Three-Photon Microscopy Calculator",
    description: "Calculate resolution, excitation volume, and depth penetration for three-photon excitation microscopy at 1300+ nm.",
    tier: "textbook",
    modelNote: "Zipfel's Gaussian fit extended to the cubed intensity; its lateral FWHM is about 1.5 % wide against the Airy pattern. Ballistic depth model only; aberrations and out-of-focus background are not included.",
    references: [
      {
        citation: "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. Nat. Biotechnol. 21, 1369–1377. Gaussian fit to the squared illumination PSF, extended here to I³.",
        url: "https://doi.org/10.1038/nbt899",
      },
      {
        citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., §8.5. Cambridge University Press. Exact paraxial Airy pattern the fit was checked against.",
      },
    ],
  },
  {
    slug: "tirf",
    title: "TIRF Penetration Depth Calculator",
    description: "Evanescent field penetration depth for Total Internal Reflection Fluorescence microscopy.",
  },
  {
    slug: "two-photon-microscopy",
    title: "Two-Photon Microscopy Calculator",
    description: "Calculate resolution, excitation volume, peak intensity, and depth penetration for two-photon fluorescence microscopy.",
    keywords: ["Two-Photon Excitation"],
    tier: "textbook",
    modelNote: "Gaussian fit to the diffraction-limited focus of a filled pupil, with Gaussian pulses. The depth model counts only ballistic excitation photons; aberrations and out-of-focus background are not included.",
    references: [
      {
        citation: "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. Nat. Biotechnol. 21, 1369–1377. Gaussian fit to the squared illumination PSF.",
        url: "https://doi.org/10.1038/nbt899",
      },
      {
        citation: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., §8.5. Cambridge University Press. Exact paraxial Airy pattern the fit was checked against.",
      },
    ],
  },
  {
    slug: "wavefront-error",
    title: "Wavefront Error Analysis",
    description: "Analyze wavefront error in waves RMS, compute Strehl ratio, and check diffraction-limited condition.",
  },
  {
    slug: "working-distance",
    title: "Working Distance Calculator",
    description: "Calculate working distance from objective focal length and magnification.",
  },
];
