import {
  SHG_DEPLETION_EFFICIENCY, SHG_PARAXIAL_NA_LIMIT, shgSummary,
} from "../../physics/imaging/second-harmonic-generation-summary";
import { defineSchema } from "../types";

const ZIPFEL = "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. " +
  "Nature Biotechnology 21, 1369–1377. https://doi.org/10.1038/nbt899 (1/e radii of the squared PSF: ω_xy = 0.320 λ/(√2 NA) for NA ≤ 0.7 and " +
  "0.325 λ/(√2 NA^0.91) for NA > 0.7, ω_z = 0.532 λ/(√2 (n − √(n² − NA²))); FWHM = 2√(ln 2) ω).";
const BOYD_KLEINMAN = "Boyd G. D., Kleinman D. A. (1968). Parametric interaction of focused Gaussian light beams. J. Appl. Phys. 39, " +
  "3597–3639. https://doi.org/10.1063/1.1656831 (P_2ω = K P_ω², K = 16π² d_eff² L h(σ, ξ)/(ε₀ c n_ω n_2ω λ³); for σ = 0, h = arctan²ξ/ξ). " +
  "Pulses: Xu C., Webb W. W. (1996). J. Opt. Soc. Am. B 13, 481–491, https://doi.org/10.1364/JOSAB.13.000481 (Gaussian pulse, ⟨P²⟩ = g ⟨P⟩²/(fτ), g = √(2 ln 2/π)).";
const LACOMB = "Coherence lengths L = π/|Δk| (forward and backward): LaComb R., Nadiarnykh O., Townsend S. S., Campagnola P. J. (2008). Phase matching " +
  "considerations in second harmonic generation from tissues: effects on emission directionality, conversion efficiency and observed morphology. " +
  "Opt. Commun. 281, 1823–1832. https://doi.org/10.1016/j.optcom.2007.10.040";
const BOYD = "Boyd R. W. (2008). Nonlinear Optics, 3rd ed., Academic Press, ch. 2 (phase mismatch Δk = 2k_ω − k_2ω; " +
  "for counter-propagating second harmonic |Δk| = k_2ω + 2k_ω; Boyd's own coherence length is 2/Δk).";

const PHASE_MATCHED = "n(2ω) = n(ω), so the forward coherence length is infinite.";
const NO_POWER = "The average power is 0, so there is no conversion efficiency (a ratio to the input power).";

export default defineSchema({
  href: "/imaging/second-harmonic-generation",
  inputs: [
    { key: "wavelength", label: "Excitation wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 400, max: 2000 },
    { key: "na", label: "Objective NA", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.05, max: 1.5 },
    { key: "n", label: "Refractive index n(ω)", unit: "", toSI: 1, siUnit: "", default: 1.33, min: 1, max: 3 },
    { key: "pulseWidth", label: "Pulse width, FWHM", unit: "fs", toSI: 1e-15, siUnit: "s", default: 100, min: 10, max: 1000 },
    { key: "avgPower", label: "Average power", unit: "mW", toSI: 1e-3, siUnit: "W", default: 50, min: 0, max: 500 },
    { key: "repRate", label: "Rep rate", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 80, min: 0.01, max: 250 },
    { key: "chi2", label: "d_eff", unit: "pm/V", toSI: 1e-12, siUnit: "m/V", default: 1, min: 0.01, max: 100 },
    { key: "crystalLength", label: "Sample thickness", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10, min: 0.1, max: 1000 },
    { key: "dn", label: "Dispersion n(2ω) − n(ω)", unit: "", toSI: 1, siUnit: "", default: 0.01, min: -0.5, max: 0.5 },
  ],
  outputs: [
    { key: "shgWavelength", label: "SHG wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "lateral", label: "Lateral FWHM (I²)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "axial", label: "Axial FWHM (I²)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "pulseEnergy", label: "Pulse energy", unit: "nJ", toSI: 1e-9, siUnit: "J" },
    { key: "peakIntensity", label: "Focal peak intensity", unit: "TW/cm²", toSI: 1e16, siUnit: "W/m²" },
    { key: "w0", label: "Focus 1/e² radius w₀", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "b", label: "Confocal parameter b", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "xi", label: "Focusing ξ = L/b", unit: "", toSI: 1, siUnit: "" },
    { key: "h", label: "Boyd–Kleinman h(σ, ξ)", unit: "", toSI: 1, siUnit: "" },
    { key: "forwardCoherenceLength", label: "Coherence length, forward", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "backwardCoherenceLength", label: "Coherence length, backward", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "shPower", label: "Average SH power", unit: "µW", toSI: 1e-6, siUnit: "W" },
    { key: "efficiency", label: "Conversion efficiency (average)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "nearFieldEfficiency", label: "Plane-wave L² estimate of the efficiency", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "bandwidth", label: "Fundamental bandwidth (Gaussian, transform-limited)", unit: "THz", toSI: 1e12, siUnit: "Hz" },
  ],
  validate({ na, n, dn }) {
    if (!(na < n)) return `The NA (${na}) must be smaller than the refractive index (${n}).`;
    if (n + dn < 1) return `n(2ω) = ${n + dn} is below 1: raise n(ω) or the dispersion.`;
    return undefined;
  },
  compute({ wavelength, na, n, pulseWidth, avgPower, repRate, chi2, crystalLength, dn }) {
    const r = shgSummary({
      lambda: wavelength, na, n, pulseWidth, avgPower, repRate, deff: chi2, length: crystalLength, deltaN: dn,
    });
    const warnings: string[] = [];
    if (na > SHG_PARAXIAL_NA_LIMIT) warnings.push("The Gaussian-beam focus is indicative only above NA ≈ 0.5.");
    if (r.efficiency > SHG_DEPLETION_EFFICIENCY) {
      warnings.push("Above ≈ 10 % the fundamental is depleted and this undepleted-pump estimate is too high.");
    }
    const reasons: Record<string, string> = {};
    if (dn === 0) reasons.forwardCoherenceLength = PHASE_MATCHED;
    if (!(avgPower > 0)) {
      reasons.efficiency = NO_POWER;
      reasons.nearFieldEfficiency = NO_POWER;
    }
    return {
      values: {
        shgWavelength: r.shgWavelength,
        lateral: r.lateralFwhm,
        axial: r.axialFwhm,
        pulseEnergy: r.pulseEnergy,
        peakIntensity: r.peakIntensity,
        w0: r.w0,
        b: r.b,
        xi: r.xi,
        h: r.h,
        forwardCoherenceLength: r.forwardCoherenceLength,
        backwardCoherenceLength: r.backwardCoherenceLength,
        shPower: r.shPower,
        efficiency: r.efficiency,
        nearFieldEfficiency: r.nearFieldEfficiency,
        bandwidth: r.bandwidth,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // 800 nm, NA 0.45 (≤ 0.5, ≤ 0.7), n 1.33: lateral = 2√(ln 2)·0.320 λ/(√2 NA) = 2·0.8325546·0.320·800/(1.4142136·0.45) = 669.8154795 nm;
      // axial = 2√(ln 2)·0.532 λ/(√2 (n − √(n² − NA²))) = 2·0.8325546·0.532·0.8/(1.4142136·(1.33 − 1.2515)) = 6.3883158 µm.
      source: ZIPFEL,
      basis: "computed",
      inputs: { wavelength: 800, na: 0.45, n: 1.33 },
      expect: { lateral: 669.8154794754698, axial: 6.388315842544517 },
      tolerance: 1e-8,
    },
    {
      // dn = 0.01, n = 1.33, λ = 800 nm: forward L_c = λ/(4|Δn|) = 800 nm/0.04 = 20 µm;
      // backward = λ/(4(n + n₂ω)) = 800/(4 × 2.67) = 74.9063670 nm. Pulse: E = 50 mW/80 MHz = 0.625 nJ;
      // transform-limited Gaussian Δν = (2 ln 2/π)/100 fs = 0.44127120/100 fs = 4.4127120 THz.
      source: `${LACOMB} ${BOYD}`,
      basis: "computed",
      inputs: { wavelength: 800, na: 0.45, n: 1.33, dn: 0.01, avgPower: 50, repRate: 80, pulseWidth: 100 },
      expect: { forwardCoherenceLength: 20, backwardCoherenceLength: 74.9063670411985, pulseEnergy: 0.625, bandwidth: 4.4127120030530325 },
      tolerance: 1e-8,
    },
    {
      // dn = 0 (σ = 0, so h = arctan²ξ/ξ), NA 0.45, n 1.33, d_eff 1 pm/V, L 10 µm, 800 nm, 50 mW, 80 MHz, 100 fs.
      // w₀ = 2 × 0.320 λ/(√2 NA) = 0.8045304 µm; b = 2π n w₀²/λ = 6.7612411 µm; ξ = L/b = 1.4790184; h = 0.6444223;
      // K = 16π² d² L h/(ε₀ c n² λ³) = 4.2329939e-7 W⁻¹; ⟨P_2ω⟩ = K g ⟨P⟩²/(fτ) with g = 0.66428247: 87.871989 µW = 0.17574398 %.
      // Peak intensity: P_pk = 2√(ln 2/π)·E/τ = 0.9394372·0.625 nJ/100 fs = 5871.483 W; ω_xy = 0.320 λ/(√2 NA) = 0.4022652 µm; I = P_pk/(2π ω_xy²) = 0.5774881 TW/cm².
      // Plane-wave estimate K_nf = 16π² d² L ξ/(ε₀ c n² λ³) (sinc = 1 at Δk = 0) gives 0.40335128 %.
      source: BOYD_KLEINMAN,
      basis: "computed",
      inputs: { wavelength: 800, na: 0.45, n: 1.33, dn: 0, chi2: 1, crystalLength: 10, avgPower: 50, repRate: 80, pulseWidth: 100 },
      expect: { w0: 0.8045303821500274, b: 6.761241073425401, xi: 1.479018406739603, h: 0.6444223439515031, shPower: 87.87198881580157, efficiency: 0.17574397763160313, peakIntensity: 0.5774880894192549, nearFieldEfficiency: 0.4033512807717533 },
      tolerance: 1e-8,
    },
  ],
});
