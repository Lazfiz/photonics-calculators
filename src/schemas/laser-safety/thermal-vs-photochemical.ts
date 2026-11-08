import { thermalVsPhotochemical } from "../../physics/laser-safety/eye-exposure-limits";
import { defineSchema } from "../types";
import { ICNIRP_2013 } from "./common";

const TABLES = `${ICNIRP_2013}. Tables 2–5 (retinal thermal and photochemical limits, C_B, C_E, T₂). ` +
  "https://doi.org/10.1097/HP.0b013e3182983fd4";

export default defineSchema({
  href: "/laser-safety/thermal-vs-photochemical",
  inputs: [
    { key: "wavelength", label: "Wavelength (400–600 nm)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 450, min: 400, max: 600 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 100, min: 1e-6, max: 30000 },
    { key: "alpha", label: "Source subtense α", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 1.5, min: 0, max: 1000 },
  ],
  outputs: [
    { key: "thermalLimit", label: "Thermal limit at t", unit: "J/m²", toSI: 1, siUnit: "J/m²" },
    { key: "photochemicalLimit", label: "Photochemical limit at t (applies from 10 s)", unit: "J/m²", toSI: 1, siUnit: "J/m²" },
    { key: "thermalPower", label: "Thermal limit as power through 7 mm", unit: "W", toSI: 1, siUnit: "W" },
    { key: "photochemicalPower", label: "Photochemical limit as power through 7 mm", unit: "W", toSI: 1, siUnit: "W" },
    { key: "photochemicalGoverns", label: "1 if the photochemical limit governs at t, else 0", unit: "", toSI: 1, siUnit: "" },
    { key: "crossover", label: "Photochemical governs from", unit: "s", toSI: 1, siUnit: "s" },
  ],
  compute({ wavelength, exposureTime, alpha }) {
    const r = thermalVsPhotochemical(wavelength, alpha, exposureTime);
    const warnings: string[] = [];
    if (!Number.isFinite(r.hPh)) warnings.push("The photochemical limit applies from 10 s only (none from 600 nm).");
    if (!Number.isFinite(r.crossover)) warnings.push("The thermal limit stays lower up to 30 000 s: no crossover.");
    return {
      values: {
        thermalLimit: r.hTh, photochemicalLimit: r.hPh, thermalPower: r.pTh, photochemicalPower: r.pPh,
        photochemicalGoverns: r.governing === "retinalPhotochemical" ? 1 : 0, crossover: r.crossover,
      },
      warnings: warnings.length ? warnings : undefined,
    };
  },
  checks: [
    {
      // 450 nm, point source (α = 1.5 mrad), t = 100 s. Thermal: 10 C_A C_C t = 10·1·1·100 = 1000 J/m² (10 W/m²);
      // through 7 mm: 10·π/4·(7e-3)² = 3.848451001e-4 W. Photochemical (C_B = 1 at 450 nm): 100 C_B = 100 J/m²
      // (1 W/m², 3.848451001e-5 W). The lower governs; the photochemical limit takes over at T₁ = 10 s.
      source: TABLES,
      basis: "computed",
      inputs: { wavelength: 450, exposureTime: 100, alpha: 1.5 },
      expect: {
        thermalLimit: 1000, photochemicalLimit: 100, thermalPower: 3.848451001e-4, photochemicalPower: 3.848451001e-5,
        photochemicalGoverns: 1, crossover: 10,
      },
      tolerance: 1e-8,
    },
    {
      // 550 nm, α = 20 mrad, t = 1 s (below 10 s: no photochemical limit): α_max(1 s) = 100 mrad, C_E = 20/1.5 = 13.3333,
      // T₂ = 10·10^((20 − 1.5)/98.5) = 15.4 s > t, so H = 18 C_E t^0.75 = 18·13.3333 = 240 J/m².
      source: TABLES,
      basis: "computed",
      inputs: { wavelength: 550, exposureTime: 1, alpha: 20 },
      expect: { thermalLimit: 240 },
      tolerance: 1e-8,
    },
  ],
});
