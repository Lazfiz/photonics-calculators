import { DEAD_TIME_MODELS, parseDeadTimeModel } from "../../physics/detectors/dead-time";
import { spadDeadTimeSummary } from "../../physics/detectors/spad-dead-time";
import { defineSchema } from "../types";

const SOURCE = "Dead-time models: non-paralyzable m = R/(1 + Rτ), paralyzable m = R·exp(−Rτ) with peak 1/(e·τ) at R = 1/τ: Knoll G. F. (2010), " +
  "Radiation Detection and Measurement, 4th ed., Wiley, ch. 4 (dead-time models); Müller J. W. (1973), Dead-time problems, Nucl. Instrum. Methods " +
  "112, 47–57, doi:10.1016/0029-554X(73)90773-8. Loss 1 − m/R; true rate at a given loss from inverting each model: loss/[(1 − loss)τ] or −ln(1 − loss)/τ.";

export default defineSchema({
  href: "/detectors/spad-dead-time",
  inputs: [
    { key: "deadTime", label: "Dead time", unit: "ns", toSI: 1e-9, siUnit: "s", default: 25, min: 0.1, max: 1e5 },
    { key: "trueRate", label: "True count rate without dead time (PDE·Φ + dark)", unit: "Mcps", toSI: 1e6, siUnit: "1/s", default: 10, min: 0.001, max: 1e4 },
  ],
  choices: [
    {
      key: "mode", label: "Dead-time model", default: "nonparalyzable",
      options: DEAD_TIME_MODELS.map((m) => ({ value: m, label: m === "paralyzable" ? "Paralyzable" : "Non-paralyzable" })),
    },
  ],
  outputs: [
    { key: "measuredRate", label: "Measured rate", unit: "Mcps", toSI: 1e6, siUnit: "1/s" },
    { key: "countLoss", label: "Count loss (dead fraction of the time)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "correctionFactor", label: "Correction factor R/m", unit: "", toSI: 1, siUnit: "" },
    { key: "rateAtTenPercentLoss", label: "True rate at 10 % loss", unit: "Mcps", toSI: 1e6, siUnit: "1/s" },
    { key: "paralyzablePeak", label: "Paralyzable peak recorded rate 1/(eτ) (either model)", unit: "Mcps", toSI: 1e6, siUnit: "1/s" },
  ],
  compute({ deadTime, trueRate, mode }) {
    const r = spadDeadTimeSummary(deadTime, trueRate, parseDeadTimeModel(mode));
    const warnings: string[] = [];
    if (r.pastPeak) {
      warnings.push("Rτ > 1: past the paralyzable peak, a higher true rate gives fewer counts, and a rate correction is ambiguous.");
    }
    return {
      values: {
        measuredRate: r.measured, countLoss: r.loss, correctionFactor: r.correction, rateAtTenPercentLoss: r.rateAtLoss, paralyzablePeak: r.peakRate,
      },
      warnings,
      reasons: { correctionFactor: "Paralyzed: exp(Rτ) overflows, so the measured rate underflows to 0 and R/m is not finite." },
    };
  },
  checks: [
    {
      // τ = 25 ns, R = 10 Mcps, non-paralyzable: Rτ = 0.25; m = 10/1.25 = 8 Mcps; loss = 0.25/1.25 = 20 %; R/m = 1.25;
      // R at 10 % loss = 0.1/(0.9·25e-9) = 4.4444444 Mcps; peak 1/(e·25e-9) = 14.7151776 Mcps.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: { measuredRate: 8, countLoss: 20, correctionFactor: 1.25, rateAtTenPercentLoss: 4.444444444444444, paralyzablePeak: 14.71517764685769 },
      tolerance: 1e-8,
    },
    {
      // τ = 25 ns, R = 10 Mcps, paralyzable: m = 10·e^(−0.25) = 7.78800783 Mcps; loss = 1 − e^(−0.25) = 22.1199217 %; R/m = e^(0.25) = 1.28402542;
      // R at 10 % loss = −ln(0.9)/25e-9 = 4.21442063 Mcps.
      source: SOURCE,
      basis: "computed",
      inputs: { mode: "paralyzable" },
      expect: { measuredRate: 7.788007830714049, countLoss: 22.11992169285951, correctionFactor: 1.284025416687741, rateAtTenPercentLoss: 4.214420626313051 },
      tolerance: 1e-8,
    },
    {
      // τ = 50 ns, R = 4 Mcps, paralyzable: Rτ = 0.2; m = 4·e^(−0.2) = 3.27492301 Mcps; loss = 18.1269247 %; peak 1/(e·50e-9) = 7.35758882 Mcps.
      source: SOURCE,
      basis: "computed",
      inputs: { deadTime: 50, trueRate: 4, mode: "paralyzable" },
      expect: { measuredRate: 3.274923012311928, countLoss: 18.12692469220181, paralyzablePeak: 7.357588823428846 },
      tolerance: 1e-8,
    },
  ],
});
