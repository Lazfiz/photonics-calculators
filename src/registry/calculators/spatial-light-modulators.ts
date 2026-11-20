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
    ],
  },
];
