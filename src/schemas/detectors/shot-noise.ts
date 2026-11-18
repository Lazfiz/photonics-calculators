import { shotNoiseSummary } from "../../physics/detectors/shot-noise";
import { defineSchema } from "../types";

const SCHOTTKY = "Schottky W. (1918). Über spontane Stromschwankungen in verschiedenen Elektrizitätsleitern. Ann. Phys. 362, 541–567, " +
  "doi:10.1002/andp.19183622304: shot-noise current density 2q·I, so i_shot = √(2qIB) in a bandwidth B; amplitude SNR I/i_shot = √(I/(2qB)), power SNR I/(2qB).";
const NO_CURRENT = "The photocurrent is zero: with no signal and no shot noise the SNR is undefined.";

export default defineSchema({
  href: "/detectors/shot-noise",
  inputs: [
    { key: "photocurrent", label: "Photocurrent", unit: "A", toSI: 1, siUnit: "A", default: 1e-6, min: 0, max: 10 },
    { key: "bandwidth", label: "Bandwidth", unit: "Hz", toSI: 1, siUnit: "Hz", default: 1e6, min: 1e-3, max: 1e12 },
  ],
  outputs: [
    { key: "iShot", label: "Shot noise current √(2qIB)", unit: "A", toSI: 1, siUnit: "A" },
    { key: "snrAmplitude", label: "SNR (amplitude)", unit: "", toSI: 1, siUnit: "" },
    { key: "snrPower", label: "SNR (power) I/(2qB)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ photocurrent, bandwidth }) {
    return {
      values: shotNoiseSummary(photocurrent, bandwidth),
      reasons: { snrAmplitude: NO_CURRENT, snrPower: NO_CURRENT },
    };
  },
  checks: [
    {
      // I = 1 µA, B = 1 MHz, q = 1.602176634e-19 C: i = √(2·1.602176634e-19·1e-6·1e6) = 5.6607007e-10 A; I/i = 1766.5657; (I/i)² = I/(2qB) = 3.1207545e6.
      source: SCHOTTKY,
      basis: "computed",
      inputs: {},
      expect: { iShot: 5.660700723408719e-10, snrAmplitude: 1766.5657466481064, snrPower: 3120754.5372303813 },
      tolerance: 1e-8,
    },
    {
      // I = 2 mA, B = 10 kHz: i = √(2q·2e-3·1e4) = 2.5315423e-9 A; I/i = 790032.22; I/(2qB) = 2e-3/(2·1.602176634e-19·1e4) = 6.2415091e11.
      source: SCHOTTKY,
      basis: "computed",
      inputs: { photocurrent: 2e-3, bandwidth: 1e4 },
      expect: { iShot: 2.5315423235648264e-9, snrAmplitude: 790032.2192455675, snrPower: 624150907446.0763 },
      tolerance: 1e-8,
    },
  ],
});
