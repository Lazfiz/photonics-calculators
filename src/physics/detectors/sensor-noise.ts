/**
 * Image-sensor noise with spatial non-uniformity (fixed-pattern noise). Signals and noise in electrons (e⁻) per pixel
 * per frame; PRNU is a fraction of the mean photo signal. Invalid inputs give NaN.
 *
 * - EMVA Standard 1288, Release 3.1 (2016), Eq. (45)–(48): DSNU₁₂₈₈ is the spatial standard deviation of the dark
 *   image in e⁻ and PRNU₁₂₈₈ that of the photo response relative to its mean, so the spatial variance is
 *   s² = DSNU² + PRNU²·S². The total SNR of one frame is S/√(σ_d² + DSNU² + σ_q² + S + PRNU²·S²), where the temporal
 *   dark noise σ_d² = σ_r² + D holds the read noise and the shot noise of the dark charge, and σ_q = K/√12 is the
 *   quantization noise of a K e⁻/DN converter.
 * - J. R. Janesick, Photon Transfer (SPIE 2007, doi:10.1117/3.725073), ch. 5: σ_total² = σ_read² + σ_shot² + σ_FPN²
 *   with σ_FPN = P_N·S. On a log–log photon transfer curve the three regimes have slopes 0, ½ and 1; shot noise
 *   equals the read noise at S = σ_r² and equals the FPN at S = 1/P_N². Flat-field correction removes the spatial
 *   terms and leaves the temporal noise.
 */

import { quantizationNoise } from "./camera-snr";

export interface SensorNoiseInputs {
  /** Mean photoelectrons, e⁻. */
  signal: number;
  /** Read noise, e⁻ rms. */
  read: number;
  /** Mean dark charge, e⁻ (adds its shot noise). */
  dark?: number;
  /** Photo-response non-uniformity, fraction of the mean signal (0.01 = 1 %). */
  prnu?: number;
  /** Dark-signal non-uniformity, spatial e⁻ rms. */
  dsnu?: number;
  /** ADC step K, e⁻/DN (0 leaves out the quantization noise). */
  electronsPerDn?: number;
}

export interface SensorNoise {
  /** Photon shot noise √S. */
  shot: number;
  /** Dark-charge shot noise √D. */
  darkShot: number;
  read: number;
  /** Quantization noise K/√12. */
  quantization: number;
  /** PRNU·S. */
  prnu: number;
  dsnu: number;
  /** √(S + D + σ_r² + σ_q²): what survives flat-field correction. */
  temporal: number;
  /** √(DSNU² + (PRNU·S)²). */
  spatial: number;
  /** √(temporal² + spatial²). */
  total: number;
}

/** Temporal, spatial and total noise of one pixel in one frame (EMVA 1288 Eq. 48), e⁻ rms. */
export function sensorNoise({ signal, read, dark = 0, prnu = 0, dsnu = 0, electronsPerDn = 0 }: SensorNoiseInputs): SensorNoise {
  const bad = !(signal >= 0) || !(read >= 0) || !(dark >= 0) || !(prnu >= 0) || !(dsnu >= 0) || !(electronsPerDn >= 0);
  const quantization = quantizationNoise(electronsPerDn);
  const prnuNoise = prnu * signal;
  const temporal = Math.sqrt(signal + dark + read ** 2 + quantization ** 2);
  const spatial = Math.hypot(dsnu, prnuNoise);
  const result: SensorNoise = {
    shot: Math.sqrt(signal),
    darkShot: Math.sqrt(dark),
    read,
    quantization,
    prnu: prnuNoise,
    dsnu,
    temporal,
    spatial,
    total: Math.hypot(temporal, spatial),
  };
  if (bad) for (const key of Object.keys(result) as (keyof SensorNoise)[]) result[key] = NaN;
  return result;
}

/** Signal at which shot noise equals the read noise, σ_r² e⁻. */
export function shotReadCrossover(read: number): number {
  return read >= 0 ? read ** 2 : NaN;
}

/** Signal at which shot noise equals the PRNU noise, 1/PRNU² e⁻ (Infinity for a perfectly uniform sensor). */
export function shotPrnuCrossover(prnu: number): number {
  if (!(prnu >= 0)) return NaN;
  return prnu > 0 ? 1 / prnu ** 2 : Infinity;
}

/** Mulberry32: a small seeded generator, so the pattern is the same on the server and in the browser. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Illustrative n × n PRNU pattern: white pixel-to-pixel noise plus a gentle shading gradient, scaled to zero mean and a
 * unit sample standard deviation (the EMVA 1288 Eq. 24 normalisation, MN − 1). A sensor of mean signal S and PRNU P
 * shows S·(1 + P·pattern), whose spatial rms is exactly P·S.
 */
export function prnuPattern(n: number, seed = 1288): number[][] {
  if (!(Number.isInteger(n) && n >= 2)) return [];
  const rand = mulberry32(seed);
  const raw: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      // Box–Muller normal deviate; 1 − u keeps the log argument in (0, 1].
      const white = Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
      const shading = 0.8 * ((i / (n - 1) - 0.5) + 0.5 * (j / (n - 1) - 0.5));
      row.push(white + shading);
    }
    raw.push(row);
  }
  const values = raw.flat();
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
  return raw.map(row => row.map(v => (v - mean) / sd));
}
