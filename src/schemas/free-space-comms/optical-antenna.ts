import {
  apertureGain, gsmFarField, kleinDegnanEfficiency, optimumTruncation, toDb,
} from "../../physics/free-space-comms/link-budget";
import { defineSchema } from "../types";

const KLEIN = "Klein B. J., Degnan J. J. (1974). Optical antenna gain. 1: Transmitting antennas. Appl. Opt. 13(9), 2134–2140: " +
  "G_t = (πD/λ)² g(α, γ), g = (2/α²)[exp(−α²) − exp(−γ²α²)]², α = a/w, γ = obscuration ratio.";
const DEGNAN = "Degnan J. J., Klein B. J. (1974). Optical antenna gain. 2: Receiving antennas. Appl. Opt. 13(10), 2397–2401: " +
  "G_r = (πD/λ)² (1 − γ²) η.";

export default defineSchema({
  href: "/free-space-comms/optical-antenna",
  inputs: [
    { key: "aperture", label: "Aperture diameter D", unit: "cm", toSI: 1e-2, siUnit: "m", default: 10, min: 0.1, max: 1000 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 20000 },
    { key: "obscuration", label: "Central obscuration ratio γ (diameter)", unit: "", toSI: 1, siUnit: "", default: 0.15, min: 0, max: 0.5 },
    { key: "efficiency", label: "Optics efficiency η (transmission, wavefront error)", unit: "", toSI: 1, siUnit: "", default: 0.75, min: 0.01, max: 1 },
    { key: "beamQuality", label: "Beam quality M² (Gaussian Schell model)", unit: "", toSI: 1, siUnit: "", default: 1.1, min: 1, max: 10 },
    { key: "fill", label: "Fill ratio α = a/W₀ (aperture radius / beam radius)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.3, max: 3 },
  ],
  outputs: [
    { key: "txGain", label: "Transmit gain on axis (πD/λ)² g η", unit: "dBi", toSI: 1, siUnit: "dBi" },
    { key: "rxGain", label: "Receive gain (πD/λ)² (1 − γ²) η", unit: "dBi", toSI: 1, siUnit: "dBi" },
    { key: "directivity", label: "Directivity limit (πD/λ)²", unit: "dBi", toSI: 1, siUnit: "dBi" },
    { key: "gCoherent", label: "Coherent on-axis efficiency g(α, γ), Klein and Degnan", unit: "", toSI: 1, siUnit: "" },
    { key: "gGsm", label: "On-axis efficiency g for the Gaussian Schell-model beam of M²", unit: "", toSI: 1, siUnit: "" },
    { key: "waist", label: "Beam waist W₀ = a/α (unclipped Gaussian)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "halfAngle", label: "Far-field half-angle (1/e²) of the clipped beam", unit: "µrad", toSI: 1e-6, siUnit: "rad" },
    { key: "halfAngleGaussian", label: "Unclipped Gaussian half-angle M²λ/(πW₀)", unit: "µrad", toSI: 1e-6, siUnit: "rad" },
    { key: "rayleighRange", label: "Rayleigh range πW₀²/(M²λ) (unclipped Gaussian)", unit: "m", toSI: 1, siUnit: "m" },
    { key: "optimumFill", label: "Optimum fill ratio α for this γ (M² = 1)", unit: "", toSI: 1, siUnit: "" },
    { key: "optimumG", label: "Optimum on-axis efficiency g at that α (M² = 1)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ aperture: D, wavelength: lambda, obscuration, efficiency, beamQuality, fill }) {
    const a = D / 2;
    const gsm = gsmFarField(fill, obscuration, beamQuality);
    const optimum = optimumTruncation(obscuration);
    const directivity = apertureGain(D, lambda);
    const w0 = a / fill;
    const warnings: string[] = [];
    if (!Number.isFinite(gsm.width)) warnings.push("The far-field 1/e² width of the clipped beam was not found: halfAngle is null.");
    if (beamQuality > 3) warnings.push("A beam with M² near 10 is only indicative: real multimode beams are not Gaussian Schell-model.");
    return {
      values: {
        txGain: toDb(directivity * gsm.efficiency * efficiency),
        rxGain: toDb(apertureGain(D, lambda, obscuration, efficiency)),
        directivity: toDb(directivity),
        gCoherent: kleinDegnanEfficiency(fill, obscuration),
        gGsm: gsm.efficiency,
        waist: w0,
        halfAngle: (gsm.width * lambda) / (2 * Math.PI * a),
        halfAngleGaussian: (beamQuality * lambda) / (Math.PI * w0),
        rayleighRange: (Math.PI * w0 * w0) / (beamQuality * lambda),
        optimumFill: optimum.alpha,
        optimumG: optimum.efficiency,
      },
      warnings,
    };
  },
  checks: [
    {
      // Unobscured coherent beam (γ = 0, M² = 1, η = 1) at α = 1.121: g = (2/α²)(1 − e^(−α²))² = 0.8145288 (the optimum is
      // g = 0.8145288 at α = 1.120906, found by a 1e-7 scan); (πD/λ)² = (π·0.1/1.55e-6)² = 106.13636 dBi, so G_t = 106.13636 + 10 log₁₀ g
      // = 105.24543 dBi; W₀ = 0.05/1.121 = 44.603 mm, M²λ/(πW₀) = 11.06159 µrad, z_R = πW₀²/λ = 4032.245 m.
      source: KLEIN,
      basis: "computed",
      inputs: { aperture: 10, wavelength: 1550, obscuration: 0, efficiency: 1, beamQuality: 1, fill: 1.121 },
      expect: { txGain: 105.24542765212487, rxGain: 106.13636349047684, directivity: 106.13636349047684, gCoherent: 0.8145287465903667, waist: 44.60303300624443, halfAngleGaussian: 11.061586854772912, rayleighRange: 4032.245426613351, optimumFill: 1.1209063998131663, optimumG: 0.8145287551781469 },
      tolerance: 1e-6,
    },
    {
      // Page defaults without beam quality (M² = 1): γ = 0.15, η = 0.75, α = 1: g = 2[e^(−1) − e^(−0.0225)]² = 0.743887;
      // G_t = 106.13636 + 10 log₁₀(0.743887 · 0.75) = 103.60205 dBi; G_r = 106.13636 + 10 log₁₀((1 − 0.0225) · 0.75) = 104.78814 dBi;
      // W₀ = 5 cm, λ/(πW₀) = 9.867606 µrad, z_R = 5067.085 m; optimum for γ = 0.15: α = 1.093520, g = 0.753018.
      source: DEGNAN,
      basis: "computed",
      inputs: { beamQuality: 1 },
      expect: { txGain: 103.60204707200198, rxGain: 104.78814378507289, gCoherent: 0.7438872151659414, waist: 50, halfAngleGaussian: 9.867606471697512, rayleighRange: 5067.084925144827, optimumFill: 1.0935201997971764, optimumG: 0.753017861263864 },
      tolerance: 1e-6,
    },
    {
      // 20 cm, 1064 nm, γ = 0.3, η = 0.9, α = 0.8, M² = 1: g = (2/0.64)[e^(−0.64) − e^(−0.0576)]² = 0.542713;
      // (πD/λ)² = 115.42476 dBi; G_t = 115.42476 + 10 log₁₀(0.542713 · 0.9) = 112.31289 dBi, G_r = 115.42476 + 10 log₁₀(0.91 · 0.9) = 114.55760 dBi.
      source: KLEIN,
      basis: "computed",
      inputs: { aperture: 20, wavelength: 1064, obscuration: 0.3, efficiency: 0.9, beamQuality: 1, fill: 0.8 },
      expect: { txGain: 112.31289088115979, rxGain: 114.55760382558589, directivity: 115.42476480798172, gCoherent: 0.5427128415480383, waist: 125, rayleighRange: 46134.760537914015 },
      tolerance: 1e-6,
    },
  ],
});
