import test from "node:test";
import assert from "node:assert/strict";

import { expandBeam } from "../src/physics/laser-safety/beam-expander";

// Mean irradiance of a round beam: E = P/A = 4P/(πd²). Hand values below are independent of the module.

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("1 W, 2 mm, M = 5: irradiance 3.18310e5 → 1.27324e4 W/m² (31.83 → 1.273 W/cm²)", () => {
  // 4·1/(π·(2e-3)²) = 1/(π·1e-6) = 318 309.9 W/m²; output 10 mm: 4/(π·1e-4) = 12 732.4 W/m².
  const r = expandBeam(1, 2e-3, 5);
  assertRel(r.meanIrradianceIn, 3.18310e5, 1e-5, "input");
  assertRel(r.meanIrradianceOut, 1.27324e4, 1e-5, "output");
  assertRel(r.outputDiameter, 10e-3, 1e-12, "output diameter");
  assert.equal(r.reduction, 25);
  assertRel(r.divergenceFactor, 0.2, 1e-12, "divergence factor 1/M");
  // The page's former bug: d in mm gave W/mm² (3.18 W/mm²) labelled W/cm². In W/cm² the value is 100× that.
  assertRel(r.meanIrradianceIn * 1e-4, 31.831, 1e-4, "W/cm²");
});

test("the irradiance ratio is M², and the output carries the same power", () => {
  const r = expandBeam(0.37, 3.3e-3, 7.5);
  assertRel(r.meanIrradianceIn / r.meanIrradianceOut, 56.25, 1e-12, "E_in/E_out = M²");
  assert.equal(r.reduction, 56.25);
  // Power = irradiance × area at both ends.
  assertRel(r.meanIrradianceOut * (Math.PI * r.outputDiameter ** 2) / 4, 0.37, 1e-12, "P out");
  assertRel(r.meanIrradianceIn * (Math.PI * 3.3e-3 ** 2) / 4, 0.37, 1e-12, "P in");
});

test("4P/(πd²) is the Gaussian peak for the 1/e diameter (Saleh & Teich ch. 3.1: I₀ = 2P/(πw²))", () => {
  // d_1/e = 2 mm → 1/e² radius w = d/√2 = 1.41421 mm; I₀ = 2P/(πw²) = 2/(π·2e-6) = 3.18310e5 W/m² for 1 W.
  const w = 2e-3 / Math.SQRT2;
  assertRel(expandBeam(1, 2e-3, 1).meanIrradianceIn, (2 * 1) / (Math.PI * w * w), 1e-12, "peak");
  // With a 1/e² diameter of 2 mm, w = 1 mm: I₀ = 2/(π·1e-6) = 6.366e5, twice the value from d = 2 mm.
  assertRel((2 * 1) / (Math.PI * 1e-6), 2 * expandBeam(1, 2e-3, 1).meanIrradianceIn, 1e-12, "1/e² diameter: ×2");
});

test("edges: M = 1 changes nothing, zero power, and invalid input gives NaN", () => {
  const one = expandBeam(2, 4e-3, 1);
  assert.equal(one.reduction, 1);
  assert.equal(one.divergenceFactor, 1);
  assert.equal(one.meanIrradianceIn, one.meanIrradianceOut);
  assert.equal(expandBeam(0, 4e-3, 3).meanIrradianceOut, 0);
  for (const [P, d, M] of [[1, 0, 5], [1, -1e-3, 5], [1, 2e-3, 0], [1, 2e-3, -2], [-1, 2e-3, 5], [NaN, 2e-3, 5],
    [1, Infinity, 5], [1, 2e-3, Infinity]]) {
    const r = expandBeam(P, d, M);
    assert.ok(Object.values(r).every(Number.isNaN), `${P}, ${d}, ${M}`);
  }
});
