import { blazedIncidences, dmdDiffraction, nearestBlazedIncidence, STEEP_ANGLE, STEEP_WARNING } from "../../physics/spatial-light-modulators/dmd-diffraction";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const BROWN = "Brown P. T., Kruithoff R., Seedorf G. J., Shepherd D. P. (2021). Multicolor structured illumination microscopy and quantitative control of " +
  "polychromatic light with a digital micromirror device. Biomed. Opt. Express 12(6), 3700–3716, Table 1 " +
  "(d = 7.56 µm, γ = 12°; θb printed as the output angle, on the far side of the normal). https://doi.org/10.1364/BOE.422703";
const TI_DLPA037 = "Texas Instruments DLPA037A (2025). Using Lasers with DLP DMD Technology, Sec. 2.6 Eq. 8: Littrow blaze " +
  "θ = asin(½ n(λ/d)√2) with θ = γ, so λ = √2 d sin γ / n. https://www.ti.com/lit/pdf/dlpa037";

export default defineSchema({
  href: "/spatial-light-modulators/dmd-diffraction",
  choices: [
    { key: "state", label: "Mirror state of the whole array", options: [{ value: "on", label: "On (+γ)" }, { value: "off", label: "Off (−γ)" }], default: "on" },
  ],
  inputs: [
    { key: "pitch", label: "Micromirror pitch d", unit: "µm", toSI: 1e-6, siUnit: "m", default: 7.56, min: 1, max: 50 },
    { key: "tilt", label: "Mirror tilt γ", unit: "°", toSI: DEG, siUnit: "rad", default: 12, min: 1, max: 30 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 465, min: 200, max: 5000 },
    { key: "incidence", label: "Incidence angle θi in the tilt plane, from the DMD normal", unit: "°", toSI: DEG, siUnit: "rad", default: 45.2, min: -89, max: 89 },
    { key: "fillFactor", label: "Fill factor F (reflecting fraction of the array)", unit: "", toSI: 1, siUnit: "", default: 0.92, min: 0.05, max: 1 },
  ],
  outputs: [
    { key: "onAngle", label: "Mirror reflection angle θi ∓ 2γ (far side of the normal positive)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "blazeOrder", label: "Order number of the mirror reflection (whole: blazed; n + ½: anti-blazed)", unit: "", toSI: 1, siUnit: "" },
    { key: "orderX", label: "Nearest order mₓ", unit: "", toSI: 1, siUnit: "" },
    { key: "orderY", label: "Nearest order m_y", unit: "", toSI: 1, siUnit: "" },
    { key: "outputAngle", label: "Output angle of the nearest order in the tilt plane", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "elevation", label: "Angle of the nearest order out of the tilt plane", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "deviation", label: "Angle between the nearest order and the mirror reflection", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "envelope", label: "Mirror envelope at the nearest order (1 when blazed)", unit: "", toSI: 1, siUnit: "" },
    { key: "efficiency", label: "Fraction of the incident power in the nearest order (F² × envelope)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "bestIncidence", label: "Nearest incidence angle that blazes an order exactly", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "bestOrder", label: "Order n of that blazed order (n, −n)", unit: "", toSI: 1, siUnit: "" },
    { key: "bestOutput", label: "Output angle of that blazed order", unit: "°", toSI: DEG, siUnit: "rad" },
  ],
  compute({ state, pitch, tilt, wavelength, incidence, fillFactor }) {
    const mirrorState = state === "off" ? "off" : "on";
    const r = dmdDiffraction({ pitch, tilt, lambda: wavelength, incidence, fillFactor, state: mirrorState });
    const best = nearestBlazedIncidence(blazedIncidences(wavelength, pitch, tilt, mirrorState), incidence);
    const n = r.nearest;
    const warnings: string[] = [];
    const reasons: Partial<Record<"onAngle" | "blazeOrder" | "orderX" | "orderY" | "outputAngle" | "elevation" | "deviation" | "envelope" | "efficiency" | "bestIncidence" | "bestOrder" | "bestOutput", string>> = {};
    if (r.reason) {
      warnings.push(r.reason);
      for (const k of ["orderX", "orderY", "outputAngle", "elevation", "deviation", "envelope", "efficiency"] as const) reasons[k] = r.reason;
      if (!Number.isFinite(r.onAngle)) {
        reasons.onAngle = r.reason;
        reasons.blazeOrder = r.reason;
      }
    }
    if (n && (Math.abs(incidence) > STEEP_ANGLE || Math.abs(n.outputAngle) > STEEP_ANGLE)) warnings.push(STEEP_WARNING);
    if (!best) {
      const none = "No order can be blazed at this wavelength with both beams inside ±90°: nλ/(√2 d sin γ) must lie between sin γ and 1 for some whole n.";
      warnings.push(none);
      reasons.bestIncidence = none;
      reasons.bestOrder = none;
      reasons.bestOutput = none;
    }
    return {
      values: {
        onAngle: r.onAngle,
        blazeOrder: r.blazeOrder,
        orderX: n ? n.mx : NaN,
        orderY: n ? n.my : NaN,
        outputAngle: n ? n.outputAngle : NaN,
        elevation: n ? n.elevation : NaN,
        deviation: n ? n.deviation : NaN,
        envelope: n ? n.envelope : NaN,
        efficiency: n ? n.efficiency : NaN,
        bestIncidence: best ? best.incidence : NaN,
        bestOrder: best ? best.order : NaN,
        bestOutput: best ? best.output : NaN,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Table 1, 465 nm: θa = 45.20°, order (4, −4), output θb = 21.20°, on the blaze condition.
      source: BROWN,
      basis: "printed",
      inputs: {},
      expect: { orderX: 4, orderY: -4, outputAngle: 21.2, bestIncidence: 45.2 },
      tolerance: 5e-4,
    },
    {
      // Table 1, 635 nm: θa = 45.89°, order (3, −3), output 21.20°, 0.69° from the blaze condition.
      source: BROWN,
      basis: "printed",
      inputs: { wavelength: 635, incidence: 45.89 },
      expect: { orderX: 3, orderY: -3, outputAngle: 21.2, deviation: 0.69 },
      tolerance: 0.005,
    },
    {
      // Littrow blaze of order 4: λ = √2 · 7.56 µm · sin 12° / 4 = 555.7196 nm at θi = γ = 12° returns along the
      // incidence (θo = −12°, back on the source side), on the mirror reflection: envelope 1, power F² = 0.92² = 84.64 %.
      // (The blazed incidence itself is acos(u) at u → 1, too steep to check from a rounded wavelength.)
      source: TI_DLPA037,
      basis: "computed",
      inputs: { wavelength: 555.719597, incidence: 12 },
      expect: { outputAngle: -12, envelope: 1, efficiency: 84.64, bestOrder: 4 },
      tolerance: 1e-6,
    },
  ],
});
