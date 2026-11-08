import { apply, linearRetarder, linearState, stokesFromJones } from "../../physics/polarization/jones";
import { ellipseAngles } from "../../physics/polarization/stokes";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const GOLDSTEIN = "Goldstein D. H. (2011). Polarized Light, 3rd ed., ch. The Jones Matrix Formalism, pp. 201–231 " +
  "(retarder R(−θ) diag(1, e^(−iΓ)) R(θ)), and ch. Stokes Polarization Parameters, pp. 59–91 " +
  "(S₂ = 2 Re(Eₓ* E_y), S₃ = 2 Im(Eₓ* E_y)). CRC Press. https://doi.org/10.1201/b10436";

export default defineSchema({
  href: "/polarization/retarder",
  inputs: [
    { key: "retardanceDeg", label: "Retardance Γ", unit: "°", toSI: DEG, siUnit: "rad", default: 90, min: -3600, max: 3600 },
    { key: "fastAxisDeg", label: "Fast axis angle θ", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: -720, max: 720 },
    { key: "inputPolDeg", label: "Input linear polarization azimuth", unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: -720, max: 720 },
  ],
  outputs: [
    { key: "S0", label: "S₀ (intensity)", unit: "", toSI: 1, siUnit: "" },
    { key: "S1", label: "S₁", unit: "", toSI: 1, siUnit: "" },
    { key: "S2", label: "S₂", unit: "", toSI: 1, siUnit: "" },
    { key: "S3", label: "S₃ (> 0 right-handed, Goldstein)", unit: "", toSI: 1, siUnit: "" },
    { key: "chi", label: "Ellipticity angle χ", unit: "°", toSI: DEG, siUnit: "rad" },
  ],
  compute({ retardanceDeg, fastAxisDeg, inputPolDeg }) {
    // The angles arrive in radians (SI); the names keep the page's URL keys.
    const Eout = apply(linearRetarder(retardanceDeg, fastAxisDeg), linearState(inputPolDeg));
    const S = stokesFromJones(Eout);
    const { psi, chi } = ellipseAngles(S);
    const warnings: string[] = [];
    if (Number.isNaN(psi)) warnings.push("Circular light has no orientation angle ψ.");
    return { values: { S0: S[0], S1: S[1], S2: S[2], S3: S[3], chi }, warnings };
  },
  checks: [
    {
      // Fast axis 0, input azimuth α: E_y = sin α e^(−iΓ), so S₁ = cos 2α, S₂ = sin 2α cos Γ, S₃ = −sin 2α sin Γ.
      // α = 30°, Γ = 60°: S₁ = 0.5, S₂ = 0.8660254038 · 0.5 = 0.4330127019, S₃ = −0.8660254038² = −0.75.
      source: GOLDSTEIN,
      basis: "computed",
      inputs: { retardanceDeg: 60, fastAxisDeg: 0, inputPolDeg: 30 },
      expect: { S0: 1, S1: 0.5, S2: 0.4330127019, S3: -0.75 },
      tolerance: 1e-8,
    },
    {
      // Half-wave plate at 0°, α = 30°: S₁ = cos 60° = 0.5, S₂ = sin 60° cos 180° = −0.8660254038, S₃ = −sin 60° sin 180° = 0 (left out, can't be 0).
      source: GOLDSTEIN,
      basis: "computed",
      inputs: { retardanceDeg: 180, fastAxisDeg: 0, inputPolDeg: 30 },
      expect: { S0: 1, S1: 0.5, S2: -0.8660254038 },
      tolerance: 1e-8,
    },
  ],
});
