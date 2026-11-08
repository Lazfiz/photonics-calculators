import {
  differentialEfficiency, facetShare, gaussianFarField, logGainCarrierDensity, MAX_LOG_GAIN_RATIO, mirrorLoss, modeSpacing,
  radiativeShare, recombinationRate, slopeEfficiency, thresholdCurrent, thresholdModalGain,
} from "../../physics/wave-optics/diode-laser";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const SOURCE =
  "Coldren L. A., Corzine S. W., Mašanović M. L. (2012). Diode Lasers and Photonic Integrated Circuits, 2nd ed. Wiley, " +
  "doi:10.1002/9781118148167, ch. 2 (mirror loss α_m = ln(1/(R₁R₂))/(2L), threshold gain Γg_th = α_i + α_m, differential " +
  "efficiency η_i α_m/(α_i + α_m)) and ch. 4 (logarithmic gain g = g₀ ln(N/N_tr), ABC recombination)";

export default defineSchema({
  href: "/wave-optics/diode-laser-resonator",
  inputs: [
    { key: "cavityLength", label: "Cavity length L", unit: "µm", toSI: 1e-6, siUnit: "m", default: 300, min: 20, max: 1e4 },
    { key: "stripeWidth", label: "Stripe width w", unit: "µm", toSI: 1e-6, siUnit: "m", default: 3, min: 0.5, max: 500 },
    { key: "activeThickness", label: "Total active (well) thickness d", unit: "nm", toSI: 1e-9, siUnit: "m", default: 24, min: 1, max: 1000 },
    { key: "wavelength", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 980, min: 300, max: 3000 },
    { key: "alpha_i", label: "Internal loss α_i", unit: "1/cm", toSI: 100, siUnit: "1/m", default: 10, min: 0, max: 100 },
    { key: "mirrorR1", label: "Rear facet reflectance R₁", unit: "", toSI: 1, siUnit: "", default: 0.32, min: 0.001, max: 1 },
    { key: "mirrorR2", label: "Front facet reflectance R₂", unit: "", toSI: 1, siUnit: "", default: 0.32, min: 0.001, max: 1 },
    { key: "gamma", label: "Confinement factor Γ", unit: "", toSI: 1, siUnit: "", default: 0.06, min: 0.001, max: 1 },
    { key: "etaI", label: "Injection efficiency η_i", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.01, max: 1 },
    { key: "g0", label: "Gain coefficient g₀", unit: "1/cm", toSI: 100, siUnit: "1/m", default: 1200, min: 1, max: 1e5 },
    { key: "Ntr", label: "Transparency carrier density N_tr", unit: "10¹⁸ cm⁻³", toSI: 1e24, siUnit: "1/m³", default: 1.8, min: 0.01, max: 100 },
    { key: "A", label: "Defect recombination A", unit: "1/s", toSI: 1, siUnit: "1/s", default: 4e8, min: 0, max: 1e10 },
    { key: "B", label: "Radiative recombination B", unit: "cm³/s", toSI: 1e-6, siUnit: "m³/s", default: 1e-10, min: 0, max: 1e-8 },
    { key: "C", label: "Auger recombination C", unit: "cm⁶/s", toSI: 1e-12, siUnit: "m⁶/s", default: 3.5e-30, min: 0, max: 1e-27 },
    { key: "wPerp", label: "Near-field radius, fast axis w⊥ (1/e²)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0.5, min: 0.05, max: 100 },
    { key: "wPar", label: "Near-field radius, slow axis w∥ (1/e²)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 2, min: 0.05, max: 500 },
    { key: "ng", label: "Group index n_g", unit: "", toSI: 1, siUnit: "", default: 3.9, min: 1, max: 6 },
  ],
  outputs: [
    { key: "mirrorLoss", label: "Mirror loss α_m", unit: "1/cm", toSI: 100, siUnit: "1/m" },
    { key: "thresholdModalGain", label: "Threshold modal gain Γg_th = α_i + α_m", unit: "1/cm", toSI: 100, siUnit: "1/m" },
    { key: "thresholdCarrierDensity", label: "Threshold carrier density N_th", unit: "10¹⁸ cm⁻³", toSI: 1e24, siUnit: "1/m³" },
    { key: "thresholdCurrent", label: "Threshold current I_th", unit: "mA", toSI: 1e-3, siUnit: "A" },
    { key: "thresholdCurrentDensity", label: "Threshold current density J_th", unit: "A/cm²", toSI: 1e4, siUnit: "A/m²" },
    { key: "carrierLifetime", label: "Carrier lifetime at threshold", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "radiativeShare", label: "Radiative share of the recombination at threshold", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "differentialEfficiency", label: "Differential efficiency η_d (both facets)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "slopeEfficiency", label: "Slope efficiency (both facets)", unit: "W/A", toSI: 1, siUnit: "W/A" },
    { key: "frontShare", label: "Front-facet share of the output", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "fastFwhm", label: "Fast-axis far-field divergence θ⊥ (FWHM)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "slowFwhm", label: "Slow-axis far-field divergence θ∥ (FWHM)", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "modeSpacing", label: "Longitudinal mode spacing λ²/(2n_gL)", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute(p) {
    const L = p.cavityLength;
    const alphaM = mirrorLoss(L, p.mirrorR1, p.mirrorR2);
    const gTh = thresholdModalGain(p.alpha_i, L, p.mirrorR1, p.mirrorR2);
    const nTh = logGainCarrierDensity(gTh / p.gamma, p.g0, p.Ntr);
    const iTh = thresholdCurrent(p.stripeWidth * p.activeThickness * L, nTh, p.A, p.B, p.C, p.etaI);
    const etaD = differentialEfficiency(p.etaI, p.alpha_i, alphaM);
    const warnings: string[] = [];
    if (!Number.isFinite(nTh) && Number.isFinite(gTh)) {
      warnings.push(
        `The material gain needed, ${(gTh / p.gamma / 100).toPrecision(4)} 1/cm, is more than ${MAX_LOG_GAIN_RATIO} g₀ (N above e³ N_tr): ` +
        "beyond the logarithmic gain fit, so this cavity can't reach threshold.",
      );
    }
    return {
      values: {
        mirrorLoss: alphaM,
        thresholdModalGain: gTh,
        thresholdCarrierDensity: nTh,
        thresholdCurrent: iTh,
        thresholdCurrentDensity: iTh / (p.stripeWidth * L),
        carrierLifetime: nTh / recombinationRate(nTh, p.A, p.B, p.C),
        radiativeShare: radiativeShare(nTh, p.A, p.B, p.C),
        differentialEfficiency: etaD,
        slopeEfficiency: slopeEfficiency(etaD, p.wavelength),
        frontShare: facetShare(p.mirrorR1, p.mirrorR2),
        fastFwhm: gaussianFarField(p.wavelength, p.wPerp).fwhm,
        slowFwhm: gaussianFarField(p.wavelength, p.wPar).fwhm,
        modeSpacing: modeSpacing(p.wavelength, p.ng, L),
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: α_m = ln(1/0.32²)/(2 · 300 µm) = 37.981143 1/cm, Γg_th = 10 + 37.981143 = 47.981143 1/cm,
      // N_th = N_tr exp(Γg_th/(Γ g₀)) = 1.8e18 exp(47.981143/(0.06 · 1200)) = 3.5050032e18 cm⁻³,
      // I_th = q w d L (A N + B N² + C N³)/η_i = 12.031185 mA, η_d = 0.8 · 37.981143/47.981143 = 63.326783 %,
      // slope = η_d h c/(q λ) = 0.80117556 W/A, mode spacing λ²/(2 n_g L) = 0.41042735 nm, fast-axis FWHM = √(2 ln 2) atan(λ/(π w⊥)) = 37.629458°.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        mirrorLoss: 37.981142772945496, thresholdModalGain: 47.981142772945496, thresholdCarrierDensity: 3.5050031725554094,
        thresholdCurrent: 12.031184871670241, thresholdCurrentDensity: 1336.7983190744712, differentialEfficiency: 63.3267831117377,
        slopeEfficiency: 0.801175555455298, modeSpacing: 0.41042735042735057, fastFwhm: 37.6294575006946, slowFwhm: 10.437858952743715,
      },
      tolerance: 1e-8,
    },
    {
      // L = 1000 µm, R₁ = 0.95, R₂ = 0.05, λ = 1064 nm, other inputs default: α_m = ln(1/0.0475)/(2 mm) = 15.235128 1/cm,
      // N_th = 2.5555681e18 cm⁻³, I_th = 24.99976 mA, carrier lifetime N_th/R(N_th) = 1.4740239 ns, radiative share 37.66968 %,
      // η_d = 48.298159 %, front share (1 − R₂)√R₁/((1 − R₂)√R₁ + (1 − R₁)√R₂) = 98.806954 %.
      source: SOURCE,
      basis: "computed",
      inputs: { cavityLength: 1000, mirrorR1: 0.95, mirrorR2: 0.05, wavelength: 1064 },
      expect: {
        mirrorLoss: 15.235127839707706, thresholdCarrierDensity: 2.5555681109587645, thresholdCurrent: 24.9997602547581,
        carrierLifetime: 1.474023880638988, radiativeShare: 37.669684241526866, differentialEfficiency: 48.29815941169148,
        frontShare: 98.80695421511703,
      },
      tolerance: 1e-8,
    },
  ],
});
