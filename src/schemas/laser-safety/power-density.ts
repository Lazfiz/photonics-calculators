import { beamIrradiance } from "../../physics/laser-safety/power-density";
import { defineSchema } from "../types";

const SALEH_TEICH = "Saleh B. E. A., Teich M. C. (2019). Fundamentals of Photonics, 3rd ed., Wiley, ch. 3.1 (Gaussian beam intensity " +
  "I(ρ) = I₀ exp(−2ρ²/W²), I₀ = 2P/(πW²)); the mean over the 1/e² disc is P/(πW²) with W = d/2.";

// The page keeps the beam profile in component state, not in the URL, so the API runs the page's default (Gaussian).
export default defineSchema({
  href: "/laser-safety/power-density",
  inputs: [
    { key: "power", label: "Power", unit: "W", toSI: 1, siUnit: "W", default: 1, min: 0, max: 1e9 },
    { key: "diameter", label: "1/e² diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.01, max: 1e4 },
  ],
  outputs: [
    { key: "peakIrradiance", label: "Peak irradiance (Gaussian)", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "avgIrradiance", label: "Average irradiance over the 1/e² disc", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "area", label: "Beam area π(d/2)²", unit: "cm²", toSI: 1e-4, siUnit: "m²" },
  ],
  compute({ power, diameter }) {
    const r = beamIrradiance(power, diameter, "gaussian");
    return { values: { peakIrradiance: r.peak, avgIrradiance: r.mean, area: r.area } };
  },
  checks: [
    {
      // P = 1 W, d = 1 mm: A = π(0.5 mm)² = 7.853981634e-3 cm²; mean = 1/A = 400/π = 127.3239545 W/cm²; peak = 2 × mean = 254.6479089 W/cm².
      source: SALEH_TEICH,
      basis: "computed",
      inputs: { power: 1, diameter: 1 },
      expect: { peakIrradiance: 254.6479089, avgIrradiance: 127.3239545, area: 7.853981634e-3 },
      tolerance: 1e-8,
    },
    {
      // P = 10 W, d = 2 mm: A = π(1 mm)² = 3.141592654e-2 cm²; mean = 10/A = 1000/π = 318.3098862 W/cm²; peak = 636.6197724 W/cm².
      source: SALEH_TEICH,
      basis: "computed",
      inputs: { power: 10, diameter: 2 },
      expect: { peakIrradiance: 636.6197724, avgIrradiance: 318.3098862, area: 3.141592654e-2 },
      tolerance: 1e-8,
    },
  ],
});
