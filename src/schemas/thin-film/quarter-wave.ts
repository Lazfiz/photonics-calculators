import { quarterWaveArIndex, quarterWaveStackReflectance, quarterWaveThickness } from "../../physics/thin-film/transfer-matrix";
import { defineSchema } from "../types";

const NM = 1e-9;

/** Single quarter-wave layer: physical thickness λ/(4n), the index that cancels reflection, and the reflectance at the design wavelength. */
export default defineSchema({
  href: "/thin-film/quarter-wave",
  inputs: [
    { key: "nFilm", label: "n (film)", unit: "", toSI: 1, siUnit: "", default: 1.38, min: 0.1, max: 10 },
    { key: "nSub", label: "n (substrate)", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 0.1, max: 10 },
    { key: "nInc", label: "n (incident)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.1, max: 10 },
    { key: "designWl", label: "Design wavelength", unit: "nm", toSI: NM, siUnit: "m", default: 550, min: 1, max: 100000 },
  ],
  outputs: [
    { key: "thickness", label: "Quarter-wave thickness d = λ/(4n)", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "optimalN", label: "Optimal film index √(n_inc·n_sub)", unit: "", toSI: 1, siUnit: "" },
    { key: "designR", label: "Reflectance at the design wavelength", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ nFilm, nSub, nInc, designWl }) {
    return {
      values: {
        thickness: quarterWaveThickness(nFilm, designWl),
        optimalN: quarterWaveArIndex(nInc, nSub),
        designR: quarterWaveStackReflectance(nInc, [nFilm], nSub),
      },
    };
  },
  checks: [
    {
      // Air | n = 1.38 | n = 1.52 at 550 nm. d = 550/(4 × 1.38) = 99.63768116 nm; √(1 × 1.52) = 1.23288280.
      // Admittance of the QW layer Y = n²/n_sub = 1.9044/1.52, so R = ((n0·n_sub − n²)/(n0·n_sub + n²))² = ((1.52 − 1.9044)/(1.52 + 1.9044))²
      // = (−0.3844/3.4244)² = 0.01260079. (Cross-checked with an independent 2×2 characteristic-matrix script.)
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., CRC Press, doi:10.1201/9781420073034 (single-layer antireflection coating, quarter-wave layer).",
      basis: "computed",
      inputs: {},
      expect: { thickness: 99.63768116, optimalN: 1.2328828, designR: 0.01260079 },
      tolerance: 1e-7,
    },
  ],
});
