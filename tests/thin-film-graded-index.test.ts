import test from "node:test";
import assert from "node:assert/strict";

import {
  gradedIndexAt,
  gradedIndexLayers,
  gradedSublayerCount,
  type GradedProfile,
} from "../src/physics/thin-film/graded-index";
import { stackResponse, type Layer } from "../src/physics/thin-film/transfer-matrix";

const NM = 1e-9;
const PROFILES: GradedProfile[] = ["linear", "cosine", "exponential"];

function close(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

const reflectance = (layers: Layer[], wavelength: number) =>
  stackResponse({ incident: 1, layers, substrate: { n: 1.52 } }, wavelength).R;

/** Independent fine staircase: N midpoint sublayers, outermost first. */
function fineStaircase(profile: GradedProfile, nSub: number, nSurf: number, thickness: number, N: number): Layer[] {
  const layers: Layer[] = [];
  for (let j = N - 1; j >= 0; j--) {
    layers.push({ n: gradedIndexAt(profile, nSub, nSurf, (j + 0.5) / N), thickness: thickness / N });
  }
  return layers;
}

const BARE = ((1.52 - 1) / 2.52) ** 2; // 0.0425800, uncoated substrate

test("graded index: profiles and sublayer count", () => {
  for (const p of PROFILES) {
    close(gradedIndexAt(p, 1.52, 1.1, 0), 1.52, 1e-15, `${p} at the substrate`);
    close(gradedIndexAt(p, 1.52, 1.1, 1), 1.1, 1e-15, `${p} at the surface`);
    assert.ok(Number.isNaN(gradedIndexAt(p, 1.52, 1.1, 1.01)), `${p}: f > 1`);
  }
  close(gradedIndexAt("cosine", 1.52, 1.1, 0.5), 1.31, 1e-15, "cosine midpoint");
  close(gradedIndexAt("exponential", 1.52, 1.1, 0.5), Math.sqrt(1.52 * 1.1), 1e-15, "exponential midpoint");
  // 10 sublayers per λ_min/n_max: 5 µm × 1.52 × 10 / 275 nm = 276.4 → 277; at least 50, at most 400.
  assert.equal(gradedSublayerCount(5000 * NM, 275 * NM, 1.52), 277);
  assert.equal(gradedSublayerCount(500 * NM, 275 * NM, 1.52), 50);
  assert.equal(gradedSublayerCount(20000 * NM, 275 * NM, 1.52), 400);
});

// Limits that don't depend on the staircase: no index change, or no thickness, leaves the bare substrate.
test("graded index: no index change or no thickness gives the bare substrate", () => {
  for (const p of PROFILES) {
    close(reflectance(gradedIndexLayers(p, 1.52, 1.52, 500 * NM, 275 * NM), 550 * NM), BARE, 1e-12, `${p}, n_t = n_s`);
  }
  assert.equal(gradedIndexLayers("cosine", 1.52, 1.1, 0, 275 * NM).length, 0, "zero thickness");
  close(reflectance(gradedIndexLayers("cosine", 1.52, 1.1, 1e-12, 275 * NM), 550 * NM), BARE, 1e-9, "1 pm");
});

// Southwell, Opt. Lett. 8, 584 (1983): a smooth profile much thicker than λ reflects almost nothing, so
// R tends to the abrupt surface step's Fresnel value, ((1 − 1.38)/(1 + 1.38))² = 0.0254925.
test("graded index: thick smooth profile reflects only at the surface step", () => {
  const R = reflectance(gradedIndexLayers("cosine", 1.52, 1.38, 5000 * NM, 275 * NM), 550 * NM);
  close(R, ((1 - 1.38) / 2.38) ** 2, 1e-5, "5 µm cosine");
});

// Convergence: the 50-sublayer midpoint staircase matches a 4000-sublayer one at the page defaults
// (500 nm, 1.52 → 1.38, λ = 550 nm) to 0.001 percentage points.
test("graded index: staircase converges", () => {
  for (const p of PROFILES) {
    const coarse = reflectance(gradedIndexLayers(p, 1.52, 1.38, 500 * NM, 275 * NM), 550 * NM);
    const fine = reflectance(fineStaircase(p, 1.52, 1.38, 500 * NM, 4000), 550 * NM);
    close(coarse, fine, 1e-5, p);
  }
});
