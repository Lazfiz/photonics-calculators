import { MARCUSE_MIN_V, SPECIALTY_FIBERS, specialtySummary, type SpecialtyFiberId } from "../../physics/fiber-optics/specialty-fiber";
import { defineSchema } from "../types";

const GLOGE = "Gloge D. (1971). Weakly guiding fibers. Appl. Opt. 10(10), 2252–2258, doi:10.1364/AO.10.002252: V = 2π a NA/λ and the " +
  "LP11 cut-off V = 2.405; Marcuse D. (1977). Loss analysis of single-mode fiber splices. Bell Syst. Tech. J. 56(5), 703–718, " +
  "doi:10.1002/j.1538-7305.1977.tb00534.x: Gaussian mode radius w = a(0.65 + 1.619 V^−3/2 + 2.879 V^−6). Fibre figures are the manufacturer " +
  "data-sheet values listed on the page (core diameter, NA, attenuation).";
const IDS = Object.keys(SPECIALTY_FIBERS) as SpecialtyFiberId[];

export default defineSchema({
  href: "/fiber-optics/specialty-fiber",
  inputs: [
    { key: "length", label: "Length", unit: "m", toSI: 1, siUnit: "m", default: 10, min: 0.001, max: 100000 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 300, max: 7000 },
  ],
  choices: [
    { key: "fiber", label: "Fibre", options: IDS.map((k) => ({ value: k, label: SPECIALTY_FIBERS[k].label })), default: "pm" },
  ],
  outputs: [
    { key: "vNumber", label: "V-number at λ", unit: "", toSI: 1, siUnit: "" },
    { key: "cutoffSheet", label: "Second-mode cut-off (data sheet)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "cutoffModel", label: "Step-index cut-off 2πa·NA/2.405", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "mfdSheet", label: "Mode-field diameter (data sheet)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "mfdModel", label: "Marcuse mode-field diameter at λ", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "mfdAtSheetLambda", label: "Marcuse mode-field diameter at the sheet wavelength", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "lossFigure", label: "Data-sheet loss figure", unit: "dB/m", toSI: 1, siUnit: "dB/m" },
    { key: "lossDb", label: "Loss over the length", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ fiber, length, wavelength }) {
    const spec = SPECIALTY_FIBERS[fiber as SpecialtyFiberId];
    const r = specialtySummary(spec, wavelength, length);
    const nm = (m: number) => (m * 1e9).toFixed(0);
    const warnings: string[] = [];
    if (!r.transmits) {
      warnings.push(`${nm(wavelength)} nm is outside the transmission window of ${spec.glass} (${nm(spec.transmission[0])}–${nm(spec.transmission[1])} nm): the fibre is opaque there.`);
    }
    if (spec.band && r.inBand === false) {
      warnings.push(`${nm(wavelength)} nm is outside the data-sheet operating range (${nm(spec.band[0])}–${nm(spec.band[1])} nm).`);
    }
    const reasons: Record<string, string> = {};
    if (!Number.isFinite(r.mfdModel)) reasons.mfdModel = `V < ${MARCUSE_MIN_V}: Marcuse's fit is not valid below that V, so no mode-field diameter is given.`;
    if (!Number.isFinite(spec.mfd.value)) {
      reasons.mfdSheet = `The data sheet of ${spec.product} states no mode-field diameter.`;
      reasons.mfdAtSheetLambda = reasons.mfdSheet;
    }
    return {
      values: {
        vNumber: r.V, cutoffSheet: spec.cutoff, cutoffModel: r.cutoffModel, mfdSheet: spec.mfd.value,
        mfdModel: r.mfdModel, mfdAtSheetLambda: r.mfdAtSheetLambda, lossFigure: r.lossDbPerM, lossDb: r.lossDb,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // PM1550-XP: a = 4.25 µm, NA = 0.125, λ = 1550 nm. V = 2π·4.25e-6·0.125/1.55e-6 = 2.153511; cut-off 2π·4.25e-6·0.125/2.404826 = 1388.018 nm;
      // w = a(0.65 + 1.619 V^−1.5 + 2.879 V^−6) = 5.062457 µm, MFD 10.124914 µm; loss 1.0e-3 dB/m · 10 m = 0.01 dB.
      source: GLOGE,
      basis: "computed",
      inputs: { fiber: "pm", length: 10, wavelength: 1550 },
      expect: { vNumber: 2.1535110931865518, cutoffModel: 1388.0184297598137, mfdModel: 10.124913673939492, lossDb: 0.01 },
      tolerance: 1e-8,
    },
    {
      // ZBLAN IRZS23: a = 4.5 µm, NA = 0.19, λ = 2500 nm: V = 2π·4.5e-6·0.19/2.5e-6 = 2.148849; w-fit MFD = 10.738908 µm; 0.03 dB/m · 10 m = 0.3 dB.
      source: GLOGE,
      basis: "computed",
      inputs: { fiber: "zblan", length: 10, wavelength: 2500 },
      expect: { vNumber: 2.148849375055418, mfdModel: 10.738908483947872, lossDb: 0.3 },
      tolerance: 1e-8,
    },
  ],
});
