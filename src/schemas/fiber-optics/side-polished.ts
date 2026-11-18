import { NEAR_LEAK_FRACTION, PERTURBATION_FRACTION } from "../../physics/fiber-optics/coupled-mode";
import { LP11_CUTOFF_V, MIN_V } from "../../physics/fiber-optics/macro-bending-loss";
import { TOUCHING_CLADDING, sidePolishedSummary } from "../../physics/fiber-optics/side-polished";
import { defineSchema } from "../types";

const GLOGE_SNYDER = "Snyder A. W., Love J. D. (1983). Optical Waveguide Theory, Chapman & Hall (Springer reprint 1984): exact LP01 mode of a step-index fibre " +
  "(U J₁(U)/J₀(U) = W K₁(W)/K₀(W), V² = U² + W²; ψ = J₀(Ur/a) in the core, J₀(U) K₀(Wr/a)/K₀(W) in the cladding); " +
  "first-order perturbation Δ(n_eff²) = η (n_ov² − n₂²), η = fraction of the mode power beyond the polished plane.";
const DIGONNET_SHAW = "Digonnet M. J. F., Shaw H. J. (1982). Analysis of a tunable single mode optical fiber coupler. IEEE J. Quantum Electron. 18, 746–754, " +
  "doi:10.1109/JQE.1982.1071574, with Snyder's coupling coefficient κ(D) = (NA/(n₁a)) (U²/V³) K₀(WD/a)/K₁²(W) of two identical cores; " +
  "D(z) = 2(a + d) + z²/R; coupled power sin²(∫κ dz).";

const NO_RESULT = `The model needs n₁ > n₂ and V ≥ ${MIN_V}; outside that there is no result.`;
const NO_SHIFT = `${NO_RESULT} Also, with the overlay index at or above n_eff the mode is no longer guided at the face, so no shift is given.`;
const NO_LENGTH = `${NO_RESULT} The effective length Φ/κ₀ also needs the coupling coefficient to be non-zero at the minimum core spacing (a very thick remaining cladding gives an underflow).`;

export default defineSchema({
  href: "/fiber-optics/side-polished",
  inputs: [
    { key: "remainingClad", label: "Remaining cladding d (core boundary to polished face)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 2, min: 0, max: 30 },
    { key: "coreDia", label: "Core diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 8.2, min: 1, max: 60 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2500 },
    { key: "n_core", label: "Core index n₁", unit: "", toSI: 1, siUnit: "", default: 1.4494, min: 1, max: 4 },
    { key: "n_clad", label: "Cladding index n₂", unit: "", toSI: 1, siUnit: "", default: 1.444, min: 1, max: 4 },
    { key: "n_overlay", label: "Overlay index", unit: "", toSI: 1, siUnit: "", default: 1.43, min: 1, max: 2 },
    { key: "blockRadius", label: "Block radius R", unit: "cm", toSI: 1e-2, siUnit: "m", default: 25, min: 1, max: 500 },
  ],
  outputs: [
    { key: "powerBeyondFace", label: "Power beyond the polished face", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "intensityAtFace", label: "Intensity at the face (of the core-boundary value)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "overlayShift", label: "Overlay shift Δn_eff", unit: "", toSI: 1, siUnit: "" },
    { key: "coupled", label: "Polished coupler: power coupled to the twin fibre", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "kappa0", label: "Coupling coefficient κ₀ at the minimum spacing", unit: "1/m", toSI: 1, siUnit: "1/m" },
    { key: "effectiveLength", label: "Effective coupling length Φ/κ₀", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "V", label: "V-number", unit: "", toSI: 1, siUnit: "" },
    { key: "nEff", label: "Effective index n_eff", unit: "", toSI: 1, siUnit: "" },
    { key: "decayLength", label: "Field decay length a/W", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ remainingClad, coreDia, wavelength, n_core, n_clad, n_overlay, blockRadius }) {
    const s = sidePolishedSummary({
      remainingClad, coreDia, lambda: wavelength, nCore: n_core, nClad: n_clad, nOverlay: n_overlay, blockRadius,
    });
    const warnings: string[] = [];
    if (!s.valid) warnings.push(`No result: ${NO_RESULT}`);
    if (s.valid && s.V > LP11_CUTOFF_V) {
      warnings.push(`V = ${s.V.toFixed(2)} > ${LP11_CUTOFF_V.toFixed(3)}: the fibre is not single-mode; only LP01 is computed.`);
    }
    if (s.leaky) {
      warnings.push(`The overlay index is at or above n_eff = ${s.nEff.toFixed(5)}: the mode is no longer guided at the polished face and power leaks into the overlay. The guided-mode results do not apply there.`);
    }
    if (s.strong) {
      warnings.push(`The overlay shifts n_eff by more than ${100 * PERTURBATION_FRACTION} % of the guidance margin n_eff − n₂ = ${s.margin.toExponential(2)}: first-order perturbation theory is only a rough estimate here.`);
    }
    if (s.nearLeak) {
      warnings.push(`The overlay index is within ${100 * NEAR_LEAK_FRACTION} % of the guidance margin of n_eff: the first-order shift underestimates the true one.`);
    }
    if (s.touching) {
      warnings.push(`Under ${TOUCHING_CLADDING * 1e6} µm of cladding is left: the twin cores almost touch, where coupled-mode theory is at its limit.`);
    }
    if (s.mismatchedGap) {
      warnings.push("The coupler result assumes the gap between the two polished faces is index-matched to the cladding (n₂); with this overlay it is indicative only.");
    }
    return {
      values: {
        powerBeyondFace: s.eta, intensityAtFace: s.surface, overlayShift: s.leaky ? NaN : s.dNeff, coupled: s.coupled,
        kappa0: s.kappa0, effectiveLength: s.Leff, V: s.V, nEff: s.nEff, decayLength: s.decayLength,
      },
      warnings,
      reasons: {
        powerBeyondFace: NO_RESULT, intensityAtFace: NO_RESULT, overlayShift: NO_SHIFT, coupled: NO_RESULT,
        kappa0: NO_RESULT, effectiveLength: NO_LENGTH, V: NO_RESULT, nEff: NO_RESULT, decayLength: NO_RESULT,
      },
    };
  },
  checks: [
    {
      // Defaults: a = 4.1 µm, NA = √(1.4494² − 1.444²) = 0.12461, V = 2π a NA/λ = 2.0774623; LP01 root of
      // U J₁(U)/J₀(U) = W K₁(W)/K₀(W): U = 1.5536863, W = 1.3790969; n_eff² = n₁² − (U/(a k₀))², n_eff = 1.4463822; a/W = 2.9729600 µm.
      // Power beyond the plane at ρ₀ = 1 + d/a: η = 0.01121711 (numerical integral of the mode power); intensity ratio [K₀(Wρ₀)/K₀(W)]² = 0.1821137;
      // Δn_eff = η (1.43² − 1.444²)/(2 n_eff) = −1.560208e-4.
      source: GLOGE_SNYDER,
      basis: "computed",
      inputs: {},
      expect: {
        V: 2.077462271575009, nEff: 1.446382156257432, decayLength: 2.972960049946267,
        powerBeyondFace: 1.121710750031288, intensityAtFace: 18.2113695284627, overlayShift: -0.0001560208467139929,
      },
      tolerance: 1e-8,
    },
    {
      // Defaults with an index-matched overlay (n_overlay = n₂ = 1.444, so the gap assumption holds; the coupler result does not depend on the overlay index): D₀ = 2(a + d) = 12.2 µm, κ₀ = (NA/(n₁a)) (U²/V³) K₀(W D₀/a)/K₁²(W) = 514.06516 1/m;
      // Φ = 2 ∫₀^zmax κ(D₀ + z²/R) dz = 0.7484073 (zmax = √(40 a R/W)), coupled = sin²Φ = 46.304288 %, L_eff = Φ/κ₀ = 1.4558608 mm.
      source: DIGONNET_SHAW,
      basis: "computed",
      inputs: { n_overlay: 1.444 },
      expect: { kappa0: 514.0651580950471, coupled: 46.30428823801545, effectiveLength: 1.455860798188529 },
      tolerance: 1e-8,
    },
    {
      // d = 1 µm, overlay index 1.4425, R = 10 cm, other inputs at the defaults: ρ₀ = 1.2439024, η = 0.02334434, Δn_eff = η (1.4425² − 1.444²)/(2 n_eff) = −3.494068e-5;
      // intensity ratio 0.4198593; D₀ = 10.2 µm, κ₀ = 1096.4004 1/m, Φ = 1.0019566, coupled 70.985093 %, L_eff = 0.9138601 mm.
      source: DIGONNET_SHAW,
      basis: "computed",
      inputs: { remainingClad: 1, n_overlay: 1.4425, blockRadius: 10 },
      expect: {
        powerBeyondFace: 2.334433865886597, intensityAtFace: 41.98592821720711, overlayShift: -0.00003494067936020579,
        kappa0: 1096.400390197159, coupled: 70.98509301014012, effectiveLength: 0.9138601051994779,
      },
      tolerance: 1e-8,
    },
  ],
});
