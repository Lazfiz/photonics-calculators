import { readoutNoiseSummary } from "../../physics/detectors/readout-noise";
import { defineSchema } from "../types";

const JANESICK = "Janesick J. R. (2007). Photon Transfer. SPIE Press, doi:10.1117/3.725073: noise at zero signal as the quadrature sum of read noise " +
  "σ_read and the shot noise √N_dark of the accumulated dark charge, √(σ_read² + N_dark); shot noise √S equals the read noise at S = σ_read².";

export default defineSchema({
  href: "/detectors/readout-noise",
  inputs: [
    { key: "readNoise", label: "Read noise σ_read", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 10, min: 0, max: 1e4 },
    { key: "darkCurrent", label: "Dark current", unit: "e⁻/s/pixel", toSI: 1, siUnit: "e⁻/s", default: 0.1, min: 0, max: 1e9 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 0.01, min: 0, max: 1e6 },
  ],
  outputs: [
    { key: "darkElectrons", label: "Dark electrons", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "noiseFloor", label: "Noise floor √(σ_read² + dark)", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻" },
    { key: "readNoiseLimitedSignal", label: "Read-noise-limited signal (shot = read noise)", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
  ],
  compute({ readNoise, darkCurrent, exposureTime }) {
    return { values: readoutNoiseSummary({ readNoise, darkCurrent, exposureTime }) };
  },
  checks: [
    {
      // σ_read = 4 e⁻, 2 e⁻/s for 3 s: N_dark = 6 e⁻; floor √(16 + 6) = √22 = 4.6904158 e⁻; shot = read noise at S = 4² = 16 e⁻.
      source: JANESICK,
      basis: "computed",
      inputs: { readNoise: 4, darkCurrent: 2, exposureTime: 3 },
      expect: { darkElectrons: 6, noiseFloor: 4.69041575982343, readNoiseLimitedSignal: 16 },
      tolerance: 1e-8,
    },
    {
      // Defaults: σ_read = 10 e⁻, 0.1 e⁻/s for 0.01 s: N_dark = 0.001 e⁻; floor √(100 + 0.001) = 10.00005 e⁻; S = 100 e⁻.
      source: JANESICK,
      basis: "computed",
      inputs: {},
      expect: { darkElectrons: 0.001, noiseFloor: 10.000049999875001, readNoiseLimitedSignal: 100 },
      tolerance: 1e-8,
    },
  ],
});
