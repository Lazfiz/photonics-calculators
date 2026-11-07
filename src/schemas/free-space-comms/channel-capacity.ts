import {
  BITS_PER_SYMBOL, bitErrorRate, minimumHardDecisionOverhead, requiredSnrDb, shannonCapacity, shannonEbN0,
  type Modulation,
} from "../../physics/free-space-comms/channel-capacity";
import { defineSchema } from "../types";

const SHANNON = "Shannon C. E. (1948). A mathematical theory of communication. Bell Syst. Tech. J. 27(3), 379–423, " +
  "Theorem 17: C = B log₂(1 + S/N).";
const PROAKIS = "Proakis J. G., Salehi M. (2008). Digital Communications, 5th ed. McGraw-Hill, ch. 4 and 6: Gray-coded " +
  "BPSK Q(√(2E_s/N₀)), QPSK Q(√(E_s/N₀)) per bit.";

const dB = (x: number) => 10 * Math.log10(x);

export default defineSchema({
  href: "/free-space-comms/channel-capacity",
  choices: [
    {
      key: "modulation",
      label: "Modulation (Gray-coded, coherent)",
      options: [
        { value: "OOK", label: "OOK" },
        { value: "BPSK", label: "BPSK" },
        { value: "QPSK", label: "QPSK" },
        { value: "8PSK", label: "8PSK" },
        { value: "16QAM", label: "16QAM" },
      ],
      default: "QPSK",
    },
  ],
  inputs: [
    { key: "bandwidth", label: "Bandwidth B", unit: "GHz", toSI: 1e9, siUnit: "Hz", default: 1, min: 1e-6, max: 1000 },
    { key: "snrDB", label: "SNR = Es/N0", unit: "dB", toSI: 1, siUnit: "dB", default: 20, min: -20, max: 40 },
    { key: "fecOverhead", label: "FEC overhead", unit: "%", toSI: 0.01, siUnit: "", default: 7, min: 0, max: 100 },
    { key: "berLimit", label: "FEC input-BER limit", unit: "", toSI: 1, siUnit: "", default: 3.8e-3, min: 1e-15, max: 0.2 },
  ],
  outputs: [
    { key: "capacity", label: "Shannon capacity", unit: "Gb/s", toSI: 1e9, siUnit: "b/s" },
    { key: "shannonSpectralEfficiency", label: "Shannon spectral efficiency", unit: "b/s/Hz", toSI: 1, siUnit: "b/s/Hz" },
    { key: "netRate", label: "Net rate of the modulation after FEC (0 if the uncoded BER exceeds the limit)", unit: "Gb/s", toSI: 1e9, siUnit: "b/s" },
    { key: "uncodedBer", label: "Uncoded bit error rate", unit: "", toSI: 1, siUnit: "" },
    { key: "requiredSnr", label: "Required Es/N0 for the BER limit", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "gapToShannon", label: "Gap to Shannon at the same net spectral efficiency", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "shannonEbN0Limit", label: "Shannon Eb/N0 limit at the net spectral efficiency", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "minimumOverhead", label: "Smallest overhead of a hard-decision code at the BER limit", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ modulation, bandwidth, snrDB, fecOverhead, berLimit }) {
    const mod = modulation as Modulation;
    const snr = 10 ** (snrDB / 10);
    const capacity = shannonCapacity(bandwidth, snr);
    const k = BITS_PER_SYMBOL[mod];
    const eta = k / (1 + fecOverhead); // net b/s/Hz
    const req = requiredSnrDb(mod, berLimit);
    const ok = snrDB >= req;
    const minOh = minimumHardDecisionOverhead(berLimit);
    const warnings: string[] = [];
    if (Number.isNaN(req)) warnings.push("The BER limit is outside the range this modulation reaches between −20 and 40 dB Es/N0: no required SNR.");
    else if (req === Infinity) warnings.push("The BER limit needs more than 40 dB Es/N0.");
    else if (!ok) warnings.push("The uncoded BER is above the FEC limit at this SNR: the net rate is 0.");
    if (fecOverhead < minOh) {
      warnings.push("No hard-decision code can correct this input BER with this overhead (code rate ≤ 1 − H₂(p)): the net rate is not achievable.");
    }
    return {
      values: {
        capacity,
        shannonSpectralEfficiency: capacity / bandwidth,
        netRate: ok ? bandwidth * eta : 0,
        uncodedBer: bitErrorRate(mod, snr),
        requiredSnr: req,
        gapToShannon: req - dB(2 ** eta - 1),
        shannonEbN0Limit: dB(shannonEbN0(eta)),
        minimumOverhead: minOh,
      },
      warnings,
    };
  },
  checks: [
    {
      // C = B log₂(1 + SNR) with B = 1 GHz and SNR = 100 (20 dB): 10⁹ · log₂(101) = 6.658211483 Gb/s; η = 6.658211483 b/s/Hz.
      source: SHANNON,
      basis: "computed",
      inputs: { bandwidth: 1, snrDB: 20 },
      expect: { capacity: 6.658211482751795, shannonSpectralEfficiency: 6.658211482751795 },
      tolerance: 1e-8,
    },
    {
      // QPSK, 10 dB, B = 1 GHz, 7 % overhead, limit 3.8e-3: BER = Q(√10) = 7.827011e-4; Q(√γ) = 3.8e-3 at 8.528085 dB;
      // η = 2/1.07 = 1.869159 b/s/Hz, R = 1.869159 Gb/s; gap = 8.528085 − 10 log₁₀(2^η − 1) = 4.290393 dB;
      // Eb/N0 limit 10 log₁₀((2^η − 1)/η) = 1.521230 dB; 1/(1 − H₂(3.8e-3)) − 1 = 3.736914 %.
      source: `${PROAKIS} ${SHANNON}`,
      basis: "computed",
      inputs: { modulation: "QPSK", bandwidth: 1, snrDB: 10, fecOverhead: 7, berLimit: 3.8e-3 },
      expect: {
        uncodedBer: 7.827011290010844e-4, requiredSnr: 8.528084694614321, netRate: 1.8691588785046727,
        gapToShannon: 4.290392517418799, shannonEbN0Limit: 1.521229997407807, minimumOverhead: 3.7369142574402936,
      },
      tolerance: 1e-6,
    },
    {
      // BPSK, 12 dB, B = 2.5 GHz, 20 % overhead, limit 1e-3: BER = Q(√(2γ)) = 9.006010e-9; Q(√(2γ)) = 1e-3 at
      // 6.789523 dB; η = 1/1.2, R = 2.083333 Gb/s; gap 7.858580 dB; Eb/N0 limit −0.277245 dB.
      source: `${PROAKIS} ${SHANNON}`,
      basis: "computed",
      inputs: { modulation: "BPSK", bandwidth: 2.5, snrDB: 12, fecOverhead: 20, berLimit: 1e-3 },
      expect: {
        uncodedBer: 9.006010350628784e-9, requiredSnr: 6.7895226124042285, netRate: 2.0833333333333335,
        gapToShannon: 7.858580193076379, shannonEbN0Limit: -0.27724512019590236,
      },
      tolerance: 1e-6,
    },
  ],
});
