import assert from "node:assert/strict";
import test from "node:test";
import { filmFaceSummary } from "../src/physics/thin-film/interference";

// Born & Wolf, Principles of Optics, 7th ed., §7.6.1: F = 4ρ/(1 − ρ)², finesse 2π/(4 asin(1/√F)).
test("filmFaceSummary: n = 4 film in air on both sides", () => {
  const s = filmFaceSummary(1, 4, 1);
  assert.ok(Math.abs(s.r01 + 0.6) < 1e-12);
  assert.ok(Math.abs(s.r12 - 0.6) < 1e-12);
  // R1 = R2 = 0.36: F = 1.44/0.4096.
  assert.ok(Math.abs(s.F - 3.515625) < 1e-12);
  assert.ok(Math.abs(s.finesse - 2.79234688) < 1e-8);
});

test("filmFaceSummary: F < 1 has no finesse; invalid index gives NaN", () => {
  const weak = filmFaceSummary(1, 1.38, 1.52);
  assert.ok(weak.F < 1);
  assert.ok(Number.isNaN(weak.finesse));
  assert.ok(Number.isNaN(filmFaceSummary(1, 0, 1.5).F));
});
