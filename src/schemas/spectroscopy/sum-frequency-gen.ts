import {
  localMaxima, SFG_PRESETS, sfgIntensity, sfgWavelength, type SfgResonance,
} from "../../physics/spectroscopy/sum-frequency";
import { defineSchema } from "../types";

const CM = 100; // 1 cm⁻¹ in m⁻¹
const IR_MIN = 500;
const IR_MAX = 5000;

export default defineSchema({
  href: "/spectroscopy/sum-frequency-gen",
  choices: [
    {
      key: "preset",
      label: "Interface (resonance set)",
      options: Object.entries(SFG_PRESETS).map(([value, p]) => ({ value, label: p.label })),
      default: "ch",
    },
  ],
  inputs: [
    { key: "visWavelength", label: "Visible wavelength λ_vis (vacuum)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 532, min: 300, max: 1100 },
    { key: "irMinCm", label: "IR from", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹", default: 2800, min: IR_MIN, max: IR_MAX },
    { key: "irMaxCm", label: "IR to", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹", default: 3050, min: IR_MIN, max: IR_MAX },
    { key: "nrAmplitude", label: "Non-resonant amplitude A_NR", unit: "", toSI: 1, siUnit: "", default: 0.3, min: 0, max: 10 },
    { key: "nrPhaseDeg", label: "Non-resonant phase φ", unit: "°", toSI: Math.PI / 180, siUnit: "rad", default: 0, min: -180, max: 180 },
  ],
  outputs: [
    { key: "sfgWavelengthMin", label: "Shortest SFG wavelength (at the highest IR wavenumber)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "sfgWavelengthMax", label: "Longest SFG wavelength (at the lowest IR wavenumber)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "strongestPeak", label: "Strongest SFG peak", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹" },
    { key: "strongestPeakIntensity", label: "|χ_eff|² at the strongest peak", unit: "", toSI: 1, siUnit: "" },
    { key: "strongestPeakWavelength", label: "SFG wavelength of the strongest peak", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "peakCount", label: "Apparent peaks in range", unit: "", toSI: 1, siUnit: "" },
  ],
  // As on the page: "from" leaves room below IR_MAX, and a "to" at or below "from" becomes from + 250 cm⁻¹ (capped).
  compute({ preset, visWavelength, irMinCm, irMaxCm, nrAmplitude, nrPhaseDeg }) {
    const resonances: SfgResonance[] = (SFG_PRESETS[preset] ?? SFG_PRESETS.ch).modes.map((m) => ({
      center: m.center * CM, amplitude: m.amplitude * CM, halfWidth: m.halfWidth * CM,
    }));
    const warnings: string[] = [];
    const lo = Math.min(irMinCm, (IR_MAX - 10) * CM);
    const hi = irMaxCm > lo ? irMaxCm : Math.min(IR_MAX * CM, lo + 250 * CM);
    if (irMaxCm <= lo) warnings.push("IR to is not above IR from, so the range runs 250 cm⁻¹ above IR from (capped at 5000 cm⁻¹).");
    const n = 1200;
    const grid = Array.from({ length: n + 1 }, (_, i) => (lo + ((hi - lo) * i) / n) / CM);
    const total = grid.map((s) => sfgIntensity(s * CM, resonances, nrAmplitude, nrPhaseDeg));
    const peaks = localMaxima(grid, total);
    const strongest = peaks.reduce<{ x: number; y: number } | null>((best, p) => (best && best.y >= p.y ? best : p), null);
    if (!strongest) warnings.push("The spectrum has no local maximum in this IR range, so the strongest peak is null.");
    return {
      values: {
        sfgWavelengthMin: sfgWavelength(visWavelength, hi),
        sfgWavelengthMax: sfgWavelength(visWavelength, lo),
        strongestPeak: strongest ? strongest.x * CM : NaN,
        strongestPeakIntensity: strongest ? strongest.y : NaN,
        strongestPeakWavelength: strongest ? sfgWavelength(visWavelength, strongest.x * CM) : NaN,
        peakCount: peaks.length,
      },
      warnings,
    };
  },
  checks: [
    {
      // 532 nm + 3300 cm⁻¹: 10⁷/(10⁷/532 + 3300) = 10⁷/22096.992 nm = 452.55027 nm (longest wavelength = lowest IR end).
      source: "Hand calculation 1/λ_SFG = 1/λ_vis + ν̃_IR (ω_SFG = ω_vis + ω_IR; audit value, PR #127), " +
        "tests/spectroscopy-sfg.test.ts.",
      basis: "computed",
      inputs: { visWavelength: 532, irMinCm: 3300, irMaxCm: 3400 },
      expect: { sfgWavelengthMax: 452.55027 },
      tolerance: 1e-7,
    },
  ],
});
