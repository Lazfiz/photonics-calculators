import { LP11_CUTOFF_V, MIN_V } from "../../physics/fiber-optics/macro-bending-loss";
import { FIRST_ORDER_LIMIT, microbendSummary } from "../../physics/fiber-optics/microbend";
import { defineSchema } from "../types";

const PETERMANN_1976 = "Petermann K. (1976). Microbending loss in monomode fibres. Electron. Lett. 12, 107–109, doi:10.1049/el:19760084 " +
  "(plane-wave radiation modes; Gaussian-mode loss α = (π/8)(k n₂)⁴ w⁶ C² s e^(−k n₂ w² s)); first-order coupled-mode theory of Marcuse D. (1991), " +
  "Theory of Dielectric Optical Waveguides, 2nd ed., Academic Press, ch. 3 and 5: exact LP01 loss α = (π/2)(k n₂)³ C² a⁴ W² F′(Q*)²/(J₁²(U) V²), " +
  "F(Q) = V² N(Q)/((U² − Q²)(Q² + W²)), N(Q) = U J₁(U) J₀(Q) − Q J₀(U) J₁(Q), Q* = a√(2 k n₂ s), s = 2π/Λ − δ, C = A(2π/Λ)², " +
  "δ = β − k n₂, critical period Λc = 2π/δ, with the LP01 eigenvalues of Gloge D. (1971), Appl. Opt. 10, 2252, doi:10.1364/AO.10.002252.";
const MARCUSE_1977 = "Marcuse D. (1977). Loss analysis of single-mode fiber splices. Bell Syst. Tech. J. 56, 703–718, " +
  "doi:10.1002/j.1538-7305.1977.tb00534.x; Gaussian fit w/a = 0.65 + 1.619 V^(−3/2) + 2.879 V^(−6), V = 2π a NA/λ.";

const NO_RESULT = `The model needs V ≥ ${MIN_V}, 0 < NA < n₁ and a positive period; outside that there is no result.`;
const NO_NA = "NA must be below n₁; otherwise the fibre is not a guide.";
const STRAIGHT = "With zero amplitude the axis is straight: the bend radius is infinite.";

export default defineSchema({
  href: "/fiber-optics/micro-bend",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 600, max: 2000 },
    { key: "period", label: "Deformation period Λ", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0.5, min: 0.01, max: 100 },
    { key: "amplitudeNm", label: "Axis amplitude A", unit: "nm", toSI: 1e-9, siUnit: "m", default: 20, min: 0, max: 10000 },
    { key: "length", label: "Affected length", unit: "m", toSI: 1, siUnit: "m", default: 1, min: 0, max: 100000 },
    { key: "coreRadius", label: "Core radius", unit: "µm", toSI: 1e-6, siUnit: "m", default: 4.1, min: 0.5, max: 20 },
    { key: "na", label: "Numerical aperture", unit: "", toSI: 1, siUnit: "", default: 0.1246, min: 0.01, max: 0.5 },
    { key: "coreIndex", label: "Core index n₁", unit: "", toSI: 1, siUnit: "", default: 1.4494, min: 1, max: 4 },
  ],
  outputs: [
    { key: "dBPerMetre", label: "Microbend loss (exact LP01 field)", unit: "dB/m", toSI: 1, siUnit: "dB/m" },
    { key: "gaussian", label: "Microbend loss (Gaussian mode)", unit: "dB/m", toSI: 1, siUnit: "dB/m" },
    { key: "total", label: "Loss over the affected length", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "Lc", label: "Critical period Λc", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "minBendRadius", label: "Tightest bend radius at the crests", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "mfd", label: "Mode-field diameter (Marcuse fit)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "V", label: "V-number", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelength, period, amplitudeNm, length, coreRadius, na, coreIndex }) {
    const s = microbendSummary({ a: coreRadius, n1: coreIndex, NA: na }, wavelength, amplitudeNm, period, length);
    const warnings: string[] = [];
    if (!Number.isFinite(s.dBPerMetre)) warnings.push(`No result: ${NO_RESULT}`);
    else {
      if (s.V > LP11_CUTOFF_V) {
        warnings.push(`V = ${s.V.toFixed(2)} > 2.405: the fibre is not single-mode here; LP01 couples to guided LP11 as well, which this model ignores.`);
      }
      if (s.firstOrder > FIRST_ORDER_LIMIT) {
        warnings.push(`The deformation is too strong for first-order theory (peak tilt loss or loss per period above ${FIRST_ORDER_LIMIT}): ` +
          "the result overestimates the loss. Reduce the amplitude or treat each bend as a macrobend.");
      }
      if (period >= s.Lc) {
        warnings.push("Λ ≥ Λc: no radiation mode is phase-matched, so the first-order loss of an infinitely long sinusoid is zero. Slow bends like this act as macrobends instead.");
      }
    }
    return {
      values: {
        dBPerMetre: s.dBPerMetre, gaussian: s.gaussian, total: s.total, Lc: s.Lc, minBendRadius: s.minBendRadius, mfd: s.mfd, V: s.V,
      },
      warnings,
      reasons: {
        dBPerMetre: NO_RESULT, gaussian: NO_RESULT, total: NO_RESULT, Lc: NO_RESULT, mfd: NO_RESULT, V: NO_NA, minBendRadius: STRAIGHT,
      },
    };
  },
  checks: [
    {
      // SMF-28-like a = 4.1 µm, NA 0.1246, n₁ 1.4494 at 1550 nm (V = 2.0708568, U = 1.5515712, W = 1.3715228), A = 20 nm, Λ = 0.5 mm:
      // n₂ = 1.4440, β − k n₂ = δ = γ²/(β + k n₂) = 9550.553 1/m → Λc = 2π/δ = 0.6578871 mm; ν = 2π/Λ = 12566.37, s = ν − δ = 3015.818,
      // C = Aν² = 3.158 1/m → exact α = 0.2696766 1/m = 1.1711904 dB/m; tightest radius 1/C = 0.3166287 m = 316.6287 mm; w = 5.0421 µm → MFD 10.084209 µm.
      source: PETERMANN_1976,
      basis: "computed",
      inputs: {},
      expect: { dBPerMetre: 1.1711903810734874, gaussian: 0.6318449190603999, Lc: 0.6578870745866282, minBendRadius: 316.6286988823056, total: 1.1711903810734874 },
      tolerance: 1e-8,
    },
    {
      // Same fibre, Λ = 0.2 mm: s = 21865.374, C = A ν² = 20 nm · (31415.93 1/m)² = 19.739 1/m → exact 6.9207301 dB/m, Gaussian 10.826219 dB/m;
      // tightest radius 1/C = 0.0506606 m = 50.660592 mm.
      source: PETERMANN_1976,
      basis: "computed",
      inputs: { period: 0.2 },
      expect: { dBPerMetre: 6.920730111490107, gaussian: 10.826219486315104, minBendRadius: 50.660591821168895 },
      tolerance: 1e-8,
    },
    {
      // 1550 nm (single-mode, V < 2.405), A = 50 nm, Λ = 0.1 mm, 100 m: V = 2π a NA/λ = 2.0708568; Λc = 0.6578871 mm; exact 54.365072 dB/m → 5436.5072 dB over 100 m;
      // MFD = 2 a (0.65 + 1.619/V^1.5 + 2.879/V^6) = 10.084209 µm.
      source: `${PETERMANN_1976} ${MARCUSE_1977}`,
      basis: "computed",
      inputs: { period: 0.1, amplitudeNm: 50, length: 100 },
      expect: { V: 2.070856803887589, mfd: 10.084209113123363, Lc: 0.6578870745866303, total: 5436.507239275445 },
      tolerance: 1e-8,
    },
  ],
});
