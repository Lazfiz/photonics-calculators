import { FIBER_PRESETS, type FiberPresetKey, presetLinkSummary } from "../../physics/fiber-optics/chromatic-dispersion";
import { defineSchema } from "../types";

const PRESET_SOURCE = "Linear dispersion model D(λ) = D₁₅₅₀ + S·(λ − 1550 nm) with the typical NZ-DSF+ values D₁₅₅₀ = 4.5 ps/(nm·km), " +
  "S = 0.05 ps/(nm²·km) (ITU-T G.655, Characteristics of a non-zero dispersion-shifted single-mode optical fibre and cable, 11/2009, " +
  "Table 1 limits), hand-worked";
const G652_SOURCE = "ITU-T G.652, Characteristics of a single-mode optical fibre and cable: D(λ) = (S₀/4)(λ − λ₀⁴/λ³) with λ₀ = 1310 nm, " +
  "S₀ = 0.092 ps/(nm²·km), S(λ) = (S₀/4)(1 + 3λ₀⁴/λ⁴), hand-worked";

const KEYS = Object.keys(FIBER_PRESETS) as FiberPresetKey[];

export default defineSchema({
  href: "/fiber-optics/dispersion-shifted",
  choices: [
    { key: "fiberType", label: "Fiber type", options: KEYS.map((k) => ({ value: k, label: FIBER_PRESETS[k].label })), default: "NZDSF_PLUS" },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 1460, max: 1625 },
    { key: "fiberLength", label: "Fiber length", unit: "km", toSI: 1e3, siUnit: "m", default: 80, min: 0.001, max: 10000 },
    { key: "bitRate", label: "Bit rate", unit: "Gb/s", toSI: 1e9, siUnit: "1/s", default: 10, min: 0.001, max: 1000 },
    { key: "spectralWidth", label: "Source rms spectral width σ_λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 0.1, min: 0, max: 100 },
  ],
  outputs: [
    { key: "zeroDispersionWavelength", label: "Zero-dispersion wavelength λ₀", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "slope", label: "Dispersion slope S(λ)", unit: "ps/(nm²·km)", toSI: 1e3, siUnit: "s/m³" },
    { key: "dispersion", label: "Dispersion D(λ)", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²" },
    { key: "accumulated", label: "Accumulated dispersion D·L", unit: "ps/nm", toSI: 1e-3, siUnit: "s/m" },
    { key: "loss", label: "Fiber loss (typical attenuation × length)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "limitedLength", label: "Dispersion-limited length (4Bσ ≤ 1)", unit: "km", toSI: 1e3, siUnit: "m" },
  ],
  compute({ fiberType, wavelength, fiberLength, bitRate, spectralWidth }) {
    const key = (KEYS as string[]).includes(fiberType) ? (fiberType as FiberPresetKey) : "NZDSF_PLUS";
    const r = presetLinkSummary(key, wavelength, fiberLength, spectralWidth, bitRate);
    const warnings: string[] = [];
    if (r.Lmax === Infinity) {
      warnings.push("The dispersion limit is beyond 1e6 km, so there is no finite dispersion-limited length (no result); PMD and nonlinearity limit the link first.");
    } else if (fiberLength > r.Lmax) {
      warnings.push("The entered length exceeds the dispersion-limited length.");
    }
    if (key !== "G652" && !(r.lambda0 >= 1460e-9 && r.lambda0 <= 1625e-9)) {
      warnings.push("The zero-dispersion wavelength of the linear model is outside 1460–1625 nm.");
    }
    return {
      values: {
        zeroDispersionWavelength: r.lambda0,
        slope: r.S,
        dispersion: r.D,
        accumulated: r.total,
        loss: r.loss,
        limitedLength: r.Lmax,
      },
      warnings,
    };
  },
  checks: [
    {
      // NZ-DSF+ at 1560 nm, 80 km: D = 4.5 + 0.05 · (1560 − 1550) = 5.0 ps/(nm·km); D·L = 5.0 · 80 = 400 ps/nm;
      // λ₀ = 1550 − 4.5/0.05 = 1460 nm; loss = 0.22 dB/km · 80 km = 17.6 dB (preset typical attenuation).
      source: PRESET_SOURCE,
      basis: "computed",
      inputs: { fiberType: "NZDSF_PLUS", wavelength: 1560, fiberLength: 80 },
      expect: { dispersion: 5, accumulated: 400, zeroDispersionWavelength: 1460, slope: 0.05, loss: 17.6 },
      tolerance: 1e-8,
    },
    {
      // G.652 at 1550 nm: λ₀⁴ = 1310⁴ = 2.94499921e12 nm⁴, λ³ = 1550³ = 3.723875e9 nm³, ratio 790.84265986 nm;
      // D = 0.023 · (1550 − 790.84265986) = 17.46061882 ps/(nm·km). S = 0.023 · (1 + 3 · (1310/1550)⁴) = 0.0582052539 ps/(nm²·km).
      source: G652_SOURCE,
      basis: "computed",
      inputs: { fiberType: "G652", wavelength: 1550 },
      expect: { dispersion: 17.46061882, slope: 0.0582052539 },
      tolerance: 1e-8,
    },
  ],
});
