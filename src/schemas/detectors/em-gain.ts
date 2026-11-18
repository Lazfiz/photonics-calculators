import { EM_REGISTER_STAGES } from "../../physics/detectors/camera-snr";
import { emGainSummary } from "../../physics/detectors/em-gain";
import { defineSchema } from "../types";

const ROBBINS = "Robbins M. S., Hadwen B. J. (2003). The noise performance of electron multiplying charge-coupled devices. IEEE Trans. Electron Devices " +
  "50(5), 1227–1232, doi:10.1109/TED.2003.813462: G = (1 + p)^N, F² = 2(G − 1)·G^(−(N+1)/N) + 1/G; SNR = S/√(F²(S + CIC) + (σ_read/G)²) and the " +
  "conventional output SNR = S/√(S + CIC + σ_conv²) (Janesick J. R. (2007). Photon Transfer. SPIE Press, doi:10.1117/3.725073); crossover S* = (σ_conv² − (σ_read/G)²)/(F² − 1) − CIC " +
  "from equating the two noise sums.";
const NO_GAIN = "The gain exceeds 2^N: it needs more than 100 % multiplication per stage with this number of register stages, so F² is undefined.";
const NO_SIGNAL = "The input signal is zero, so both SNRs are 0 and their ratio is 0/0.";
const NO_NOISE = "No signal and no noise: the SNR is 0/0.";
const ALL_SIGNALS = "F² = 1 (G = 1) and the conventional output is noisier than the EM amplifier, so the EM output wins at every signal and there is no finite crossover.";

export default defineSchema({
  href: "/detectors/em-gain",
  inputs: [
    { key: "emGain", label: "EM gain", unit: "", toSI: 1, siUnit: "", default: 100, min: 1, max: 10000 },
    { key: "inputSignal", label: "Input signal", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 10, min: 0, max: 100000 },
    { key: "clockInducedCharge", label: "Clock-induced charge", unit: "e⁻/pix/frame", toSI: 1, siUnit: "e⁻", default: 0.001, min: 0, max: 1 },
    { key: "readNoise", label: "Read noise", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 50, min: 0, max: 500 },
    { key: "stages", label: "Gain-register stages N", unit: "", toSI: 1, siUnit: "", default: EM_REGISTER_STAGES, min: 1, max: 2000 },
    { key: "conventionalReadNoise", label: "Conventional-output read noise", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 6, min: 0, max: 500 },
  ],
  outputs: [
    { key: "outputSignal", label: "Output signal", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "effectiveRead", label: "Effective read noise σ_read/G", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "snrWithEm", label: "SNR with EM", unit: "", toSI: 1, siUnit: "" },
    { key: "snrUnity", label: "SNR at G = 1", unit: "", toSI: 1, siUnit: "" },
    { key: "emBenefit", label: "EM benefit vs G = 1", unit: "", toSI: 1, siUnit: "" },
    { key: "snrConventional", label: "SNR, conventional output", unit: "", toSI: 1, siUnit: "" },
    { key: "emVsConventional", label: "EM SNR / conventional SNR", unit: "", toSI: 1, siUnit: "" },
    { key: "crossover", label: "Crossover signal", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "enf2", label: "Excess noise factor F²", unit: "", toSI: 1, siUnit: "" },
    { key: "stageGain", label: "Gain per stage", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ emGain, inputSignal, clockInducedCharge, readNoise, stages, conventionalReadNoise }) {
    const r = emGainSummary({
      gain: emGain, signal: inputSignal, cic: clockInducedCharge, read: readNoise, stages: Math.round(stages), conventionalRead: conventionalReadNoise,
    });
    const reasons: Record<string, string> = {};
    const gainBad = !Number.isFinite(r.enf2);
    const ratioReason = gainBad ? NO_GAIN : inputSignal === 0 ? NO_SIGNAL : undefined;
    if (gainBad) {
      for (const k of ["snrWithEm", "emBenefit", "emVsConventional", "crossover", "enf2", "stageGain"]) reasons[k] = NO_GAIN;
    }
    if (ratioReason) {
      reasons.emBenefit = ratioReason;
      reasons.emVsConventional = ratioReason;
    }
    if (inputSignal === 0) {
      // S = 0 with no dark/CIC noise and no read noise: the SNR itself is 0/0 (not 0), and so is every ratio built on it.
      const nan = (v: number) => Number.isNaN(v);
      if (nan(r.snrWithEM) && !gainBad) reasons.snrWithEm = NO_NOISE;
      if (nan(r.snrWithoutEM)) reasons.snrUnity = NO_NOISE;
      if (nan(r.snrConventional)) reasons.snrConventional = NO_NOISE;
      if (!gainBad && (nan(r.snrWithEM) || nan(r.snrWithoutEM))) reasons.emBenefit = NO_NOISE;
      if (!gainBad && (nan(r.snrWithEM) || nan(r.snrConventional))) reasons.emVsConventional = NO_NOISE;
    }
    if (!gainBad && r.crossover === Infinity) reasons.crossover = ALL_SIGNALS;
    return {
      values: {
        outputSignal: r.outputSignal, effectiveRead: r.effectiveRead, snrWithEm: r.snrWithEM, snrUnity: r.snrWithoutEM, emBenefit: r.emBenefit,
        snrConventional: r.snrConventional, emVsConventional: r.emVsConventional, crossover: r.crossover, enf2: r.enf2, stageGain: r.stageProbability,
      },
      reasons,
      warnings: gainBad ? [NO_GAIN] : undefined,
    };
  },
  checks: [
    {
      // Defaults: G = 100, S = 10, CIC = 0.001, σ = 50, N = 604, σ_conv = 6. F² = 2·99·100^(−605/604) + 1/100 = 1.9749609862; p = 100^(1/604) − 1 = 0.76535941 %.
      // EM: 10/√(1.9749609862·10.001 + 0.25) = 2.2359793885; G = 1: 10/√(10.001 + 2500) = 0.19960115625; benefit 11.2022366526;
      // conventional 10/√(10.001 + 36) = 1.4744035355, ratio 1.5165314886; S* = (36 − 0.25)/(F² − 1) − 0.001 = 36.667133912; output 1000, σ/G = 0.5.
      source: ROBBINS,
      basis: "computed",
      inputs: {},
      expect: {
        outputSignal: 1000, effectiveRead: 0.5, snrWithEm: 2.2359793884849464, snrUnity: 0.19960115625276723, emBenefit: 11.202236652644377,
        snrConventional: 1.474403535510683, emVsConventional: 1.5165314885863181, crossover: 36.66713391226323, enf2: 1.974960986166897, stageGain: 0.7653594111524997,
      },
      tolerance: 1e-8,
    },
    {
      // G = 300, S = 3, CIC = 0.002, σ = 30, N = 536, σ_conv = 5: F² = 2·299·300^(−537/536) + 1/300 = 1.9755673012; p = 1.06982061 %.
      // EM 3/√(1.9755673012·3.002 + 0.01) = 1.2308472526; G = 1: 3/√(3.002 + 900) = 0.099833638; benefit 12.3289832331; conventional 3/√(3.002 + 25) = 0.5669264625;
      // S* = (25 − 0.01)/(F² − 1) − 0.002 = 25.613864708.
      source: ROBBINS,
      basis: "computed",
      inputs: { emGain: 300, inputSignal: 3, clockInducedCharge: 0.002, readNoise: 30, stages: 536, conventionalReadNoise: 5 },
      expect: {
        outputSignal: 900, effectiveRead: 0.1, snrWithEm: 1.2308472525538974, snrUnity: 0.09983363828828053, emBenefit: 12.328983233083138,
        snrConventional: 0.5669264625017274, emVsConventional: 2.171088022814153, crossover: 25.613864708178465, enf2: 1.975567301150734, stageGain: 1.0698206125758114,
      },
      tolerance: 1e-8,
    },
  ],
});
