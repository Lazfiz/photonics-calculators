import {
  FIT_D_OVER_PITCH, FIT_MAX_LAMBDA_OVER_PITCH, NIELSEN_V_RANGE, pcfInputStatus, pcfMode,
} from "../../physics/fiber-optics/photonic-crystal";
import { defineSchema } from "../types";

const SAITOH = "Saitoh K., Koshiba M. (2005). Empirical relations for simple design of photonic crystal fibers. Optics Express 13, " +
  "267–274. https://doi.org/10.1364/OPEX.13.000267 (V and W fits, Eqs. 1–4, Tables 1–2; V_eff = (2πa_eff/λ)√(n_co² − n_FSM²), a_eff = Λ/√3).";
const NIELSEN = "Nielsen M. D., Mortensen N. A., Folkenberg J. R., Bjarklev A. (2003). Mode-field radius of photonic crystal fibers " +
  "expressed by the V parameter. Optics Letters 28, 2309–2311. https://doi.org/10.1364/OL.28.002309 (spot-size fit " +
  "w/Λ = 0.7078 V^−0.2 + 0.2997 V^−1.5 + 0.0037 V^−6 in V_PCF = √3 W).";

const NOT_PHYSICAL = "The fitted W is outside 0 < W < V here, which would put n_eff below the cladding index: the fit breaks down at long wavelengths for small d/Λ.";
const NO_FSM = `λ/Λ is far beyond the fit range (λ/Λ ≤ ${FIT_MAX_LAMBDA_OVER_PITCH}): the fitted V implies a cladding index n_FSM below 1 (n_FSM² < 1), so n_FSM, the NA and the indices that follow from it are not defined.`;
const NO_DISPERSION = "n_eff is not defined at the neighbouring wavelengths of the second derivative (the fitted W leaves 0 < W < V).";
const NO_MFD = `V_PCF is below ${NIELSEN_V_RANGE[0]}, outside Nielsen's fit (weakly confined mode).`;
const ESM = "The fibre is endlessly single-mode (V stays below 2.405 at every wavelength): there is no second-mode cutoff.";
const NO_CUTOFF = "V stays above 2.405 out to λ/Λ = 50: the cutoff lies beyond the fit.";

export default defineSchema({
  href: "/fiber-optics/photonic-crystal",
  inputs: [
    { key: "pitch", label: "Pitch Λ", unit: "µm", toSI: 1e-6, siUnit: "m", default: 4.5, min: 0.5, max: 50 },
    { key: "holeDiameter", label: "Hole diameter d", unit: "µm", toSI: 1e-6, siUnit: "m", default: 2.7, min: 0.05, max: 50 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 300, max: 3000 }, // 300 and 3000 nm equal PCF_LAMBDA_RANGE (the page's range); literals avoid 300.00000000000006
  ],
  outputs: [
    { key: "vEff", label: "V_eff (a_eff = Λ/√3)", unit: "", toSI: 1, siUnit: "" },
    { key: "w", label: "W", unit: "", toSI: 1, siUnit: "" },
    { key: "nEff", label: "Effective index n_eff", unit: "", toSI: 1, siUnit: "" },
    { key: "nFsm", label: "Cladding index n_FSM", unit: "", toSI: 1, siUnit: "" },
    { key: "na", label: "Effective cladding NA", unit: "", toSI: 1, siUnit: "" },
    { key: "cutoffWavelength", label: "Second-mode cutoff wavelength λ_c", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "mfd", label: "Mode-field diameter", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "effectiveArea", label: "Effective area A_eff = πw²", unit: "µm²", toSI: 1e-12, siUnit: "m²" },
    { key: "dispersion", label: "Dispersion D (total)", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²" },
    { key: "materialDispersion", label: "Dispersion of bulk silica", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²" },
    { key: "waveguideDispersion", label: "Waveguide dispersion (total − silica)", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²" },
  ],
  validate({ pitch, holeDiameter, wavelength }) {
    const status = pcfInputStatus(pitch, holeDiameter, wavelength);
    if (status.geometryBad) return "The holes must be smaller than the pitch (0 < d < Λ).";
    if (status.dOutOfFit) {
      return `d/Λ = ${(holeDiameter / pitch).toFixed(3)} is outside the fitted range ${FIT_D_OVER_PITCH[0]}–${FIT_D_OVER_PITCH[1]}, where the empirical relations diverge.`;
    }
    return undefined;
  },
  compute({ pitch, holeDiameter, wavelength }) {
    const m = pcfMode(pitch, holeDiameter, wavelength);
    const warnings: string[] = [];
    if (m.physical && !m.inFitRange) {
      warnings.push(`λ/Λ = ${m.lambdaOverPitch.toFixed(2)} is beyond the fitted range (λ/Λ ≤ ${FIT_MAX_LAMBDA_OVER_PITCH}): the relations are extrapolated and less reliable.`);
    }
    if (m.physical && m.vPcf > NIELSEN_V_RANGE[1]) warnings.push(`V_PCF = ${m.vPcf.toFixed(2)} is past ${NIELSEN_V_RANGE[1]}: the mode-field fit is extrapolated.`);
    const cutoff = m.endlesslySingleMode ? NaN : m.cutoffWavelength;
    return {
      values: {
        vEff: m.V,
        w: m.W,
        nEff: m.nEff,
        nFsm: m.nFsm,
        na: m.na,
        cutoffWavelength: cutoff,
        mfd: m.mfd,
        effectiveArea: m.effectiveArea,
        dispersion: m.dispersion,
        materialDispersion: m.materialDispersion,
        waveguideDispersion: m.waveguideDispersion,
      },
      warnings,
      reasons: {
        nEff: m.physical ? NO_FSM : NOT_PHYSICAL,
        nFsm: m.physical ? NO_FSM : NOT_PHYSICAL,
        na: m.physical ? NO_FSM : NOT_PHYSICAL,
        mfd: m.physical ? NO_MFD : NOT_PHYSICAL,
        effectiveArea: m.physical ? NO_MFD : NOT_PHYSICAL,
        dispersion: !m.physical ? NOT_PHYSICAL : Number.isFinite(m.nEff) ? NO_DISPERSION : NO_FSM,
        waveguideDispersion: !m.physical ? NOT_PHYSICAL : Number.isFinite(m.nEff) ? NO_DISPERSION : NO_FSM,
        cutoffWavelength: m.endlesslySingleMode ? ESM : NO_CUTOFF,
      },
    };
  },
  checks: [
    {
      // Λ = 4.5 µm, d = 2.7 µm (d/Λ = 0.6), λ = 1550 nm: λ/Λ = 0.344444. V, W from the fit with the Table 1–2 coefficients;
      // a_eff = Λ/√3 = 2.598076 µm, k a_eff = 2π a_eff/λ; n_co = 1.44402362 (Malitson three-term Sellmeier, B = 0.6961663, 0.4079426,
      // 0.8974794, C = 0.0684043², 0.1162414², 9.896161² µm²). V = 2.93321832, W = 2.40083721;
      // n_eff² = n_co² − (V² − W²)/(k a_eff)² gives n_eff = 1.43513130; n_FSM² = n_co² − (V/(k a_eff))² gives 1.41691042; NA = V/(k a_eff) = 0.27851227.
      // The second-mode cutoff is the bisection root of V(λ_c/Λ) = 2.405: 3024.14299 nm.
      source: SAITOH,
      basis: "computed",
      inputs: {},
      expect: { vEff: 2.9332183247347663, w: 2.400837213197771, nEff: 1.4351313029048778, nFsm: 1.4169104190208426, na: 0.27851226994009065, cutoffWavelength: 3024.1429911189152 },
      tolerance: 1e-8,
    },
    {
      // Same fibre: V_PCF = √3 W = 4.158372; w = Λ(0.7078 V^−0.2 + 0.2997 V^−1.5 + 0.0037 V^−6) = 2.5542275 µm, so the mode-field
      // diameter 2w = 5.10845494 µm and A_eff = πw² = 20.4959954 µm².
      source: NIELSEN,
      basis: "computed",
      inputs: {},
      expect: { mfd: 5.108454936313508, effectiveArea: 20.495995387713116 },
      tolerance: 1e-8,
    },
    {
      // Same fibre: D = −(λ/c) d²n_eff/dλ² by the central difference with h = λ/500 (the module's step, not the converged
      // second derivative, which is 52.5435 ps/(nm·km), 2e-6 relative away), n_eff from the first case:
      // 52.543391 ps/(nm·km). The second difference cancels about 7 digits of n_eff, so the tolerance is 1e-6.
      source: SAITOH,
      basis: "computed",
      inputs: {},
      expect: { dispersion: 52.5433912355093 },
      tolerance: 1e-6,
    },
  ],
});
