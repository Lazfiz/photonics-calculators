import { JONES_CHAIN_ELEMENTS, JONES_CHAIN_INPUTS, intensity, propagate, stokesFromJones } from "../../physics/polarization/jones";
import { axisRatio, ellipseAngles } from "../../physics/polarization/stokes";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const GOLDSTEIN = "Goldstein D. H. (2011). Polarized Light, 3rd ed., ch. The Jones Matrix Formalism, pp. 201–231 (ideal " +
  "polarizers and retarders; RCP = [1, i]/√2). CRC Press. https://doi.org/10.1201/b10436";

const SLOTS = [1, 2, 3, 4, 5, 6] as const;
const elementOptions = [
  { value: "none", label: "None (slot unused)" },
  ...Object.entries(JONES_CHAIN_ELEMENTS).map(([value, e]) => ({ value, label: e.label })),
];

export default defineSchema({
  href: "/polarization/jones-chain",
  inputs: [],
  choices: [
    {
      key: "input", label: "Input polarization (unit intensity)", default: "h",
      options: Object.entries(JONES_CHAIN_INPUTS).map(([value, e]) => ({ value, label: e.label })),
    },
    ...SLOTS.map((n) => ({
      key: `element${n}`, label: `Element ${n} (element 1 acts first)`, options: elementOptions,
      default: n === 1 ? "qwp-fast-h" : "none",
    })),
  ],
  outputs: [
    { key: "transmission", label: "Transmission (output / input intensity)", unit: "", toSI: 1, siUnit: "" },
    { key: "psi", label: "Output orientation angle ψ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "chi", label: "Output ellipticity angle χ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "axisRatio", label: "Output axis ratio b/a = |tan χ|", unit: "", toSI: 1, siUnit: "" },
  ],
  compute(si) {
    const names = [si.element1, si.element2, si.element3, si.element4, si.element5, si.element6];
    const matrices = names.filter((n) => n !== "none").map((n) => JONES_CHAIN_ELEMENTS[n].matrix);
    const input = JONES_CHAIN_INPUTS[si.input].jones;
    const states = propagate(matrices, input);
    const out = states[states.length - 1];
    const outI = intensity(out);
    const warnings: string[] = [];
    let psi = NaN, chi = NaN, ratio = NaN;
    if (outI < 1e-12) warnings.push("No light transmitted: the output has no polarization state.");
    else {
      const S = stokesFromJones(out);
      ({ psi, chi } = ellipseAngles(S));
      ratio = axisRatio(S);
      if (Number.isNaN(psi)) warnings.push("Circular light has no orientation angle.");
    }
    return { values: { transmission: outI / intensity(input), psi, chi, axisRatio: ratio }, warnings };
  },
  checks: [
    {
      // Malus: H light through a 45° polarizer: transmission cos²45° = 1/2, ψ = 45°.
      source: GOLDSTEIN, basis: "computed",
      inputs: { input: "h", element1: "polarizer-45" },
      expect: { transmission: 0.5, psi: 45 },
      tolerance: 1e-8,
    },
    {
      // diag(1, −i) · [1, 1]/√2 = [1, −i]/√2 = LCP: χ = −45°, b/a = 1, lossless.
      source: GOLDSTEIN, basis: "computed",
      inputs: { input: "linear-45", element1: "qwp-fast-h" },
      expect: { transmission: 1, chi: -45, axisRatio: 1 },
      tolerance: 1e-8,
    },
    {
      // A half-wave plate with its fast axis at 45° turns H into V (ψ = 90°), lossless.
      source: GOLDSTEIN, basis: "computed",
      inputs: { input: "h", element1: "hwp-fast-45" },
      expect: { transmission: 1, psi: 90 },
      tolerance: 1e-8,
    },
  ],
});
