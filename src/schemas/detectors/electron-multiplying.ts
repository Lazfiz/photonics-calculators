import { EM_REGISTER_STAGES } from "../../physics/detectors/camera-snr";
import { emVsScmosSummary } from "../../physics/detectors/electron-multiplying";
import { defineSchema } from "../types";

const ROBBINS = "Robbins M. S., Hadwen B. J. (2003). The noise performance of electron multiplying charge-coupled devices. IEEE Trans. Electron Devices " +
  "50(5), 1227–1232, doi:10.1109/TED.2003.813462: F² = 2(G − 1)·G^(−(N+1)/N) + 1/G; EMCCD SNR = S/√(F²(S + D) + (σ_read/G)²), " +
  "sCMOS SNR = S/√(S + D + σ_read²) (Janesick J. R. (2007). Photon Transfer. SPIE Press, doi:10.1117/3.725073).";
const NO_NOISE = "No signal and no noise: the SNR is 0/0.";
const NO_GAIN = "The gain exceeds 2^N: it needs more than 100 % multiplication per stage with this number of register stages, so F² is undefined.";

export default defineSchema({
  href: "/detectors/electron-multiplying",
  inputs: [
    { key: "signalElectrons", label: "Signal", unit: "e⁻/pix/frame", toSI: 1, siUnit: "e⁻", default: 10, min: 0, max: 100000 },
    { key: "darkCurrent", label: "Dark current", unit: "e⁻/pix/frame", toSI: 1, siUnit: "e⁻", default: 0.001, min: 0, max: 1000 },
    { key: "emccdReadNoise", label: "EMCCD read noise", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 60, min: 0, max: 500 },
    { key: "scmosReadNoise", label: "sCMOS read noise", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 1.5, min: 0, max: 100 },
    { key: "emGain", label: "EM gain", unit: "", toSI: 1, siUnit: "", default: 1000, min: 1, max: 10000 },
    { key: "stages", label: "Gain-register stages N", unit: "", toSI: 1, siUnit: "", default: EM_REGISTER_STAGES, min: 1, max: 2000 },
  ],
  outputs: [
    { key: "emccdSnr", label: "EMCCD SNR", unit: "", toSI: 1, siUnit: "" },
    { key: "scmosSnr", label: "sCMOS SNR", unit: "", toSI: 1, siUnit: "" },
    { key: "enf2", label: "Excess noise factor F²", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ signalElectrons, darkCurrent, emccdReadNoise, scmosReadNoise, emGain, stages }) {
    const r = emVsScmosSummary({
      signal: signalElectrons, dark: darkCurrent, emccdRead: emccdReadNoise, scmosRead: scmosReadNoise, gain: emGain, stages: Math.round(stages),
    });
    const reasons: Record<string, string> = {};
    if (!Number.isFinite(r.enf2)) {
      reasons.enf2 = NO_GAIN;
      reasons.emccdSnr = NO_GAIN;
    }
    // S = 0 with no dark current and no read noise: SNR = 0/0.
    if (signalElectrons === 0 && Number.isNaN(r.emccdSnr) && !reasons.emccdSnr) reasons.emccdSnr = NO_NOISE;
    if (signalElectrons === 0 && Number.isNaN(r.scmosSnr)) reasons.scmosSnr = NO_NOISE;
    return { values: { emccdSnr: r.emccdSnr, scmosSnr: r.scmosSnr, enf2: r.enf2 }, reasons, warnings: Object.keys(reasons).length ? [NO_GAIN] : undefined };
  },
  checks: [
    {
      // Defaults: G = 1000, N = 604: F² = 2·999·1000^(−605/604) + 1/1000 = 1.9762796817. EMCCD: 10/√(1.9762796817·10.001 + (60/1000)²) = 2.2491298810;
      // sCMOS: 10/√(10 + 0.001 + 2.25) = 2.8570262462.
      source: ROBBINS,
      basis: "computed",
      inputs: {},
      expect: { emccdSnr: 2.2491298809918407, scmosSnr: 2.857026246206452, enf2: 1.9762796816730521 },
      tolerance: 1e-8,
    },
    {
      // S = 200, D = 0.01, EMCCD read 40, sCMOS read 1.2, G = 200, N = 536: F² = 2·199·200^(−537/536) + 1/200 = 1.9754259118;
      // EMCCD 200/√(1.9754259118·200.01 + (40/200)²) = 10.061246401; sCMOS 200/√(200.01 + 1.44) = 14.091147463.
      source: ROBBINS,
      basis: "computed",
      inputs: { signalElectrons: 200, darkCurrent: 0.01, emccdReadNoise: 40, scmosReadNoise: 1.2, emGain: 200, stages: 536 },
      expect: { emccdSnr: 10.061246400510402, scmosSnr: 14.091147463317563, enf2: 1.9754259118214537 },
      tolerance: 1e-8,
    },
  ],
});
