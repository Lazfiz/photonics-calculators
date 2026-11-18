/**
 * Cooling benefit of a silicon and an InGaAs detector: dark current vs temperature and the SNR it leaves. Temperatures
 * in °C. Si: depletion generation current ∝ n_i; InGaAs: diffusion current ∝ n_i² (so its cooling reduction is an upper bound).
 * S. M. Sze, K. K. Ng, Physics of Semiconductor Devices, 3rd ed. (Wiley 2007), doi:10.1002/0470068329, ch. 1–2.
 * E_g fixed or Varshni's E_g(T) (Si) / the Vurgaftman Ga₁₋ₓInₓAs gap (InGaAs). Kept apart from dark-current.ts so the
 * pages that import that module do not ship this model.
 */

import { darkCurrentRatio } from "./dark-current";
import { INGAAS_LATTICE_MATCHED_X, VARSHNI, ingaasBandGap, varshniBandGap } from "../materials/bandgap";

export const KELVIN = 273.15;
export const REFERENCE_TEMPERATURE_C = 25;
const T_REF = REFERENCE_TEMPERATURE_C + KELVIN;

export interface CoolingParams {
  /** Varshni E_g(T) for Si, else the fixed `egSi` (eV). */
  siVarshni: boolean;
  egSi: number;
  /** Vurgaftman In₀.₅₃Ga₀.₄₇As E_g(T), else the fixed `egInGaAs` (eV). */
  inGaAsVurgaftman: boolean;
  egInGaAs: number;
  /** Dark current at 25 °C, e⁻/pixel/s. */
  darkCurrent25Si: number;
  darkCurrent25InGaAs: number;
  /** e⁻ per exposure, read noise e⁻ rms, exposure s. */
  signal: number;
  readNoise: number;
  exposureTime: number;
}

/** Band gaps (eV), dark currents (e⁻/s) and SNR as functions of the temperature in °C. */
export function coolingModel(p: CoolingParams) {
  const siGapAt = (T: number) => (p.siVarshni ? varshniBandGap(T, VARSHNI.si) : p.egSi);
  const inGaAsGapAt = (T: number) => (p.inGaAsVurgaftman ? ingaasBandGap(INGAAS_LATTICE_MATCHED_X, T) : p.egInGaAs);
  const siDark = (Tc: number) => p.darkCurrent25Si * darkCurrentRatio(Tc + KELVIN, T_REF, siGapAt(Tc + KELVIN), "generation", siGapAt(T_REF));
  const inGaAsDark = (Tc: number) =>
    p.darkCurrent25InGaAs * darkCurrentRatio(Tc + KELVIN, T_REF, inGaAsGapAt(Tc + KELVIN), "diffusion", inGaAsGapAt(T_REF));
  const snr = (dark: number) => {
    const noise = Math.sqrt(p.signal + dark * p.exposureTime + p.readNoise * p.readNoise);
    return noise > 0 ? p.signal / noise : NaN;
  };
  return { siGapAt, inGaAsGapAt, siDark, inGaAsDark, snr };
}

/** The result cards for a cooling target in °C. */
export function coolingSummary(p: CoolingParams, coolTemp: number) {
  const m = coolingModel(p);
  const siCooled = m.siDark(coolTemp);
  const inGaAsCooled = m.inGaAsDark(coolTemp);
  return {
    siDarkCooled: siCooled,
    inGaAsDarkCooled: inGaAsCooled,
    siReduction: p.darkCurrent25Si / siCooled,
    inGaAsReduction: p.darkCurrent25InGaAs / inGaAsCooled,
    siSnr25: m.snr(m.siDark(REFERENCE_TEMPERATURE_C)),
    siSnrCooled: m.snr(siCooled),
    inGaAsSnr25: m.snr(m.inGaAsDark(REFERENCE_TEMPERATURE_C)),
    inGaAsSnrCooled: m.snr(inGaAsCooled),
    siGap25: m.siGapAt(T_REF),
    siGapCooled: m.siGapAt(coolTemp + KELVIN),
    inGaAsGap25: m.inGaAsGapAt(T_REF),
    inGaAsGapCooled: m.inGaAsGapAt(coolTemp + KELVIN),
  };
}
