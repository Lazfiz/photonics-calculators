import { retarderBandDopSweep } from "../../physics/polarization/mueller";
import {
  degreeOfPolarization, ellipseAngles, isPhysicalStokes, polarizedIntensity, type Stokes,
} from "../../physics/polarization/stokes";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const GOLDSTEIN = "Goldstein D. H. (2011). Polarized Light, 3rd ed., CRC Press, ch. Stokes Polarization Parameters, pp. 59–91 " +
  "(DoP = √(S₁² + S₂² + S₃²)/S₀, ψ = ½ atan2(S₂, S₁), χ = ½ asin(S₃/I_p)) and the Mueller matrix of a retarder. " +
  "https://doi.org/10.1201/b10436";

export default defineSchema({
  href: "/polarization/degree-polarization",
  inputs: [
    { key: "s0", label: "S₀ (total intensity)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.001, max: 10 },
    { key: "s1", label: "S₁ (H − V)", unit: "", toSI: 1, siUnit: "", default: 0.8, min: -10, max: 10 },
    { key: "s2", label: "S₂ (+45° − −45°)", unit: "", toSI: 1, siUnit: "", default: 0.3, min: -10, max: 10 },
    { key: "s3", label: "S₃ (RCP − LCP)", unit: "", toSI: 1, siUnit: "", default: 0.2, min: -10, max: 10 },
    { key: "centerWl", label: "Spectral analysis: centre wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 1, max: 100000 },
    { key: "bandwidth", label: "Spectral analysis: bandwidth, full width (≤ 1.9 × centre)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 100, min: 0, max: 190000 },
    { key: "retardance", label: "Spectral analysis: retardance at the centre", unit: "waves", toSI: 1, siUnit: "waves", default: 5, min: 0, max: 10000 },
  ],
  outputs: [
    { key: "dop", label: "Degree of polarization", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "polIntensity", label: "Polarized intensity √(S₁² + S₂² + S₃²)", unit: "", toSI: 1, siUnit: "" },
    { key: "unpolIntensity", label: "Unpolarized intensity S₀ − I_pol", unit: "", toSI: 1, siUnit: "" },
    { key: "orientation", label: "Orientation angle ψ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "ellipticityAngle", label: "Ellipticity angle χ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "ellipticity", label: "Ellipticity e = tan χ", unit: "", toSI: 1, siUnit: "" },
    { key: "s1norm", label: "S₁/S₀", unit: "", toSI: 1, siUnit: "" },
    { key: "s2norm", label: "S₂/S₀", unit: "", toSI: 1, siUnit: "" },
    { key: "s3norm", label: "S₃/S₀", unit: "", toSI: 1, siUnit: "" },
    { key: "bandDop", label: "Band-averaged DoP behind a retarder at 45°", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "bandS0", label: "Band-averaged output S₀", unit: "", toSI: 1, siUnit: "" },
    { key: "bandS1", label: "Band-averaged output S₁", unit: "", toSI: 1, siUnit: "" },
    { key: "bandS2", label: "Band-averaged output S₂", unit: "", toSI: 1, siUnit: "" },
    { key: "bandS3", label: "Band-averaged output S₃", unit: "", toSI: 1, siUnit: "" },
  ],
  validate({ s0, s1, s2, s3, centerWl, bandwidth }) {
    const S: Stokes = [s0, s1, s2, s3];
    if (!isPhysicalStokes(S)) {
      return `Not a physical Stokes vector: √(S₁² + S₂² + S₃²) = ${polarizedIntensity(S).toFixed(4)} exceeds S₀ = ${s0.toFixed(4)}.`;
    }
    if (bandwidth > 1.9 * centerWl) return "The bandwidth must not exceed 1.9 × the centre wavelength.";
    return undefined;
  },
  compute({ s0, s1, s2, s3, centerWl, bandwidth, retardance }) {
    const S: Stokes = [s0, s1, s2, s3];
    const pol = polarizedIntensity(S);
    const { psi, chi } = ellipseAngles(S);
    const sweep = retarderBandDopSweep(S, retardance, centerWl, bandwidth, Math.PI / 4);
    const warnings: string[] = [];
    if (Number.isNaN(chi)) warnings.push("Unpolarized light has no polarization ellipse angles.");
    else if (Number.isNaN(psi)) warnings.push("Circular light has no orientation angle.");
    if (Number.isNaN(sweep.avgDop)) {
      warnings.push("Too many retardance cycles across this band to average; lower the retardance or the bandwidth.");
    }
    return {
      values: {
        dop: degreeOfPolarization(S),
        polIntensity: pol,
        unpolIntensity: Math.max(0, s0 - pol),
        orientation: psi,
        ellipticityAngle: chi,
        ellipticity: Math.tan(chi),
        s1norm: s1 / s0,
        s2norm: s2 / s0,
        s3norm: s3 / s0,
        bandDop: sweep.avgDop,
        bandS0: sweep.avgS[0],
        bandS1: sweep.avgS[1],
        bandS2: sweep.avgS[2],
        bandS3: sweep.avgS[3],
      },
      warnings,
    };
  },
  checks: [
    {
      // (1, 0.8, 0.3, 0.2): I_pol = √0.77 = 0.8774964387, DoP = 87.74964387 %, ψ = ½ atan2(0.3, 0.8) = ½ · 20.556045° = 10.278023°,
      // χ = ½ asin(0.2/0.8774964387) = ½ · 13.17472° = 6.58736°.
      source: GOLDSTEIN,
      basis: "computed",
      inputs: { s0: 1, s1: 0.8, s2: 0.3, s3: 0.2 },
      expect: { dop: 87.74964387, polIntensity: 0.8774964387, unpolIntensity: 0.1225035613, orientation: 10.278023 },
      tolerance: 1e-6,
    },
    {
      // A half-wave retarder (0.5 wave, bandwidth 0) at 45° leaves S₂ and flips S₁ and S₃: (1, 0.8, 0.3, 0.2) → (1, −0.8, 0.3, −0.2); DoP unchanged.
      source: GOLDSTEIN,
      basis: "computed",
      inputs: { s0: 1, s1: 0.8, s2: 0.3, s3: 0.2, centerWl: 550, bandwidth: 0, retardance: 0.5 },
      expect: { bandS0: 1, bandS1: -0.8, bandS2: 0.3, bandS3: -0.2, bandDop: 87.74964387 },
      tolerance: 1e-8,
    },
  ],
});
