/**
 * Illustrative physical-layer security of a free-space optical link: power that a legitimate receiver (Bob, on axis at
 * range L) and an eavesdropper (Eve, at distance z along the path and lateral offset r) collect from a Gaussian beam,
 * and the wiretap secrecy capacity for receivers limited by the same noise-equivalent power. SI units: m, W, Hz.
 * Model tier: illustrative (vacuum Gaussian beam, no turbulence or atmospheric loss, Eve does not block Bob, the
 * electrical SNR (P/(NEP·√B))² of an amplifier-limited receiver stands in for the IM/DD channel, and the Gaussian
 * wiretap formula is applied to it).
 *
 * Each receiver collects the fraction of the beam's 2-D Gaussian intensity (σ = w(z)/2 per axis) inside its aperture,
 * evaluated exactly with `gaussianDiscFraction` (pointing-loss.ts), so neither can collect more than the transmitted
 * power, in the near field included.
 */

import { beamRadius, gaussianDiscFraction } from "./pointing-loss";
import { secrecyCapacity } from "./channel-capacity";

export interface SecurityInputs {
  /** Transmit power, W. */
  power: number;
  /** Wavelength, m. */
  lambda: number;
  /** Beam waist 1/e² radius at the transmitter, m. */
  waist: number;
  /** Bob's range, m. */
  range: number;
  /** Bob's aperture diameter, m. */
  bobAperture: number;
  /** Eve's distance from the transmitter along the beam, m. */
  eveDistance: number;
  /** Eve's lateral offset from the beam axis, m. */
  eveOffset: number;
  /** Eve's aperture diameter, m. */
  eveAperture: number;
  /** Receiver noise-equivalent power (both receivers), W/√Hz. */
  nep: number;
  /** Electrical bandwidth, Hz. */
  bandwidth: number;
}

export interface SecurityResult {
  bobBeamRadius: number;
  eveBeamRadius: number;
  bobPower: number;
  evePower: number;
  snrBob: number;
  snrEve: number;
  /** Secrecy capacity, b/s. */
  secrecy: number;
}

/** Electrical SNR (P/(NEP·√B))² of a receiver limited by its noise-equivalent power. */
export function nepLimitedSnr(power: number, nep: number, bandwidth: number): number {
  if (!(nep > 0 && bandwidth > 0)) return NaN;
  const r = power / (nep * Math.sqrt(bandwidth));
  return r * r;
}

/** Power collected by a disc of diameter D, offset r from the axis, at distance z from the waist. */
export function capturedPower(
  power: number, lambda: number, waist: number, z: number, offset: number, apertureDiameter: number,
): number {
  const w = beamRadius(waist, lambda, z);
  return power * gaussianDiscFraction(offset, w / 2, apertureDiameter / 2);
}

export function linkSecurity(p: SecurityInputs): SecurityResult {
  const bobPower = capturedPower(p.power, p.lambda, p.waist, p.range, 0, p.bobAperture);
  const evePower = capturedPower(p.power, p.lambda, p.waist, p.eveDistance, p.eveOffset, p.eveAperture);
  const snrBob = nepLimitedSnr(bobPower, p.nep, p.bandwidth);
  const snrEve = nepLimitedSnr(evePower, p.nep, p.bandwidth);
  return {
    bobBeamRadius: beamRadius(p.waist, p.lambda, p.range),
    eveBeamRadius: beamRadius(p.waist, p.lambda, p.eveDistance),
    bobPower,
    evePower,
    snrBob,
    snrEve,
    secrecy: secrecyCapacity(p.bandwidth, snrBob, snrEve),
  };
}
