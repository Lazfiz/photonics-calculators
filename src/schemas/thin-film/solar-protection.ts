import { solarWeightedMean } from "../../physics/astm-g173";
import {
  bareGlassTransmittance,
  solarProtectionDesign,
  solarProtectionMeans,
  thirdOrderZones,
} from "../../physics/thin-film/solar-protection";
import { defineSchema } from "../types";

const NM = 1e-9;
/** The page rounds the (unchecked) URL value to an integer of periods in 1–40. */
const clampInt = (x: number, lo: number, hi: number) => Math.round(Math.min(Math.max(x, lo), hi));

/** UV-reflecting long-pass stacks on the outer face, near-IR-reflecting short-pass stacks on the inner face. */
export default defineSchema({
  href: "/thin-film/solar-protection",
  inputs: [
    { key: "nH", label: "High index nH", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1, max: 5 },
    { key: "nL", label: "Low index nL", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 1, max: 5 },
    { key: "nSub", label: "Glass index", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
    { key: "uvFrom", label: "UV reflector: from", unit: "nm", toSI: NM, siUnit: "m", default: 300, min: 200, max: 4000 },
    { key: "uvTo", label: "UV reflector: to", unit: "nm", toSI: NM, siUnit: "m", default: 400, min: 200, max: 4000 },
    { key: "irFrom", label: "IR reflector: from", unit: "nm", toSI: NM, siUnit: "m", default: 720, min: 200, max: 4000 },
    { key: "irTo", label: "IR reflector: to", unit: "nm", toSI: NM, siUnit: "m", default: 1300, min: 200, max: 4000 },
    { key: "uvPairs", label: "UV periods per stack", unit: "", toSI: 1, siUnit: "", default: 8, min: 1, max: 40 },
    { key: "irPairs", label: "IR periods per stack", unit: "", toSI: 1, siUnit: "", default: 10, min: 1, max: 40 },
  ],
  outputs: [
    { key: "solarTransmittance", label: "Solar transmittance (AM1.5 G, 280–4000 nm)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "solarReflected", label: "Solar energy reflected", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "uvTransmittance", label: "UV transmittance, 280–400 nm", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "visibleTransmittance", label: "Visible transmittance, 400–700 nm", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "nirTransmittance", label: "Near-IR transmittance, 700–4000 nm", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "bareGlassTransmittance", label: "Uncoated glass, two faces", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "uvStacks", label: "Stacks on the outer face", unit: "", toSI: 1, siUnit: "" },
    { key: "irStacks", label: "Stacks on the inner face", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ nH, nL, nSub, uvFrom, uvTo, irFrom, irTo, uvPairs, irPairs }) {
    const design = solarProtectionDesign({
      nH, nL, nSub, uvFrom, uvTo, irFrom, irTo,
      uvPairs: clampInt(uvPairs, 1, 40),
      irPairs: clampInt(irPairs, 1, 40),
    });
    const warnings: string[] = [];
    if (!design.valid) warnings.push('Set nH above nL and each band\'s "from" below its "to".');
    if (design.tooBig) warnings.push("Too many stacks to compute here; narrow the bands or use fewer periods.");
    for (const z of thirdOrderZones(design.irCentres, nH, nL)) {
      if (z.to > 400 * NM && z.from < 700 * NM) {
        warnings.push(`A third-order zone of the IR reflector, ${(z.from / NM).toFixed(0)}–${(z.to / NM).toFixed(0)} nm, blocks visible light.`);
      }
    }
    const solar = design.ready ? solarProtectionMeans(design.transmittance, solarWeightedMean) : null;
    return {
      values: {
        solarTransmittance: solar?.total ?? NaN,
        solarReflected: solar ? 1 - solar.total : NaN,
        uvTransmittance: solar?.uv ?? NaN,
        visibleTransmittance: solar?.vis ?? NaN,
        nirTransmittance: solar?.nir ?? NaN,
        bareGlassTransmittance: bareGlassTransmittance(nSub),
        uvStacks: design.uvCentres.length,
        irStacks: design.irCentres.length,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults, worked with an independent 2×2 characteristic-matrix program (Macleod ch. 2) and its own trapezoid
      // sum over the ASTM G173 global-tilt grid: Δg = 0.152224816537; the UV band 300–400 nm needs K = ⌈ln(4/3) /
      // ln((1 + Δg)/(1 − Δg))⌉ = 1 stack, the single zone spanning it with the edge on the pass side,
      // λ₀ = 400(1 − Δg) = 339.11007 nm; the IR band 720–1300 nm needs 2 stacks at 829.60187 and 1102.10774 nm.
      // Faces (H/2 L H/2)^8 and (L/2 H L/2)^10, T = T₁T₂/(1 − R₁R₂), ∫TE dλ/∫E dλ on 280–4000 nm.
      // The expected values use the repo's copy of the G173 table (read as data, not through the repo function).
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 7 (edge filters) and ch. 2 (incoherent reflection at two surfaces), CRC Press; ASTM G173-03 (reapproved 2020), Standard Tables for Reference Solar Spectral Irradiances, global tilt.",
      basis: "computed",
      inputs: {},
      expect: {
        uvStacks: 1,
        irStacks: 2,
        solarTransmittance: 48.718398785959194,
        uvTransmittance: 1.9673193734488278,
        visibleTransmittance: 89.10631886860438,
        nirTransmittance: 19.726093981939474,
      },
      tolerance: 1e-8,
    },
    {
      // Two uncoated faces of a thick glass pane, multiple reflections added in intensity: each face has
      // R = ((n − 1)/(n + 1))² and T = 2n/(n² + 1) overall (Macleod ch. 2): n = 1.52 → 3.04/3.3104 = 0.918318028.
      source: "Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ch. 2 (incoherent reflection at two surfaces). CRC Press.",
      basis: "computed",
      inputs: {},
      expect: { bareGlassTransmittance: 91.83180280328661 },
      tolerance: 1e-8,
    },
  ],
});
