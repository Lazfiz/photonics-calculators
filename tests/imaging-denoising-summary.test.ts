// denoisingSummary (src/physics/imaging/denoising.ts). Hand-worked: box k × k gives σ/k (Gonzalez & Woods 2018,
// Digital Image Processing, 4th ed.); VisuShrink T = σ√(2 ln N) (Donoho & Johnstone 1994, Biometrika 81, 425–455,
// doi:10.1093/biomet/81.3.425); the median has no transfer function.
import assert from "node:assert/strict";
import test from "node:test";

import { denoisingSummary } from "../src/physics/imaging/denoising";

const near = (a: number, b: number, rel = 1e-9) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} vs ${b}`);

test("box 5 × 5 on σ = 20, 512 × 512 image", () => {
  const s = denoisingSummary("box", 5, 2, 20, 512);
  near(s.ratio, 0.2);
  near(s.outputNoise, 4);
  near(s.gainDb, 20 * Math.log10(5));
  near(s.threshold, 20 * Math.sqrt(2 * Math.log(512 * 512))); // 99.90655
  // H(0.25) = sin(5π/4)/(5 sin(π/4)) = −1/5
  near(s.hQuarter, -0.2);
  // f50: bisection of sin(5πf)/(5 sin πf) = 0.5 on (0.05, 0.25), 200 halvings: 0.12247265910937 cy/px
  near(s.f50, 0.12247265910937, 1e-8);
});

test("median has no transfer function", () => {
  const s = denoisingSummary("median", 3, 2, 1, 16);
  assert.ok(Number.isNaN(s.f50) && Number.isNaN(s.hQuarter));
  // n = 9 normals: Var(median) = ∫ x² · 9!/(4!)² · [Φ(1−Φ)]⁴ φ dx (David & Nagaraja 2003, Simpson 2e5 steps) = 0.166101281359,
  // so the noise ratio is √0.166101281359 = 0.40755524946
  near(s.ratio, 0.40755524946, 1e-8);
});

test("a zero noise input gives no threshold", () => {
  assert.ok(Number.isNaN(denoisingSummary("box", 3, 2, 0, 512).threshold));
});
