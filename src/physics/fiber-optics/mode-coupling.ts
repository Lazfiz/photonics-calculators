/**
 * Summary of the co-directional mode-coupling page: two lossless guides with coupling κ and mismatch Δβ, light launched
 * into guide 1 (formulas and source, Yariv 1973, in coupled-mode.ts). It sits beside coupled-mode.ts so the page and its
 * API schema share the input clamps without adding exports to a module other pages import.
 * SI in and out: length in m, κ and Δβ in 1/m, power in W. Model tier: coupled-mode theory (textbook approximation).
 */
import { codirectionalPeak, codirectionalPsi, codirectionalTransfer } from "./coupled-mode";

/** Largest values the page accepts: 1e7 µm, 1e4 mm⁻¹, 1e9 mW. */
export const MODE_COUPLING_MAX = { length: 1e7 * 1e-6, kappa: 1e4 * 1e3, deltaBeta: 1e4 * 1e3, power: 1e9 * 1e-3 } as const;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export interface ModeCouplingInput {
  length: number;
  kappa: number;
  deltaBeta: number;
  inputPower: number;
}

export function modeCouplingSummary(input: ModeCouplingInput) {
  const length = clamp(input.length, 0, MODE_COUPLING_MAX.length, 1000 * 1e-6);
  const kappa = clamp(input.kappa, 0, MODE_COUPLING_MAX.kappa, 0.5 * 1e3);
  const deltaBeta = clamp(input.deltaBeta, -MODE_COUPLING_MAX.deltaBeta, MODE_COUPLING_MAX.deltaBeta, 0.1 * 1e3);
  const inputPower = clamp(input.inputPower, 0, MODE_COUPLING_MAX.power, 1 * 1e-3);
  const psi = codirectionalPsi(kappa, deltaBeta);
  const fraction = codirectionalTransfer(kappa, deltaBeta, length);
  const peak = codirectionalPeak(kappa, deltaBeta);
  return {
    length, kappa, deltaBeta, inputPower, psi, fraction, peak,
    /** Period π/ψ of the power exchange, m (Infinity when κ = Δβ = 0). */
    beat: psi > 0 ? Math.PI / psi : Infinity,
    coupledPower: fraction * inputPower,
    throughPower: (1 - fraction) * inputPower,
  };
}
