import type { CalculatorEntry } from "../types";

export const imaging: CalculatorEntry[] = [
  {
    slug: "3d-reconstruction",
    title: "3D Reconstruction Methods",
    description: "Compare 3D reconstruction approaches: resolution, sampling, voxel budgets, and method tradeoffs.",
    knownIssue: "The confocal axial resolution is 0.7 × the widefield first-zero distance (1024 nm) where the site's confocal module gives 777 nm, the number of views is unused, and the Rayleigh 0.61λ/NA is labelled Abbe.",
  },
  {
    slug: "adaptive-optics",
    title: "Adaptive Optics Calculator",
    description: "AO correction performance, Strehl ratio, and deformable mirror requirements.",
    keywords: ["Adaptive Optics in Microscopy"],
    knownIssue: "The corrected residual σ₀√(1 − N/(N + 4)) is invented: 15 modes leave 21 % of the phase variance against Noll's 2.7 %, so the corrected Strehl reads 0.13, not about 0.76. Hudgin's 0.28 multiplies σ instead of σ².",
  },
  {
    slug: "afocal",
    title: "Afocal System Calculator",
    description: "Design and analyze afocal (telescopic) relay systems — Keplerian and Galilean configurations.",
    knownIssue: "Any negative focal length is called Galilean, even when the lens spacing would be negative. Away from the afocal spacing the angular magnification depends on ray height but is shown as one number, and f₂ = 0 shows −Infinity.",
  },
  {
    slug: "airy-disk",
    title: "Airy Disk Size Calculator",
    description: "Calculate the Airy disk radius and Abbe diffraction limit from wavelength and numerical aperture.",
    lede: "Calculate the Airy disk radius and Abbe diffraction limit based on wavelength and numerical aperture.",
    keywords: ["diffraction limit", "abbe", "spot size"],
    priority: 94,
    tier: "textbook",
    modelNote: "Scalar Airy pattern of an aberration-free, uniformly filled circular pupil. Above NA ≈ 0.9 the polarized focus is up to 10–20 % wider; a Gaussian-filled pupil gives a wider, ringless spot.",
    references: [
      {
        citation: "Born M., Wolf E. (2019). Principles of Optics, 7th ed., §8.5.2. Cambridge University Press. Airy pattern [2J₁(v)/v]² and encircled energy 1 − J₀² − J₁².",
        url: "https://doi.org/10.1017/9781108769914",
      },
    ],
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
    knownIssue: "The maximum depth WD·NA/n and the (NA/n)⁴ index penalty are invented, transmission and ballistic fraction are the same expression, and the default µa and µs (100, 200 cm⁻¹) are uncleared values (T = 9e-14).",
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
    knownIssue: "The background input is labelled as noise in electrons but used as a variance, so an rms value gives the wrong SNR, and the resolution outputs don't depend on any computational parameter.",
  },
  {
    slug: "computer-generated-holography",
    title: "Computer-Generated Holography",
    description: "CGH fundamentals: SLM parameters, diffraction efficiency, hologram memory, and reconstruction geometry.",
    knownIssue: "The FOV shows the SLM aperture N·Δx (15.4 mm), not the replay field λz/Δx (39.6 mm at 500 mm), and the reconstruction distance and several other inputs are not used.",
  },
  {
    slug: "confocal-pin-hole",
    title: "Confocal Pinhole Size",
    description: "Optimal pinhole 1 Airy unit (dAU/M). Trade-off: resolution vs signal.",
    lede: "Optimal pinhole ≈ 1 Airy unit (dAU/M). Trade-off: resolution vs signal.",
    knownIssue: "The axial curve is invented and saturates (754 nm at 3 AU against about 2.0 µm), the throughput uses a Gaussian instead of the Airy encircled energy (0.39 against 0.59 at 0.5 AU), and the pinhole shows as 25520.00 nm.",
  },
  {
    slug: "confocal-resolution",
    title: "Confocal Resolution Calculator",
    description: "Compare lateral and axial resolution between widefield and confocal microscopy with adjustable pinhole size.",
    knownIssue: "The confocal lateral resolution 0.7λ/NA (275 nm) is worse than the widefield 0.61λ/NA (240 nm) beside it; Wilhelm gives about 200 nm at 1 AU. The pinhole size changes neither the lateral nor the axial value.",
  },
  {
    slug: "contrast-methods",
    title: "Phase Contrast & DIC Calculator",
    description: "Contrast calculations for phase contrast and differential interference contrast microscopy.",
    knownIssue: "The DIC contrast ignores the shear and the phase gradient, and the phase-contrast 2·sinφ·sinδ is not Zernike's result (0.564 against 0.645 at the defaults). The medium index and the method selection are not used.",
  },
  {
    slug: "deconvolution",
    title: "Image Deconvolution",
    description: "Compare deconvolution algorithms: OTF analysis, convergence behavior, and resolution recovery.",
    knownIssue: "A hard-coded gain per method claims 150 nm, below the passband limit λ/(2NA) = 196 nm at 550 nm, NA 1.4. The convergence curves are invented, also for the one-step Wiener filter, and the RL restored OTF is 1 everywhere.",
  },
  {
    slug: "denoising-algorithms",
    title: "Denoising Algorithms",
    description: "Compare denoising methods: noise reduction, detail preservation, and SNR improvement tradeoffs.",
    knownIssue: "All outputs come from a hard-coded improvement table subtracted from σ, and the denoised trace is built from the clean signal. Only the linear and median filters have closed-form noise gains (a 3×3 box gives σ/3, 9.54 dB).",
  },
  {
    slug: "digital-holography",
    title: "Digital Holography",
    description: "Hologram recording, numerical reconstruction, resolution limits, and sampling criteria.",
    knownIssue: "The axial resolution computes 2nλ/NA² but shows λ/NA² (106 against 53 µm), the lateral limit uses the incoherent λ/(2NA), and NA is a free input instead of following from sensor size and distance.",
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
    knownIssue: "PRNU defaults to 0.01 on an input labelled %, i.e. 0.01 % instead of 1 %, so the SNR at half full well reads 122 instead of 77.5. DSNU is taken as a percentage of the tiny dark signal, so it has no effect; EMVA 1288 gives it in e⁻.",
  },
  {
    slug: "expansion-microscopy",
    title: "Expansion Microscopy Calculator",
    description: "ExM effective resolution, probe size reduction, and expansion trade-offs.",
    knownIssue: "Probe and linker sizes are divided by the expansion factor and left out of the effective resolution, which falls to 12.5 nm at 20× instead of about 22 nm once the linkage error of pre-expansion labelling is included.",
  },
  {
    slug: "fcs",
    title: "FCS Calculator",
    description: "Fluorescence Correlation Spectroscopy — diffusion time, concentration, and confocal volume.",
    knownIssue: "Molecular brightness is labelled kHz but used in Hz, so the default reads 30 MHz per molecule. The SNR chart falls as 1/√c, whereas Koppel's SNR does not depend on the number of molecules, and the triplet term should be T/(1 − T).",
  },
  {
    slug: "fluorescence-spectra",
    title: "Fluorescence Spectra Overlap Calculator",
    description: "Compare excitation/emission spectra, spectral overlap, and filter crosstalk.",
    knownIssue: "Dye peaks, widths and quantum yields are unsourced, the spectral overlap J is not the Förster integral (no extinction coefficient, no λ⁴), a dye index past the list in the URL crashes the page, and the filter inputs produce no result.",
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
    knownIssue: "The unsourced τ = τ½/3.7723 gives D 4.2× too high (0.47 against 0.112 µm²/s for w = 1 µm, τ½ = 2 s; Soumpasis 1983). The recovery series diverges at short times and always recovers to 1, ignoring the mobile fraction.",
  },
  {
    slug: "hyperspectral-microscopy",
    title: "Hyperspectral Microscopy",
    description: "Configure hyperspectral data cubes: spectral range, bands, data size, acquisition time, and SNR tradeoffs.",
    knownIssue: "The SNR input only adds a constant 0.05·10^(−SNR/20) offset to the spectrum, so it changes nothing; the photon budget per band is not modelled; the data size is in MiB but labelled MB.",
  },
  {
    slug: "illumination",
    title: "Köhler Illumination Calculator",
    description: "Design parameters for Köhler illumination including conjugate planes, fill factor, and field of view.",
    knownIssue: "The condenser magnification f_TL/f_c has no meaning in Köhler illumination, the field diaphragm is divided by M as if it were the field number, and three computed values are never shown.",
  },
  {
    slug: "image-distance",
    title: "Thin Lens Image Distance",
    description: "Calculate image distance, magnification, and conjugate ratio for a thin lens.",
    knownIssue: "Virtual images (object inside the focal length) are refused with an error, so the virtual and upright branch never shows, and the conjugate ratio promised in the description isn't displayed.",
  },
  {
    slug: "light-field",
    title: "Light Field Microscopy",
    description: "Angular resolution, spatial-angular tradeoff, and synthetic aperture parameters.",
    knownIssue: "An NA of 0 in the URL hangs the page. The lateral resolution shows 0.61λ/NA (1.68 µm) where a light-field microscope samples at the lenslet pitch over M (7.5 µm), and the angular count ignores diffraction (23 against 5.8).",
  },
  {
    slug: "light-sheet",
    title: "Light Sheet Microscopy Calculator",
    description: "Light sheet thickness, resolution, and Rayleigh range for LSFM/SPIM.",
    keywords: ["Light Sheet Microscopy Design", "Light Sheet Thickness"],
    knownIssue: "The effective axial resolution adds the sheet thickness and the detection depth of field in quadrature, 3.71 µm at the defaults. The system PSF is their product, about 1.21 µm as Gaussian FWHMs.",
  },
  {
    slug: "low-coherence",
    title: "Low Coherence Interferometry",
    description: "Interferogram modelling, coherence gating, fringe visibility, and depth scanning parameters.",
    knownIssue: "The axial resolution has the same factor-2 error (3.33 µm instead of 6.66 µm at 1300 nm, 80 nm, n 1.4), and the interferogram chart samples every 20 µm, so the 1.3 µm fringes and the 19 µm envelope show as one aliased spike.",
  },
  {
    slug: "magnification",
    title: "Total Magnification Calculator",
    description: "Calculate total system magnification from objective, tube lens, and camera adapter lens.",
    knownIssue: "The camera adapter magnification is taken as f_cam/f_tube, so the tube lens cancels and the total is just f_cam/f_obj. A real C-mount adapter is a relay with its own magnification (0.5×, 0.63×, 1×), which the page cannot express.",
  },
  {
    slug: "mtf",
    title: "Modulation Transfer Function",
    description: "Diffraction-limited incoherent MTF with defocus effects.",
    knownIssue: "An NA or wavelength of 0 in the URL hangs the page. The defocus factor exp(−2(W·s)²) is invented: at NA 0.95, 0.5 µm defocus it gives 0.014 at half cutoff where the Hopkins OTF gives 0.156, with no contrast reversal.",
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
    tier: "exact",
    modelNote: "NA = 1/(2N) holds exactly for a lens that obeys the sine condition, object at infinity, in air. The thin-lens tangent form is shown for comparison; finite conjugates need the working f-number.",
    references: [
      {
        citation: "Born M., Wolf E. (2019). Principles of Optics, 7th ed., ch. 4. Cambridge University Press. Abbe sine condition for aplanatic imaging.",
        url: "https://doi.org/10.1017/9781108769914",
      },
    ],
  },
  {
    slug: "optical-coherence",
    title: "Optical Coherence Theory",
    description: "Temporal coherence, coherence length, axial resolution, and SNR estimation for OCT systems.",
    knownIssue: "The axial resolution divides the round-trip coherence length (2 ln2/π)λ²/Δλ by 2n, so it is half the true value: 2.85 µm instead of 5.69 µm at 1310 nm, 100 nm, n 1.33. The SNR uses an arbitrary 1 nA noise floor and no reference-arm power.",
  },
  {
    slug: "optical-power",
    title: "Optical Power (Diopters)",
    description: "Convert between focal length and optical power, with an eye model reference.",
    knownIssue: "The refractive error is the eye's power minus a fixed 60 D with no axial length, so the default eye reads −1.1 D hyperopic, and its sign is the opposite of the clinical convention (−1.1 D shown next to a +1.1 D correcting lens).",
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
    knownIssue: "The localisation precision σ is combined with the Nyquist term instead of the FWHM 2.355σ: 44.7 nm against 61.8 nm at the defaults (Legant 2016). The pixel size input is not used.",
  },
  {
    slug: "photoacoustic",
    title: "Photoacoustic Imaging Calculator",
    description: "Imaging depth, resolution, and signal estimation for photoacoustic microscopy/tomography.",
    knownIssue: "The axial resolution uses the pulse-echo v/(2Δf), but detection is one-way (0.88·v/Δf). The ANSI note says 20 mJ/cm² at 750 nm (MPE ≈ 25), Γ defaults to 0.8 (tissue ≈ 0.2), and the laser inputs are unused.",
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
    knownIssue: "The depth chart disagrees with its own marker (0.375 against 10.125 mm), the microlens and main-lens f-numbers aren't matched (f/3.33 against f/2.5, so micro-images overlap), and two inputs are unused.",
  },
  {
    slug: "psf-calculator",
    title: "Point Spread Function Calculator",
    description: "Visualize the 2D and 1D point spread function (PSF) for a diffraction-limited system.",
    tier: "textbook",
    modelNote: "Scalar PSF of an aberration-free, uniformly filled pupil: the Airy pattern laterally, the on-axis Debye sinc² axially (the paraxial sinc²(u/4) at low NA). No polarization, coverslip or index-mismatch effects.",
    references: [
      {
        citation: "Born M., Wolf E. (2019). Principles of Optics, 7th ed., §8.5.2 and §8.8. Cambridge University Press. Airy pattern and the paraxial intensity near focus.",
        url: "https://doi.org/10.1017/9781108769914",
      },
      {
        citation: "Wilhelm R., Gröbler B., Gluch M., Heinz H. (2003). Confocal Laser Scanning Microscopy: Principles. Carl Zeiss. Axial FWHM 0.88 λ/(n − √(n² − NA²)).",
      },
    ],
  },
  {
    slug: "pupil-matching",
    title: "Pupil Matching in Microscopy",
    description: "Exit pupil = (2ftubeNA)/(MobjMeyepiece). Match to eye pupil (2-8mm) for optimal brightness.",
    lede: "Exit pupil = (2·ftube·NA)/(Mobj·Meyepiece). Match to eye pupil (2-8mm) for optimal brightness.",
    knownIssue: "The lede's formula uses the tube-lens focal length where the 250 mm eyepiece reference belongs, 20 % low (the computation itself is right). The tube-lens input does nothing, inputs have no limits, and the optimal NA can read 3.2.",
  },
  {
    slug: "registration",
    title: "Image Registration",
    description: "Calculate transformation parameters, registration accuracy, and evaluate different registration approaches.",
    knownIssue: "Nothing is computed from a model: the RMSE is the true displacement times a fixed per-method fraction plus noise, the error curves are hard-coded, and the displacement RMS uses the edge rotation (1067 against 934 nm).",
  },
  {
    slug: "resolution",
    title: "Resolution Calculator",
    description: "Abbe and Rayleigh lateral resolution limits for diffraction-limited imaging.",
    tier: "textbook",
    modelNote: "Classical two-point and grating criteria for incoherent, aberration-free imaging with a uniformly filled pupil. The axial FWHM is the widefield on-axis PSF; NA must stay below the medium index.",
    references: [
      {
        citation: "Born M., Wolf E. (2019). Principles of Optics, 7th ed., §8.6.2. Cambridge University Press. Rayleigh resolving power 0.61 λ/NA.",
        url: "https://doi.org/10.1017/9781108769914",
      },
      {
        citation: "Wilhelm R., Gröbler B., Gluch M., Heinz H. (2003). Confocal Laser Scanning Microscopy: Principles. Carl Zeiss. Axial FWHM 0.88 λ/(n − √(n² − NA²)).",
      },
    ],
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
    knownIssue: "The illumination term is twice the Rayleigh range, the sheet's length along the beam, so the result collapses to the detection depth of field (1.42 µm against about 1.03 µm). Light-sheet gives 6.37 µm on these inputs.",
  },
  {
    slug: "sensor-ccm",
    title: "CCD/CCM Sensor Design",
    description: "CCD sensor parameters, cooling requirements, dark current, and dynamic range analysis.",
    knownIssue: "The QE and pixel-pitch inputs are unused, the default dark rate of 0.005 e⁻/s per pixel at 25 °C is about 10⁴× below a typical CCD, and the dark chart plots the dark signal on an axis labelled dark noise.",
  },
  {
    slug: "sensor-cmos",
    title: "CMOS Sensor Design",
    description: "Pixel design parameters, dynamic range, noise floor, and sensitivity calculations.",
    knownIssue: "The SNR chart doesn't update when the QE changes, and it uses a hidden flux of 1000 photons/s per pixel, so the full-well clip can never trigger. The pixel pitch is unused.",
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
    knownIssue: "The crosstalk heatmap doesn't update when a channel's centre or bandwidth changes. Crosstalk is symmetric and built from filter widths only, with no dye spectrum; excitation inputs are unused; the photon rate is a hard-coded 500.",
  },
  {
    slug: "speckle-imaging",
    title: "Speckle Imaging",
    description: "Speckle size, contrast, averaging strategies, and surface roughness effects.",
    knownIssue: "The aperture diameter is unused (no subjective speckle size is computed), the speckle size λz/D is given without saying it is the correlation width (1.22λz/D is 22 % larger), and the beam chart is unrelated to the result.",
  },
  {
    slug: "spectral-unmixing",
    title: "Spectral Unmixing",
    description: "Decompose mixed spectral signals into constituent endmember abundances using linear unmixing methods.",
    knownIssue: "No least-squares solve happens: the estimated abundances are the true values plus a fixed sine perturbation scaled by a per-method constant, and the unmixing-error curve and reconstruction error are hard-coded lines.",
  },
  {
    slug: "spinning-disk",
    title: "Spinning Disk Confocal Calculator",
    description: "Pinhole size, optical sectioning, and frame rate for spinning disk confocal microscopy.",
    knownIssue: "The dwell time (exposure over the pinhole count) is not a physical dwell, the frame rate rpm/60 ignores frames per revolution, and the uncited section fit gives 2.21 µm against 2.53 µm from the confocal model.",
  },
  {
    slug: "stimulated-raman-microscopy",
    title: "Stimulated Raman Scattering Microscopy Calculator",
    description: "Calculate SRS signal levels, SNR, resolution, and imaging speed for label-free chemical imaging.",
    knownIssue: "The SNR 10·P_S·√(P_p·τ) has no physical basis (no modulation depth, no photon shot noise; Ozeki 2009), the SRG and SRL labels are swapped, and the depth chart uses invented attenuation lengths.",
  },
  {
    slug: "stitching",
    title: "Image Stitching",
    description: "Calculate tile grid parameters, overlap, blending profiles, and stitching accuracy for large-area microscopy.",
    knownIssue: "A negative grid size in the URL crashes the page and a huge one hangs it. The headline position error is a fixed 0.3 × the input error, and the feather weights cos and sin sum to √2 at mid-overlap, a 41 % bright seam.",
  },
  {
    slug: "strehl-ratio",
    title: "Strehl Ratio Calculator",
    description: "Estimate the Strehl ratio from wavefront error using the Maréchal approximation.",
    knownIssue: "The mode options say waves while the input is in nm, the PV/RMS ratio 3.55 is uncited, and the S ≥ 0.8 threshold disagrees with wavefront-error's λ/14 between σ = 0.0714λ and 0.0752λ.",
  },
  {
    slug: "structured-illumination",
    title: "Structured Illumination Microscopy",
    description: "SIM resolution enhancement and OTF expansion via patterned illumination.",
    knownIssue: "An NA or wavelength of 0 in the URL makes the OTF loop endless and hangs the tab. The SIM OTF is the widefield OTF stretched N× rather than a sum of shifted copies, and the SNR penalty √N/m has no source.",
  },
  {
    slug: "sum-frequency-microscopy",
    title: "Sum-Frequency Generation Microscopy Calculator",
    description: "Calculate SFG wavelengths, energies, and beam parameters for sum-frequency generation microscopy.",
    knownIssue: "The power and pulse-width inputs are not used, so no signal is computed, and the Airy radius 0.61λ/NA is labelled as the beam waist w₀ (0.79 µm against λ/(πNA) = 0.41 µm at 1040 nm, NA 0.8).",
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
    knownIssue: "The telecentric depth has no circle of confusion and a ×1000 factor (240 mm against about 1.7 mm). The chief ray uses tanθ/m and the magnification error |Δz|/(s_o·m²) instead of −Δz/s_EP.",
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
    knownIssue: "The depth uses λ/(2π√…), the field decay length; the intensity depth is λ/(4π√…), half as large (110 nm, not 221 nm, at 488 nm, 65°; Axelrod 2001). Angles past the objective's limit still show a depth.",
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
    knownIssue: "A large Zernike-term count in the URL throws and crashes the page, the Zernike chart just splits σ equally over N terms, and the default σ = 0.25λ is outside the Maréchal range (S 0.085 against 0.023 exact for defocus).",
  },
  {
    slug: "working-distance",
    title: "Working Distance Calculator",
    description: "Calculate working distance from objective focal length and magnification.",
    knownIssue: "The page labels the thin-lens object distance f(1 + 1/m) as the microscope working distance (10.5 mm for f = 10 mm at 20×), which is set by the objective's front-lens mechanics. It repeats image-distance.",
  },
];
