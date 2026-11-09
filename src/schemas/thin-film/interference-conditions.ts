import { filmPathDifference, firstReflectionExtrema, netReflectionPhase } from "../../physics/thin-film/interference";
import { defineSchema } from "../types";

const NM = 1e-9;

/** Normal-incidence interference conditions of a lossless single film: path difference 2nd, net reflection phase, longest constructive and destructive wavelengths. */
export default defineSchema({
  href: "/thin-film/interference-conditions",
  inputs: [
    { key: "nFilm", label: "n (film)", unit: "", toSI: 1, siUnit: "", default: 1.38, min: 0.1, max: 10 },
    { key: "thickness", label: "Thickness", unit: "nm", toSI: NM, siUnit: "m", default: 100, min: 1, max: 100000 },
    { key: "nIncident", label: "n (incident)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.1, max: 10 },
    { key: "nSubstrate", label: "n (substrate)", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 0.1, max: 10 },
  ],
  outputs: [
    { key: "opd", label: "Optical path difference 2nd", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "phase", label: "Net reflection phase shift (0 or π)", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "constructive", label: "Longest constructive wavelength", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "destructive", label: "Longest destructive wavelength", unit: "nm", toSI: NM, siUnit: "m" },
  ],
  compute({ nFilm, thickness, nIncident, nSubstrate }) {
    const phase = netReflectionPhase(nIncident, nFilm, nSubstrate);
    const { constructive, destructive } = firstReflectionExtrema(nIncident, nFilm, nSubstrate, thickness);
    const warnings = Number.isNaN(phase) ? ["The film index equals a neighbouring index, so that face does not reflect and there are no fringes."] : [];
    return { values: { opd: filmPathDifference(nFilm, thickness), phase, constructive, destructive }, warnings };
  },
  checks: [
    {
      // Air | n = 1.38 film, 100 nm | n = 1.52 glass: the film index lies between the neighbours, so both reflections
      // are off a higher index and the net phase is 0. 2nd = 2 × 1.38 × 100 nm = 276 nm; constructive 2nd = mλ gives
      // λ = 276 nm (m = 1); destructive 2nd = (m + ½)λ gives λ = 552 nm (m = 0).
      source: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §7.6.1 (interference in a plane-parallel film; conditions 2nd cos θ = mλ and (m + ½)λ); Hecht E. (2017). Optics, 5th ed., Pearson, §9.4 (phase change on reflection).",
      basis: "computed",
      inputs: { nFilm: 1.38, thickness: 100, nIncident: 1, nSubstrate: 1.52 },
      expect: { opd: 276, constructive: 276, destructive: 552 },
      tolerance: 1e-8,
    },
    {
      // Air | n = 2.0 film, 100 nm | n = 1.5 glass: reflection off the film face (higher index) adds π, the film/glass
      // face does not: net phase π (checked as a swap). 2nd = 400 nm; constructive 2nd = (m + ½)λ → λ = 800 nm
      // (m = 0); destructive 2nd = mλ → λ = 400 nm (m = 1).
      source: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §7.6.1; Hecht E. (2017). Optics, 5th ed., Pearson, §9.4.",
      basis: "computed",
      inputs: { nFilm: 2, thickness: 100, nIncident: 1, nSubstrate: 1.5 },
      expect: { opd: 400, constructive: 800, destructive: 400, phase: Math.PI },
      tolerance: 1e-8,
    },
  ],
});
