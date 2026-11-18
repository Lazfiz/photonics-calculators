import test from "node:test";
import assert from "node:assert/strict";

import { MINUTES_PER_YEAR, PS_PER_SQRT_KM, pmdSummary } from "../src/physics/fiber-optics/polarization-mode-dispersion-summary";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Poole, Opt. Lett. 13, 687 (1988), doi:10.1364/OL.13.000687: Maxwellian DGD, mean = PMD sqrt(L), mean = sqrt(8/(3 pi)) rms.
// Tail probabilities from a numerical integral of the Maxwellian density in an independent script.
test("pmdSummary: 0.5 ps/sqrt(km) over 100 km at 10 Gb/s, design maximum 3 x mean", () => {
  const s = pmdSummary({ pmdCoefficient: 0.5 * PS_PER_SQRT_KM, length: 100e3, bitRate: 10e9, maxToMean: 3 });
  assertRel(s.mean, 5e-12, 1e-12, "mean");
  assertRel(s.rms, 5.427009409187008e-12, 1e-9, "rms");
  assertRel(s.meanOverT, 0.05, 1e-12, "mean/T");
  assertRel(s.maxDgd, 15e-12, 1e-12, "max DGD");
  assertRel(s.maxOverT, 0.15, 1e-12, "max/T");
  assertRel(s.maxLength, 400e3, 1e-9, "limit");
  assertRel(s.pOut, 4.199759119544893e-5, 1e-8, "exceedance");
  assertRel(s.pOut * MINUTES_PER_YEAR, 22.08905306515832, 1e-8, "outage minutes per year");
  assert.equal(s.withinRule, true);
});

test("pmdSummary: a link past the 0.1 bit-period rule is flagged", () => {
  const s = pmdSummary({ pmdCoefficient: 0.1 * PS_PER_SQRT_KM, length: 2000e3, bitRate: 40e9, maxToMean: 2 });
  assertRel(s.meanOverT, 0.1788854381999832, 1e-9, "mean/T");
  assertRel(s.pOut, 0.01705012317015802, 1e-8, "exceedance");
  assertRel(s.maxLength, 625e3, 1e-9, "limit");
  assert.equal(s.withinRule, false);
});
