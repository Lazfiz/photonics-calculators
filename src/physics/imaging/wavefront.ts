/**
 * Strehl ratio and peak-to-valley of a wavefront error. SI units in and out (lengths in m); σ/λ inputs are in waves.
 * Model tier: exact for a single Zernike term on a uniform circular pupil; the Maréchal forms are approximations.
 *
 * - Extended Maréchal approximation S ≈ exp(−(2πσ/λ)²) for an RMS wavefront error σ (Mahajan, "Strehl ratio for
 *   primary aberrations in terms of their aberration variance", J. Opt. Soc. Am. 73, 860–861 (1983),
 *   doi:10.1364/JOSA.73.000860). Maréchal's λ/14 comes from the first-order form 1 − (2πσ/λ)² = 0.8; with the
 *   exponential, S = 0.8 is σ = 0.0752λ.
 * - Exact Strehl S = |⟨exp(2πi(σ/λ)Z)⟩|² over the pupil for one Noll-normalised Zernike term of RMS σ (R. J. Noll,
 *   "Zernike polynomials and atmospheric turbulence", J. Opt. Soc. Am. 66, 207–211 (1976),
 *   doi:10.1364/JOSA.66.000207). The azimuthal integral of exp(iz cos mθ) is 2πJ₀(z), which leaves one radial
 *   integral (Mahajan, J. Opt. Soc. Am. 72, 1258–1266 (1982), doi:10.1364/JOSA.72.001258):
 *   defocus √3(2ρ² − 1): S = sinc²(φ/2), φ = 2√3·2πσ/λ;
 *   astigmatism √6ρ²cos 2θ: S = [∫₀¹ J₀(√6Φu) du]², Φ = 2πσ/λ, u = ρ²;
 *   coma √8(3ρ³ − 2ρ)cos θ: S = [∫₀¹ 2ρ J₀(√8Φ(3ρ³ − 2ρ)) dρ]²;
 *   spherical √5(6ρ⁴ − 6ρ² + 1): S = |∫₀¹ exp(i√5Φ(6u² − 6u + 1)) du|².
 *   Each is a term balanced against lower orders (defocus, tilt) for the best focus.
 * - Peak-to-valley of one term = (range of the polynomial) × σ: defocus 2√3, astigmatism 2√6, coma 2√8,
 *   spherical 1.5√5. A measured surface mixes terms and has no fixed PV/RMS ratio.
 */
import { besselJ, integrateSimpson, sinc } from "../math";

const positive = (x: number) => Number.isFinite(x) && x > 0;
const nonNegative = (x: number) => Number.isFinite(x) && x >= 0;

export type ZernikeMode = "defocus" | "astigmatism" | "coma" | "spherical";

/** PV/RMS of one Noll-normalised Zernike term. */
export const PV_RMS_RATIO: Record<ZernikeMode, number> = {
  defocus: 2 * Math.sqrt(3),
  astigmatism: 2 * Math.sqrt(6),
  coma: 2 * Math.sqrt(8),
  spherical: 1.5 * Math.sqrt(5),
};

/** Extended Maréchal Strehl ratio exp(−(2πσ/λ)²). */
export function marechalStrehl(rmsWavefront: number, lambda: number): number {
  if (!positive(lambda) || !nonNegative(rmsWavefront)) return NaN;
  const phase = (2 * Math.PI * rmsWavefront) / lambda;
  return Math.exp(-phase * phase);
}

/** RMS wavefront error σ = λ√(−ln S)/(2π) that gives a Maréchal Strehl S in (0, 1]. */
export function marechalRms(strehl: number, lambda: number): number {
  if (!positive(lambda) || !(positive(strehl) && strehl <= 1)) return NaN;
  return (lambda * Math.sqrt(-Math.log(strehl))) / (2 * Math.PI);
}

/** Peak-to-valley of one Zernike term with RMS σ. */
export function pvFromRms(rms: number, mode: ZernikeMode): number {
  return nonNegative(rms) ? rms * PV_RMS_RATIO[mode] : NaN;
}

/** RMS of one Zernike term with peak-to-valley PV. */
export function rmsFromPv(pv: number, mode: ZernikeMode): number {
  return nonNegative(pv) ? pv / PV_RMS_RATIO[mode] : NaN;
}

/** Exact Strehl of pure defocus with RMS σ/λ waves: sinc²(φ/2), φ = 2√3·2πσ/λ. */
export function defocusStrehlExact(rmsWaves: number): number {
  if (!nonNegative(rmsWaves)) return NaN;
  const s = sinc(Math.sqrt(3) * 2 * Math.PI * rmsWaves);
  return s * s;
}

/** Largest RMS handled by the radial quadrature, waves (S < 0.01 there for every mode). */
export const MAX_STREHL_RMS_WAVES = 5;

/**
 * Exact Strehl of one Zernike term with RMS σ/λ waves. Defocus is closed-form; the other modes use Simpson's rule
 * with ≥ 400 panels and ≥ 20 per radian of the largest phase: within 1e-7 of a 4× finer grid. NaN above 5 waves.
 */
export function zernikeStrehl(mode: ZernikeMode, rmsWaves: number): number {
  if (!nonNegative(rmsWaves) || rmsWaves > MAX_STREHL_RMS_WAVES) return NaN;
  if (rmsWaves === 0) return 1;
  if (mode === "defocus") return defocusStrehlExact(rmsWaves);
  const phi = 2 * Math.PI * rmsWaves;
  const panels = Math.max(400, Math.ceil(20 * PV_RMS_RATIO[mode] * phi));
  if (mode === "astigmatism") {
    const a = integrateSimpson((u) => besselJ(0, Math.sqrt(6) * phi * u), 0, 1, panels);
    return a * a;
  }
  if (mode === "coma") {
    const a = integrateSimpson((r) => 2 * r * besselJ(0, Math.sqrt(8) * phi * (3 * r ** 3 - 2 * r)), 0, 1, panels);
    return a * a;
  }
  const z = (u: number) => Math.sqrt(5) * phi * (6 * u * u - 6 * u + 1);
  const re = integrateSimpson((u) => Math.cos(z(u)), 0, 1, panels);
  const im = integrateSimpson((u) => Math.sin(z(u)), 0, 1, panels);
  return re * re + im * im;
}
