/**
 * Ring resonator of N identical concave mirrors (radius R) at the corners of a regular polygon, segment length d,
 * one output coupler. SI units. Model tier: exact within paraxial Gaussian-beam theory and the Airy model of a
 * lossy ring (plane waves, travelling one way).
 *
 * Spectrum: with ρ the round-trip power factor R_oc(1 − loss), the field returns as √ρ e^{iδ}, so the
 * intracavity power is ∝ 1/((1 − √ρ)² + 4√ρ sin²(δ/2)): coefficient of finesse F = 4√ρ/(1 − √ρ)² and
 * finesse ℱ = π ρ^¼/(1 − √ρ) (Siegman, Lasers (1986), ch. 11). FSR = c/L for round-trip length L = N d.
 *
 * Mode: one period is the unimodular matrix free(d)·mirror(R_eff). A mirror hit at angle of incidence α has
 * R_t = R cos α in the plane of the ring (tangential) and R_s = R/cos α across it (sagittal), so the mode is
 * astigmatic (Kogelnik, Ippen, Dienes & Shank, IEEE J. Quantum Electron. 8, 373 (1972),
 * doi 10.1109/JQE.1972.1076964). In a regular N-gon α = 90° − 180°/N. Each plane is stable for 0 < d/R_eff < 2,
 * with the waist mid-way between mirrors.
 */
import { c } from "../constants";
import { elementMatrix, multiply, periodicEigenmode, type PeriodicEigenmode } from "./abcd";

/** Coefficient of finesse 4√ρ/(1 − √ρ)² of a ring with round-trip power factor ρ; NaN unless 0 < ρ < 1. */
export function ringCoefficientOfFinesse(rho: number): number {
  if (!(rho > 0 && rho < 1)) return NaN;
  const r = Math.sqrt(rho);
  return (4 * r) / (1 - r) ** 2;
}

/** Finesse ℱ = π ρ^¼/(1 − √ρ); NaN unless 0 < ρ < 1. */
export function ringFinesse(rho: number): number {
  if (!(rho > 0 && rho < 1)) return NaN;
  return (Math.PI * Math.sqrt(Math.sqrt(rho))) / (1 - Math.sqrt(rho));
}

/** Intracavity power relative to its peak, 1/(1 + F sin²(δ/2)), at detuning Δν from a resonance, FSR in Hz. */
export function ringResponse(detuning: number, fsr: number, F: number): number {
  return 1 / (1 + F * Math.sin((Math.PI * detuning) / fsr) ** 2);
}

/** FSR c/L for round-trip length L, Hz. */
export function ringFsr(L: number): number {
  return L > 0 ? c / L : NaN;
}

/** Photon lifetime τ = (L/c)/(−ln ρ), s: the 1/e decay time of the stored power. */
export function ringPhotonLifetime(L: number, rho: number): number {
  return L > 0 && rho > 0 && rho < 1 ? L / c / -Math.log(rho) : NaN;
}

/** Angle of incidence on each mirror of a regular N-gon ring, π/2 − π/N, rad; NaN unless N ≥ 3. */
export function regularRingIncidence(N: number): number {
  return N >= 3 ? Math.PI / 2 - Math.PI / N : NaN;
}

/** Effective radius of a mirror hit at angle α: R cos α (tangential) or R/cos α (sagittal). */
export function tiltedMirrorRadius(R: number, alpha: number, plane: "tangential" | "sagittal"): number {
  return plane === "tangential" ? R * Math.cos(alpha) : R / Math.cos(alpha);
}

/**
 * Eigenmode in one plane, reference plane on a mirror: w is the spot on each mirror, w0 the waist mid-way
 * between mirrors, gouy the Gouy phase per segment.
 */
export function ringPlaneMode(lambda: number, d: number, R: number, alpha: number, plane: "tangential" | "sagittal"): PeriodicEigenmode {
  const Reff = tiltedMirrorRadius(R, alpha, plane);
  const period = multiply(elementMatrix({ kind: "space", d }), elementMatrix({ kind: "curved-mirror", R: Reff }));
  return periodicEigenmode(period, lambda);
}
