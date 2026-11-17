import test from "node:test";
import assert from "node:assert/strict";

import fiberBraggGratingSensor from "../src/schemas/fiber-optics/fiber-bragg-grating-sensor";
import fiberCharacterization from "../src/schemas/fiber-optics/fiber-characterization";
import fiberLaser from "../src/schemas/fiber-optics/fiber-laser";
import fiberOpticSensor from "../src/schemas/fiber-optics/fiber-optic-sensor";
import fiberTaper from "../src/schemas/fiber-optics/fiber-taper";
import { runSchema } from "../src/schemas/run";
import type { CalculatorSchema } from "../src/schemas/types";

const run = (schema: CalculatorSchema, overrides: Record<string, number | string>) => {
  const defaults = Object.fromEntries([
    ...schema.inputs.map((input) => [input.key, input.default]),
    ...(schema.choices ?? []).map((choice) => [choice.key, choice.default]),
  ]);
  return runSchema(schema, { ...defaults, ...overrides });
};

test("fiber-laser: past V = 40 the mode count is null with the V²/2 estimate; at V ≈ 30 it is the exact LP count (Gloge 1971)", () => {
  // 1000 µm core, NA 0.08, 1064 nm: V = π · 1000e-6 · 0.08/1064e-9 = 236.2, V²/2 ≈ 27898.
  const big = run(fiberLaser, { coreDiameter: 1000 });
  assert.equal(big.outputs.guidedModes, null);
  assert.ok(big.warnings.some((w) => w.includes("V²/2 ≈ 27898")), big.warnings.join(" | "));
  // V = 29.99993: 456 modes (2 per LP0m, 4 per LPlm, l ≥ 1), against Gloge's V²/2 = 450.
  const v30 = run(fiberLaser, { coreDiameter: 100, NA: 0.1, laserWavelength: 1047.2 });
  assert.equal(v30.outputs.guidedModes, 456);
  // V = 0.295 (NA 0.01): no mode-field diameter, and a warning that says why.
  const small = run(fiberLaser, { NA: 0.01 });
  assert.equal(small.outputs.modeFieldDiameter, null);
  assert.ok(small.warnings.some((w) => w.startsWith("V = 0.295 is below 0.5")), small.warnings.join(" | "));
});

test("Sensor sensitivities: SI per unit strain (m, rad) and per kelvin (m/K, rad/K)", () => {
  const fbg = run(fiberBraggGratingSensor, {});
  // 1.2358659 pm/µε = 1.2358659e-6 m per unit strain.
  assert.ok(Math.abs((fbg.si.strainPm ?? NaN) / 1.2358659468692244e-6 - 1) < 1e-12);
  assert.ok(Math.abs((fbg.outputs.strainPm ?? NaN) / 1.2358659468692244 - 1) < 1e-12);
  assert.equal(fiberBraggGratingSensor.outputs.find((o) => o.key === "tempPm")?.siUnit, "m/K");
  const mzi = run(fiberOpticSensor, { sensor: "mach_zehnder" });
  assert.ok(Math.abs((mzi.si.mziStrainSens ?? NaN) / (mzi.outputs.mziStrainSens ?? NaN) - 1e6) < 1e-3);
});

test("A null output comes with a warning about it: acceptance angle, evanescent d_p change, taper waist", () => {
  // n₁ 1.4682 on n₂ = 1: NA = 1.075 > 1.
  const ch = run(fiberCharacterization, { claddingIndex: 1 });
  assert.equal(ch.outputs.acceptanceAngle, null);
  assert.ok(ch.warnings.some((w) => w.startsWith("NA > 1")), ch.warnings.join(" | "));
  // Water warming by 10 K lowers n_ext below n_eff, but at ΔT = 0 n_ext = 1.4475 is above it.
  const ev = run(fiberOpticSensor, { sensor: "evanescent", n_ext: 1.4475, tempChange: 10 });
  assert.ok((ev.outputs.evDp ?? NaN) > 0);
  assert.equal(ev.outputs.evDpChange, null);
  assert.ok(ev.warnings.some((w) => w.startsWith("At ΔT = 0")), ev.warnings.join(" | "));
  const taper = run(fiberTaper, { heaterWidth: 0.1 });
  assert.equal(taper.outputs.waistNeff, null);
  assert.ok(taper.warnings.some((w) => w.startsWith("No guided LP01 was found at the waist")), taper.warnings.join(" | "));
});
