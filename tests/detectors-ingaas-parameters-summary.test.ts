import test from "node:test";
import assert from "node:assert/strict";

import { ingaasParametersSummary, ingaasQeAt } from "../src/physics/detectors/ingaas-parameters";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Vurgaftman et al., J. Appl. Phys. 89, 5815 (2001) band gap; n_i = 6.3e17 m⁻³ at x = 0.53, 300 K (Paul et al., J. Appl. Phys. 69, 827,
// 1991); QE = (1 − R)(1 − e^(−αd)) with α = 2.4e6·√(E − E_g) /m; I_gen = q·n_i·d·A/τ_g; NEP = √(2q·I_gen)/ℛ. Independent script, own constants.
test("ingaasParametersSummary: lattice-matched InGaAs at 300 K", () => {
  const s = ingaasParametersSummary({ T: 300, x: 0.53, thickness: 3e-6, area: 1e-7, bias: -1, lifetime: 100e-6, reflectance: 0.02 });
  assertRel(s.bandGap, 0.7372566705016357, 1e-9, "E_g");
  assertRel(s.cutoff_nm, 1681.6965297694812, 1e-9, "cutoff");
  assertRel(s.qe1300, 0.9456132151464599, 1e-9, "QE 1300");
  assertRel(s.qe1550, 0.8183363740547913, 1e-9, "QE 1550");
  assertRel(s.r1550, 1.0230508369728435, 1e-9, "R");
  assertRel(s.ni, 6.3e17, 1e-12, "n_i");
  assertRel(s.genCurrent, 3.0281138382599996e-10, 1e-9, "I_gen");
  assertRel(s.dark, 3.0281138261945953e-10, 1e-9, "I_dark");
  assertRel(s.nep1550, 9.628509841532732e-15, 1e-9, "NEP");
  assertRel(s.dStar1550, 3284285639432.847, 1e-9, "D*");
});

test("ingaasParametersSummary: extended InGaAs, 280 K, small bias", () => {
  const s = ingaasParametersSummary({ T: 280, x: 0.65, thickness: 5e-6, area: 5e-7, bias: -0.05, lifetime: 50e-6, reflectance: 0.03 });
  assertRel(s.cutoff_nm, 1981.111158192218, 1e-9, "cutoff");
  assertRel(s.ni, 2064631723498464500, 1e-9, "n_i");
  assertRel(s.dark, 1.067081150605857e-8, 1e-9, "I_dark");
  assertRel(s.dStar1550, 1169966667675.909, 1e-9, "D*");
});

test("ingaasParametersSummary: GaAs (x = 0) has no response at 1550 nm; QE is zero below the gap", () => {
  const p = { T: 300, x: 0, thickness: 3e-6, area: 1e-7, bias: -1, lifetime: 100e-6, reflectance: 0.02 };
  const s = ingaasParametersSummary(p);
  assert.equal(s.qe1550, 0);
  assert.ok(Number.isNaN(s.nep1550));
  assert.equal(ingaasQeAt(1550, { bandGap: s.bandGap, reflectance: 0.02, thickness: 3e-6 }), 0);
});
