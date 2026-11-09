import { sellmeierPulseSummary } from "../../physics/fiber-optics/chromatic-dispersion";
import { defineSchema } from "../types";

const AGRAWAL = "Agrawal G. P. (2010), Fiber-Optic Communication Systems, 4th ed., Wiley, doi:10.1002/9780470918524, " +
  "eqs. (2.3.5) and (2.3.13) for β₂, β₃ and §2.4.2 for Gaussian-pulse broadening; ITU-T G.652 for D(λ) = (S₀/4)(λ − λ₀⁴/λ³)";

export default defineSchema({
  href: "/fiber-optics/chromatic-dispersion",
  inputs: [
    { key: "dispersionSlope", label: "Zero-dispersion slope S₀", unit: "ps/(nm²·km)", toSI: 1e3, siUnit: "s/m³", default: 0.092, min: 0.01, max: 0.2 },
    { key: "zeroDispWavelength", label: "Zero-dispersion wavelength λ₀", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1310, min: 1200, max: 1700 },
    { key: "length", label: "Fiber length", unit: "km", toSI: 1e3, siUnit: "m", default: 80, min: 0.001, max: 10000 },
    { key: "wavelength", label: "Operating wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 1260, max: 1625 },
    { key: "sourceLineWidth", label: "Source rms spectral width σ_λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 0.1, min: 0, max: 100 },
    { key: "pulseWidth", label: "Input pulse FWHM", unit: "ps", toSI: 1e-12, siUnit: "s", default: 50, min: 0.01, max: 100000 },
    { key: "bitRate", label: "Bit rate", unit: "Gb/s", toSI: 1e9, siUnit: "1/s", default: 1, min: 0.001, max: 1000 },
  ],
  outputs: [
    { key: "dispersion", label: "Dispersion D(λ)", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²" },
    { key: "slope", label: "Dispersion slope S(λ)", unit: "ps/(nm²·km)", toSI: 1e3, siUnit: "s/m³" },
    { key: "accumulated", label: "Accumulated dispersion D·L", unit: "ps/nm", toSI: 1e-3, siUnit: "s/m" },
    { key: "beta2", label: "β₂", unit: "ps²/km", toSI: 1e-27, siUnit: "s²/m" },
    { key: "beta3", label: "β₃", unit: "ps³/km", toSI: 1e-39, siUnit: "s³/m" },
    { key: "dispersionLength", label: "Dispersion length L_D (T₀ = √2 σ₀)", unit: "km", toSI: 1e3, siUnit: "m" },
    { key: "outputWidth", label: "Output rms width σ", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "bitRateOptimum", label: "Bit-rate limit, optimum input pulse (4Bσ ≤ 1)", unit: "Gb/s", toSI: 1e9, siUnit: "1/s" },
    { key: "bitRateCoherent", label: "Bit-rate limit for σ_λ → 0, β₃ = 0", unit: "Gb/s", toSI: 1e9, siUnit: "1/s" },
    { key: "penalty", label: "Dispersion penalty at the given bit rate", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ dispersionSlope, zeroDispWavelength, length, wavelength, sourceLineWidth, pulseWidth, bitRate }) {
    const r = sellmeierPulseSummary({
      lambda: wavelength, lambda0: zeroDispWavelength, S0: dispersionSlope, L: length, sigmaLambda: sourceLineWidth,
      pulseFwhm: pulseWidth, bitRate,
    });
    const warnings: string[] = [];
    if (zeroDispWavelength < 1300e-9 || zeroDispWavelength > 1324e-9) warnings.push("λ₀ is outside the G.652 range 1300–1324 nm.");
    if (r.atZero) warnings.push("D = 0 at this wavelength: the dispersion length and the coherent bit-rate limit are unbounded (no result).");
    if (r.penalty === Infinity) warnings.push("4Bσ_b ≥ 1: the eye is closed and the dispersion penalty is unbounded (no result).");
    return {
      values: {
        dispersion: r.D,
        slope: r.S,
        accumulated: r.D * length,
        beta2: r.beta2,
        beta3: r.beta3,
        dispersionLength: r.atZero ? Infinity : r.LD,
        outputWidth: r.sigmaOut,
        bitRateOptimum: r.bOptimum,
        bitRateCoherent: r.atZero ? Infinity : r.bCoherent,
        penalty: r.penalty,
      },
      warnings,
    };
  },
  checks: [
    {
      // λ = 1625 nm, λ₀ = 1300 nm, S₀ = 0.092 ps/(nm²·km), L = 10 km. λ₀/λ = 0.8, so λ₀⁴/λ³ = 1300·0.8³ = 665.6 nm.
      // D = (0.092/4)(1625 − 665.6) = 0.023 · 959.4 = 22.0662 ps/(nm·km); D·L = 220.662 ps/nm.
      // S = (0.092/4)(1 + 3·0.8⁴) = 0.023 · 2.2288 = 0.0512624 ps/(nm²·km).
      source: AGRAWAL + " (Sellmeier form, hand-worked)",
      basis: "computed",
      inputs: { zeroDispWavelength: 1300, wavelength: 1625, length: 10, dispersionSlope: 0.092 },
      expect: { dispersion: 22.0662, accumulated: 220.662, slope: 0.0512624 },
      tolerance: 1e-8,
    },
    {
      // Same case. β₂ = −λ²D/(2πc): λ² = (1.625e-6)² = 2.640625e-12 m², D = 2.20662e-5 s/m², product 5.82685594e-17;
      // 2πc = 2π · 299 792 458 = 1.88365157e9 m/s; β₂ = −3.09338311e-26 s²/m = −30.9338311 ps²/km.
      // β₃ = (λ²/2πc)² (S + 2D/λ): λ²/2πc = 1.40186489e-21, squared 1.96522517e-42; S + 2D/λ = 51.2624 + 27.1584 = 78.4208 s/m³ 
      // (S = 0.0512624 ps/(nm²·km) = 51.2624 s/m³, 2D/λ = 2 · 2.20662e-5 / 1.625e-6 = 27.1584 s/m³): β₃ = 1.54114530e-40 s³/m = 0.154114530 ps³/km.
      source: AGRAWAL + ", β₂ = −λ²D/(2πc) and β₃ = (λ²/2πc)²(S + 2D/λ)",
      basis: "computed",
      inputs: { zeroDispWavelength: 1300, wavelength: 1625, length: 10, dispersionSlope: 0.092 },
      expect: { beta2: -30.9338311, beta3: 0.15411453 },
      tolerance: 1e-7,
    },
  ],
});
