import {
  HEAT_CAPACITY_MATERIALS, heatInput, scaledHeatCapacity, type HeatCapacityMaterialId,
} from "../../physics/materials/heat-capacity";
import { defineSchema } from "../types";

const IDS = Object.keys(HEAT_CAPACITY_MATERIALS) as HeatCapacityMaterialId[];
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const KITTEL = "Kittel C. (2005). Introduction to Solid State Physics, 8th ed., Wiley, ch. 5; Debye P. (1912), Ann. Phys. 344, 789, " +
  "doi:10.1002/andp.19123441404: C_V/(3Nk_B) = D(x) = (3/x³)∫₀ˣ t⁴eᵗ/(eᵗ − 1)² dt, x = θ_D/T; D → (4π⁴/5)(T/θ_D)³ for T ≪ θ_D. " +
  "Scaled to a measured value c_p(T) = c_ref D(θ_D/T)/D(θ_D/T_ref); Si c_p 20.007 J/(mol·K) at 298.15 K (Desai P. D. (1986), " +
  "J. Phys. Chem. Ref. Data 15, 967, doi:10.1063/1.555761, Table 4), θ_D 645 K (Råsander M., Moram M. A. (2015), J. Chem. Phys. 143, " +
  "144104, doi:10.1063/1.4932334, Table VII).";

export default defineSchema({
  href: "/materials/heat-capacity",
  choices: [
    {
      key: "material",
      label: "Material",
      options: IDS.map((id) => ({ value: id as string, label: HEAT_CAPACITY_MATERIALS[id].name })),
      default: "si",
    },
  ],
  inputs: [
    { key: "cRef", label: "c_p at the material's reference temperature (0 = the preset)", unit: "J/(kg·K)", toSI: 1, siUnit: "J/(kg·K)", default: 0, min: 0, max: 1e4 },
    { key: "thetaD", label: "Debye temperature θ_D (0 = the preset)", unit: "K", toSI: 1, siUnit: "K", default: 0, min: 0, max: 5000 },
    { key: "density", label: "Density (0 = the preset)", unit: "g/cm³", toSI: 1e3, siUnit: "kg/m³", default: 0, min: 0, max: 25 },
    { key: "temp", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 1, max: 1000 },
    { key: "mass", label: "Mass", unit: "g", toSI: 1e-3, siUnit: "kg", default: 10, min: 0, max: 1e6 },
    { key: "t1", label: "From T₁", unit: "K", toSI: 1, siUnit: "K", default: 293.15, min: 1, max: 1000 },
    { key: "t2", label: "To T₂", unit: "K", toSI: 1, siUnit: "K", default: 473.15, min: 1, max: 1000 },
  ],
  outputs: [
    { key: "cp", label: "Specific heat c_p(T)", unit: "J/(g·K)", toSI: 1e3, siUnit: "J/(kg·K)" },
    { key: "volumetric", label: "Volumetric ρ·c_p", unit: "MJ/(m³·K)", toSI: 1e6, siUnit: "J/(m³·K)" },
    { key: "heat", label: "Heat T₁ → T₂, m ∫ c_p dT", unit: "J", toSI: 1, siUnit: "J" },
    { key: "meanCp", label: "Mean c_p over T₁–T₂", unit: "J/(g·K)", toSI: 1e3, siUnit: "J/(kg·K)" },
  ],
  compute({ material, cRef, thetaD, density, temp, mass, t1, t2 }) {
    const mat = HEAT_CAPACITY_MATERIALS[material as HeatCapacityMaterialId];
    // The page's own handling: a value of 0 means the preset; others are clamped to the input's range (c_p 1–1e4, θ_D 10–5000, ρ 0.1–25 g/cm³).
    const cRefInput = cRef > 0 ? cRef : Number(mat.cRef.toFixed(1));
    const thetaInput = thetaD > 0 ? thetaD : mat.thetaD;
    const rhoInput = density > 0 ? density : mat.density;
    const c = clamp(cRefInput, 1, 1e4, mat.cRef);
    const theta = clamp(thetaInput, 10, 5000, mat.thetaD);
    const rho = clamp(rhoInput, 100, 25000, 2330);
    const cp = scaledHeatCapacity(c, mat.tRef, theta, temp);
    const q = heatInput(c, mat.tRef, theta, mass, t1, t2);
    const meanCp = t1 === t2 ? NaN : q / (mass * (t2 - t1));
    const warnings: string[] = [];
    if (t1 === t2) warnings.push("T₁ = T₂: no mean specific heat.");
    else if (!(mass > 0)) warnings.push("Zero mass: no mean specific heat.");
    return { values: { cp, volumetric: rho * cp, heat: q, meanCp }, warnings };
  },
  checks: [
    {
      // Si preset (c_ref = 20.007 J/(mol·K) / 28.0855 g/mol = 712.36047 J/(kg·K), which the page rounds to 712.4 in its input, at 298.15 K, θ_D = 645 K, ρ = 2330 kg/m³) at
      // T = 300 K, 10 g from 293.15 to 473.15 K. D(x) integrated independently (composite Simpson, 20 000 intervals):
      // with c_ref = 712.4: c_p(300 K) = 714.26583 J/(kg·K); ρ c_p = 1.664239 MJ/(m³·K); Q = m ∫ c_p dT = 1387.3584 J; mean c_p = 770.75469 J/(kg·K) (each 712.4/712.36047 times the unrounded-c_ref value).
      source: KITTEL,
      basis: "computed",
      inputs: { material: "si" },
      expect: { cp: 0.7142658314521277, volumetric: 1.6642393872834578, heat: 1387.3584494054114, meanCp: 0.7707546941141176 },
      tolerance: 1e-7,
    },
    {
      // Debye T³ regime: T = 2 K ≪ θ_D = 645 K, so D(x) = (4π⁴/5)(T/θ_D)³ at x = 322.5; scaled by 1/D(645/298.15) (integrated
      // independently) and c_ref = 712.4 J/(kg·K): c_p(2 K) = 2.0685360e-3 J/(kg·K) = 2.0685360e-6 J/(g·K).
      source: KITTEL,
      basis: "computed",
      inputs: { material: "si", temp: 2 },
      expect: { cp: 0.000002068535974517318 },
      tolerance: 1e-6,
    },
  ],
});
