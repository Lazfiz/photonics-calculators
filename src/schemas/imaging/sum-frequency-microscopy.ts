import { SFG_XI_MAX, SFG_XI_WARN, sfgSummary } from "../../physics/imaging/sum-frequency-microscopy";
import { defineSchema } from "../types";

const ZIPFEL = "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. " +
  "Nature Biotechnology 21, 1369–1377. https://doi.org/10.1038/nbt899 (1/e radii of the squared PSF: ω_xy = 0.320 λ/(√2 NA) for NA ≤ 0.7 and " +
  "0.325 λ/(√2 NA^0.91) for NA > 0.7, ω_z = 0.532 λ/(√2 (n − √(n² − NA²))); w = 2ω_xy is the 1/e² intensity radius). A mixed signal " +
  "I₁·I₂ of Gaussians exp(−2r²/wᵢ²) has FWHM √(2 ln 2/Σ 1/wᵢ²) (the same with w_z).";
const BOYD = "Boyd R. W. (2008). Nonlinear Optics, 3rd ed., Academic Press, ch. 2 (1/λ₃ = 1/λ₁ + 1/λ₂; I₃ = 8π² d_eff² I₁ I₂ L² sinc²(ΔkL/2)/(ε₀ c n₁ n₂ n₃ λ₃²) " +
  "for plane waves, Δk = k₁ + k₂ − k₃ = −2πΔn/λ₃ at equal input indices; coherence length π/|Δk|; backward SFG Δk = k₁ + k₂ + k₃). " +
  "Overlap ∫I₁I₂ dA = 2P₁P₂/(π(w₁² + w₂²)) for coaxial Gaussians; Gaussian pulses ⟨P₃⟩ = K g ⟨P₁⟩⟨P₂⟩/(fτ) with g = √(2 ln 2/π): " +
  "Xu C., Webb W. W. (1996). J. Opt. Soc. Am. B 13, 481–491, https://doi.org/10.1364/JOSAB.13.000481. ε₀ = 1/(µ₀c²), µ₀ = 1.25663706127e-6 H/m (CODATA 2022).";

const NO_FOCUS = "The NA must be below the index n: there is no such focus.";
const NO_FORWARD = "Δn = 0: the forward coherence length is infinite.";
const THICK = "L/b exceeds 1: the layer is thicker than the focus and the thin-slab power doesn't apply.";

export default defineSchema({
  href: "/imaging/sum-frequency-microscopy",
  inputs: [
    { key: "lambda1", label: "Beam 1 wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1040, min: 400, max: 2000 },
    { key: "lambda2", label: "Beam 2 wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 400, max: 2000 },
    { key: "na", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.1, max: 1.5 },
    { key: "n", label: "Sample index (both inputs)", unit: "", toSI: 1, siUnit: "", default: 1.33, min: 1, max: 1.8 },
    { key: "power1", label: "Beam 1 average power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 100, min: 0, max: 1000 },
    { key: "power2", label: "Beam 2 average power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 50, min: 0, max: 1000 },
    { key: "pulseWidth", label: "Pulse width, FWHM, both beams", unit: "fs", toSI: 1e-15, siUnit: "s", default: 150, min: 10, max: 1000 },
    { key: "repRate", label: "Repetition rate", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 80, min: 0.1, max: 250 },
    { key: "deff", label: "d_eff", unit: "pm/V", toSI: 1e-12, siUnit: "m/V", default: 1, min: 0, max: 100 },
    { key: "thickness", label: "Layer thickness L", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0.2, min: 0.001, max: 100 },
    { key: "deltaN", label: "Index mismatch Δn = n(ω₃) − n", unit: "", toSI: 1, siUnit: "", default: 0.01, min: -0.2, max: 0.2 },
  ],
  outputs: [
    { key: "sfgWavelength", label: "SFG wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "w1", label: "Focus 1/e² radius, beam 1", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "w2", label: "Focus 1/e² radius, beam 2", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "lateral", label: "Lateral FWHM of I₁·I₂", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "axial", label: "Axial FWHM of I₁·I₂", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "xi", label: "L/b (b: smaller confocal parameter)", unit: "", toSI: 1, siUnit: "" },
    { key: "bMin", label: "Smaller confocal parameter b", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "forwardCoherenceLength", label: "Coherence length, forward", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "backwardCoherenceLength", label: "Coherence length, backward", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "power", label: "Forward SFG power (thin layer, average)", unit: "pW", toSI: 1e-12, siUnit: "W" },
    { key: "photonRate", label: "SFG photons per second", unit: "1/s", toSI: 1, siUnit: "1/s" },
  ],
  validate({ n, deltaN }) {
    if (n + deltaN < 1) return `n(ω₃) = ${(n + deltaN).toFixed(3)} is below 1: raise n or the mismatch.`;
    return undefined;
  },
  compute({ lambda1, lambda2, na, n, power1, power2, pulseWidth, repRate, deff, thickness, deltaN }) {
    const r = sfgSummary({ lambda1, lambda2, na, n, power1, power2, pulseWidth, repRate, deff, thickness, deltaN });
    const warnings: string[] = [];
    if (r.focusOk && r.xi > SFG_XI_WARN && r.xi <= SFG_XI_MAX) {
      warnings.push("L/b exceeds 0.1: the thin-slab power overestimates the signal as L approaches the confocal parameter.");
    }
    const reasons: Record<string, string> = {};
    if (!r.focusOk) {
      reasons.lateral = NO_FOCUS;
      reasons.axial = NO_FOCUS;
      reasons.power = NO_FOCUS;
      reasons.photonRate = NO_FOCUS;
    } else if (r.xi > SFG_XI_MAX) {
      reasons.power = THICK;
      reasons.photonRate = THICK;
    }
    if (deltaN === 0) reasons.forwardCoherenceLength = NO_FORWARD;
    return {
      values: {
        sfgWavelength: r.sfgWavelength,
        w1: r.w1,
        w2: r.w2,
        lateral: r.lateralFwhm,
        axial: r.axialFwhm,
        xi: r.xi,
        bMin: r.bMin,
        forwardCoherenceLength: r.forwardCoherenceLength,
        backwardCoherenceLength: r.backwardCoherenceLength,
        power: r.power,
        photonRate: r.photonRate,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // 1040 nm + 800 nm, NA 0.8 (> 0.7), n 1.33, Δn 0.01: λ₃ = 1/(1/1040 + 1/800) = 452.173913 nm;
      // w₁ = 2·0.325 λ₁/(√2 NA^0.91) = 0.58562527 µm, w₂ = 0.45048098 µm; lateral = √(2 ln 2/(1/w₁² + 1/w₂²)) = 420.408413 nm;
      // axial = √(2 ln 2/(1/w_z1² + 1/w_z2²)) with w_z = 2·0.532 λ/(√2 (n − √(n² − NA²))) = 2.09982449 µm;
      // forward L_c = λ₃/(2Δn) = 452.173913 nm/0.02 = 22.6086957 µm; backward = λ₃/(2(2n + Δn)) = 452.173913/(2·2.67) = 84.6767627 nm.
      source: `${ZIPFEL} ${BOYD}`,
      basis: "computed",
      inputs: { lambda1: 1040, lambda2: 800, na: 0.8, n: 1.33, deltaN: 0.01 },
      expect: {
        sfgWavelength: 452.17391304347825, w1: 0.5856252720031024, w2: 0.45048097846392493, lateral: 420.4084129769588,
        axial: 2.0998244890926405, forwardCoherenceLength: 22.608695652173914, backwardCoherenceLength: 84.6767627422244,
      },
      tolerance: 1e-8,
    },
    {
      // Thin layer L = 0.05 µm (L/b = 0.0236 < 0.1), d_eff 1 pm/V, 100 mW + 50 mW, 80 MHz, 150 fs, Δn 0.01, NA 0.8, n 1.33.
      // Δk = −2πΔn/λ₃, phase ΔkL/2 = −π·0.01·0.05 µm/452.17 nm = −0.003474 (sinc = 0.999998); plane-wave 8π² d² L² sinc²/(ε₀ c n² n₃ λ₃²), spread over
      // 2/(π(w₁² + w₂²)) → K; ⟨P₃⟩ = K·0.66428247·P₁P₂/(fτ) = 49528.5886 pW; photon rate = ⟨P₃⟩ λ₃/(hc) = 1.12741737e11 /s;
      // b = min(2πn w²/λ) = 2.11979780 µm, L/b = 0.023587155.
      source: BOYD,
      basis: "computed",
      inputs: { lambda1: 1040, lambda2: 800, na: 0.8, n: 1.33, deltaN: 0.01, thickness: 0.05, deff: 1, power1: 100, power2: 50, repRate: 80, pulseWidth: 150 },
      expect: { xi: 0.02358715531266508, bMin: 2.1197978025418176, power: 49528.588583971585, photonRate: 112741737344.29617 },
      tolerance: 1e-8,
    },
  ],
});
