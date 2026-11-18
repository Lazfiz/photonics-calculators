/**
 * Quantum-efficiency calculator model: external QE of a silicon or InGaAs (InP-capped) detector structure versus
 * wavelength, its peak and its value at a probe wavelength. SI inside the physics calls (m, 1/m); the inputs here use
 * the page's units (µm, nm, fractions). Composition of `photodiode-qe.ts` (Gärtner 1959, doi:10.1103/PhysRev.116.84:
 * η = (1 − R)·e^(−α·d)·[1 − e^(−α·W)/(1 + α·L)]), `materials/silicon-absorption.ts`, `ingaas.ts` and `responsivity.ts`.
 * Kept apart so the pages that import those modules do not ship it.
 */

import { ingaasBandGap } from "../materials/bandgap";
import { siliconAbsorption, siliconIndex } from "../materials/silicon-absorption";
import { ingaasAbsorption, inpWindowEdge } from "./ingaas";
import { normalReflectance, photodiodeQe } from "./photodiode-qe";
import { responsivity } from "./responsivity";

export const QE_MATERIALS = ["si", "ingaas"] as const;
export type QeMaterial = (typeof QE_MATERIALS)[number];
export const QE_SURFACES = ["ar", "bare"] as const;
export type QeSurface = (typeof QE_SURFACES)[number];

/** Wavelength range (nm) per material, and its default probe: Green's silicon table; In₀.₅₃Ga₀.₄₇As from below the InP edge to past its cutoff. */
export const QE_RANGE: Record<QeMaterial, { lo: number; hi: number; probe: number }> = {
  si: { lo: 250, hi: 1450, probe: 850 },
  ingaas: { lo: 800, hi: 1800, probe: 1550 },
};
/** Number of spectrum samples (the first at λ_lo, the last at λ_hi). */
export const QE_SAMPLES = 241;
/** Two samples within this QE (a fraction: 0.1 percentage points) of the maximum count as a flat top. */
export const QE_FLAT_TOP = 1e-3;

// In₀.₅₃Ga₀.₄₇As at 300 K (Vurgaftman gap 0.7373 eV) read through an InP cap, opaque short of 916 nm.
const INGAAS_GAP = ingaasBandGap(0.53, 300);
const INP_EDGE = inpWindowEdge(300);

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export interface QeRawInputs {
  material: string;
  /** Collecting thickness W, µm. */
  thickness: number;
  /** Substrate diffusion length L, µm. */
  diffusionLength: number;
  /** Dead layer d, µm. */
  deadLayer: number;
  surface: string;
  /** AR-coated reflectance R, 0–0.5. */
  reflectance: number;
  fillFactor: number;
  microlensGain: number;
  /** Probe wavelength, nm. */
  probeWavelength: number;
}

export interface QeInputs {
  material: QeMaterial;
  surface: QeSurface;
  /** µm. */
  W: number;
  /** µm; 0 on an InP substrate. */
  L: number;
  /** µm. */
  d: number;
  R: number;
  fillFactor: number;
  microlensGain: number;
  /** nm, inside the material's range. */
  probe: number;
  /** min(1, fill factor × microlens gain). */
  opticalFill: number;
}

/** Clamps the page's raw values to its input ranges and applies the material rules (no substrate and no bare surface for InGaAs). */
export function resolveQeInputs(raw: QeRawInputs): QeInputs {
  const material: QeMaterial = QE_MATERIALS.find((m) => m === raw.material) ?? "si";
  const range = QE_RANGE[material];
  const fillFactor = clamp(raw.fillFactor, 0.1, 1, 1);
  const microlensGain = clamp(raw.microlensGain, 1, 3, 1);
  return {
    material,
    // Bare-surface Fresnel needs n + ik, tabulated here for silicon only.
    surface: material === "si" ? QE_SURFACES.find((s) => s === raw.surface) ?? "ar" : "ar",
    W: clamp(raw.thickness, 0.5, 500, 20),
    L: material === "ingaas" ? 0 : clamp(raw.diffusionLength, 0, 1000, 100), // the InP substrate is transparent: no substrate collection
    d: clamp(raw.deadLayer, 0, 2, 0),
    R: clamp(raw.reflectance, 0, 0.5, 0.05),
    fillFactor,
    microlensGain,
    probe: clamp(raw.probeWavelength, range.lo, range.hi, range.probe),
    opticalFill: Math.min(1, fillFactor * microlensGain),
  };
}

/** Front-surface reflectance at λ (nm): the fixed AR value, or the bare-silicon Fresnel reflectance. */
export function qeReflectanceAt(nm: number, p: Pick<QeInputs, "surface" | "R">): number {
  if (p.surface === "ar") return p.R;
  const { n, k } = siliconIndex(nm * 1e-9);
  return normalReflectance(n, k);
}

/** Internal QE (no reflection or fill loss) at λ (nm); 0 short of the InP edge for InGaAs. */
export function qeInternalAt(nm: number, p: Pick<QeInputs, "material" | "W" | "L" | "d">): number {
  const alpha = p.material === "si" ? siliconAbsorption(nm * 1e-9) : ingaasAbsorption(nm * 1e-9, INGAAS_GAP);
  const window = p.material === "ingaas" && nm * 1e-9 <= INP_EDGE ? 0 : 1;
  return window * photodiodeQe({ alpha, reflectance: 0, depletionWidth: p.W * 1e-6, diffusionLength: p.L * 1e-6, deadLayer: p.d * 1e-6 });
}

/** External QE (1 − R)·η_internal·optical fill at λ (nm). */
export function qeExternalAt(nm: number, p: QeInputs): number {
  return (1 - qeReflectanceAt(nm, p)) * qeInternalAt(nm, p) * p.opticalFill;
}

export interface QeSummary {
  /** Sample wavelengths, nm. */
  wl: number[];
  /** External QE at each sample. */
  qe: number[];
  /** Internal QE at each sample. */
  internal: number[];
  peakIndex: number;
  /** Peak QE. */
  peakQe: number;
  /** nm; the ends of the flat top around the peak (equal when there is no flat top). */
  peakLow: number;
  peakHigh: number;
  probeQe: number;
  probeReflectance: number;
  /** A/W at the probe wavelength. */
  probeResponsivity: number;
}

export function quantumEfficiencySummary(p: QeInputs): QeSummary {
  const range = QE_RANGE[p.material];
  const wl = Array.from({ length: QE_SAMPLES }, (_, i) => range.lo + (i * (range.hi - range.lo)) / (QE_SAMPLES - 1));
  const qe = wl.map((x) => qeExternalAt(x, p));
  const internal = wl.map((x) => qeInternalAt(x, p));
  const peakIndex = qe.reduce((best, v, i) => (v > qe[best] ? i : best), 0);
  // Contiguous run of samples within the flat-top tolerance of the maximum.
  let tieLo = peakIndex, tieHi = peakIndex;
  while (tieLo > 0 && qe[peakIndex] - qe[tieLo - 1] <= QE_FLAT_TOP) tieLo--;
  while (tieHi < qe.length - 1 && qe[peakIndex] - qe[tieHi + 1] <= QE_FLAT_TOP) tieHi++;
  const probeQe = qeExternalAt(p.probe, p);
  return {
    wl, qe, internal, peakIndex,
    peakQe: qe[peakIndex],
    peakLow: wl[tieLo],
    peakHigh: wl[tieHi],
    probeQe,
    probeReflectance: qeReflectanceAt(p.probe, p),
    probeResponsivity: responsivity(probeQe, p.probe * 1e-9),
  };
}
