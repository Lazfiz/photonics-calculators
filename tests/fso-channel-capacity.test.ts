import test from "node:test";
import assert from "node:assert/strict";

import {
  binaryEntropy, bitErrorRate, minimumHardDecisionOverhead, mpskGrayBer, netRate, phaseTail, requiredSnrDb,
  shannonCapacity, shannonEbN0,
} from "../src/physics/free-space-comms/channel-capacity";
import { requiredEbN0dB } from "../src/physics/free-space-comms/bpsk-qpsk";
import { erf, normalCdf, qFunction } from "../src/physics/math";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

test("Shannon capacity: C(1 GHz, 20 dB) = log₂(101) Gb/s = 6.658 Gb/s; Eb/N0 limit −1.59 dB", () => {
  close(shannonCapacity(1e9, 100), 6.658211482751795e9, 1e-14);
  assert.equal(shannonCapacity(1e9, 0), 0);
  assert.ok(Number.isNaN(shannonCapacity(0, 1)));
  close(10 * Math.log10(shannonEbN0(0)), -1.5917, 1e-4);
  close(shannonEbN0(2), 1.5, 1e-14); // (2² − 1)/2
});

/** P(ψ < θ ≤ π) from the phase pdf of a unit phasor in complex Gaussian noise (Proakis & Salehi 2008, §4.3), Simpson. */
function tailFromPdf(psi: number, g: number): number {
  const pdf = (t: number) => {
    const ct = Math.cos(t);
    return Math.exp(-g) / (2 * Math.PI) + 0.5 * Math.sqrt(g / Math.PI) * ct * Math.exp(-g * Math.sin(t) ** 2) * (1 + erf(Math.sqrt(g) * ct));
  };
  const n = 4000;
  const h = (Math.PI - psi) / n;
  let s = pdf(psi) + pdf(Math.PI);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * pdf(psi + i * h);
  return (s * h) / 3;
}

test("Craig's phase tail matches the integrated phase pdf; M-PSK reduces to the BPSK and QPSK closed forms", () => {
  for (const g of [0.1, 1, 10]) {
    for (const psi of [0, Math.PI / 8, (3 * Math.PI) / 8, (7 * Math.PI) / 8]) close(phaseTail(psi, g), tailFromPdf(psi, g), 1e-10, `γ=${g} ψ=${psi}`);
  }
  for (const g of [0.5, 3, 10, 30]) {
    close(mpskGrayBer(2, g), qFunction(Math.sqrt(2 * g)), 1e-12, `BPSK γ=${g}`);
    close(mpskGrayBer(4, g), qFunction(Math.sqrt(g)), 1e-12, `QPSK γ=${g}`);
  }
  // QPSK symbol error 2·P(θ > π/4) = 2Q(√γ) − Q(√γ)² (exact).
  const qq = qFunction(Math.sqrt(3));
  close(2 * phaseTail(Math.PI / 4, 3), 2 * qq - qq * qq, 1e-12);
  // Gray 8-PSK tends to P_s/3 with P_s ≈ 2Q(√(2γ) sin(π/8)) at high SNR; at γ = 0 every bit is a coin flip.
  close(mpskGrayBer(8, 30), (2 * qFunction(Math.sqrt(60) * Math.sin(Math.PI / 8))) / 3, 1e-8);
  close(bitErrorRate("8PSK", 0), 0.5, 1e-12);
});

/** Gray 16-QAM BER from the 4-PAM decision regions of each rail (levels ±1, ±3, labels 00 01 11 10), by Φ differences. */
function qam16Reference(esN0: number): number {
  const sigma = Math.sqrt(10 / (2 * esN0)); // E_s = 10 for levels ±1, ±3 on both rails; σ² = N₀/2
  const levels = [-3, -1, 1, 3];
  const labels = [0b00, 0b01, 0b11, 0b10];
  const edges = [-Infinity, -2, 0, 2, Infinity];
  let errors = 0;
  for (let s = 0; s < 4; s++) {
    for (let r = 0; r < 4; r++) {
      const p = normalCdf((edges[r + 1] - levels[s]) / sigma) - normalCdf((edges[r] - levels[s]) / sigma);
      const x = labels[s] ^ labels[r];
      errors += p * ((x & 1) + (x >> 1));
    }
  }
  return errors / (4 * 2); // per rail: 4 equiprobable levels, 2 bits each; both rails alike
}

test("16-QAM: Cho & Yoon closed form equals the 4-PAM decision-region sum", () => {
  for (const g of [1, 10, 31.6, 100]) close(bitErrorRate("16QAM", g), qam16Reference(g), 1e-10, `γ=${g}`);
});

test("required SNR at BER 3.8e-3: BPSK agrees with the bpsk-qpsk module, QPSK 8.528 dB, 16-QAM 15.19 dB", () => {
  close(requiredSnrDb("BPSK", 3.8e-3), requiredEbN0dB(3.8e-3), 1e-9);
  // Q(√γ) = 3.8e-3 → √γ = 2.6696 → 8.528 dB; 16-QAM is within 0.01 dB of 0.75 Q(√(γ/5)) = 3.8e-3 → 15.19 dB.
  close(requiredSnrDb("QPSK", 3.8e-3), 8.528, 2e-4);
  close(requiredSnrDb("16QAM", 3.8e-3), 15.19, 1e-3);
  assert.equal(requiredSnrDb("OOK", 3.8e-3), requiredSnrDb("QPSK", 3.8e-3));
  // 8-PSK: the high-SNR form (2/3)Q(√(2γ) sin π/8) = 3.8e-3 gives 13.396 dB; Craig's exact sum agrees to 1e-4 dB.
  close(requiredSnrDb("8PSK", 3.8e-3), 13.396, 1e-4);
  // BPSK already meets 0.45 at −20 dB (BER 0.444): outside the bracket, NaN rather than the edge.
  assert.ok(Number.isNaN(requiredSnrDb("BPSK", 0.45)));
  assert.ok(Number.isNaN(requiredSnrDb("QPSK", 0.6)));
  assert.ok(requiredSnrDb("16QAM", 1e-12) > requiredSnrDb("16QAM", 1e-9));
});

test("net rate is gated on the SNR: QPSK at 0 dB carries nothing (was 1.87 Gb/s above the 1 Gb/s capacity)", () => {
  assert.equal(netRate("QPSK", 1e9, 1, 0.07, 3.8e-3), 0);
  close(netRate("QPSK", 1e9, 100, 0.07, 3.8e-3), 2e9 / 1.07, 1e-14);
  // At its threshold every modulation stays below capacity with 7 % overhead.
  for (const m of ["OOK", "BPSK", "QPSK", "8PSK", "16QAM"] as const) {
    const snr = 10 ** (requiredSnrDb(m, 3.8e-3) / 10) * (1 + 1e-9);
    assert.ok(netRate(m, 1e9, snr, 0.07, 3.8e-3) < shannonCapacity(1e9, snr), m);
  }
});

test("hard-decision overhead bound 1/(1 − H₂(p)) − 1: 3.74 % at p = 3.8e-3", () => {
  // H₂(3.8e-3) = 0.0360230 bits.
  close(binaryEntropy(3.8e-3), 0.036023, 1e-5);
  close(minimumHardDecisionOverhead(3.8e-3), 0.037369, 1e-4);
  assert.equal(binaryEntropy(0.5), 1);
  assert.ok(Number.isNaN(minimumHardDecisionOverhead(0.5)));
});
