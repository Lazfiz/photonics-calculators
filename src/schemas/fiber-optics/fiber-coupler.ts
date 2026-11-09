import { MIN_SPACING_IN_RADII, SPECTRAL_WINDOW_HALF_WIDTH, WEAK_GUIDANCE_MAX_DELTA, couplerSummary } from "../../physics/fiber-optics/fiber-coupler";
import { LP11_CUTOFF_V, MIN_V } from "../../physics/fiber-optics/macro-bending-loss";
import { defineSchema } from "../types";

const SNYDER =
  "Snyder A. W. (1972). Coupled-mode theory for optical fibers. J. Opt. Soc. Am. 62(11), 1267–1277, doi:10.1364/JOSA.62.001267 " +
  "(coupling coefficient of two identical step-index cores, κ = (√(2Δ)/a)(U²/V³) K₀(WD/a)/K₁²(W) with √(2Δ) = NA/n₁, power " +
  "transfer sin²(κL)); LP01 eigenvalues U, W from Gloge D. (1971). Weakly guiding fibers. Appl. Opt. 10(10), 2252–2258, " +
  "doi:10.1364/AO.10.002252 (U J₁(U)/J₀(U) = W K₁(W)/K₀(W), V² = U² + W²).";

const NM = 1e-9;

export default defineSchema({
  href: "/fiber-optics/fiber-coupler",
  inputs: [
    { key: "couplingLength", label: "Coupling length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1.4, min: 0, max: 1000 },
    { key: "coreSpacing", label: "Core spacing D (centre to centre)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 12, min: 1, max: 100 },
    { key: "coreRadius", label: "Core radius a", unit: "µm", toSI: 1e-6, siUnit: "m", default: 4.1, min: 0.5, max: 30 },
    { key: "na", label: "Numerical aperture", unit: "", toSI: 1, siUnit: "", default: 0.125, min: 0.01, max: 0.5 },
    { key: "coreIndex", label: "Core index n₁", unit: "", toSI: 1, siUnit: "", default: 1.4494, min: 1, max: 4 },
    { key: "excessLoss", label: "Excess loss", unit: "dB", toSI: 1, siUnit: "dB", default: 0.1, min: 0, max: 30 },
    { key: "inputPower", label: "Input power", unit: "dBm", toSI: 1, siUnit: "dBm", default: 0, min: -100, max: 50 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: NM, siUnit: "m", default: 1550, min: 400, max: 2500 },
  ],
  outputs: [
    { key: "couplingRatio", label: "Fraction coupled to port 2, before excess loss", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "kappa", label: "Coupling coefficient κ", unit: "mm⁻¹", toSI: 1e3, siUnit: "m⁻¹" },
    { key: "V", label: "V number", unit: "", toSI: 1, siUnit: "" },
    { key: "length5050", label: "Length for 50:50", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "lengthFull", label: "Length for full transfer", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "coupledPower", label: "Coupled port power", unit: "dBm", toSI: 1, siUnit: "dBm" },
    { key: "throughPower", label: "Through port power", unit: "dBm", toSI: 1, siUnit: "dBm" },
    { key: "kappaSlope", label: "Relative change of κ with wavelength", unit: "%/nm", toSI: 1e7, siUnit: "m⁻¹" },
  ],
  compute(si) {
    const fiber = { a: si.coreRadius, n1: si.coreIndex, NA: si.na };
    const r = couplerSummary(fiber, si.wavelength, si.coreSpacing, si.couplingLength, si.excessLoss, si.inputPower);
    const warnings: string[] = [];
    if (!Number.isFinite(r.kappa)) {
      warnings.push(
        `No result: the model needs a core spacing D ≥ 2a = ${(2 * si.coreRadius * 1e6).toFixed(1)} µm (separate cores), 0 < NA < n₁ and V ≥ ${MIN_V} (here V = ${r.V.toFixed(3)}).`,
      );
    } else {
      if (r.kappa === 0) warnings.push("κ is zero at this spacing (the evanescent overlap underflows): no coupling.");
      if (r.V > LP11_CUTOFF_V) warnings.push(`V = ${r.V.toFixed(2)} > ${LP11_CUTOFF_V.toFixed(3)}: the cores are not single-mode; only LP01 coupling is computed.`);
      if (r.delta > WEAK_GUIDANCE_MAX_DELTA || si.coreSpacing < MIN_SPACING_IN_RADII * si.coreRadius) {
        warnings.push("The weak-coupling (coupled-mode) model loses accuracy: Δ above 2 % or a core spacing below 2.5 core radii.");
      }
      if (Math.abs(r.cutoffWavelength - si.wavelength) <= SPECTRAL_WINDOW_HALF_WIDTH) {
        warnings.push("The ±100 nm window around the wavelength crosses the LP11 cutoff wavelength: below it the fibre is two-moded and the model is LP01 only.");
      }
      if (!Number.isFinite(r.coupledDbm) || !Number.isFinite(r.throughDbm)) warnings.push("One port is dark, so its power in dBm is not finite.");
    }
    return {
      values: {
        couplingRatio: r.ratio,
        kappa: r.kappa,
        V: r.V,
        length5050: r.L5050,
        lengthFull: r.Lfull,
        coupledPower: r.coupledDbm,
        throughPower: r.throughDbm,
        kappaSlope: r.slopePerNm / NM,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: V = 2π a NA/λ = 2π · 4.1e-6 · 0.125/1.55e-6 = 2.0775048. LP01 root of U J₁(U)/J₀(U) = W K₁(W)/K₀(W) with
      // W = √(V² − U²): U = 1.5536999, W = 1.3791457. κ = (NA/(n₁a)) (U²/V³) K₀(WD/a)/K₁²(W), D/a = 12/4.1,
      // = (0.125/(1.4494 · 4.1e-6)) · (2.41400/8.9667) · K₀(4.0365)/K₁²(1.3791) = 554.149 m⁻¹ = 0.554149 mm⁻¹ (own series/integral
      // Bessel evaluation, not the repo's). L₅₀:₅₀ = π/(4κ) = 1.417305 mm, L_full = π/(2κ) = 2.834609 mm.
      // sin²(κL) at L = 1.4 mm: sin²(0.775809) = 0.4904112. Ports: 10 log₁₀((1 − 0.4904112) · 10^(−0.01)) = −3.027801 dBm and
      // 10 log₁₀(0.4904112 · 10^(−0.01)) = −3.194396 dBm. Wavelength slope (κ(1551 nm) − κ(1549 nm))/(2κ): 0.185622 %/nm.
      source: SNYDER,
      basis: "computed",
      inputs: {},
      expect: {
        V: 2.0775048193093792,
        kappa: 0.5541491157932951,
        length5050: 1.417304730827022,
        lengthFull: 2.834609461654044,
        couplingRatio: 49.04111865749543,
        throughPower: -3.0278011426983786,
        coupledPower: -3.194396318575785,
        kappaSlope: 0.18562179176545493,
      },
      tolerance: 1e-8,
    },
    {
      // At the 50:50 length κL = π/4 exactly, so sin²(κL) = 1/2: 50 % coupled, and each port carries
      // 10 log₁₀(0.5 · 10^(−0.1/10)) = −3.0103000 − 0.1 = −3.1103000 dBm at 0 dBm input and 0.1 dB excess loss.
      source: SNYDER,
      basis: "computed",
      inputs: { couplingLength: 1.417304730827022 },
      expect: { couplingRatio: 50, coupledPower: -3.110299957316, throughPower: -3.110299957316 },
      tolerance: 1e-8,
    },
  ],
});
