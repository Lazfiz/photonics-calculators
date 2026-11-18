import { simSummary } from "../../physics/imaging/structured-illumination";
import { defineSchema } from "../types";

const GUSTAFSSON_2000 = "Gustafsson M. G. L. (2000). Surpassing the lateral resolution limit by a factor of two using structured " +
  "illumination microscopy. J. Microsc. 198, 82–87 (pattern frequency k₀ ≤ 2NA/λ_ex, resolution cut-off 2NA/λ_em + k₀). " +
  "https://doi.org/10.1046/j.1365-2818.2000.00710.x";
const GUSTAFSSON_2005 = "Gustafsson M. G. L. (2005). Nonlinear structured-illumination microscopy: wide-field fluorescence " +
  "imaging with theoretically unlimited resolution. Proc. Natl. Acad. Sci. USA 102, 13081–13086 (harmonics m·k₀; 2m + 1 phases per angle). " +
  "https://doi.org/10.1073/pnas.0406877102";

export default defineSchema({
  href: "/imaging/structured-illumination",
  inputs: [
    { key: "na", label: "Numerical aperture (NA)", unit: "", toSI: 1, siUnit: "", default: 1.4, min: 0.1, max: 1.7 },
    { key: "wavelength", label: "Excitation wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 488, min: 200, max: 2000 },
    { key: "emission", label: "Emission wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 520, min: 200, max: 2000 },
    { key: "pattern", label: "Pattern frequency (% of 2NA/λex)", unit: "%", toSI: 0.01, siUnit: "", default: 100, min: 10, max: 100 },
    { key: "orders", label: "Harmonic orders m (1 = linear SIM; a whole number)", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 3 },
    { key: "angles", label: "Pattern angles (a whole number)", unit: "", toSI: 1, siUnit: "", default: 3, min: 1, max: 12 },
  ],
  outputs: [
    { key: "cutoff", label: "Widefield cut-off 2NA/λem", unit: "cycles/µm", toSI: 1e6, siUnit: "1/m" },
    { key: "widefieldResolution", label: "Widefield resolution λem/(2NA)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "patternPeriod", label: "Pattern period 1/k₀", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "simCutoff", label: "SIM cut-off 2NA/λem + m·k₀", unit: "cycles/µm", toSI: 1e6, siUnit: "1/m" },
    { key: "simResolution", label: "SIM resolution 1/k_c", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "improvement", label: "Improvement over widefield", unit: "×", toSI: 1, siUnit: "" },
    { key: "rawImages", label: "Raw images (angles × (2m + 1) phases)", unit: "", toSI: 1, siUnit: "" },
  ],
  validate({ orders, angles }) {
    if (!Number.isInteger(orders)) return `The harmonic order m must be a whole number (got ${orders}).`;
    if (!Number.isInteger(angles)) return `The number of pattern angles must be a whole number (got ${angles}).`;
    return undefined;
  },
  compute({ na, wavelength, emission, pattern, orders, angles }) {
    const r = simSummary(wavelength, emission, na, pattern, orders, angles);
    return {
      values: {
        cutoff: r.cutoff,
        widefieldResolution: r.widefieldResolution,
        patternPeriod: 1 / r.patternFrequency,
        simCutoff: r.simCutoff,
        simResolution: r.simResolution,
        improvement: r.improvement,
        rawImages: r.rawImages,
      },
      warnings: r.notes,
    };
  },
  checks: [
    {
      // NA 1.4, λ_ex 488 nm, λ_em 520 nm, p = 0.8, m = 1: k_c = 2NA/λ_em = 2.8/520 nm = 5.384615385 µm⁻¹, k₀ = 0.8 · 2.8/488 nm = 4.590163934 µm⁻¹,
      // SIM cut-off k_c + k₀ = 9.974779319 µm⁻¹ → 1/k = 100.2528445 nm; widefield 520/2.8 = 185.7142857 nm; gain 9.974779319/5.384615385 = 1.852459016.
      source: GUSTAFSSON_2000,
      basis: "computed",
      inputs: { na: 1.4, wavelength: 488, emission: 520, pattern: 80, orders: 1, angles: 3 },
      expect: { cutoff: 5.384615385, simCutoff: 9.974779319, simResolution: 100.2528445, widefieldResolution: 185.7142857, improvement: 1.852459016 },
      tolerance: 1e-8,
    },
    {
      // NA 1.2, λ_ex 561 nm, λ_em 600 nm, p = 0.9, m = 1, 4 angles: k₀ = 0.9 · 2.4/561 nm = 3.850267380 µm⁻¹ (period 259.7222222 nm),
      // k_c + k₀ = 4 + 3.850267380 = 7.850267380 µm⁻¹ → 127.3841962 nm; images 4 · (2 · 1 + 1) = 12.
      source: `${GUSTAFSSON_2000} ${GUSTAFSSON_2005}`,
      basis: "computed",
      inputs: { na: 1.2, wavelength: 561, emission: 600, pattern: 90, orders: 1, angles: 4 },
      expect: { patternPeriod: 259.7222222, simResolution: 127.3841962, rawImages: 12 },
      tolerance: 1e-8,
    },
  ],
});
