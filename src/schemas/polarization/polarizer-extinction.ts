import {
  analyzerTransmission, cascade, contrastDb, extinctionRatioFromDb,
} from "../../physics/polarization/polarizer-extinction";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const GOLDSTEIN = "Goldstein D. H. (2011). Polarized Light, 3rd ed., CRC Press, ch. Mueller Matrices for Polarizing Components, " +
  "pp. 93–115 (linear diattenuator with principal transmittances; aligned diattenuators in series multiply). https://doi.org/10.1201/b10436";

export default defineSchema({
  href: "/polarization/polarizer-extinction",
  inputs: [
    { key: "extinctionRatioDb", label: "Extinction ratio", unit: "dB", toSI: 1, siUnit: "dB", default: 30, min: 0, max: 100 },
    { key: "transmissionPercent", label: "Max transmission T∥", unit: "%", toSI: 0.01, siUnit: "", default: 95, min: 0, max: 100 },
    { key: "angleDeg", label: "Analyzer angle", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: 0, max: 90 },
    { key: "numPolarizers", label: "Cascade count (rounded to an integer)", unit: "", toSI: 1, siUnit: "", default: 2, min: 1, max: 10 },
  ],
  outputs: [
    { key: "tParallel", label: "T∥ (pass axis)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "tPerp", label: "T⊥ (block axis)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "transmitted", label: "Transmission at the analyzer angle", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "contrastDb", label: "Contrast T∥/T(θ) at the analyzer angle", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "cascadedErDb", label: "Cascaded extinction ratio", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "cascadedT", label: "Cascaded pass-axis transmission", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ extinctionRatioDb, transmissionPercent, angleDeg, numPolarizers }) {
    const tPar = transmissionPercent; // already a fraction (toSI = 0.01)
    const tPerp = tPar / extinctionRatioFromDb(extinctionRatioDb);
    const transmitted = analyzerTransmission(tPar, tPerp, angleDeg);
    const contrast = contrastDb(tPar, transmitted);
    const casc = cascade(tPar, extinctionRatioDb, Math.round(numPolarizers));
    const warnings: string[] = [];
    if (!Number.isFinite(contrast)) warnings.push("No transmission (T∥ = 0): the contrast is undefined.");
    return {
      values: { tParallel: tPar, tPerp, transmitted, contrastDb: contrast, cascadedErDb: casc.erDb, cascadedT: casc.tPar },
      warnings,
    };
  },
  checks: [
    {
      // ER 30 dB → 1000, T∥ = 0.95, T⊥ = 0.95/1000 = 9.5e-4 (0.095 %); n = 2: ER = 60 dB, T∥² = 0.9025 (90.25 %).
      source: GOLDSTEIN,
      basis: "computed",
      inputs: {},
      expect: { tPerp: 0.095, cascadedErDb: 60, cascadedT: 90.25 },
      tolerance: 1e-8,
    },
    {
      // θ = 45°: T = 0.95 cos²45° + 9.5e-4 sin²45° = 0.5·0.95095 = 0.475475 (47.5475 %).
      source: GOLDSTEIN,
      basis: "computed",
      inputs: { angleDeg: 45 },
      expect: { transmitted: 47.5475 },
      tolerance: 1e-8,
    },
  ],
});
