import { SCALAR_LIMIT_V_CLAD, SINGLE_MODE_V, taperSummary } from "../../physics/fiber-optics/fiber-taper";
import { defineSchema } from "../types";

const BIRKS_LI =
  "Birks T. A., Li Y. W. (1992). The shape of fiber tapers. J. Lightwave Technol. 10(4), 432–438, doi:10.1109/50.134196 " +
  "(waist radius r_w = r₀(1 + αx/L₀)^(−1/(2α)), r₀e^(−x/(2L₀)) for α = 0; waist length L₀ + αx; each transition (1 − α)x/2). " +
  "Core–cladding transition and mode picture: Love J. D., Henry W. M., Stewart W. J., Black R. J., Lacroix S., Gonthier F. (1991). " +
  "Tapered single-mode fibres and devices. Part 1: adiabaticity criteria. IEE Proc. J 138(5), 343–354, doi:10.1049/ip-j.1991.0060; " +
  "LP01 leaves the core where J₀(V)/(V J₁(V)) = ln S + K₀(W)/(W K₁(W)), S = cladding/core radius, V_cc ≈ √(2/(ln S + ¼)) for small V.";

export default defineSchema({
  href: "/fiber-optics/fiber-taper",
  inputs: [
    { key: "initialDia", label: "Cladding diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 125, min: 10, max: 1000 },
    { key: "coreDia", label: "Core diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 8.2, min: 1, max: 100 },
    { key: "na", label: "Core NA", unit: "", toSI: 1, siUnit: "", default: 0.1246, min: 0.02, max: 0.4 },
    { key: "nClad", label: "Cladding index n₂", unit: "", toSI: 1, siUnit: "", default: 1.444, min: 1.3, max: 2 },
    { key: "nExt", label: "Surround index n₃", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 1.9 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2500 },
    { key: "heaterWidth", label: "Hot-zone length L₀", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.1, max: 200 },
    { key: "elongation", label: "Elongation x", unit: "mm", toSI: 1e-3, siUnit: "m", default: 15, min: 0, max: 500 },
    { key: "alpha", label: "Hot-zone growth α (dL/dx)", unit: "", toSI: 1, siUnit: "", default: 0, min: -0.9, max: 0.9 },
  ],
  outputs: [
    { key: "waistDiameter", label: "Waist (cladding) diameter", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "taperRatio", label: "Taper ratio r₀/r_w", unit: "", toSI: 1, siUnit: "" },
    { key: "coreWaistDiameter", label: "Core diameter at the waist", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "totalLength", label: "Total taper length", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "waistLength", label: "Waist length", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "transitionLength", label: "Length of each transition", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "transitionDiameter", label: "Core–cladding transition diameter", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "transitionV", label: "V of the core at the transition", unit: "", toSI: 1, siUnit: "" },
    { key: "transitionVEstimate", label: "Small-V estimate of that V", unit: "", toSI: 1, siUnit: "" },
    { key: "waistNeff", label: "LP01 effective index at the waist", unit: "", toSI: 1, siUnit: "" },
    { key: "coreVWaist", label: "V_core at the waist", unit: "", toSI: 1, siUnit: "" },
    { key: "claddingVWaist", label: "V_clad at the waist", unit: "", toSI: 1, siUnit: "" },
    { key: "singleModeDiameter", label: "Cladding diameter below which the waist is single-mode", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "decayLength", label: "Evanescent decay length", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "worstAdiabaticity", label: "Worst taper angle over Love delineation, Ω/Ω_d", unit: "", toSI: 1, siUnit: "" },
  ],
  compute(si) {
    const r = taperSummary({
      initialDia: si.initialDia, coreDia: si.coreDia, na: si.na, nClad: si.nClad, nExt: si.nExt, lambda: si.wavelength,
      hotZone: si.heaterWidth, elongation: si.elongation, alpha: si.alpha,
    });
    const warnings: string[] = [];
    if (!(si.coreDia < si.initialDia)) warnings.push("No result: the core must be thinner than the cladding.");
    else if (!(si.nExt < si.nClad)) warnings.push("No result: the surround index must be below the cladding index, or the cladding guides nothing.");
    else if (!(si.heaterWidth + si.alpha * si.elongation > 0)) {
      warnings.push("No result: with α < 0 the hot zone shrinks to zero length (L₀ + αx ≤ 0) before the pull ends.");
    } else if (!r.valid) warnings.push("No result: the inputs are outside the model's domain.");
    if (r.valid) {
      if (r.tcc >= 1) warnings.push("LP01 is already below n₂ in the untapered fibre: there is no core–cladding transition along the taper.");
      if (Number.isFinite(r.worstRatio) && r.worstRatio >= 1) {
        warnings.push("The taper angle exceeds Love's delineation curve: LP01 couples to LP02 there and the taper is lossy.");
      }
      if (r.undefinedPoints > 0) {
        warnings.push(`No guided LP01 was found at ${r.undefinedPoints} of ${r.scan.length} points near the waist, so the delineation and the worst ratio there are undefined and left out.`);
      }
      if (r.VcladWaist < SCALAR_LIMIT_V_CLAD) {
        warnings.push(`V_clad = ${r.VcladWaist.toFixed(2)} at the waist: close to the wavelength, where the scalar mode model is inaccurate; waist results are rough.`);
      }
      if (r.VcladWaist >= SINGLE_MODE_V) warnings.push("The waist guide is multimode (V_clad above 2.405); an adiabatic taper still keeps the light in the fundamental mode.");
    }
    return {
      values: {
        waistDiameter: 2 * r.shape.waistRadius,
        taperRatio: 1 / r.ratio,
        coreWaistDiameter: r.coreWaist,
        totalLength: r.shape.totalLength,
        waistLength: r.shape.waistLength,
        transitionLength: r.shape.transitionLength,
        transitionDiameter: r.tcc < 1 ? r.transitionDia : NaN,
        transitionV: r.Vcc,
        transitionVEstimate: r.VccEstimate,
        waistNeff: r.nEffWaist ?? NaN,
        coreVWaist: r.VcoreWaist,
        claddingVWaist: r.VcladWaist,
        singleModeDiameter: r.singleModeDia,
        decayLength: r.decay,
        worstAdiabaticity: r.worstRatio,
      },
      warnings,
    };
  },
  checks: [
    {
      // α = 0 (constant hot zone), defaults r₀ = 62.5 µm, L₀ = 5 mm, x = 15 mm. Waist r_w = r₀ e^(−x/(2L₀)) = 62.5 e^(−1.5) µm,
      // e^(−1.5) = 0.2231302: waist diameter 125 · 0.2231302 = 27.89127 µm, taper ratio e^1.5 = 4.481689, core 8.2 · 0.2231302 = 1.829667 µm.
      // Lengths: waist L₀ + αx = 5 mm, each transition (1 − α)x/2 = 7.5 mm, total 5 + 2 · 7.5 = 20 mm.
      source: BIRKS_LI,
      basis: "computed",
      inputs: {},
      expect: {
        waistDiameter: 27.891270018553726,
        taperRatio: 4.481689070338065,
        coreWaistDiameter: 1.8296673132171244,
        waistLength: 5,
        transitionLength: 7.5,
        totalLength: 20,
      },
      tolerance: 1e-8,
    },
    {
      // α = 0.5: r_w = r₀ (1 + αx/L₀)^(−1/(2α)) = r₀ (1 + 0.5 · 15/5)^(−1) = r₀/2.5, so the waist diameter is 125/2.5 = 50 µm and the
      // taper ratio 2.5. Waist length L₀ + αx = 5 + 7.5 = 12.5 mm, each transition (1 − 0.5) · 15/2 = 3.75 mm, total 12.5 + 7.5 = 20 mm.
      source: BIRKS_LI,
      basis: "computed",
      inputs: { alpha: 0.5 },
      expect: { waistDiameter: 50, taperRatio: 2.5, waistLength: 12.5, transitionLength: 3.75, totalLength: 20 },
      tolerance: 1e-8,
    },
    {
      // Defaults: k = 2π/1.55 µm, V₀ = k a NA = 2π · 4.1e-6 · 0.1246/1.55e-6 = 2.0708568; waist V_core = V₀ e^(−1.5) = 0.4620706.
      // Cladding–surround aperture √(n₂² − n₃²) = √(1.444² − 1) = 1.0416999; V_clad = k r_w √(n₂² − n₃²) with r_w = 13.945635 µm:
      // 4.053668 · 13.945635 · 1.0416999 = 58.88824. Single-mode below Ø = 2 · 2.405/(k · 1.0416999) = 1.139082 µm.
      // Small-V estimate √(2/(ln S + ¼)), S = 125/8.2 = 15.243902, ln S = 2.724061: √(2/2.974061) = 0.8200331.
      // Transition (own bisection on J₀(V)/(V J₁(V)) = ln S + K₀(W)/(W K₁(W)), V = V₀t, W = k r₀ t √(n₂² − n₃²), own series/integral
      // Bessel code): t = 0.3948724, so the cladding diameter there is 125 t = 49.35905 µm and V_cc = V₀ t = 0.8177242.
      source: BIRKS_LI,
      basis: "computed",
      inputs: {},
      expect: {
        coreVWaist: 0.46207061029590335,
        claddingVWaist: 58.88823672104098,
        singleModeDiameter: 1.1390815573639739,
        transitionVEstimate: 0.8200331399245842,
        transitionDiameter: 49.35904744224845,
        transitionV: 0.8177241538335241,
      },
      tolerance: 1e-8,
    },
  ],
});
