import type { CalculatorEntry, Reference } from "../types";

// Checked on Crossref (doi:10.1364/BOE.422703) and read in full (PMC8221958): Eqs. 1–2 (mirror envelope), 6–7 (blaze and
// diffraction conditions), Table 1 (d = 7.56 µm, γ = 12°).
const brown2021: Reference = {
  citation: "Brown P. T., Kruithoff R., Seedorf G. J., Shepherd D. P. (2021). Multicolor structured illumination microscopy and quantitative control of polychromatic light with a digital micromirror device. Biomed. Opt. Express 12(6), 3700–3716: Eqs. 1–2, 6–7 and Table 1.",
  url: "https://doi.org/10.1364/BOE.422703",
};
const tiDlpa037: Reference = {
  citation: "Texas Instruments (2025). Using Lasers with DLP DMD Technology, application note DLPA037A, Secs. 2.5–2.6, Eqs. 6–8: blaze and Littrow conditions along the mirror diagonal.",
  url: "https://www.ti.com/lit/pdf/dlpa037",
};
const tiDlpa083: Reference = {
  citation: "Texas Instruments (2023). DMD Optical Efficiency for Visible Wavelengths, application note DLPA083B, Table 2-1: typical on-state fill factors of 92–97 %.",
  url: "https://www.ti.com/lit/pdf/dlpa083",
};

// Read in full as arXiv:1405.3893v2 (the Opt. Express PDF is behind a script check); Crossref checked.
const goorden2014: Reference = {
  citation: "Goorden S. A., Bertolotti J., Mosk A. P. (2014). Superpixel-based spatial amplitude and phase modulation using a digital micromirror device. Opt. Express 22(15), 17999–18009: aperture position, field counts (Fig. 2), resolution and efficiency.",
  url: "https://doi.org/10.1364/OE.22.017999",
};
// Read in full as arXiv:2311.16685v1, whose equation numbers are used here (the IOP PDF returned 403); Crossref checked.
const gutierrez2024: Reference = {
  citation: "Gutiérrez-Cuevas R., Popoff S. M. (2024). Binary amplitude holograms for shaping complex light fields with digital micromirror devices. J. Phys. Photonics 6, 045022: Lee holograms, Eqs. 11, 15, 16 and 22 (numbering of arXiv:2311.16685v1).",
  url: "https://doi.org/10.1088/2515-7647/ad8617",
};
const tiDlps026: Reference = {
  citation: "Texas Instruments (2023). DLP7000 DLP 0.7 XGA 2x LVDS Type A DMD, datasheet DLPS026G: 1024 × 768 mirrors, 13.68 µm pitch; Table 8-1: 32 552 binary patterns/s.",
  url: "https://www.ti.com/lit/ds/symlink/dlp7000.pdf",
};

// Read in full from the CORE/Cambridge repository copy; Crossref checked. Eqs. 3–4 (reflective phase stroke), Table 1.
const zhang2014: Reference = {
  citation: "Zhang Z., You Z., Chu D. (2014). Fundamentals of phase-only liquid crystal on silicon (LCOS) devices. Light Sci. Appl. 3, e213: Eq. 3, phase stroke δ = 2πΔn·2d/λ of a reflective cell; Eq. 4, d = λ/(2Δn) for 2π.",
  url: "https://doi.org/10.1038/lsa.2014.94",
};
// Read in full as arXiv:1908.04859 (the SPIE PDF was not opened); Crossref checked.
const shane2019: Reference = {
  citation: "Shane J. C., McKnight D. J., Hill A., Taberski K., Serati S. (2019). Designing a new spatial light modulator for holographic photostimulation. Proc. SPIE, Optical Trapping and Optical Micromanipulation XVI: first-order efficiency ∝ (area fill factor)² for flat mirrors with non-reflective gaps; fringing fields act as a low-pass filter.",
  url: "https://doi.org/10.1117/12.2528558",
};
// Read in full as arXiv:1512.06241v1; Crossref checked.
const naber2016: Reference = {
  citation: "Naber J. B., Vos J., Rengelink R. J., Nusselder R. J., Davtyan D. (2016). Optical techniques for Rydberg physics in lattice geometries. Eur. Phys. J. Spec. Top. 225, 2785–2816: a PLUTO SLM with 87 % fill factor, theoretical efficiency (fill factor)² = 76 %.",
  url: "https://doi.org/10.1140/epjst/e2015-50329-4",
};
// Read in full (PDF from hamamatsu.com, Aug. 2024).
const hamamatsuX15213: Reference = {
  citation: "Hamamatsu Photonics (2024). LCOS-SLM X15213 series: Applications and Features, Cat. No. LLAP3012E05: 1272 × 1024 pixels, 12.5 µm pitch, fill factor 96.8 %; Feature 3, 2-level grating at 40 lp/mm, 4-level at 20 lp/mm, efficiency over the unpatterned zero order.",
  url: "https://www.hamamatsu.com/content/dam/hamamatsu-photonics/sites/documents/99_SALES_LIBRARY/lpd/application_note_LCOS_E.pdf",
};
// The same entry as the computer-generated holography page cites (imaging.ts): sinc²(π/N) for N levels.
const swanson1989: Reference = {
  citation: "Swanson G. J. (1989). Binary optics technology: the theory and design of multi-level diffractive optical elements. MIT Lincoln Laboratory Technical Report 854. First-order efficiency sinc²(π/L) of an L-level phase profile.",
  url: "https://apps.dtic.mil/sti/pdfs/ADA213404.pdf",
};
// Read in full (PDF from scitepress.org); Crossref checked.
const improso2017: Reference = {
  citation: "Improso W. D. G. D., Tapang G. A., Saloma C. A. (2017). Suppression of zeroth-order diffraction in phase-only spatial light modulator via destructive interference with a correction beam. Proc. PHOTOPTICS 2017, 208–214: the unmodulated dead areas, set by the fill factor, form the zero order.",
  url: "https://doi.org/10.5220/0006129802080214",
};

// The DLPC900 datasheet, its programmer's guide and the DLP6500 datasheet were read in full (PDFs from ti.com, Nov. 2026);
// DMD 101 (DLPA008B) Sec. 4.3 for block clears and phased mirror clocking.
const tiDlps037: Reference = {
  citation: "Texas Instruments (2024). DLPC900 Digital Controller for Advanced Light Control, datasheet DLPS037H: Sec. 6.3, binary-weighted bit planes (120 Hz RGB, 2.78 ms per colour); Sec. 6.4.1, at most 24 bits per pixel per pattern frame; Table 6-4, minimum pattern time by bit depth and DMD; Table 6-6, by active blocks.",
  url: "https://www.ti.com/lit/ds/symlink/dlpc900.pdf",
};
const tiDlpu018: Reference = {
  citation: "Texas Instruments (2024). DLPC900 Programmer's Guide, DLPU018J: Table 2-110 (the same minimum exposures), Sec. 2.1.6 (exposure out of range error), Sec. 2.4.4.3.4 (105 µs dark time before a triggered pattern), Sec. 5.1 (a frame's pattern exposures must end within the frame).",
  url: "https://www.ti.com/lit/pdf/dlpu018",
};
const tiDlps053: Reference = {
  citation: "Texas Instruments (2016). DLP6500FYE 0.65 1080p MVSP Type A DMD, datasheet DLPS053B, Features: 1920 × 1080 mirrors; with the DLPC900, 9523 Hz and 19.7 Gbit/s for binary patterns; with the DLPC910, 11 574 Hz and 24 Gbit/s; micromirror crossover time 2.5 µs typical.",
  url: "https://www.ti.com/lit/ds/symlink/dlp6500fye.pdf",
};
const tiDlpa008: Reference = {
  citation: "Texas Instruments (2018). Introduction to ±12 Degree Orthogonal Digital Micromirror Devices (DMD 101), DLPA008B: Secs. 2.3.1–2.3.3, pixel memory loads while the mirrors hold their state, then a mirror clocking pulse; Secs. 4.2–4.3, block clear and phased operation for display times shorter than an array load.",
  url: "https://www.ti.com/lit/pdf/dlpa008",
};

export const spatialLightModulators: CalculatorEntry[] = [
  {
    slug: "dmd-diffraction",
    title: "DMD Diffraction and Blaze Condition",
    description: "DMD diffraction orders and blaze condition: the order nearest the micromirror reflection, its angle and efficiency, and the incidence angles that blaze it.",
    lede: "A DMD is a reflective grating of tilted mirrors. Find which diffraction order lies nearest the mirror reflection, how much light it gets, and the incidence angles that put an order exactly on the blaze.",
    keywords: ["dmd diffraction", "dmd blaze", "blaze condition", "micromirror diffraction orders", "dlp laser", "dmd littrow", "dmd incidence angle"],
    tier: "textbook",
    modelNote: "Order angles exact (2-D grating equation, tilted-mirror reflection). Power: scalar envelope of one square mirror, peak F² (normal-incidence value), ±10 % off normal; no shadowing, polarization or coating loss.",
    references: [brown2021, tiDlpa037, tiDlpa083],
    related: [
      { href: "/imaging/computer-generated-holography", note: "Replay field and efficiency of a hologram shown on an SLM" },
    ],
  },
  {
    slug: "dmd-holography",
    title: "DMD Binary Holography: Lee and Superpixel Methods",
    description: "Binary amplitude holograms on a DMD: Lee carrier period or superpixel size to efficiency, Fourier-plane aperture and resolution, and hologram rate.",
    lede: "A DMD only switches mirrors on and off, yet a binary pattern and a filtered Fourier plane can shape amplitude and phase. Compare Lee holograms and superpixels: where the aperture goes, how big it can be, and how much light gets through.",
    keywords: ["dmd holography", "lee hologram", "superpixel method", "binary amplitude hologram", "dmd complex modulation", "dmd wavefront shaping", "dmd phase modulation"],
    tier: "textbook",
    modelNote: "Scalar paraxial 4f optics, flat square pixels of 100 % fill, plane wave. Efficiency of the best cell with the pixel envelope; Goorden's phasor sum (no envelope) also shown. Aperture radius: Nyquist bound.",
    references: [goorden2014, gutierrez2024, tiDlps026],
    related: [
      { href: "/spatial-light-modulators/dmd-diffraction", note: "Which DMD order is blazed, and the incidence angle that puts it on the blaze" },
      { href: "/imaging/computer-generated-holography", note: "Replay field and efficiency of a phase hologram on an SLM" },
      { href: "/spatial-light-modulators/lcos-beam-steering", note: "Phase-only steering with an LCoS SLM: blazed grating efficiency" },
      { href: "/spatial-light-modulators/dmd-timing", note: "Bit planes, grey levels and pattern rates of a DMD" },
    ],
  },
  {
    slug: "dmd-timing",
    title: "DMD Timing: Bit Planes, Grey Levels and Pattern Rate",
    description: "DMD grey levels by binary PWM: bit-plane times, LSB, on-time per grey level, pattern rate with dark time, and TI DLPC900 minimum exposures by bit depth.",
    lede: "A DMD mirror is only on or off, so grey levels come from time: a b-bit pattern is b binary bit planes lasting 1, 2, 4 … LSBs. Set the bit depth and exposure to see each plane's duration, a grey level's on-time, the pattern rate, and TI's shortest pattern on the DLPC900.",
    keywords: ["dmd timing", "dmd bit plane", "dmd pattern rate", "dmd pwm", "dmd grey levels", "dlpc900 exposure", "binary pattern rate", "dmd exposure time", "dlp6500 pattern rate", "dmd dark time"],
    tier: "exact",
    modelNote: "Ideal binary PWM: plane k lasts exactly 2^k LSB, mirrors switch instantly (2.5 µs crossover ignored), light steady; equal colour slots. TI's DLPC900 minimum pattern times are its printed full-array table, not modelled; trigger delays left out.",
    references: [tiDlps037, tiDlpu018, tiDlps053, tiDlpa008],
    related: [
      { href: "/spatial-light-modulators/dmd-holography", note: "Binary holograms on a DMD and the hologram rate they allow" },
      { href: "/spatial-light-modulators/dmd-diffraction", note: "Which DMD order is blazed, and the incidence angle that puts it on the blaze" },
    ],
  },
  {
    slug: "lcos-beam-steering",
    title: "LCoS SLM Beam Steering: Blazed Grating Efficiency",
    description: "Steer a beam with a phase SLM: grating period in pixels to angle, first-order efficiency with fill factor, zero and alias orders, and the 2π phase stroke.",
    lede: "A phase-only LCoS SLM steers light with a sawtooth phase grating. Set the period in pixels to see the angle, how much power the steered order keeps once pixelation and fill factor take theirs, where the rest goes, and whether the cell reaches 2π.",
    keywords: ["lcos beam steering", "slm beam steering", "blazed grating slm", "phase slm diffraction efficiency", "slm fill factor", "slm zero order", "lcos phase stroke", "liquid crystal retardance", "spatial light modulator grating"],
    tier: "textbook",
    modelNote: "Scalar Fraunhofer, normal incidence, lossless flat square pixels of area fill F, exact per-pixel phase (2π lookup table). Fringing fields (pixel crosstalk) not modelled; Δn held at its value at λ.",
    references: [zhang2014, shane2019, naber2016, hamamatsuX15213, improso2017, swanson1989],
    related: [
      { href: "/imaging/computer-generated-holography", note: "Replay field and quantisation efficiency of a phase hologram on an SLM" },
      { href: "/spatial-light-modulators/dmd-holography", note: "Binary amplitude holograms on a DMD: Lee and superpixel methods" },
      { href: "/polarization/birefringence", note: "Retardance of a birefringent layer" },
    ],
  },
];
