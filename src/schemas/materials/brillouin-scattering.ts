import { brillouinShift, stokesWavelength } from "../../physics/fiber-optics/fiber-nonlinear";
import {
  BRILLOUIN_MEDIA, FUSED_SILICA_BRILLOUIN, acousticWavelength, brillouinGain, phononLifetime, type BrillouinMediumId,
} from "../../physics/materials/brillouin";
import { defineSchema } from "../types";

const CUSTOM = "custom";
const DEFAULT_ID: BrillouinMediumId = "fused-silica";

const AGRAWAL = "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed., Academic Press, doi:10.1016/C2018-0-01168-8, Brillouin scattering: " +
  "ν_B = 2nv_A/λ_p, Λ = λ_p/(2n), T_B = 1/(2πΔν_B), g_B = 2πn⁷p₁₂²/(cλ_p²ρ₀v_AΔν_B); fused silica n = 1.45, v_A = 5.96 km/s, " +
  "ρ₀ = 2210 kg/m³, p₁₂ = 0.286.";
const WILLIAMS = "Williams R. J., Bai Z., Sarang S., Kitzler O., Spence D. J., Mildren R. P. (2018). Diamond Brillouin lasers. arXiv:1807.00240: " +
  "B = 2nv/λ for the longitudinal acoustic mode along [110]; with the Raman pump at 1241.42 nm a Brillouin line appeared at 1241.79 nm, " +
  "a frequency separation of 71 ± 3 GHz.";

export default defineSchema({
  href: "/materials/brillouin-scattering",
  choices: [
    {
      key: "material",
      label: "Medium (n, v_A, ρ and p₁₂ come from the preset unless it is custom)",
      options: [
        ...(Object.keys(BRILLOUIN_MEDIA) as BrillouinMediumId[]).map((id) => ({ value: id, label: BRILLOUIN_MEDIA[id].name })),
        { value: CUSTOM, label: "Custom" },
      ],
      default: DEFAULT_ID,
    },
  ],
  inputs: [
    { key: "wavelength", label: "Pump wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 5000 },
    { key: "linewidth", label: "Brillouin linewidth Δν_B (FWHM) at the pump wavelength", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 20, min: 0.1, max: 1000 },
    { key: "n", label: "Refractive index n (custom medium only)", unit: "", toSI: 1, siUnit: "", default: FUSED_SILICA_BRILLOUIN.n, min: 1, max: 5 },
    { key: "vA", label: "Acoustic velocity v_A (custom medium only)", unit: "m/s", toSI: 1, siUnit: "m/s", default: FUSED_SILICA_BRILLOUIN.vA, min: 100, max: 20000 },
    { key: "rho", label: "Density ρ (custom medium only)", unit: "kg/m³", toSI: 1, siUnit: "kg/m³", default: FUSED_SILICA_BRILLOUIN.rho, min: 100, max: 20000 },
    { key: "p12", label: "Elasto-optic coefficient p₁₂ (custom medium only)", unit: "", toSI: 1, siUnit: "", default: FUSED_SILICA_BRILLOUIN.p12, min: 0.001, max: 1 },
  ],
  outputs: [
    { key: "brillouinShift", label: "Brillouin shift ν_B = 2nv_A/λ", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "stokesWavelength", label: "Stokes wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "peakGain", label: "Peak gain g_B", unit: "m/W", toSI: 1, siUnit: "m/W" },
    { key: "acousticWavelength", label: "Acoustic wavelength Λ = λ/(2n)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "phononLifetime", label: "Phonon lifetime T_B = 1/(2πΔν_B)", unit: "ns", toSI: 1e-9, siUnit: "s" },
  ],
  compute({ material, wavelength, linewidth, n, vA, rho, p12 }) {
    const medium = material === CUSTOM || !(material in BRILLOUIN_MEDIA)
      ? (material === CUSTOM ? { n, vA, rho, p12 } : FUSED_SILICA_BRILLOUIN)
      : BRILLOUIN_MEDIA[material as BrillouinMediumId];
    const nuB = brillouinShift(wavelength, medium.vA, medium.n);
    const stokes = stokesWavelength(wavelength, nuB);
    const warnings: string[] = [];
    if (!Number.isFinite(stokes)) warnings.push("The Stokes frequency is not positive at this shift");
    return {
      values: {
        brillouinShift: nuB, stokesWavelength: stokes, peakGain: brillouinGain(wavelength, medium, linewidth),
        acousticWavelength: acousticWavelength(wavelength, medium.n), phononLifetime: phononLifetime(linewidth),
      },
      warnings,
    };
  },
  checks: [
    {
      // Fused silica at the page defaults (1550 nm, Δν_B = 20 MHz), the equations evaluated independently in scratch
      // (groupA/bril.mjs, c = 299 792 458 m/s):
      //   ν_B = 2 · 1.45 · 5960 / 1550e-9 = 11.15097 GHz,  Λ = 1550e-9/(2 · 1.45) = 0.534483 µm,
      //   T_B = 1/(2π · 20e6) = 7.95775 ns,
      //   g_B = 2π · 1.45⁷ · 0.286² / (c · (1550e-9)² · 2210 · 5960 · 20e6) = 3.65036e-11 m/W
      source: AGRAWAL,
      basis: "computed",
      inputs: {},
      expect: { brillouinShift: 11.15097, acousticWavelength: 0.534483, phononLifetime: 7.95775, peakGain: 3.65036e-11 },
      tolerance: 0.0005,
    },
    {
      // Diamond (n = 2.43, v_A = 18 280 m/s from the page's presets) pumped at 1241.42 nm: ν_B = 71.564 GHz (the paper prints
      // 71 ± 3 GHz; the 1 % tolerance is inside that), and the Stokes wavelength 1/(1/1241.42 nm − ν_B/c) = 1241.788 nm against the
      // printed 1241.79 nm (not checked: a 1 % tolerance on a wavelength would say nothing).
      source: WILLIAMS,
      basis: "printed",
      inputs: { material: "diamond", wavelength: 1241.42, linewidth: 11.9 },
      expect: { brillouinShift: 71 },
      tolerance: 0.01,
    },
  ],
});
