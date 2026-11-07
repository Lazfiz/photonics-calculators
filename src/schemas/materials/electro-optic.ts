import {
  POCKELS, crossedPolarizerTransmission, gyrotropicTransmission, modulator, pockelsIndexChange, type PockelsGeometry, type PockelsId,
} from "../../physics/materials/pockels";
import { defineSchema } from "../types";

const IDS = ["kdp", "kdp-d", "adp", "linbo3", "litao3", "ktp", "batio3", "batio3-clamped", "bso"] as const satisfies readonly PockelsId[];
const DEG = Math.PI / 180;

const YARIV_YEH = "Yariv A., Yeh P., Optical Waves in Crystals (Wiley), ch. 7: Δn = −½ n³ r E. Wilson J., Hawkes J., Optoelectronics: An " +
  "Introduction, Table 3.1 and Example 3.2: longitudinal KDP-type cell, V_π = λ/(2 n_o³ r₆₃), a single polarization needs twice that.";

export default defineSchema({
  href: "/materials/electro-optic",
  choices: [
    {
      key: "material",
      label: "Material",
      options: [...IDS.map((id) => ({ value: id as string, label: POCKELS[id].name })), { value: "custom", label: "Custom" }],
      default: "kdp",
    },
    {
      key: "geometry",
      label: "Custom modulator geometry (used with material = custom only)",
      options: [{ value: "longitudinal", label: "longitudinal" }, { value: "transverse", label: "transverse" }],
      default: "transverse",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 633, min: 250, max: 5000 },
    { key: "voltage", label: "Voltage V", unit: "V", toSI: 1, siUnit: "V", default: 1000, min: 0, max: 50000 },
    { key: "length", label: "Crystal length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 20, min: 0.1, max: 100 },
    { key: "gap", label: "Electrode gap d (transverse and cubic modulators)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 1000, min: 1, max: 20000 },
    { key: "n", label: "Custom refractive index n", unit: "", toSI: 1, siUnit: "", default: 2.2, min: 1, max: 5 },
    { key: "r", label: "Custom coefficient r", unit: "pm/V", toSI: 1e-12, siUnit: "m/V", default: 30.8, min: 0.01, max: 5000 },
  ],
  outputs: [
    { key: "halfWaveRetardation", label: "Half-wave voltage V_π (retardation)", unit: "V", toSI: 1, siUnit: "V" },
    { key: "halfWavePhase", label: "Phase half-wave voltage (one polarization)", unit: "V", toSI: 1, siUnit: "V" },
    { key: "vpiLength", label: "V_π·L (phase)", unit: "V·cm", toSI: 1e-2, siUnit: "V·m" },
    { key: "field", label: "Field E (V/L longitudinal, V/d otherwise)", unit: "MV/m", toSI: 1e6, siUnit: "V/m" },
    { key: "indexChange", label: "Index change Δn = −½n³rE", unit: "", toSI: 1, siUnit: "" },
    { key: "retardation", label: "Retardation Γ", unit: "π", toSI: Math.PI, siUnit: "rad" },
    { key: "phase", label: "Phase shift φ (one polarization)", unit: "π", toSI: Math.PI, siUnit: "rad" },
    { key: "transmission", label: "Crossed-polarizer transmission (with optical rotation for a cubic crystal)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "transmissionNoRotation", label: "Crossed-polarizer transmission sin²(Γ/2), without optical rotation", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "rotation", label: "Optical rotation ρL (cubic crystals only; 0 otherwise)", unit: "°", toSI: DEG, siUnit: "rad" },
  ],
  compute({ material, geometry, wavelength, voltage, length, gap, n, r }) {
    const custom = material === "custom";
    const customGeometry: PockelsGeometry = geometry === "longitudinal" ? "longitudinal" : "transverse";
    const m = modulator(material as PockelsId | "custom", wavelength, gap, length, { n, r, geometry: customGeometry });
    const longitudinal = m.geometry === "longitudinal";
    const E = voltage / (longitudinal ? length : gap);
    const retardation = (Math.PI * voltage) / m.VpiRet;
    const rotationL = m.rotation * length;
    const warnings: string[] = [];
    if (!Number.isFinite(m.n)) warnings.push("The wavelength is outside the index model's range.");
    else if (!Number.isFinite(m.VpiPhase)) warnings.push("The wavelength is outside the range where the electro-optic coefficients are tabulated.");
    if (!Number.isFinite(m.VpiRet) && Number.isFinite(m.VpiPhase)) {
      warnings.push(custom ? "A custom transverse modulator needs r₃₃ and r₁₃ for the retardation: pick a table crystal." : "No retardation half-wave voltage at this wavelength.");
    }
    return {
      values: {
        halfWaveRetardation: m.VpiRet,
        halfWavePhase: m.VpiPhase,
        vpiLength: m.VpiPhase * length,
        field: E,
        indexChange: pockelsIndexChange(m.n, m.r, E),
        retardation,
        phase: (Math.PI * voltage) / m.VpiPhase,
        transmission: gyrotropicTransmission(retardation, rotationL),
        transmissionNoRotation: crossedPolarizerTransmission(retardation),
        rotation: rotationL,
      },
      warnings,
    };
  },
  checks: [
    {
      // Wilson and Hawkes Example 3.2: n_o = 1.51, r₆₃ = 10.6 pm/V at 1.06 µm, longitudinal. V_π = 1.06e-6 / (2 · 3.442951 · 10.6e-12) =
      // 14 522.43 V (retardation), 29 044.85 V for one polarization. V = 1 kV, L = 20 mm: E = 0.05 MV/m, Δn = −0.5 · 3.442951 · 10.6e-12 ·
      // 5e4 = −9.12382e-7, Γ = 0.06885902π, φ = 0.03442951π, T = sin²(Γ/2) = 1.16538 %, V_π·L (phase) = 58 089.7 V·cm.
      // Worked here from the formulas; the book was not available to check its printed 14 522.4 V.
      source: YARIV_YEH,
      basis: "computed",
      inputs: { material: "custom", geometry: "longitudinal", wavelength: 1060, n: 1.51, r: 10.6, voltage: 1000, length: 20 },
      expect: {
        halfWaveRetardation: 14522.42567495152, halfWavePhase: 29044.85134990304, vpiLength: 58089.70269980608, field: 0.05,
        indexChange: -9.12382015e-7, retardation: 0.06885901999999998, phase: 0.03442950999999999, transmission: 1.16537880434725,
        transmissionNoRotation: 1.16537880434725,
      },
      tolerance: 1e-8,
    },
    {
      // Transverse z-field modulator (n_e³ r₃₃ phase): λd/(n³ r L) with n = 2.2, r = 30.8 pm/V (Weis & Gaylord LiNbO₃ r₃₃), 1550 nm,
      // d = 10 µm, L = 20 mm: 1.55e-6 · 1e-5 / (10.648 · 30.8e-12 · 0.02) = 2.363105 V. V = 1 V: E = 0.1 MV/m, φ = 0.423172π,
      // Δn = −1.63979e-5, V_π·L = 4.726209 V·cm. Phase formula from Yariv and Yeh ch. 7 (Δn = −½n³rE, φ = 2πΔnL/λ).
      source: YARIV_YEH,
      basis: "computed",
      inputs: { material: "custom", geometry: "transverse", wavelength: 1550, n: 2.2, r: 30.8, voltage: 1, length: 20, gap: 10 },
      expect: {
        halfWavePhase: 2.363104588874686, vpiLength: 4.726209177749372, field: 0.1, indexChange: -1.639792e-5, phase: 0.42317212903225815,
      },
      tolerance: 1e-7,
    },
  ],
});
