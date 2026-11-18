import { naFNumberSummary } from "../../physics/imaging/na-fnumber";
import { defineSchema } from "../types";

const BORN_WOLF = "Born M., Wolf E. (2019). Principles of Optics, 60th anniversary ed. Cambridge University Press, " +
  "ch. 4 (sine condition, NA = 1/(2N)) and §8.5.2 (Airy pattern, first zero j₁,₁ = 3.8317). https://doi.org/10.1017/9781108769914";

export default defineSchema({
  href: "/imaging/na-fnumber",
  inputs: [
    { key: "fNumber", label: "f/# (N)", unit: "", toSI: 1, siUnit: "", default: 2.8, min: 0.5, max: 100 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 20000 },
  ],
  outputs: [
    { key: "na", label: "Image-side NA = 1/(2N)", unit: "", toSI: 1, siUnit: "" },
    { key: "halfAngle", label: "Half-angle of the cone", unit: "°", toSI: Math.PI / 180, siUnit: "rad" },
    { key: "thinLensNa", label: "Thin-lens tangent form 1/√(1 + 4N²)", unit: "", toSI: 1, siUnit: "" },
    { key: "airyDiameter", label: "Airy disk diameter ≈ 2.44 λN", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ fNumber, wavelength }) {
    const s = naFNumberSummary(fNumber, wavelength);
    return {
      values: { na: s.na, halfAngle: s.halfAngle, thinLensNa: s.thinLensNa, airyDiameter: s.airyDiameter },
      warnings: [],
    };
  },
  checks: [
    {
      // N = 2.8, λ = 550 nm: NA = 1/5.6 = 0.178571429; half-angle asin(NA) = 10.286560611°;
      // thin-lens form 1/√(1 + 4·7.84) = 0.175790638; Airy diameter 2·(3.8317059702/(2π))·λ/NA = 3.756583265 µm.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { fNumber: 2.8, wavelength: 550 },
      expect: { na: 0.17857142857142858, halfAngle: 10.28656061147494, thinLensNa: 0.1757906384836575, airyDiameter: 3.7565832651008337 },
      tolerance: 1e-8,
    },
    {
      // N = 1, λ = 633 nm: NA = 0.5 (sine condition), half-angle 30°, thin-lens form 1/√5 = 0.447213595;
      // Airy diameter 2·(3.8317059702/(2π))·633 nm/0.5 = 1.544102082 µm.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { fNumber: 1, wavelength: 633 },
      expect: { na: 0.5, halfAngle: 30, thinLensNa: 0.4472135954999579, airyDiameter: 1.5441020823433946 },
      tolerance: 1e-8,
    },
  ],
});
