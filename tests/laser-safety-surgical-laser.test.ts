import test from "node:test";
import assert from "node:assert/strict";

import { eyeLimits } from "../src/physics/laser-safety/eye-exposure-limits";
import { limitMaxIrradiance, nominalOcularHazardDistance, roundBeam } from "../src/physics/laser-safety/hazard-distance";
import {
  diffractionLimitedSpot, focusedDivergence, thermalRelaxationTime, TISSUE_DIFFUSIVITY,
} from "../src/physics/laser-safety/surgical-laser";

// Thermal relaxation time: Anderson & Parrish, Science 220, 524 (1983), doi:10.1126/science.6836297 (d²/(16κ) for a
// vessel). Lens-on-laser hazard distance: ANSI Z136.1-2014 App. B, r = (f/b₀)√(4P/(πE)) with 1/e values. Limits:
// ICNIRP, Health Phys. 105(3), 271–295 (2013), Table 5.

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("thermal relaxation time: the centre temperature halves", () => {
  // 100 µm vessel, κ = 1.3e-7 m²/s: d²/(16κ) = 4.808 ms (the old page used κ in cm²/s with d in m: 10⁴× smaller).
  const cyl = thermalRelaxationTime(100e-6, "cylinder");
  assertRel(cyl, 4.808e-3, 1e-3, "cylinder");
  assertRel(cyl / ((100e-6) ** 2 / (16 * 1.3e-3)), 1e4, 1e-12, "old page");
  assertRel(thermalRelaxationTime(100e-6, "sphere"), (100e-6) ** 2 / (27.24 * TISSUE_DIFFUSIVITY), 1e-3, "sphere d²/(27κ)");
  for (const [shape, n] of [["layer", 1], ["cylinder", 2], ["sphere", 3]] as const) {
    const tau = thermalRelaxationTime(50e-6, shape);
    assertRel(Math.pow(1 + (4 * TISSUE_DIFFUSIVITY * tau) / (25e-6) ** 2, -n / 2), 0.5, 1e-12, `${shape}: halves`);
  }
  assert.ok(Number.isNaN(thermalRelaxationTime(-1, "layer")));
});

test("focusing handpiece: divergence, diffraction limit and the lens-on-laser hazard distance", () => {
  // CO₂, 8 mm beam on a 100 mm lens: 80 mrad beyond the focus; 4λf/(πb₀) = 0.1687 mm.
  const phi = focusedDivergence(8e-3, 0.1);
  assertRel(phi, 0.08, 1e-12, "b₀/f");
  assertRel(diffractionLimitedSpot(10.6e-6, 8e-3, 0.1), 0.1687e-3, 1e-3, "diffraction-limited spot");
  // 10 W, 10 s: the least irradiance limit is 5.6×10³·10^0.25 / 10 = 995.85 W/m² (Table 5, at the end of the t^0.25
  // piece). ANSI with 1/e values: (f/b₀,e)(√(4P/(πE)) − a_e) = (√(8P/(πE)) − a)/φ with the 1/e² ones = 1.9956 m.
  const limit = eyeLimits(10.6e-6)[0];
  const E = limitMaxIrradiance(limit, 10);
  assertRel(E, 995.85, 1e-4, "E");
  const nohd = nominalOcularHazardDistance(10.6e-6, 10, roundBeam(0.2e-3, phi), 10).distance;
  assertRel(nohd, (Math.sqrt((8 * 10) / (Math.PI * E)) - 0.2e-3) / phi, 1e-3, "ANSI lens on laser");
  assertRel(nohd, 1.9956, 1e-3, "value");
  assert.ok(Number.isNaN(focusedDivergence(8e-3, 0)));
});
