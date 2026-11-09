import { dispersionCompLinkSummary } from "../../physics/fiber-optics/chromatic-dispersion";
import { defineSchema } from "../types";

const AGRAWAL = "Agrawal G. P. (2010), Fiber-Optic Communication Systems, 4th ed., Wiley, doi:10.1002/9780470918524, " +
  "§2.4.3 (4Bσ ≤ 1, broad source), §5.4.4 (dispersion power penalty) and the dispersion-management chapter (DCF length, S₁/D₁ = S₂/D₂)";

export default defineSchema({
  href: "/fiber-optics/dispersion-comp",
  inputs: [
    { key: "dispersion", label: "Span dispersion D at λ₀", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²", default: 17, min: -500, max: 500 },
    { key: "slope", label: "Span dispersion slope S at λ₀", unit: "ps/(nm²·km)", toSI: 1e3, siUnit: "s/m³", default: 0.058, min: -5, max: 5 },
    { key: "fiberLength", label: "Span length", unit: "km", toSI: 1e3, siUnit: "m", default: 80, min: 0.001, max: 20000 },
    { key: "bwNm", label: "Source rms width σ_λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 0.5, min: 0, max: 100 },
    { key: "bitRate", label: "Bit rate", unit: "Gb/s", toSI: 1e9, siUnit: "1/s", default: 10, min: 0.001, max: 1000 },
    { key: "compDispersion", label: "DCF dispersion D at λ₀", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²", default: -100, min: -1000, max: 1000 },
    { key: "compSlope", label: "DCF dispersion slope S at λ₀", unit: "ps/(nm²·km)", toSI: 1e3, siUnit: "s/m³", default: -0.2, min: -20, max: 20 },
    { key: "refWavelength", label: "Reference wavelength λ₀ (where D, S are given)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 800, max: 2000 },
    { key: "channelWavelength", label: "Channel wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 800, max: 2000 },
  ],
  outputs: [
    { key: "accumulatedDispersion", label: "Uncompensated accumulated dispersion at the channel", unit: "ps/nm", toSI: 1e-3, siUnit: "s/m" },
    { key: "broadeningUncompensated", label: "Uncompensated rms broadening σ_b", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "bitRateLimit", label: "Uncompensated bit-rate limit (4Bσ ≤ 1, optimum input pulse)", unit: "Gb/s", toSI: 1e9, siUnit: "1/s" },
    { key: "penaltyUncompensated", label: "Uncompensated dispersion penalty", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "dcfLength", label: "DCF length that nulls the dispersion at λ₀", unit: "km", toSI: 1e3, siUnit: "m" },
    { key: "residualSlope", label: "Residual dispersion slope S_res", unit: "ps/nm²", toSI: 1e6, siUnit: "s/m²" },
    { key: "slopeCompensation", label: "Share of the span slope compensated", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "residualDispersion", label: "Residual dispersion at the channel", unit: "ps/nm", toSI: 1e-3, siUnit: "s/m" },
    { key: "broadeningCompensated", label: "Compensated rms broadening σ_b", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "penaltyCompensated", label: "Compensated dispersion penalty", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "usableHalfBandwidth", label: "Usable half-bandwidth about λ₀ (1 dB penalty)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "toleratedResidual", label: "Tolerated |D_acc| of the compensated link (1 dB penalty)", unit: "ps/nm", toSI: 1e-3, siUnit: "s/m" },
  ],
  compute({ dispersion, slope, fiberLength, bwNm, bitRate, compDispersion, compSlope, refWavelength, channelWavelength }) {
    const r = dispersionCompLinkSummary({
      span: { D: dispersion, S: slope }, dcf: { D: compDispersion, S: compSlope }, L: fiberLength, sigmaLambda: bwNm,
      bitRate, lambdaRef: refWavelength, lambdaChannel: channelWavelength,
    });
    const warnings: string[] = [];
    if (!Number.isFinite(r.Lc)) {
      warnings.push("No DCF length: the DCF dispersion must have the opposite sign of the span's (and the span D must be nonzero) to compensate it; the compensated results are empty.");
    }
    if (r.penaltyUnc === Infinity) warnings.push("Uncompensated: 4Bσ_b ≥ 1, the eye is closed and the penalty is unbounded (no result).");
    if (r.penaltyComp === Infinity) warnings.push("Compensated: 4Bσ_b ≥ 1, the eye is closed and the penalty is unbounded (no result).");
    if (r.halfBand === Infinity) warnings.push("The residual slope is zero, so the usable band is unbounded in this linear model (no result).");
    if (Math.abs(channelWavelength - refWavelength) > 100e-9) {
      warnings.push("The channel is more than 100 nm from λ₀: the linear D(λ) model is extrapolated and the results are unreliable.");
    }
    return {
      values: {
        accumulatedDispersion: r.Dacc,
        broadeningUncompensated: r.sigmaUnc,
        bitRateLimit: r.Bmax,
        penaltyUncompensated: r.penaltyUnc,
        dcfLength: r.Lc,
        residualSlope: r.Sres,
        slopeCompensation: r.slopeCompensation,
        residualDispersion: r.Dres,
        broadeningCompensated: r.sigmaComp,
        penaltyCompensated: r.penaltyComp,
        usableHalfBandwidth: r.halfBand,
        toleratedResidual: r.tolerance,
      },
      warnings,
    };
  },
  checks: [
    {
      // D = 17 ps/(nm·km), S = 0.058, 80 km, DCF −100 and −0.2, λ₀ = 1550 nm, channel 1560 nm (δλ = 10 nm).
      // D_acc = (17 + 0.058·10)·80 = 17.58 · 80 = 1406.4 ps/nm. L_c = −D L/D_c = 17·80/100 = 13.6 km.
      // S_res = 0.058·80 + (−0.2)·13.6 = 4.64 − 2.72 = 1.92 ps/nm²; D_res = S_res δλ = 19.2 ps/nm;
      // compensated slope share = 2.72/4.64 = 0.586206897 = 58.6206897 %.
      source: AGRAWAL,
      basis: "computed",
      inputs: { channelWavelength: 1560 },
      expect: { accumulatedDispersion: 1406.4, dcfLength: 13.6, residualSlope: 1.92, residualDispersion: 19.2, slopeCompensation: 58.6206897 },
      tolerance: 1e-8,
    },
    {
      // Transform-limited source (σ_λ = 0): σ_b² = λ²|D_acc|/(4πc) at the optimum input width, with
      // D_acc = 17·80 = 1360 ps/nm = 1.36 s/m, λ² = 2.4025e-12 m², 4πc = 3.76730313e9 m/s:
      // σ_b² = 1.36 · 2.4025e-12/3.76730313e9 = 8.67304776e-22 s², σ_b = 2.94500386e-11 s = 29.4500386 ps.
      // At B = 2.5 Gb/s, (4Bσ_b)² = 1e20 · 8.67304776e-22 = 0.0867304776; penalty = −5 log₁₀(1 − 0.0867304776)
      // = −5 · log₁₀(0.9132695224) = 0.1970051768 dB.
      source: AGRAWAL,
      basis: "computed",
      inputs: { bwNm: 0, bitRate: 2.5 },
      expect: { broadeningUncompensated: 29.4500386, penaltyUncompensated: 0.1970051768 },
      tolerance: 1e-8,
    },
  ],
});
