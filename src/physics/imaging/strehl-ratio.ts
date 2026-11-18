/**
 * Strehl ratio page: RMS and PV of one Zernike term, Maréchal and exact Strehl, λ/14 and S = 0.8 tolerances.
 * SI units in and out (lengths in m). Model tier: exact for one Noll-normalised Zernike term on a uniform circular
 * pupil (see wavefront.ts); the Maréchal form exp(−(2πσ/λ)²) is the approximation (Mahajan, JOSA 73, 860 (1983)).
 */
import { marechalRms, marechalStrehl, pvFromRms, rmsFromPv, zernikeStrehl, type ZernikeMode } from "./wavefront";

export type WavefrontInput = "rms" | "pv";
/** Strehl ratio at which the page quotes the Maréchal RMS tolerance. */
export const STREHL_TARGET = 0.8;
/** Maréchal's rule: σ ≤ λ/14. */
export const MARECHAL_LAMBDA_DIVISOR = 14;

export interface StrehlSummary {
  /** m */ rms: number;
  /** σ/λ */ waves: number;
  /** PV of one term with this RMS, m. */
  pv: number;
  marechal: number;
  exact: number;
  /** λ/14, m. */
  lambda14: number;
  /** σ for S = 0.8 with the exponential form, m. */
  sigma08: number;
}

/** `wavefrontError` is the RMS or the PV (m) of one Zernike term, as `input` says. */
export function strehlSummary(lambda: number, wavefrontError: number, input: WavefrontInput, mode: ZernikeMode): StrehlSummary {
  const rms = input === "rms" ? wavefrontError : rmsFromPv(wavefrontError, mode);
  const waves = rms / lambda;
  return {
    rms,
    waves,
    pv: pvFromRms(rms, mode),
    marechal: marechalStrehl(rms, lambda),
    exact: zernikeStrehl(mode, waves),
    lambda14: lambda / MARECHAL_LAMBDA_DIVISOR,
    sigma08: marechalRms(STREHL_TARGET, lambda),
  };
}
