import test from "node:test";
import assert from "node:assert/strict";

import { mirrorRadius } from "../src/physics/wave-optics/two-mirror-resonator";
import { dyeLaserCw } from "../src/physics/wave-optics/laser-resonator";

// Golden values for the chain are the reference checks in src/schemas/wave-optics/dye-laser-resonator.ts.
const base = {
  lambda: 590e-9, lambdaP: 532e-9, pump: 3, etaP: 1, wp: 30e-6, sigmaE: 1.1e-20, tau: 4.2e-9, sigmaT: 3.7e-21,
  kST: 3.4e6, tauT: 0.25e-6, flow: 5, L: 0.099, R1: 0.05, R2: 0.05, R_oc: 0.97, lossPerPass: 0.01,
};

test("mirrorRadius: 0 means a flat mirror", () => {
  assert.equal(mirrorRadius(0), Infinity);
  assert.equal(mirrorRadius(-0.2), -0.2);
});

test("dyeLaserCw: an unstable cavity (L > R₁ + R₂ for two concave mirrors) gives NaN threshold and output", () => {
  const op = dyeLaserCw({ ...base, L: 0.12 });
  assert.equal(op.stability, "unstable");
  assert.ok(Number.isNaN(op.pTh) && Number.isNaN(op.pOut) && Number.isNaN(op.slope));
});

test("dyeLaserCw: triplets that kill the gain (factor ≤ 0) give NaN threshold", () => {
  const op = dyeLaserCw({ ...base, flow: 0.01, sigmaT: 1e-18 });
  assert.ok(op.factor <= 0);
  assert.ok(Number.isNaN(op.pTh) && Number.isNaN(op.slope));
});
