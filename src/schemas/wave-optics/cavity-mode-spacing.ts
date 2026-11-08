import {
  gParameter, mirrorRadius, oneWayGouyPhase, resonatorFsr, resonatorStability, transverseModeSpacing, twoMirrorMode,
} from "../../physics/wave-optics/two-mirror-resonator";
import { fsrWavelength } from "../../physics/spectroscopy/etalon";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const SOURCE =
  "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567, doi:10.1364/AO.5.001550 " +
  "(g parameters, stability condition 0 ≤ g₁g₂ ≤ 1, waist and spot sizes of the two-mirror resonator mode); " +
  "Siegman A. E. (1986). Lasers. University Science Books, ch. 19 (resonances ν = FSR [q + (m + n + 1) θ/π], " +
  "FSR = c/(2nL), θ = arccos(±√(g₁g₂)))";

export default defineSchema({
  href: "/wave-optics/cavity-mode-spacing",
  inputs: [
    { key: "cavityLength", label: "Mirror spacing L", unit: "mm", toSI: 1e-3, siUnit: "m", default: 150, min: 0.1, max: 1e5 },
    { key: "R1", label: "Mirror 1 radius R₁ (0 = flat, < 0 convex)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 100, min: -1e7, max: 1e7 },
    { key: "R2", label: "Mirror 2 radius R₂ (0 = flat, < 0 convex)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 100, min: -1e7, max: 1e7 },
    { key: "wavelength", label: "Vacuum wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 11000 },
    { key: "n", label: "Refractive index n filling the cavity", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 4 },
  ],
  outputs: [
    { key: "g1", label: "g₁ = 1 − L/R₁", unit: "", toSI: 1, siUnit: "" },
    { key: "g2", label: "g₂ = 1 − L/R₂", unit: "", toSI: 1, siUnit: "" },
    { key: "g1g2", label: "g₁g₂", unit: "", toSI: 1, siUnit: "" },
    { key: "fsr", label: "Free spectral range c/(2nL)", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "fsrWavelength", label: "Free spectral range in wavelength λ²/(2nL)", unit: "pm", toSI: 1e-12, siUnit: "m" },
    { key: "gouyPhase", label: "One-way Gouy phase θ", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "transverseSpacing", label: "Transverse mode spacing FSR·θ/π", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "waist", label: "TEM₀₀ waist radius w₀ (1/e²)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "rayleighRange", label: "Rayleigh range z_R in the medium", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "waistPosition", label: "Waist distance from mirror 1", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "spot1", label: "Spot radius on mirror 1", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "spot2", label: "Spot radius on mirror 2", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ cavityLength, R1, R2, wavelength, n }) {
    const g1 = gParameter(cavityLength, mirrorRadius(R1));
    const g2 = gParameter(cavityLength, mirrorRadius(R2));
    const stability = resonatorStability(g1, g2);
    const mode = twoMirrorMode(wavelength, cavityLength, g1, g2, n);
    const fsr = resonatorFsr(cavityLength, n);
    const warnings: string[] = [];
    if (stability === "unstable") {
      warnings.push("Outside 0 ≤ g₁g₂ ≤ 1 rays walk out of the cavity: there is no Gaussian mode and no transverse mode spacing.");
    } else if (stability === "marginal" && !(g1 === 0 && g2 === 0)) {
      warnings.push("On the stability boundary the Gaussian mode is lost and the transverse modes are degenerate.");
    }
    return {
      values: {
        g1,
        g2,
        g1g2: g1 * g2,
        fsr,
        fsrWavelength: fsrWavelength(wavelength, n, cavityLength, 1),
        gouyPhase: oneWayGouyPhase(g1, g2),
        transverseSpacing: transverseModeSpacing(fsr, g1, g2),
        waist: mode.w0,
        rayleighRange: mode.zR,
        waistPosition: mode.z1,
        spot1: mode.w1,
        spot2: mode.w2,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: L = 150 mm, R₁ = R₂ = 100 mm, λ = 1550 nm, n = 1: g = 1 − 1.5 = −0.5, g₁g₂ = 0.25 (stable);
      // FSR = c/(2L) = 0.99930819 GHz, θ = arccos(−√0.25) = 120°, spacing FSR·θ/π = 0.66620546 GHz, λ²/(2L) = 8.008333 pm;
      // z_R = L√(p(1 − p))/|g₁ + g₂ − 2p| = 0.15 · 0.433013/1.5 = 43.30127 mm, z₁ = L g₂(1 − g₁)/(g₁ + g₂ − 2p) = 75 mm,
      // w₀ = √(λ z_R/π) = 146.16427 µm, w₁ = w₂ = √(λL/π · √(g₂/(g₁(1 − p)))) = 292.32855 µm.
      source: SOURCE,
      basis: "computed",
      inputs: { cavityLength: 150, R1: 100, R2: 100, wavelength: 1550, n: 1 },
      expect: {
        g1g2: 0.25, fsr: 0.9993081933333334, fsrWavelength: 8.008333333333335, gouyPhase: 119.99999999999999,
        transverseSpacing: 0.6662054622222222, waist: 146.1642729862344, rayleighRange: 43.301270189221945,
        waistPosition: 75, spot1: 292.32854597246876, spot2: 292.32854597246876,
      },
      tolerance: 1e-8,
    },
    {
      // L = 100 mm, R₁ = 200 mm, R₂ = 300 mm, λ = 1064 nm: g₁ = 0.5, g₂ = 2/3, p = 1/3, FSR = 1.49896229 GHz,
      // θ = arccos(√(1/3)) = 54.7356103°, spacing 0.45581453 GHz; den = 0.5 + 2/3 − 2/3 = 0.5, z_R = 0.1 √(2/9)/0.5 = 94.280904 mm,
      // z₁ = 0.1 · (2/3)(0.5)/0.5 = 66.666667 mm, w₀ = 178.693085 µm, w₁ = 218.853440 µm, w₂ = 189.532638 µm.
      source: SOURCE,
      basis: "computed",
      inputs: { cavityLength: 100, R1: 200, R2: 300, wavelength: 1064, n: 1 },
      expect: {
        g1: 0.5, g2: 0.6666666666666666, fsr: 1.49896229, gouyPhase: 54.735610317245346, transverseSpacing: 0.4558145321426984,
        rayleighRange: 94.28090415820637, waistPosition: 66.66666666666669, waist: 178.693085147986,
        spot1: 218.85343958813635, spot2: 189.53263838892903,
      },
      tolerance: 1e-8,
    },
  ],
});
