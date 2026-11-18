import { snrToDb, uniformitySummary } from "../../physics/detectors/uniformity";
import { defineSchema } from "../types";

const REFS =
  "EMVA Standard 1288, Release 3.1 (2016). Standard for Characterization of Image Sensors and Cameras, Eq. (45)–(48): " +
  "spatial variance DSNU² + (PRNU·S)², σ_total² = σ_d² + DSNU² + S + (PRNU·S)² with σ_d² = σ_read² + D; " +
  "Janesick J. R. (2007). Photon Transfer. SPIE Press, doi:10.1117/3.725073, ch. 5: shot noise equals the fixed-pattern noise at S = 1/PRNU², " +
  "flat-field correction leaves the temporal noise √(S + D + σ_read²).";
const NO_PRNU = "PRNU is 0, so the PRNU noise is zero and shot noise never equals it: there is no shot-to-PRNU crossover.";
const NO_SIGNAL = "The mean photo signal is 0, so the SNR is 0 and its decibel value (20·log₁₀) is undefined.";
const NO_NOISE = "The signal and every noise term are 0: the SNR 0/0 is undefined.";
const NO_TEMPORAL = "The signal and the temporal noise (shot, dark shot, read) are all 0: the flat-field SNR 0/0 is undefined.";

export default defineSchema({
  href: "/detectors/uniformity",
  inputs: [
    { key: "meanSignal", label: "Mean photo signal (above dark)", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 50000, min: 0, max: 10000000 },
    { key: "darkSignal", label: "Dark signal", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 100, min: 0, max: 10000000 },
    { key: "prnuPercent", label: "PRNU (% of mean signal)", unit: "%", toSI: 0.01, siUnit: "", default: 1, min: 0, max: 20 },
    { key: "dsnu", label: "DSNU", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 2, min: 0, max: 10000 },
    { key: "readNoise", label: "Read noise", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 5, min: 0, max: 1000 },
  ],
  outputs: [
    { key: "totalNoise", label: "Total noise (one frame)", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "spatialNoise", label: "Spatial noise √(DSNU² + (PRNU·S)²)", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "temporalNoise", label: "Temporal noise √(S + D + σ_read²)", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "snr", label: "SNR (one frame)", unit: "", toSI: 1, siUnit: "" },
    { key: "snrDb", label: "SNR (one frame, 20·log₁₀)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "snrFlatField", label: "SNR after flat-field correction", unit: "", toSI: 1, siUnit: "" },
    { key: "snrFlatFieldDb", label: "SNR after flat-field correction (20·log₁₀)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "prnuCrossover", label: "Signal at which shot noise = PRNU noise (1/PRNU²)", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
  ],
  compute({ meanSignal, darkSignal, prnuPercent, dsnu, readNoise }) {
    // prnuPercent arrives as a fraction (toSI 0.01).
    const r = uniformitySummary({ signal: meanSignal, dark: darkSignal, read: readNoise, prnu: prnuPercent, dsnu });
    const reasons: Record<string, string> = {};
    if (!(r.noise.total > 0)) {
      reasons.snr = NO_NOISE;
      reasons.snrDb = NO_NOISE;
    } else if (!(meanSignal > 0)) reasons.snrDb = NO_SIGNAL;
    if (!(r.noise.temporal > 0)) {
      reasons.snrFlatField = NO_TEMPORAL;
      reasons.snrFlatFieldDb = NO_TEMPORAL;
    } else if (!(meanSignal > 0)) reasons.snrFlatFieldDb = NO_SIGNAL;
    if (prnuPercent === 0) reasons.prnuCrossover = NO_PRNU;
    return {
      values: {
        totalNoise: r.noise.total,
        spatialNoise: r.noise.spatial,
        temporalNoise: r.noise.temporal,
        snr: r.snr,
        snrDb: snrToDb(r.snr),
        snrFlatField: r.snrFlat,
        snrFlatFieldDb: snrToDb(r.snrFlat),
        prnuCrossover: r.crossover,
      },
      reasons,
    };
  },
  checks: [
    {
      // Defaults S = 50000 e⁻, D = 100 e⁻, PRNU = 1 %, DSNU = 2 e⁻, σ_read = 5 e⁻: temporal = √(50000 + 100 + 25) = 223.8861318;
      // PRNU noise = 0.01·50000 = 500; spatial = √(2² + 500²) = 500.0039999840; total = √(223.8861318² + 500.0039999840²) = 547.8403052;
      // SNR = 50000/547.8403052 = 91.26747252 (39.20632047 dB); flat-fielded SNR = 50000/223.8861318 = 223.3278122 (46.97885623 dB); 1/0.01² = 10000.
      source: REFS,
      basis: "computed",
      inputs: {},
      expect: {
        totalNoise: 547.8403051985131, spatialNoise: 500.00399998400013, temporalNoise: 223.8861317723811, snr: 91.26747251990197,
        snrDb: 39.20632047464176, snrFlatField: 223.32781224177668, snrFlatFieldDb: 46.97885623043799, prnuCrossover: 10000,
      },
      tolerance: 1e-8,
    },
    {
      // S = 2000 e⁻, D = 50 e⁻, PRNU = 3 %, DSNU = 1.5 e⁻, σ_read = 3 e⁻: temporal = √(2000 + 50 + 9) = 45.37620522; PRNU noise = 0.03·2000 = 60;
      // spatial = √(1.5² + 60²) = 60.01874707; total = √(45.37620522² + 60.01874707²) = 75.24127856; SNR = 2000/75.24127856 = 26.58115383 (28.49147658 dB);
      // flat-fielded SNR = 2000/45.37620522 = 44.07596427 (32.88403644 dB); 1/0.03² = 1111.111111.
      source: REFS,
      basis: "computed",
      inputs: { meanSignal: 2000, darkSignal: 50, prnuPercent: 3, dsnu: 1.5, readNoise: 3 },
      expect: {
        totalNoise: 75.24127856436253, spatialNoise: 60.01874707122767, temporalNoise: 45.37620521815371, snr: 26.581153831525732,
        snrDb: 28.491476576369486, snrFlatField: 44.075964272125994, snrFlatFieldDb: 32.88403644709931, prnuCrossover: 1111.111111111111,
      },
      tolerance: 1e-8,
    },
  ],
});
