import { polarizationMaintainingSummary } from "../../physics/fiber-optics/polarization-maintaining";
import { defineSchema } from "../types";

const NODA_1986 = "Noda J., Okamoto K., Sasaki Y. (1986). Polarization-maintaining fibers and their applications. J. Lightwave Technol. 4, 1071–1089, " +
  "doi:10.1109/JLT.1986.1074847; random coupling dPx/dz = −h(Px − Py), dPy/dz = h(Px − Py), so Py/Px = (1 − r)/(1 + r) with " +
  "r = e^(−2hL)(1 − ε₀)/(1 + ε₀), ε₀ = 10^(−PER_in/10); fibre crosstalk 10 log₁₀ tanh(hL); L = ln(r₀/r_t)/(2h); beat length L_B = λ/B; DGD per length = B/c.";

const NO_COUPLING = "With h = 0 or L = 0 there is no coupling: the fibre crosstalk is −∞ dB.";
const NEVER = "With h = 0 there is no coupling, so the ratio never reaches the required PER.";

export default defineSchema({
  href: "/fiber-optics/polarization-maintaining",
  inputs: [
    { key: "birefringence", label: "Birefringence B", unit: "×10⁻⁴", toSI: 1e-4, siUnit: "", default: 3.5, min: 0.01, max: 20 },
    { key: "hParameter", label: "h-parameter", unit: "1/m", toSI: 1, siUnit: "1/m", default: 1e-6, min: 0, max: 0.01 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2000 },
    { key: "fiberLength", label: "Fibre length", unit: "m", toSI: 1, siUnit: "m", default: 1000, min: 0, max: 1000000 },
    { key: "extinctionRatio", label: "Input PER", unit: "dB", toSI: 1, siUnit: "dB", default: 30, min: 0, max: 60 },
    { key: "targetPER", label: "Required PER", unit: "dB", toSI: 1, siUnit: "dB", default: 20, min: 0.1, max: 60 },
  ],
  outputs: [
    { key: "beatLength", label: "Beat length λ/B", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "dgd", label: "DGD per length B/c", unit: "ps/m", toSI: 1e-12, siUnit: "s/m" },
    { key: "fibreCrosstalk", label: "Fibre crosstalk (perfect launch)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "outputPER", label: "Output PER", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "lengthToTarget", label: "Length until the PER falls to the required value", unit: "m", toSI: 1, siUnit: "m" },
    { key: "meetsRequirement", label: "Output PER meets the requirement (1 = yes)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ birefringence, hParameter, wavelength, fiberLength, extinctionRatio, targetPER }) {
    const s = polarizationMaintainingSummary({
      B: birefringence, h: hParameter, lambda: wavelength, L: fiberLength, erDb: extinctionRatio, targetDb: targetPER,
    });
    const warnings: string[] = [];
    if (!s.meets) warnings.push(`The output PER ${s.outDb.toFixed(2)} dB is below the required ${targetPER} dB.`);
    return {
      values: {
        beatLength: s.beatLength, dgd: s.dgd, fibreCrosstalk: s.fibreXt, outputPER: s.outDb,
        lengthToTarget: s.Ltarget, meetsRequirement: s.meets ? 1 : 0,
      },
      warnings,
      reasons: { fibreCrosstalk: NO_COUPLING, lengthToTarget: NEVER },
    };
  },
  checks: [
    {
      // Defaults: B = 3.5e-4, λ = 1550 nm → L_B = λ/B = 4.4285714 mm; DGD = B/c = 1.1674743 ps/m;
      // ε₀ = 10^(−3) = 0.001, r₀ = 0.999/1.001, hL = 1e-3, r = e^(−2e-3) r₀: output PER = −10 log₁₀((1 − r)/(1 + r)) = 26.989705 dB;
      // XT = 10 log₁₀ tanh(1e-3) = −30.0000014 dB; target 20 dB → ε_t = 0.01, r_t = 0.99/1.01, L = ln(r₀/r_t)/(2h) = 9000.3330 m.
      source: NODA_1986,
      basis: "computed",
      inputs: {},
      expect: { beatLength: 4.428571428571429, dgd: 1.167474333193532, fibreCrosstalk: -30.00000144764794, outputPER: 26.98970511012541, lengthToTarget: 9000.333020001264 },
      tolerance: 1e-8,
    },
    {
      // B = 5e-4, h = 2e-5 1/m, λ = 1310 nm, L = 500 m, input 25 dB, required 15 dB:
      // L_B = 2.62 mm; DGD = 1.6678205 ps/m; hL = 0.01; output PER = 18.806937 dB; XT = 10 log₁₀ tanh(0.01) = −20.0001448 dB;
      // L(15 dB) = ln(r₀/r_t)/(2h) = 1423.5518 m.
      source: NODA_1986,
      basis: "computed",
      inputs: { birefringence: 5, hParameter: 2e-5, wavelength: 1310, fiberLength: 500, extinctionRatio: 25, targetPER: 15 },
      expect: { beatLength: 2.62, dgd: 1.66782047599076, fibreCrosstalk: -20.00014476144955, outputPER: 18.80693683018990, lengthToTarget: 1423.551782756847 },
      tolerance: 1e-8,
    },
  ],
});
