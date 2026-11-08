import { gtiGdd, gtiGroupDelay, gtiRoundTripPhase, gtiRoundTripTime } from "../../physics/wave-optics/gires-tournois";
import { defineSchema } from "../types";

const KUHL = "Kuhl J., Heppner J. (1986). Compression of femtosecond optical pulses with dielectric multilayer interferometers. " +
  "IEEE J. Quantum Electron. 22, 182–185, doi:10.1109/jqe.1986.1072855 (the page's registry reference; no equation number cited). " +
  "Lossless GTI: round trip t₀ = 2nd/c, δ = 4πnd/λ, τ = t₀(1 − R)/(1 + R + 2√R cos δ); at δ = π (mod 2π) τ = t₀(1 + √R)/(1 − √R), " +
  "at δ = 0 (mod 2π) τ = t₀(1 − √R)/(1 + √R).";

export default defineSchema({
  href: "/wave-optics/gires-tournois",
  inputs: [
    { key: "reflectivity", label: "Front surface reflectance R₁", unit: "", toSI: 1, siUnit: "", default: 0.7, min: 0.01, max: 0.99 },
    // The page sets no upper bound on thickness and index; the schema needs one (1 mm, n ≤ 10).
    { key: "thickness", label: "Coating thickness", unit: "nm", toSI: 1e-9, siUnit: "m", default: 500, min: 0, max: 1e6 },
    { key: "n", label: "Refractive index n", unit: "", toSI: 1, siUnit: "", default: 2.3, min: 1, max: 10 },
    { key: "wavelength", label: "Centre wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 100, max: 20000 },
    { key: "bandwidth", label: "Plot bandwidth (plot only)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 100, min: 0.1, max: 20000 },
  ],
  outputs: [
    { key: "groupDelay", label: "Group delay at the centre wavelength", unit: "fs", toSI: 1e-15, siUnit: "s" },
    { key: "roundTripPhase", label: "Round-trip phase δ₀ (mod 2π)", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "gdd", label: "GDD at the centre wavelength", unit: "fs²", toSI: 1e-30, siUnit: "s²" },
    { key: "roundTripTime", label: "Round-trip time t₀ = 2nd/c", unit: "fs", toSI: 1e-15, siUnit: "s" },
  ],
  compute({ reflectivity, thickness, n, wavelength }) {
    const gti = { R: reflectivity, n, d: thickness };
    return {
      values: {
        groupDelay: gtiGroupDelay(gti, wavelength),
        roundTripPhase: gtiRoundTripPhase(gti, wavelength) % (2 * Math.PI),
        gdd: gtiGdd(gti, wavelength),
        roundTripTime: gtiRoundTripTime(gti),
      },
    };
  },
  checks: [
    {
      // R = 0.7, n = 2.3, d = 500 nm, λ = 1550 nm: t₀ = 2 × 2.3 × 500e-9/c = 7.67197419 fs; δ = 4π × 2.3 × 500e-9/1550e-9 = 9.32343626 rad
      // = 3.04025096 rad mod 2π; τ = t₀ × 0.3/(1.7 + 2√0.7 cos δ) = 65.26523 fs; GDD = 2t₀² √R (1 − R) sin δ/(…)² = 2403.6217 fs².
      source: KUHL,
      basis: "computed",
      inputs: { reflectivity: 0.7, thickness: 500, n: 2.3, wavelength: 1550 },
      expect: { groupDelay: 65.26523427808335, roundTripPhase: 3.0402509550868952, gdd: 2403.621667210033, roundTripTime: 7.671974189557496 },
      tolerance: 1e-8,
    },
    {
      // λ = 4nd = 4600 nm gives δ = π: τ = t₀(1 + √0.7)/(1 − √0.7) = 7.67197419 fs × 11.2449 = 86.26675 fs (the delay maximum).
      source: KUHL,
      basis: "computed",
      inputs: { reflectivity: 0.7, thickness: 500, n: 2.3, wavelength: 4600 },
      expect: { groupDelay: 86.26674793418528 },
      tolerance: 1e-8,
    },
    {
      // λ = 2nd = 2300 nm gives δ = 2π: τ = t₀(1 − √0.7)/(1 + √0.7) = 7.67197419 fs × 0.088934 = 0.68229288 fs (the delay minimum).
      source: KUHL,
      basis: "computed",
      inputs: { reflectivity: 0.7, thickness: 500, n: 2.3, wavelength: 2300 },
      expect: { groupDelay: 0.682292880799695 },
      tolerance: 1e-8,
    },
  ],
});
