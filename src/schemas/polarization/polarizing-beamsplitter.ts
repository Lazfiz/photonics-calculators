import {
  macNeilleAngle, macNeilleGlassIndex, macNeilleInterfaceRp, macNeilleResponse, type MacNeilleDesign,
} from "../../physics/polarization/reflection-polarizers";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const NM = 1e-9;
const MACLEOD = "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 Basic Theory, pp. 13–71 (characteristic matrix; " +
  "quarter-wave layer admittance inversion Y → η²/Y) and ch. 9 Tilted Coatings (MacNeille polarizer), pp. 403–469, CRC Press. " +
  "https://doi.org/10.1201/9781420073034-c2, https://doi.org/10.1201/9781420073034-c9";
const MACNEILLE = "MacNeille S. M. (1946). Beam splitter. US patent 2,403,731 (Eastman Kodak): H/L interfaces at Brewster's angle, " +
  "n_g² sin²θ_g = n_H²n_L²/(n_H² + n_L²). https://patents.google.com/patent/US2403731A/en";

export default defineSchema({
  href: "/polarization/polarizing-beamsplitter",
  inputs: [
    { key: "nH", label: "High index nH", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1.2, max: 4.5 },
    { key: "nL", label: "Low index nL", unit: "", toSI: 1, siUnit: "", default: 1.38, min: 1.1, max: 4 },
    { key: "nGlass", label: "Glass index ng", unit: "", toSI: 1, siUnit: "", default: 1.6829, min: 1.3, max: 2.5 },
    { key: "pairs", label: "H/L pairs N (rounded to an integer)", unit: "", toSI: 1, siUnit: "", default: 5, min: 1, max: 30 },
    { key: "lambda0", label: "Design wavelength λ₀", unit: "nm", toSI: NM, siUnit: "m", default: 550, min: 200, max: 5000 },
    { key: "angleDeg", label: "Angle in the glass", unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: 20, max: 70 },
  ],
  outputs: [
    { key: "Tp", label: "Transmitted p at λ₀, Tₚ", unit: "", toSI: 1, siUnit: "" },
    { key: "Ts", label: "s leaking through at λ₀, Tₛ", unit: "", toSI: 1, siUnit: "" },
    { key: "Rs", label: "Reflected s at λ₀, Rₛ", unit: "", toSI: 1, siUnit: "" },
    { key: "Rp", label: "p leaking into the reflection at λ₀, Rₚ", unit: "", toSI: 1, siUnit: "" },
    { key: "transmittedExtinction", label: "Transmitted extinction ratio Tₚ/Tₛ", unit: "", toSI: 1, siUnit: "" },
    { key: "reflectedExtinction", label: "Reflected extinction ratio Rₛ/Rₚ", unit: "", toSI: 1, siUnit: "" },
    { key: "interfaceRp", label: "p reflectance of one H/L interface at this angle", unit: "", toSI: 1, siUnit: "" },
    { key: "matchedGlassIndex", label: "Glass index that puts the H/L interfaces at Brewster's angle at this angle", unit: "", toSI: 1, siUnit: "" },
    { key: "matchedAngle", label: "Angle in the glass that puts the H/L interfaces at Brewster's angle for this glass", unit: "°", toSI: DEG, siUnit: "rad" },
  ],
  compute({ nH, nL, nGlass, pairs, lambda0, angleDeg }) {
    const design: MacNeilleDesign = { nH, nL, nGlass, pairs: Math.round(pairs), lambda0, thetaGlass: angleDeg };
    const r = macNeilleResponse(design, lambda0);
    const matchedAngle = macNeilleAngle(nH, nL, nGlass);
    const warnings: string[] = [];
    if (!(nGlass * Math.sin(angleDeg) < Math.min(nH, nL))) {
      warnings.push("ng sin θg exceeds a layer index, so light cannot propagate in that layer: lower the angle or the glass index.");
    }
    if (!Number.isFinite(matchedAngle)) warnings.push("The glass index is too low to reach Brewster's angle at the H/L interfaces.");
    return {
      values: {
        Tp: r.Tp,
        Ts: r.Ts,
        Rs: r.Rs,
        Rp: r.Rp,
        transmittedExtinction: r.Tp / r.Ts,
        reflectedExtinction: r.Rs / r.Rp,
        interfaceRp: macNeilleInterfaceRp(design),
        matchedGlassIndex: macNeilleGlassIndex(nH, nL, angleDeg),
        matchedAngle,
      },
      warnings,
    };
  },
  checks: [
    {
      // Quarter-wave stack at λ₀ (phase π/2 per layer) inverts the admittance, Y → η²/Y, layer by layer from the glass:
      // η_s = √(n² − β²), η_p = n²/η_s, β = ng sin 45° = 1.18999. Y₀ = η_g; H, then N × (L, H); R = ((η_g − Y)/(η_g + Y))², T = 1 − R.
      // Worked with plain arithmetic for nH = 2.35, nL = 1.38, ng = 1.6829, N = 5: Rs = 0.9999671983022832, Rp = 0.0181266831716717.
      source: MACLEOD,
      basis: "computed",
      inputs: {},
      expect: { Rs: 0.9999671983022832, Rp: 0.0181266831716717, Ts: 0.00003280169771679997, Tp: 0.9818733168283283 },
      tolerance: 1e-8,
    },
    {
      // Same admittance recursion with N = 1: Rs = 0.8486372669275081, Rp = 0.018127629553844993.
      source: MACLEOD,
      basis: "computed",
      inputs: { pairs: 1 },
      expect: { Rs: 0.8486372669275081, Rp: 0.018127629553844993 },
      tolerance: 1e-8,
    },
    {
      // MacNeille condition at 45°: ng = nH nL / (sin 45° √(nH² + nL²)) = 2.3·1.46 / (0.70710678·√7.4216) = 1.743198798253302.
      source: MACNEILLE,
      basis: "computed",
      inputs: { nH: 2.3, nL: 1.46 },
      expect: { matchedGlassIndex: 1.743198798253302 },
      tolerance: 1e-8,
    },
  ],
});
