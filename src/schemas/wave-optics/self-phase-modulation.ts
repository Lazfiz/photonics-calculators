import { wavelengthWidth } from "../../physics/spectroscopy/wavenumber";
import {
  criticalPower, gaussianPeakIntensity, nonlinearPhase, pulseHalfWidth, pulsePeakPower, rayleighRangeInMedium, selfFocusingDistance,
  spmMaxFrequencyShift, spmRmsBroadening, type PulseShape,
} from "../../physics/wave-optics/kerr";
import { defineSchema } from "../types";

export default defineSchema({
  href: "/wave-optics/self-phase-modulation",
  inputs: [
    { key: "wavelength", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 200, max: 20000 },
    { key: "pulseEnergy", label: "Pulse energy E", unit: "nJ", toSI: 1e-9, siUnit: "J", default: 1000, min: 0, max: 1e9 },
    { key: "pulseDuration", label: "Pulse duration, intensity FWHM", unit: "fs", toSI: 1e-15, siUnit: "s", default: 100, min: 1, max: 1e6 },
    { key: "beamWaist", label: "Beam radius w, 1/e²", unit: "µm", toSI: 1e-6, siUnit: "m", default: 50, min: 1, max: 1e5 },
    { key: "n2", label: "Nonlinear index n₂", unit: "×10⁻¹⁶ cm²/W", toSI: 1e-20, siUnit: "m²/W", default: 3.2, min: 1e-4, max: 1e6 },
    { key: "mediumLength", label: "Medium length L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0, max: 1e4 },
    { key: "n0", label: "Linear index n₀ (for P_cr)", unit: "", toSI: 1, siUnit: "", default: 1.76, min: 1, max: 5 },
  ],
  choices: [
    {
      key: "shape",
      label: "Pulse shape",
      options: [{ value: "gaussian", label: "Gaussian" }, { value: "sech", label: "Sech²" }],
      default: "gaussian",
    },
  ],
  outputs: [
    { key: "peakPower", label: "Peak power P₀", unit: "MW", toSI: 1e6, siUnit: "W" },
    { key: "peakIntensity", label: "On-axis peak intensity I₀ = 2P₀/(πw²)", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "peakPhase", label: "Peak nonlinear phase φ_max", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "rmsBroadening", label: "Rms spectral broadening", unit: "", toSI: 1, siUnit: "" },
    { key: "maxFrequencyShift", label: "Largest frequency shift Δν", unit: "THz", toSI: 1e12, siUnit: "Hz" },
    { key: "maxWavelengthShift", label: "Largest wavelength shift Δλ", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "criticalPower", label: "Critical power P_cr", unit: "MW", toSI: 1e6, siUnit: "W" },
    { key: "selfFocusingDistance", label: "Self-focusing distance", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ wavelength, pulseEnergy, pulseDuration, beamWaist, n2, mediumLength, n0, shape: shapeRaw }) {
    const shape: PulseShape = shapeRaw === "sech" ? "sech" : "gaussian";
    const t0 = pulseHalfWidth(pulseDuration, shape);
    const P0 = pulsePeakPower(pulseEnergy, pulseDuration, shape);
    const I0 = gaussianPeakIntensity(P0, beamWaist);
    const phiMax = nonlinearPhase(wavelength, n2, I0, mediumLength);
    const dNu = spmMaxFrequencyShift(phiMax, t0, shape) / (2 * Math.PI);
    const Pcr = criticalPower(wavelength, n0, n2);
    const zsf = selfFocusingDistance(P0 / Pcr, rayleighRangeInMedium(wavelength, n0, beamWaist));
    const warnings: string[] = [];
    if (P0 >= Pcr) {
      warnings.push(zsf < mediumLength
        ? `P ≥ P_cr and the beam self-focuses to collapse after about ${(zsf * 1e3).toPrecision(3)} mm, inside the medium: the plane-wave SPM picture fails there.`
        : mediumLength > 0.2 * zsf
          ? `P₀ > P_cr: the beam already self-focuses inside the medium (L/z_sf = ${(mediumLength / zsf).toPrecision(2)}), so the on-axis intensity grows and φ_max is a lower bound.`
          : `P ≥ P_cr: the beam self-focuses, but the collapse distance ${(zsf * 1e3).toPrecision(3)} mm lies beyond the medium.`);
    } else {
      warnings.push("P₀ < P_cr: no self-focusing collapse, so the self-focusing distance has no value.");
    }
    return {
      values: {
        peakPower: P0,
        peakIntensity: I0,
        peakPhase: phiMax,
        rmsBroadening: spmRmsBroadening(phiMax, shape),
        maxFrequencyShift: dNu,
        maxWavelengthShift: wavelengthWidth(wavelength, dNu),
        criticalPower: Pcr,
        selfFocusingDistance: zsf,
      },
      warnings,
    };
  },
  checks: [
    {
      // Gaussian, T₀ = FWHM/(2√ln2) = 60.056 fs, P₀ = E/(√π T₀) = 9.3944 MW, I₀ = 2P₀/(πw²) = 2.3923e11 W/cm²,
      // φ_max = (2π/λ) n₂ I₀ L = 1.20248 rad, rms broadening √(1 + 4φ²/(3√3)) = 1.45365, Δν = √(2/e) φ/(2πT₀) = 2.7334 THz,
      // P_cr = 3.77 λ²/(8π n₀ n₂) = 1.70459 MW.
      source: "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed., §4.1 (SPM phase, Gaussian rms broadening and maximum chirp); Fibich G., Gaeta A. L. (2000). Critical power for self-focusing in bulk media and in hollow waveguides. Opt. Lett. 25, 335–337, doi:10.1364/OL.25.000335 (P_cr = 3.77λ²/(8πn₀n₂)).",
      basis: "computed",
      inputs: {},
      expect: { peakPower: 9.394372786996512, peakPhase: 1.2024797167355534, rmsBroadening: 1.4536500881374521, maxFrequencyShift: 2.733432628411039, criticalPower: 1.7045856120921748 },
      tolerance: 1e-8,
    },
    {
      // Sech², T₀ = FWHM/(2 ln(1+√2)) = 56.730 fs, P₀ = E/(2T₀) = 8.8137 MW, φ_max = 1.12816 rad,
      // rms broadening √(1 + 32φ²/35) = 1.47093, Δν = 4φ/(3√3 · 2πT₀) = 2.4365 THz.
      source: "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed., §4.1 (SPM-induced chirp of the sech pulse, dφ/dT = −(φ_max/T₀) d|U|²/d(T/T₀)); rms width from ∫sech² tanh² = 2/3 and ∫sech⁶ tanh² = 16/105.",
      basis: "computed",
      inputs: { shape: "sech" },
      expect: { peakPower: 8.813735870195428, peakPhase: 1.1281581913850145, rmsBroadening: 1.4709346780995256, maxFrequencyShift: 2.436454295817746 },
      tolerance: 1e-8,
    },
  ],
});
