import { filmOpticalSummary, SUMMARY_WAVELENGTH } from "../../physics/thin-film/spectrophotometry";
import { unpolarizedResponse } from "../../physics/thin-film/transfer-matrix";
import { defineSchema } from "../types";

const NM = 1e-9;
const CM_INV = 100;

/** One absorbing film on a substrate: optical thickness, quarter-wave thickness, half waves and α at 550 nm, plus exact unpolarized R, T, A at 550 nm. */
export default defineSchema({
  href: "/thin-film/spectrophotometry",
  inputs: [
    { key: "nFilm", label: "n (film)", unit: "", toSI: 1, siUnit: "", default: 1.46, min: 1, max: 5 },
    { key: "kFilm", label: "k (film, extinction)", unit: "", toSI: 1, siUnit: "", default: 0.001, min: 0, max: 10 },
    { key: "nSub", label: "n (substrate)", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
    { key: "thickness", label: "Thickness", unit: "nm", toSI: NM, siUnit: "m", default: 100, min: 0, max: 20000 },
    { key: "angleDeg", label: "Angle of incidence", unit: "°", toSI: Math.PI / 180, siUnit: "rad", default: 0, min: 0, max: 89 },
    { key: "nInc", label: "n (incident)", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 5 },
  ],
  outputs: [
    { key: "opticalThickness", label: "Optical thickness nd", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "qwot", label: "QWOT physical thickness at 550 nm", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "halfWaves", label: "2nd/λ at 550 nm", unit: "", toSI: 1, siUnit: "" },
    { key: "alpha", label: "α at 550 nm (n, k constant in λ)", unit: "cm⁻¹", toSI: CM_INV, siUnit: "m⁻¹" },
    { key: "R", label: "Reflectance at 550 nm, unpolarized", unit: "", toSI: 1, siUnit: "" },
    { key: "T", label: "Transmittance into the substrate at 550 nm, unpolarized (no back surface)", unit: "", toSI: 1, siUnit: "" },
    { key: "A", label: "Absorptance of the film at 550 nm, unpolarized", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ nFilm, kFilm, nSub, thickness, angleDeg, nInc }) {
    const s = filmOpticalSummary(nFilm, kFilm, thickness, SUMMARY_WAVELENGTH);
    const stack = { incident: nInc, layers: [{ n: nFilm, k: kFilm, thickness }], substrate: { n: nSub } };
    const r = unpolarizedResponse(stack, SUMMARY_WAVELENGTH, angleDeg);
    return {
      values: { opticalThickness: s.opticalThickness, qwot: s.quarterWaveThickness, halfWaves: s.halfWaves, alpha: s.alpha, R: r.R, T: r.T, A: r.A },
      warnings: ["n and k are constant in wavelength; R, T and A are for the front surface and film only (substrate back face ignored)."],
    };
  },
  checks: [
    {
      // Air | n = 1.46, k = 0.001, 100 nm | n = 1.52 at 550 nm, normal incidence.
      // nd = 1.46 × 100 = 146 nm; QWOT thickness = 550/(4 × 1.46) = 94.17808219 nm; 2nd/λ = 292/550 = 0.53090909;
      // α = 4πk/λ = 4π × 0.001/550e-9 = 22847.9466 m⁻¹ = 228.479466 cm⁻¹.
      // R, T, A from an independent 2×2 characteristic-matrix calculation (complex N = n + ik, T = 4 Re(η0) Re(ηs)/|η0 B + C|²):
      // R = 0.0281793095, T = 0.9695967701, A = 0.0022239205 (R + T + A = 1).
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., CRC Press, doi:10.1201/9781420073034 (characteristic matrix of an absorbing layer).",
      basis: "computed",
      inputs: {},
      expect: { opticalThickness: 146, qwot: 94.17808219, halfWaves: 0.53090909, alpha: 228.4794657, R: 0.0281793095, T: 0.9695967701, A: 0.0022239205 },
      tolerance: 1e-7,
    },
    {
      // Same film at 30° incidence, mean of s and p from the same independent matrix code:
      // R = 0.0293665852, T = 0.9682750428, A = 0.0023583721.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., CRC Press, doi:10.1201/9781420073034 (oblique incidence: tilted admittances ηs = N cosθ, ηp = N/cosθ).",
      basis: "computed",
      inputs: { angleDeg: 30 },
      expect: { R: 0.0293665852, T: 0.9682750428, A: 0.0023583721 },
      tolerance: 1e-7,
    },
  ],
});
