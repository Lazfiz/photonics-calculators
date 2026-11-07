import {
  DELTA_EPS_CONV_PER_SI, MOLAR_ELLIPTICITY_CONV_PER_SI,
  deltaEpsilon, dissymmetryFactor, ellipticity, ellipticityLinear, molarEllipticity, relativeCdSnr,
} from "../../physics/polarization/circular-dichroism";
import { defineSchema } from "../types";

const MDEG = Math.PI / 180 / 1000;
const GREENFIELD = "Greenfield N. J. (2006). Using circular dichroism spectra to estimate protein secondary structure. " +
  "Nat. Protoc. 1, 2876–2890 (θ(mdeg) = 32 980 ΔA; [θ] = 3298.2 Δε). https://doi.org/10.1038/nprot.2006.202";

export default defineSchema({
  href: "/polarization/circular-dichroism",
  inputs: [
    { key: "AL", label: "Absorbance of left-circular light A_L", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0, max: 4 },
    { key: "AR", label: "Absorbance of right-circular light A_R", unit: "", toSI: 1, siUnit: "", default: 0.79, min: 0, max: 4 },
    { key: "concentration", label: "Concentration c of molecules", unit: "mM", toSI: 1, siUnit: "mol/m³", default: 0.1, min: 0, max: 1000 },
    { key: "pathLength", label: "Path length l", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0, max: 100 },
    { key: "residues", label: "Residues N (0 = not a protein)", unit: "", toSI: 1, siUnit: "", default: 0, min: 0, max: 100000 },
  ],
  outputs: [
    { key: "dA", label: "ΔA = A_L − A_R", unit: "", toSI: 1, siUnit: "" },
    { key: "theta", label: "Ellipticity θ (exact)", unit: "mdeg", toSI: MDEG, siUnit: "rad" },
    { key: "thetaLinear", label: "Ellipticity, small-ΔA (ln 10/4) ΔA", unit: "mdeg", toSI: MDEG, siUnit: "rad" },
    { key: "deltaEps", label: "Δε", unit: "M⁻¹cm⁻¹", toSI: 1 / DELTA_EPS_CONV_PER_SI, siUnit: "m²/mol" },
    { key: "molarEllipticity", label: "Molar ellipticity [θ]", unit: "deg·cm²·dmol⁻¹", toSI: 1 / MOLAR_ELLIPTICITY_CONV_PER_SI, siUnit: "rad·m²/mol" },
    { key: "g", label: "Dissymmetry factor g = 2ΔA/(A_L + A_R)", unit: "", toSI: 1, siUnit: "" },
    { key: "meanA", label: "Mean absorbance (A_L + A_R)/2", unit: "", toSI: 1, siUnit: "" },
    { key: "snr", label: "Relative S/N (1 at A = 2/ln 10)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ AL, AR, concentration, pathLength, residues }) {
    const dEps = deltaEpsilon(AL, AR, concentration, pathLength);
    const warnings: string[] = [];
    if (!(concentration > 0 && pathLength > 0)) warnings.push("Δε and [θ] need a concentration and a path length above 0.");
    if (residues > 0) warnings.push("Mean-residue ellipticity is not an API output; divide [θ] by (N − 1).");
    return {
      values: {
        dA: AL - AR,
        theta: ellipticity(AL, AR),
        thetaLinear: ellipticityLinear(AL, AR),
        deltaEps: dEps,
        molarEllipticity: molarEllipticity(dEps),
        g: dissymmetryFactor(AL, AR),
        meanA: (AL + AR) / 2,
        snr: relativeCdSnr((AL + AR) / 2),
      },
      warnings,
    };
  },
  checks: [
    {
      // ΔA = 0.01: θ = atan(tanh(ln 10 · 0.01/4)) = 5.7557e-3 rad = 329.8137 mdeg (small-ΔA 329.8210 mdeg; Greenfield's
      // 32 980 ΔA mdeg = 329.80). Δε = ΔA/(c l) = 0.01/(0.1 mol/m³ · 1e-3 m) = 100 m²/mol = 1000 M⁻¹cm⁻¹;
      // [θ] = (ln 10/4) · 1000 · 3298.21/... = 3 298 210.19 deg·cm²·dmol⁻¹ (3298.2 · Δε); g = 0.02/1.59.
      source: GREENFIELD,
      basis: "computed",
      inputs: { AL: 0.8, AR: 0.79, concentration: 0.1, pathLength: 1 },
      expect: { theta: 329.8137336, thetaLinear: 329.8210195, deltaEps: 1000, molarEllipticity: 3298210.195, g: 0.01257861635 },
      tolerance: 1e-8,
    },
  ],
});
