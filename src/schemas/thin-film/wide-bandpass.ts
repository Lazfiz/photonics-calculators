import { wideBandpassDesign, wideBandpassPassBand } from "../../physics/thin-film/wide-bandpass";
import { defineSchema } from "../types";

const NM = 1e-9;
/** The page rounds the (unchecked) URL value to an integer of periods in 1–40. */
const clampInt = (x: number, lo: number, hi: number) => Math.round(Math.min(Math.max(x, lo), hi));

/** A long-pass stack on the front face and a short-pass stack on the back face; the faces add in intensity. */
export default defineSchema({
  href: "/thin-film/wide-bandpass",
  inputs: [
    { key: "nH", label: "High index nH", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1, max: 5 },
    { key: "nL", label: "Low index nL", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 1, max: 5 },
    { key: "nSub", label: "Substrate index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
    { key: "cutOn", label: "Cut-on edge (front face, long-pass)", unit: "nm", toSI: NM, siUnit: "m", default: 500, min: 100, max: 20000 },
    { key: "cutOff", label: "Cut-off edge (back face, short-pass)", unit: "nm", toSI: NM, siUnit: "m", default: 700, min: 100, max: 20000 },
    { key: "pairs", label: "Periods per stack (N)", unit: "", toSI: 1, siUnit: "", default: 8, min: 1, max: 40 },
  ],
  outputs: [
    { key: "passbandShort", label: "Short-wavelength 50 % point", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "passbandLong", label: "Long-wavelength 50 % point", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "width", label: "Pass-band width between the 50 % points", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "peakTransmittance", label: "Peak T in the pass band", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "meanTransmittance", label: "Mean T between the 50 % points", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "frontLambda0", label: "Front stack design wavelength λ₀", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "backLambda0", label: "Back stack design wavelength λ₀", unit: "nm", toSI: NM, siUnit: "m" },
  ],
  compute({ nH, nL, nSub, cutOn, cutOff, pairs }) {
    const design = wideBandpassDesign({ nH, nL, nSub, cutOn, cutOff, periods: clampInt(pairs, 1, 40) });
    const { on, off, pass } = wideBandpassPassBand(design);
    const warnings: string[] = [];
    if (!design.valid) warnings.push("Set nH above nL and the cut-on below the cut-off.");
    else if (!Number.isFinite(on)) warnings.push("No pass band above 50 %: the edges are too close or the stacks too weak.");
    return {
      values: {
        passbandShort: on,
        passbandLong: off,
        width: off - on,
        peakTransmittance: pass.max,
        meanTransmittance: pass.mean,
        frontLambda0: design.lpLambda0,
        backLambda0: design.spLambda0,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults, worked with an independent 2×2 characteristic-matrix program (Macleod ch. 2): Δg = (2/π)
      // asin((nH − nL)/(nH + nL)) = 0.152224816537, front (H/2 L H/2)^8 at λ₀ = 500(1 − Δg) = 423.88759173 nm,
      // back (L/2 H L/2)^8 at 700(1 + Δg) = 806.55737158 nm, T = T₁T₂/(1 − R₁R₂); 50 % points by a 4000-step scan
      // and a 200-step bisection from each λ₀ toward the pass band; mean and peak from 1001 samples (trapezoid
      // rule) between them, as the page does.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 7 (edge filters) and ch. 2 (incoherent reflection at two surfaces). CRC Press.",
      basis: "computed",
      inputs: {},
      expect: {
        frontLambda0: 423.887591731269,
        backLambda0: 806.5573715762234,
        passbandShort: 509.1545624410828,
        passbandLong: 684.505636983032,
        width: 175.35107454194917,
        peakTransmittance: 94.34579984343093,
        meanTransmittance: 86.02068600472662,
      },
      tolerance: 1e-8,
    },
  ],
});
