import test from "node:test";
import assert from "node:assert/strict";

import { confocalResolutionSummary } from "../src/physics/imaging/confocal-resolution";

const nm = 1e-9;
const close = (actual: number, expected: number, tol: number, label: string) =>
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);

test("confocal resolution summary, 600 nm NA 1.2 n 1.33 M 100, 1.5 AU (Born & Wolf §8.5.2, §8.8)", () => {
  // Hand: widefield lateral (v½/π) λ/NA with v½ = 1.6163399483 (bisection on [2J1(v)/v]² = ½) = 257.2484925 nm;
  // widefield axial (2 x½/π) λ/(n − √(n² − NA²)), x½ = 1.3915573783 (bisection on sin²x/x² = ½) = 702.6231150 nm;
  // pinhole 1.5 · 1.22 · 600/1.2 nm · 100 = 91.5 µm.
  const s = confocalResolutionSummary(600 * nm, 1.2, 1.5, 1.33, 100);
  close(s.widefieldLateral, 257.24849249054705 * nm, 1e-9, "widefield lateral");
  close(s.widefieldAxial, 702.6231150456575 * nm, 1e-9, "widefield axial");
  close(s.pinholeDiameter, 91.5e-6, 1e-9, "pinhole diameter");
});

test("confocal resolution summary: the confocal axial FWHM stays below the widefield one, even with an open pinhole", () => {
  const open = confocalResolutionSummary(550 * nm, 1.4, 5, 1.518, 60);
  assert.ok(open.confocalAxial <= open.widefieldAxial * 1.0001);
  assert.ok(confocalResolutionSummary(550 * nm, 1.4, 0, 1.518, 60).confocalLateral < open.widefieldLateral);
});
