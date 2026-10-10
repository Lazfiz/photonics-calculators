import test from "node:test";
import assert from "node:assert/strict";

import { SILVER_DRUDE_TAIL, SILVER_TABLE_RANGE, silverIndex } from "../src/physics/materials/silver";
import { AG_YANG_2015 } from "../src/physics/materials/silver-yang-2015";

// Yang et al., Phys. Rev. B 91, 235137 (2015), via refractiveindex.info data/main/Ag/nk/Yang.yml.
test("silver: table rows and interpolation", () => {
  assert.equal(AG_YANG_2015.length, 525);
  assert.deepEqual(AG_YANG_2015[0], [0.27, 1.364, 1.318]);
  assert.deepEqual(AG_YANG_2015[524], [24.92, 49.79, 151.4]);
  assert.ok(Math.abs(SILVER_TABLE_RANGE[1] - 24.92e-6) < 1e-15);
  // At a node the table comes back; R at 549.9 nm = ((n − 1)² + κ²)/((n + 1)² + κ²) = 98.39 %.
  const ag = silverIndex(0.5499e-6);
  assert.deepEqual([ag.n, ag.k], [0.05326, 3.484]);
  assert.ok(Math.abs(((ag.n - 1) ** 2 + ag.k ** 2) / ((ag.n + 1) ** 2 + ag.k ** 2) - 0.98392) < 1e-5);
  // Halfway between 0.27 and 0.28 µm: the mean of the two rows.
  const mid = silverIndex(0.275e-6);
  assert.ok(Math.abs(mid.n - (1.364 + 1.477) / 2) < 1e-12 && Math.abs(mid.k - (1.318 + 1.24) / 2) < 1e-12);
  // Repeated wavelengths in the source (1.32 µm twice) don't break the interpolation.
  const dup = silverIndex(1.32e-6);
  assert.ok(Math.abs(dup.n - 0.1897) < 1e-12 && Math.abs(dup.k - 9.243) < 1e-12);
  assert.ok(Number.isNaN(silverIndex(0.2e-6).n));
  assert.ok(Number.isNaN(silverIndex(-1).k));
});

test("silver: Drude continuation beyond 24.92 µm", () => {
  // Hand: ε = 49.79² − 151.4² + 2i·49.79·151.4 = −20443 + 15077i at E = 1.23984/24.92 = 0.049753 eV;
  // z = −1/(ε − 1) = 3.1684e-5 + 2.3367e-5 i; ω_p² = E²/Re z = 78.13 eV² (ħω_p = 8.839 eV); ħγ = ω_p² Im z/E = 0.03669 eV.
  assert.ok(Math.abs(SILVER_DRUDE_TAIL.plasma - 8.839) < 2e-3, `${SILVER_DRUDE_TAIL.plasma}`);
  assert.ok(Math.abs(SILVER_DRUDE_TAIL.gamma - 0.03669) < 2e-5, `${SILVER_DRUDE_TAIL.gamma}`);
  // Continuous at the joint, and Drude-like beyond it (κ grows, |ε| grows).
  const end = silverIndex(24.92e-6), past = silverIndex(24.92e-6 * (1 + 1e-9));
  assert.ok(Math.abs(past.n / end.n - 1) < 1e-6 && Math.abs(past.k / end.k - 1) < 1e-6, `${past.n} ${past.k}`);
  const far = silverIndex(50e-6);
  assert.ok(far.k > end.k && far.n > end.n);
});
