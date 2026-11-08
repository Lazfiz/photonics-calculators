import { extendedSourceLimits } from "../../physics/laser-safety/eye-exposure-limits";
import { defineSchema } from "../types";
import { ICNIRP_2013 } from "./common";

const TABLES = `${ICNIRP_2013}. Tables 2, 4 and 5 (C_E, α_max, T₂, retinal thermal limit). ` +
  "https://doi.org/10.1097/HP.0b013e3182983fd4";

export default defineSchema({
  href: "/laser-safety/extended-source",
  inputs: [
    { key: "wavelength", label: "Wavelength (400–1400 nm)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 400, max: 1399 },
    { key: "alpha", label: "Source subtense α", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 50, min: 0, max: 1000 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 10, min: 1e-9, max: 30000 },
  ],
  outputs: [
    { key: "ce", label: "C_E at t", unit: "", toSI: 1, siUnit: "" },
    { key: "alphaMax", label: "α_max(t)", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "t2", label: "T₂", unit: "s", toSI: 1, siUnit: "s" },
    { key: "pointLimit", label: "Point-source thermal limit", unit: "J/m²", toSI: 1, siUnit: "J/m²" },
    { key: "extendedLimit", label: "Extended-source thermal limit", unit: "J/m²", toSI: 1, siUnit: "J/m²" },
    { key: "limitRatio", label: "Extended / point limit", unit: "", toSI: 1, siUnit: "" },
    { key: "pointPower", label: "Point-source limit as power through 7 mm", unit: "W", toSI: 1, siUnit: "W" },
    { key: "extendedPower", label: "Extended-source limit as power through 7 mm", unit: "W", toSI: 1, siUnit: "W" },
  ],
  compute({ wavelength, alpha, exposureTime }) {
    const r = extendedSourceLimits(wavelength, alpha, exposureTime);
    return {
      values: {
        ce: r.ce, alphaMax: r.aMax, t2: r.T2, pointLimit: r.hPoint, extendedLimit: r.hExt,
        limitRatio: r.hExt / r.hPoint, pointPower: r.pPoint, extendedPower: r.pExt,
      },
    };
  },
  checks: [
    {
      // 1064 nm: C_A = 5 (above 1050 nm), C_C = 1, k = 90 C_C; α = 50 mrad, t = 10 s.
      // α_max(10 s) = 100 mrad, so C_E = 50/1.5 = 33.3333; T₂ = 10·10^((50 − 1.5)/98.5) = 31.07318615 s > t.
      // Point source from 10 s: 10 C_A C_C t = 10·5·10 = 500 J/m². Extended: 90 C_E t^0.75 = 3000·10^0.75 = 16870.23976 J/m²
      // (ratio 33.74047951). Power of the 50 W/m² point limit through 7 mm: 50·π/4·(7e-3)² = 1.924225500e-3 W;
      // extended, least H/t at t = 10: 3000·10^−0.25·π/4·(7e-3)² = 64.9242911e-3 W.
      source: TABLES,
      basis: "computed",
      inputs: { wavelength: 1064, alpha: 50, exposureTime: 10 },
      expect: {
        ce: 33.33333333, alphaMax: 100, t2: 31.07318615, pointLimit: 500, extendedLimit: 16870.23976,
        limitRatio: 33.74047951, pointPower: 1.924225500e-3, extendedPower: 0.0649242911,
      },
      tolerance: 1e-8,
    },
  ],
});
