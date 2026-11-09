/**
 * Protected silver mirror: air | overcoat | Ag | adhesion layer | substrate, normal incidence, exact transfer matrix
 * (./low-emissivity.ts, Ag from Yang et al. 2015). SI units: thicknesses and wavelengths in m.
 * Model tier: textbook approximation (lossless constant-index overcoat and adhesion layers, bulk-like Ag, back face ignored).
 */
import { intervalStats } from "../math";
import { coatingResponse, type CoatingLayer, type Substrate } from "./low-emissivity";

const NM = 1e-9;

export interface ProtectedSilverInputs {
  nSub: number;
  agThickness: number;
  nProtect: number;
  protectThickness: number;
  nAdhesion: number;
  adhesionThickness: number;
}

/** True when the indices are positive and the thicknesses non-negative. */
export function protectedSilverValid(p: ProtectedSilverInputs): boolean {
  return p.nSub > 0 && p.nProtect > 0 && p.nAdhesion > 0 && p.agThickness >= 0 && p.protectThickness >= 0 && p.adhesionThickness >= 0;
}

export function protectedSilverSubstrate(nSub: number): Substrate {
  return { material: "dielectric", n: nSub };
}

/** The protected stack and the same Ag film with no overcoat, layers in the order the light meets them. */
export function protectedSilverStacks(p: ProtectedSilverInputs): { protectedAg: CoatingLayer[]; bare: CoatingLayer[] } {
  const ag: CoatingLayer = { material: "Ag", thickness: p.agThickness };
  const adhesion: CoatingLayer = { material: "dielectric", n: p.nAdhesion, thickness: p.adhesionThickness };
  return {
    protectedAg: [{ material: "dielectric", n: p.nProtect, thickness: p.protectThickness }, ag, adhesion],
    bare: [ag, adhesion],
  };
}

export interface ProtectedSilverSummary {
  /** Mean (trapezoid, 300 intervals) and minimum of R over 400–700 nm, protected stack. */
  visMean: number;
  visMin: number;
  /** Mean R over 700–1200 nm (250 intervals), protected stack. */
  nirMean: number;
  /** Mean R over 400–700 nm without the overcoat. */
  bareVisMean: number;
  /** Lowest R on a 1 nm grid over 300–1200 nm and its wavelength (m). */
  minR: number;
  minWavelength: number;
}

/** NaN in every field for invalid input (see protectedSilverValid). */
export function protectedSilverSummary(p: ProtectedSilverInputs): ProtectedSilverSummary {
  const nan = { visMean: NaN, visMin: NaN, nirMean: NaN, bareVisMean: NaN, minR: NaN, minWavelength: NaN };
  if (!protectedSilverValid(p)) return nan;
  const substrate = protectedSilverSubstrate(p.nSub);
  const stacks = protectedSilverStacks(p);
  const R = (layers: CoatingLayer[]) => (lam: number) => coatingResponse(layers, substrate, lam).R;
  // Minimum of R over 300–1200 nm on a 1 nm grid (the Ag dip near 310 nm is a few nm wide).
  let min = { R: Infinity, wl: NaN };
  for (let w = 300; w <= 1200; w++) {
    const r = R(stacks.protectedAg)(w * NM);
    if (r < min.R) min = { R: r, wl: w };
  }
  const vis = intervalStats(R(stacks.protectedAg), 400 * NM, 700 * NM, 300);
  const nir = intervalStats(R(stacks.protectedAg), 700 * NM, 1200 * NM, 250);
  const bareVis = intervalStats(R(stacks.bare), 400 * NM, 700 * NM, 300);
  return { visMean: vis.mean, visMin: vis.min, nirMean: nir.mean, bareVisMean: bareVis.mean, minR: min.R, minWavelength: min.wl * NM };
}
