import test from "node:test";
import assert from "node:assert/strict";

import { amplifierSummary } from "../src/physics/fiber-optics/doped-fiber-gain";
import { connectorLoss } from "../src/physics/fiber-optics/gaussian-coupling";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const um = 1e-6;
const K = 10 / Math.LN10;

test("connectorLoss: at physical contact the offset and tilt losses add (Marcuse 1977)", () => {
  const w = 4.5 * um, lambda = 1550e-9, n = 1.447, d = 0.3 * um, th = (0.3 * Math.PI) / 180;
  const r = connectorLoss({ w, lambda, nFiber: n, nGap: 1, offset: d, tilt: th, gap: 0 });
  const lat = K * (d / w) ** 2;
  const ang = K * ((Math.PI * n * w * th) / lambda) ** 2;
  assertRel(r.lateral, lat, 1e-9, "lateral");
  assertRel(r.angular, ang, 1e-9, "angular");
  assertRel(r.total, lat + ang, 1e-9, "total");
  assert.equal(r.jointReturnLoss, Infinity);
});

test("connectorLoss: index-matched gap is pure diffraction, 10 log10(1 + (λz/(2π n w²))²)", () => {
  const w = 4.5 * um, lambda = 1550e-9, n = 1.447, z = 5 * um;
  const r = connectorLoss({ w, lambda, nFiber: n, nGap: n, offset: 0, tilt: 0, gap: z });
  const u = (lambda * z) / (2 * Math.PI * n * w * w);
  assertRel(r.gap, 10 * Math.log10(1 + u * u), 1e-9, "gap");
});

test("connectorLoss: NaN beyond the validated gap and tilt ranges", () => {
  const base = { w: 4.5 * um, lambda: 1550e-9, nFiber: 1.447, nGap: 1, offset: 0, tilt: 0, gap: 0 };
  assert.ok(Number.isNaN(connectorLoss({ ...base, gap: 5.1 * um }).total));
  assert.ok(Number.isNaN(connectorLoss({ ...base, tilt: (30 * Math.PI) / 180 }).total));
  assert.ok(Number.isFinite(connectorLoss({ ...base, gap: 5 * um }).total));
});

test("amplifierSummary: unpumped weak signal sees the small-signal absorption Γσ_aN L (Giles & Desurvire 1991)", () => {
  const r = amplifierSummary({
    length: 10, pumpPower: 0, signalDbm: -60, N: 1e24, coreRadius: 2.2 * um, overlapPump: 0.8, overlapSignal: 0.8,
    pumpLambda: 980e-9, signalLambda: 1550e-9, sigmaAPump: 1.7e-25, sigmaEPump: 0, sigmaASignal: 2.2e-25, sigmaESignal: 3.0e-25, tau: 10.2e-3,
  });
  assertRel(r.gainDb, -K * 0.8 * 2.2e-25 * 1e24 * 10, 1e-4, "gain");
  assertRel(r.alphaSignalDbPerM, K * 0.8 * 2.2e-25 * 1e24, 1e-12, "alpha");
});
