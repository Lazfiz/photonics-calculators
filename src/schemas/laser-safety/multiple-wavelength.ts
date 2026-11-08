import { multipleWavelengthExposure } from "../../physics/laser-safety/multiple-wavelength";
import { defineSchema } from "../types";
import { EXPOSURE, ICNIRP_2013 } from "./common";

const RULE = `${ICNIRP_2013}. p. 279 (multiple wavelengths) with Tables 3, 5 and 8. https://doi.org/10.1097/HP.0b013e3182983fd4`;

const parseList = (s: string) =>
  s.split(/[,;\s]+/).filter((x) => x.trim() !== "").map(Number);

// The page takes two free-text lists (nm, mW). A schema holds numbers and choices only, so the lists are named
// presets: the page's default and a few common sets. A wavelength preset and a power preset of different length are
// refused by `validate`.
const WAVELENGTH_SETS = ["450, 520, 638, 1550", "450, 520, 638", "532, 1064", "405, 532, 808, 1064", "532", "1550"] as const;
const POWER_SETS = ["0.4, 0.4, 0.4, 10", "0.4, 0.4, 0.4", "1, 1", "1, 1, 1, 1", "1"] as const;

export default defineSchema({
  href: "/laser-safety/multiple-wavelength",
  inputs: [
    { key: "beamDia", label: "Beam diameter at the eye, 1/e² (shared by every line)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.01, max: 1e4 },
    { ...EXPOSURE, key: "exposure", default: 0.25, min: 1e-9 },
  ],
  choices: [
    { key: "wavelengths", label: "Wavelengths (nm) of the lines", options: WAVELENGTH_SETS.map((v) => ({ value: v, label: v })), default: WAVELENGTH_SETS[0] },
    { key: "powers", label: "Powers (mW), one per wavelength in the same order", options: POWER_SETS.map((v) => ({ value: v, label: v })), default: POWER_SETS[0] },
  ],
  outputs: [
    { key: "retina", label: "Retina: sum of the lines' shares of the limits", unit: "", toSI: 1, siUnit: "" },
    { key: "anteriorEye", label: "Anterior eye (cornea and lens): sum of the lines' shares", unit: "", toSI: 1, siUnit: "" },
    { key: "ratio", label: "Largest site sum: attenuate every line by at least this factor when above 1", unit: "", toSI: 1, siUnit: "" },
  ],
  validate({ wavelengths, powers }) {
    const n = parseList(wavelengths).length;
    const m = parseList(powers).length;
    return n === m ? undefined : `${n} wavelengths but ${m} powers: give one power per wavelength.`;
  },
  compute({ wavelengths, powers, beamDia, exposure }) {
    const wls = parseList(wavelengths);
    const pws = parseList(powers);
    const r = multipleWavelengthExposure(wls.map((nm, i) => ({ lambda: nm * 1e-9, P: pws[i] * 1e-3 })), beamDia, exposure);
    if (Number.isNaN(r.ratio)) {
      return { values: { retina: NaN, anteriorEye: NaN, ratio: NaN }, warnings: ["A wavelength lies outside 180 nm – 1 mm or a power is negative."] };
    }
    return { values: { retina: r.sites.retina, anteriorEye: r.sites.anteriorEye, ratio: r.ratio } };
  },
  checks: [
    {
      // One line, 532 nm, 1 mW, 7 mm beam, 0.25 s: P_max = 18 t^0.75 / t × A / (1 − e^(−2)) with 18·0.25^0.75/0.25 =
      // 25.45584412 W/m² and A = 3.848451001e-5 m²: the share is 1e-3 × 0.8646647168 / 9.796557e-4 = 0.8826210346.
      // No anterior-eye limit at 532 nm.
      source: RULE,
      basis: "computed",
      inputs: { wavelengths: "532", powers: "1", beamDia: 7, exposure: 0.25 },
      expect: { retina: 0.8826210346, ratio: 0.8826210346 },
      tolerance: 1e-8,
    },
    {
      // One line, 1550 nm, 1 mW, 7 mm beam, 100 s: corneal limit 1000 W/m² over 3.5 mm: P_ap = 1000 × π(1.75 mm)² =
      // 9.621127502 mW; the beam puts 1 − e^(−2(1.75/3.5)²) = 1 − e^(−0.5) = 0.3934693403 inside: share
      // 1 × 0.3934693403 / 9.621127502 = 0.04089638561. No retinal limit at 1550 nm.
      source: RULE,
      basis: "computed",
      inputs: { wavelengths: "1550", powers: "1", beamDia: 7, exposure: 100 },
      expect: { anteriorEye: 0.04089638561, ratio: 0.04089638561 },
      tolerance: 1e-8,
    },
  ],
});
