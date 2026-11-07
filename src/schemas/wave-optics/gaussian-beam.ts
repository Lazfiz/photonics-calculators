import {
  beamParameterProduct, beamRadius, divergenceHalfAngle, gouyPhase, rayleighRange, wavefrontRadius,
} from "../../physics/wave-optics/gaussian-beam";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;

export default defineSchema({
  href: "/wave-optics/gaussian-beam",
  inputs: [
    { key: "wavelength", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 11000 },
    { key: "waist", label: "Beam waist radius w₀ (1/e²)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10, min: 1, max: 10000 },
    { key: "z", label: "Distance from waist z", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: -1e6, max: 1e6 },
  ],
  outputs: [
    { key: "rayleighRange", label: "Rayleigh range z_R", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "divergence", label: "Far-field divergence θ (half angle)", unit: "mrad", toSI: 1e-3, siUnit: "rad" },
    { key: "beamParameterProduct", label: "Beam parameter product w₀θ", unit: "mm·mrad", toSI: 1e-6, siUnit: "m·rad" },
    { key: "confocalParameter", label: "Confocal parameter 2z_R", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "beamRadius", label: "Beam radius w(z)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "wavefrontRadius", label: "Wavefront radius of curvature R(z)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "gouyPhase", label: "Gouy phase ψ(z)", unit: "°", toSI: DEG, siUnit: "rad" },
  ],
  compute({ wavelength, waist, z }) {
    const beam = { lambda: wavelength, w0: waist };
    const zR = rayleighRange(beam);
    const theta = divergenceHalfAngle(beam);
    const warnings: string[] = [];
    if (z === 0) warnings.push("At the waist the wavefront is flat: R(z) is infinite.");
    if (theta >= 0.1) {
      warnings.push("The divergence exceeds 0.1 rad: the paraxial Gaussian beam model is inaccurate for so small a waist.");
    }
    return {
      values: {
        rayleighRange: zR,
        divergence: theta,
        beamParameterProduct: beamParameterProduct(beam),
        confocalParameter: 2 * zR,
        beamRadius: beamRadius(beam, z),
        wavefrontRadius: wavefrontRadius(beam, z),
        gouyPhase: gouyPhase(beam, z),
      },
      warnings,
    };
  },
  checks: [
    {
      // z_R = π w₀²/λ = π (10 µm)²/1550 nm, θ = λ/(π w₀).
      source: "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567, eqs. 19–21.",
      basis: "computed",
      inputs: { wavelength: 1550, waist: 10, z: 1 },
      expect: { rayleighRange: 0.2026833970, divergence: 49.33803236 },
      tolerance: 1e-8,
    },
    {
      // z_R = 738.1562 mm; ψ = arctan(100/738.1562), w = w₀ √(1 + (z/z_R)²), R = z + z_R²/z.
      source: "Feng S., Winful H. G. (2001). Physical origin of the Gouy phase shift. Opt. Lett. 26, 485–487, eq. 1.",
      basis: "computed",
      inputs: { wavelength: 1064, waist: 500, z: 100 },
      expect: { gouyPhase: 7.715044350, beamRadius: 504.5673516, wavefrontRadius: 5548.745293 },
      tolerance: 1e-8,
    },
  ],
});
