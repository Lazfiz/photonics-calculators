import {
  ACOUSTO_OPTIC, accessTime, braggAngle, braggEfficiency, fullEfficiencyPower, kleinCookQ, scanAngle, type AcoustoOpticId,
} from "../../physics/materials/acousto-optic";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const CUSTOM = "custom";
const DEFAULT_ID: AcoustoOpticId = "teo2-shear";

const YARIV_YEH = "Yariv A., Yeh P. (1984). Optical Waves in Crystals. Wiley. Ch. 9, acousto-optics: sin θ_B = λ₀f/(2v), Δθ = λ₀Δf/v, " +
  "η = sin²[(π/(√2 λ₀))√(M₂LP/H)], P₁₀₀ = λ₀²H/(2M₂L). Klein W. R., Cook B. D. (1967), IEEE Trans. Sonics Ultrason. 14, 123: " +
  "Q = 2πλ₀Lf²/(nv²). Material values: Uchida N., Ohmachi Y., Niizeki N., Inamura T. (1972), US Patent 3,661,441, Table 1 (TeO₂ slow shear: " +
  "v = 617 m/s, M₂ = 793e-15 s³/kg).";

const materialOptions = [
  ...(Object.keys(ACOUSTO_OPTIC) as AcoustoOpticId[]).map((id) => ({ value: id, label: `${ACOUSTO_OPTIC[id].name}, ${ACOUSTO_OPTIC[id].mode}` })),
  { value: CUSTOM, label: "Custom" },
];

export default defineSchema({
  href: "/materials/acousto-optic",
  choices: [
    { key: "material", label: "Material (n, v and M₂ come from the preset unless it is custom)", options: materialOptions, default: DEFAULT_ID },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 633, min: 200, max: 20000 },
    { key: "frequency", label: "RF frequency f", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 80, min: 1, max: 3000 },
    { key: "power", label: "Acoustic power P", unit: "W", toSI: 1, siUnit: "W", default: 0.02, min: 0, max: 100 },
    { key: "bandwidth", label: "RF sweep Δf", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 40, min: 0, max: 2000 },
    { key: "length", label: "Interaction length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.1, max: 200 },
    { key: "height", label: "Transducer height H", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.01, max: 50 },
    { key: "beam", label: "Beam width D", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0.01, max: 100 },
    { key: "n", label: "Refractive index n (custom material only)", unit: "", toSI: 1, siUnit: "", default: 2.26, min: 1, max: 5 },
    { key: "velocity", label: "Acoustic velocity v (custom material only)", unit: "m/s", toSI: 1, siUnit: "m/s", default: 617, min: 100, max: 20000 },
    { key: "m2", label: "Figure of merit M₂ (custom material only)", unit: "×10⁻¹⁵ s³/kg", toSI: 1e-15, siUnit: "s³/kg", default: 793, min: 0.01, max: 5000 },
  ],
  outputs: [
    { key: "braggAngleOutside", label: "Bragg angle outside θ_B", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "deflection", label: "Deflection 2θ_B", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "braggAngleInside", label: "Bragg angle inside the cell", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "scanRange", label: "Scan range Δθ = λΔf/v", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "kleinCookQ", label: "Klein–Cook parameter Q", unit: "", toSI: 1, siUnit: "" },
    { key: "efficiency", label: "First-order efficiency η", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "powerFor100", label: "Acoustic power for 100 % efficiency", unit: "W", toSI: 1, siUnit: "W" },
    { key: "accessTime", label: "Access time τ = D/v", unit: "µs", toSI: 1e-6, siUnit: "s" },
    { key: "spots", label: "Resolvable spots N = τΔf", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ material, wavelength, frequency, power, bandwidth, length, height, beam, n: nCustom, velocity, m2 }) {
    const custom = material === CUSTOM;
    const preset = ACOUSTO_OPTIC[(material in ACOUSTO_OPTIC ? material : DEFAULT_ID) as AcoustoOpticId];
    const n = custom ? nCustom : preset.n;
    const v = custom ? velocity : preset.v;
    const M2 = custom ? m2 : preset.M2;
    const thetaOut = braggAngle(wavelength, frequency, v);
    const thetaIn = braggAngle(wavelength / n, frequency, v);
    const Q = kleinCookQ(wavelength, length, frequency, n, v);
    const tau = accessTime(beam, v);
    const warnings: string[] = [];
    if (!Number.isFinite(thetaOut)) warnings.push("λf/(2v) > 1: no Bragg angle at this frequency");
    let efficiency = braggEfficiency(wavelength, M2, length, height, power);
    let p100 = fullEfficiencyPower(wavelength, M2, length, height);
    if (Number.isFinite(Q) && Q < 1) {
      warnings.push("Q < 1: Raman–Nath regime, the Bragg sin² efficiency and the power for 100 % do not apply");
      efficiency = NaN;
      p100 = NaN;
    } else if (Number.isFinite(Q) && Q < 10) {
      warnings.push("1 ≤ Q < 10: intermediate regime, the Bragg formulas are approximate");
    }
    if (Number.isFinite(p100) && power > p100) warnings.push("Overdriven: past P₁₀₀ the power flows back into the zero order");
    if (!custom && material === "teo2-shear") {
      warnings.push("TeO₂ slow-shear cells use anisotropic Bragg diffraction; their Bragg angles differ from these isotropic values");
    }
    return {
      values: {
        braggAngleOutside: thetaOut, deflection: 2 * thetaOut, braggAngleInside: thetaIn, scanRange: scanAngle(wavelength, bandwidth, v),
        kleinCookQ: Q, efficiency, powerFor100: p100, accessTime: tau, spots: tau * bandwidth,
      },
      warnings,
    };
  },
  checks: [
    {
      // TeO₂ slow shear (US 3,661,441 Table 1: v = 617 m/s, M₂ = 793e-15 s³/kg; n = 2.26) at the page defaults: λ = 633 nm,
      // f = 80 MHz, P = 20 mW, Δf = 40 MHz, L = 10 mm, H = 1 mm, D = 2 mm. Worked independently in scratch (groupA/ao.mjs):
      //   θ_B = asin(633e-9 · 80e6 / (2 · 617)) = asin(0.0410373) = 2.35192°,  2θ_B = 4.70385°
      //   Δθ = λΔf/v = 633e-9 · 40e6 / 617 = 41.0373 mrad
      //   Q = 2π · 633e-9 · 0.01 · (80e6)² / (2.26 · 617²) = 295.859
      //   P₁₀₀ = λ²H/(2M₂L) = (633e-9)² · 1e-3 / (2 · 793e-15 · 0.01) = 25.2641 mW
      //   η = sin²[(π/(√2 · 633e-9)) · √(793e-15 · 0.01 · 0.02 / 1e-3)] = 97.030 %
      //   τ = D/v = 2e-3 / 617 = 3.24149 µs,  N = τΔf = 129.660
      source: YARIV_YEH,
      basis: "computed",
      inputs: {},
      expect: {
        braggAngleOutside: 2.35192, deflection: 4.70385, scanRange: 41.0373, kleinCookQ: 295.859, powerFor100: 0.0252641,
        efficiency: 97.030, accessTime: 3.24149, spots: 129.660,
      },
      tolerance: 0.0005,
    },
    {
      // Driving a cell at exactly P₁₀₀ gives sin²(π/2) = 100 %; P₁₀₀ = 25.2641 mW from the case above.
      source: YARIV_YEH,
      basis: "computed",
      inputs: { power: 0.0252641236 },
      expect: { efficiency: 100 },
      tolerance: 0.0005,
    },
    {
      // Fused silica (v = 5960 m/s, n = 1.46, M₂ = 1.51e-15 s³/kg; Isomet AN4820), λ = 633 nm, f = 100 MHz, P = 1 W, L = 20 mm,
      // H = 2 mm, Δf = 40 MHz (scratch groupA/ao.mjs): θ_B = asin(633e-9 · 100e6 / (2 · 5960)) = 0.304265°, inside
      // asin(633e-9/1.46 · 100e6 / (2 · 5960)) = 0.208400°, Q = 15.3380 (Bragg regime), P₁₀₀ = 13.2678 W, η = 17.4722 %.
      source: YARIV_YEH,
      basis: "computed",
      inputs: { material: "silica", frequency: 100, power: 1, length: 20, height: 2 },
      expect: { braggAngleOutside: 0.304265, braggAngleInside: 0.208400, kleinCookQ: 15.3380, powerFor100: 13.2678, efficiency: 17.4722 },
      tolerance: 0.0005,
    },
  ],
});
