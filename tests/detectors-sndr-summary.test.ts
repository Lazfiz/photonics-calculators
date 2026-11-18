import assert from "node:assert/strict";
import test from "node:test";

import { sndrSummary } from "../src/physics/detectors/sndr";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// IEEE Std 1241-2010, doi:10.1109/IEEESTD.2011.5692956: 1/SINAD = 1/SQNR + (N + D)/S, SQNR = 1.5·4^bits.
test("sndrSummary: hand-worked", () => {
  // S = 1, N = 1e-4, D = 1e-5, 12 bit: SNR 40 dB, SDR 50 dB, SINAD = 10·log10(1/1.1e-4) = 39.586073 dB, SQNR = 10·log10(1.5·4^12) = 74.008112 dB
  const r = sndrSummary({ signalPower: 1, noisePower: 1e-4, distortionPower: 1e-5, bits: 12 });
  assertRel(r.snr, 40, 1e-12, "snr");
  assertRel(r.sdr, 50, 1e-12, "sdr");
  assertRel(r.thd, -50, 1e-12, "thd");
  assertRel(r.sinad, 39.586073148, 1e-8, "sinad");
  assertRel(r.sqnr, 74.00811155, 1e-8, "sqnr");
  assertRel(r.sinadQuantized, 39.584504585, 1e-8, "sinadQ");
  assertRel(r.enob, 6.28236264, 1e-7, "enob");
});

test("sndrSummary: bits are rounded; zero noise and distortion give infinite ratios", () => {
  assert.equal(sndrSummary({ signalPower: 1, noisePower: 1e-4, distortionPower: 1e-5, bits: 11.6 }).sqnr, sndrSummary({ signalPower: 1, noisePower: 0, distortionPower: 0, bits: 12 }).sqnr);
  const z = sndrSummary({ signalPower: 1, noisePower: 0, distortionPower: 0, bits: 12 });
  assert.equal(z.snr, Infinity);
  assert.equal(z.sinad, Infinity);
  assert.equal(z.sdr, Infinity);
  assert.equal(z.thd, -Infinity);
  assertRel(z.sinadQuantized, z.sqnr, 1e-12, "quantisation only");
});
