import test from "node:test";
import assert from "node:assert/strict";

import { expansionWaves, thermalExpansion } from "../src/physics/materials/thermal-expansion";

test("thermal expansion ΔL = αLΔT (PR #155 golden value)", () => {
  // Si, α = 2.6e-6/K at 300 K (Okada & Tokumaru 1984, doi:10.1063/1.333965), L = 100 mm, ΔT = 10 K: ΔL = 2.6 µm.
  const dL = thermalExpansion(2.6e-6, 0.1, 10);
  assert.ok(Math.abs(dL - 2.6e-6) < 1e-15, `${dL}`);
  // 2.6 µm is 4.11 waves of 633 nm.
  assert.ok(Math.abs(expansionWaves(dL, 633e-9) - 4.1074) < 1e-4);
  // Cooling contracts; λ ≤ 0 is guarded.
  assert.ok(thermalExpansion(2.6e-6, 0.1, -10) < 0 && Number.isNaN(expansionWaves(dL, 0)));
});
