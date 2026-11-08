import {
  analyzerIntensity, degreeOfCircularPolarization, degreeOfLinearPolarization, degreeOfPolarization, ellipseAngles,
  isPhysicalStokes, polarizedIntensity, type Stokes,
} from "../../physics/polarization/stokes";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const GOLDSTEIN = "Goldstein D. H. (2011). Polarized Light, 3rd ed., chs. Stokes Polarization Parameters (pp. 59–91) " +
  "and Mueller Matrices for Polarizing Components, pp. 93–115 (ideal linear analyzer: I = ½(S₀ + S₁ cos 2θ + S₂ sin 2θ)). CRC Press. " +
  "https://doi.org/10.1201/b10436";

export default defineSchema({
  href: "/polarization/polarimetry",
  inputs: [
    { key: "s0", label: "S₀ (total intensity)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.001, max: 1000 },
    { key: "s1", label: "S₁ (H − V)", unit: "", toSI: 1, siUnit: "", default: 0.5, min: -1000, max: 1000 },
    { key: "s2", label: "S₂ (+45° − −45°)", unit: "", toSI: 1, siUnit: "", default: 0.3, min: -1000, max: 1000 },
    { key: "s3", label: "S₃ (RCP − LCP)", unit: "", toSI: 1, siUnit: "", default: 0.2, min: -1000, max: 1000 },
    { key: "analyzerAngleDeg", label: "Analyzer angle", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: -180, max: 180 },
  ],
  outputs: [
    { key: "transmitted", label: "Intensity behind the linear analyzer", unit: "", toSI: 1, siUnit: "" },
    { key: "dop", label: "Degree of polarization", unit: "", toSI: 1, siUnit: "" },
    { key: "dolp", label: "Degree of linear polarization", unit: "", toSI: 1, siUnit: "" },
    { key: "docp", label: "Degree of circular polarization (+ = right-handed)", unit: "", toSI: 1, siUnit: "" },
    { key: "psi", label: "Orientation angle ψ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "chi", label: "Ellipticity angle χ", unit: "°", toSI: DEG, siUnit: "rad" },
  ],
  validate({ s0, s1, s2, s3 }) {
    const S: Stokes = [s0, s1, s2, s3];
    if (isPhysicalStokes(S)) return undefined;
    return `Not a physical Stokes vector: √(S₁² + S₂² + S₃²) = ${polarizedIntensity(S).toFixed(4)} exceeds S₀ = ${s0.toFixed(4)}.`;
  },
  compute({ s0, s1, s2, s3, analyzerAngleDeg }) {
    const S: Stokes = [s0, s1, s2, s3];
    const { psi, chi } = ellipseAngles(S);
    const warnings: string[] = [];
    if (Number.isNaN(chi)) warnings.push("Unpolarized light has no polarization ellipse.");
    else if (Number.isNaN(psi)) warnings.push("Circular light has no orientation angle.");
    return {
      values: {
        // The analyzer angle arrives in radians (SI).
        transmitted: analyzerIntensity(S, analyzerAngleDeg),
        dop: degreeOfPolarization(S),
        dolp: degreeOfLinearPolarization(S),
        docp: degreeOfCircularPolarization(S),
        psi,
        chi,
      },
      warnings,
    };
  },
  checks: [
    {
      // (1, 0.5, 0.3, 0.2), analyzer 0°: ½(1 + 0.5) = 0.75; DOP √0.38 = 0.6164414003.
      source: GOLDSTEIN, basis: "computed",
      inputs: { s0: 1, s1: 0.5, s2: 0.3, s3: 0.2, analyzerAngleDeg: 0 },
      expect: { transmitted: 0.75, dop: 0.6164414003 },
      tolerance: 1e-8,
    },
    {
      // Analyzer 45°: cos 90° = 0, sin 90° = 1, so ½(1 + 0.3) = 0.65.
      source: GOLDSTEIN, basis: "computed",
      inputs: { s0: 1, s1: 0.5, s2: 0.3, s3: 0.2, analyzerAngleDeg: 45 },
      expect: { transmitted: 0.65 },
      tolerance: 1e-8,
    },
  ],
});
