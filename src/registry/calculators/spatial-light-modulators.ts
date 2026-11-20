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
];
