/**
 * Optical time-domain reflectometry of single-mode fibre: resolution, Rayleigh backscatter level, receiver noise,
 * dynamic range and reflective events. SI units; levels in dB where named.
 * Model tier: textbook approximation.
 *
 *   Resolution      Δz = v_g τ/2 = cτ/(2n_g), the fibre length a rectangular pulse of width τ spans on the round trip.
 *   Backscatter     P_bs(z) = P₀ · S α_s (v_g τ/2) · e^(−2αz)  (Barnoski & Jensen, Appl. Opt. 15, 2112 (1976),
 *                   doi 10.1364/AO.15.002112), α_s the Rayleigh scattering coefficient (1/m), α the total loss;
 *                   for long pulses v_g τ/2 → sinh(αΔz)/α (the loss across the lit length).
 *   Capture         S = (3/2)·(λ/(2π n w))² for a Gaussian mode of field radius w (Brinkmeyer, J. Opt. Soc. Am. 70,
 *                   1010 (1980), doi 10.1364/JOSA.70.001010): the dipole pattern 3/(8π) per sr times λ²/n² over the
 *                   intensity-weighted mode area πw².
 *   Noise           P_n = NEP·√B/√N with the matched-filter noise bandwidth B = 1/(2τ) of a rectangular pulse and N
 *                   averaged traces (SNR = 1 noise level): an ideal matched receiver whose NEP doesn't depend on its
 *                   bandwidth. Real OTDRs gain less than the resulting 7.5 dB per decade at long pulses.
 *   Dynamic range   one-way dB, as OTDRs display: DR = 5 log₁₀(P_bs(0)/P_n).
 *   Reflection      a reflectance R over local backscatter η = S α_s v_g τ/2 shows a peak 5 log₁₀(1 + R/η) high.
 * Not included: receiver recovery (attenuation dead zones), the 98 %-noise-point DR convention (≈ 1.5–2 dB less),
 * coherent fading and the non-Gaussian LP01 tail.
 */
import { c } from "../constants";
import { normalIncidenceReflectance } from "../polarization/fresnel";

/** dB/km → power attenuation coefficient in 1/m. */
export const dbPerKmToPerM = (dbPerKm: number) => (dbPerKm * Math.LN10) / 10 / 1000;

/** Two-point (spatial) resolution Δz = cτ/(2n_g), m. NaN unless τ > 0 and n_g ≥ 1. */
export function twoPointResolution(tau: number, nGroup: number): number {
  if (!(tau > 0) || !(nGroup >= 1)) return NaN;
  return (c * tau) / (2 * nGroup);
}

/** Brinkmeyer's backscatter capture fraction S = (3/2)(λ/(2π n w))² for mode field radius w (m). */
export function captureFraction(lambda: number, modeFieldRadius: number, n: number): number {
  if (!(lambda > 0) || !(modeFieldRadius > 0) || !(n >= 1)) return NaN;
  return 1.5 * (lambda / (2 * Math.PI * n * modeFieldRadius)) ** 2;
}

/**
 * Backscatter coefficient: backscattered over launched peak power, extrapolated to z = 0 (ratio, not dB).
 * Integrating P₀ S α_s e^(−2αz') over the Δz the pulse lights, centred on z, gives η = S α_s sinh(αΔz)/α, which is
 * S α_s Δz = S α_s v_g τ/2 while αΔz ≪ 1 (+0.14 dB at αΔz = 0.45: 100 µs at 0.19 dB/km). alphaTotal in 1/m, ≥ 0.
 */
export function backscatterRatio(S: number, alphaScatterPerM: number, tau: number, nGroup: number, alphaTotal = 0): number {
  if (!(S > 0) || !(alphaScatterPerM > 0) || !(alphaTotal >= 0)) return NaN;
  const dz = twoPointResolution(tau, nGroup);
  const x = alphaTotal * dz;
  return S * alphaScatterPerM * dz * (x > 0 ? Math.sinh(x) / x : 1);
}

/** Noise level P_n = NEP·√(1/(2τ))/√N, W. NEP in W/√Hz, N ≥ 1 averages. */
export function noisePower(nep: number, tau: number, averages: number): number {
  if (!(nep > 0) || !(tau > 0) || !(averages >= 1)) return NaN;
  return (nep * Math.sqrt(1 / (2 * tau))) / Math.sqrt(averages);
}

/** One-way dynamic range 5 log₁₀(P_bs(0)/P_n), dB. */
export function dynamicRangeDb(backscatterPower: number, noise: number): number {
  if (!(backscatterPower > 0) || !(noise > 0)) return NaN;
  return 5 * Math.log10(backscatterPower / noise);
}

/** Normal-incidence Fresnel power reflectance between indices n₁ and n₂. */
export function fresnelReflectance(n1: number, n2: number): number {
  return normalIncidenceReflectance(n1, n2);
}

/** Height of a reflective event above the local backscatter, one-way dB: 5 log₁₀(1 + R/η). */
export function reflectivePeakDb(reflectance: number, eta: number): number {
  if (!(reflectance >= 0) || !(eta > 0)) return NaN;
  return 5 * Math.log10(1 + reflectance / eta);
}

export interface OtdrTraceParams {
  /** Fibre length, m. */
  length: number;
  /** Total fibre loss, dB/km. */
  lossDbPerKm: number;
  /** Splice positions, m, each with a non-reflective loss in dB. */
  splices: { z: number; lossDb: number }[];
  /** Reflectance of the launch connector and of the far end (power ratios). */
  launchReflectance: number;
  endReflectance: number;
  /** Backscatter ratio η at the pulse width, and the noise over the near-end backscatter, P_n/P_bs(0). */
  eta: number;
  noiseRatio: number;
  /** Two-point resolution, m: the width of each reflective peak. */
  resolution: number;
  /** Samples of the smooth parts; event edges are added exactly. */
  samples?: number;
}

/**
 * Model trace, one-way dB relative to the near-end backscatter: 5 log₁₀((P(z) + P_n)/P_bs(0)). Splices drop the
 * level by their loss; reflective events are rectangles one resolution wide; beyond the end only noise remains.
 * Returns the points and the noise level in the same scale.
 */
export function otdrTrace(p: OtdrTraceParams): { z: number[]; level: number[]; noiseDb: number } {
  const { length: L, resolution: dz } = p;
  const a = dbPerKmToPerM(p.lossDbPerKm);
  const splices = p.splices.filter((s) => s.z > 0 && s.z < L).sort((u, v) => u.z - v.z);
  // Linear backscatter (relative to the near end) just after z, excluding reflections.
  const backscatter = (z: number) => {
    if (z > L) return 0;
    let dB = 0;
    for (const s of splices) if (s.z <= z) dB += s.lossDb;
    return Math.exp(-2 * a * z) * 10 ** (-dB / 5);
  };
  const reflection = (z: number) => {
    let r = 0;
    if (z >= 0 && z < dz) r += p.launchReflectance / p.eta;
    if (z >= L && z < L + dz) r += (p.endReflectance / p.eta) * backscatter(L);
    return r;
  };
  const toDb = (lin: number) => 5 * Math.log10(lin + p.noiseRatio);

  const zEnd = L * 1.08 + dz;
  const n = Math.max(2, Math.min(p.samples ?? 600, 5000));
  const zs = new Set<number>();
  for (let i = 0; i <= n; i++) zs.add((zEnd * i) / n);
  const eps = Math.min(dz, L) * 1e-6;
  for (const e of [0, dz, ...splices.map((s) => s.z), L, L + dz]) {
    if (e > eps) zs.add(e - eps);
    zs.add(e);
  }
  const z = [...zs].filter((x) => x >= 0 && x <= zEnd).sort((u, v) => u - v);
  // Under the end peak the local backscatter stays (the peak height is 5 log₁₀(1 + R/η) above it).
  const level = z.map((x) => toDb((x < L + dz ? backscatter(Math.min(x, L)) : 0) + reflection(x)));
  return { z, level, noiseDb: 5 * Math.log10(p.noiseRatio) };
}
