import test from "node:test";
import assert from "node:assert/strict";

import {
  bpskBer, qpskSer, requiredEbN0dB, requiredRxPower, shotNoiseN0,
} from "../src/physics/free-space-comms/bpsk-qpsk";

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

// LO-shot-noise-limited coherent receiver: Ip, Lau, Barros & Kahn, Opt. Express 16, 753 (2008), Table 1 (SNR per
// symbol = detected photons per symbol, heterodyne or two-quadrature; ×2 for single-quadrature homodyne).
// hν(1550 nm) = 1.2815780e-19 J = −158.92 dBm/Hz. BER 1e-9: Q⁻¹ = 5.997807015, E_b/N₀ = Q⁻¹²/2 = 17.987,
// the textbook "18 photons per bit" (heterodyne PSK) and 9 (homodyne PSK); 17.987·hν·1 Gb/s = 2.3052 nW = −56.373 dBm.
test("BPSK: shot-noise-limited coherent receive power", () => {
  assertRel(shotNoiseN0(1550e-9, 1), 1.2815779723541474e-19, 1e-12, "N0 = hν");
  assertRel(shotNoiseN0(1550e-9, 0.5), 2.5631559447082948e-19, 1e-12, "N0 = hν/η");
  assertRel(shotNoiseN0(1550e-9, 1, "homodyne"), 6.407889861770737e-20, 1e-12, "N0 = hν/2");
  const ebN0dB = requiredEbN0dB(1e-9);
  assertRel(10 ** (ebN0dB / 10), 17.9868444946377, 1e-8, "photons per bit at 1e-9");
  assertRel(requiredRxPower(ebN0dB, 1e9, 1550e-9, 1), 2.3051543696487145e-9, 1e-8, "heterodyne P_req");
  assertRel(requiredRxPower(ebN0dB, 1e9, 1550e-9, 1, "homodyne"), 2.3051543696487145e-9 / 2, 1e-8, "homodyne P_req");
  assert.ok(Number.isNaN(shotNoiseN0(1550e-9, 0)));
  assert.ok(Number.isNaN(shotNoiseN0(1550e-9, 1.1)));
  assert.ok(Number.isNaN(requiredRxPower(10, 0, 1550e-9, 1)));
});
