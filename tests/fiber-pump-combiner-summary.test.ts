import test from "node:test";
import assert from "node:assert/strict";

import { pumpCombinerSummary } from "../src/physics/fiber-optics/pump-combiner";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const um = 1e-6;

// Kosterin et al., Appl. Opt. 43, 3893 (2004): étendue conservation and NA scaling by the taper ratio.
test("pumpCombinerSummary: 6 + 1 fibres into 400 µm / NA 0.46 (hand-worked)", () => {
  const r = pumpCombinerSummary({
    ports: 6, signalPort: true, power: 30, efficiency: 0.98, signalLossDb: 0.1,
    pumpCore: 200 * um, pumpClad: 220 * um, pumpNA: 0.22, outDia: 400 * um, outNA: 0.46,
  });
  assertRel(r.bundle, 660 * um, 1e-12, "bundle (2·1 + 1)·220 µm");
  assertRel(r.taperRatio, 1.65, 1e-12, "taper ratio");
  assertRel(r.naTaper, 0.363, 1e-12, "NA after taper");
  assertRel(r.U, (6 * 1936) / 33856, 1e-12, "U = 6·(200·0.22)²/(400·0.46)²");
  assertRel(r.pOut, 176.4, 1e-12, "P_out");
  assert.equal(r.maxPorts, 17); // ⌊33856/1936⌋ = ⌊17.49⌋
  assertRel(r.signalT, 0.9772372209558107, 1e-12, "10^(−0.01)");
  assert.ok(r.taperOK && r.etendueOK);
});

test("pumpCombinerSummary: a taper that raises the NA above the output NA fails the taper test", () => {
  const r = pumpCombinerSummary({
    ports: 19, signalPort: false, power: 10, efficiency: 1, signalLossDb: 0,
    pumpCore: 200 * um, pumpClad: 220 * um, pumpNA: 0.22, outDia: 400 * um, outNA: 0.46,
  });
  // 19 fibres = 2 rings: bundle 5·220 = 1100 µm, TR = 2.75, NA = 0.605 > 0.46; U = 19·1936/33856 = 1.0865 > 1.
  assertRel(r.naTaper, 0.605, 1e-12, "NA after taper");
  assert.equal(r.taperOK, false);
  assert.equal(r.etendueOK, false);
});
