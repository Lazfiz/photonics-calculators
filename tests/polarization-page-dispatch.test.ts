import assert from "node:assert/strict";
import test from "node:test";
import { conoscopeSetup } from "../src/physics/polarization/conoscopy";
import { prismPolarizer, splitterAngles } from "../src/physics/polarization/prism-polarizers";
import { crystalBirefringence, resolveCrystalIndices } from "../src/physics/polarization/uniaxial";

test("resolveCrystalIndices: custom values pass through, a named crystal is NaN outside its fit range", () => {
  assert.deepEqual(resolveCrystalIndices("custom", 550e-9, 1.5443, 1.5534), { no: 1.5443, ne: 1.5534 });
  const quartz = resolveCrystalIndices("quartz", 589e-9, NaN, NaN);
  assert.ok(Math.abs(quartz.no - 1.5443) < 1e-3 && quartz.ne > quartz.no); // Ghosh 1999 fit: n_o ≈ 1.5443, n_e ≈ 1.5534
  assert.ok(Number.isNaN(resolveCrystalIndices("quartz", 50e-9, NaN, NaN).no));
  assert.equal(crystalBirefringence("custom", -0.172)(1e-6), -0.172);
});

test("prismPolarizer: exactly one of splitter and Glan result; splitter equals splitterAngles", () => {
  const w = prismPolarizer("wollaston", 1.658, 1.486, 0.3);
  assert.equal(w.glan, null);
  assert.deepEqual(w.split, splitterAngles("wollaston", 1.658, 1.486, 0.3));
  const g = prismPolarizer("glan", 1.658, 1.486, 1.2);
  assert.equal(g.split, null);
  assert.ok(g.glan);
});

test("conoscopeSetup: uniaxial order, invalid biaxial order, NA limit 0.98 n_alpha", () => {
  const neg = conoscopeSetup("calcite", 589e-9, [1, 1, 1], 0.85); // calcite is negative: [n_e, n_o, n_o]
  assert.ok(neg.valid && neg.indices[0] < neg.indices[1] && neg.indices[1] === neg.indices[2]);
  const bad = conoscopeSetup(null, 589e-9, [1.7, 1.6, 1.5], 0.85);
  assert.ok(!bad.valid && Number.isNaN(bad.NA));
  const limited = conoscopeSetup(null, 589e-9, [1.0, 1.1, 1.2], 1.3);
  assert.ok(limited.valid && Math.abs(limited.NA - 0.98) < 1e-12);
});
