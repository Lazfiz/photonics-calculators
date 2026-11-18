import {
  LP11_CUTOFF_V, MFD_FIT_V_RANGE, MIN_V, bendLossPerTurnDb, elastoOpticBendRadius,
} from "../../physics/fiber-optics/macro-bending-loss";
import { REFERENCE_BEND_RADIUS, modeFieldSummary } from "../../physics/fiber-optics/mode-field-diameter";
import { defineSchema } from "../types";

const PETERMANN_1983 = "Petermann K. (1983). Constraints for fundamental-mode spot size for broadband dispersion-compensated single-mode fibres. " +
  "Electron. Lett. 19, 712–714, doi:10.1049/el:19830485; Petermann II spot size w² = 2∫ψ² r dr/∫ψ′² r dr, which for the exact step-index " +
  "LP01 field ψ = J₀(Uρ) (core), J₀(U)K₀(Wρ)/K₀(W) (cladding) evaluates to w = √2 a J₁(U)/(W J₀(U)), MFD = 2w; U, W from Gloge D. (1971), " +
  "Weakly guiding fibers, Appl. Opt. 10, 2252, doi:10.1364/AO.10.002252 (eigenvalue equation U J₁(U)/J₀(U) = W K₁(W)/K₀(W), " +
  "b = W²/V², n_eff² = n₂² + b NA², core power fraction Γ = (W²/V²)(1 + J₀²(U)/J₁²(U))).";
const MARCUSE_1977 = "Marcuse D. (1977). Loss analysis of single-mode fiber splices. Bell Syst. Tech. J. 56, 703–718, " +
  "doi:10.1002/j.1538-7305.1977.tb00534.x; Gaussian fit w/a = 0.65 + 1.619 V^(−3/2) + 2.879 V^(−6), V = 2π a NA/λ; " +
  "effective area π w²; LP11 cutoff at V = 2.405 (first zero of J₀).";
const MARCUSE_1976 = "Marcuse D. (1976). Curvature loss formula for optical fibers. J. Opt. Soc. Am. 66, 216–220, " +
  "doi:10.1364/JOSA.66.000216; LP_ν curvature loss for ν = 0 (K_{ν−1}K_{ν+1} = K₁²): α = √π κ² exp(−2γ³R/(3β²)) / (2 γ^(3/2) V² √R K₁²(W)), " +
  "κ = U/a, γ = W/a, β² = (n₁k)² − κ²; loss per turn = 10 log₁₀(e) α 2πR dB.";

const NO_RESULT = `The model needs V ≥ ${MIN_V} and 0 < NA < n₁; outside that there is no result.`;
const NO_NA = "NA must be below n₁; otherwise the fibre is not a guide.";
const NO_EO = "The elasto-optic correction R/(1 − p_e) is undefined at this core index (p_e ≥ 1): switch it off.";

export default defineSchema({
  href: "/fiber-optics/mode-field-diameter",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 5000 },
    { key: "coreRadius", label: "Core radius", unit: "µm", toSI: 1e-6, siUnit: "m", default: 4.1, min: 0.5, max: 100 },
    { key: "na", label: "Numerical aperture", unit: "", toSI: 1, siUnit: "", default: 0.1246, min: 0.01, max: 0.5 },
    { key: "coreIndex", label: "Core index n₁", unit: "", toSI: 1, siUnit: "", default: 1.4494, min: 1, max: 4 },
    { key: "elastoOptic", label: "Elasto-optic correction of the bend loss (1 = on, 0 = off)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0, max: 1 },
  ],
  outputs: [
    { key: "mfdPII", label: "Mode-field diameter (Petermann II)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "mfdFit", label: "Mode-field diameter (Marcuse Gaussian fit)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "aeff", label: "Effective area π w² of the Gaussian fit", unit: "µm²", toSI: 1e-12, siUnit: "m²" },
    { key: "V", label: "V-number", unit: "", toSI: 1, siUnit: "" },
    { key: "cutoff", label: "LP11 cutoff wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "delta", label: "Relative index difference Δ", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "n2", label: "Cladding index n₂", unit: "", toSI: 1, siUnit: "" },
    { key: "b", label: "Normalized propagation constant b", unit: "", toSI: 1, siUnit: "" },
    { key: "nEff", label: "Effective index of LP01", unit: "", toSI: 1, siUnit: "" },
    { key: "gamma", label: "Power in the core Γ", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "bendLoss", label: "Bend loss per turn at 10 mm radius", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ wavelength, coreRadius, na, coreIndex, elastoOptic }) {
    const fiber = { a: coreRadius, n1: coreIndex, NA: na };
    const eo = elastoOptic === 1;
    const s = modeFieldSummary(fiber, wavelength);
    const bendLoss = bendLossPerTurnDb(fiber, wavelength, REFERENCE_BEND_RADIUS, s.mode, eo);
    const valid = Number.isFinite(s.mode.U);
    const eoUndefined = valid && eo && !(elastoOpticBendRadius(1, coreIndex) > 0);
    const warnings: string[] = [];
    if (!valid) warnings.push(`No result: ${NO_RESULT}`);
    else {
      if (s.V > LP11_CUTOFF_V) warnings.push(`V = ${s.V.toFixed(2)} > 2.405: LP11 is also guided, so the fibre is not single-mode here. Values are for LP01.`);
      if (s.V < MFD_FIT_V_RANGE[0] || s.V > MFD_FIT_V_RANGE[1]) {
        warnings.push(`V = ${s.V.toFixed(2)} is outside ${MFD_FIT_V_RANGE[0]}–${MFD_FIT_V_RANGE[1]}, where Marcuse's Gaussian fit is within about 1 %.`);
      }
      if (eoUndefined) warnings.push(NO_EO);
    }
    return {
      values: {
        mfdPII: 2 * s.wPII, mfdFit: 2 * s.wFit, aeff: s.aeff, V: s.V, cutoff: s.cutoff, delta: s.delta, n2: s.n2, b: s.b, nEff: s.nEff,
        gamma: s.gamma, bendLoss,
      },
      warnings,
      reasons: {
        mfdPII: NO_RESULT, mfdFit: NO_RESULT, aeff: NO_RESULT, V: NO_NA, cutoff: NO_NA, n2: NO_NA, b: NO_RESULT, nEff: NO_RESULT, gamma: NO_RESULT,
        bendLoss: eoUndefined ? NO_EO : NO_RESULT,
      },
    };
  },
  checks: [
    {
      // SMF-28-like a = 4.1 µm, NA 0.1246, n₁ 1.4494 at 1550 nm: V = 2π a NA/λ = 2.0708568, U = 1.5515712, W = 1.3715228;
      // Petermann II: w = √2 a J₁(U)/(W J₀(U)) → MFD = 9.886417 µm; b = W²/V² = 0.4386377; n₂ = √(n₁² − NA²) = 1.4440343,
      // n_eff = √(n₂² + b NA²) = 1.4463904; Γ = b(1 + J₀²/J₁²) = 75.947119 %; Δ = NA²/(2n₁²) = 0.3695129 %.
      source: PETERMANN_1983,
      basis: "computed",
      inputs: {},
      expect: { mfdPII: 9.886416700476806, b: 0.43863766711334734, nEff: 1.4463903760617192, gamma: 75.94711892084486, delta: 0.36951287485260814, n2: 1.4440343486219434 },
      tolerance: 1e-8,
    },
    {
      // Same fibre, Marcuse fit: w/a = 0.65 + 1.619/V^1.5 + 2.879/V^6 → MFD = 10.084209 µm; A_eff = π w² = 79.868139 µm²;
      // λc = 2π a NA/2.4048256 = 1334.7446 nm.
      source: MARCUSE_1977,
      basis: "computed",
      inputs: {},
      expect: { mfdFit: 10.084209113123363, aeff: 79.86813939112481, cutoff: 1334.7446494627734, V: 2.070856803887589 },
      tolerance: 1e-8,
    },
    {
      // Bend loss per turn at R = 10 mm, no elasto-optic factor: α = 2.6223687/(4.3429448 · 2π · 0.01) = 9.610 1/m
      // (Marcuse's formula with the LP01 eigenvalues above), per turn 4.3429448 · α · 2πR = 2.6223687 dB.
      source: MARCUSE_1976,
      basis: "computed",
      inputs: { elastoOptic: 0 },
      expect: { bendLoss: 2.6223687356708894 },
      tolerance: 1e-8,
    },
  ],
});
