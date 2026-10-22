/**
 * Radiation-induced attenuation (RIA) of a glass or fibre as a power law of the absorbed dose. SI units: dose in Gy,
 * lengths in m, attenuation in dB/m.
 *
 *   A(D) = A₁ D^f,  0 < f ≤ 1      A₁ the induced loss at 1 Gy; T_int = 10^(−A L/10)
 * Model tier: illustrative. The power law describes many measured growth curves at a fixed dose rate, temperature
 * and wavelength, with f ≤ 1 as colour centres saturate; A₁ and f must be fitted to data for the glass, wavelength
 * and dose rate in use, and the loss partly anneals after the exposure (D. L. Griscom, M. E. Gingerich,
 * E. J. Friebele, IEEE Trans. Nucl. Sci. 41, 523 (1994), doi:10.1109/23.299793). No preset coefficients.
 */

/** Induced attenuation A₁ D^f, dB/m; 0 at zero dose; NaN unless A₁ ≥ 0, f > 0 and D ≥ 0. */
export function inducedAttenuation(a1: number, f: number, dose: number): number {
  if (!(a1 >= 0 && f > 0 && dose >= 0 && Number.isFinite(dose))) return NaN;
  return dose === 0 ? 0 : a1 * dose ** f;
}

/** Internal transmission 10^(−A L/10) of a length L (m) with attenuation A (dB/m). */
export function internalTransmission(attenuationDbPerM: number, length: number): number {
  if (!(attenuationDbPerM >= 0 && length >= 0)) return NaN;
  return 10 ** (-(attenuationDbPerM * length) / 10);
}

/** Dose at which a length L reaches a total induced loss (dB): (loss/(A₁ L))^(1/f), Gy; NaN without growth. */
export function doseForLoss(a1: number, f: number, length: number, lossDb: number): number {
  if (!(a1 > 0 && f > 0 && length > 0 && lossDb >= 0)) return NaN;
  return (lossDb / (a1 * length)) ** (1 / f);
}
