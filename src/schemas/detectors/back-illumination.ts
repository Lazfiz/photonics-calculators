import { backIlluminationSummary, type NoiseRegime } from "../../physics/detectors/back-illumination";
import { defineSchema } from "../types";

const JANESICK = "Janesick J. R. (2007). Photon Transfer. SPIE Press, doi:10.1117/3.725073: with the signal's shot noise dominant SNR ∝ √QE, " +
  "with a signal-independent read floor dominant SNR ∝ QE; for a QE ratio r the SNR gain is √r or r, an amplitude ratio (dB = 20·log₁₀).";

const FI_ZERO = "The front-illuminated effective QE is 0 (peak QE or CFA transmission is 0), so the BI/FI ratio and the SNR gain are undefined.";
const BI_ZERO = "The back-illuminated effective QE is 0, so the QE ratio is 0 and no SNR gain is computed.";

export default defineSchema({
  href: "/detectors/back-illumination",
  inputs: [
    { key: "fiQE", label: "Front-illuminated peak QE", unit: "", toSI: 1, siUnit: "", default: 0.4, min: 0, max: 1 },
    { key: "biQE", label: "Back-illuminated peak QE", unit: "", toSI: 1, siUnit: "", default: 0.95, min: 0, max: 1 },
    { key: "cfaTransmission", label: "CFA transmission", unit: "", toSI: 1, siUnit: "", default: 0.25, min: 0, max: 1 },
    { key: "microlensGain", label: "Microlens fill-factor gain", unit: "", toSI: 1, siUnit: "", default: 1.3, min: 1, max: 3 },
  ],
  choices: [
    {
      key: "regime",
      label: "Noise regime",
      options: [
        { value: "shot", label: "Shot-noise limited (SNR ∝ √QE)" },
        { value: "read", label: "Read-noise limited (SNR ∝ QE)" },
      ],
      default: "shot",
    },
  ],
  outputs: [
    { key: "effectiveFi", label: "Effective FI QE", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "effectiveBi", label: "Effective BI QE", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "qeRatio", label: "QE improvement (BI/FI)", unit: "×", toSI: 1, siUnit: "" },
    { key: "snrGain", label: "SNR improvement", unit: "×", toSI: 1, siUnit: "" },
    { key: "snrGainDb", label: "SNR improvement (20·log₁₀)", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ fiQE, biQE, cfaTransmission, microlensGain, regime }) {
    const r = backIlluminationSummary({ fiQE, biQE, cfa: cfaTransmission, microlensGain, regime: regime as NoiseRegime });
    const warnings: string[] = [];
    const reasons: Record<string, string> = {};
    if (!(r.effectiveFi > 0)) {
      warnings.push(FI_ZERO);
      for (const k of ["qeRatio", "snrGain", "snrGainDb"]) reasons[k] = FI_ZERO;
    } else if (!(r.effectiveBi > 0)) {
      warnings.push(BI_ZERO);
      for (const k of ["snrGain", "snrGainDb"]) reasons[k] = BI_ZERO;
    }
    return { values: r, warnings, reasons };
  },
  checks: [
    {
      // Peak QE 0.4 (FI) and 0.9 (BI), CFA 0.5, microlens gain 1.2: effective FI = min(1, 0.48)·0.5 = 0.24; effective BI = min(1, 1.08)·0.5 = 0.5;
      // ratio r = 0.5/0.24 = 2.0833333; shot-limited gain √r = 1.4433757, 20·log₁₀(1.4433757) = 3.1875876 dB.
      source: JANESICK,
      basis: "computed",
      inputs: { fiQE: 0.4, biQE: 0.9, cfaTransmission: 0.5, microlensGain: 1.2, regime: "shot" },
      expect: { effectiveFi: 24, effectiveBi: 50, qeRatio: 2.0833333333333335, snrGain: 1.4433756729740645, snrGainDb: 3.1875876262441287 },
      tolerance: 1e-8,
    },
    {
      // Same pixels, read-noise limited: the SNR gain is r = 2.0833333 and 20·log₁₀(2.0833333) = 6.3751753 dB.
      source: JANESICK,
      basis: "computed",
      inputs: { fiQE: 0.4, biQE: 0.9, cfaTransmission: 0.5, microlensGain: 1.2, regime: "read" },
      expect: { snrGain: 2.0833333333333335, snrGainDb: 6.375175252488257 },
      tolerance: 1e-8,
    },
  ],
});
