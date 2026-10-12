import test from "node:test";
import assert from "node:assert/strict";

import {
  HEX_PACKING_LIMIT, bundleFill, combinerEtendueRatio, fiberEtendue, hexBundleDiameter, hexFiberCount, hexRingCount,
  squareBundleDiameter, taperedPumpNA,
} from "../src/physics/fiber-optics/fiber-bundle";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("hexagonal bundle rings and diameter (hand geometry)", () => {
  // 1, 7, 19, 37, 61 fibres fill 0–4 rings; one more fibre starts the next ring.
  assert.deepEqual([1, 7, 19, 37, 61].map(hexRingCount), [0, 1, 2, 3, 4]);
  assert.deepEqual([2, 8, 20, 38].map(hexRingCount), [1, 2, 3, 4]);
  assert.equal(hexFiberCount(3), 37);
  // 37 × 125 µm: 3 rings → (2·3 + 1)·125 µm = 0.875 mm (PR #43 review: the page showed 1.125 mm).
  assertRel(hexBundleDiameter(37, 125e-6), 0.875e-3, 1e-12, "D(37)");
  // Core fill 37·(62.5/875)² = 0.188776, cladding fill 37/49 = 0.755102.
  assertRel(bundleFill(37, 62.5e-6, 0.875e-3), 0.188776, 1e-5, "core fill");
  assertRel(bundleFill(37, 125e-6, 0.875e-3), 37 / 49, 1e-12, "cladding fill");
  // Large full bundles approach 3n²/(2n)² = 0.75 of the circle, below the hexagon-tiling limit 0.9069.
  assertRel(bundleFill(hexFiberCount(200), 1, hexBundleDiameter(hexFiberCount(200), 1)), 0.75, 0.01, "large-n fill");
  assertRel(HEX_PACKING_LIMIT, 0.906900, 1e-6, "π/(2√3)");
  assert.ok(Number.isNaN(hexRingCount(0)));
});

test("square bundle diameter (hand geometry)", () => {
  // 3 × 3 grid of 125 µm fibres: corner centres at √2·125 µm → D = (2√2 + 1)·125 µm = 478.553 µm.
  assertRel(squareBundleDiameter(9, 125e-6), 478.553e-6, 1e-6, "D(9)");
  assertRel(squareBundleDiameter(1, 125e-6), 125e-6, 1e-12, "D(1)");
  assertRel(squareBundleDiameter(10, 125e-6), (3 * Math.SQRT2 + 1) * 125e-6, 1e-12, "D(10) uses a 4 × 4 grid");
});

test("pump-combiner étendue and taper NA (Kosterin et al. 2004)", () => {
  // 105 µm / 0.22 pump fibre: G = π²·(105e-6)²·0.22²/4 = 1.31663e-9 m²·sr.
  assertRel(fiberEtendue(105e-6, 0.22), 1.31663e-9, 1e-5, "G");
  // 6 ports into 400 µm / 0.46: 6·(105·0.22)²/(400·0.46)² = 3201.66/33856 = 0.094567 → feasible (PR #43 review).
  assertRel(combinerEtendueRatio(6, 105e-6, 0.22, 400e-6, 0.46), 0.0945670, 1e-5, "(6+1)×1");
  // (6+1)×1 of 125 µm fibres spans 375 µm < 400 µm: no taper, NA stays 0.22.
  assert.equal(taperedPumpNA(0.22, hexBundleDiameter(7, 125e-6), 400e-6), 0.22);
  // (18+1)×1 spans 625 µm: taper ratio 1.5625 → NA 0.34375.
  assertRel(taperedPumpNA(0.22, hexBundleDiameter(19, 125e-6), 400e-6), 0.34375, 1e-12, "(18+1)×1");
  assert.ok(Number.isNaN(fiberEtendue(105e-6, 1.2)));
});
