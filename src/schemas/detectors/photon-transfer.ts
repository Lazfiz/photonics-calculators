import { photonTransferSummary } from "../../physics/detectors/photon-transfer";
import { defineSchema } from "../types";

const JANESICK = "Janesick J. R. (2007). Photon Transfer. SPIE Press, doi:10.1117/3.725073, ch. 5: σ_total² = σ_read² + σ_q² + S + (PRNU·S)² in e⁻ " +
  "with quantization noise σ_q = K/√12 for a K e⁻/DN converter; shot noise equals the read + quantization floor at S = σ_r² + K²/12 and equals the PRNU noise " +
  "at S = 1/PRNU²; flat-field correction leaves the temporal noise √(σ_r² + σ_q² + S); dynamic range 20·log₁₀(full well/floor).";
const NO_PRNU = "PRNU is 0, so the PRNU noise is zero and shot noise never equals it: there is no shot-to-PRNU crossover.";
const ABOVE_WELL = "The shot-to-PRNU crossover 1/PRNU² lies above the full well: PRNU never dominates the noise before saturation.";

export default defineSchema({
  href: "/detectors/photon-transfer",
  inputs: [
    { key: "gain", label: "Conversion gain K", unit: "e⁻/DN", toSI: 1, siUnit: "e⁻/DN", default: 2, min: 0.01, max: 1000 },
    { key: "readNoise", label: "Read noise", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 10, min: 0, max: 1000 },
    { key: "wellCapacity", label: "Full well", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 50000, min: 100, max: 10000000 },
    { key: "prnu", label: "PRNU", unit: "%", toSI: 0.01, siUnit: "", default: 1, min: 0, max: 20 },
  ],
  outputs: [
    { key: "totalNoise", label: "Total noise at full well", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "temporalNoise", label: "Temporal noise at full well", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "quantization", label: "Quantization noise K/√12", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "noiseFloor", label: "Noise floor (read + quantization)", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "readCrossover", label: "Read + quantization to shot crossover", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "prnuCrossover", label: "Shot to PRNU crossover", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "dynamicRange", label: "Dynamic range", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ gain, readNoise, wellCapacity, prnu }) {
    const r = photonTransferSummary({ gain, read: readNoise, wellCapacity, prnu });
    const warnings: string[] = [];
    const reasons: Record<string, string> = {};
    if (prnu === 0) reasons.prnuCrossover = NO_PRNU;
    else if (r.prnuCrossover > wellCapacity) warnings.push(ABOVE_WELL);
    return {
      values: {
        totalNoise: r.full.total, temporalNoise: r.full.temporal, quantization: r.full.quantization, noiseFloor: r.floor,
        readCrossover: r.readCrossover, prnuCrossover: r.prnuCrossover, dynamicRange: r.dynamicRangeDb,
      },
      reasons,
      warnings: warnings.length ? warnings : undefined,
    };
  },
  checks: [
    {
      // Defaults K = 2 e⁻/DN, σ_r = 10 e⁻, full well 50000 e⁻, PRNU 1 %: σ_q = 2/√12 = 0.57735027; temporal = √(50000 + 100 + 0.33333333) = 223.831037;
      // PRNU noise = 0.01·50000 = 500; total = √(223.831037² + 500²) = 547.814141; floor = √(100.333333) = 10.0166528; floor² = 100.333333;
      // 1/0.01² = 10000; DR = 20·log₁₀(50000/10.0166528) = 73.9649477 dB.
      source: JANESICK,
      basis: "computed",
      inputs: {},
      expect: {
        totalNoise: 547.8141412316164, temporalNoise: 223.83103746650806, quantization: 0.5773502691896258, noiseFloor: 10.016652800877813,
        readCrossover: 100.33333333333333, prnuCrossover: 10000, dynamicRange: 73.96494767797857,
      },
      tolerance: 1e-8,
    },
    {
      // K = 0.5, σ_r = 2 e⁻, full well 100000 e⁻, PRNU 0.5 %: σ_q = 0.5/√12 = 0.14433757; temporal = √(100000 + 4 + 0.0208333) = 316.234123;
      // PRNU noise = 0.005·100000 = 500; total = √(316.234123² + 500²) = 591.611377; floor = √(4.0208333) = 2.00520157; floor² = 4.0208333; 1/0.005² = 40000;
      // DR = 20·log₁₀(100000/2.00520157) = 93.9568393 dB.
      source: JANESICK,
      basis: "computed",
      inputs: { gain: 0.5, readNoise: 2, wellCapacity: 100000, prnu: 0.5 },
      expect: {
        totalNoise: 591.611376524601, temporalNoise: 316.2341234486458, quantization: 0.14433756729740646, noiseFloor: 2.0052015692526606,
        readCrossover: 4.020833333333332, prnuCrossover: 40000, dynamicRange: 93.95683928367814,
      },
      tolerance: 1e-8,
    },
  ],
});
