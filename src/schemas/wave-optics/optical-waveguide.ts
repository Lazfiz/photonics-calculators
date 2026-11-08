import { slabSummary } from "../../physics/wave-optics/slab-waveguide";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;

export default defineSchema({
  href: "/wave-optics/optical-waveguide",
  inputs: [
    { key: "nCore", label: "Core index n₁", unit: "", toSI: 1, siUnit: "", default: 1.5, min: 1, max: 5 },
    { key: "nClad", label: "Cladding index n₂", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 1, max: 5 },
    { key: "wavelength", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 100, max: 1e5 },
    { key: "coreWidth", label: "Core thickness d", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10, min: 0.01, max: 1e4 },
  ],
  outputs: [
    { key: "vNumber", label: "V-number (half-thickness convention)", unit: "", toSI: 1, siUnit: "" },
    { key: "numericalAperture", label: "Numerical aperture √(n₁² − n₂²)", unit: "", toSI: 1, siUnit: "" },
    { key: "modes", label: "Guided modes per polarization", unit: "", toSI: 1, siUnit: "" },
    { key: "neffTE0", label: "TE₀ effective index", unit: "", toSI: 1, siUnit: "" },
    { key: "neffTM0", label: "TM₀ effective index", unit: "", toSI: 1, siUnit: "" },
    { key: "confinementTE0", label: "TE₀ power in the core", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "criticalAngle", label: "Critical angle θ_c", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "acceptanceAngle", label: "Acceptance half-angle in air", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "singleModeThickness", label: "Single-mode limit d < λ/(2NA)", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ nCore, nClad, wavelength, coreWidth }) {
    const s = slabSummary(nCore, nClad, coreWidth, wavelength);
    const warnings: string[] = [];
    if (!Number.isFinite(s.V)) {
      warnings.push("No guided modes: the core index must be higher than the cladding index (total internal reflection needs n₁ > n₂).");
    }
    return {
      values: {
        vNumber: s.V,
        numericalAperture: s.NA,
        modes: s.modes,
        neffTE0: s.neffTE,
        neffTM0: s.neffTM,
        confinementTE0: s.confinement,
        criticalAngle: s.criticalAngle,
        acceptanceAngle: s.acceptance,
        singleModeThickness: s.singleModeThickness,
      },
      warnings,
    };
  },
  checks: [
    {
      // V = (π d/λ)√(n₁² − n₂²) = (π × 10 µm/1550 nm)√(1.5² − 1.45²) = 20.268303 × 0.38405729; modes = ⌊2V/π⌋ + 1 = ⌊4.955⌋ + 1.
      source: "Kogelnik H., Ramaswamy V. (1974). Scheme for the analysis of dielectric waveguides. Appl. Opt. 13, 1857–1862, doi:10.1364/AO.13.001857 (symmetric case; the page's V is half theirs).",
      basis: "computed",
      inputs: { nCore: 1.5, nClad: 1.45, wavelength: 1550, coreWidth: 10 },
      expect: { vNumber: 7.784203565, numericalAperture: 0.3840572874, modes: 5 },
      tolerance: 1e-8,
    },
    {
      // At u = w = π/4 the TE₀ condition u tan u = w holds exactly, so V = √(u² + w²) = π/(2√2) and b = w²/V² = 1/2.
      // n₁ = √1.25, n₂ = 1 (NA = 1/2), λ = 1 µm, d = λ/√2 gives that V. n_eff = √(n₂² + b NA²) = √1.125;
      // core power Γ = (1 + s)/(1 + s + cos²u/w) with s = sin 2u/(2u) = 2/π; θ_c = asin(n₂/n₁).
      source: "Kogelnik H., Ramaswamy V. (1974). Appl. Opt. 13, 1857–1862, doi:10.1364/AO.13.001857 (symmetric TE eigenvalue equation u tan u = w, power confinement from the integrated field).",
      basis: "computed",
      inputs: { nCore: 1.118033988749895, nClad: 1, wavelength: 1000, coreWidth: 0.7071067811865476 },
      expect: { vNumber: 1.110720735, neffTE0: 1.060660172, confinementTE0: 71.99504232, criticalAngle: 63.43494882, acceptanceAngle: 30, singleModeThickness: 1 },
      tolerance: 1e-8,
    },
  ],
});
