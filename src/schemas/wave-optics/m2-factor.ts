import { divergenceHalfAngle, m2FromWaistDivergence, rayleighRange } from "../../physics/wave-optics/gaussian-beam";
import { defineSchema } from "../types";

const SOURCE =
  "ISO 11146-1:2021. Lasers and laser-related equipment: test methods for laser beam widths, divergence angles and beam " +
  "propagation ratios, part 1 (M² = π w₀ θ/λ from the second-moment waist radius and far-field half angle); Siegman A. E. " +
  "(1990). New developments in laser resonators. Proc. SPIE 1224, 2–14, doi:10.1117/12.18425 (embedded Gaussian: " +
  "z_R = π w₀²/(M²λ), BPP = M²λ/π)";

export default defineSchema({
  href: "/wave-optics/m2-factor",
  inputs: [
    { key: "wavelength", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 100, max: 20000 },
    { key: "w0", label: "Waist radius w₀ (second moment)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0.5, min: 0.001, max: 100 },
    { key: "theta", label: "Divergence θ (full angle)", unit: "mrad", toSI: 1e-3, siUnit: "rad", default: 2, min: 0.001, max: 1000 },
  ],
  outputs: [
    { key: "m2", label: "Beam quality M² = π w₀ θ/(2λ)", unit: "", toSI: 1, siUnit: "" },
    { key: "beamParameterProduct", label: "Beam parameter product w₀θ/2", unit: "mm·mrad", toSI: 1e-6, siUnit: "m·rad" },
    { key: "tem00Divergence", label: "TEM₀₀ divergence for the same waist (full angle)", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "rayleighRange", label: "Rayleigh range π w₀²/(M²λ)", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ wavelength, w0, theta }) {
    const halfAngle = theta / 2;
    const m2 = m2FromWaistDivergence(wavelength, w0, halfAngle);
    const impossible = m2 < 1;
    const warnings: string[] = [];
    if (impossible) {
      warnings.push(
        "M² below 1 is physically impossible: no beam diverges less than a TEM₀₀ Gaussian of the same waist. Check that w₀ is a radius " +
        "(not a diameter) and θ the full angle, both second-moment (D4σ) widths as ISO 11146 describes. The Rayleigh range is not defined.",
      );
    }
    return {
      values: {
        m2,
        beamParameterProduct: w0 * halfAngle,
        tem00Divergence: 2 * divergenceHalfAngle({ lambda: wavelength, w0 }),
        rayleighRange: impossible ? NaN : rayleighRange({ lambda: wavelength, w0, m2: Math.max(m2, 1) }),
      },
      warnings,
    };
  },
  checks: [
    {
      // M² = π w₀ θ_half/λ = π · 0.5e-3 · 1e-3/1.064e-6 = 1.4763123372; BPP = w₀θ_half = 0.5 mm·mrad;
      // θ_TEM00 = 2λ/(π w₀) = 2 · 1.064e-6/(π · 0.5e-3) = 1.3547268756 mrad; z_R = π w₀²/(M²λ) = w₀/θ_half = 500 mm.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: { m2: 1.4763123372132485, beamParameterProduct: 0.5, tem00Divergence: 1.3547268755982131, rayleighRange: 500 },
      tolerance: 1e-8,
    },
    {
      // λ = 633 nm, w₀ = 1 mm, θ = 1 mrad (half 0.5 mrad): M² = π · 1e-3 · 0.5e-3/633e-9 = 2.4815107848, z_R = w₀/θ_half = 2000 mm,
      // θ_TEM00 = 2 · 633e-9/(π · 1e-3) = 0.4029803159 mrad.
      source: SOURCE,
      basis: "computed",
      inputs: { wavelength: 633, w0: 1, theta: 1 },
      expect: { m2: 2.481510784826061, tem00Divergence: 0.402980315908679, rayleighRange: 2000 },
      tolerance: 1e-8,
    },
  ],
});
