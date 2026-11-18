import { LP11_CUTOFF_V, MIN_V } from "../../physics/fiber-optics/macro-bending-loss";
import {
  CORE_LAYOUTS, WEAK_COUPLING_XT, WEAK_GUIDANCE_DELTA, multiCoreSummary,
} from "../../physics/fiber-optics/multi-core";
import { defineSchema } from "../types";

const SNYDER_1972 = "Snyder A. W. (1972). Coupled-mode theory for optical fibers. J. Opt. Soc. Am. 62, 1267–1277, doi:10.1364/JOSA.62.001267; " +
  "coupling coefficient of two identical step-index cores κ = (NA/(n₁a)) (U²/V³) K₀(WΛ/a)/K₁²(W) with the LP01 eigenvalues U, W " +
  "(Gloge D. (1971), Appl. Opt. 10, 2252, doi:10.1364/AO.10.002252), NA = √(n₁² − n₂²), V = 2π a NA/λ.";
const KOSHIBA_2012 = "Koshiba M., Saitoh K., Takenaga K., Matsuo S. (2012). Analytical expression of average power-coupling coefficients for " +
  "estimating intercore crosstalk in multicore fibers. IEEE Photonics J. 4, 1987–1995, doi:10.1109/JPHOT.2012.2221085; " +
  "h̄ = 2κ²d Re[1/√((1 + i dΔβ)² + (dβΛ/R_b)²)] with exponential autocorrelation of correlation length d, and Hayashi T. et al. (2011), " +
  "Opt. Express 19, 16576, doi:10.1364/OE.19.016576: XT = tanh(h̄L), β = 2π n_eff/λ with n_eff² = n₂² + b NA², b = W²/V².";

const NO_N1 = "n₁ must exceed n₂; otherwise the cores do not guide.";
const SINGLE = "A single core has no neighbours, so there is no crosstalk to report.";
const ZERO_XT = "The crosstalk is zero (zero fibre length, or h̄L underflowed): −∞ dB.";
const INFINITE_RPK = "With Δβ = 0 identical cores are always phase-matched: R_pk is infinite.";

const toDb = (x: number) => 10 * Math.log10(x);

export default defineSchema({
  href: "/fiber-optics/multi-core",
  inputs: [
    { key: "numCores", label: "Number of cores (1, 3, 7, 12 or 19)", unit: "", toSI: 1, siUnit: "", default: 7, min: 1, max: 19 },
    { key: "corePitch", label: "Core pitch Λ", unit: "µm", toSI: 1e-6, siUnit: "m", default: 45, min: 5, max: 200 },
    { key: "coreRadius", label: "Core radius a", unit: "µm", toSI: 1e-6, siUnit: "m", default: 4.5, min: 0.5, max: 30 },
    { key: "coreIndex", label: "Core index n₁", unit: "", toSI: 1, siUnit: "", default: 1.468, min: 1, max: 4 },
    { key: "claddingIndex", label: "Cladding index n₂", unit: "", toSI: 1, siUnit: "", default: 1.463, min: 1, max: 4 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2500 },
    { key: "fiberLength", label: "Fibre length", unit: "km", toSI: 1e3, siUnit: "m", default: 10, min: 0, max: 10000 },
    { key: "deltaBeta", label: "Core mismatch Δβ", unit: "rad/m", toSI: 1, siUnit: "rad/m", default: 0, min: 0, max: 100000 },
    { key: "bendRadius", label: "Bend radius R_b", unit: "mm", toSI: 1e-3, siUnit: "m", default: 100, min: 1, max: 10000 },
    { key: "correlationLength", label: "Correlation length d", unit: "m", toSI: 1, siUnit: "m", default: 0.05, min: 0.001, max: 10 },
    { key: "outerCladding", label: "Outer cladding thickness", unit: "µm", toSI: 1e-6, siUnit: "m", default: 30, min: 0, max: 200 },
  ],
  outputs: [
    { key: "kappa", label: "Coupling coefficient κ", unit: "1/m", toSI: 1, siUnit: "1/m" },
    { key: "h", label: "Bend- and twist-averaged power coupling h̄", unit: "1/m", toSI: 1, siUnit: "1/m" },
    { key: "pair", label: "Crosstalk with one neighbour, tanh(h̄L)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "worst", label: "Crosstalk of the worst core (first-order neighbour sum)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "rpk", label: "Critical bend radius R_pk = βΛ/Δβ", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "claddingDiameter", label: "Cladding diameter", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "V", label: "V-number", unit: "", toSI: 1, siUnit: "" },
  ],
  validate({ numCores }) {
    return CORE_LAYOUTS[numCores] ? undefined : "numCores must be 1, 3, 7, 12 or 19.";
  },
  compute({ numCores, corePitch, coreRadius, coreIndex, claddingIndex, wavelength, fiberLength, deltaBeta, bendRadius, correlationLength, outerCladding }) {
    const s = multiCoreSummary({
      numCores, corePitch_um: corePitch * 1e6, coreRadius_um: coreRadius * 1e6, coreIndex, claddingIndex, wavelength_nm: wavelength * 1e9,
      fiberLength_km: fiberLength * 1e-3, deltaBeta, bendRadius_mm: bendRadius * 1e3, correlationLength, outerCladding_um: outerCladding * 1e6,
    });
    const valid = Number.isFinite(s.kappa) && Number.isFinite(s.h);
    const causes: string[] = [];
    if (!(coreIndex > claddingIndex)) causes.push("n₁ must exceed n₂");
    else if (!(s.V >= MIN_V)) causes.push(`V = ${Number.isFinite(s.V) ? s.V.toFixed(3) : "—"} is below ${MIN_V}`);
    if (!(corePitch >= 2 * coreRadius)) causes.push("the pitch must be at least two core radii");
    const noResult = `No result: ${causes.length > 0 ? causes.join("; ") : "the coupling is undefined here"}.`;
    const single = s.layout.neighbours === 0;
    const pair = single ? NaN : toDb(s.pair);
    const worst = single ? NaN : toDb(s.worst);
    const delta = (coreIndex ** 2 - claddingIndex ** 2) / (2 * coreIndex ** 2);
    const warnings: string[] = [];
    if (!valid) warnings.push(noResult);
    else {
      if (s.V > LP11_CUTOFF_V) {
        warnings.push(`V = ${s.V.toFixed(2)} > ${LP11_CUTOFF_V.toFixed(3)}: the cores carry LP11 as well; only LP01 coupling is computed, and LP11 couples far more strongly.`);
      }
      if (single) warnings.push(SINGLE);
      else if (s.pair === 0) warnings.push(ZERO_XT);
      else if (!(s.pair < WEAK_COUPLING_XT)) {
        warnings.push("The pair crosstalk is above −10 dB: the cores are strongly coupled over this length and the neighbour sum overestimates the worst core.");
      }
    }
    if (Number.isFinite(delta) && delta > WEAK_GUIDANCE_DELTA) {
      warnings.push(`Δ = ${(delta * 100).toFixed(2)} % > 3 %: outside the weakly guiding LP model, so κ and the LP01 field are only approximate.`);
    }
    const xtReason = single ? SINGLE : valid ? ZERO_XT : noResult;
    return {
      values: {
        kappa: s.kappa, h: s.h, pair, worst, rpk: s.rpk, claddingDiameter: s.claddingDiameter * 1e-6, V: s.V,
      },
      warnings,
      reasons: {
        kappa: noResult, h: noResult, pair: xtReason, worst: xtReason, rpk: deltaBeta === 0 ? INFINITE_RPK : noResult, V: NO_N1,
      },
    };
  },
  checks: [
    {
      // Hexagonal 7-core fibre, Λ = 45 µm, a = 4.5 µm, n₁ 1.468, n₂ 1.463, 1550 nm, 10 km, R_b = 100 mm, d = 0.05 m, Δβ = 0:
      // NA = √(n₁² − n₂²) = 0.121063, V = 2.208277, LP01 U, W from U J₁(U)/J₀(U) = W K₁(W)/K₀(W); κ = 4.446780e-3 1/m;
      // b = W²/V², n_eff = √(n₂² + b NA²), β = 2π n_eff/λ = 5.940240e6 rad/m; dβΛ/R_b = 0.05 · β · 45e-6/0.1 = 133.65;
      // h̄ = 2κ²d/√(1 + 133.65²) = 1.479424e-8 1/m; XT = tanh(h̄ · 1e4 m) = 1.4794e-4 → −38.299073 dB; worst core 6 neighbours: −30.517561 dB.
      source: KOSHIBA_2012,
      basis: "computed",
      inputs: {},
      expect: { kappa: 0.004446780189011436, h: 1.4794240693679085e-8, pair: -38.29907323026831, worst: -30.517560726431874, V: 2.208277234960632 },
      tolerance: 1e-8,
    },
    {
      // Ring of 12 (2 neighbours, outer radius Λ/(2 sin 15°)), Λ = 45 µm, 1550 nm (single-mode, V = 2.208277), 100 km, R_b = 50 mm, d = 0.1 m, Δβ = 500 rad/m:
      // κ = 4.446780e-3 1/m, β = 5.940240e6 rad/m; dΔβ = 50, dβΛ/R_b = 534.62, z = (1 + 50i)² + 534.62² = 2.8834e5 + 100i;
      // h̄ = 2κ²d Re[z^(−1/2)] = 7.429879e-9 1/m; XT = tanh(7.4299e-9 · 1e5) = 7.4299e-4 → −31.290183 dB, worst (2 neighbours) −28.279883 dB;
      // R_pk = βΛ/Δβ = 534.6216 mm; cladding diameter 2(Λ/(2 sin 15°) + 30 µm) = 233.8666 µm.
      source: `${SNYDER_1972} ${KOSHIBA_2012}`,
      basis: "computed",
      inputs: { numCores: 12, fiberLength: 100, deltaBeta: 500, bendRadius: 50, correlationLength: 0.1 },
      expect: { V: 2.208277234960632, kappa: 0.004446780189011614, h: 7.429879024530135e-9, pair: -31.29018337406679, worst: -28.279883417426976, rpk: 534.6215738770992, claddingDiameter: 233.8666487320323 },
      tolerance: 1e-8,
    },
  ],
});
