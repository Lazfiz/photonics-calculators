import { absorbanceFromTransmittance, attenuationDb, transmittance } from "../../physics/spectroscopy/lambert-beer-law";
import { defineSchema } from "../types";

const GOLD_BOOK = "IUPAC Compendium of Chemical Terminology (Gold Book), entries “absorbance” and “transmittance”: " +
  "A = −log10 T; attenuation 10 log10(1/T) = 10 A dB.";

export default defineSchema({
  href: "/spectroscopy/optical-density",
  choices: [
    {
      key: "mode",
      label: "Input",
      options: [
        { value: "abs", label: "Optical density given" },
        { value: "trans", label: "Transmission given" },
      ],
      default: "abs",
    },
  ],
  inputs: [
    { key: "transmission", label: "Transmission (used when mode = trans)", unit: "%", toSI: 0.01, siUnit: "", default: 1, min: 1e-6, max: 100 },
    { key: "absorbance", label: "Optical density OD (used when mode = abs)", unit: "", toSI: 1, siUnit: "", default: 2, min: 0, max: 8 },
  ],
  outputs: [
    { key: "od", label: "Optical density OD = −log10 T", unit: "", toSI: 1, siUnit: "" },
    { key: "transmission", label: "Transmission", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "attenuationDb", label: "Attenuation 10 · OD", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "filterFactor", label: "Filter factor 1/T", unit: "", toSI: 1, siUnit: "" },
    { key: "stops", label: "Photographic stops log2(1/T)", unit: "stops", toSI: 1, siUnit: "stops" },
  ],
  compute({ mode, transmission, absorbance }) {
    const od = mode === "trans" ? absorbanceFromTransmittance(transmission) : absorbance;
    const T = mode === "trans" ? transmission : transmittance(absorbance);
    return {
      values: {
        od,
        transmission: T,
        attenuationDb: attenuationDb(od),
        filterFactor: 1 / T,
        stops: od * Math.log2(10),
      },
    };
  },
  checks: [
    {
      // OD 2: T = 10^−2 = 1 %, 10 · 2 = 20 dB, 1/T = 100.
      source: GOLD_BOOK,
      basis: "computed",
      inputs: { mode: "abs", absorbance: 2 },
      expect: { transmission: 1, attenuationDb: 20, filterFactor: 100 },
      tolerance: 1e-8,
    },
    {
      // T = 50 %: OD = −log10 0.5 = 0.30102999566, 10 · OD = 3.0102999566 dB; 1/T = 2 is exactly one stop.
      source: GOLD_BOOK,
      basis: "computed",
      inputs: { mode: "trans", transmission: 50 },
      expect: { od: 0.30102999566, attenuationDb: 3.0102999566, stops: 1 },
      tolerance: 1e-8,
    },
  ],
});
