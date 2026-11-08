import test from "node:test";
import assert from "node:assert/strict";

import { mbllDpf, dpfFrontalHead } from "../src/physics/spectroscopy/near-infrared";
import { slabIndices } from "../src/physics/spectroscopy/slab-medium";

const close = (actual: number, expected: number, rel: number, msg?: string) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg ?? ""} ${actual} vs ${expected}`);

test("slabIndices: custom pair passes through, fused silica follows Malitson 1965", () => {
  const custom = slabIndices("custom", 800e-9, 1.5, 1.6);
  assert.deepEqual([custom.n, custom.ng, custom.glass, custom.inRange], [1.5, 1.6, false, true]);
  // Malitson (J. Opt. Soc. Am. 55, 1205): n² − 1 = Σ Bᵢλ²/(λ² − Cᵢ²), B = 0.6961663, 0.4079426, 0.8974794,
  // C = 0.0684043, 0.1162414, 9.896161 µm; at 0.8 µm n = 1.4533172549 (worked independently of the repo code).
  const silica = slabIndices("fusedSilica", 800e-9, 1.5, 1.6);
  close(silica.n, 1.4533172548587, 1e-10);
  assert.ok(silica.glass && silica.inRange && silica.ng > silica.n);
});

test("slabIndices: outside the formula range a glass gives NaN, an unknown id means custom", () => {
  const out = slabIndices("N-BK7", 100e-9, 1.5, 1.6);
  assert.ok(Number.isNaN(out.n) && Number.isNaN(out.ng) && out.glass && !out.inRange);
  const unknown = slabIndices("constructor", 800e-9, 1.2, 1.3);
  assert.deepEqual([unknown.n, unknown.ng, unknown.glass], [1.2, 1.3, false]);
});

test("mbllDpf: age mode is the Scholkmann–Wolf DPF, manual mode returns the entered value", () => {
  // Scholkmann & Wolf (2013) at age 30, 800 nm: 223.3 + 1.0105653 − 293.0176 + 796.8 − 722 = 6.0929653278.
  close(mbllDpf("age", 30, 800e-9, 99), 6.0929653278, 1e-9);
  assert.equal(mbllDpf("age", 30, 800e-9, 99), dpfFrontalHead(30, 800e-9));
  assert.equal(mbllDpf("manual", 30, 800e-9, 5.5), 5.5);
  assert.ok(Number.isNaN(mbllDpf("age", 30, 650e-9, 5.5)));
});
