import { rayleighRange } from "../../physics/wave-optics/gaussian-beam";
import { bestLensPosition, singleLensModeMatch } from "../../physics/wave-optics/mode-matching";
import { defineSchema } from "../types";

const SOURCE =
  "Kogelnik H., Li T. (1966). Laser beams and resonators. Appl. Opt. 5, 1550–1567, doi:10.1364/ao.5.001550 (mode matching " +
  "with a thin lens); Self S. A. (1983). Focusing of spherical Gaussian beams. Appl. Opt. 22, 658–661, doi:10.1364/ao.22.000658; " +
  "Joyce W. B., DeLoach B. C. (1984). Alignment of Gaussian beams. Appl. Opt. 23, 4187–4196, doi:10.1364/ao.23.004187 (coupling)";

export default defineSchema({
  href: "/wave-optics/mode-matching",
  inputs: [
    { key: "wavelength", label: "Wavelength λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 11000 },
    { key: "w1", label: "Input waist radius w₁ (1/e²)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 50, min: 1, max: 10000 },
    { key: "w2", label: "Target waist radius w₂ (1/e²)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 200, min: 1, max: 10000 },
    { key: "d", label: "Waist-to-waist distance d", unit: "mm", toSI: 1e-3, siUnit: "m", default: 200, min: 0.1, max: 1e5 },
    { key: "f", label: "Your lens focal length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 40, min: 0.1, max: 1e5 },
  ],
  outputs: [
    { key: "matchingFocalLength", label: "Matching lens focal length f", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "lensToInputWaist", label: "Lens distance from input waist s₁", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "lensToTargetWaist", label: "Lens distance to target waist s₂", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "shortestFocalLength", label: "Shortest usable focal length f₀ = π w₁ w₂/λ", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "magnification", label: "Magnification w₂/w₁", unit: "", toSI: 1, siUnit: "" },
    { key: "rayleighRange1", label: "Rayleigh range z_R1 of the input beam", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "rayleighRange2", label: "Rayleigh range z_R2 of the target beam", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "yourLensDistance", label: "Your lens: best distance from the input waist", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "yourLensCoupling", label: "Your lens: coupling η (best over positions between the waists)", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ wavelength, w1, w2, d, f }) {
    const p = { lambda: wavelength, w1, w2, d };
    const sol = singleLensModeMatch(p);
    const stock = bestLensPosition(p, f);
    const warnings: string[] = [];
    if (!sol.lensBetweenWaists && Number.isFinite(sol.f)) {
      warnings.push(
        `The matching lens would sit ${sol.s1 < 0 ? "before the input waist" : "after the target waist"}: d is shorter than one lens can bridge, ` +
        "so no single lens between the waists couples 100 %. Increase d or use two lenses.",
      );
    }
    return {
      values: {
        matchingFocalLength: sol.f,
        lensToInputWaist: sol.s1,
        lensToTargetWaist: sol.s2,
        shortestFocalLength: sol.f0,
        magnification: w2 / w1,
        rayleighRange1: rayleighRange({ lambda: wavelength, w0: w1 }),
        rayleighRange2: rayleighRange({ lambda: wavelength, w0: w2 }),
        yourLensDistance: stock.s,
        yourLensCoupling: stock.eta,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults. f₀ = π w₁w₂/λ = π · 50e-6 · 200e-6/1.55e-6 = 20.268339701 mm; r = w₁/w₂ = 1/4, A = (r − 1/r)² = 14.0625,
      // C = d² + (r + 1/r)² f₀² = 0.04 + 18.0625 f₀²; f = positive root of A f² + 4d f − C = 0 = 36.217660590 mm;
      // √(f² − f₀²) = 30.015218546 mm, s₁ = f + r√(f² − f₀²) = 43.721465226 mm, s₂ = f + √(f² − f₀²)/r = 156.278534774 mm
      // (s₁ + s₂ = d); z_R1 = π w₁²/λ = 5.067084925 mm, z_R2 = 81.073358802 mm.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        matchingFocalLength: 36.21766058962974, lensToInputWaist: 43.72146522614389, lensToTargetWaist: 156.27853477385611,
        shortestFocalLength: 20.26833970057931, magnification: 4, rayleighRange1: 5.067084925144827, rayleighRange2: 81.07335880231724,
      },
      tolerance: 1e-8,
    },
    {
      // λ = 1064 nm, w₁ = 100 µm, w₂ = 300 µm, d = 500 mm: f₀ = 88.578740233 mm, r = 1/3, A = 7.1111, C = 0.25 + (10/3)² f₀²;
      // f = 118.587880724 mm, √(f² − f₀²) = 78.847271566 mm, s₁ = f + r√(…) = 144.870304571 mm, s₂ = 355.129695429 mm.
      source: SOURCE,
      basis: "computed",
      inputs: { wavelength: 1064, w1: 100, w2: 300, d: 500 },
      expect: {
        matchingFocalLength: 118.5878807238758, lensToInputWaist: 144.87030457910066, lensToTargetWaist: 355.12969542089956,
        shortestFocalLength: 88.5787402327949, magnification: 3,
      },
      tolerance: 1e-8,
    },
  ],
});
