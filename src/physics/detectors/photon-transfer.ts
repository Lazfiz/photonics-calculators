/**
 * Photon-transfer page summary: noise at full well, noise floor, regime crossovers and dynamic range. Electrons per pixel
 * per frame; the noise model is sensor-noise.ts (Janesick, Photon Transfer, SPIE 2007, doi:10.1117/3.725073, ch. 5).
 */

import { dynamicRangeDb } from "./camera-snr";
import { sensorNoise, shotPrnuCrossover, shotReadCrossover, type SensorNoise } from "./sensor-noise";

export interface PhotonTransferInputs {
  /** Conversion gain K, e⁻/DN. */
  gain: number;
  /** Read noise, e⁻ rms. */
  read: number;
  /** Full well, e⁻. */
  wellCapacity: number;
  /** PRNU as a fraction (0.01 = 1 %). */
  prnu: number;
}

export interface PhotonTransferSummary {
  /** Noise at full well. */
  full: SensorNoise;
  /** √(σ_read² + K²/12), e⁻. */
  floor: number;
  /** Signal where shot noise equals the floor, σ_r² + K²/12 (e⁻). */
  readCrossover: number;
  /** Signal where shot noise equals PRNU noise, 1/PRNU² (e⁻; Infinity without PRNU). */
  prnuCrossover: number;
  /** 20·log₁₀(full well / floor), dB. */
  dynamicRangeDb: number;
}

/** Noise of one pixel at mean signal S (e⁻), as the page's curves use it. */
export function photonTransferNoiseAt(signal: number, p: Pick<PhotonTransferInputs, "gain" | "read" | "prnu">): SensorNoise {
  return sensorNoise({ signal, read: p.read, prnu: p.prnu, electronsPerDn: p.gain });
}

export function photonTransferSummary(p: PhotonTransferInputs): PhotonTransferSummary {
  const full = photonTransferNoiseAt(p.wellCapacity, p);
  const floor = Math.hypot(p.read, full.quantization);
  return {
    full,
    floor,
    readCrossover: shotReadCrossover(floor),
    prnuCrossover: shotPrnuCrossover(p.prnu),
    dynamicRangeDb: dynamicRangeDb(p.wellCapacity, floor),
  };
}
