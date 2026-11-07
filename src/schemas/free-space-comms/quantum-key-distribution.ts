import { c, h } from "../../physics/constants";
import { decoyBb84, maxChannelLossDb, maxChannelLossDbOptimalMu, optimalMu, plobBound } from "../../physics/free-space-comms/qkd";
import { defineSchema } from "../types";

const MA = "Ma X., Qi B., Zhao Y., Lo H.-K. (2005). Practical decoy state for quantum key distribution. Phys. Rev. A 72, 012326 " +
  "(arXiv:quant-ph/0503005): eq. (1) GLLP key rate, Table 1 (GYS experiment), Fig. 2 (maximal distance 142.05 km, μ = 0.48, f = 1.22), " +
  "with Q_μ and E_μ exact in Y₀ (their eqs. (5)–(11) at Y₀ ≪ 1).";
const PLOB = "Pirandola S., Laurenza R., Ottaviani C., Banchi L. (2017). Fundamental limits of repeaterless quantum communications. " +
  "Nat. Commun. 8, 15043: pure-loss channel capacity −log₂(1 − η).";

export default defineSchema({
  href: "/free-space-comms/quantum-key-distribution",
  inputs: [
    { key: "mu", label: "Mean photon number μ", unit: "", toSI: 1, siUnit: "", default: 0.48, min: 1e-6, max: 1e9 },
    { key: "range", label: "Distance", unit: "km", toSI: 1e3, siUnit: "m", default: 50, min: 0, max: 1e6 },
    { key: "fiberLoss", label: "Channel attenuation", unit: "dB/km", toSI: 1e-3, siUnit: "dB/m", default: 0.21, min: 0, max: 100 },
    { key: "fixedLoss", label: "Fixed link loss", unit: "dB", toSI: 1, siUnit: "dB", default: 0, min: 0, max: 300 },
    { key: "detectorEfficiency", label: "Bob's efficiency η_Bob (optics × detector)", unit: "", toSI: 1, siUnit: "", default: 0.045, min: 1e-9, max: 1 },
    { key: "y0", label: "Background probability per pulse Y₀", unit: "", toSI: 1, siUnit: "", default: 1.7e-6, min: 0, max: 1 },
    { key: "eDetector", label: "Optical error e_d", unit: "", toSI: 1, siUnit: "", default: 0.033, min: 0, max: 0.5 },
    { key: "fEc", label: "Error-correction inefficiency f", unit: "", toSI: 1, siUnit: "", default: 1.22, min: 1, max: 10 },
    { key: "repRate", label: "Pulse rate", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1e9, min: 1, max: 1e12 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 100, max: 20000 },
  ],
  outputs: [
    { key: "keyPerPulse", label: "Secure key per pulse", unit: "bit", toSI: 1, siUnit: "bit" },
    { key: "keyRate", label: "Secure key rate", unit: "bit/s", toSI: 1, siUnit: "bit/s" },
    { key: "qber", label: "QBER E_μ", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "e1", label: "Single-photon error e₁", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "lossDb", label: "Channel loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "etaChannel", label: "Channel transmittance η_ch", unit: "", toSI: 1, siUnit: "" },
    { key: "eta", label: "Overall transmittance η = η_ch·η_Bob", unit: "", toSI: 1, siUnit: "" },
    { key: "gain", label: "Gain Q_μ", unit: "per pulse", toSI: 1, siUnit: "per pulse" },
    { key: "q1", label: "Single-photon gain Q₁", unit: "per pulse", toSI: 1, siUnit: "per pulse" },
    { key: "maxLoss", label: "Largest channel loss with key > 0 (μ fixed)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "maxRange", label: "Maximum distance (key > 0, μ fixed)", unit: "km", toSI: 1e3, siUnit: "m" },
    { key: "maxLossOptimalMu", label: "Largest channel loss with key > 0 (μ optimised)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "optimalMu", label: "Optimal μ here", unit: "", toSI: 1, siUnit: "" },
    { key: "optimalKey", label: "Key per pulse at optimal μ", unit: "bit", toSI: 1, siUnit: "bit" },
    { key: "plobPerPulse", label: "PLOB bound per pulse", unit: "bit", toSI: 1, siUnit: "bit" },
    { key: "plobRate", label: "PLOB bound rate", unit: "bit/s", toSI: 1, siUnit: "bit/s" },
    { key: "power", label: "Mean optical power", unit: "mW", toSI: 1e-3, siUnit: "W" },
  ],
  compute({ mu, range, fiberLoss, fixedLoss, detectorEfficiency: etaBob, y0, eDetector, fEc, repRate, wavelength }) {
    const lossDb = fiberLoss * range + fixedLoss;
    const etaCh = 10 ** (-lossDb / 10);
    const eta = etaCh * etaBob;
    const sys = { y0, eDetector, fEc };
    const res = decoyBb84({ ...sys, mu, eta });
    const maxLoss = maxChannelLossDb({ ...sys, mu }, etaBob, 300);
    const maxLossOpt = maxChannelLossDbOptimalMu(sys, etaBob, 300);
    const maxRange = !Number.isFinite(maxLoss) ? NaN
      : fiberLoss > 0 ? Math.max(0, (maxLoss - fixedLoss) / fiberLoss)
        : maxLoss >= fixedLoss ? NaN : 0;
    const muOpt = optimalMu({ ...sys, eta });
    const optKey = decoyBb84({ ...sys, mu: muOpt, eta }).keyPerPulse;
    const plob = plobBound(etaCh);
    const warnings: string[] = [];
    if (!(res.keyPerPulse > 0)) warnings.push("No secure key at these parameters: the key rate is 0.");
    if (maxLoss === 0) warnings.push("No key even at zero channel loss: maxRange is 0.");
    else if (!Number.isFinite(maxLoss)) warnings.push("Key still positive at 300 dB channel loss: maxLoss and maxRange are null (unlimited).");
    else if (fiberLoss === 0 && maxLoss >= fixedLoss) warnings.push("No attenuation: the limit is a loss budget, independent of distance, so maxRange is null.");
    if (!Number.isFinite(maxLossOpt)) warnings.push("Key with optimal μ still positive at 300 dB: maxLossOptimalMu is null (unlimited).");
    if (!(optKey > 0)) warnings.push("No key at any 0.01 ≤ μ ≤ 1: optimalMu is null.");
    if (!Number.isFinite(plob)) warnings.push("Lossless channel (η_ch = 1): the PLOB bound is unbounded, so plobPerPulse and plobRate are null.");
    return {
      values: {
        keyPerPulse: res.keyPerPulse,
        keyRate: res.keyPerPulse * repRate,
        qber: res.qber,
        e1: res.e1,
        lossDb,
        etaChannel: etaCh,
        eta,
        gain: res.gain,
        q1: res.q1,
        maxLoss,
        maxRange,
        maxLossOptimalMu: maxLossOpt,
        optimalMu: optKey > 0 ? muOpt : NaN,
        optimalKey: optKey,
        plobPerPulse: plob,
        plobRate: plob * repRate,
        power: (mu * repRate * h * c) / wavelength,
      },
      warnings,
    };
  },
  checks: [
    {
      // Fig. 2 prints 142.05 km (dashed curve, Eq. (1), GYS Table 1, μ = 0.48, f = 1.22; f = 1 would reach 150 km). The
      // equations above give 142.015 km (also 142.0145 km with their eq. (10)–(11) forms), 0.025 % less, so the tolerance
      // is 5e-4 rather than the 4e-5 that the printed rounding alone would need.
      source: MA,
      basis: "printed",
      inputs: {},
      expect: { maxRange: 142.05 },
      tolerance: 5e-4,
    },
    {
      // 50 km: loss 0.21·50 = 10.5 dB, η = 0.045 · 10^(−1.05) = 0.0040213; Q_μ = 1 − (1 − Y₀)e^(−ημ) = 1.924947e-3,
      // E_μ = (½Y₀e^(−ημ) + e_d(1 − e^(−ημ)))/Q_μ = 3.341163 %; Y₁ = Y₀ + η − Y₀η, Q₁ = Y₁μe^(−μ) = 1.191724e-3,
      // e₁ = (½Y₀(1 − η) + e_dη)/Y₁ = 3.319707 %; R = ½[−fQ_μH₂(E_μ) + Q₁(1 − H₂(e₁))] = 2.226026e-4 bit/pulse
      // (222.6 kb/s at 1 GHz). Optimal-μ and cutoff outputs are not checked here.
      source: MA,
      basis: "computed",
      inputs: {},
      expect: {
        lossDb: 10.5, gain: 0.0019249469364426286, q1: 0.0011917240636211562, qber: 3.341163375294123,
        e1: 3.3197071890525266, keyPerPulse: 0.00022260255590642682, keyRate: 222602.5559064268,
      },
      tolerance: 1e-8,
    },
    {
      // Channel with 10 dB fixed loss and no distance (range 0): η_ch = 0.1, −log₂(1 − 0.1) = 0.1520031 bit per pulse,
      // 152.0 Mb/s at 1 GHz.
      source: PLOB,
      basis: "computed",
      inputs: { range: 0, fixedLoss: 10 },
      expect: { etaChannel: 0.1, plobPerPulse: 0.15200309344504995, plobRate: 152003093.44504994 },
      tolerance: 1e-10,
    },
  ],
});
