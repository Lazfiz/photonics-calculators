/**
 * Shot-noise page: the shot-noise current of a photocurrent and the resulting shot-noise-limited SNR. SI units (A, Hz).
 * Invalid inputs give NaN; the SNR is NaN at zero photocurrent (no signal, no noise).
 *
 * i_shot = √(2·q·I·B) (W. Schottky, Ann. Phys. 362, 541 (1918), doi:10.1002/andp.19183622304); amplitude SNR
 * I/i_shot = √(I/(2qB)), power SNR I²/i_shot² = I/(2qB). The primitive is `shotNoiseCurrent` in `noise.ts`.
 */

import { shotNoiseCurrent } from "./noise";

export interface ShotNoiseSummary {
  /** Shot-noise current, A rms. */
  iShot: number;
  /** I/i_shot. */
  snrAmplitude: number;
  /** (I/i_shot)². */
  snrPower: number;
}

export function shotNoiseSummary(photocurrent: number, bandwidth: number): ShotNoiseSummary {
  const iShot = shotNoiseCurrent(photocurrent, bandwidth);
  const snrAmplitude = photocurrent / iShot;
  return { iShot, snrAmplitude, snrPower: snrAmplitude * snrAmplitude };
}
