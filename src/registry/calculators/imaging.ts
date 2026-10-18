import type { CalculatorEntry } from "../types";

export const imaging: CalculatorEntry[] = [
  {
    slug: "3d-reconstruction",
    title: "3D Reconstruction Methods",
    description: "Compare 3D reconstruction approaches: resolution, sampling, voxel budgets, and method tradeoffs.",
    tier: "textbook",
    modelNote: "Scalar FWHMs: Airy and sinc² for widefield, the numerical scalar confocal model for 0–5 AU pinholes, and a Gaussian light sheet multiplied with the detection PSF. Sampling uses two samples per FWHM.",
    references: [
      {
        citation: "Wilson T., Sheppard C. J. R. (1984). Theory and Practice of Scanning Optical Microscopy. Academic Press. Confocal PSF as the product of the illumination PSF and the pinhole-integrated detection PSF.",
      },
      {
        citation: "Wilson T. (2011). Resolution and optical sectioning in the confocal microscope. J. Microsc. 244, 113–121. Lateral, axial and plane responses against pinhole size.",
        url: "https://doi.org/10.1111/j.1365-2818.2011.03549.x",
      },
      {
        citation: "Wilhelm R., Gröbler B., Gluch M., Heinz H. (2003). Confocal Laser Scanning Microscopy: Principles. Carl Zeiss. Airy units, the 0.37/0.51 λ/NA and 0.64 limits, and the geometric section formula.",
      },
      {
        citation: "Engelbrecht C. J., Stelzer E. H. K. (2006). Resolution enhancement in a light-sheet-based microscope (SPIM). Opt. Lett. 31, 1477–1479. Axial resolution of sheet × detection PSF.",
        url: "https://doi.org/10.1364/OL.31.001477",
      },
      {
        citation: "Born M., Wolf E. (2019). Principles of Optics, 7th ed., §8.5.2 and §8.8. Cambridge University Press. Airy pattern, encircled energy and the defocused PSF.",
        url: "https://doi.org/10.1017/9781108769914",
      },
    ],
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
    description: "Cleared tissue imaging: ballistic light fraction with depth, resolution, and the focal shift from an index mismatch.",
    tier: "textbook",
    modelNote: "Beer–Lambert attenuation of ballistic light only (scattered light is not counted). Resolution assumes an index-matched objective; the mismatch focal shift is bounded by the paraxial and marginal-ray factors, and spherical aberration is not modelled. Default µa and µs are examples.",
    references: [
      {
        citation: "Jacques S. L. (2013). Optical properties of biological tissues: a review. Phys. Med. Biol. 58, R37–R61. Absorption and scattering coefficients.",
        url: "https://doi.org/10.1088/0031-9155/58/11/R37",
      },
      {
        citation: "Richardson D. S., Lichtman J. W. (2015). Clarifying tissue clearing. Cell 162, 246–257. Refractive-index matching and scattering in cleared tissue.",
        url: "https://doi.org/10.1016/j.cell.2015.06.067",
      },
      {
        citation: "Hell S., Reiner G., Cremer C., Stelzer E. H. K. (1993). Aberrations in confocal fluorescence microscopy induced by mismatches in refractive index. J. Microsc. 169, 391–405. Focal shift.",
        url: "https://doi.org/10.1111/j.1365-2818.1993.tb03315.x",
      },
      {
        citation: "Diel E. E., Lichtman J. W., Richardson D. S. (2020). Tutorial: avoiding and correcting sample-induced spherical aberration artifacts in 3D fluorescence microscopy. Nat. Protoc. 15, 2773–2784. Paraxial and marginal-ray focal-shift factors.",
        url: "https://doi.org/10.1038/s41596-020-0360-2",
      },
      {
        citation: "Born M., Wolf E. (2019). Principles of Optics, 7th ed., §8.8. Cambridge University Press. Axial PSF of a uniformly filled pupil.",
        url: "https://doi.org/10.1017/9781108769914",
      },
    ],
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
    description: "Replay field λz/Δx, diffraction angle, replay spot and first-order efficiency of a phase-quantised hologram on a pixelated SLM.",
    tier: "textbook",
    modelNote: "Scalar paraxial replay of a pixelated SLM at distance z, or in the focal plane of a lens of focal length z. The efficiency is the first-order efficiency of an L-level phase staircase with ideal levels; fringing fields, phase flicker, the dead-space zero order and algorithm error are not included.",
    references: [
      {
        citation: "Swanson G. J. (1989). Binary optics technology: the theory and design of multi-level diffractive optical elements. MIT Lincoln Laboratory Technical Report 854. First-order efficiency sinc²(π/L) of an L-level phase profile.",
        url: "https://apps.dtic.mil/sti/pdfs/ADA213404.pdf",
      },
      {
        citation: "Schnars U., Jüptner W. P. O. (2002). Digital recording and numerical reconstruction of holograms. Meas. Sci. Technol. 13, R85–R101. Fresnel pixel λz/(NΔx) and the pitch-limited diffraction angle.",
        url: "https://doi.org/10.1088/0957-0233/13/9/201",
      },
    ],
  },
  {
    slug: "confocal-pin-hole",
    title: "Confocal Pinhole Size",
    description: "Pinhole size in Airy units (1.22 λ/NA × M) and its trade-off between optical section, lateral resolution and signal.",
    lede: "Size the pinhole in Airy units (1.22 λ/NA × M) and see the trade-off between optical section, lateral resolution and signal.",
    tier: "textbook",
    modelNote: "Scalar paraxial confocal theory with equal excitation and emission wavelengths and a uniformly filled pupil, computed numerically for pinholes of 0–5 AU; the axial scale n − √(n² − NA²) follows Wilhelm. Throughput is the Airy encircled energy of an in-focus point.",
    references: [
      {
        citation: "Wilson T., Sheppard C. J. R. (1984). Theory and Practice of Scanning Optical Microscopy. Academic Press. Confocal PSF as the product of the illumination PSF and the pinhole-integrated detection PSF.",
      },
      {
        citation: "Wilson T. (2011). Resolution and optical sectioning in the confocal microscope. J. Microsc. 244, 113–121. Lateral, axial and plane responses against pinhole size.",
        url: "https://doi.org/10.1111/j.1365-2818.2011.03549.x",
      },
      {
        citation: "Wilhelm R., Gröbler B., Gluch M., Heinz H. (2003). Confocal Laser Scanning Microscopy: Principles. Carl Zeiss. Airy units, the 0.37/0.51 λ/NA and 0.64 limits, and the geometric section formula.",
      },
      {
        citation: "Born M., Wolf E. (2019). Principles of Optics, 7th ed., §8.5.2 and §8.8. Cambridge University Press. Airy pattern, encircled energy and the defocused PSF.",
        url: "https://doi.org/10.1017/9781108769914",
      },
    ],
  },
  {
    slug: "confocal-resolution",
    title: "Confocal Resolution Calculator",
    description: "Compare lateral and axial resolution between widefield and confocal microscopy with adjustable pinhole size.",
    tier: "textbook",
    modelNote: "Scalar paraxial confocal theory with equal excitation and emission wavelengths and a uniformly filled pupil, computed numerically for pinholes of 0–5 AU; the axial scale n − √(n² − NA²) follows Wilhelm. Widefield values are the single Airy and sinc² PSFs.",
    references: [
      {
        citation: "Wilson T., Sheppard C. J. R. (1984). Theory and Practice of Scanning Optical Microscopy. Academic Press. Confocal PSF as the product of the illumination PSF and the pinhole-integrated detection PSF.",
      },
      {
        citation: "Wilson T. (2011). Resolution and optical sectioning in the confocal microscope. J. Microsc. 244, 113–121. Lateral, axial and plane responses against pinhole size.",
        url: "https://doi.org/10.1111/j.1365-2818.2011.03549.x",
      },
      {
        citation: "Wilhelm R., Gröbler B., Gluch M., Heinz H. (2003). Confocal Laser Scanning Microscopy: Principles. Carl Zeiss. Airy units, the 0.37/0.51 λ/NA and 0.64 limits, and the geometric section formula.",
      },
      {
        citation: "Born M., Wolf E. (2019). Principles of Optics, 7th ed., §8.5.2 and §8.8. Cambridge University Press. Airy pattern, encircled energy and the defocused PSF.",
        url: "https://doi.org/10.1017/9781108769914",
      },
    ],
  },
  {
    slug: "contrast-methods",
    title: "Phase Contrast & DIC Calculator",
    description: "Contrast calculations for phase contrast and differential interference contrast microscopy.",
    tier: "textbook",
    modelNote: "Ideal Zernike phase contrast (the ring passes all of the direct light and none of the diffracted light, so no halo or shade-off) and the DIC sin² law across a linear phase edge; blurring by the optics is not included.",
    references: [
      {
        citation: "Zernike F. (1942). Phase contrast, a new method for the microscopic observation of transparent objects. Physica 9, 686–698. Direct and diffracted waves and the quarter-wave phase ring.",
        url: "https://doi.org/10.1016/S0031-8914(42)80035-X",
      },
      {
        citation: "Salmon E. D., Tran P. (2007). High-resolution video-enhanced differential interference contrast light microscopy. Methods Cell Biol. 81, 335–364. DIC intensity sin² of the bias plus the specimen retardation, with stray light.",
        url: "https://doi.org/10.1016/S0091-679X(06)81016-2",
      },
    ],
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
    description: "Fresnel reconstruction pixel λz/(NΔx), sensor NA, depth of focus, largest reference angle and the in-line sampling distance for a digital hologram.",
    tier: "textbook",
    modelNote: "Scalar paraxial Fresnel diffraction with a plane reference wave and an N × N sensor of square pixels with full fill factor. The reconstructed point is the sinc transform of the sensor aperture. Twin-image separation in off-axis holograms, noise and speckle are not included.",
    references: [
      {
        citation: "Schnars U., Jüptner W. P. O. (2002). Digital recording and numerical reconstruction of holograms. Meas. Sci. Technol. 13, R85–R101. Fresnel reconstruction pixel λz/(NΔx) and the largest interference angle 2 arcsin(λ/(4Δx)).",
        url: "https://doi.org/10.1088/0957-0233/13/9/201",
      },
    ],
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
    description: "Expansion microscopy effective resolution with pre- or post-expansion labelling, field of view and expanded gel size.",
    tier: "illustrative",
    modelNote: "The microscope's resolution divided by the expansion factor, combined in quadrature with the label displacement, which only post-expansion labelling divides by E. Assumes isotropic expansion; distortion and labelling density are not included.",
    references: [
      {
        citation: "Chen F., Tillberg P. W., Boyden E. S. (2015). Expansion microscopy. Science 347, 543–548. Physical expansion of the specimen, effective resolution d/E and the measured distortion.",
        url: "https://doi.org/10.1126/science.1260088",
      },
      {
        citation: "Wassie A. T., Zhao Y., Boyden E. S. (2019). Expansion microscopy: principles and uses in biological research. Nat. Methods 16, 33–41. Linkage error of pre- and post-expansion labelling.",
        url: "https://doi.org/10.1038/s41592-018-0219-4",
      },
    ],
  },
  {
    slug: "fcs",
    title: "FCS Calculator",
    description: "Fluorescence Correlation Spectroscopy — diffusion time, concentration, and confocal volume.",
    tier: "textbook",
    modelNote: "3D Gaussian detection volume with free diffusion and one triplet state. The SNR is Koppel's shot-noise limit at the shortest lag; background, afterpulsing and non-Gaussian confocal volumes are not included.",
    references: [
      {
        citation: "Hess S. T., Webb W. W. (2002). Focal volume optics and experimental artifacts in confocal fluorescence correlation spectroscopy. Biophys. J. 83, 2300–2317. Effective volume π^(3/2) w₀² z₀ and the 3D Gaussian G(τ).",
        url: "https://doi.org/10.1016/S0006-3495(02)73990-8",
      },
      {
        citation: "Widengren J., Mets Ü., Rigler R. (1995). Fluorescence correlation spectroscopy of triplet states in solution: a theoretical and experimental study. J. Phys. Chem. 99, 13368–13379. Triplet factor 1 + T/(1 − T)·e^(−τ/τ_T).",
        url: "https://doi.org/10.1021/j100036a009",
      },
      {
        citation: "Koppel D. E. (1974). Statistical accuracy in fluorescence correlation spectroscopy. Phys. Rev. A 10, 1938–1945. SNR set by the counts per molecule, independent of N.",
        url: "https://doi.org/10.1103/PhysRevA.10.1938",
      },
    ],
  },
  {
    slug: "fluorescence-spectra",
    title: "Fluorescence Spectra Overlap Calculator",
    description: "Compare excitation/emission spectra, spectral overlap, and filter crosstalk.",
    tier: "textbook",
    modelNote: "Eight FPbase proteins, each spectrum a log-normal band fitted to FPbase data (R₀ within 2.5 % of the raw spectra); anti-Stokes tails are cut to 0. Ideal top-hat filter, equal concentration and photon flux.",
    references: [
      {
        citation: "Lambert T. J. (2019). FPbase: a community-editable fluorescent protein database. Nat. Methods 16, 277–278. Peaks, extinction coefficients, quantum yields and spectra (read 2026-10-18).",
        url: "https://doi.org/10.1038/s41592-019-0352-8",
      },
      {
        citation: "Siano D. B., Metzler D. E. (1969). Band shapes of the electronic spectra of complex molecules. J. Chem. Phys. 51, 1856–1861. Log-normal band shape, fitted here to each FPbase spectrum.",
        url: "https://doi.org/10.1063/1.1672270",
      },
      {
        citation: "Lakowicz J. R. (2006). Principles of Fluorescence Spectroscopy, 3rd ed. Springer, §13.2. Overlap integral J and R₀ = 0.02108 (κ² Φ_D n⁻⁴ J)^(1/6) nm.",
        url: "https://doi.org/10.1007/978-0-387-46312-4",
      },
    ],
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
    tier: "textbook",
    modelNote: "Free 2D diffusion after an instantaneous bleach, with an immobile fraction. Bleaching during the pulse, flow, binding and the finite size of the cell are not included.",
    references: [
      {
        citation: "Soumpasis D. M. (1983). Theoretical analysis of fluorescence photobleaching recovery experiments. Biophys. J. 41, 95–97. Closed-form recovery of a uniformly bleached disk, D = 0.224 w²/τ½.",
        url: "https://doi.org/10.1016/S0006-3495(83)84410-5",
      },
      {
        citation: "Axelrod D., Koppel D. E., Schlessinger J., Elson E., Webb W. W. (1976). Mobility measurement by analysis of fluorescence photobleaching recovery kinetics. Biophys. J. 16, 1055–1069. Gaussian-beam series in the bleach depth K and the mobile fraction.",
        url: "https://doi.org/10.1016/S0006-3495(76)85755-4",
      },
    ],
  },
  {
    slug: "hyperspectral-microscopy",
    title: "Hyperspectral Microscopy",
    description: "Configure hyperspectral data cubes: spectral range, bands, data size, acquisition time, and SNR tradeoffs.",
    tier: "textbook",
    modelNote: "Band-sequential acquisition of a flat spectrum: each band collects Φ_λ·Δλ·t photons with shot, dark and read noise, and frames are summed. Bit-packed cube size; readout and band switching are not timed.",
    references: [
      {
        citation: "Janesick J. R. (2007). Photon Transfer. SPIE Press. Pixel SNR from shot, dark and read noise.",
        url: "https://doi.org/10.1117/3.725073",
      },
      {
        citation: "Garini Y., Young I. T., McNamara G. (2006). Spectral imaging: principles and applications. Cytometry A 69A, 735–747. Band-sequential and other spectral-imaging schemes and their trade-offs.",
        url: "https://doi.org/10.1002/cyto.a.20311",
      },
    ],
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
    description: "Gaussian light sheet thickness, Rayleigh range and field of view, and the effective axial resolution of LSFM/SPIM.",
    keywords: ["Light Sheet Microscopy Design", "Light Sheet Thickness", "Selective Plane Illumination"],
    tier: "textbook",
    modelNote: "Paraxial Gaussian sheet from a cylindrical lens (NA_ill ≤ 0.3). The effective axial FWHM combines the sheet and the scalar detection PSF as Gaussians; Bessel and lattice sheets are not modelled.",
    references: [
      {
        citation: "Engelbrecht C. J., Stelzer E. H. K. (2006). Resolution enhancement in a light-sheet-based microscope (SPIM). Opt. Lett. 31, 1477–1479. Axial resolution of sheet × detection PSF.",
        url: "https://doi.org/10.1364/OL.31.001477",
      },
      {
        citation: "Huisken J., Swoger J., Del Bene F., Wittbrodt J., Stelzer E. H. K. (2004). Optical sectioning deep inside live embryos by selective plane illumination microscopy. Science 305, 1007–1009.",
        url: "https://doi.org/10.1126/science.1100035",
      },
      {
        citation: "Siegman A. E. (1986). Lasers, ch. 17. University Science Books. Gaussian beam waist, Rayleigh range and divergence.",
      },
    ],
  },
  {
    slug: "low-coherence",
    title: "Low Coherence Interferometry",
    description: "Time-domain OCT: interferogram of a reflector, fringe visibility, axial resolution, Doppler carrier 2v/λ, scan times and the shot-noise SNR.",
    tier: "textbook",
    modelNote: "Michelson interferometer with a Gaussian source (Δλ ≪ λ₀), matched dispersion, a 50/50 coupler and a reference mirror at constant speed with no flyback. The SNR is the shot-noise limit with a strong reference arm; excess intensity noise is not included.",
    references: [
      {
        citation: "Fercher A. F., Drexler W., Hitzenberger C. K., Lasser T. (2003). Optical coherence tomography — principles and applications. Rep. Prog. Phys. 66, 239–303. Axial resolution (2 ln 2/π) λ₀²/Δλ.",
        url: "https://doi.org/10.1088/0034-4885/66/2/204",
      },
      {
        citation: "Choma M. A., Sarunic M. V., Yang C., Izatt J. A. (2003). Sensitivity advantage of swept source and Fourier domain optical coherence tomography. Opt. Express 11, 2183–2189. Time-domain SNR ρP_s/(2eB), eq. 9, with B = 2Δk v/π.",
        url: "https://doi.org/10.1364/OE.11.002183",
      },
    ],
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
    description: "Coherence time and length of a Gaussian source, OCT axial resolution 0.4413 λ²/(nΔλ), and the shot-noise-limited Fourier-domain SNR and sensitivity.",
    tier: "textbook",
    modelNote: "Gaussian source spectrum with Δλ ≪ λ₀ and matched dispersion; n is the group index. The SNR is the shot-noise limit of a spectrometer or swept-source system with a strong reference arm and the A-scan time as exposure; read noise, excess noise and the depth roll-off are not included.",
    references: [
      {
        citation: "Fercher A. F., Drexler W., Hitzenberger C. K., Lasser T. (2003). Optical coherence tomography — principles and applications. Rep. Prog. Phys. 66, 239–303. Axial resolution (2 ln 2/π) λ₀²/Δλ, the round-trip coherence length.",
        url: "https://doi.org/10.1088/0034-4885/66/2/204",
      },
      {
        citation: "Choma M. A., Sarunic M. V., Yang C., Izatt J. A. (2003). Sensitivity advantage of swept source and Fourier domain optical coherence tomography. Opt. Express 11, 2183–2189. Fourier-domain SNR ρP_sΔt/(2e), eq. 10.",
        url: "https://doi.org/10.1364/OE.11.002183",
      },
    ],
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
    description: "Localization precision from photons, background and pixel size, and effective resolution with label density, for single-molecule localization microscopy (PALM/STORM).",
    tier: "textbook",
    modelNote: "Gaussian fit to the PSF (σ = 0.21 λ/NA), with Mortensen's pixelation and background terms, one localization per label, and the effective resolution as the localization FWHM and the Nyquist term in quadrature. Drift, label size and repeated blinking are not included.",
    references: [
      {
        citation: "Mortensen K. I., Churchman L. S., Spudich J. A., Flyvbjerg H. (2010). Optimized localization analysis for single-molecule tracking and super-resolution microscopy. Nat. Methods 7, 377–381. Precision of maximum-likelihood (eq. 5) and least-squares (eq. 6) Gaussian fits; EMCCD excess noise doubles the variance.",
        url: "https://doi.org/10.1038/nmeth.1447",
      },
      {
        citation: "Shroff H., Galbraith C. G., Galbraith J. A., Betzig E. (2008). Live-cell photoactivated localization microscopy of nanoscale adhesion dynamics. Nat. Methods 5, 417–423. Nyquist resolution 2/ρ^(1/D).",
        url: "https://doi.org/10.1038/nmeth.1202",
      },
      {
        citation: "Legant W. R. et al. (2016). High-density three-dimensional localization microscopy across large volumes. Nat. Methods 13, 359–365. Localization FWHM and Nyquist resolution combined in quadrature.",
        url: "https://doi.org/10.1038/nmeth.3797",
      },
    ],
  },
  {
    slug: "photoacoustic",
    title: "Photoacoustic Imaging Calculator",
    description: "Initial pressure, diffuse light penetration, acoustic resolution and the skin exposure limit for photoacoustic microscopy and tomography.",
    tier: "textbook",
    modelNote: "p₀ = Γμ_aF under stress confinement; fluence decays as exp(−μ_eff z) from diffusion theory, ignoring the build-up below the surface; one-way acoustic resolution of acoustic-resolution PAM and partial-view tomography. Skin limits are ICNIRP 2013 single-pulse and ≥ 10 s values, without the repetitive-pulse rules.",
    references: [
      {
        citation: "Xu M., Wang L. V. (2006). Photoacoustic imaging in biomedicine. Rev. Sci. Instrum. 77, 041101. Thermal and stress confinement and the initial pressure p₀ = Γμ_aF.",
        url: "https://doi.org/10.1063/1.2195024",
      },
      {
        citation: "Wang L. V., Hu S. (2012). Photoacoustic tomography: in vivo imaging from organelles to organs. Science 335, 1458–1462. Axial resolution 0.88 v_s/Δf, lateral 0.71 v_s/(NA f₀), about 800 Pa per mK.",
        url: "https://doi.org/10.1126/science.1216210",
      },
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105, 271–295. Table 7, skin limits.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
    ],
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
    tier: "textbook",
    modelNote: "Spillover L_ij = R_ij/R_jj from FPbase-fitted spectra, all lasers on at equal photon flux, top-hat filters. Bleed-through adds shot noise before unmixing; charge or digital binning sets the read noise.",
    references: [
      {
        citation: "Roederer M. (2001). Spectral compensation for flow cytometry: visualization artifacts, limitations, and caveats. Cytometry 45, 194–205. Spillover as the signal in a secondary detector over that in the primary one.",
        url: "https://doi.org/10.1002/1097-0320(20011101)45:3<194::AID-CYTO1163>3.0.CO;2-C",
      },
      {
        citation: "Lambert T. J. (2019). FPbase: a community-editable fluorescent protein database. Nat. Methods 16, 277–278. Peaks, extinction coefficients, quantum yields and spectra (read 2026-10-18).",
        url: "https://doi.org/10.1038/s41592-019-0352-8",
      },
      {
        citation: "Janesick J. R. (2007). Photon Transfer. SPIE Press. Pixel SNR from shot, dark and read noise.",
        url: "https://doi.org/10.1117/3.725073",
      },
    ],
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
    tier: "textbook",
    modelNote: "FPbase-fitted emission spectra in equal bands; one pixel with shot and read noise from a seeded generator, solved by OLS, NNLS or FCLS, with OLS error bars. Background and reference-spectrum errors are left out.",
    references: [
      {
        citation: "Zimmermann T., Rietdorf J., Pepperkok R. (2003). Spectral imaging and its applications in live cell microscopy. FEBS Lett. 546, 87–92. Linear unmixing of fluorescent proteins.",
        url: "https://doi.org/10.1016/S0014-5793(03)00521-0",
      },
      {
        citation: "Lawson C. L., Hanson R. J. (1995). Solving Least Squares Problems. SIAM, ch. 23. The NNLS active-set algorithm.",
        url: "https://doi.org/10.1137/1.9781611971217",
      },
      {
        citation: "Heinz D. C., Chang C.-I (2001). Fully constrained least squares linear spectral mixture analysis. IEEE Trans. Geosci. Remote Sens. 39, 529–545.",
        url: "https://doi.org/10.1109/36.911111",
      },
    ],
  },
  {
    slug: "spinning-disk",
    title: "Spinning Disk Confocal Calculator",
    description: "Pinhole size, optical sectioning, and frame rate for spinning disk confocal microscopy.",
    tier: "textbook",
    modelNote: "Scalar paraxial confocal theory with equal excitation and emission wavelengths and a uniformly filled pupil, computed numerically for pinholes of 0–5 AU; the axial scale n − √(n² − NA²) follows Wilhelm. One pinhole only: crosstalk through neighbouring pinholes is not modelled. Frame rate is RPM/60 × scans per revolution.",
    references: [
      {
        citation: "Tanaami T., Otsuki S., Tomosada N. et al. (2002). High-speed 1-frame/ms scanning confocal microscope with a microlens and Nipkow disks. Appl. Opt. 41, 4704–4708. Yokogawa CSU disk, 12 scans per revolution.",
        url: "https://doi.org/10.1364/AO.41.004704",
      },
      {
        citation: "Wilson T., Sheppard C. J. R. (1984). Theory and Practice of Scanning Optical Microscopy. Academic Press. Confocal PSF as the product of the illumination PSF and the pinhole-integrated detection PSF.",
      },
      {
        citation: "Wilson T. (2011). Resolution and optical sectioning in the confocal microscope. J. Microsc. 244, 113–121. Lateral, axial and plane responses against pinhole size.",
        url: "https://doi.org/10.1111/j.1365-2818.2011.03549.x",
      },
      {
        citation: "Wilhelm R., Gröbler B., Gluch M., Heinz H. (2003). Confocal Laser Scanning Microscopy: Principles. Carl Zeiss. Airy units, the 0.37/0.51 λ/NA and 0.64 limits, and the geometric section formula.",
      },
    ],
  },
  {
    slug: "stimulated-raman-microscopy",
    title: "Stimulated Raman Scattering Microscopy Calculator",
    description: "Shot-noise-limited SNR, detection limit, Stokes wavelength, resolution and frame time for stimulated Raman scattering microscopy.",
    tier: "textbook",
    modelNote: "SNR = δ√N from the shot noise of the detected beam alone; the modulation depth δ is an input. Laser excess noise, detector noise and lock-in losses are not modelled. Resolution is the FWHM of I_p·I_S on Zipfel's Gaussian focus.",
    references: [
      {
        citation: "Ozeki Y. et al. (2009). Analysis and experimental assessment of the sensitivity of stimulated Raman scattering microscopy. Opt. Express 17, 3651–3658. Shot-noise-limited SRS sensitivity.",
        url: "https://doi.org/10.1364/OE.17.003651",
      },
      {
        citation: "Freudiger C. W. et al. (2008). Label-Free Biomedical Imaging with High Sensitivity by Stimulated Raman Scattering Microscopy. Science 322, 1857–1861. SRG and SRL detection with high-frequency modulation.",
        url: "https://doi.org/10.1126/science.1165758",
      },
      {
        citation: "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. Nat. Biotechnol. 21, 1369–1377. Gaussian fit to the focus at each wavelength.",
        url: "https://doi.org/10.1038/nbt899",
      },
    ],
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
    description: "SIM cut-off frequency, lateral resolution and raw image count for linear and saturated structured illumination microscopy.",
    tier: "textbook",
    modelNote: "Frequency-support model: the cut-off is the detection cut-off 2NA/λem plus m times the pattern frequency. It gives the Abbe-type resolution 1/k_c and the number of raw images, not the noise or the reconstruction quality.",
    references: [
      {
        citation: "Gustafsson M. G. L. (2000). Surpassing the lateral resolution limit by a factor of two using structured illumination microscopy. J. Microsc. 198, 82–87. Shifted passbands, k_c = 2NA/λem + k₀, three phases per angle.",
        url: "https://doi.org/10.1046/j.1365-2818.2000.00710.x",
      },
      {
        citation: "Gustafsson M. G. L. (2005). Nonlinear structured-illumination microscopy: wide-field fluorescence imaging with theoretically unlimited resolution. PNAS 102, 13081–13086. Harmonics m·k₀ of saturated SIM.",
        url: "https://doi.org/10.1073/pnas.0406877102",
      },
    ],
  },
  {
    slug: "sum-frequency-microscopy",
    title: "Sum-Frequency Generation Microscopy Calculator",
    description: "SFG wavelength, focal spot, coherence lengths and thin-layer signal power for sum-frequency generation microscopy.",
    tier: "textbook",
    modelNote: "Wavelength from energy conservation (exact). Power: plane-wave L² sinc²(ΔkL/2) over the overlap of two Gaussian foci, valid for a uniform layer much thinner than the confocal parameter; synchronised Gaussian pulses of equal width. No walk-off or absorption, undepleted inputs.",
    references: [
      {
        citation: "Boyd R. W. (2008). Nonlinear Optics, 3rd ed., §2.2, eq. 2.2.10. Academic Press. Coupled-amplitude equation of sum-frequency generation.",
      },
      {
        citation: "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. Nat. Biotechnol. 21, 1369–1377. Gaussian fit to the focus at each wavelength.",
        url: "https://doi.org/10.1038/nbt899",
      },
    ],
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
    description: "Evanescent intensity penetration depth, critical angle, objective angle limit and interface intensity for TIRF microscopy.",
    tier: "exact",
    modelNote: "Plane-wave Fresnel optics at a single planar interface. Objective-type TIRF also carries scattered, non-evanescent light, so measured decays are often longer.",
    references: [
      {
        citation: "Axelrod D. (2001). Total internal reflection fluorescence microscopy in cell biology. Traffic 2, 764–774. Penetration depth (eq. 2) and interface intensities for s and p polarisation (eqs. 4–5).",
        url: "https://doi.org/10.1034/j.1600-0854.2001.21104.x",
      },
    ],
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
