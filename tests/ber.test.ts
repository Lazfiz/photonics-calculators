import test from "node:test";
import assert from "node:assert/strict";

import {
  dpskPhotonCountingBer,
  ookPhotonCountingBer,
  requiredPhotonsPerBit,
} from "../src/physics/free-space-comms/ber";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Photon-counting quantum limits (Caplan 2007, doi:10.1007/978-0-387-28677-8_4):
// OOK ½e^(−2n̄) → 10 photons/bit at 1e-9; DPSK ½e^(−n̄) → 20 photons/bit at 1e-9.
test("BER: noiseless photon counting reaches the OOK and DPSK quantum limits", () => {
  assertRel(ookPhotonCountingBer(10, 0).ber, 0.5 * Math.exp(-20), 1e-15, "OOK n=10");
  assert.equal(ookPhotonCountingBer(10, 0).threshold, 1);
  assertRel(dpskPhotonCountingBer(10, 0), 0.5 * Math.exp(-10), 1e-15, "DPSK n=10");
  assertRel(requiredPhotonsPerBit("OOK", 1e-9, 0), Math.log(5e8) / 2, 1e-12, "OOK required");
  assertRel(requiredPhotonsPerBit("DPSK", 1e-9, 0), Math.log(5e8), 1e-12, "DPSK required");
});

test("BER: OOK with background uses the ML threshold (hand calculation)", () => {
  // n̄ = 10 → n_s = 20, n_b = 0.1: k_T = ⌊20 / ln(201)⌋ + 1 = 4.
  // BER = ½[P(K ≥ 4 | 0.1) + P(K ≤ 3 | 20.1)].
  const falseAlarm = 3.846833925345059e-6; // Σ_{j≥4} e^(−0.1) 0.1^j / j!
  const mu = 20.1;
  const miss = Math.exp(-mu) * (1 + mu + mu ** 2 / 2 + mu ** 3 / 6);
  const result = ookPhotonCountingBer(10, 0.1);
  assert.equal(result.threshold, 4);
  assertRel(result.ber, 0.5 * (falseAlarm + miss), 1e-12, "OOK n=10, nb=0.1");
});

// Independent reference: brute-force evaluation in CPython (OOK minimised over every integer
// threshold, DPSK as an explicit double sum over both port counts, math.lgamma pmfs).
test("BER: matches brute-force Poisson sums with dark counts", () => {
  const cases: Array<[number, number, number, number]> = [
    [5, 1, 0.009382223739761069, 0.022723630278700304],
    [1, 0.5, 0.18875075280734785, 0.25059092200491045],
    [50, 20, 2.848285448781699e-11, 1.9117085656180277e-8],
    [100, 100, 1.0035300391701593e-13, 2.380571738887527e-9],
    [3, 30, 0.30077525152699414, 0.35296839889073905],
  ];
  for (const [n, nb, ook, dpsk] of cases) {
    assertRel(ookPhotonCountingBer(n, nb).ber, ook, 1e-11, `OOK ${n}/${nb}`);
    assertRel(dpskPhotonCountingBer(n, nb), dpsk, 1e-11, `DPSK ${n}/${nb}`);
  }
});

test("BER: edge cases", () => {
  assert.equal(ookPhotonCountingBer(0, 5).ber, 0.5);
  assert.equal(dpskPhotonCountingBer(0, 5), 0.5);
  assert.equal(dpskPhotonCountingBer(1e5, 1), 0); // below 1e-300: reported as underflow
  assert.equal(ookPhotonCountingBer(1e5, 1e4).ber, 0);
  assert.ok(Number.isNaN(ookPhotonCountingBer(-1, 0).ber));
  assert.ok(Number.isNaN(dpskPhotonCountingBer(10, Number.NaN)));
  assert.ok(Number.isNaN(requiredPhotonsPerBit("OOK", 0.7, 0)));
});
