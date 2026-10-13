/**
 * One representative commercial fibre per specialty class, with values transcribed from the manufacturer's data
 * sheet (`source`). Lengths in m. Model tier: illustrative (typical catalogue values, not a model of the class).
 *
 * The derived quantities treat each fibre as a weakly guiding step-index fibre (Gloge, Appl. Opt. 10, 2252 (1971)):
 *   V = 2π a NA/λ,  λ_c = 2π a NA/j₀₁ (2.4048),  w = a (0.65 + 1.619 V^−1.5 + 2.879 V^−6) (Marcuse 1977).
 * With the data-sheet core diameter and NA these reproduce each sheet's cut-off within its tolerance (3 % where
 * none is given) and its MFD within tolerance (PM1550-XP: 10.12 vs 10.1 µm). The PANDA stress rods and the
 * graded dopant profiles of doped fibres are ignored.
 * Losses are single data-sheet figures at one wavelength, not spectra; doped-fibre absorption is the core
 * (pump or signal) absorption, which varies by orders of magnitude across a band.
 */
import { lp11CutoffWavelength, modeFieldRadius, vNumber, type StepIndexFiber } from "./macro-bending-loss";

export interface DatasheetFigure {
  /** dB/m. */
  dbPerM: number;
  /** Wavelength the figure is specified at, m. */
  lambda: number;
  /** How the sheet states it ("max", "typical", …). */
  note: string;
}

export interface SpecialtyFiber {
  label: string;
  product: string;
  source: string;
  glass: string;
  coreDiameter: number;
  claddingDiameter: number;
  NA: number;
  /** Nominal core index; it only enters the n₁ > NA domain check (V, λ_c and w don't depend on it). */
  n1: number;
  mfd: { value: number; lambda: number };
  /** Data-sheet second-mode cut-off, m. */
  cutoff: number;
  /** Range over which the glass transmits at all, m. */
  transmission: readonly [number, number];
  /** Data-sheet operating range, m (null when the sheet gives none). */
  band: readonly [number, number] | null;
  /** Background attenuation (passive fibres). */
  attenuation?: DatasheetFigure;
  /** Core absorption (doped fibres). */
  absorption?: DatasheetFigure;
  description: string;
}

const um = 1e-6;
const nm = 1e-9;
/**
 * Silica fibres: 300 nm (the page minimum; UV absorption of Ge-doped silica rises below ≈ 400 nm) to 2370 nm, where the
 * infrared absorption tail 7.81×10¹¹ exp(−48.48/λ[µm]) dB/km (Keiser §3.1, see silica-attenuation.ts) reaches 1 dB/m.
 */
const SILICA_WINDOW = [300 * nm, 2370 * nm] as const;

export const SPECIALTY_FIBERS = {
  pm: {
    label: "PANDA PM (PM1550-XP)",
    product: "Thorlabs PM1550-XP",
    source: "https://www.thorlabs.com/item/pm1550-xp",
    glass: "Ge-doped silica, B-doped stress rods",
    coreDiameter: 8.5 * um, claddingDiameter: 125 * um, NA: 0.125, n1: 1.45,
    mfd: { value: 10.1 * um, lambda: 1550 * nm },
    cutoff: 1380 * nm,
    transmission: SILICA_WINDOW,
    band: [1440 * nm, 1625 * nm],
    attenuation: { dbPerM: 1.0e-3, lambda: 1550 * nm, note: "max (< 1.0 dB/km)" },
    description: "Polarization-maintaining fibre: stress rods give a beat length of 5.0 mm at 1550 nm.",
  },
  edf: {
    label: "Erbium-doped (Er16-8/125)",
    product: "nLIGHT LIEKKI Er16-8/125",
    source: "https://www.thorlabs.com/item/er16-8_125",
    glass: "Er-doped silica",
    coreDiameter: 8 * um, claddingDiameter: 125 * um, NA: 0.13, n1: 1.45,
    mfd: { value: 9.5 * um, lambda: 1550 * nm },
    cutoff: 1250 * nm,
    transmission: SILICA_WINDOW,
    band: null,
    absorption: { dbPerM: 16.0, lambda: 1530 * nm, note: "peak core absorption (± 3)" },
    description: "Gain fibre for the C-band, pumped at 980 or 1480 nm (EDFAs, ASE sources).",
  },
  ydf: {
    label: "Ytterbium-doped (Yb1200-4/125)",
    product: "nLIGHT LIEKKI Yb1200-4/125",
    source: "https://www.thorlabs.com/item/yb1200-4_125",
    glass: "Yb-doped silica",
    coreDiameter: 4 * um, claddingDiameter: 125 * um, NA: 0.2, n1: 1.45,
    mfd: { value: 4.4 * um, lambda: 1060 * nm },
    cutoff: 1010 * nm,
    transmission: SILICA_WINDOW,
    band: null,
    absorption: { dbPerM: 1200, lambda: 976 * nm, note: "peak core absorption (nominal); 280 dB/m at 920 nm" },
    description: "Highly doped gain fibre for 1 µm lasers and preamplifiers; a few cm absorb a 976 nm pump.",
  },
  tdf: {
    label: "Thulium-doped (SM-TSF-9/125)",
    product: "Coherent SM-TSF-9/125",
    source: "https://www.coherent.com/components-accessories/specialty-optical-fibers/single-mode/SM-TSF-9-125",
    glass: "Tm-doped silica",
    coreDiameter: 9 * um, claddingDiameter: 125 * um, NA: 0.15, n1: 1.45,
    mfd: { value: 10.5 * um, lambda: 2000 * nm },
    cutoff: 1750 * nm,
    transmission: SILICA_WINDOW,
    band: [1900 * nm, 2100 * nm],
    absorption: { dbPerM: 27, lambda: 793 * nm, note: "core absorption" },
    description: "Gain fibre for 2 µm lasers, core-pumped near 793 nm (or in-band near 1.6 µm).",
  },
  zblan: {
    label: "Fluoride ZBLAN (IRZS23)",
    product: "Thorlabs IRZS23",
    source: "https://www.thorlabs.com/item/irzs23",
    glass: "ZrF₄–BaF₂–LaF₃–AlF₃–NaF",
    coreDiameter: 9 * um, claddingDiameter: 125 * um, NA: 0.19, n1: 1.5,
    mfd: { value: 10.5 * um, lambda: 2500 * nm },
    cutoff: 2300 * nm,
    transmission: [285 * nm, 4100 * nm],
    band: [2300 * nm, 4100 * nm],
    attenuation: { dbPerM: 0.03, lambda: 2500 * nm, note: "typical; < 0.2 dB/m max over 2.3–3.6 µm" },
    description: "Mid-IR single-mode fibre (transmits 0.285–4.1 µm); fragile and hygroscopic compared with silica.",
  },
  chalcogenide: {
    label: "Chalcogenide As₂S₃ (IRF-S-9)",
    product: "IRflex IRF-S-9",
    source: "https://irflex.com/products/irf-s-series/",
    glass: "As₂S₃",
    coreDiameter: 9 * um, claddingDiameter: 170 * um, NA: 0.225, n1: 2.4,
    mfd: { value: NaN, lambda: NaN },
    cutoff: 2650 * nm,
    transmission: [1500 * nm, 6500 * nm],
    band: [1500 * nm, 5300 * nm],
    attenuation: { dbPerM: 0.1, lambda: 4800 * nm, note: "approximate minimum" },
    description: "Mid-IR fibre (1.5–6.5 µm transmission); high index (n ≈ 2.4) and high Kerr nonlinearity.",
  },
} as const satisfies Record<string, SpecialtyFiber>;

export type SpecialtyFiberId = keyof typeof SPECIALTY_FIBERS;

const asStepIndex = (f: SpecialtyFiber): StepIndexFiber => ({ a: f.coreDiameter / 2, n1: f.n1, NA: f.NA });

/** V = 2π a NA/λ. NaN for λ ≤ 0. */
export function specialtyV(f: SpecialtyFiber, lambda: number): number {
  return vNumber(asStepIndex(f), lambda);
}

/** Step-index LP11 cut-off from the data-sheet core and NA, m. */
export function specialtyCutoff(f: SpecialtyFiber): number {
  return lp11CutoffWavelength(asStepIndex(f));
}

/** Below this V Marcuse's fit loses its ≈ 1 % accuracy (it holds for 1.2 ≤ V ≤ 2.4). */
export const MARCUSE_MIN_V = 1.2;

/** Marcuse Gaussian mode-field diameter 2w at λ, m (NaN for V < 1.2). */
export function specialtyMfd(f: SpecialtyFiber, lambda: number): number {
  return specialtyV(f, lambda) >= MARCUSE_MIN_V ? 2 * modeFieldRadius(asStepIndex(f), lambda) : NaN;
}
