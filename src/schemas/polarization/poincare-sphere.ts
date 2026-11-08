import { degreeOfPolarization, stokesFromEllipse } from "../../physics/polarization/stokes";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const GOLDSTEIN = "Goldstein D. H. (2011). Polarized Light, 3rd ed., chs. The Polarization Ellipse and Stokes " +
  "Polarization Parameters (S = I·[1, cos 2χ cos 2ψ, cos 2χ sin 2ψ, sin 2χ]; the Poincaré sphere). CRC Press. " +
  "https://doi.org/10.1201/b10436";

export default defineSchema({
  href: "/polarization/poincare-sphere",
  inputs: [
    { key: "thetaDeg", label: "Orientation angle θ (= ψ)", unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: 0, max: 180 },
    { key: "chiDeg", label: "Ellipticity angle χ", unit: "°", toSI: DEG, siUnit: "rad", default: 15, min: -45, max: 45 },
    { key: "amplitude", label: "Field amplitude (intensity = amplitude²)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.01, max: 5 },
  ],
  outputs: [
    { key: "I", label: "S₀ = I", unit: "", toSI: 1, siUnit: "" },
    { key: "Q", label: "S₁ = Q", unit: "", toSI: 1, siUnit: "" },
    { key: "U", label: "S₂ = U", unit: "", toSI: 1, siUnit: "" },
    { key: "V", label: "S₃ = V (> 0 right-handed)", unit: "", toSI: 1, siUnit: "" },
    { key: "dop", label: "Degree of polarization", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ thetaDeg, chiDeg, amplitude }) {
    // Inputs arrive in SI (radians), whatever the page key calls them.
    const S = stokesFromEllipse(amplitude * amplitude, thetaDeg, chiDeg);
    return { values: { I: S[0], Q: S[1], U: S[2], V: S[3], dop: degreeOfPolarization(S) } };
  },
  checks: [
    {
      // ψ = 45°, χ = 30°, A = 1: I = 1, U = cos 60° sin 90° = 0.5, V = sin 60° = 0.8660254037844386
      // (Q = cos 60° cos 90° ≈ 0 is left out: an expected value can't be 0).
      source: GOLDSTEIN, basis: "computed",
      inputs: { thetaDeg: 45, chiDeg: 30, amplitude: 1 },
      expect: { I: 1, U: 0.5, V: 0.8660254037844386, dop: 1 },
      tolerance: 1e-8,
    },
    {
      // A = 2, ψ = 0, χ = 45°: right-circular light, I = 4, V = 4 sin 90° = 4.
      source: GOLDSTEIN, basis: "computed",
      inputs: { thetaDeg: 0, chiDeg: 45, amplitude: 2 },
      expect: { I: 4, V: 4, dop: 1 },
      tolerance: 1e-8,
    },
  ],
});
