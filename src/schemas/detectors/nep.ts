import { nepSummary } from "../../physics/detectors/nep";
import { defineSchema } from "../types";

const DERENIAK = "Dereniak E. L., Boreman G. D. (1996). Infrared Detectors and Systems. Wiley, ch. 5: NEP = i_n/ℛ, D* = √(A·B)/NEP; " +
  "i_shot = √(2q·I_d·B) (Schottky W. (1918), Ann. Phys. 362, 541–567, doi:10.1002/andp.19183622304), " +
  "i_th = √(4k_BT·B/R_L) (Nyquist H. (1928), Phys. Rev. 32, 110, doi:10.1103/PhysRev.32.110), added in quadrature.";
const NOISE_FREE = "With T = 0 and I_d = 0 there is no noise current, so the NEP is undefined.";

export default defineSchema({
  href: "/detectors/nep",
  inputs: [
    { key: "darkCurrent", label: "Dark current", unit: "nA", toSI: 1e-9, siUnit: "A", default: 10, min: 0, max: 1e9 },
    { key: "responsivity", label: "Responsivity", unit: "A/W", toSI: 1, siUnit: "A/W", default: 0.8, min: 1e-6, max: 100 },
    { key: "bandwidth", label: "Bandwidth", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1, min: 1e-3, max: 1e12 },
    { key: "temperature", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 0, max: 1000 },
    { key: "loadResistor", label: "Load resistor", unit: "Ω", toSI: 1, siUnit: "Ω", default: 50, min: 1e-3, max: 1e15 },
    { key: "detectorArea", label: "Detector area", unit: "mm²", toSI: 1e-6, siUnit: "m²", default: 1, min: 1e-6, max: 1e6 },
  ],
  outputs: [
    { key: "nep", label: "NEP (total in the bandwidth B)", unit: "W", toSI: 1, siUnit: "W" },
    { key: "nepSpectral", label: "NEP (spectral)", unit: "W/√Hz", toSI: 1, siUnit: "W/√Hz" },
    { key: "detectivity", label: "D*", unit: "cm·Hz^½/W", toSI: 0.01, siUnit: "m·Hz^½/W" },
    { key: "noiseCurrent", label: "Noise current (rms)", unit: "A", toSI: 1, siUnit: "A" },
    { key: "shotNoise", label: "Dark-current shot noise", unit: "A", toSI: 1, siUnit: "A" },
    { key: "thermalNoise", label: "Load Johnson noise", unit: "A", toSI: 1, siUnit: "A" },
  ],
  compute({ darkCurrent, responsivity, bandwidth, temperature, loadResistor, detectorArea }) {
    const r = nepSummary({ darkCurrent, responsivity, bandwidth, temperature, loadResistor, area_cm2: detectorArea * 1e4 });
    const nan = r.noiseFree ? NaN : undefined; // the page shows "—" for the NEP without any noise
    return {
      values: {
        nep: nan ?? r.nep,
        nepSpectral: nan ?? r.nepSpectral,
        detectivity: nan ?? r.detectivity * 0.01,
        noiseCurrent: r.totalNoiseCurrent,
        shotNoise: r.iShot,
        thermalNoise: r.iThermal,
      },
      warnings: r.noiseFree ? [NOISE_FREE] : [],
      reasons: r.noiseFree ? { nep: NOISE_FREE, nepSpectral: NOISE_FREE, detectivity: NOISE_FREE } : {},
    };
  },
  checks: [
    {
      // Defaults: I_d = 10 nA, ℛ = 0.8 A/W, B = 1 Hz, T = 300 K, R_L = 50 Ω, A = 1 mm² = 0.01 cm².
      // i_shot = √(2q·1e-8·1) = 5.660701e-14 A; i_th = √(4k_B·300/50) = 1.820318e-11 A; i_n = hypot = 1.820327e-11 A;
      // NEP = i_n/0.8 = 2.275408e-11 W (= spectral NEP at B = 1 Hz); D* = √(0.01·1)/NEP = 4.394815e9 Jones.
      source: DERENIAK,
      basis: "computed",
      inputs: {},
      expect: {
        nep: 2.2754084947586468e-11, nepSpectral: 2.2754084947586468e-11, detectivity: 4394815270.767768,
        noiseCurrent: 1.8203267958069176e-11, shotNoise: 5.660700723408719e-14, thermalNoise: 1.820317994197717e-11,
      },
      tolerance: 1e-8,
    },
    {
      // I_d = 1 nA, ℛ = 0.5 A/W, B = 1 MHz, T = 77 K, R_L = 10 kΩ, A = 4 mm² = 0.04 cm².
      // i_shot = √(2q·1e-9·1e6) = 1.790071e-11 A; i_th = √(4k_B·77·1e6/1e4) = 6.521042e-10 A; i_n = 6.523499e-10 A;
      // NEP = i_n/0.5 = 1.304700e-9 W, spectral = NEP/√1e6 = 1.304700e-12 W/√Hz; D* = √(0.04·1e6)/NEP = 1.532920e11 Jones.
      source: DERENIAK,
      basis: "computed",
      inputs: { darkCurrent: 1, responsivity: 0.5, bandwidth: 1e6, temperature: 77, loadResistor: 1e4, detectorArea: 4 },
      expect: {
        nep: 1.3046997008151722e-9, nepSpectral: 1.3046997008151723e-12, detectivity: 153291979660.17822,
        noiseCurrent: 6.523498504075861e-10, shotNoise: 1.790070743853438e-11, thermalNoise: 6.521042033294986e-10,
      },
      tolerance: 1e-8,
    },
  ],
});
