/**
 * Polarization-maintaining fibre: the page's summary (beat length, DGD per length, output extinction ratio after
 * random mode coupling, fibre crosstalk, length to a target ratio). SI in and out (m, 1/m); extinction ratios in dB.
 * Kept apart from fiber-birefringence.ts, which other pages import. Model tier: textbook approximation
 * (Noda, Okamoto and Sasaki, J. Lightwave Technol. 4, 1071 (1986): random coupling with power-coupling parameter h).
 */
import {
  beatLength, crossPolarizedRatio, dgdPerLength, fibreCrosstalkDb, lengthToRatio, ratioFromDb, ratioToDb,
} from "./fiber-birefringence";

export interface PolarizationMaintainingParams {
  /** Birefringence B (dimensionless; stress birefringence, so the group value ≈ the phase value). */
  B: number;
  /** h-parameter, 1/m. */
  h: number;
  /** Wavelength, m. */
  lambda: number;
  /** Fibre length, m. */
  L: number;
  /** Input extinction ratio, dB. */
  erDb: number;
  /** Required extinction ratio, dB. */
  targetDb: number;
}

export interface PolarizationMaintainingSummary {
  /** Input power ratio Py/Px. */
  eps0: number;
  beatLength: number;
  /** s/m. */
  dgd: number;
  outDb: number;
  fibreXt: number;
  /** Length to reach the target ratio, m (0: already worse, Infinity: never). */
  Ltarget: number;
  meets: boolean;
}

export function polarizationMaintainingSummary(p: PolarizationMaintainingParams): PolarizationMaintainingSummary {
  const eps0 = ratioFromDb(p.erDb);
  const outDb = ratioToDb(crossPolarizedRatio(eps0, p.h, p.L));
  return {
    eps0,
    beatLength: beatLength(p.B, p.lambda),
    dgd: dgdPerLength(p.B),
    outDb,
    fibreXt: fibreCrosstalkDb(p.h, p.L),
    Ltarget: lengthToRatio(eps0, ratioFromDb(p.targetDb), p.h),
    meets: outDb >= p.targetDb,
  };
}
