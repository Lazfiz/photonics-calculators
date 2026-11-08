import { AMBIENT_C, FILTER_MATERIALS, filterTemperatureRise, timeToTemperatureRise, type FilterMaterialKey, type HeatDeposition } from "../../physics/laser-safety/filter-heating";
import { defineSchema } from "../types";

const CARSLAW_JAEGER = "Carslaw H. S., Jaeger J. C. (1959). Conduction of Heat in Solids, 2nd ed., Oxford University Press: " +
  "Gaussian source on an insulated plate. Even through the thickness: ΔT = P/(4πKL)·ln(1 + 8κt/w²); at the face of a half-space: " +
  "ΔT = √2 P/(π^1.5 K w)·arctan(√(8κt)/w) (Lax, J. Appl. Phys. 48, 3919 (1977), doi:10.1063/1.324265); w = d/2, κ = K/(ρc).";

export default defineSchema({
  href: "/laser-safety/thermal-lens-hazard",
  choices: [
    {
      key: "material",
      label: "Filter or lens material",
      options: (Object.keys(FILTER_MATERIALS) as FilterMaterialKey[]).map((k) => ({ value: k, label: FILTER_MATERIALS[k].label })),
      default: "polycarbonate",
    },
    {
      key: "deposition",
      label: "The power is absorbed",
      options: [
        { value: "surface", label: "near the front face (absorbing filter)" },
        { value: "volume", label: "evenly through the thickness (weak absorber)" },
      ],
      default: "surface",
    },
  ],
  inputs: [
    { key: "power", label: "Laser power on the filter", unit: "mW", toSI: 1e-3, siUnit: "W", default: 2000, min: 0, max: 1e9 },
    { key: "beamDiameter", label: "Beam diameter on the filter, 1/e²", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.001, max: 1e4 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 5, min: 1e-9, max: 30000 },
    { key: "absorption", label: "Fraction of the power absorbed", unit: "", toSI: 1, siUnit: "", default: 0.95, min: 0, max: 1 },
    { key: "thickness", label: "Thickness", unit: "mm", toSI: 1e-3, siUnit: "m", default: 3, min: 0.01, max: 1e3 },
  ],
  outputs: [
    { key: "temperatureRise", label: "Temperature rise at the beam centre after the exposure time", unit: "K", toSI: 1, siUnit: "K" },
    { key: "timeToTg", label: "Time to reach the glass transition temperature", unit: "s", toSI: 1, siUnit: "s" },
    { key: "maxAbsorbedPower", label: "Largest absorbed power for the exposure time", unit: "W", toSI: 1, siUnit: "W" },
    { key: "meanIrradiance", label: "Mean irradiance on the filter, P/(πd²/4)", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
  ],
  compute({ material, deposition, power, beamDiameter, exposureTime, absorption, thickness }) {
    // Same glue as the page: absorbed power into the plate, rise from the T_g margin over 25 °C.
    const m = FILTER_MATERIALS[material as FilterMaterialKey];
    const kind = deposition as HeatDeposition;
    const pAbs = power * absorption;
    const dTAllowed = m.tg - AMBIENT_C;
    const dT = filterTemperatureRise(pAbs, beamDiameter, thickness, exposureTime, m, kind);
    const tSoft = timeToTemperatureRise(dTAllowed, pAbs, beamDiameter, thickness, m, kind);
    const warnings: string[] = [];
    if (tSoft === Infinity) warnings.push("The filter stays below its glass transition for 30 000 s: no softening time.");
    if (!(dT > 0)) warnings.push("No power is absorbed: the filter does not heat and any absorbed power is allowed.");
    return {
      values: {
        temperatureRise: dT,
        timeToTg: tSoft,
        maxAbsorbedPower: dT > 0 ? (pAbs * dTAllowed) / dT : Infinity,
        meanIrradiance: power / ((Math.PI * beamDiameter * beamDiameter) / 4),
      },
      warnings,
    };
  },
  checks: [
    {
      // 1 W absorbed (1000 mW, fraction 1), d = 5 mm (w = 2.5 mm), L = 3 mm, polycarbonate K = 0.2 W/(m·K), ρ = 1200 kg/m³,
      // c_p = 1200 J/(kg·K): κ = 1.388889e-7 m²/s. Even absorption, t = 10 s: 8κt/w² = 1.777778; ln(2.777778) = 1.0216512;
      // P/(4πKL) = 1/(4π·0.2·0.003) = 132.62912 K; ΔT = 135.500705 K. Mean irradiance 4/(π·0.005²) = 50929.58 W/m² = 5.092958 W/cm².
      source: CARSLAW_JAEGER,
      basis: "computed",
      inputs: { power: 1000, absorption: 1, beamDiameter: 5, thickness: 3, exposureTime: 10, material: "polycarbonate", deposition: "volume" },
      expect: { temperatureRise: 135.50070513, meanIrradiance: 5.092958179 },
      tolerance: 1e-8,
    },
    {
      // Same plate with the power absorbed at the face, t = 1 s (before the back face matters: t < L²/(40κ) = 1.62 s):
      // √(8κt)/w = √(1.111111e-6)/2.5e-3 = 0.421637; ΔT = √2·1/(π^1.5·0.2·2.5e-3)·arctan(0.421637) = 507.95 K · 0.39903 = 202.6812 K.
      source: CARSLAW_JAEGER,
      basis: "computed",
      inputs: { power: 1000, absorption: 1, beamDiameter: 5, thickness: 3, exposureTime: 1, material: "polycarbonate", deposition: "surface" },
      expect: { temperatureRise: 202.68119951 },
      tolerance: 1e-8,
    },
  ],
});
