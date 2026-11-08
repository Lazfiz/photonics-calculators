import {
  JONES_CALCULUS_ELEMENTS, JONES_CALCULUS_INPUTS, intensity, jonesCalculusMatrix, propagate, stokesFromJones,
  type JonesCalculusElementType, type JonesCalculusInputKey,
} from "../../physics/polarization/jones";
import { ellipseAngles } from "../../physics/polarization/stokes";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const GOLDSTEIN = "Goldstein D. H. (2011). Polarized Light, 3rd ed., ch. The Jones Matrix Formalism, pp. 201–231 (ideal " +
  "polarizers, retarders, rotators; RCP = [1, i]/√2). CRC Press. https://doi.org/10.1201/b10436";
const JONES = "Jones R. C. (1941). A new calculus for the treatment of optical systems I. Description and " +
  "discussion of the calculus. J. Opt. Soc. Am. 31, 488–493. https://doi.org/10.1364/JOSA.31.000488";

const SLOTS = [1, 2, 3, 4, 5, 6] as const;
const elementOptions = [
  { value: "none", label: "None (slot unused)" },
  ...JONES_CALCULUS_ELEMENTS.map((e) => ({ value: e.type, label: e.label })),
];

export default defineSchema({
  href: "/polarization/jones-calculus",
  inputs: SLOTS.map((n) => ({
    key: `angle${n}` as const, label: `Rotation angle of element ${n} (used by a rotator)`,
    unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: -180, max: 180,
  })),
  choices: [
    {
      key: "input", label: "Input state (unit intensity)", default: "linear-h",
      options: (Object.keys(JONES_CALCULUS_INPUTS) as JonesCalculusInputKey[]).map((k) => ({
        value: k, label: JONES_CALCULUS_INPUTS[k].label,
      })),
    },
    ...SLOTS.map((n) => ({ key: `element${n}` as const, label: `Element ${n} (element 1 acts first)`, options: elementOptions, default: "none" })),
  ],
  outputs: [
    { key: "outputIntensity", label: "Output intensity |E_out|² (input = 1)", unit: "", toSI: 1, siUnit: "" },
    { key: "transmission", label: "Transmission", unit: "", toSI: 1, siUnit: "" },
    { key: "psi", label: "Output orientation angle ψ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "chi", label: "Output ellipticity angle χ", unit: "°", toSI: DEG, siUnit: "rad" },
  ],
  compute(si) {
    const angles = [si.angle1, si.angle2, si.angle3, si.angle4, si.angle5, si.angle6];
    const types = [si.element1, si.element2, si.element3, si.element4, si.element5, si.element6];
    const matrices = types.flatMap((t, i) => (t === "none"
      ? [] : [jonesCalculusMatrix(t as JonesCalculusElementType, angles[i] / DEG)]));
    const input = JONES_CALCULUS_INPUTS[si.input as JonesCalculusInputKey].jones;
    const fields = propagate(matrices, input);
    const out = fields[fields.length - 1];
    const inI = intensity(input);
    const outI = intensity(out);
    const warnings: string[] = [];
    let psi = NaN, chi = NaN;
    if (outI < 1e-12) warnings.push("No light transmitted: the output has no polarization state.");
    else {
      ({ psi, chi } = ellipseAngles(stokesFromJones(out)));
      if (Number.isNaN(psi)) warnings.push("Circular light has no orientation angle.");
    }
    return { values: { outputIntensity: outI, transmission: inI > 0 ? outI / inI : 0, psi, chi }, warnings };
  },
  checks: [
    {
      // Malus: H light through a 45° polarizer keeps cos²45° = 1/2 of the intensity, polarized at ψ = 45°.
      source: GOLDSTEIN, basis: "computed",
      inputs: { input: "linear-h", element1: "polarizer-45" },
      expect: { transmission: 0.5, psi: 45 },
      tolerance: 1e-8,
    },
    {
      // diag(1, −i) · [1, 1]/√2 = [1, −i]/√2 = LCP: χ = −45°, no loss.
      source: GOLDSTEIN, basis: "computed",
      inputs: { input: "linear-45", element1: "qwp-fast-h" },
      expect: { transmission: 1, chi: -45 },
      tolerance: 1e-8,
    },
    {
      // A rotator by +45° turns H into the linear state at +45° (Jones 1941; Goldstein sign convention).
      source: JONES, basis: "computed",
      inputs: { input: "linear-h", element1: "rotator", angle1: 45 },
      expect: { transmission: 1, psi: 45 },
      tolerance: 1e-8,
    },
  ],
});
