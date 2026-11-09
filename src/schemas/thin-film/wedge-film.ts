import { wedgeFringeSpacing } from "../../physics/thin-film/interference";
import { quarterWaveThickness, stackResponse } from "../../physics/thin-film/transfer-matrix";
import { defineSchema } from "../types";

const NM = 1e-9;
const MM = 1e-3;
const DEG = Math.PI / 180;

/** Quarter-wave film on a wedge: bright-to-bright fringe spacing, the thickness at x = 0 (a quarter wave at λ₀), and the reflectance there. */
export default defineSchema({
  href: "/thin-film/wedge-film",
  inputs: [
    { key: "nFilm", label: "n (film)", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1, max: 5 },
    { key: "nSub", label: "n (substrate)", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
    { key: "nInc", label: "n (incident)", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 5 },
    { key: "designWl", label: "Design wavelength λ₀", unit: "nm", toSI: NM, siUnit: "m", default: 550, min: 100, max: 20000 },
    { key: "wedgeAngleDeg", label: "Wedge angle α", unit: "°", toSI: DEG, siUnit: "rad", default: 0.1, min: 0.001, max: 2 },
  ],
  outputs: [
    { key: "fringeSpacing", label: "Fringe spacing Δx = λ/(2 n tan α)", unit: "mm", toSI: MM, siUnit: "m" },
    { key: "thicknessCentre", label: "Thickness at x = 0 (λ₀/4n)", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "reflectanceCentre", label: "Reflectance at λ₀ at x = 0", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ nFilm, nSub, nInc, designWl, wedgeAngleDeg }) {
    const d = quarterWaveThickness(nFilm, designWl);
    const R = stackResponse({ incident: nInc, layers: [{ n: nFilm, thickness: d }], substrate: { n: nSub } }, designWl).R;
    return {
      values: { fringeSpacing: wedgeFringeSpacing(designWl, nFilm, wedgeAngleDeg), thicknessCentre: d, reflectanceCentre: R },
      warnings: ["Small-wedge model: the film thickness grows linearly by tan α and each point is treated as a plane-parallel film."],
    };
  },
  checks: [
    {
      // Air | n = 2.35 film | n = 1.52 glass, λ₀ = 550 nm, α = 0.1°. α = 0.1 × π/180 = 1.745329252e-3 rad, tan α = 1.745330e-3;
      // Δx = 550e-9/(2 × 2.35 × tan α) = 550e-9/(4.7 × 1.7453293e-3) m = 0.0670481845 mm.
      // d = 550/(4 × 2.35) = 58.51063830 nm (quarter wave); R = ((n0 n_sub − n²)/(n0 n_sub + n²))² = ((1.52 − 5.5225)/(1.52 + 5.5225))²
      // = (−4.0025/7.0425)² = 0.32300480 (independent 2×2 matrix script agrees to 1e-15).
      source: "Hecht E. (2017). Optics, 5th ed., Pearson (wedge fringes: thickness step λ/2n per bright fringe); Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., CRC Press, doi:10.1201/9781420073034 (quarter-wave layer reflectance).",
      basis: "computed",
      inputs: {},
      expect: { fringeSpacing: 0.0670481845, thicknessCentre: 58.5106383, reflectanceCentre: 0.3230047953 },
      tolerance: 1e-7,
    },
  ],
});
