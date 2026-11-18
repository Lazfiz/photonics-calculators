import { LP11_CUTOFF_V, MFD_FIT_V_RANGE, MIN_V, elastoOpticBendRadius } from "../../physics/fiber-optics/macro-bending-loss";
import { macroBendSummary } from "../../physics/fiber-optics/macro-bending-loss-summary";
import { defineSchema } from "../types";

const MARCUSE_1976 = "Marcuse D. (1976). Curvature loss formula for optical fibers. J. Opt. Soc. Am. 66, 216–220, " +
  "doi:10.1364/JOSA.66.000216; LP_ν curvature loss for ν = 0 (K_{ν−1}K_{ν+1} = K₁²): α = √π κ² exp(−2γ³R/(3β²)) / (2 γ^(3/2) V² √R K₁²(W)), " +
  "κ = U/a, γ = W/a, β² = (n₁k)² − κ², with the exact LP01 eigenvalues U, W of Gloge D. (1971), Weakly guiding fibers, Appl. Opt. 10, 2252, doi:10.1364/AO.10.002252; " +
  "loss per turn = 10 log₁₀(e) α 2πR dB.";
const MARCUSE_1977 = "Marcuse D. (1977). Loss analysis of single-mode fiber splices. Bell Syst. Tech. J. 56, 703–718, " +
  "doi:10.1002/j.1538-7305.1977.tb00534.x; Gaussian fit w/a = 0.65 + 1.619 V^(−3/2) + 2.879 V^(−6), V = 2π a NA/λ; " +
  "LP11 cutoff at V = 2.405 (first zero of J₀).";

const NO_RESULT = `The model needs V ≥ ${MIN_V} and NA < n₁; outside that there is no result.`;
const NO_NA = "NA must be below n₁; otherwise the fibre is not a guide.";
const NO_EO = "The elasto-optic correction R/(1 − p_e) is undefined at this core index (p_e ≥ 1): untick it.";

export default defineSchema({
  href: "/fiber-optics/macro-bending-loss",
  inputs: [
    { key: "bendRadius", label: "Bend radius", unit: "mm", toSI: 1e-3, siUnit: "m", default: 15, min: 1, max: 1000 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 5000 },
    { key: "coreRadius", label: "Core radius", unit: "µm", toSI: 1e-6, siUnit: "m", default: 4.1, min: 0.5, max: 100 },
    { key: "coreNA", label: "Core numerical aperture", unit: "", toSI: 1, siUnit: "", default: 0.1246, min: 0.01, max: 0.5 },
    { key: "coreIndex", label: "Core index n₁", unit: "", toSI: 1, siUnit: "", default: 1.4494, min: 1, max: 4 },
    { key: "numBends", label: "Number of turns", unit: "turns", toSI: 1, siUnit: "turns", default: 1, min: 1, max: 10000 },
    { key: "elastoOptic", label: "Elasto-optic correction (1 = on, 0 = off)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0, max: 1 },
  ],
  outputs: [
    { key: "perTurn", label: "Loss per turn", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "dBPerMetre", label: "Loss per metre of bent fibre", unit: "dB/m", toSI: 1, siUnit: "dB/m" },
    { key: "total", label: "Total loss of all turns", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "V", label: "V-number", unit: "", toSI: 1, siUnit: "" },
    { key: "cutoff", label: "LP11 cutoff wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "mfd", label: "Mode-field diameter (Marcuse fit)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "n2", label: "Cladding index n₂", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ bendRadius, wavelength, coreRadius, coreNA, coreIndex, numBends, elastoOptic }) {
    const eo = elastoOptic === 1;
    const s = macroBendSummary({ a: coreRadius, n1: coreIndex, NA: coreNA }, wavelength, bendRadius, numBends, eo);
    const warnings: string[] = [];
    const eoUndefined = eo && !(elastoOpticBendRadius(1, coreIndex) > 0);
    if (eoUndefined) warnings.push(NO_EO);
    else if (!Number.isFinite(s.perTurn)) warnings.push(`No result: ${NO_RESULT}`);
    else if (s.V > LP11_CUTOFF_V) {
      warnings.push(`V = ${s.V.toFixed(2)} > 2.405: the fibre is not single-mode at this wavelength. The loss shown is for LP01 only.`);
    }
    const lossReason = eoUndefined ? NO_EO : NO_RESULT;
    const mfdFinite = Number.isFinite(s.mfd);
    if (mfdFinite && (s.V < MFD_FIT_V_RANGE[0] || s.V > MFD_FIT_V_RANGE[1])) {
      warnings.push(`V = ${s.V.toFixed(2)} is outside ${MFD_FIT_V_RANGE[0]}–${MFD_FIT_V_RANGE[1]}: the mode-field diameter is an extrapolation of Marcuse's fit.`);
    }
    return {
      values: { perTurn: s.perTurn, dBPerMetre: s.dBPerMetre, total: s.total, V: s.V, cutoff: s.cutoff, mfd: s.mfd, n2: s.n2 },
      warnings,
      reasons: { perTurn: lossReason, dBPerMetre: lossReason, total: lossReason, V: NO_NA, cutoff: NO_NA, mfd: NO_RESULT, n2: NO_NA },
    };
  },
  checks: [
    {
      // SMF-28-like a = 4.1 µm, NA 0.1246, n₁ 1.4494 at 1550 nm, R = 15 mm, no elasto-optic factor: V = 2π a NA/λ = 2.0708568;
      // LP01 root of U J₁(U)/J₀(U) = W K₁(W)/K₀(W): U = 1.5515712, W = 1.3715228;
      // α = √π κ² exp(−2γ³R/(3β²)) / (2 γ^(3/2) V² √R K₁²(W)) = 0.2081287 1/m → 0.9038915 dB/m;
      // per turn: 4.3429448 · α · 2πR = 0.0851898 dB; 10 turns 0.851898 dB.
      source: MARCUSE_1976,
      basis: "computed",
      inputs: { elastoOptic: 0, numBends: 10 },
      expect: { perTurn: 0.08518976625278628, dBPerMetre: 0.9038914933316045, total: 0.8518976625278628 },
      tolerance: 1e-8,
    },
    {
      // Same fibre at R = 5 mm: α = 2225.2605/4.3429448 = 512.385 1/m; per turn 4.3429448 · α · 2πR = 69.908619 dB.
      source: MARCUSE_1976,
      basis: "computed",
      inputs: { elastoOptic: 0, bendRadius: 5 },
      expect: { perTurn: 69.9086188597868, dBPerMetre: 2225.260451252474 },
      tolerance: 1e-8,
    },
    {
      // V = 2π · 4.1e-6 · 0.1246/1.55e-6 = 2.0708568; λc = 2π a NA/2.4048256 = 1334.7446 nm;
      // w/a = 0.65 + 1.619/V^1.5 + 2.879/V^6 → MFD = 2 · 4.1 · w/a = 10.084209 µm.
      source: MARCUSE_1977,
      basis: "computed",
      inputs: {},
      expect: { V: 2.070856803887589, cutoff: 1334.7446494627735, mfd: 10.084209113123363 },
      tolerance: 1e-8,
    },
  ],
});
