import test from "node:test";
import assert from "node:assert/strict";

import { bpskBer, qpskSer, requiredEbN0dB } from "../src/physics/free-space-comms/bpsk-qpsk";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// BPSK P_b = Q(√(2E_b/N₀)) (Proakis & Salehi, Digital Communications, 5th ed.);
// textbook sensitivities: 9.6 dB at 1e-5, 10.5 dB at 1e-6.
test("BPSK/QPSK: bit and symbol error rates", () => {
  assertRel(bpskBer(10), 3.872108215522038e-6, 1e-12, "BPSK at 10 dB"); // ½ erfc(√10), CPython
  const pb = bpskBer(10);
  assertRel(qpskSer(10), 2 * pb - pb * pb, 1e-15, "QPSK SER");
  assert.ok(Math.abs(requiredEbN0dB(1e-5) - 9.587858346847609) < 1e-9);
  assert.ok(Math.abs(requiredEbN0dB(1e-6) - 10.529831699571448) < 1e-9);
  assert.equal(bpskBer(0), 0.5);
  assert.ok(Number.isNaN(bpskBer(-1)));
});
