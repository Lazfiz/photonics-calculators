import {
  accelerationFactor, cc1246Obscuration, centreShift, solidIndex, wetIndex,
  type CoatingMaterial, type MixingLaw,
} from "../../physics/thin-film/environmental-stability";
import { defineSchema } from "../types";

const MACLEOD = "Macleod H. A. (1988). Moisture adsorption in optical coatings, NASA Conference Publication, NTRS 19890003956, " +
  "eq. 3 (linear mixing), eq. 4 (Bragg–Pippard columns) and eq. 5 (n_v = 1 + f (n_w − 1)); a quarter-wave stack's band " +
  "centre scales with its optical thickness Σ n d.";
const PECK = "Peck D. S. (1986). Comprehensive model for humidity testing correlation, Proc. 24th IEEE Int. Reliability Physics Symp., " +
  "44–50, doi:10.1109/IRPS.1986.362110: AF = (RH_test/RH_use)^n exp[(E_a/k_B)(1/T_use − 1/T_test)] (n = 0: Arrhenius). Equation number not quoted.";

const T0_C = 25; // reference temperature of the entered indices, °C
const KELVIN = 273.15;
const HOURS_PER_YEAR = 8766;
const LAWS = [
  { value: "linear", label: "Linear (eq. 3)" },
  { value: "bragg-pippard", label: "Bragg–Pippard columns (eq. 4)" },
] as const;
const lawOf = (x: string): MixingLaw => (x === "bragg-pippard" ? "bragg-pippard" : "linear");

export default defineSchema({
  href: "/thin-film/environmental-stability",
  inputs: [
    { key: "nH", label: "n_H, dry", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1, max: 5 },
    { key: "nL", label: "n_L, dry", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 1, max: 5 },
    { key: "nSub", label: "Substrate index (spectrum chart only; no output depends on it)", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 5 },
    { key: "nInc", label: "Incident-medium index (spectrum chart only; no output depends on it)", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 5 },
    { key: "numPairs", label: "Number of pairs N (spectrum chart only; no output depends on it)", unit: "", toSI: 1, siUnit: "", default: 5, min: 1, max: 50 },
    { key: "designWl", label: "Design wavelength λ₀", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 2000 },
    { key: "tempC", label: "Temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 75, min: -50, max: 200 },
    { key: "fill", label: "Pore volume filled with water", unit: "%", toSI: 0.01, siUnit: "", default: 100, min: 0, max: 100 },
    { key: "pH", label: "Packing density p_H", unit: "", toSI: 1, siUnit: "", default: 0.85, min: 0.5, max: 1 },
    { key: "pL", label: "Packing density p_L", unit: "", toSI: 1, siUnit: "", default: 0.85, min: 0.5, max: 1 },
    { key: "dndtH", label: "dn_H/dT", unit: "1e-6/K", toSI: 1e-6, siUnit: "1/K", default: 20, min: -1000, max: 1000 },
    { key: "dndtL", label: "dn_L/dT", unit: "1e-6/K", toSI: 1e-6, siUnit: "1/K", default: 12.9, min: -1000, max: 1000 },
    { key: "cteH", label: "Expansion α_H", unit: "1e-6/K", toSI: 1e-6, siUnit: "1/K", default: 8, min: -100, max: 100 },
    { key: "cteL", label: "Expansion α_L", unit: "1e-6/K", toSI: 1e-6, siUnit: "1/K", default: 0.55, min: -100, max: 100 },
    { key: "level", label: "CC1246 cleanliness level", unit: "µm", toSI: 1e-6, siUnit: "m", default: 300, min: 1, max: 2000 },
    { key: "surfaces", label: "Contaminated surfaces in the path (rounded to a whole number)", unit: "", toSI: 1, siUnit: "", default: 2, min: 1, max: 100 },
    { key: "tUse", label: "Use temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 25, min: -60, max: 300 },
    { key: "tTest", label: "Test temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 85, min: -60, max: 300 },
    { key: "ea", label: "Activation energy E_a", unit: "eV", toSI: 1, siUnit: "eV", default: 0.7, min: 0, max: 3 },
    { key: "rhUse", label: "Use humidity", unit: "% RH", toSI: 1, siUnit: "% RH", default: 50, min: 1, max: 100 },
    { key: "rhTest", label: "Test humidity", unit: "% RH", toSI: 1, siUnit: "% RH", default: 85, min: 1, max: 100 },
    { key: "rhExp", label: "Humidity exponent n (0 = Arrhenius only)", unit: "", toSI: 1, siUnit: "", default: 0, min: 0, max: 10 },
    { key: "testHours", label: "Test duration", unit: "h", toSI: 3600, siUnit: "s", default: 1000, min: 0, max: 1e7 },
  ],
  choices: [
    { key: "lawH", label: "H layer mixing law", options: LAWS, default: "linear" },
    { key: "lawL", label: "L layer mixing law", options: LAWS, default: "linear" },
  ],
  outputs: [
    { key: "shiftWet", label: "Band-centre shift, moisture", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "shiftHot", label: "Band-centre shift, temperature (dry)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "shiftBoth", label: "Combined band-centre shift", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "shiftBothPct", label: "Combined shift Δλ/λ₀", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "wetH", label: "n_H with the pores filled", unit: "", toSI: 1, siUnit: "" },
    { key: "wetL", label: "n_L with the pores filled", unit: "", toSI: 1, siUnit: "" },
    { key: "solidH", label: "Solid-column index n_s,H", unit: "", toSI: 1, siUnit: "" },
    { key: "solidL", label: "Solid-column index n_s,L", unit: "", toSI: 1, siUnit: "" },
    { key: "obscuration", label: "Obscured area per surface", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "transmission", label: "Geometric transmission", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "accelerationFactor", label: "Acceleration factor", unit: "", toSI: 1, siUnit: "" },
    { key: "equivalentHours", label: "Equivalent time in use", unit: "h", toSI: 3600, siUnit: "s" },
    { key: "equivalentYears", label: "Equivalent time in use", unit: "years", toSI: HOURS_PER_YEAR * 3600, siUnit: "s" },
  ],
  compute(si) {
    // Same glue as the page: °C → ΔT from 25 °C and K, the input ranges are the page's clamps.
    const H: CoatingMaterial = { n: si.nH, p: si.pH, law: lawOf(si.lawH), dnDT: si.dndtH, cte: si.cteH };
    const L: CoatingMaterial = { n: si.nL, p: si.pL, law: lawOf(si.lawL), dnDT: si.dndtL, cte: si.cteL };
    const lambda0 = si.designWl, fill = si.fill, dT = si.tempC - T0_C;
    const shiftWet = centreShift(H, L, lambda0, 0, fill);
    const shiftHot = centreShift(H, L, lambda0, dT, 0);
    const shiftBoth = centreShift(H, L, lambda0, dT, fill);
    const solidH = solidIndex(H.n, H.p, H.law), solidL = solidIndex(L.n, L.p, L.law);
    const surfaces = Math.round(si.surfaces);
    const obscuration = cc1246Obscuration(si.level * 1e6);
    const af = accelerationFactor(si.ea, si.tUse + KELVIN, si.tTest + KELVIN, si.rhUse, si.rhTest, si.rhExp);
    const warnings: string[] = [];
    for (const [name, m, sol] of [["H", H, solidH], ["L", L, solidL]] as const) {
      if (m.law === "bragg-pippard" && !Number.isFinite(sol)) {
        warnings.push(`${name} layer: the packing density p = ${m.p} is too low for a film index of ${m.n} under Bragg–Pippard (it needs n² < (1 + p)/(1 − p)), so there is no solid-column index and the moisture and shift results are blank. Raise p or use the linear law.`);
      }
    }
    return {
      values: {
        shiftWet, shiftHot, shiftBoth, shiftBothPct: shiftBoth / lambda0,
        wetH: wetIndex(H.n, H.p, fill, H.law), wetL: wetIndex(L.n, L.p, fill, L.law), solidH, solidL,
        obscuration, transmission: (1 - obscuration) ** surfaces,
        accelerationFactor: af, equivalentHours: af * si.testHours, equivalentYears: af * si.testHours,
      },
      warnings,
    };
  },
  checks: [
    {
      // Linear law, p = 0.85, dry indices 2.35 / 1.45, pores 100 % water-filled (n_w = 1.333, so n_v = 1.333):
      // n_s,H = (2.35 − 0.15)/0.85 = 2.588235, n_s,L = (1.45 − 0.15)/0.85 = 1.529412;
      // wet n_H = 0.85 · 2.588235 + 0.15 · 1.333 = 2.39995, wet n_L = 1.3 + 0.19995 = 1.49995.
      // Band centre ∝ Σ n d with d = λ₀/(4 n_dry): Δλ = λ₀ [½ (2.39995/2.35 + 1.49995/1.45) − 1] = 550 · 0.0278518 = 15.3185 nm.
      source: MACLEOD,
      basis: "computed",
      inputs: { tempC: 25, fill: 100 },
      expect: { solidH: 2.588235294117647, solidL: 1.5294117647058825, wetH: 2.39995, wetL: 1.49995, shiftWet: 15.31848862802643, shiftBoth: 15.31848862802643 },
      tolerance: 1e-8,
    },
    {
      // Dry, 75 °C (ΔT = 50 K), no water: each layer's optical thickness scales by (1 + (dn/dT)ΔT/n)(1 + αΔT):
      // Δλ = λ₀ [½ Σ_{H,L} (n + dn/dT ΔT)(1 + αΔT)/n − 1] = 550 · 6.4902e-4 = 0.356962 nm.
      source: MACLEOD,
      basis: "computed",
      inputs: { fill: 0 },
      expect: { shiftHot: 0.356961535321898, shiftBoth: 0.356961535321898 },
      tolerance: 1e-8,
    },
    {
      // Arrhenius–Peck, n = 0, E_a = 0.7 eV, 25 °C → 85 °C: AF = exp[(0.7/8.617333e-5)(1/298.15 − 1/358.15)] = 95.9978;
      // 1000 h test = 95 997.8 h.
      source: PECK,
      basis: "computed",
      inputs: {},
      expect: { accelerationFactor: 95.99784604708066, equivalentHours: 95997.84604708066 },
      tolerance: 1e-8,
    },
  ],
});
