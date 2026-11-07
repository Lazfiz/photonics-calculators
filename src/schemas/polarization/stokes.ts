import {
  axisRatio, degreeOfCircularPolarization, degreeOfLinearPolarization, degreeOfPolarization, ellipseAngles,
  isPhysicalStokes, polarizedIntensity, type Stokes,
} from "../../physics/polarization/stokes";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const GOLDSTEIN = "Goldstein D. H. (2011). Polarized Light, 3rd ed., chs. The Polarization Ellipse, pp. 49–58, and " +
  "Stokes Polarization Parameters, pp. 59–91 (ψ = ½ atan2(S₂, S₁), χ = ½ asin(S₃/I_p)). CRC Press. " +
  "https://doi.org/10.1201/b10436";

export default defineSchema({
  href: "/polarization/stokes",
  inputs: [
    { key: "I", label: "S₀ = I (intensity)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.1, max: 2 },
    { key: "Q", label: "S₁ = Q", unit: "", toSI: 1, siUnit: "", default: 0.5, min: -1, max: 1 },
    { key: "U", label: "S₂ = U", unit: "", toSI: 1, siUnit: "", default: 0.3, min: -1, max: 1 },
    { key: "V", label: "S₃ = V (> 0 right-handed, Goldstein)", unit: "", toSI: 1, siUnit: "", default: 0.2, min: -1, max: 1 },
  ],
  outputs: [
    { key: "dop", label: "Degree of polarization √(Q² + U² + V²)/I", unit: "", toSI: 1, siUnit: "" },
    { key: "dolp", label: "Degree of linear polarization √(Q² + U²)/I", unit: "", toSI: 1, siUnit: "" },
    { key: "docp", label: "Degree of circular polarization V/I (+ = right-handed)", unit: "", toSI: 1, siUnit: "" },
    { key: "psi", label: "Orientation angle ψ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "chi", label: "Ellipticity angle χ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "axisRatio", label: "Axis ratio b/a = |tan χ|", unit: "", toSI: 1, siUnit: "" },
  ],
  validate({ I, Q, U, V }) {
    const S: Stokes = [I, Q, U, V];
    if (isPhysicalStokes(S)) return undefined;
    return `Not a physical Stokes vector: √(Q² + U² + V²) = ${polarizedIntensity(S).toFixed(4)} exceeds I = ${I}.`;
  },
  compute({ I, Q, U, V }) {
    const S: Stokes = [I, Q, U, V];
    const { psi, chi } = ellipseAngles(S);
    const warnings: string[] = [];
    if (Number.isNaN(chi)) warnings.push("Unpolarized light has no polarization ellipse.");
    else if (Number.isNaN(psi)) warnings.push("Circular light has no orientation angle.");
    return {
      values: {
        dop: degreeOfPolarization(S),
        dolp: degreeOfLinearPolarization(S),
        docp: degreeOfCircularPolarization(S),
        psi,
        chi,
        axisRatio: axisRatio(S),
      },
      warnings,
    };
  },
  checks: [
    {
      // (1, 0.5, 0.3, 0.2): DOP √0.38, DOLP √0.34, ψ = ½ atan(0.6) = 15.48188°, χ = ½ asin(0.2/√0.38) = 9.46591°.
      source: GOLDSTEIN,
      basis: "computed",
      inputs: { I: 1, Q: 0.5, U: 0.3, V: 0.2 },
      expect: { dop: 0.6164414003, dolp: 0.5830951895, psi: 15.48188, chi: 9.46591 },
      tolerance: 1e-6,
    },
    {
      // (1, 0.8, 0.3, 0.2): ψ = ½ atan(0.375) = 10.27802°, χ = ½ asin(0.2/√0.77) = 6.58736°.
      source: GOLDSTEIN,
      basis: "computed",
      inputs: { I: 1, Q: 0.8, U: 0.3, V: 0.2 },
      expect: { psi: 10.27802, chi: 6.58736 },
      tolerance: 1e-6,
    },
  ],
});
