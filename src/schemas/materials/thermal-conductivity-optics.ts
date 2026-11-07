import { DNDT_PRESET, cylinderCentreRise, rodThermalLens, slabConductionRise, windowThermalPreset } from "../../physics/materials/thermal-conduction";
import { WINDOW_MATERIALS, type WindowMaterialId } from "../../physics/materials/window-materials";
import { defineSchema } from "../types";

const IDS = (Object.keys(WINDOW_MATERIALS) as WindowMaterialId[]).filter((k) => WINDOW_MATERIALS[k].conductivity !== null);
const PPM = 1e-6; // the dn/dT input unit, 1/K
/** Largest dn/dT the page accepts, 10⁻⁶/K; the sentinel DNDT_PRESET above it means "the material's preset". */
const DNDT_MAX_PPM = 1000;

const KOECHNER = "Koechner W. (2006). Solid-State Laser Engineering, 6th ed., Springer, doi:10.1007/0-387-29338-8, ch. 7 (uniformly " +
  "heated rod, radial heat flow): centre-to-edge ΔT = P/(4πkL), thermal lens f = 2kA/(P·dn/dT) from the dn/dT term alone; face-to-face " +
  "drop ΔT = P·d/(kA) is Fourier's law for a slab.";

export default defineSchema({
  href: "/materials/thermal-conductivity-optics",
  choices: [
    { key: "material", label: "Material", options: IDS.map((id) => ({ value: id as string, label: WINDOW_MATERIALS[id].name })), default: "fusedSilica" },
  ],
  inputs: [
    { key: "k", label: "Thermal conductivity k (0 = the material's preset)", unit: "W/(m·K)", toSI: 1, siUnit: "W/(m·K)", default: 0, min: 0, max: 10000 },
    {
      key: "dndT", label: "dn/dT (1e6 = the material's preset; otherwise within ±1000)", unit: "×10⁻⁶ /K", toSI: PPM, siUnit: "1/K",
      default: DNDT_PRESET, min: -1000, max: DNDT_PRESET,
    },
    { key: "thickness", label: "Thickness or path length d", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.01, max: 1000 },
    { key: "area", label: "Heated area A", unit: "mm²", toSI: 1e-6, siUnit: "m²", default: 100, min: 1e-4, max: 1e6 },
    { key: "power", label: "Absorbed power P", unit: "W", toSI: 1, siUnit: "W", default: 1, min: 0, max: 1e5 },
  ],
  outputs: [
    { key: "resistance", label: "Thermal resistance d/(kA)", unit: "K/W", toSI: 1, siUnit: "K/W" },
    { key: "faceRise", label: "Face-to-face ΔT = P·d/(kA)", unit: "K", toSI: 1, siUnit: "K" },
    { key: "heatFlux", label: "Heat flux P/A", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "centreRise", label: "Beam centre-to-edge ΔT = P/(4πkd)", unit: "K", toSI: 1, siUnit: "K" },
    { key: "focalLength", label: "Thermal lens f = 2kA/(P·dn/dT), dn/dT term only", unit: "m", toSI: 1, siUnit: "m" },
  ],
  validate({ k, dndT }) {
    if (k > 0 && k < 0.01) return "k must be 0 (the preset) or at least 0.01 W/(m·K).";
    const ppm = dndT / PPM;
    if (ppm > DNDT_MAX_PPM && ppm < DNDT_PRESET - 0.5) return "dndT must be within ±1000 (×10⁻⁶ /K), or 1e6 for the material's preset.";
    return undefined;
  },
  compute({ material, k: kIn, dndT: dndtIn, thickness, area, power }) {
    const preset = windowThermalPreset(material as WindowMaterialId);
    const k = kIn > 0 ? kIn : preset.k;
    const dndT = dndtIn / PPM > DNDT_PRESET - 0.5 ? preset.dndtPpm * PPM : dndtIn;
    const faceRise = slabConductionRise(power, thickness, k, area);
    const f = rodThermalLens(power, k, area, dndT);
    const warnings: string[] = [];
    if (!Number.isFinite(dndT)) warnings.push("No dn/dT on the data sheet for this material: enter dndT to get a thermal lens.");
    else if (f === Infinity) warnings.push("No thermal lens: zero absorbed power or dn/dT = 0.");
    else if (f < 0) warnings.push("Negative focal length: a diverging lens (dn/dT < 0).");
    return {
      values: {
        resistance: thickness / (k * area), faceRise, heatFlux: power / area, centreRise: cylinderCentreRise(power, k, thickness), focalLength: f,
      },
      warnings,
    };
  },
  checks: [
    {
      // k = 10 W/(m·K), dn/dT = −10e-6 /K, d = 5 mm, A = 50 mm², P = 2 W: R = 0.005/(10 · 5e-5) = 10 K/W; ΔT = 2 · 10 = 20 K;
      // P/A = 2/5e-5 = 4e4 W/m² = 4 W/cm²; centre ΔT = 2/(4π · 10 · 0.005) = 3.1830989 K; f = 2 · 10 · 5e-5/(2 · −10e-6) = −50 m.
      source: KOECHNER,
      basis: "computed",
      inputs: { material: "fusedSilica", k: 10, dndT: -10, thickness: 5, area: 50, power: 2 },
      expect: { resistance: 10, faceRise: 20, heatFlux: 4, centreRise: 3.183098861837907, focalLength: -50 },
      tolerance: 1e-8,
    },
    {
      // Same geometry with dn/dT = +5e-6 /K and k = 4 W/(m·K), P = 1 W: ΔT = 1 · 0.005/(4 · 5e-5) = 25 K;
      // centre ΔT = 1/(4π · 4 · 0.005) = 3.9788736 K; f = 2 · 4 · 5e-5/(1 · 5e-6) = 80 m.
      source: KOECHNER,
      basis: "computed",
      inputs: { material: "fusedSilica", k: 4, dndT: 5, thickness: 5, area: 50, power: 1 },
      expect: { faceRise: 25, centreRise: 3.9788735772973833, focalLength: 80 },
      tolerance: 1e-8,
    },
  ],
});
