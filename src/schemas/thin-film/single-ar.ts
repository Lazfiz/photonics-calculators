import { refractionAngle } from "../../physics/polarization/fresnel";
import { quarterWaveArIndex, stackResponse } from "../../physics/thin-film/transfer-matrix";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;

export default defineSchema({
  href: "/thin-film/single-ar",
  inputs: [
    { key: "nIncident", label: "Incident medium index", unit: "", toSI: 1, siUnit: "", default: 1.0, min: 1, max: 1.6 },
    { key: "nFilm", label: "Film index", unit: "", toSI: 1, siUnit: "", default: 1.38, min: 1.1, max: 2.4 },
    { key: "nSubstrate", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1.3, max: 2.4 },
    { key: "designWavelength", label: "Design wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 350, max: 1100 },
    { key: "angle", label: "Incidence angle", unit: "°", toSI: DEG, siUnit: "rad", default: 0, min: 0, max: 75 },
  ],
  outputs: [
    { key: "optimalNFilm", label: "Optimal film index √(n₀ n_s) at normal incidence", unit: "", toSI: 1, siUnit: "" },
    { key: "quarterWaveThickness", label: "Quarter-wave thickness λ₀/(4 n₁ cos θ₁)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "reflectance", label: "Reflectance at the design wavelength (unpolarized)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "filmAngle", label: "Angle in the film θ₁", unit: "°", toSI: DEG, siUnit: "rad" },
  ],
  compute({ nIncident, nFilm, nSubstrate, designWavelength, angle }) {
    const theta1 = refractionAngle(nIncident, nFilm, angle);
    const tir = Number.isNaN(theta1);
    const thickness = tir ? NaN : designWavelength / (4 * nFilm * Math.cos(theta1));
    // With TIR in the film there is no quarter-wave thickness: R is then that of the bare substrate.
    const stack = { incident: nIncident, layers: [{ n: nFilm, thickness: tir ? 0 : thickness }], substrate: { n: nSubstrate } };
    const R = 0.5 * (
      stackResponse(stack, designWavelength, angle, "s").R + stackResponse(stack, designWavelength, angle, "p").R
    );
    return {
      values: {
        optimalNFilm: quarterWaveArIndex(nIncident, nSubstrate),
        quarterWaveThickness: thickness,
        reflectance: R,
        filmAngle: theta1,
      },
      warnings: tir
        ? ["Total internal reflection in the film: no quarter-wave thickness; the reflectance is the bare substrate's."]
        : [],
    };
  },
  checks: [
    {
      // MgF₂ (1.38) on 1.52 glass at normal incidence: R = ((n₀ n_s − n₁²)/(n₀ n_s + n₁²))², d = λ₀/(4 n₁).
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 4 (single-layer antireflection coatings). CRC Press.",
      basis: "computed",
      inputs: { nIncident: 1, nFilm: 1.38, nSubstrate: 1.52, designWavelength: 550, angle: 0 },
      expect: { reflectance: 1.260079021, quarterWaveThickness: 99.63768116 },
      tolerance: 1e-8,
    },
    {
      // A single quarter wave cancels R when n₁ = √(n₀ n_s): √1.52 for glass in air.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 4. CRC Press.",
      basis: "computed",
      inputs: { nIncident: 1, nSubstrate: 1.52 },
      expect: { optimalNFilm: 1.232882801 },
      tolerance: 1e-8,
    },
  ],
});
