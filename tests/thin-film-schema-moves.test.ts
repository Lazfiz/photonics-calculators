import assert from "node:assert/strict";
import test from "node:test";

import { kendallPeelEnergy, kendallStretchShare } from "../src/physics/thin-film/adhesion";
import { stoneyCurvature, stoneyLayeredCurvature } from "../src/physics/thin-film/stoney";

test("kendallStretchShare: the (F/b)²/(2Eh) term over Kendall's G", () => {
  // Kendall (1975), doi:10.1088/0022-3727/8/13/005: F/b = 100 N/m, θ = 90°, E = 3 GPa, h = 50 µm:
  // stretching 1e4/(2 · 3e9 · 5e-5) = 1/30 J/m², G = 100 + 1/30, share = (1/30)/(100 + 1/30).
  const share = kendallStretchShare(100, Math.PI / 2, 3e9, 50e-6);
  assert.ok(Math.abs(share - 1 / 3001) < 1e-12);
  // θ = 0 (peel along the surface): only the stretching term remains, share 1.
  assert.ok(Math.abs(kendallStretchShare(100, 0, 3e9, 50e-6) - 1) < 1e-12);
  // Zero force: G = 0, no share.
  assert.ok(Number.isNaN(kendallStretchShare(0, Math.PI / 2, 3e9, 50e-6)));
  assert.ok(Math.abs(kendallPeelEnergy(100, Math.PI / 2, 3e9, 50e-6) - (100 + 1 / 30)) < 1e-9);
});

test("stoneyLayeredCurvature: N layers add their forces, N rounded to a whole number >= 1", () => {
  // Stoney (1909) / Janssen et al. (2009), doi:10.1016/j.tsf.2008.07.014: 200 MPa, 500 nm, 70 GPa, ν 0.17, 1 mm:
  // κ1 = 6 · 2e8 · 5e-7 · 0.83/(7e10 · 1e-6) = 498/7e4 1/m.
  const k1 = 498 / 7e4;
  assert.ok(Math.abs(stoneyLayeredCurvature(2e8, 5e-7, 10, 70e9, 0.17, 1e-3) - 10 * k1) < 1e-12);
  assert.equal(stoneyLayeredCurvature(2e8, 5e-7, 1, 70e9, 0.17, 1e-3), stoneyCurvature(2e8, 5e-7, 70e9, 0.17, 1e-3));
  // Edge: N below 1 is a single layer; 2.4 rounds to 2.
  assert.equal(stoneyLayeredCurvature(2e8, 5e-7, 0, 70e9, 0.17, 1e-3), stoneyLayeredCurvature(2e8, 5e-7, 1, 70e9, 0.17, 1e-3));
  assert.ok(Math.abs(stoneyLayeredCurvature(2e8, 5e-7, 2.4, 70e9, 0.17, 1e-3) - 2 * k1) < 1e-12);
});
