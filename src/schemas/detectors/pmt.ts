import { pmtSummary } from "../../physics/detectors/pmt";
import { defineSchema } from "../types";

const HAMAMATSU = "Hamamatsu Photonics (2017). Photomultiplier Tubes: Basics and Applications, 4th ed., §4.3.7: gain G = δⁿ of n equal dynodes, " +
  "noise figure F = 1 + 1/δ + 1/δ² + … + 1/δⁿ (Poisson secondary emission at every stage), and the SNR of a multiplied photocurrent " +
  "R_s/√(2B(R_s + R_d)F) with R_s, R_d in photoelectrons per second at the cathode so the gain cancels (Eq. 4-29); anode current I = R_s·e·G.";

export default defineSchema({
  href: "/detectors/pmt",
  inputs: [
    { key: "numDynodes", label: "Number of dynodes", unit: "", toSI: 1, siUnit: "", default: 10, min: 4, max: 14 },
    { key: "secondaryEmission", label: "Secondary emission ratio δ", unit: "", toSI: 1, siUnit: "", default: 3.5, min: 1.5, max: 6 },
    { key: "qe", label: "Photocathode quantum efficiency", unit: "", toSI: 1, siUnit: "", default: 0.25, min: 0.01, max: 0.5 },
    { key: "darkCurrent", label: "Anode dark current", unit: "nA", toSI: 1e-9, siUnit: "A", default: 1, min: 0, max: 1e4 },
    { key: "photonRate", label: "Photon rate", unit: "photons/s", toSI: 1, siUnit: "1/s", default: 1e6, min: 0, max: 1e12 },
    { key: "bandwidth", label: "Bandwidth", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 100, min: 1, max: 1e4 },
  ],
  outputs: [
    { key: "gain", label: "Gain δⁿ", unit: "", toSI: 1, siUnit: "" },
    { key: "signalCurrent", label: "Signal current", unit: "A", toSI: 1, siUnit: "A" },
    { key: "photoelectronRate", label: "Photoelectrons per second", unit: "1/s", toSI: 1, siUnit: "1/s" },
    { key: "excessNoise", label: "Excess noise factor F", unit: "", toSI: 1, siUnit: "" },
    { key: "darkElectrons", label: "Dark electrons per second at the cathode", unit: "1/s", toSI: 1, siUnit: "1/s" },
    { key: "snr", label: "SNR", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ numDynodes, secondaryEmission, qe, darkCurrent, photonRate, bandwidth }) {
    const r = pmtSummary({ numDynodes, delta: secondaryEmission, quantumEff: qe, darkCurrent, photonRate, bandwidth });
    return {
      values: {
        gain: r.gain, signalCurrent: r.signalCurrent, photoelectronRate: r.signalElectrons, excessNoise: r.excessNoise,
        darkElectrons: r.darkElectrons, snr: r.snr,
      },
      reasons: { snr: "There are no signal or dark electrons: the photon rate and the anode dark current are both zero, so the SNR is undefined." },
    };
  },
  checks: [
    {
      // Defaults: n = 10, δ = 3.5, QE 0.25, I_d = 1 nA, Φ = 1e6 /s, B = 100 MHz. G = 3.5^10 = 275854.7353515625; F = 1 + Σ_{k=1}^{10} 3.5^(−k) = 1.3999985500;
      // R_s = 2.5e5 /s; I = R_s·e·G = 1.1049200e-8 A; R_d = I_d/(e·G) = 1e-9/(1.602176634e-19·275854.74) = 22626.072 /s;
      // SNR = 2.5e5/√(2·1e8·(250000 + 22626.072)·1.39999855) = 0.028613931.
      source: HAMAMATSU,
      basis: "computed",
      inputs: {},
      expect: {
        gain: 275854.7353515625, signalCurrent: 1.104920028396318e-8, photoelectronRate: 250000, excessNoise: 1.3999985499614516,
        darkElectrons: 22626.07189434789, snr: 0.02861393095340976,
      },
      tolerance: 1e-8,
    },
    {
      // n = 8, δ = 4, QE 0.3, I_d = 0.5 nA, Φ = 5e7 /s, B = 10 MHz. G = 4^8 = 65536; F = 1 + Σ_{k=1}^{8} 4^(−k) = 1.33332825; R_s = 1.5e7 /s;
      // I = 1.5e7·e·65536 = 1.5750037e-7 A; R_d = 0.5e-9/(e·65536) = 47618.935 /s; SNR = 1.5e7/√(2·1e7·(1.5e7 + 47618.935)·1.33332825) = 0.74881378.
      source: HAMAMATSU,
      basis: "computed",
      inputs: { numDynodes: 8, secondaryEmission: 4, qe: 0.3, darkCurrent: 0.5, photonRate: 5e7, bandwidth: 10 },
      expect: {
        gain: 65536, signalCurrent: 1.57500371828736e-7, photoelectronRate: 15000000, excessNoise: 1.3333282470703125,
        darkElectrons: 47618.935199438194, snr: 0.7488137818462888,
      },
      tolerance: 1e-8,
    },
  ],
});
