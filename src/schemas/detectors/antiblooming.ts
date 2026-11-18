import { antibloomingSummary } from "../../physics/detectors/antiblooming";
import { defineSchema } from "../types";

const JANESICK = "Janesick J. R. (2001). Scientific Charge-Coupled Devices. SPIE Press, doi:10.1117/3.374903 (anti-blooming drain structures). " +
  "Idealised hard-threshold drain: barrier T = a·W; incident charge N collects as N up to T, then T + (1 − η)(N − T) until the well W is full, " +
  "the drain takes η(N − T) and the rest spills (blooming); blooming starts at N_b = T + (W − T)/(1 − η).";

export default defineSchema({
  href: "/detectors/antiblooming",
  inputs: [
    { key: "wellCapacity", label: "Full well capacity", unit: "e⁻", toSI: 1, siUnit: "", default: 50000, min: 1000, max: 10000000 },
    { key: "abThreshold", label: "Drain barrier (fraction of the well)", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0, max: 1 },
    { key: "excessCharge", label: "Charge above the barrier", unit: "e⁻", toSI: 1, siUnit: "", default: 20000, min: 0, max: 1000000000000 },
    { key: "chargeDumpEfficiency", label: "Drain efficiency η", unit: "", toSI: 1, siUnit: "", default: 0.99, min: 0, max: 1 },
  ],
  outputs: [
    { key: "linearRange", label: "Linear range (barrier)", unit: "e⁻", toSI: 1, siUnit: "" },
    { key: "inWell", label: "Charge in the well", unit: "e⁻", toSI: 1, siUnit: "" },
    { key: "toDrain", label: "Charge to the drain", unit: "e⁻", toSI: 1, siUnit: "" },
    { key: "spilled", label: "Charge spilled into neighbours", unit: "e⁻", toSI: 1, siUnit: "" },
    { key: "bloomingOnset", label: "Blooming onset (incident charge)", unit: "e⁻", toSI: 1, siUnit: "" },
    { key: "headroom", label: "Well above the barrier", unit: "e⁻", toSI: 1, siUnit: "" },
  ],
  compute({ wellCapacity, abThreshold, excessCharge, chargeDumpEfficiency }) {
    const r = antibloomingSummary(wellCapacity, abThreshold, excessCharge, chargeDumpEfficiency);
    const warnings: string[] = [];
    const reasons: Record<string, string> = {};
    if (r.onset === Infinity) reasons.bloomingOnset = "A perfect drain (η = 1) never blooms: the onset is at infinite charge.";
    if (r.spilled > 0) warnings.push("The well is full: the pixel blooms.");
    return {
      values: {
        linearRange: r.threshold, inWell: r.collected, toDrain: r.drained, spilled: r.spilled, bloomingOnset: r.onset, headroom: r.headroom,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // W = 50000, a = 0.8: T = 40000; N = T + 20000 = 60000, η = 0.99. Drained 0.99·20000 = 19800, leaked 200 ≤ room W − T = 10000,
      // so collected 40200 and nothing spills; N_b = 40000 + 10000/0.01 = 1,040,000.
      source: JANESICK,
      basis: "computed",
      inputs: {},
      expect: { linearRange: 40000, inWell: 40200, toDrain: 19800, bloomingOnset: 1040000, headroom: 10000 },
      tolerance: 1e-8,
    },
    {
      // W = 50000, a = 0.8, excess 2e6 e⁻, η = 0.9: drained 1.8e6, leaked 2e5, room 1e4: collected 40000 + 10000 = 50000, spilled 2e5 − 1e4 = 190000;
      // N_b = 40000 + 10000/0.1 = 140000 (below the incident 2.04e6, so the pixel blooms).
      source: JANESICK,
      basis: "computed",
      inputs: { excessCharge: 2000000, chargeDumpEfficiency: 0.9 },
      expect: { inWell: 50000, toDrain: 1800000, spilled: 190000, bloomingOnset: 140000 },
      tolerance: 1e-8,
    },
  ],
});
