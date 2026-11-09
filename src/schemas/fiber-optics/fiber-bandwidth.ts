import { SELLMEIER_FIBERS, type SellmeierFiberKey, fiberLinkSummary } from "../../physics/fiber-optics/chromatic-dispersion";
import { defineSchema } from "../types";

const KEYS = Object.keys(SELLMEIER_FIBERS) as SellmeierFiberKey[];

const SOURCE_PMD = "Mean DGD ⟨Δτ⟩ = PMD·√L (ITU-T G.650.2, Definitions and test methods for statistical and non-linear related attributes " +
  "of single-mode fibre and cable; Kogelnik H., Jopson R. M., Nelson L. E. (2002), Polarization-mode dispersion, in Optical Fiber " +
  "Telecommunications IVB, Academic Press), hand-worked";
const SOURCE_MODAL = "Gaussian impulse response of rms width σ with optical 3-dB bandwidth f = √(2 ln 2)/(2πσ), applied to the rated modal " +
  "bandwidth–length product of OM3 (ISO/IEC 11801, 2000 MHz·km effective modal bandwidth at 850 nm), hand-worked";
const SOURCE_CD = "ITU-T G.652 Sellmeier form D(λ) = (S₀/4)(λ − λ₀⁴/λ³) with λ₀ = 1310 nm, S₀ = 0.092 ps/(nm²·km), hand-worked";

export default defineSchema({
  href: "/fiber-optics/fiber-bandwidth",
  choices: [
    { key: "fiberType", label: "Fiber type", options: KEYS.map((k) => ({ value: k, label: SELLMEIER_FIBERS[k].label })), default: "SMF" },
  ],
  inputs: [
    { key: "length", label: "Length", unit: "km", toSI: 1e3, siUnit: "m", default: 10, min: 0.001, max: 10000 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 800, max: 1700 },
    { key: "sourceLinewidth", label: "Source rms spectral width σ_λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 0.05, min: 0, max: 100 },
    { key: "modalBW", label: "Modal bandwidth at 850 nm (multimode fibre)", unit: "MHz·km", toSI: 1e9, siUnit: "Hz·m", default: 2000, min: 10, max: 100000 },
    { key: "pmd", label: "PMD coefficient (single-mode fibre)", unit: "ps/√km", toSI: 1e-12 / Math.sqrt(1e3), siUnit: "s/√m", default: 0.1, min: 0, max: 5 },
    { key: "bitRate", label: "Bit rate", unit: "Gb/s", toSI: 1e9, siUnit: "1/s", default: 10, min: 0.001, max: 1000 },
  ],
  outputs: [
    { key: "bitRateLimit", label: "Bit-rate limit over the link, all mechanisms", unit: "Gb/s", toSI: 1e9, siUnit: "1/s" },
    { key: "reach", label: "Maximum reach at the given bit rate", unit: "km", toSI: 1e3, siUnit: "m" },
    { key: "dispersion", label: "Dispersion D(λ)", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²" },
    { key: "chromaticWidth", label: "Chromatic rms width σ (optimum input pulse)", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "modalWidth", label: "Modal rms width σ (multimode fibre; 0 for single-mode)", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "meanDgd", label: "Mean DGD ⟨Δτ⟩ (single-mode fibre; 0 for multimode)", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "combinedWidth", label: "Combined rms width σ (chromatic ⊕ modal)", unit: "ps", toSI: 1e-12, siUnit: "s" },
  ],
  validate({ fiberType, wavelength }) {
    if (fiberType === "SMF" && wavelength < 1260 * 1e-9) {
      return "Below the 1260 nm cable cutoff (ITU-T G.652) single-mode fibre carries LP11 too; intermodal delay dominates and is not modelled.";
    }
    return undefined;
  },
  compute({ fiberType, length, wavelength, sourceLinewidth, modalBW, pmd, bitRate }) {
    const key = (KEYS as string[]).includes(fiberType) ? (fiberType as SellmeierFiberKey) : "SMF";
    const fiber = SELLMEIER_FIBERS[key];
    const r = fiberLinkSummary({
      fiber, lambda: wavelength, L: length, sigmaLambda: sourceLinewidth, modalBandwidthLength: modalBW, pmdCoefficient: pmd, bitRate,
    });
    const warnings: string[] = [];
    if (r.reachAtB === Infinity) warnings.push("The limits allow more than 1e6 km at this bit rate (no result).");
    if (fiber.modalBandwidthLength > 0 && Math.abs(wavelength - 850e-9) > 30e-9) {
      warnings.push("The OM grades rate modal bandwidth at 850 nm; enter the value at the operating wavelength from the fibre datasheet.");
    }
    return {
      values: {
        bitRateLimit: r.bMax,
        reach: r.reachAtB,
        dispersion: r.D,
        chromaticWidth: r.sCd,
        modalWidth: r.sMod,
        meanDgd: r.dgd,
        combinedWidth: r.sTot,
      },
      warnings,
    };
  },
  checks: [
    {
      // SMF, 100 km, PMD coefficient 0.1 ps/√km: ⟨Δτ⟩ = 0.1 · √100 = 1 ps.
      source: SOURCE_PMD,
      basis: "computed",
      inputs: { fiberType: "SMF", length: 100, pmd: 0.1 },
      expect: { meanDgd: 1 },
      tolerance: 1e-8,
    },
    {
      // OM3, 1 km, modal bandwidth 2000 MHz·km → f = 2.000e9 Hz. σ = √(2 ln 2)/(2π f): √(2 ln 2) = 1.17741002,
      // /2π = 0.187390625, / 2e9 = 9.36953126e-11 s = 93.6953126 ps.
      source: SOURCE_MODAL,
      basis: "computed",
      inputs: { fiberType: "OM3", length: 1, wavelength: 850, sourceLinewidth: 0.45, modalBW: 2000 },
      expect: { modalWidth: 93.6953126 },
      tolerance: 1e-8,
    },
    {
      // SMF at 1550 nm: 1310⁴ = 2.94499921e12, 1550³ = 3.723875e9, ratio 790.84265986 nm; D = 0.023 · (1550 − 790.84265986) = 17.46061882 ps/(nm·km).
      source: SOURCE_CD,
      basis: "computed",
      inputs: { fiberType: "SMF", wavelength: 1550 },
      expect: { dispersion: 17.46061882 },
      tolerance: 1e-8,
    },
  ],
});
