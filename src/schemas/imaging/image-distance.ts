import { imageDistanceSummary } from "../../physics/imaging/image-distance";
import { defineSchema } from "../types";

const GREIVENKAMP = "Greivenkamp J. E. (2004). Field Guide to Geometrical Optics. SPIE Press, " +
  "Gaussian imaging equation and Newtonian equations (x·x′ = f² with x = o − f, x′ = i − f; Greivenkamp's directed form " +
  "zz′ = −f_E², z = −x). https://doi.org/10.1117/3.547461";

export default defineSchema({
  href: "/imaging/image-distance",
  inputs: [
    { key: "focalLengthMm", label: "Focal length f (negative for a diverging lens)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 50, min: -5000, max: 5000 },
    { key: "objectDistMm", label: "Object distance o (in front of the lens; used when solve = object)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 200, min: 0.1, max: 100000 },
    { key: "mag", label: "Magnification M (negative for an inverted image; used when solve = mag)", unit: "", toSI: 1, siUnit: "", default: -2, min: -1000, max: 1000 },
  ],
  choices: [
    {
      key: "solve",
      label: "Given",
      options: [
        { value: "object", label: "Object distance o: find the image" },
        { value: "mag", label: "Magnification M: find both conjugates" },
      ],
      default: "object",
    },
  ],
  outputs: [
    { key: "objectDistance", label: "Object distance o", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "imageDistance", label: "Image distance i", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "magnification", label: "Magnification M = −i/o", unit: "", toSI: 1, siUnit: "" },
    { key: "conjugateRatio", label: "Conjugate ratio |i/o|", unit: "", toSI: 1, siUnit: "" },
    { key: "objectToImage", label: "Object-to-image distance |o + i|", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "newtonX", label: "Newtonian x = o − f", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "newtonXPrime", label: "Newtonian x′ = i − f", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ focalLengthMm, objectDistMm, mag, solve }) {
    const s = imageDistanceSummary(focalLengthMm, solve, objectDistMm, mag);
    const warnings: string[] = [];
    if (s.problem) warnings.push(s.problem);
    const out = {
      objectDistance: s.o,
      imageDistance: s.i,
      magnification: s.M,
      conjugateRatio: s.conjugateRatio,
      objectToImage: s.objectToImage,
      newtonX: s.newtonX,
      newtonXPrime: s.newtonXPrime,
    };
    if (s.problem) {
      const nothing = { ...out, objectDistance: NaN, imageDistance: NaN, magnification: NaN, conjugateRatio: NaN, objectToImage: NaN, newtonX: NaN, newtonXPrime: NaN };
      return {
        values: nothing,
        warnings,
        reasons: {
          objectDistance: s.problem, imageDistance: s.problem, magnification: s.problem, conjugateRatio: s.problem,
          objectToImage: s.problem, newtonX: s.problem, newtonXPrime: s.problem,
        },
      };
    }
    return { values: out, warnings };
  },
  checks: [
    {
      // Object given, f = 50 mm, o = 200 mm: i = f·o/(o − f) = 10000/150 = 66.6666666667 mm; M = −i/o = −1/3;
      // |i/o| = 1/3; o + i = 266.6666666667 mm; x = o − f = 150 mm, x′ = i − f = 16.6666666667 mm (x·x′ = 2500 = f²).
      source: GREIVENKAMP,
      basis: "computed",
      inputs: { focalLengthMm: 50, solve: "object", objectDistMm: 200 },
      expect: {
        imageDistance: 66.66666666666667, magnification: -1 / 3, conjugateRatio: 1 / 3,
        objectToImage: 266.6666666666667, newtonX: 150, newtonXPrime: 16.666666666666668,
      },
      tolerance: 1e-8,
    },
    {
      // M given, f = 50 mm, M = −2: o = f(1 − 1/M) = 50 × 1.5 = 75 mm; i = f(1 − M) = 50 × 3 = 150 mm; |o + i| = 225 mm.
      source: GREIVENKAMP,
      basis: "computed",
      inputs: { focalLengthMm: 50, solve: "mag", mag: -2 },
      expect: { objectDistance: 75, imageDistance: 150, magnification: -2, objectToImage: 225 },
      tolerance: 1e-8,
    },
    {
      // Diverging lens f = −50 mm, o = 100 mm: i = (−50 × 100)/(100 + 50) = −33.3333333333 mm (virtual); M = −i/o = 1/3.
      source: GREIVENKAMP,
      basis: "computed",
      inputs: { focalLengthMm: -50, solve: "object", objectDistMm: 100 },
      expect: { imageDistance: -33.333333333333336, magnification: 1 / 3 },
      tolerance: 1e-8,
    },
    {
      // OpenStax Example 25.6: a bulb 0.750 m from a convex lens of 0.500 m focal length images at d_i = 1.50 m with
      // m = −1.50 m/0.750 m = −2.00 (the arithmetic is exact).
      source: "Urone P. P., Hinrichs R. et al. (2022). College Physics 2e, OpenStax, §25.6 Image Formation by Lenses, " +
        "Example 25.6. https://openstax.org/books/college-physics-2e/pages/25-6-image-formation-by-lenses",
      basis: "printed",
      inputs: { focalLengthMm: 500, solve: "object", objectDistMm: 750 },
      expect: { imageDistance: 1500, magnification: -2 },
      tolerance: 1e-8,
    },
  ],
});
