/**
 * Page summaries for the fiber-bragg-grating and fiber-bragg-grating-sensor pages and their API schemas, built on
 * fiber-bragg-grating.ts (sources there). Kept apart from that module because macro-bending-loss.ts imports it, and the
 * bundler doesn't drop unused exports: code here would ship on every page that imports macro-bending-loss. SI units.
 */
import {
  SMF28_FIT_T_MAX_C, SMF28_FIT_T_MIN_C, SMF28_REFERENCE_T_C, braggShift, braggWavelength, chirpedBandwidth,
  chirpedGratingDispersion, couplingCoefficient, effectivePhotoelastic, firstZeroBandwidth, gratingSections, maxChirp,
  peakReflectance, spectrumFwhm, strainGaugeFactor, transferMatrixReflectance, uniformFwhm, uniformGratingReflectance,
  type UniformGrating,
} from "./fiber-bragg-grating";

export type GratingType = "uniform" | "apodized" | "chirped";

/** Wavelength samples across the reflection spectrum that the page plots and the FWHM search of non-uniform gratings scans. */
export const GRATING_SPECTRUM_SAMPLES = 600;

/**
 * Summary of a fibre Bragg grating of the page's three kinds. Uniform: closed form (Erdogan eq. 20); apodized (Gaussian,
 * FWHM = L/2) and chirped: transfer matrices over uniform sections. `chirpRate` is dλ_B/dz in m/m, used for "chirped"
 * only and limited to ±maxChirp (so that λ_B(z) stays within ±5 %); `chirpClamped` says it was limited.
 * Returns period (m), period count, κL, first-zero width (m), peak reflectance, FWHM (m), chirp bandwidth (m), the
 * chirp limit (m/m), the dispersion (s/m, Infinity without chirp) and the plotted spectrum (wavelength in m).
 */
export function braggGratingSummary(g: UniformGrating, type: GratingType, chirpRate: number, samples = GRATING_SPECTRUM_SAMPLES) {
  const { lambdaB, nEff, length, deltaN } = g;
  const chirpLimit = maxChirp(lambdaB, length);
  const chirp = type === "chirped" ? Math.min(Math.max(chirpRate, -chirpLimit), chirpLimit) : 0;
  const period = lambdaB / (2 * nEff);
  const kappaL = couplingCoefficient(deltaN, lambdaB) * length;
  const zeroWidth = firstZeroBandwidth(g);

  // Piecewise-uniform model for apodized and chirped gratings (200–5000 sections, each ≥ 20 periods).
  const sections = gratingSections({ ...g, apodization: type === "apodized" ? "gaussian" : "uniform", chirp });
  const reflect = (lam: number) =>
    type === "uniform" ? uniformGratingReflectance(g, lam) : transferMatrixReflectance(sections, nEff, lam);

  const halfSpan = 1.5 * zeroWidth + chirpedBandwidth(chirp, length) / 2;
  const x: number[] = [], y: (number | null)[] = [];
  for (let i = 0; i <= samples; i++) {
    const lam = lambdaB - halfSpan + (2 * halfSpan * i) / samples;
    const R = reflect(lam);
    x.push(lam);
    y.push(Number.isFinite(R) ? R : null);
  }
  const sampledPeak = Math.max(...y.map((v) => v ?? 0));
  return {
    period, numPeriods: length / period, kappaL, zeroWidth,
    peak: type === "uniform" ? peakReflectance(kappaL) : sampledPeak,
    fwhm: type === "uniform" ? uniformFwhm(g) : spectrumFwhm(reflect, lambdaB - halfSpan, lambdaB + halfSpan, samples),
    chirpWidth: chirpedBandwidth(chirp, length),
    chirpClamped: type === "chirped" && Math.abs(chirpRate) > chirpLimit, chirpLimit,
    dispersion: chirpedGratingDispersion(nEff, chirp),
    spectrum: { x, y },
  };
}

/**
 * Bragg-grating strain and temperature sensor: grating period (m), phase index, length (m), ac index modulation, strain
 * (dimensionless), ΔT from 20 °C (K), K_T (1/K) and dK_T/dT (1/K²). Returns λ_B = 2 n_eff Λ, p_e, gauge factor, the
 * strain, temperature and total shifts and the shifted Bragg wavelength (m), the peak reflectance, the uniform-grating
 * FWHM and first-zero width (m), the per-µε and per-K sensitivities (m) and whether 20 °C + ΔT lies outside the
 * range of the K_T(T) fit (`SMF28_FIT_T_MIN_C…SMF28_FIT_T_MAX_C`). `tempShiftAt(ΔT)` gives the temperature shift for another ΔT.
 */
export function braggSensorSummary(
  period: number, nEff: number, length: number, deltaN: number, strain: number, deltaT: number, thermal: number, thermalSlope: number,
) {
  const lambdaB = braggWavelength(nEff, period);
  const g: UniformGrating = { lambdaB, nEff, length, deltaN };
  const pe = effectivePhotoelastic(nEff);
  const gauge = strainGaugeFactor(nEff);
  const tempShiftAt = (t: number) => braggShift(lambdaB, 0, t, gauge, thermal, thermalSlope);
  const strainShift = braggShift(lambdaB, strain, 0, gauge, thermal);
  const tempShift = tempShiftAt(deltaT);
  const totalShift = strainShift + tempShift;
  return {
    g, lambdaB, pe, gauge, strainShift, tempShift, totalShift, shiftedLambdaB: lambdaB + totalShift, tempShiftAt,
    outsideFit: SMF28_REFERENCE_T_C + deltaT < SMF28_FIT_T_MIN_C || SMF28_REFERENCE_T_C + deltaT > SMF28_FIT_T_MAX_C,
    reflectivity: peakReflectance(couplingCoefficient(deltaN, lambdaB) * length),
    fwhm: uniformFwhm(g), zeroWidth: firstZeroBandwidth(g),
    strainPerMicrostrain: braggShift(lambdaB, 1e-6, 0, gauge, thermal), // m per µε
    tempPerKelvin: braggShift(lambdaB, 0, 1, gauge, thermal), // m per K at 20 °C (the K_T term alone)
  };
}
