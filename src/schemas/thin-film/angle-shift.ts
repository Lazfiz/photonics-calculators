import { stopBandCentreAtAngle } from "../../physics/thin-film/quarter-wave-stack";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;

export default defineSchema({
  href: "/thin-film/angle-shift",
  inputs: [
    { key: "nFilm", label: "Film (or effective) index", unit: "", toSI: 1, siUnit: "", default: 1.38, min: 1, max: 5 },
    { key: "designWl", label: "Design wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 1, max: 20000 },
    { key: "maxAngle", label: "Maximum angle of the plot", unit: "°", toSI: DEG, siUnit: "rad", default: 60, min: 1, max: 89 },
    { key: "angle", label: "Angle of incidence (from air)", unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: 0, max: 89 },
  ],
  outputs: [
    { key: "effectiveWavelength", label: "Effective wavelength λ₀ cos θ_film at the angle", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "blueShift", label: "Blue shift λ₀ − λ₀ cos θ_film", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ nFilm, designWl, angle }) {
    // Same call as the page: one film (n_H = n_L = n) in air gives λ₀ cos θ_film.
    const eff = stopBandCentreAtAngle(designWl, nFilm, nFilm, angle);
    return {
      values: { effectiveWavelength: eff, blueShift: designWl - eff },
      warnings: Number.isFinite(eff) ? [] : ["No propagating wave in the film at this angle: no result."],
    };
  },
  checks: [
    {
      // sin θ_film = sin 45°/1.38 = 0.512399; cos θ_film = √(1 − 0.262552) = 0.858747; λ = 550 × 0.858747 = 472.312 nm.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 (phase thickness 2π n d cos θ/λ). CRC Press.",
      basis: "computed",
      inputs: { nFilm: 1.38, designWl: 550, angle: 45 },
      expect: { effectiveWavelength: 472.3120366, blueShift: 77.68796337 },
      tolerance: 1e-8,
    },
  ],
});
