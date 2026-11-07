import { gaussianCoupling, lossDb, waistFromNA } from "../../physics/fiber-optics/gaussian-coupling";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const MARCUSE = "Marcuse D. (1977). Loss analysis of single-mode fiber splices. Bell Syst. Tech. J. 56, 703–718, " +
  "offset and tilt formulas for equal mode radii. https://doi.org/10.1002/j.1538-7305.1977.tb00534.x";
// A beam of NA λ/(πw) has a 4.5 µm waist at 1550 nm: equal to a 9 µm MFD fibre mode.
const MATCHED = { sourceNa: 1.55 / (4.5 * Math.PI), mfd: 9, wavelength: 1550, mediumIndex: 1 };

export default defineSchema({
  href: "/fiber-optics/coupling-efficiency",
  inputs: [
    { key: "sourceNa", label: "Beam divergence NA (1/e² half-angle)", unit: "", toSI: 1, siUnit: "", default: 0.22, min: 0.02, max: 0.5 },
    { key: "mfd", label: "Fibre mode field diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10.4, min: 2, max: 30 },
    { key: "lateralOffset", label: "Lateral offset", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0, min: 0, max: 20 },
    { key: "angularMisalign", label: "Angular misalignment", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: 0, max: 5 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2000 },
    { key: "mediumIndex", label: "Medium index n", unit: "", toSI: 1, siUnit: "", default: 1.0, min: 1.0, max: 1.5 },
  ],
  outputs: [
    { key: "total", label: "Total coupling efficiency", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "lossDb", label: "Insertion loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "mismatch", label: "Mode-mismatch efficiency", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "beamWaist", label: "Beam waist w₀ = λ/(π NA)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "fiberModeRadius", label: "Fibre mode radius w", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "fiberModeNa", label: "Fibre mode NA λ/(πw)", unit: "", toSI: 1, siUnit: "" },
    { key: "offsetFactor", label: "Offset factor", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "tiltFactor", label: "Tilt factor", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ sourceNa, mfd, lateralOffset, angularMisalign, wavelength, mediumIndex }) {
    // Beam waist from its far-field 1/e² divergence, placed on the fibre face (Kogelnik & Li 1966).
    const w1 = waistFromNA(sourceNa, wavelength);
    const w2 = mfd / 2;
    const joint = { w1, w2, lambda: wavelength, n: mediumIndex };
    const mismatch = gaussianCoupling(joint);
    const total = gaussianCoupling({ ...joint, offset: lateralOffset, tilt: angularMisalign });
    return {
      values: {
        total,
        lossDb: lossDb(total),
        mismatch,
        beamWaist: w1,
        fiberModeRadius: w2,
        fiberModeNa: wavelength / (Math.PI * w2),
        offsetFactor: gaussianCoupling({ ...joint, offset: lateralOffset }) / mismatch,
        tiltFactor: gaussianCoupling({ ...joint, tilt: angularMisalign }) / mismatch,
      },
      warnings: sourceNa > 0.3 ? ["NA above 0.3: past the paraxial range of the Gaussian model."] : [],
    };
  },
  checks: [
    {
      // Equal radii w = 4.5 µm at 1550 nm, d = 0.5 µm: η = exp(−d²/w²), loss = 4.3429 × 0.25/20.25 dB.
      source: MARCUSE,
      basis: "computed",
      inputs: { ...MATCHED, lateralOffset: 0.5 },
      expect: { lossDb: 0.053616, mismatch: 100 },
      tolerance: 1e-4,
    },
    {
      // θ = 0.5°, n = 1: η = exp(−(πnwθ/λ)²), (π·4.5·0.0087266/1.55)² = 0.0063352 → 0.027513 dB.
      source: MARCUSE,
      basis: "computed",
      inputs: { ...MATCHED, angularMisalign: 0.5 },
      expect: { lossDb: 0.027513 },
      tolerance: 2e-4,
    },
  ],
});
