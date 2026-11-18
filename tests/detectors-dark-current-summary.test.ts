import test from "node:test";
import assert from "node:assert/strict";

import { darkCurrentSummary, orderTemperatureRange } from "../src/physics/detectors/dark-current-summary";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Doubling law D = D25·2^((T − 25 °C)/T_d), crossover T* = 25 + T_d·log2(σ_r²/(D25·t)) (algebra of √(D·t) = σ_r), and the local
// Si doubling temperature ln2/(m·d ln n_i/dT) with the Sze Varshni coefficients: S. M. Sze, K. K. Ng, Physics of Semiconductor
// Devices, 3rd ed. (Wiley 2007), ch. 1–2. Hand-worked with an independent script at D25 = 0.1, T_d = 6 K, σ_r = 5, t = 1 s.
test("darkCurrentSummary: −80…100 °C", () => {
  const s = darkCurrentSummary({ darkCurrent25: 0.1, doublingT: 6, readNoise: 5, exposureTime: 1, tempA: -80, tempB: 100 });
  assertRel(s.dcAtMin, 5.394796609394437e-7, 1e-9, "D(-80)"); // 0.1·2^(−17.5)
  assertRel(s.dcAtMax, 579.2618751480198, 1e-9, "D(100)"); // 0.1·2^(12.5)
  assertRel(s.ratio, 2 ** 30, 1e-9, "ratio");
  assertRel(s.crossoverTemp, 72.79470570797253, 1e-9, "T*"); // 25 + 6·log2(250)
  assertRel(s.siGenTd, 8.311156671895736, 1e-9, "T_d generation");
  assertRel(s.siDiffTd, 4.155578335947868, 1e-9, "T_d diffusion");
});

test("darkCurrentSummary: ends in either order, equal ends, no read noise", () => {
  const swapped = darkCurrentSummary({ darkCurrent25: 10, doublingT: 8, readNoise: 3, exposureTime: 2, tempA: 30, tempB: -20 });
  assert.equal(swapped.tempMin, -20);
  assert.equal(swapped.tempMax, 30);
  assertRel(swapped.ratio, 76.10925536017415, 1e-9, "ratio"); // 2^(50/8)
  assertRel(swapped.crossoverTemp, 15.7839752524396, 1e-9, "T*"); // 25 + 8·log2(9/20)
  assert.deepEqual(orderTemperatureRange(10, 10), { tempMin: 10, tempMax: 11 });
  const none = darkCurrentSummary({ darkCurrent25: 0.1, doublingT: 6, readNoise: 0, exposureTime: 1, tempA: 0, tempB: 10 });
  assert.ok(Number.isNaN(none.crossoverTemp));
});
