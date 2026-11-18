import { flickerSummary } from "../../physics/detectors/flicker-noise";
import { defineSchema } from "../types";

const HOOGE = "Hooge F. N. (1969). 1/f noise is no surface effect. Phys. Lett. A 29, 139–140, doi:10.1016/0375-9601(69)90076-0, in the SPICE KF/AF form S_I(f) = K_f·I^α/f: " +
  "σ_1/f = √(K_f·I^α·ln(f_high/f_low)), corner f_c = K_f·I^α/(2q·I); Schottky W. (1918). Ann. Phys. 362, 541–567, doi:10.1002/andp.19183622304: shot-noise density 2q·I, σ_shot = √(2qI·(f_high − f_low)).";

export default defineSchema({
  href: "/detectors/flicker-noise",
  inputs: [
    { key: "kf", label: "Flicker coefficient K_f", unit: "A^(2−α)", toSI: 1, siUnit: "A^(2−α)", default: 3e-10, min: 0, max: 1 },
    { key: "current", label: "Current", unit: "A", toSI: 1, siUnit: "A", default: 1e-6, min: 1e-15, max: 10 },
    { key: "alpha", label: "Current exponent α (S_I ∝ I^α; Hooge α = 2)", unit: "", toSI: 1, siUnit: "", default: 2, min: 0.5, max: 3 },
    { key: "fLow", label: "Lower band edge f_low", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1, min: 1e-9, max: 1e12 },
    { key: "fHigh", label: "Upper band edge f_high", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1e6, min: 1e-9, max: 1e12 },
  ],
  outputs: [
    { key: "flickerRms", label: "1/f noise (rms)", unit: "A", toSI: 1, siUnit: "A" },
    { key: "shotRms", label: "Shot noise in the band (rms)", unit: "A", toSI: 1, siUnit: "A" },
    { key: "totalRms", label: "Total noise (rms)", unit: "A", toSI: 1, siUnit: "A" },
    { key: "cornerFreq", label: "1/f–shot corner frequency", unit: "Hz", toSI: 1, siUnit: "Hz" },
  ],
  validate({ fLow, fHigh }) {
    if (!(fHigh > fLow)) return `f_high (${fHigh} Hz) must be above f_low (${fLow} Hz).`;
    return undefined;
  },
  compute({ kf, current, alpha, fLow, fHigh }) {
    return { values: flickerSummary({ kf, current, alpha, fLow, fHigh }) };
  },
  checks: [
    {
      // Defaults: K_f = 3e-10, I = 1 µA, α = 2, 1 Hz…1 MHz. K_f·I^α = 3e-22 A²/Hz·Hz; σ_1/f = √(3e-22·ln 1e6) = √(3e-22·13.815511) = 6.437898e-11 A;
      // σ_shot = √(2q·1e-6·(1e6 − 1)) = 5.660698e-10 A; total = √(σ_1/f² + σ_shot²) = 5.697189e-10 A; f_c = 3e-10·1e-6/(2q) = 936.2264 Hz.
      source: HOOGE,
      basis: "computed",
      inputs: {},
      expect: { flickerRms: 6.437898078868042e-11, shotRms: 5.66069789305765e-10, totalRms: 5.697189302911239e-10, cornerFreq: 936.2263611691144 },
      tolerance: 1e-8,
    },
    {
      // K_f = 2e-12, I = 100 µA, α = 1.5, 0.1 Hz…10 kHz: K_f·I^1.5 = 2e-12·1e-6 = 2e-18; σ_1/f = √(2e-18·ln 1e5) = 4.798526e-9 A;
      // σ_shot = √(2q·1e-4·(1e4 − 0.1)) = 5.660672e-10 A; total 4.831799e-9 A; f_c = 2e-12·(1e-4)^0.5/(2q) = 2e-14/(2q) = 62415.09 Hz.
      source: HOOGE,
      basis: "computed",
      inputs: { kf: 2e-12, current: 1e-4, alpha: 1.5, fLow: 0.1, fHigh: 1e4 },
      expect: { flickerRms: 4.798525912188082e-9, shotRms: 5.660672419834344e-10, totalRms: 4.831799152736711e-9, cornerFreq: 62415.09074460763 },
      tolerance: 1e-8,
    },
  ],
});
