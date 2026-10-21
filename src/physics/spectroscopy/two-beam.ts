/**
 * Two-beam interferometers with monochromatic light: Michelson and Mach-Zehnder fringes, visibility from the beam
 * powers, and the coherence factor of a Gaussian line. Intensities are fractions of the input power.
 *
 * Model tier: Exact for lossless beam splitters (power reflectance R, transmittance T = 1 − R, the reflected
 * field phase-shifted by π/2 against the transmitted one) and ideal plane waves. Two beams of power I₁, I₂ and
 * phase difference φ give I = I₁ + I₂ + 2√(I₁I₂)|γ| cos φ, so the visibility is V = 2√(I₁I₂)|γ|/(I₁ + I₂).
 *   Michelson: both arms meet the splitter once in reflection and once in transmission, so the detector sees
 *     I₁ = R T R₁ and I₂ = T R R₂; the splitter ratio cancels from V. OPD = 2nΔL for an arm-length difference ΔL.
 *   Mach-Zehnder (splitters R_a, R_b): output A gets R_a T_b and T_a R_b (bright at φ = 0), output B gets
 *     R_a R_b and T_a T_b with the opposite sign of the cross term; A + B = 1. OPD = nΔL (single pass).
 *   Gaussian line of FWHM Γ (wavenumber): |γ(x)| = exp(−(πΓx)²/(4 ln 2)), as in ftir.ts.
 *
 * References: M. Born & E. Wolf, Principles of Optics, 7th ed. (Cambridge University Press, 1999), ch. 7 (two-beam
 * interference, visibility) and ch. 10 (degree of coherence). P. Hariharan, Optical Interferometry, 2nd ed.
 * (Academic Press, 2003), ch. 2 (Michelson and Mach-Zehnder interferometers).
 */

export type TwoBeamType = "michelson" | "mz";

export interface BeamPair {
  I1: number;
  I2: number;
}

/** Fringe visibility 2√(I₁I₂)/(I₁ + I₂) of two mutually coherent beams. NaN unless I₁, I₂ ≥ 0 and I₁ + I₂ > 0. */
export function twoBeamVisibility({ I1, I2 }: BeamPair): number {
  if (!(I1 >= 0 && I2 >= 0 && I1 + I2 > 0)) return NaN;
  return (2 * Math.sqrt(I1 * I2)) / (I1 + I2);
}

/** Output intensity I₁ + I₂ + 2√(I₁I₂)·γ·cos φ (γ: modulus of the degree of coherence, 1 for monochromatic light). */
export function twoBeamIntensity({ I1, I2 }: BeamPair, phase: number, gamma = 1): number {
  if (!(I1 >= 0 && I2 >= 0)) return NaN;
  return I1 + I2 + 2 * Math.sqrt(I1 * I2) * gamma * Math.cos(phase);
}

/** Michelson beams at the detector: R T R₁ and T R R₂ (R: splitter reflectance; R₁, R₂: mirror reflectances). */
export function michelsonBeams(Rbs: number, R1: number, R2: number): BeamPair {
  if (![Rbs, R1, R2].every((r) => r >= 0 && r <= 1)) return { I1: NaN, I2: NaN };
  const rt = Rbs * (1 - Rbs);
  return { I1: rt * R1, I2: rt * R2 };
}

/**
 * Mach-Zehnder beams at each output for splitter reflectances R_a, R_b. Output A's cross term is +2√(I₁I₂) cos φ,
 * output B's is −2√(I₁I₂) cos φ.
 */
export function machZehnderBeams(Ra: number, Rb: number): { A: BeamPair; B: BeamPair } {
  if (!(Ra >= 0 && Ra <= 1 && Rb >= 0 && Rb <= 1)) return { A: { I1: NaN, I2: NaN }, B: { I1: NaN, I2: NaN } };
  return { A: { I1: Ra * (1 - Rb), I2: (1 - Ra) * Rb }, B: { I1: Ra * Rb, I2: (1 - Ra) * (1 - Rb) } };
}

/** Optical path difference for an arm-length difference ΔL in a medium of index n: 2nΔL (Michelson), nΔL (Mach-Zehnder). */
export function twoBeamOpd(type: TwoBeamType, dL: number, n = 1): number {
  return (type === "michelson" ? 2 : 1) * n * dL;
}

/** Modulus of the degree of coherence of a Gaussian line of FWHM Γ at OPD x (Γ and 1/x in the same unit). */
export function gaussianLineCoherence(fwhm: number, x: number): number {
  if (!(fwhm >= 0)) return NaN;
  return Math.exp(-((Math.PI * fwhm * x) ** 2) / (4 * Math.LN2));
}
