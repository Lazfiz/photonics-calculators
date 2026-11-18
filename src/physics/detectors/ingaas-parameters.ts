/**
 * InGaAs photodiode parameter summary at one operating point: band gap and cutoff, QE at 1300 and 1550 nm, responsivity,
 * generation-limited dark current, NEP and D* at 1550 nm. SI units (T in K, thickness in m, area in m², bias in V,
 * lifetime in s, reflectance as a fraction); D* in Jones (cm·√Hz/W). Composition of the base functions in `ingaas.ts`,
 * `dark-current.ts`, `photodiode-qe.ts` (QE = (1 − R)(1 − e^(−αd)), Saleh & Teich, Fundamentals of Photonics, 2nd ed.,
 * Wiley 2007, §18.1) and `responsivity.ts`. Kept apart so the pages that import those modules do not ship it.
 */

import { ingaasBandGap } from "../materials/bandgap";
import { generationCurrent, generationCurrentAtBias, generationNoiseDensity } from "./dark-current";
import { cutoffWavelength, ingaasAbsorption, ingaasIntrinsicDensity } from "./ingaas";
import { photodiodeQe } from "./photodiode-qe";
import { responsivity } from "./responsivity";

export interface IngaasParametersParams {
  /** Temperature, K. */
  T: number;
  /** In fraction x of InₓGa₁₋ₓAs. */
  x: number;
  /** Fully depleted absorber thickness, m. */
  thickness: number;
  /** m². */
  area: number;
  /** Bias, V (≤ 0 reverse). */
  bias: number;
  /** Generation lifetime τ_g, s. */
  lifetime: number;
  /** Front reflectance, fraction. */
  reflectance: number;
}

/** External QE (1 − R)(1 − e^(−α·d)) at λ (nm) for band gap E_g (eV). */
export function ingaasQeAt(lambda_nm: number, p: { bandGap: number; reflectance: number; thickness: number }): number {
  return photodiodeQe({ alpha: ingaasAbsorption(lambda_nm * 1e-9, p.bandGap), reflectance: p.reflectance, depletionWidth: p.thickness });
}

export interface IngaasParametersSummary {
  bandGap: number;
  cutoff_nm: number;
  qe1300: number;
  qe1550: number;
  /** A/W at 1550 nm. */
  r1550: number;
  /** m⁻³. */
  ni: number;
  /** Reverse-bias generation limit q·n_i·d·A/τ_g, A. */
  genCurrent: number;
  /** Dark current at the bias, A. */
  dark: number;
  /** √(2q·I_gen), A/√Hz. */
  noise: number;
  /** W/√Hz; NaN when 1550 nm is beyond the cutoff (no response). */
  nep1550: number;
  /** cm·Hz^½/W. */
  dStar1550: number;
}

export function ingaasParametersSummary(p: IngaasParametersParams): IngaasParametersSummary {
  const bandGap = ingaasBandGap(p.x, p.T);
  const qeParams = { bandGap, reflectance: p.reflectance, thickness: p.thickness };
  const ni = ingaasIntrinsicDensity(p.x, p.T);
  const genCurrent = generationCurrent(ni, p.thickness, p.area, p.lifetime);
  const noise = generationNoiseDensity(genCurrent);
  const qe1550 = ingaasQeAt(1550, qeParams);
  const r1550 = responsivity(qe1550, 1550e-9);
  const nep1550 = r1550 > 0 ? noise / r1550 : NaN;
  return {
    bandGap,
    cutoff_nm: cutoffWavelength(bandGap) * 1e9,
    qe1300: ingaasQeAt(1300, qeParams),
    qe1550,
    r1550,
    ni,
    genCurrent,
    dark: generationCurrentAtBias(genCurrent, p.bias, p.T),
    noise,
    nep1550,
    dStar1550: Math.sqrt(p.area * 1e4) / nep1550,
  };
}
