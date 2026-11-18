import { QE_RANGE, quantumEfficiencySummary, resolveQeInputs, type QeMaterial } from "../../physics/detectors/quantum-efficiency";
import { defineSchema } from "../types";

const REFS =
  "Gärtner W. W. (1959). Depletion-layer photoeffects in semiconductors. Phys. Rev. 116, 84–87, doi:10.1103/PhysRev.116.84: " +
  "η = (1 − R)·e^(−α·d)·[1 − e^(−α·W)/(1 + α·L)], times min(1, fill factor × microlens gain); ℛ = η·q·λ/(h·c) (Sze S. M., Ng K. K. (2007). " +
  "Physics of Semiconductor Devices, 3rd ed. Wiley, doi:10.1002/0470068329, ch. 13); silicon α = 4π·k/λ from Green M. A. (2008). Self-consistent optical " +
  "parameters of intrinsic silicon at 300 K including temperature coefficients. Sol. Energy Mater. Sol. Cells 92, 1305–1310, doi:10.1016/j.solmat.2008.06.009, Table 1; " +
  "bare-surface R = ((n − 1)² + k²)/((n + 1)² + k²) (Fresnel, normal incidence); In₀.₅₃Ga₀.₄₇As α = 2.4e4 cm⁻¹·eV^−½·√(E − E_g), a fit to Adachi S. (1989). " +
  "J. Appl. Phys. 66, 6030, doi:10.1063/1.343580, with E_g from Vurgaftman I., Meyer J. R., Ram-Mohan L. R. (2001). J. Appl. Phys. 89, 5815–5875, doi:10.1063/1.1368156; " +
  "the InP cap (E_g from the same paper) is opaque above its gap.";

const PROBE_RANGE = (m: QeMaterial) => `${QE_RANGE[m].lo}–${QE_RANGE[m].hi} nm`;

export default defineSchema({
  href: "/detectors/quantum-efficiency",
  choices: [
    {
      key: "material",
      label: "Absorber",
      options: [
        { value: "si", label: "Silicon" },
        { value: "ingaas", label: "In₀.₅₃Ga₀.₄₇As (InP cap)" },
      ],
      default: "si",
    },
    {
      key: "surface",
      label: "Front surface (bare = Fresnel reflectance of silicon, silicon only)",
      options: [
        { value: "ar", label: "AR coated (fixed R)" },
        { value: "bare", label: "Bare silicon (Fresnel)" },
      ],
      default: "ar",
    },
  ],
  inputs: [
    { key: "thickness", label: "Collecting thickness W", unit: "µm", toSI: 1e-6, siUnit: "m", default: 20, min: 0.5, max: 500 },
    { key: "diffusionLength", label: "Substrate diffusion length L (0 = slab; ignored for InGaAs, whose InP substrate is transparent)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 100, min: 0, max: 1000 },
    { key: "deadLayer", label: "Dead layer d", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0, min: 0, max: 2 },
    { key: "reflectance", label: "Reflectance R (AR-coated surface)", unit: "", toSI: 1, siUnit: "", default: 0.05, min: 0, max: 0.5 },
    { key: "fillFactor", label: "Fill factor", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.1, max: 1 },
    { key: "microlensGain", label: "Microlens gain", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 3 },
    { key: "probeWavelength", label: "Probe wavelength (silicon 250–1450 nm, InGaAs 800–1800 nm)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 850, min: 250, max: 1800 },
  ],
  outputs: [
    { key: "probeQe", label: "QE at the probe wavelength", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "probeResponsivity", label: "Responsivity at the probe wavelength", unit: "A/W", toSI: 1, siUnit: "A/W" },
    { key: "probeReflectance", label: "Front-surface reflectance at the probe wavelength", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "peakQe", label: "Peak QE", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "peakWavelengthLow", label: "Peak wavelength (short end of the flat top)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "peakWavelengthHigh", label: "Peak wavelength (long end of the flat top)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "opticalFill", label: "Optical fill min(1, fill factor × microlens gain)", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  validate({ material, surface, probeWavelength }) {
    const m = material as QeMaterial;
    const nm = probeWavelength * 1e9;
    const { lo, hi } = QE_RANGE[m];
    if (!(nm >= lo - 1e-6 && nm <= hi + 1e-6)) return `The probe wavelength must lie in ${PROBE_RANGE(m)} for this absorber.`;
    if (material === "ingaas" && surface === "bare") return "The bare-surface Fresnel reflectance needs n + ik, tabulated for silicon only: use the AR-coated surface for InGaAs.";
    return undefined;
  },
  compute({ material, surface, thickness, diffusionLength, deadLayer, reflectance, fillFactor, microlensGain, probeWavelength }) {
    const inputs = resolveQeInputs({
      material, surface, thickness: thickness * 1e6, diffusionLength: diffusionLength * 1e6, deadLayer: deadLayer * 1e6,
      reflectance, fillFactor, microlensGain, probeWavelength: probeWavelength * 1e9,
    });
    const r = quantumEfficiencySummary(inputs);
    const warnings: string[] = [];
    if (inputs.material === "ingaas" && r.probeQe === 0) {
      warnings.push("The probe wavelength is absorbed in the InP cap (opaque short of 916 nm) or lies beyond the InGaAs cutoff, so the QE is 0.");
    }
    return {
      values: {
        probeQe: r.probeQe,
        probeResponsivity: r.probeResponsivity,
        probeReflectance: r.probeReflectance,
        peakQe: r.peakQe,
        peakWavelengthLow: r.peakLow * 1e-9,
        peakWavelengthHigh: r.peakHigh * 1e-9,
        opticalFill: inputs.opticalFill,
      },
      warnings,
    };
  },
  checks: [
    {
      // Si p-i-n defaults: W = 20 µm, L = 100 µm, d = 0, R = 0.05, probe 850 nm (α(850) = 4π·k/λ from Green's k(850 nm)); η = 0.95·(1 − e^(−αW)/(1 + αL)) = 0.898499;
      // ℛ = η·q·850e-9/(h·c) = 0.615985 A/W. Peak: 241-point scan 250–1450 nm in 5 nm steps; the QE is 95 % (full absorption) from 250 nm to within 0.1 point of it until 695 nm
      // (250 nm is the start of the scan: with no dead layer the model stays flat down to the end of Green's table).
      source: REFS,
      basis: "computed",
      inputs: {},
      expect: {
        probeQe: 89.8499343685063, probeResponsivity: 0.6159853044045609, probeReflectance: 5, peakQe: 95,
        peakWavelengthLow: 250, peakWavelengthHigh: 695, opticalFill: 100,
      },
      tolerance: 1e-8,
    },
    {
      // Front-illuminated CMOS-like structure on bare silicon: W = 3 µm, L = 0, d = 0.1 µm, fill 0.5 × microlens gain 1.6 = optical fill 0.8, probe 550 nm.
      // R = ((n − 1)² + k²)/((n + 1)² + k²) at Green's n(550), k(550) = 36.7336 %; η = (1 − R)·e^(−α·d)·(1 − e^(−α·W))·0.8 = 0.404985; ℛ = 0.179653 A/W; peak 42.3947 % at 500–520 nm (scan).
      source: REFS,
      basis: "computed",
      inputs: { material: "si", surface: "bare", thickness: 3, diffusionLength: 0, deadLayer: 0.1, fillFactor: 0.5, microlensGain: 1.6, probeWavelength: 550 },
      expect: {
        probeQe: 40.49847797025106, probeResponsivity: 0.179653239405656, probeReflectance: 36.73358921641316, peakQe: 42.39469982341751,
        peakWavelengthLow: 500, peakWavelengthHigh: 520, opticalFill: 80,
      },
      tolerance: 1e-8,
    },
    {
      // InGaAs p-i-n, W = 3 µm, R = 0.05, probe 1550 nm: E_g(0.53, 300 K) = 0.737257 eV, α = 2.4e6·√(hc/λ − E_g) with hc/1550 nm = 0.799897 eV, QE = 0.95·(1 − e^(−α·3e-6)) = 0.793285; ℛ = 0.991733 A/W.
      // Peak: scan 800–1800 nm in 1000/240 nm steps, InP cap opaque up to 916.44 nm; 94.665 % at 916.7–954.2 nm (flat top within 0.1 point).
      source: REFS,
      basis: "computed",
      inputs: { material: "ingaas", thickness: 3, diffusionLength: 0, probeWavelength: 1550 },
      expect: {
        probeQe: 79.32852605633181, probeResponsivity: 0.9917329542083689, probeReflectance: 5, peakQe: 94.6650825899631,
        peakWavelengthLow: 916.6666666666666, peakWavelengthHigh: 954.1666666666666, opticalFill: 100,
      },
      tolerance: 1e-8,
    },
  ],
});
