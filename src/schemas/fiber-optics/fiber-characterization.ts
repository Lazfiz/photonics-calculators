import { LP11_CUTOFF_V, MFD_FIT_V_RANGE, MIN_V } from "../../physics/fiber-optics/macro-bending-loss";
import { WEAK_GUIDANCE_DELTA, fiberCharacterization } from "../../physics/fiber-optics/fiber-characterization";
import { defineSchema } from "../types";

const SOURCES = "Gloge D. (1971). Weakly guiding fibers. Appl. Opt. 10, 2252–2258, doi:10.1364/AO.10.002252 (V = 2πa·NA/λ, " +
  "NA = √(n₁² − n₂²), LP01 eigenvalue equation, n_eff² = n₂² + b(n₁² − n₂²)); Marcuse D. (1977). Loss analysis of single-mode " +
  "fiber splices. Bell Syst. Tech. J. 56, 703–718, doi:10.1002/j.1538-7305.1977.tb00534.x (w/a = 0.65 + 1.619V^(−3/2) + 2.879V^(−6)); " +
  "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed., §2.3 (γ = 2πn₂/(λA_eff), n₂ = 2.6e-20 m²/W); ITU-T G.652 for " +
  "D(λ) = (S₀/4)(λ − λ₀⁴/λ³)";

export default defineSchema({
  href: "/fiber-optics/fiber-characterization",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2000 },
    { key: "coreIndex", label: "Core index n₁", unit: "", toSI: 1, siUnit: "", default: 1.44937, min: 1, max: 4 },
    { key: "claddingIndex", label: "Cladding index n₂", unit: "", toSI: 1, siUnit: "", default: 1.444, min: 1, max: 4 },
    { key: "coreRadius", label: "Core radius", unit: "µm", toSI: 1e-6, siUnit: "m", default: 4.1, min: 0.5, max: 50 },
    { key: "zeroDispersion", label: "Zero-dispersion wavelength λ₀", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1310, min: 1200, max: 1700 },
    { key: "dispersionSlope", label: "Zero-dispersion slope S₀", unit: "ps/(nm²·km)", toSI: 1e3, siUnit: "s/m³", default: 0.092, min: 0, max: 0.2 },
  ],
  outputs: [
    { key: "V", label: "V-number", unit: "", toSI: 1, siUnit: "" },
    { key: "cutoff", label: "Theoretical LP11 cutoff wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "mfd", label: "Mode-field diameter (Gaussian fit)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "mfdPetermannII", label: "Mode-field diameter (Petermann II)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "aeff", label: "Effective area π w²", unit: "µm²", toSI: 1e-12, siUnit: "m²" },
    { key: "gamma", label: "Nonlinear coefficient γ", unit: "1/(W·km)", toSI: 1e-3, siUnit: "1/(W·m)" },
    { key: "NA", label: "Numerical aperture", unit: "", toSI: 1, siUnit: "" },
    { key: "acceptanceAngle", label: "Acceptance half-angle", unit: "°", toSI: Math.PI / 180, siUnit: "rad" },
    { key: "delta", label: "Relative index difference Δ", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "nEff", label: "Effective index", unit: "", toSI: 1, siUnit: "" },
    { key: "b", label: "Normalized propagation constant b", unit: "", toSI: 1, siUnit: "" },
    { key: "confinement", label: "Power in the core", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "dispersion", label: "Dispersion D (from λ₀ and S₀)", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²" },
  ],
  compute({ wavelength, coreIndex, claddingIndex, coreRadius, zeroDispersion, dispersionSlope }) {
    const r = fiberCharacterization(coreRadius, coreIndex, claddingIndex, wavelength, zeroDispersion, dispersionSlope);
    const warnings: string[] = [];
    if (!(Number.isFinite(r.mfd) && Number.isFinite(r.b))) {
      warnings.push(`No mode result: the model needs n₂ < n₁ and V ≥ ${MIN_V}.`);
    } else {
      if (r.V > LP11_CUTOFF_V) warnings.push("V > 2.405: LP11 is also guided at this wavelength. Mode values are for LP01.");
      if (r.V < MFD_FIT_V_RANGE[0] || r.V > MFD_FIT_V_RANGE[1]) {
        warnings.push(`V is outside ${MFD_FIT_V_RANGE[0]}–${MFD_FIT_V_RANGE[1]}: the Marcuse MFD fit is extrapolated; A_eff and γ use it.`);
      }
      if (r.delta > WEAK_GUIDANCE_DELTA) {
        warnings.push(`Δ > ${100 * WEAK_GUIDANCE_DELTA} %: this is a weak-guidance (LP) model, so the mode values are approximate.`);
      }
    }
    return {
      values: {
        V: r.V, cutoff: r.cutoff, mfd: r.mfd, mfdPetermannII: r.mfdPetermannII, aeff: r.Aeff, gamma: r.gamma,
        NA: r.NA, acceptanceAngle: r.acceptanceAngle, delta: r.delta, nEff: r.nEff, b: r.b,
        confinement: r.confinement, dispersion: r.D,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: n₁² − n₂² = 1.44937² − 1.444² = 2.1006734 − 2.085136 = 0.0155374; NA = 0.1246491; a = 4.1 µm, λ = 1.55 µm.
      // V = 2π · 4.1 · 0.1246491/1.55 = 2.071673; Δ = 0.0155374/(2 · 2.1006734) = 0.36982 %; λc = 2π · 4.1 µm · NA/2.404826 = 1335.271 nm;
      // acceptance half-angle asin(0.1246491) = 7.160492°.
      // Marcuse: w/a = 0.65 + 1.619/V^1.5 + 2.879/V^6 = 0.65 + 1.619/2.981822 + 2.879/79.05456 = 0.65 + 0.542957 + 0.036418 = 1.229374,
      // MFD = 2 · 1.229374 · 4.1 µm = 10.08087 µm; A_eff = π w² = π (5.04043 µm)² = 79.8153 µm²;
      // γ = 2π · 2.6e-20/(1.55e-6 · 79.8153e-12) = 1.320491e-3 /(W·m) = 1.320491 /(W·km).
      // D = 0.023(1550 − 1310⁴/1550³) = 0.023 · 759.1573 = 17.46062 ps/(nm·km).
      source: SOURCES,
      basis: "computed",
      inputs: {},
      expect: {
        V: 2.0716727657258365,
        NA: 0.12464909506290092,
        delta: 0.36981943320958215,
        cutoff: 1335.270567380286,
        acceptanceAngle: 7.160491922372352,
        mfd: 10.080870747427301,
        aeff: 79.81526763486877,
        gamma: 1.320491299047759,
        dispersion: 17.460618823134507,
      },
      tolerance: 1e-8,
    },
  ],
});
