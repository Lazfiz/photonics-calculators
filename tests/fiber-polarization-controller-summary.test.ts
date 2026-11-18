import test from "node:test";
import assert from "node:assert/strict";

import { polarizationControllerSummary } from "../src/physics/fiber-optics/polarization-controller";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}
const DEG = Math.PI / 180;

// Ulrich, Rashleigh, Eickhoff, Opt. Lett. 5, 273 (1980), doi:10.1364/OL.5.000273: B = 0.133 (d/D)^2; Lefevre,
// Electron. Lett. 16, 778 (1980): retardance = 2 pi^2 * 0.133 * N d^2/(lambda D). Values worked by an independent
// script (Mueller chain: rotate (S1, S2) by 2 theta, rotate (S2, S3) by the retardance with Collett sign, rotate back).
const base = {
  lambda: 1550e-9, claddingDiameter: 125e-6, loopDiameter: 0.03,
  loops: [2, 4, 2] as [number, number, number], angles: [0, 45 * DEG, 0] as [number, number, number], psi: 45 * DEG, chi: 0,
};

test("polarizationControllerSummary: retardances, loop diameters and output ellipse at 1550 nm, 30 mm loops", () => {
  const s = polarizationControllerSummary(base);
  assertRel(s.perLoop, 0.882162221333928, 1e-9, "perLoop");
  assertRel(s.Bbend, 2.309027777777778e-6, 1e-9, "Bbend");
  assertRel(s.paddles[1].retardance / (2 * Math.PI), 0.5616019125368852, 1e-9, "paddle 2 waves");
  assertRel(s.dQuarter, 33.69611475221311e-3, 1e-9, "dQuarter");
  assertRel(s.out[1], -0.3704174826281026, 1e-8, "S1");
  assertRel(s.out[2], 0.9287604440385978, 1e-8, "S2");
  assertRel(s.out[3], 0.01396159563538216, 1e-8, "S3");
  assertRel(s.ell.psi / DEG, 55.8717970317018, 1e-9, "azimuth");
  assertRel(s.ell.chi / DEG, 0.3999832478381889, 1e-8, "ellipticity");
  assert.equal(s.hand, "right");
});

test("polarizationControllerSummary: whole loops, and 0 loops everywhere leaves the input unchanged", () => {
  const rounded = polarizationControllerSummary({ ...base, loops: [2.4, 3.6, 2.2] });
  const whole = polarizationControllerSummary({ ...base, loops: [2, 4, 2] });
  assert.deepEqual(rounded.out, whole.out);
  const none = polarizationControllerSummary({ ...base, loops: [0, 0, 0] });
  assertRel(none.out[2], 1, 1e-12, "S2 = 1 for psi = 45 deg");
  assert.ok(Math.abs(none.out[1]) < 1e-12 && Math.abs(none.out[3]) < 1e-12);
  // Circular input and no retardance: a circular state has no major axis.
  const circ = polarizationControllerSummary({ ...base, loops: [0, 0, 0], chi: 45 * DEG });
  assert.ok(Number.isNaN(circ.ell.psi));
  assertRel(circ.ell.chi / DEG, 45, 1e-9, "chi");
});
