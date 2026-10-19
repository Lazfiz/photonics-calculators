/**
 * Spontaneous Raman scattering: shifts, scattered wavelengths and the anti-Stokes/Stokes ratio. SI units in and out:
 * wavelengths in m (vacuum), Raman shifts as wavenumbers in 1/m (1 cm⁻¹ = 100 m⁻¹), temperatures in K. Model tier:
 * exact (energy conservation; Boltzmann populations of a harmonic vibration).
 *
 * With ν̃_L = 1/λ_L and the shift Ω̃ (the vibrational wavenumber), a Stokes line lies at ν̃_L − Ω̃ and an anti-Stokes line
 * at ν̃_L + Ω̃ (../imaging/coherent-raman.ts has the wavelengths). The anti-Stokes line starts from the thermally
 * populated level v = 1, so for a harmonic vibration (Stokes ∝ n + 1, anti-Stokes ∝ n, n the Bose–Einstein occupation)
 *   I_aS / I_S = ((ν̃_L + Ω̃)/(ν̃_L − Ω̃))^m · exp(−hcΩ̃/(k_B T)),
 * with m = 4 for scattered power and m = 3 for photon counts (D. A. Long, The Raman Effect, Wiley 2002,
 * doi:10.1002/0470845767). Equal Raman cross-sections are assumed; resonance Raman breaks this.
 */
import { c, h, k_B } from "../constants";
export { antiStokesWavelength, stokesWavelength } from "../imaging/coherent-raman";

const positive = (x: number) => Number.isFinite(x) && x > 0;

/** Raman shift 1/λ_L − 1/λ of a line at λ, 1/m: positive for Stokes, negative for anti-Stokes lines. */
export function ramanShiftOf(lambdaLaser: number, lambdaLine: number): number {
  return positive(lambdaLaser) && positive(lambdaLine) ? 1 / lambdaLaser - 1 / lambdaLine : NaN;
}

/** Vibrational quantum hcΩ̃ of a shift Ω̃ (1/m), J. */
export function ramanShiftEnergy(shift: number): number {
  return Number.isFinite(shift) ? h * c * shift : NaN;
}

/**
 * Anti-Stokes/Stokes intensity ratio of one Raman line (see the header). `detection` is "photon" (m = 3: CCDs and
 * photon counters) or "power" (m = 4). NaN if the Stokes line does not exist (Ω̃ ≥ ν̃_L) or T ≤ 0.
 */
export function antiStokesStokesRatio(lambdaLaser: number, shift: number, temperature: number, detection: "photon" | "power"): number {
  if (!positive(lambdaLaser) || !(Number.isFinite(shift) && shift >= 0) || !positive(temperature)) return NaN;
  const nuL = 1 / lambdaLaser;
  if (shift >= nuL) return NaN;
  const m = detection === "power" ? 4 : 3;
  return ((nuL + shift) / (nuL - shift)) ** m * Math.exp(-(h * c * shift) / (k_B * temperature));
}
