import { DEFAULT_ELEMENTS, abcdSummary, parseElements } from "../../physics/wave-optics/abcd";
import { defineSchema } from "../types";

// The page edits a free-form element list in the URL (`elements`, tokens d<mm> f<mm> m r<mm> n<n1>x<n2> joined by "_").
// The API offers a few named lists, which are such strings; any list can be tried on the page itself.
export default defineSchema({
  href: "/wave-optics/abcd-matrix",
  choices: [
    {
      key: "elements",
      label: "Element list (in the order the ray meets them)",
      options: [
        { value: DEFAULT_ELEMENTS, label: "Free space 150 mm, thin lens f = 100 mm, free space 300 mm (imaging)" },
        { value: "d200_f100_d200", label: "Free space 200 mm, thin lens f = 100 mm, free space 200 mm (2f–2f imaging)" },
        { value: "f100_d100", label: "Thin lens f = 100 mm, free space 100 mm (focusing)" },
        { value: "r200_d100", label: "Concave mirror R = 200 mm, free space 100 mm (focusing)" },
        { value: "n1x1.5", label: "Flat interface from n = 1 to n = 1.5" },
      ],
      default: DEFAULT_ELEMENTS,
    },
  ],
  inputs: [
    { key: "inputHeight", label: "Input ray height y", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: -1e6, max: 1e6 },
    { key: "inputAngle", label: "Input ray angle θ", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 0, min: -500, max: 500 },
  ],
  outputs: [
    { key: "A", label: "System matrix A", unit: "", toSI: 1, siUnit: "" },
    { key: "B", label: "System matrix B", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "C", label: "System matrix C", unit: "1/mm", toSI: 1e3, siUnit: "1/m" },
    { key: "D", label: "System matrix D", unit: "", toSI: 1, siUnit: "" },
    { key: "determinant", label: "Determinant AD − BC", unit: "", toSI: 1, siUnit: "" },
    { key: "expectedDeterminant", label: "Expected determinant n_in/n_out", unit: "", toSI: 1, siUnit: "" },
    { key: "outputHeight", label: "Output ray height", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "outputAngle", label: "Output ray angle", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "rearFocalLength", label: "Rear focal length f′ = −1/C", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "effectiveFocalLength", label: "Effective focal length f′/n_out", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ elements, inputHeight, inputAngle }) {
    const s = abcdSummary(parseElements(elements), inputHeight, inputAngle);
    const warnings: string[] = [];
    if (!s.valid) warnings.push("An element has f = 0 or R = 0, which has no ray matrix.");
    else {
      if (s.M.C === 0) warnings.push("C = 0: the system is afocal, so it has no focal length.");
      if (s.isImaging) warnings.push(`Imaging condition (B = 0): the magnification is A = ${s.M.A.toPrecision(4)}.`);
    }
    return {
      values: {
        A: s.M.A, B: s.M.B, C: s.M.C, D: s.M.D,
        determinant: s.det,
        expectedDeterminant: s.detExpected,
        outputHeight: s.ray.y,
        outputAngle: s.ray.theta,
        rearFocalLength: s.rearFocalLength,
        effectiveFocalLength: s.effectiveFocalLength,
      },
      warnings,
    };
  },
  checks: [
    {
      // M = S(300) L(100) S(150): A = 1 − 300/100 = −2, D = 1 − 150/100 = −0.5, C = −1/100 mm⁻¹, f′ = −1/C = 100 mm,
      // output height A·y₀ = −2 mm (B = 150 + 300 − 300·150/100 = 0 is the imaging condition).
      source: "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567, table I (free space and thin lens matrices).",
      basis: "computed",
      inputs: { elements: DEFAULT_ELEMENTS, inputHeight: 1, inputAngle: 0 },
      expect: { A: -2, D: -0.5, C: -0.01, rearFocalLength: 100, outputHeight: -2 },
      tolerance: 1e-8,
    },
    {
      // 2f–2f: A = 1 − 200/100 = −1, D = −1, C = −0.01 mm⁻¹; ray (y₀, θ₀) = (1 mm, 2 mrad): C y₀ = −0.01 rad = −10 mrad, D θ₀ = −2 mrad, so θ = −12 mrad.
      source: "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567, table I (free space and thin lens matrices).",
      basis: "computed",
      inputs: { elements: "d200_f100_d200", inputHeight: 1, inputAngle: 2 },
      expect: { A: -1, D: -1, outputAngle: -12 },
      tolerance: 1e-8,
    },
    {
      // Flat interface n₁ = 1 → n₂ = 1.5: D = n₁/n₂ (real angle), det = n_in/n_out = 1/1.5.
      source: "Gerrard A., Burch J. M. (1975). Introduction to Matrix Methods in Optics. Wiley (refraction at a plane surface; real-angle form, det M = n_in/n_out as in the page).",
      basis: "computed",
      inputs: { elements: "n1x1.5" },
      expect: { D: 1 / 1.5, determinant: 1 / 1.5 },
      tolerance: 1e-8,
    },
  ],
});
