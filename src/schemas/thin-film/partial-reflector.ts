import { partialReflectorAtDesign } from "../../physics/thin-film/partial-reflector";
import { defineSchema } from "../types";

const pure = { unit: "", toSI: 1, siUnit: "" } as const;
const percent = { unit: "%", toSI: 0.01, siUnit: "" } as const;

const MACLEOD = "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., CRC Press, ch. 2 (quarter-wave layer maps Y to n²/Y; " +
  "R = ((n₀ − Y)/(n₀ + Y))²) and ch. 5 (neutral mirrors and beam splitters).";

export default defineSchema({
  href: "/thin-film/partial-reflector",
  inputs: [
    { key: "nFilm", label: "Film index", ...pure, default: 1.7, min: 0.1, max: 10 },
    { key: "nSub", label: "Substrate index", ...pure, default: 1.52, min: 0.1, max: 10 },
    { key: "nInc", label: "Incident medium index", ...pure, default: 1.0, min: 0.1, max: 10 },
    { key: "thicknessRatio", label: "Thickness in quarter waves, d/(λ₀/4n)", ...pure, default: 1.0, min: 0.1, max: 3 },
    { key: "designWl", label: "Design wavelength λ₀", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 1, max: 100000 },
  ],
  outputs: [
    { key: "quarterWaveR", label: "Reflectance at λ₀ of a quarter-wave film", ...percent },
    { key: "thisFilmR", label: "Reflectance at λ₀ for this thickness", ...percent },
    { key: "thickness", label: "Film thickness", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ nFilm, nSub, nInc, thicknessRatio, designWl }) {
    const p = partialReflectorAtDesign(nFilm, nSub, nInc, thicknessRatio, designWl);
    return { values: { quarterWaveR: p.quarterWave, thisFilmR: p.thisFilm, thickness: p.thickness } };
  },
  checks: [
    {
      // Defaults: Y = n²/n_s = 2.89/1.52, R = ((n_s − n²)/(n_s + n²))² = (1.37/4.41)² = 0.0965081422;
      // d = 550/(4 · 1.7) = 80.8823529 nm.
      source: MACLEOD,
      basis: "computed",
      inputs: {},
      expect: { quarterWaveR: 9.650814218355523, thisFilmR: 9.650814218355523, thickness: 80.88235294117646 },
      tolerance: 1e-8,
    },
    {
      // Half-wave film (ratio 2) is absentee: R = bare = (0.52/2.52)² = 0.04257999496; d = 2 · 80.8823529 = 161.7647059 nm.
      source: MACLEOD,
      basis: "computed",
      inputs: { thicknessRatio: 2 },
      expect: { thisFilmR: 4.2579994960947345, thickness: 161.76470588235293 },
      tolerance: 1e-8,
    },
  ],
});
