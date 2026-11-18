import { photonCountingSummary } from "../../physics/detectors/photon-counting";
import { defineSchema } from "../types";

const SOURCE = "Poisson counts of mean μ have variance μ, so the shot-noise SNR is √μ and the relative error 1/√μ. Non-paralyzable dead time: " +
  "recorded rate m = R/(1 + Rτ), loss Rτ/(1 + Rτ) (Knoll G. F. (2010), Radiation Detection and Measurement, 4th ed., Wiley, ch. 4 §VII); " +
  "Fano factor of the recorded counts 1/(1 + Rτ)² for a long gate (Müller J. W. (1973), Dead-time problems, Nucl. Instrum. Methods 112, 47–57, " +
  "doi:10.1016/0029-554X(73)90773-8); the corrected rate has relative error 1/√N for N recorded counts.";

export default defineSchema({
  href: "/detectors/photon-counting",
  inputs: [
    { key: "meanCounts", label: "Mean counts per interval μ", unit: "", toSI: 1, siUnit: "", default: 100, min: 0.1, max: 1e12 },
    { key: "deadTime", label: "Dead time", unit: "ns", toSI: 1e-9, siUnit: "s", default: 50, min: 0, max: 1e6 },
    { key: "countRate", label: "Incident count rate", unit: "counts/s", toSI: 1, siUnit: "1/s", default: 1e6, min: 1, max: 1e10 },
    { key: "integrationTime", label: "Integration time", unit: "s", toSI: 1, siUnit: "s", default: 1, min: 1e-6, max: 1e5 },
  ],
  outputs: [
    { key: "snr", label: "SNR per interval √μ", unit: "", toSI: 1, siUnit: "" },
    { key: "snrDb", label: "SNR per interval (10·log₁₀ μ)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "relativeError", label: "Relative error 1/√μ", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "recordedRate", label: "Recorded count rate", unit: "counts/s", toSI: 1, siUnit: "1/s" },
    { key: "countLoss", label: "Dead-time loss", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "recordedCounts", label: "Recorded counts", unit: "counts", toSI: 1, siUnit: "counts" },
    { key: "fano", label: "Fano factor of the recorded counts", unit: "", toSI: 1, siUnit: "" },
    { key: "correctedSnr", label: "Corrected-rate SNR", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ meanCounts, deadTime, countRate, integrationTime }) {
    const r = photonCountingSummary({ meanCounts, deadTime, countRate, integrationTime });
    return {
      values: {
        snr: r.snr, snrDb: r.snrDb, relativeError: r.relativeError, recordedRate: r.measured, countLoss: r.loss,
        recordedCounts: r.recordedCounts, fano: r.fano, correctedSnr: r.correctedSnr,
      },
    };
  },
  checks: [
    {
      // μ = 100, τ = 50 ns, R = 1e6 /s, T = 1 s: SNR = √100 = 10, 10·log₁₀ 100 = 20 dB, 1/√μ = 10 %.
      // Rτ = 0.05; m = 1e6/1.05 = 952380.952; loss = 0.05/1.05 = 4.7619048 %; N = m·T = 952380.952; Fano = 1/1.05² = 0.90702948; SNR_corrected = √N = 975.90007.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        snr: 10, snrDb: 20, relativeError: 10, recordedRate: 952380.9523809523, countLoss: 4.761904761904762,
        recordedCounts: 952380.9523809523, fano: 0.9070294784580498, correctedSnr: 975.9000729485332,
      },
      tolerance: 1e-8,
    },
    {
      // μ = 2.5, τ = 200 ns, R = 2e6 /s, T = 0.5 s: SNR = √2.5 = 1.5811388, 10·log₁₀ 2.5 = 3.9794001 dB, 1/√2.5 = 63.245553 %.
      // Rτ = 0.4; m = 2e6/1.4 = 1428571.43; loss = 0.4/1.4 = 28.571429 %; N = 714285.714; Fano = 1/1.96 = 0.51020408; SNR_corrected = √N = 845.15425.
      source: SOURCE,
      basis: "computed",
      inputs: { meanCounts: 2.5, deadTime: 200, countRate: 2e6, integrationTime: 0.5 },
      expect: {
        snr: 1.5811388300841898, snrDb: 3.979400086720376, relativeError: 63.245553203367585, recordedRate: 1428571.4285714286,
        countLoss: 28.571428571428573, recordedCounts: 714285.7142857143, fano: 0.5102040816326532, correctedSnr: 845.1542547285165,
      },
      tolerance: 1e-8,
    },
  ],
});
