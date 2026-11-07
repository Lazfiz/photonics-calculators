import { doseForLoss, inducedAttenuation, internalTransmission } from "../../physics/materials/radiation-induced-loss";
import { defineSchema } from "../types";

const GRISCOM = "Griscom D. L., Gingerich M. E., Friebele E. J. (1994). Model for the dose, dose-rate and temperature dependence of " +
  "radiation-induced loss in optical fibers. IEEE Trans. Nucl. Sci. 41, 523, doi:10.1109/23.299793: induced attenuation as a power law " +
  "A(D) = A₁D^f of the dose (f ≤ 1); loss A·L in dB and internal transmission 10^(−A·L/10) follow from the definition of the decibel.";

export default defineSchema({
  href: "/materials/radiation-damage",
  inputs: [
    { key: "a1", label: "Induced loss at 1 Gy, A₁", unit: "dB/m", toSI: 1, siUnit: "dB/m", default: 0.1, min: 0, max: 1e6 },
    { key: "exponent", label: "Dose exponent f", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0.01, max: 1 },
    { key: "dose", label: "Total dose", unit: "Gy", toSI: 1, siUnit: "Gy", default: 1000, min: 0, max: 1e8 },
    { key: "length", label: "Path length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 1e-3, max: 1e7 },
    { key: "lossBudget", label: "Loss budget", unit: "dB", toSI: 1, siUnit: "dB", default: 1, min: 0, max: 1000 },
  ],
  outputs: [
    { key: "attenuation", label: "Induced attenuation A₁D^f", unit: "dB/m", toSI: 1, siUnit: "dB/m" },
    { key: "loss", label: "Induced loss over the path", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "transmission", label: "Internal transmission 10^(−loss/10)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "doseAtBudget", label: "Dose at the loss budget (budget/(A₁L))^(1/f)", unit: "Gy", toSI: 1, siUnit: "Gy" },
  ],
  compute({ a1, exponent, dose, length, lossBudget }) {
    const A = inducedAttenuation(a1, exponent, dose);
    const doseAtBudget = doseForLoss(a1, exponent, length, lossBudget);
    const warnings: string[] = [];
    if (!Number.isFinite(doseAtBudget)) warnings.push("No dose reaches the loss budget: it needs A₁ > 0.");
    return {
      values: { attenuation: A, loss: A * length, transmission: internalTransmission(A, length), doseAtBudget },
      warnings,
    };
  },
  checks: [
    {
      // A₁ = 0.5 dB/m, f = 0.5, D = 400 Gy: A = 0.5 · 400^0.5 = 10 dB/m; L = 2 m: loss 20 dB, T = 10^(−2) = 1 %;
      // budget 1 dB: D = (1/(0.5 · 2))^(1/0.5) = 1 Gy.
      source: GRISCOM,
      basis: "computed",
      inputs: { a1: 0.5, exponent: 0.5, dose: 400, length: 2000, lossBudget: 1 },
      expect: { attenuation: 10, loss: 20, transmission: 1, doseAtBudget: 1 },
      tolerance: 1e-8,
    },
    {
      // Linear growth f = 1, A₁ = 0.02 dB/m, D = 500 Gy: A = 10 dB/m; L = 3 m: loss 30 dB, T = 10^(−3) = 0.1 %;
      // budget 15 dB: D = 15/(0.02 · 3) = 250 Gy.
      source: GRISCOM,
      basis: "computed",
      inputs: { a1: 0.02, exponent: 1, dose: 500, length: 3000, lossBudget: 15 },
      expect: { attenuation: 10, loss: 30, transmission: 0.1, doseAtBudget: 250 },
      tolerance: 1e-8,
    },
  ],
});
