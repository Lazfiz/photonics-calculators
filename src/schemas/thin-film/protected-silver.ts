import { protectedSilverSummary } from "../../physics/thin-film/protected-silver";
import { defineSchema } from "../types";

const NM = 1e-9;

/** Air | overcoat | Ag | adhesion layer | substrate at normal incidence: mean R over 400–700 nm and 700–1200 nm, lowest R over 300–1200 nm. */
export default defineSchema({
  href: "/thin-film/protected-silver",
  inputs: [
    { key: "nSub", label: "n (substrate)", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
    { key: "agThickness", label: "Ag thickness", unit: "nm", toSI: NM, siUnit: "m", default: 80, min: 0, max: 1000 },
    { key: "nProtect", label: "n (overcoat)", unit: "", toSI: 1, siUnit: "", default: 1.38, min: 1, max: 5 },
    { key: "protectThick", label: "Overcoat thickness", unit: "nm", toSI: NM, siUnit: "m", default: 50, min: 0, max: 2000 },
    { key: "nAdhesion", label: "n (adhesion layer, under the Ag)", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1, max: 5 },
    { key: "adhesionThick", label: "Adhesion layer thickness", unit: "nm", toSI: NM, siUnit: "m", default: 10, min: 0, max: 500 },
  ],
  outputs: [
    { key: "visMean", label: "Mean R, 400–700 nm", unit: "", toSI: 1, siUnit: "" },
    { key: "bareVisMean", label: "Mean R, 400–700 nm, without overcoat", unit: "", toSI: 1, siUnit: "" },
    { key: "nirMean", label: "Mean R, 700–1200 nm", unit: "", toSI: 1, siUnit: "" },
    { key: "visMin", label: "Minimum R in 400–700 nm", unit: "", toSI: 1, siUnit: "" },
    { key: "minR", label: "Lowest R, 300–1200 nm (1 nm grid)", unit: "", toSI: 1, siUnit: "" },
    { key: "minWavelength", label: "Wavelength of the lowest R", unit: "nm", toSI: NM, siUnit: "m" },
  ],
  compute({ nSub, agThickness, nProtect, protectThick, nAdhesion, adhesionThick }) {
    const s = protectedSilverSummary({
      nSub, agThickness, nProtect, protectThickness: protectThick, nAdhesion, adhesionThickness: adhesionThick,
    });
    return {
      values: s,
      warnings: [
        "Ag is the template-stripped silver of Yang et al. (2015), the best case: evaporated and sputtered films reflect less, and much less once tarnished. Overcoat and adhesion layers are lossless with constant indices; back face ignored.",
      ],
    };
  },
  checks: [
    {
      // No Ag, adhesion or overcoat: the bare n = 1.52 substrate. R = ((1.52 − 1)/(1.52 + 1))² = (0.52/2.52)² = 0.042579995 at every
      // wavelength, so all means and minima equal it.
      source: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §1.5 (Fresnel reflectance at normal incidence).",
      basis: "computed",
      inputs: { agThickness: 0, protectThick: 0, adhesionThick: 0 },
      expect: { visMean: 0.042579995, bareVisMean: 0.042579995, nirMean: 0.042579995, visMin: 0.042579995, minR: 0.042579995 },
      tolerance: 1e-7,
    },
    {
      // No Ag or adhesion layer, a single n = 1.38 layer of 100 nm on n = 1.52: quarter-wave at λ = 4 × 1.38 × 100 = 552 nm,
      // where R = ((1.52 − 1.38²)/(1.52 + 1.38²))² = (−0.3844/3.4244)² = 0.01260079, the lowest value on the 1 nm grid
      // (other quarter-wave orders lie outside 300–1200 nm). Checked against an independent 2×2 characteristic-matrix script.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., CRC Press, doi:10.1201/9781420073034 (single-layer antireflection coating, quarter-wave layer).",
      basis: "computed",
      inputs: { agThickness: 0, protectThick: 100, adhesionThick: 0 },
      expect: { minR: 0.01260079, minWavelength: 552 },
      tolerance: 1e-7,
    },
  ],
});
