import { singlePoleClosedLoop } from "../../physics/detectors/tia";
import { defineSchema } from "../types";

const FRANCO = "Franco S. (2015). Design with Operational Amplifiers and Analog Integrated Circuits, 4th ed., McGraw-Hill, ch. 6: " +
  "single-pole op amp A(f) = A₀/(1 + jf/f₀), GBW = A₀·f₀; with feedback fraction β the closed loop has gain A₀/(1 + βA₀) and bandwidth " +
  "f₀(1 + βA₀) = GBW/A_cl.";

export default defineSchema({
  href: "/detectors/gain-bandwidth",
  inputs: [
    { key: "gainDC", label: "DC gain A₀", unit: "V/V", toSI: 1, siUnit: "V/V", default: 1000, min: 1, max: 1e8 },
    { key: "gbwProduct", label: "Gain-bandwidth product GBW", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1e6, min: 1, max: 1e12 },
    { key: "feedbackFraction", label: "Feedback fraction β", unit: "", toSI: 1, siUnit: "", default: 0.01, min: 0, max: 1 },
  ],
  outputs: [
    { key: "openLoopBandwidth", label: "Open-loop −3 dB frequency GBW/A₀", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "closedLoopGain", label: "Closed-loop (noise) gain A₀/(1 + β·A₀)", unit: "V/V", toSI: 1, siUnit: "V/V" },
    { key: "closedLoopBandwidth", label: "Closed-loop −3 dB frequency GBW/A_cl", unit: "Hz", toSI: 1, siUnit: "Hz" },
  ],
  compute({ gainDC, gbwProduct, feedbackFraction }) {
    const r = singlePoleClosedLoop(gainDC, gbwProduct, feedbackFraction);
    return {
      values: { openLoopBandwidth: r.openLoopBandwidth, closedLoopGain: r.gain, closedLoopBandwidth: r.bandwidth },
      warnings: [],
    };
  },
  checks: [
    {
      // A₀ = 1000, GBW = 1e6 Hz, β = 0.01: f₀ = 1e6/1000 = 1000 Hz; A_cl = 1000/(1 + 10) = 90.9090909; BW = 1e6/90.9090909 = 11000 Hz = f₀(1 + 10).
      source: FRANCO,
      basis: "computed",
      inputs: {},
      expect: { openLoopBandwidth: 1000, closedLoopGain: 90.9090909090909, closedLoopBandwidth: 11000 },
      tolerance: 1e-8,
    },
    {
      // A₀ = 1e5, GBW = 1e7 Hz, β = 0.1: f₀ = 100 Hz; 1 + βA₀ = 10001; A_cl = 1e5/10001 = 9.99900010; BW = 100·10001 = 1 000 100 Hz.
      source: FRANCO,
      basis: "computed",
      inputs: { gainDC: 1e5, gbwProduct: 1e7, feedbackFraction: 0.1 },
      expect: { openLoopBandwidth: 100, closedLoopGain: 9.99900009999, closedLoopBandwidth: 1000100 },
      tolerance: 1e-8,
    },
  ],
});
