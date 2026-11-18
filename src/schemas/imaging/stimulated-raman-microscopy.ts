import { SRS_LARGE_DEPTH, srsSummary } from "../../physics/imaging/stimulated-raman-microscopy";
import { defineSchema } from "../types";

const OZEKI = "Ozeki Y., Dake F., Kajiyama S., Fukui K., Itoh K. (2009). Analysis and experimental assessment of the sensitivity of " +
  "stimulated Raman scattering microscopy. Optics Express 17, 3651–3658. https://doi.org/10.1364/OE.17.003651 (shot-noise-limited " +
  "sensitivity; SNR taken as the amplitude ratio δ√N, N = ηPτλ/(hc) photoelectrons of the detected beam).";
const ZIPFEL = "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. " +
  "Nature Biotechnology 21, 1369–1377. https://doi.org/10.1038/nbt899 (1/e radii of the squared PSF: ω_xy = 0.325 λ/(√2 NA^0.91) for NA > 0.7, " +
  "0.320 λ/(√2 NA) below, ω_z = 0.532 λ/(√2 (n − √(n² − NA²))); w = 2ω_xy; the signal I_p·I_S of two Gaussians exp(−2r²/wᵢ²) has FWHM " +
  "√(2 ln 2/Σ 1/wᵢ²), the same with w_z).";
const STOKES = "Cheng J.-X., Xie X. S. (2004). Coherent anti-Stokes Raman scattering microscopy: instrumentation, theory, and applications. " +
  "J. Phys. Chem. B 108, 827–840, https://doi.org/10.1021/jp035693v (Stokes wavenumber ν̃_S = ν̃_p − Ω̃).";
const GAIN = "Boyd R. W. (2008). Nonlinear Optics, 3rd ed., Academic Press, ch. 10 (plane-wave Stokes gain dI_S/dz = g_R I_p I_S). " +
  "Small-signal depth for coaxial Gaussian beams in a thick sample: SRG δ = g_R F P̂_p/√2, SRL δ = (λ_S/λ_p) g_R F P̂_S/√2, with the overlap integral " +
  "∫I_pI_S dA = 2P_pP_S/(π(w_p² + w_S²)) integrated over z (F = √2 π n/√(λ_p² + λ_S²)) and the Gaussian-pulse energy weighting 1/√2 of the " +
  "peak power P̂ = 2√(ln 2/π)·E/τ (Diels J.-C., Rudolph W. (2006). Ultrashort Laser Pulse Phenomena, 2nd ed., ch. 1, https://doi.org/10.1016/b978-012215493-5/50002-1). " +
  "SNR as in Ozeki et al. (2009), https://doi.org/10.1364/OE.17.003651. The F integral and the 1/√2 weighting are derived here from those equations, not printed.";

const NO_FOCUS = "The NA must be below the index n: there is no such focus.";
const NO_DELTA_FOCUS = "The NA must be below the index n: there is no focus, so no gain-length factor F and no δ.";
const DEPLETED = "δ ≥ 1: the beams deplete and the small-signal estimate of δ fails, so there is no SNR.";
const DELTA_DEPLETED = "δ ≥ 1: the beams deplete and the small-signal estimate of δ fails.";
const MEASURED_DELTA = "Measured mode: δ is the modulationDepth input, not an estimate.";

export default defineSchema({
  href: "/imaging/stimulated-raman-microscopy",
  inputs: [
    { key: "pumpWavelength", label: "Pump wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 600, max: 1100 },
    { key: "ramanShift", label: "Raman shift", unit: "cm⁻¹", toSI: 100, siUnit: "1/m", default: 2850, min: 200, max: 4000 },
    { key: "na", label: "Numerical aperture", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.1, max: 1.5 },
    { key: "n", label: "Immersion / sample index n", unit: "", toSI: 1, siUnit: "", default: 1.33, min: 1, max: 1.6 },
    { key: "pumpPower", label: "Pump power at the sample", unit: "mW", toSI: 1e-3, siUnit: "W", default: 100, min: 1, max: 500 },
    { key: "stokesPower", label: "Stokes power at the sample", unit: "mW", toSI: 1e-3, siUnit: "W", default: 80, min: 1, max: 500 },
    { key: "modulationDepth", label: "SRS modulation depth ΔP/P (measured mode)", unit: "ppm", toSI: 1e-6, siUnit: "", default: 10, min: 0.001, max: 1000 },
    { key: "ramanGain", label: "Raman gain coefficient g_R (gain mode)", unit: "cm/GW", toSI: 1e-11, siUnit: "m/W", default: 1, min: 0, max: 100 },
    { key: "pulseWidth", label: "Pulse width, both beams, FWHM (gain mode)", unit: "ps", toSI: 1e-12, siUnit: "s", default: 6, min: 0.1, max: 100 },
    { key: "repRate", label: "Repetition rate (gain mode)", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 80, min: 1, max: 1000 },
    { key: "quantumEfficiency", label: "Detector quantum efficiency η", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0.01, max: 1 },
    { key: "pixelDwell", label: "Pixel dwell = integration time", unit: "µs", toSI: 1e-6, siUnit: "s", default: 1, min: 0.1, max: 100 },
  ],
  choices: [
    {
      key: "detectedBeam", label: "Detected beam", default: "stokes",
      options: [
        { value: "stokes", label: "Stokes: stimulated Raman gain (SRG), pump modulated" },
        { value: "pump", label: "Pump: stimulated Raman loss (SRL), Stokes modulated" },
      ],
    },
    {
      key: "deltaSource", label: "Modulation depth δ = ΔP/P", default: "measured",
      options: [
        { value: "measured", label: "Enter a measured or published δ" },
        { value: "gain", label: "Estimate from the Raman gain g_R of the sample" },
      ],
    },
  ],
  outputs: [
    { key: "stokesWavelength", label: "Stokes wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "beatFrequency", label: "Beat frequency", unit: "THz", toSI: 1e12, siUnit: "Hz" },
    { key: "photoelectrons", label: "Photoelectrons per pixel (detected beam)", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "snr", label: "Shot-noise-limited SNR", unit: "", toSI: 1, siUnit: "" },
    { key: "minDelta", label: "Smallest detectable ΔP/P (SNR = 1)", unit: "ppm", toSI: 1e-6, siUnit: "" },
    { key: "lateral", label: "Lateral FWHM of I_p·I_S", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "axial", label: "Axial FWHM of I_p·I_S", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "frameTime", label: "Frame time (512×512 pixels)", unit: "s", toSI: 1, siUnit: "s" },
    { key: "focusFactor", label: "Gain-length factor F", unit: "µm⁻¹", toSI: 1e6, siUnit: "1/m" },
    { key: "estimatedDelta", label: "Estimated modulation depth δ (gain mode, detected beam)", unit: "ppm", toSI: 1e-6, siUnit: "" },
  ],
  compute({
    pumpWavelength, ramanShift, na, n, pumpPower, stokesPower, modulationDepth, ramanGain, pulseWidth, repRate,
    quantumEfficiency, pixelDwell, detectedBeam, deltaSource,
  }) {
    const r = srsSummary({
      pumpWavelength, ramanShift, na, n, pumpPower, stokesPower, detectedBeam, deltaSource, modulationDepth, ramanGain,
      pulseWidth, repRate, quantumEfficiency, pixelDwell,
    });
    const fromGain = deltaSource === "gain";
    const warnings: string[] = [];
    if (r.deltaLarge) warnings.push(`δ above ${SRS_LARGE_DEPTH * 100} %: depletion is no longer negligible.`);
    if (r.bandwidthWide) {
      warnings.push(`The pulse bandwidth ${(r.excitationBandwidth / 100).toFixed(1)} cm⁻¹ is wider than a typical condensed-phase Raman line (≈ 10 cm⁻¹): steady-state g_R overestimates δ.`);
    }
    const reasons: Record<string, string> = {};
    if (!r.focusOk) {
      reasons.lateral = NO_FOCUS;
      reasons.axial = NO_FOCUS;
      reasons.focusFactor = NO_FOCUS;
      if (fromGain) reasons.snr = NO_DELTA_FOCUS;
    } else if (r.deltaDepleted) {
      reasons.snr = DEPLETED;
    }
    if (!fromGain) reasons.estimatedDelta = MEASURED_DELTA;
    else if (!r.focusOk) reasons.estimatedDelta = NO_DELTA_FOCUS;
    else if (r.deltaDepleted) reasons.estimatedDelta = DELTA_DEPLETED;
    return {
      values: {
        stokesWavelength: r.stokesWavelength,
        beatFrequency: r.beatFrequency,
        photoelectrons: r.photoelectrons,
        snr: r.snr,
        minDelta: r.minDelta,
        lateral: r.lateralFwhm,
        axial: r.axialFwhm,
        frameTime: r.frameTime,
        focusFactor: r.focusFactor,
        estimatedDelta: fromGain ? r.delta : NaN,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // 800 nm pump, Ω̃ = 2850 cm⁻¹ = 285000 m⁻¹: λ_S = 1/(1/800 nm − 285000 m⁻¹) = 1036.26943 nm; beat c·Ω̃ = 299792458·285000 = 85.44085053 THz.
      // Stokes detected, 80 mW, η 0.8, τ = 1 µs: N = ηPτλ_S/(hc) = 0.8·0.08·1e-6·1.03626943e-6/(6.62607015e-34·299792458) = 3.33868871e11;
      // δ = 10 ppm: SNR = δ√N = 5.77813872; δ_min = 1/√N = 1.73066111 ppm; frame = 512²·1 µs = 0.262144 s.
      // NA 1, n 1.33 (> 0.7): w(λ) = 2·0.325 λ/(√2 NA^0.91), lateral = √(2 ln 2/(1/w_p² + 1/w_S²)) = 342.690297 nm; axial from w_z = 2ω_z: 1.23796030 µm.
      source: `${OZEKI} ${ZIPFEL} ${STOKES}`,
      basis: "computed",
      inputs: {
        pumpWavelength: 800, ramanShift: 2850, na: 1, n: 1.33, stokesPower: 80, quantumEfficiency: 0.8, pixelDwell: 1,
        modulationDepth: 10, detectedBeam: "stokes", deltaSource: "measured",
      },
      expect: {
        stokesWavelength: 1036.2694300518135, beatFrequency: 85.44085053, photoelectrons: 333868870800.76, snr: 5.778138721082767,
        minDelta: 1.7306611147137876, lateral: 342.6902967399644, axial: 1.237960301154272, frameTime: 0.262144,
      },
      tolerance: 1e-8,
    },
    {
      // SRL (pump detected), 100 mW pump, same optics: N = 0.8·0.1·1e-6·800e-9/(hc) = 3.22183460e11, δ = 10 ppm → SNR = 5.67612069, δ_min = 1.76176663 ppm.
      source: OZEKI,
      basis: "computed",
      inputs: {
        pumpWavelength: 800, ramanShift: 2850, na: 1, n: 1.33, pumpPower: 100, quantumEfficiency: 0.8, pixelDwell: 1,
        modulationDepth: 10, detectedBeam: "pump", deltaSource: "measured",
      },
      expect: { photoelectrons: 322183460322.73346, snr: 5.676120685139926, minDelta: 1.7617666280739912 },
      tolerance: 1e-8,
    },
    {
      // Gain mode, SRL: g_R = 1 cm/GW = 1e-11 m/W, F = √2 π n/√(λ_p² + λ_S²) = 4.4428829·1.33/1.30908 µm = 4.51366744 µm⁻¹;
      // modulated beam = Stokes: E = 0.08 W/80 MHz = 1 nJ, P̂ = 2√(ln 2/π)·1 nJ/6 ps = 156.5729 W; δ = (λ_S/λ_p) g_R F P̂/√2 = 6.4731221e-3
      // = 6473.122107739231 ppm (below 10 %, bandwidth 3.47 cm⁻¹ < 10 cm⁻¹: no warning); SNR = δ√N_pump = 6.4731221e-3·√3.22183460e11 = 3674.22223.
      source: GAIN,
      basis: "computed",
      inputs: {
        pumpWavelength: 800, ramanShift: 2850, na: 1, n: 1.33, pumpPower: 100, stokesPower: 80, quantumEfficiency: 0.8, pixelDwell: 1,
        ramanGain: 1, pulseWidth: 6, repRate: 80, detectedBeam: "pump", deltaSource: "gain",
      },
      expect: { focusFactor: 4.513667444958061, snr: 3674.2222293175205, estimatedDelta: 6473.122107739231 },
      tolerance: 1e-8,
    },
  ],
});
