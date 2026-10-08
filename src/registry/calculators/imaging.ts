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
  },
  {
    slug: "adaptive-optics-microscopy",
    title: "Adaptive Optics in Microscopy",
    description: "Wavefront correction, Strehl ratio recovery, and resolution improvement for deep-tissue imaging.",
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
      { href: "/imaging/coherent-anti-stokes" },
    ],
  },
  {
    slug: "cleared-tissue",
    title: "Cleared Tissue Imaging Calculator",
    description: "Optical clearing tissue imaging: resolution, transmission, ballistic photon fraction, and RI matching.",
  },
  {
    slug: "coherent-anti-stokes",
    title: "CARS Imaging Calculator",
    description: "Coherent Anti-Stokes Raman Scattering: vibrational shift, CARS wavelength, and laser parameters.",
  },
  {
    slug: "coherent-raman",
    title: "Coherent Raman (CARS/SRS) Calculator",
    description: "Coherent Anti-Stokes Raman Scattering and Stimulated Raman Scattering signal estimation.",
  },
  {
    slug: "coherent-raman-microscopy",
    title: "Coherent Raman Microscopy Calculator",
    description: "Calculate Stokes wavelengths, spectral resolution, and spatial resolution for CARS and SRS microscopy.",
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
    heading: "Phase Contrast &amp; DIC Calculator",
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
    slug: "harmonic-generation",
    title: "Harmonic Generation Microscopy Calculator",
    description: "Calculate harmonic wavelengths, peak intensities, and conversion efficiencies for nonlinear harmonic generation microscopy.",
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
  },
  {
    slug: "light-sheet-microscopy",
    title: "Light Sheet Microscopy Design Calculator",
    description: "Full light sheet microscope design parameters: sheet geometry, tilt geometry, and volume imaging.",
  },
  {
    slug: "light-sheet-thickness",
    title: "Light Sheet Thickness Calculator",
    description: "Calculate the thickness and propagation characteristics of a Gaussian light sheet for light-sheet fluorescence microscopy (LSFM).",
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
    slug: "optical-sectioning",
    title: "Optical Sectioning Calculator",
    description: "Optical section thickness for confocal and widefield microscopy.",
  },
  {
    slug: "optical-sectioning-thickness",
    title: "Optical Sectioning Thickness Calculator",
    description: "Compare optical sectioning capability across widefield, confocal, and multiphoton microscopy techniques.",
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
    slug: "second-harmonic",
    title: "Second Harmonic Generation Calculator",
    description: "SHG signal estimation, coherence length, and phase matching for nonlinear imaging.",
  },
  {
    slug: "second-harmonic-generation",
    title: "Second Harmonic Generation (SHG) Calculator",
    description: "SHG signal properties, wavelength conversion, and imaging resolution for collagen and other non-centrosymmetric structures.",
  },
  {
    slug: "second-harmonic-microscopy",
    title: "Second-Harmonic Generation Microscopy Calculator",
    description: "Calculate SHG wavelength, resolution, phase matching, and signal strength for SHG microscopy of collagen, muscle, and other non-centrosymmetric structures.",
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
    slug: "sted-resolution",
    title: "STED Super-Resolution Calculator",
    description: "Calculate STED (Stimulated Emission Depletion) microscopy resolution based on saturation intensity and depletion parameters.",
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
  },
  {
    slug: "telecentricity",
    title: "Telecentric Lens Design",
    description: "Telecentric lenses maintain constant magnification regardless of object distance. Chief rays are parallel to optical axis.",
  },
  {
    slug: "third-harmonic-generation",
    title: "Third Harmonic Generation (THG) Calculator",
    description: "THG imaging parameters for interface and membrane contrast in biological samples.",
  },
  {
    slug: "third-harmonic-microscopy",
    title: "Third-Harmonic Generation Microscopy Calculator",
    description: "Calculate THG wavelength, signal intensity, and resolution for label-free interface and heterogeneity imaging.",
  },
  {
    slug: "three-photon-microscopy",
    title: "Three-Photon Microscopy Calculator",
    description: "Calculate resolution, excitation volume, and depth penetration for three-photon excitation microscopy at 1300+ nm.",
  },
  {
    slug: "tirf",
    title: "TIRF Penetration Depth Calculator",
    description: "Evanescent field penetration depth for Total Internal Reflection Fluorescence microscopy.",
  },
  {
    slug: "two-photon",
    title: "Two-Photon Microscopy Calculator",
    description: "Excitation wavelength, resolution, and pulse parameters for two-photon fluorescence microscopy.",
  },
  {
    slug: "two-photon-excitation",
    title: "Two-Photon Excitation Calculator",
    description: "Calculate two-photon excitation wavelength, peak power, and pulse energy from laser parameters.",
  },
  {
    slug: "two-photon-microscopy",
    title: "Two-Photon Microscopy Calculator",
    description: "Calculate resolution, excitation volume, peak intensity, and depth penetration for two-photon fluorescence microscopy.",
  },
  {
    slug: "wavefront-error",
    title: "Wavefront Error Analysis",
    description: "Analyze wavefront error in waves RMS, compute Strehl ratio, and check diffraction-limited condition.",
  },
  {
    slug: "wavefront-sensing",
    title: "Wavefront Sensing",
    description: "Wavefront error analysis, Zernike decomposition, Strehl ratio, and sensor sensitivity.",
  },
  {
    slug: "wavefront-sensor",
    title: "Shack-Hartmann Wavefront Sensor Calculator",
    description: "Design parameters for Shack-Hartmann wavefront sensors including spot size, sensitivity, and dynamic range.",
  },
  {
    slug: "working-distance",
    title: "Working Distance Calculator",
    description: "Calculate working distance from objective focal length and magnification.",
  },
];
