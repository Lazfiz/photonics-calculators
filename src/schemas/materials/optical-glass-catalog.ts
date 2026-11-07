import {
  LAMBDA_C, LAMBDA_D, LAMBDA_F, SCHOTT_DNDT_RANGE_C, SCHOTT_DNDT_RANGE_NM, abbeNumber, inRange, refractiveIndex, schottDeltaN, schottDnDt,
} from "../../physics/materials/sellmeier";
import { MATERIALS, SCHOTT_GLASSES, type DispersionMaterial, type GlassId } from "../../physics/materials/sellmeier-data";
import { defineSchema } from "../types";

const GLASS_IDS = Object.keys(SCHOTT_GLASSES) as GlassId[];
const DEFAULT_SELECTION = "N-BK7,N-SF11,N-LAK9,N-FK5";
const [T_MIN_C, T_MAX_C] = SCHOTT_DNDT_RANGE_C;

// The page's Abbe-number list: every set whose fit range covers the F and C lines.
const ABBE_OPTIONS: Record<string, DispersionMaterial> = Object.fromEntries(
  Object.entries({ ...SCHOTT_GLASSES, ...MATERIALS }).filter(([, m]) => inRange(m.model, LAMBDA_F) && inRange(m.model, LAMBDA_C)),
);

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

const SCHOTT = "SCHOTT AG (2017). Optical glass data sheets / catalog (Zemax AGF 2017-01-20): Sellmeier formula " +
  "n²(λ) − 1 = Σ Bᵢλ²/(λ² − Cᵢ), λ in µm, with the N-BK7 constants B₁ 1.03961212, B₂ 0.231792344, B₃ 1.01046945, " +
  "C₁ 0.00600069867, C₂ 0.0200179144, C₃ 103.560653 µm²; Abbe number V_d = (n_d − 1)/(n_F − n_C) with n_d at 587.5618 nm, " +
  "n_F at 486.1327 nm, n_C at 656.2725 nm (constants as in the refractiveindex.info database, specs/schott/optical/N-BK7.yml; " +
  "catalog n_d 1.51680, V_d 64.17 and N-SF11 n_d 1.78472, V_d 25.68 from the SCHOTT data sheets).";
const TIE19 = "SCHOTT AG (2017). TIE-19: Temperature coefficient of the refractive index (absolute dn/dT, in vacuum): " +
  "dn_abs/dT = (n² − 1)/(2n) · (D₀ + 2D₁ΔT + 3D₂ΔT² + (E₀ + 2E₁ΔT)/(λ² − λ_TK²)), ΔT = T − 20 °C, λ in µm; " +
  "N-BK7 D₀ 1.86e-6, D₁ 1.31e-8, D₂ −1.37e-11, E₀ 4.34e-7, E₁ 6.27e-10, λ_TK 0.17 µm (N-BK7 data sheet).";

export default defineSchema({
  href: "/materials/optical-glass-catalog",
  choices: [
    {
      key: "glasses",
      label: "Glasses plotted in the two overview charts (display only; no effect on the outputs)",
      options: [
        { value: DEFAULT_SELECTION, label: "N-BK7, N-SF11, N-LAK9, N-FK5" },
        ...GLASS_IDS.map((id) => ({ value: id, label: SCHOTT_GLASSES[id].name })),
      ],
      default: DEFAULT_SELECTION,
    },
    {
      key: "material",
      label: "Material for the Abbe number",
      options: Object.entries(ABBE_OPTIONS).map(([value, m]) => ({ value, label: m.name })),
      default: "N-BK7",
    },
    {
      key: "glass",
      label: "Glass for dn/dT",
      options: GLASS_IDS.map((id) => ({ value: id, label: SCHOTT_GLASSES[id].name })),
      default: "N-BK7",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength (inside the chosen glass's formula range)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 546.07, min: 260, max: 2500 },
    { key: "baseTemp", label: "Temperature T₀", unit: "°C", toSI: 1, siUnit: "°C", default: 20, min: T_MIN_C, max: T_MAX_C },
    { key: "deltaT", label: "Temperature change ΔT", unit: "K", toSI: 1, siUnit: "K", default: 50, min: T_MIN_C - T_MAX_C, max: T_MAX_C - T_MIN_C },
  ],
  outputs: [
    { key: "nF", label: "n_F (486.13 nm)", unit: "", toSI: 1, siUnit: "" },
    { key: "nd", label: "n_d (587.56 nm)", unit: "", toSI: 1, siUnit: "" },
    { key: "nC", label: "n_C (656.27 nm)", unit: "", toSI: 1, siUnit: "" },
    { key: "abbe", label: "Abbe number V_d from the formula", unit: "", toSI: 1, siUnit: "" },
    { key: "catalogAbbe", label: "Catalog Abbe number V_d (SCHOTT glasses only)", unit: "", toSI: 1, siUnit: "" },
    { key: "n20", label: "n at 20 °C (catalog formula, relative to air)", unit: "", toSI: 1, siUnit: "" },
    { key: "dndt0", label: "dn/dT at T₀ (absolute, vacuum)", unit: "×10⁻⁶/K", toSI: 1e-6, siUnit: "1/K" },
    { key: "deltaN", label: "Δn from T₀ to T₀ + ΔT (absolute, vacuum)", unit: "", toSI: 1, siUnit: "" },
    { key: "meanDnDt", label: "Mean dn/dT over ΔT", unit: "×10⁻⁶/K", toSI: 1e-6, siUnit: "1/K" },
  ],
  validate({ glass, wavelength }) {
    const [lo, hi] = SCHOTT_GLASSES[glass as GlassId].model.range;
    if (wavelength < lo || wavelength > hi) {
      return `wavelength must lie in ${(lo * 1e9).toFixed(0)}–${(hi * 1e9).toFixed(0)} nm for ${glass}`;
    }
    return undefined;
  },
  compute({ material, glass, wavelength, baseTemp, deltaT }) {
    const m = ABBE_OPTIONS[material];
    const g = SCHOTT_GLASSES[glass as GlassId];
    const T1 = clamp(baseTemp + deltaT, T_MIN_C, T_MAX_C);
    const dn = schottDeltaN(g.model, g.thermal, wavelength, T1) - schottDeltaN(g.model, g.thermal, wavelength, baseTemp);
    const warnings: string[] = [];
    if (T1 !== baseTemp + deltaT) warnings.push(`T₀ + ΔT is held at ${T1} °C, the end of the TIE-19 range (${T_MIN_C} to +${T_MAX_C} °C).`);
    if (T1 === baseTemp) warnings.push("ΔT is zero after clamping: no mean dn/dT.");
    if (wavelength < SCHOTT_DNDT_RANGE_NM[0] * 1e-9 || wavelength > SCHOTT_DNDT_RANGE_NM[1] * 1e-9) {
      warnings.push(`The wavelength is outside ${SCHOTT_DNDT_RANGE_NM[0]}–${SCHOTT_DNDT_RANGE_NM[1]} nm, where SCHOTT states the dn/dT constants valid: the formula is extrapolated.`);
    }
    if (!(material in SCHOTT_GLASSES)) warnings.push("No catalog Abbe number: the material is not a SCHOTT glass.");
    return {
      values: {
        nF: refractiveIndex(m.model, LAMBDA_F),
        nd: refractiveIndex(m.model, LAMBDA_D),
        nC: refractiveIndex(m.model, LAMBDA_C),
        abbe: abbeNumber(m.model),
        catalogAbbe: material in SCHOTT_GLASSES ? SCHOTT_GLASSES[material as GlassId].vd : NaN,
        n20: refractiveIndex(g.model, wavelength),
        dndt0: schottDnDt(g.model, g.thermal, wavelength, baseTemp),
        deltaN: dn,
        meanDnDt: T1 === baseTemp ? NaN : dn / (T1 - baseTemp),
      },
      warnings,
    };
  },
  checks: [
    {
      // N-BK7 Sellmeier at the F, d and C lines: n_d = 1.51680003 (catalog 1.5168), n_F = 1.52237629, n_C = 1.51432235,
      // V_d = (1.51680003 − 1)/(1.52237629 − 1.51432235) = 64.167336 (catalog 64.17).
      source: SCHOTT,
      basis: "computed",
      inputs: { material: "N-BK7" },
      expect: { nF: 1.5223762897312285, nd: 1.5168000345005885, nC: 1.5143223472613747, abbe: 64.1673362374998 },
      tolerance: 1e-8,
    },
    {
      // N-BK7 at 546.07 nm, T₀ = 20 °C, ΔT = 50 K: n = 1.51872218; dn/dT = (n² − 1)/(2n)(D₀ + E₀/(λ² − λ_TK²)) = 1.4932767e-6 K⁻¹;
      // Δn(20 → 70 °C) = (n² − 1)/(2n)(D₀ΔT + D₁ΔT² + D₂ΔT³ + (E₀ΔT + E₁ΔT²)/(λ² − λ_TK²)) = 9.0517955e-5, mean 1.8103591e-6 K⁻¹.
      source: TIE19,
      basis: "computed",
      inputs: { glass: "N-BK7", wavelength: 546.07, baseTemp: 20, deltaT: 50 },
      expect: { n20: 1.5187221769153783, dndt0: 1.493276686955729, deltaN: 0.00009051795514995251, meanDnDt: 1.8103591029990505 },
      tolerance: 1e-8,
    },
    {
      // N-SF11 at 587.5618 nm, T₀ = 20 °C, ΔT = −100 K (to −80 °C): n_d = 1.78471994 (catalog 1.78472), V_d = 25.679998 (catalog 25.68),
      // dn/dT(20 °C) = 0.10337114e-6 K⁻¹, Δn = 9.2906773e-5.
      source: TIE19,
      basis: "computed",
      inputs: { material: "N-SF11", glass: "N-SF11", wavelength: 587.5618, baseTemp: 20, deltaT: -100 },
      expect: { nd: 1.78471994231005, abbe: 25.679997835090447, dndt0: 0.10337113993350977, deltaN: 0.00009290677288862708 },
      tolerance: 1e-8,
    },
  ],
});
