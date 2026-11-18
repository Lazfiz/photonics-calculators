import assert from "node:assert/strict";
import test from "node:test";

import { contrastMethodsSummary } from "../src/physics/imaging/contrast-methods";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const base = {
  lambda: 600e-9, na: 1.4, thickness: 2e-6, dn: 0.002, ring: "positive" as const, ringTransmission: 0.25,
  shear: 150e-9, edge: 500e-9, bias: 0.1, stray: 0.001,
};

// Zernike, Physica 9, 686 (1942), doi:10.1016/S0031-8914(42)80035-X; Salmon & Tran, Methods Cell Biol. 81, 335 (2007),
// doi:10.1016/S0091-679X(06)81016-2. Worked by an independent script from U = a e^(iδ) + e^(iφ) − 1 and the sin² DIC law.
test("contrastMethodsSummary: weak object, positive ring", () => {
  // φ = 2π·4 nm/600 nm = 0.0418879; C = −16.04853 %, small-φ limit −16.75516 %; Δφ = φ·150/500 = 0.0125664;
  // DIC (Γ = 0.2π, I_c = 0.1 %): +3.86045 % and −3.79425 %; resolution 0.61·600/1.4 = 261.4286 nm
  const r = contrastMethodsSummary(base);
  assertRel(r.opticalPathDifference, 4e-9, 1e-12, "OPD");
  assertRel(r.phi, 0.04188790204786391, 1e-9, "φ");
  assertRel(r.phaseContrast, -0.16048525570766536, 1e-8, "PC");
  assertRel(r.phaseContrastLinear, -0.16755160819145565, 1e-8, "PC linear");
  assertRel(r.shearPhase, 0.012566370614359173, 1e-9, "Δφ");
  assertRel(r.dicPlus, 0.038604484783211955, 1e-8, "DIC +");
  assertRel(r.dicMinus, -0.03794249301134311, 1e-8, "DIC −");
  assertRel(r.resolution, 261.42857142857144e-9, 1e-9, "resolution");
  assert.deepEqual(r.warnings, []);
});

test("contrastMethodsSummary: warnings and the dark-background edge case", () => {
  // t = 5 µm, Δn = 0.005, 550 nm: φ = 0.2856 rad > a/2 = 0.25 (ring 25 %): small-φ warning; thick enough that tan(φ/2) < a, no reversal
  const thick = contrastMethodsSummary({ ...base, lambda: 550e-9, thickness: 5e-6, dn: 0.005 });
  assert.equal(thick.warnings.length, 1);
  assert.match(thick.warnings[0], /not small next to the ring amplitude/);
  // shear 400 nm > resolution 0.61·600/1.5 = 244 nm: doubled-image warning (the large φ here may add the others)
  const doubled = contrastMethodsSummary({ ...base, shear: 400e-9, na: 1.5, thickness: 30e-6, dn: 0.1 });
  assert.ok(doubled.warnings.some((w) => /exceeds the resolution/.test(w)));
  const dark = contrastMethodsSummary({ ...base, bias: 0, stray: 0 });
  assert.ok(Number.isNaN(dark.dicPlus));
  assert.ok(dark.warnings.some((w) => /background is black/.test(w)));
  // φ = 2π · 0.02 · 50 µm / 600 nm = 10.47 rad > π: the wrap warning replaces the reversal test (tan(φ/2) < 0 there).
  const wrapped = contrastMethodsSummary({ ...base, thickness: 50e-6, dn: 0.02 });
  assert.ok(wrapped.warnings.some((w) => /exceeds π/.test(w)));
  assert.ok(!wrapped.warnings.some((w) => /Contrast reversal/.test(w)));
});
