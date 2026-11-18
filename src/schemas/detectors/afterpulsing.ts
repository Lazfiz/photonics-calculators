import { afterpulsingSummary } from "../../physics/detectors/afterpulsing";
import { defineSchema } from "../types";

const COVA = "Cova S., Lacaita A., Ripamonti G. (1991). Trapping phenomena in avalanche photodiodes on nanosecond scale. " +
  "IEEE Electron Device Lett. 12(12), 685–687, doi:10.1109/55.116955: one trap level gives P_ap = η·exp(−t_d/τ); several levels add " +
  "(Ziarkash A. W. et al. (2018), Comparative study of afterpulsing behavior and models in single photon counting avalanche photodiode " +
  "detectors, Sci. Rep. 8, 5076, doi:10.1038/s41598-018-23398-z). Recorded rate of a non-paralyzable counter m = R/(1 + R t_d) " +
  "(Knoll G. F., Radiation Detection and Measurement, 4th ed., Wiley 2010, ch. 4 §VII); afterpulse rate m·P_ap to first order.";

export default defineSchema({
  href: "/detectors/afterpulsing",
  inputs: [
    { key: "trapLifetime", label: "Trap 1 lifetime τ₁", unit: "ns", toSI: 1e-9, siUnit: "s", default: 20, min: 0.1, max: 1e5 },
    { key: "trapEfficiency", label: "Trap 1 amplitude η₁ (P_ap at t_d = 0)", unit: "", toSI: 1, siUnit: "", default: 0.05, min: 0, max: 1 },
    { key: "trapLifetime2", label: "Trap 2 lifetime τ₂", unit: "ns", toSI: 1e-9, siUnit: "s", default: 200, min: 0.1, max: 1e5 },
    { key: "trapEfficiency2", label: "Trap 2 amplitude η₂ (0 = off)", unit: "", toSI: 1, siUnit: "", default: 0, min: 0, max: 1 },
    { key: "deadTime", label: "Dead time t_d", unit: "ns", toSI: 1e-9, siUnit: "s", default: 50, min: 0, max: 1e5 },
    { key: "countRate", label: "True count rate", unit: "cps", toSI: 1, siUnit: "1/s", default: 1e6, min: 0, max: 1e10 },
  ],
  outputs: [
    { key: "afterpulseProbability", label: "Afterpulse probability per recorded avalanche (mean number if above 100 %)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "afterpulseRate", label: "Afterpulse rate", unit: "cps", toSI: 1, siUnit: "1/s" },
    { key: "recordedRate", label: "Recorded rate", unit: "Mcps", toSI: 1e6, siUnit: "1/s" },
    { key: "trap1Released", label: "Trap 1 released within the dead time", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ trapLifetime, trapEfficiency, trapLifetime2, trapEfficiency2, deadTime, countRate }) {
    const r = afterpulsingSummary({
      tau1: trapLifetime, eta1: trapEfficiency, tau2: trapLifetime2, eta2: trapEfficiency2, deadTime, countRate,
    });
    return {
      values: { afterpulseProbability: r.pAp, afterpulseRate: r.apRate, recordedRate: r.measured, trap1Released: r.release1 },
      warnings: r.warnings,
    };
  },
  checks: [
    {
      // One trap (η = 0.05, τ = 20 ns), t_d = 50 ns, R = 1e6 /s: P_ap = 0.05·e^(−2.5) = 0.0041042499 = 0.41042499 %;
      // m = 1e6/(1 + 1e6·50e-9) = 952380.95238 /s = 0.95238095 Mcps; R_ap = m·P_ap = 3908.80946 /s; released 1 − e^(−2.5) = 0.917915001 = 91.7915001 %.
      source: COVA,
      basis: "computed",
      inputs: {},
      expect: { afterpulseProbability: 0.41042499311949405, afterpulseRate: 3908.8094582808953, recordedRate: 0.9523809523809523, trap1Released: 91.79150013761012 },
      tolerance: 1e-8,
    },
    {
      // Two traps (η₁ = 0.05, τ₁ = 20 ns; η₂ = 0.02, τ₂ = 200 ns), t_d = 100 ns, R = 2e5 /s (R·τ₂ = 0.04, inside the first-order model):
      // P_ap = 0.05·e^(−5) + 0.02·e^(−0.5) = 3.3687e-4 + 0.0121306 = 0.012467511 = 1.2467511 %; m = 2e5/(1 + 0.02) = 196078.43 /s; R_ap = m·P_ap = 2444.6099 /s.
      source: COVA,
      basis: "computed",
      inputs: { trapEfficiency2: 0.02, deadTime: 100, countRate: 2e5 },
      expect: { afterpulseProbability: 1.2467510544206941, afterpulseRate: 2444.6099106288116, recordedRate: 0.19607843137254902, trap1Released: 99.32620530009145 },
      tolerance: 1e-8,
    },
  ],
});
