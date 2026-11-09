/**
 * Page summary for the fiber-optic-sensor page and its API schema, built on fiber-sensors.ts (sources there). Kept
 * apart from that module because the bundler doesn't drop unused exports: code here would ship on every page that
 * imports fiber-sensors. SI units.
 */
import { coefficientOfFinesse } from "../thin-film/interference";
import {
  SMF28_THERMAL_COEFFICIENT, braggShift, phaseStrainSensitivity, phaseTemperatureSensitivity, strainGaugeFactor,
} from "./fiber-bragg-grating";
import { WATER_DN_DT, freeSpectralRange, penetrationDepth, penetrationDepthSensitivity } from "./fiber-sensors";

/** Largest |ΔT| (K) of the evanescent-sensor model: water dn/dT is only roughly constant within ±30 K of room temperature. */
export const EVANESCENT_DT_MAX = 30;
/** Largest |ΔT| (K) of the other sensor types (the K_T(T) fit of Cosme et al. covers −20…100 °C around 20 °C). */
export const SENSOR_DT_MAX = 100;

export type SensorType = "fbg" | "mach_zehnder" | "fabry_perot" | "evanescent";

export interface SensorParams {
  /** Wavelength (Bragg wavelength for the FBG), m. */
  lambda: number;
  /** Strain, dimensionless. */
  strain: number;
  /** Temperature change, K. */
  deltaT: number;
  /** Mode (phase) effective index. */
  nEff: number;
  /** Mach-Zehnder sensing-arm length, m. */
  gaugeLength: number;
  /** EFPI air gap, m. */
  cavityLength: number;
  /** EFPI end-face reflectance. */
  mirrorR: number;
  /** External index at ΔT = 0 (evanescent). */
  nExt: number;
}

/**
 * Response of one sensor type with the SMF-28 thermal coefficient K_T (6.165e-6 /K) and the strain gauge factor
 * 1 − p_e. FBG: Bragg shifts (m) and sensitivities (m per µε, m per K). Mach-Zehnder: phase (rad) and its sensitivities per
 * µε and per K. EFPI: FSR (m), coefficient of finesse F, peak reflectance F/(1 + F) and fringe shift λε (m). Evanescent:
 * n_ext(ΔT) = n_ext + (dn/dT)ΔT, penetration depth d_p (m, NaN when not guided), its change from ΔT and d(d_p)/dn_ext.
 */
export function sensorResponse(type: SensorType, p: SensorParams) {
  const gauge = strainGaugeFactor(p.nEff);
  const KT = SMF28_THERMAL_COEFFICIENT;
  const { lambda, strain: eps, deltaT: dT, nEff } = p;
  switch (type) {
    case "fbg": {
      const strainShift = braggShift(lambda, eps, 0, gauge, KT);
      const tempShift = braggShift(lambda, 0, dT, gauge, KT);
      return {
        kind: "fbg" as const, gauge, strainShift, tempShift, total: strainShift + tempShift,
        strainPm: braggShift(lambda, 1e-6, 0, gauge, KT) * 1e12, tempPm: braggShift(lambda, 0, 1, gauge, KT) * 1e12,
      };
    }
    case "mach_zehnder": {
      const perStrain = phaseStrainSensitivity(lambda, nEff, p.gaugeLength, gauge); // rad per unit strain
      const perK = phaseTemperatureSensitivity(lambda, nEff, p.gaugeLength, KT);
      return { kind: "mzi" as const, gauge, perMicrostrain: perStrain * 1e-6, perK, phase: perStrain * eps + perK * dT, perStrain };
    }
    case "fabry_perot": {
      const d = p.cavityLength;
      const R = p.mirrorR;
      const F = coefficientOfFinesse(R);
      return { kind: "efpi" as const, gauge, d, R, F, fsr: freeSpectralRange(lambda, 1, d), peak: F / (1 + F), fringeShift: lambda * eps };
    }
    case "evanescent": {
      const nExt0 = p.nExt;
      const nExt = nExt0 + WATER_DN_DT * dT;
      return {
        kind: "evanescent" as const, gauge, nExt0, nExt,
        dp: penetrationDepth(lambda, nEff, nExt), dp0: penetrationDepth(lambda, nEff, nExt0),
        sens: penetrationDepthSensitivity(lambda, nEff, nExt),
      };
    }
  }
}
