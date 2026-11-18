import test from "node:test";
import assert from "node:assert/strict";

import { fluorescenceSpectraSummary } from "../src/physics/imaging/fluorescence-spectra";
import { fluorophoreByName } from "../src/physics/imaging/fluorophores";

const rel = (a: number, e: number) => Math.abs(a / e - 1);

// FPbase spectra (Lambert, Nat. Methods 16, 277 (2019)); Lakowicz, Principles of Fluorescence Spectroscopy, 3rd ed., §13.2.
// Expected values from an independent script: trapezoid sums of the 1 nm samples, Gauss–Legendre J, R₀⁶ = 9000 ln10 κ² Φ J/(128 π⁵ N_A n⁴).
test("fluorescenceSpectraSummary: EGFP → mCherry at 488 nm, 500–550 nm filter, κ² 0.6667, n 1.4, r 5 nm", () => {
  const r = fluorescenceSpectraSummary({
    donor: fluorophoreByName("EGFP"), acceptor: fluorophoreByName("mCherry"), laser: 488e-9, filterLow: 500e-9, filterHigh: 550e-9,
    kappa2: 0.6667, n: 1.4, distance: 5e-9,
  });
  assert.ok(rel(r.dyes[0].excitation, 0.9982) < 1e-9);
  assert.ok(rel(r.dyes[0].inFilter, 0.706482784011) < 1e-8);
  assert.ok(rel(r.overlap, 1.944102106398e15) < 1e-8);
  assert.ok(rel(r.R0, 5.109041527065e-9) < 1e-8);
  assert.ok(rel(r.efficiency, 0.5323157492554) < 1e-8);
});

test("fluorescenceSpectraSummary: κ² = 0 gives R₀ = 0 and no efficiency (domain edge)", () => {
  const r = fluorescenceSpectraSummary({
    donor: fluorophoreByName("EGFP"), acceptor: fluorophoreByName("mCherry"), laser: 488e-9, filterLow: 500e-9, filterHigh: 550e-9,
    kappa2: 0, n: 1.4, distance: 5e-9,
  });
  assert.equal(r.R0, 0);
  assert.ok(Number.isNaN(r.efficiency));
});
