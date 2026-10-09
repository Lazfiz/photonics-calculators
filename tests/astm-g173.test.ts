import test from "node:test";
import assert from "node:assert/strict";

import { G173_GLOBAL_TILT, G173_WAVELENGTHS_NM, solarWeightedMean } from "../src/physics/astm-g173";

// ASTM G173-03: the global tilt spectrum on its 2002-point grid integrates to 1000.4 W m⁻² (280–4000 nm).
test("ASTM G173: grid and integrated irradiance", () => {
  assert.equal(G173_WAVELENGTHS_NM.length, 2002);
  assert.equal(G173_GLOBAL_TILT.length, 2002);
  assert.deepEqual(G173_WAVELENGTHS_NM.slice(0, 3), [280, 280.5, 281]);
  assert.deepEqual(G173_WAVELENGTHS_NM.slice(1539, 1544), [1699, 1700, 1702, 1705, 1710]);
  assert.equal(G173_WAVELENGTHS_NM[2001], 4000);
  let total = 0;
  for (let i = 1; i < 2002; i++) {
    const dw = G173_WAVELENGTHS_NM[i] - G173_WAVELENGTHS_NM[i - 1];
    total += (dw * (G173_GLOBAL_TILT[i] + G173_GLOBAL_TILT[i - 1])) / 2;
  }
  assert.ok(Math.abs(total - 1000.4) < 0.05, `∫E dλ = ${total}`);
  // Spot values from the table: 500 nm and 1000 nm.
  assert.equal(G173_GLOBAL_TILT[G173_WAVELENGTHS_NM.indexOf(500)], 1.5451);
  assert.equal(G173_GLOBAL_TILT[G173_WAVELENGTHS_NM.indexOf(1000)], 0.73532);
});

test("ASTM G173: solar-weighted mean", () => {
  assert.ok(Math.abs(solarWeightedMean(() => 0.37) - 0.37) < 1e-15, "constant");
  // A step at 700 nm splits the weight into the parts below and above; they add to 1.
  const below = solarWeightedMean((w) => (w < 700e-9 ? 1 : 0), 280, 700);
  const lo = solarWeightedMean((w) => (w <= 700e-9 ? 1 : 0));
  const hi = solarWeightedMean((w) => (w > 700e-9 ? 1 : 0));
  assert.ok(Math.abs(lo + hi - 1) < 0.002, `${lo} + ${hi}`); // the interval 700–701 nm is split
  assert.ok(below > 0.99, "the 280–700 window renormalizes");
  assert.ok(Number.isNaN(solarWeightedMean(() => 1, 5000, 6000)), "empty range");
  assert.ok(Number.isNaN(solarWeightedMean(() => NaN)));
});
