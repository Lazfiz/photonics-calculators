import { cosmicRaySummary } from "../../physics/detectors/cosmic-rays";
import { defineSchema } from "../types";

const PDG = "Navas S. et al. (Particle Data Group) (2024). Review of Particle Physics. Phys. Rev. D 110, 030001, doi:10.1103/PhysRevD.110.030001: " +
  "Atomic and Nuclear Properties (silicon ⟨dE/dx⟩_min = 1.664 MeV g⁻¹ cm², ρ = 2.329 g/cm³), §35.8 (w = 3.65 eV per e–h pair), and the Landau–Vavilov–Bichsel " +
  "most probable loss Δp = ξ[ln(2 m_e c² ξ/(ħω_p)²) + j], ξ = (K/2)(Z/A)ρx, j = 0.2, ħω_p = 31.05 eV; " +
  "pixels per track 1 + 4ℓ/(πp) is the Buffon-needle average of ℓ(|cos φ| + |sin φ|)/p over azimuth.";

export default defineSchema({
  href: "/detectors/cosmic-rays",
  inputs: [
    { key: "sensorArea", label: "Sensor area", unit: "cm²", toSI: 1e-4, siUnit: "m²", default: 1, min: 0.01, max: 1000 },
    { key: "exposureTime", label: "Exposure time", unit: "s", toSI: 1, siUnit: "s", default: 1, min: 0.001, max: 100000 },
    { key: "flux", label: "Muon flux", unit: "cm⁻² min⁻¹", toSI: 1e4 / 60, siUnit: "m⁻² s⁻¹", default: 1, min: 0, max: 100 },
    { key: "pixelSize", label: "Pixel pitch", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10, min: 1, max: 100 },
    { key: "thickness", label: "Sensitive thickness t", unit: "µm", toSI: 1e-6, siUnit: "m", default: 20, min: 1, max: 1000 },
    { key: "zenithAngle", label: "Zenith angle θ", unit: "°", toSI: Math.PI / 180, siUnit: "rad", default: 30, min: 0, max: 85 },
    { key: "numFrames", label: "Frames", unit: "", toSI: 1, siUnit: "", default: 100, min: 1, max: 1000000 },
  ],
  outputs: [
    { key: "hits", label: "Expected hits per frame", unit: "", toSI: 1, siUnit: "" },
    { key: "hits99", label: "99th percentile of hits per frame", unit: "", toSI: 1, siUnit: "" },
    { key: "path", label: "Path in the layer t/cos θ", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "meanCharge", label: "Mean charge per track", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "mpvCharge", label: "Most probable charge per track", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "pixelsPerTrack", label: "Pixels per track", unit: "", toSI: 1, siUnit: "" },
    { key: "pixelsHitPerFrame", label: "Pixels hit per frame", unit: "", toSI: 1, siUnit: "" },
    { key: "hitFraction", label: "Fraction of pixels hit per frame", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "hitsInFrames", label: "Hits in all frames", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ sensorArea, exposureTime, flux, pixelSize, thickness, zenithAngle, numFrames }) {
    const r = cosmicRaySummary({
      flux, area: sensorArea, exposure: exposureTime, pitch: pixelSize, thickness, zenith: zenithAngle, frames: numFrames,
    });
    return {
      values: {
        hits: r.hits, hits99: r.hits99, path: r.path, meanCharge: r.meanCharge, mpvCharge: r.mpvCharge,
        pixelsPerTrack: r.pixelsHit, pixelsHitPerFrame: r.pixelsHitPerFrame, hitFraction: r.hitFraction, hitsInFrames: r.hitsInFrames,
      },
    };
  },
  checks: [
    {
      // Defaults: flux 1 cm⁻² min⁻¹, A = 1 cm², 1 s: N = 1/60 = 0.0166667; P(0) = e^(-N) = 0.98347 < 0.99 ≤ P(≤1) = 0.99986, so the quantile is 1.
      // L = 20/cos 30° = 23.0940108 µm; mean = L·1.664e6·2.329/3.65 e⁻/cm → 106.17 e⁻/µm × L = 2452.0499; K = 4π N_A r_e² m_e c² = 0.307074927 MeV cm²/mol
      // (r_e = α² a₀, CODATA 2022), ξ = (K/2)(14/28.0855)(L·1e-4 cm)(2.329) MeV, Δp = ξ[ln(2 m_e c² ξ/31.05²) + 0.2] = 1487.1592 e⁻ after ÷ 3.65 eV.
      // Pixels per track 1 + 4·(20 tan 30°)/(π·10) = 2.4702104; pixels = 1e8 µm²/100 = 1e6; fraction = 1 − exp(−N·2.4702104/1e6).
      source: PDG,
      basis: "computed",
      inputs: {},
      expect: {
        hits: 0.016666666666666666, hits99: 1, path: 23.09401076758503, meanCharge: 2452.049934063069, mpvCharge: 1487.1592187008464,
        pixelsPerTrack: 2.4702103877914454, pixelsHitPerFrame: 0.04117017312985742, hitFraction: 0.000004117017227134312, hitsInFrames: 1.6666666666666667,
      },
      tolerance: 1e-8,
    },
    {
      // Flux 2 cm⁻² min⁻¹, A = 4 cm², 10 s: N = 80/60 = 1.3333333 (quantile 5: P(≤4) = 0.9867 < 0.99 ≤ P(≤5) = 0.9976). 5 µm pixels, t = 300 µm, θ = 45°,
      // 10 frames: L = 424.2640687 µm, mean = 45047.0337 e⁻, Δp = 33351.7702 e⁻, 1 + 4·300/(5π) = 77.3943727 pixels per track, 4e8/25 = 1.6e7 pixels.
      source: PDG,
      basis: "computed",
      inputs: { sensorArea: 4, exposureTime: 10, flux: 2, pixelSize: 5, thickness: 300, zenithAngle: 45, numFrames: 10 },
      expect: {
        hits: 1.3333333333333333, hits99: 5, path: 424.2640687119285, meanCharge: 45047.033717097416, mpvCharge: 33351.770218970865,
        pixelsPerTrack: 77.39437268410975, pixelsHitPerFrame: 103.19249691214634, hitFraction: 0.0006449510258854652, hitsInFrames: 13.333333333333332,
      },
      tolerance: 1e-8,
    },
  ],
});
