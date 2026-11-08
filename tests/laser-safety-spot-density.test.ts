import assert from "node:assert/strict";
import test from "node:test";
import { spotPowerDensity } from "../src/physics/laser-safety/surgical-laser";

test("spotPowerDensity is P/(πd²/4)", () => {
  // 10 W over a 0.2 mm spot: A = π(0.1 mm)² = 3.14159265e-8 m², so 10/3.14159265e-8 = 3.18309886e8 W/m² (31 831 W/cm²).
  assert.ok(Math.abs(spotPowerDensity(10, 2e-4) / 3.18309886e8 - 1) < 1e-8);
  assert.ok(Number.isNaN(spotPowerDensity(1, 0)));
  assert.ok(Number.isNaN(spotPowerDensity(-1, 1e-3)));
});
