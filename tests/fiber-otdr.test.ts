import test from "node:test";
import assert from "node:assert/strict";

import {
  backscatterRatio, captureFraction, dbPerKmToPerM, dynamicRangeDb, fresnelReflectance, noisePower, otdrTrace,
  reflectivePeakDb, twoPointResolution,
} from "../src/physics/fiber-optics/otdr";
import { linkBudget } from "../src/physics/fiber-optics/link-budget";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);
const close = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg}: ${actual} vs ${expected}`);

// SMF-28-like fibre at 1550 nm: MFD 10.4 µm, phase index 1.447, group index 1.4682, Rayleigh A = 0.85 dB·km⁻¹·µm⁴.
const lambda = 1550e-9, w = 5.2e-6, n = 1.447, ng = 1.4682;
const alphaS = dbPerKmToPerM(0.85 / 1.55 ** 4);

test("Two-point resolution cτ/(2n_g): 100 ns at n_g 1.4682 is 10.21 m", () => {
  // 299792458 × 1e-7 / 2.9364 = 10.20952 m (by hand).
  assertRel(twoPointResolution(100e-9, ng), 10.20952, 1e-6, "Δz");
  assert.ok(Number.isNaN(twoPointResolution(0, ng)));
  assert.ok(Number.isNaN(twoPointResolution(1e-9, 0.9)));
});

test("Brinkmeyer capture fraction (3/2)(λ/2πnw)² agrees with the dipole-pattern overlap integral", () => {
  // Hand value: 2π·1.447·5.2 = 47.27709; 1.55/47.27709 = 0.0327855; ² × 1.5 = 1.612333e-3 (−27.93 dB).
  const S = captureFraction(lambda, w, n);
  assertRel(S, 1.612333e-3, 1e-5, "S");
  // Independent: S = (3/8π)(λ/n)² ∫ I_norm² dA with I_norm = (2/πw²)e^(−2r²/w²), integrated numerically (Simpson).
  const N = 4000, rMax = 6 * w, hStep = rMax / N;
  let sum = 0;
  for (let i = 0; i <= N; i++) {
    const r = i * hStep;
    const I = (2 / (Math.PI * w * w)) * Math.exp((-2 * r * r) / (w * w));
    sum += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * I * I * 2 * Math.PI * r;
  }
  const overlap = (sum * hStep) / 3;
  assertRel(S, (3 / (8 * Math.PI)) * (lambda / n) ** 2 * overlap, 1e-9, "overlap integral");
  assert.ok(Number.isNaN(captureFraction(lambda, 0, n)));
});

test("Barnoski–Jensen backscatter coefficient matches the SMF-28 data-sheet value at 1550 nm", () => {
  // η = S α_s v_g τ/2: 1.612333e-3 × 3.39083e-5 m⁻¹ × 0.1020952 m (1 ns) = 5.5816e-9 → −82.53 dB.
  const eta1 = backscatterRatio(captureFraction(lambda, w, n), alphaS, 1e-9, ng);
  assertRel(eta1, 5.5816e-9, 1e-4, "η(1 ns)");
  // Corning SMF-28 Ultra product information PI 1424 (2024): Rayleigh backscatter −82 dB for a 1 ns pulse at 1550 nm.
  close(10 * Math.log10(eta1), -82, 1, "data sheet");
  // The coefficient is linear in pulse width: +10 dB per decade.
  close(10 * Math.log10(backscatterRatio(captureFraction(lambda, w, n), alphaS, 100e-9, ng) / eta1), 20, 1e-12, "τ scaling");
  // Long pulse: the loss across the lit length Δz gives sinh(αΔz)/(αΔz). 100 µs, 0.19 dB/km: Δz = 10209.52 m,
  // α = 4.3749e-5 /m, x = 0.44666; 1 + x²/6 + x⁴/120 + x⁶/5040 = 1.033586 → +0.1435 dB (by hand).
  const S = captureFraction(lambda, w, n), a = dbPerKmToPerM(0.19);
  close(10 * Math.log10(backscatterRatio(S, alphaS, 100e-6, ng, a) / backscatterRatio(S, alphaS, 100e-6, ng)), 0.1435, 1e-3, "sinh");
  assert.equal(backscatterRatio(S, alphaS, 1e-9, ng, 0), eta1);
});

test("Dynamic range: 7.5 dB per decade of pulse width, 1.5 dB per 4× averaging, 20.53 dB at the defaults", () => {
  const S = captureFraction(lambda, w, n);
  const dr = (tau: number, avg: number) =>
    dynamicRangeDb(0.1 * backscatterRatio(S, alphaS, tau, ng), noisePower(0.5e-12, tau, avg));
  // P_bs ∝ τ and P_n ∝ τ^(−1/2): one-way DR = 5 log₁₀(P_bs/P_n) grows 7.5 log₁₀(τ₂/τ₁).
  close(dr(20e-6, 65536) - dr(100e-9, 65536), 7.5 * Math.log10(200), 1e-9, "pulse scaling");
  // Averaging N traces lowers the noise by √N: 2.5 log₁₀ 4 = 1.505 dB (the usual "1.5 dB per 4× averages").
  close(dr(100e-9, 4 * 65536) - dr(100e-9, 65536), 1.50515, 1e-5, "averaging");
  // Defaults by hand: P_bs = 20 dBm − 62.532 dB = −42.532 dBm; P_n = 0.5 pW·√(5 MHz)/256 = 4.367 pW = −83.598 dBm;
  // DR = (−42.532 + 83.598)/2 = 20.533 dB.
  close(dr(100e-9, 65536), 20.533, 2e-3, "defaults");
  assert.ok(Number.isNaN(dynamicRangeDb(0, 1e-12)));
});

test("Reflective events: Fresnel end face −14.77 dB and its peak 5 log₁₀(1 + R/η) above the backscatter", () => {
  // ((1.447 − 1)/(1.447 + 1))² = (0.447/2.447)² = 0.0333693.
  const R = fresnelReflectance(n, 1);
  assertRel(R, 0.0333693, 1e-5, "Fresnel");
  // η(100 ns) = −62.532 dB: R/η = 10^((−14.767 + 62.532)/10) = 10^4.7765 → 5 log₁₀(1 + 5.977e4) = 23.883 dB.
  const eta = backscatterRatio(captureFraction(lambda, w, n), alphaS, 100e-9, ng);
  close(reflectivePeakDb(R, eta), 23.883, 2e-3, "peak");
  assert.equal(reflectivePeakDb(0, eta), 0);
});

test("Model trace: slope α, cumulative splice steps, end peak and noise floor", () => {
  const L = 50e3, dz = twoPointResolution(100e-9, ng);
  const eta = 1e-6;
  const splices = [1, 2, 3].map((i) => ({ z: (i * L) / 4, lossDb: 0.1 }));
  const tr = otdrTrace({ length: L, lossDbPerKm: 0.2, splices, launchReflectance: 0, endReflectance: 1e-2,
    eta, noiseRatio: 1e-12, resolution: dz, samples: 400 });
  // First sample at or beyond z, with its own position.
  const at = (z: number) => {
    const i = tr.z.findIndex((x) => x >= z);
    return { z: tr.z[i], level: tr.level[i] };
  };
  // Before the first splice: −α z one-way (noise 1e-12 adds < 1e-9 dB).
  const p1 = at(10e3);
  close(p1.level, -0.2 * (p1.z / 1e3), 1e-6, "slope");
  // After all three splices: −0.2·45 − 0.3 = −9.3 dB (the losses accumulate, they don't recover).
  const p2 = at(45e3);
  close(p2.level, -0.2 * (p2.z / 1e3) - 0.3, 1e-6, "cumulative splices");
  // End peak: −0.2·50 − 0.3 + 5 log₁₀(1e-2/1e-6) = −10.3 + 20 = 9.7 dB (to 5 log₁₀ of the 1 + η/R term).
  close(at(L + dz / 2).level, -10.3 + 5 * Math.log10(1 + 1e4), 1e-6, "end peak");
  // Beyond the end only noise remains.
  assert.equal(tr.level[tr.level.length - 1], tr.noiseDb);
  close(tr.noiseDb, -60, 1e-12, "noise level");
  assert.ok(tr.z.length < 450, `sample cap: ${tr.z.length}`);
});

test("Link budget: margin is set aside, not subtracted from the received power", () => {
  // Agrawal FOCS 4th ed. Ch. 5 (power budget): P_tx = P_rx + C_L + M_s. 0 dBm, 50 km × 0.2, 10 × 0.1, 2 × 0.5 → C_L = 12 dB.
  const b = linkBudget({ txPowerDbm: 0, rxSensitivityDbm: -28, lengthKm: 50, fiberLossDbPerKm: 0.2, splices: 10,
    spliceLossDb: 0.1, connectors: 2, connectorLossDb: 0.5, marginDb: 3 });
  assert.equal(b.channelLossDb, 12);
  assert.equal(b.receivedPowerDbm, -12); // the old page showed −15 dBm
  assert.equal(b.availableMarginDb, 16);
  assert.equal(b.excessMarginDb, 13);
  // (0 + 28 − 3 − 1 − 1)/0.2 = 115 km.
  close(b.maxLengthKm, 115, 1e-12, "reach");
  const lossless = linkBudget({ txPowerDbm: 0, rxSensitivityDbm: -28, lengthKm: 50, fiberLossDbPerKm: 0, splices: 0,
    spliceLossDb: 0, connectors: 0, connectorLossDb: 0, marginDb: 3 });
  assert.equal(lossless.maxLengthKm, Infinity);
  // Tx below sensitivity: no length closes the link (NaN, not a 0 km reach).
  const weak = { txPowerDbm: -30, rxSensitivityDbm: -28, lengthKm: 1, fiberLossDbPerKm: 0.2, splices: 0,
    spliceLossDb: 0, connectors: 0, connectorLossDb: 0, marginDb: 0 };
  assert.ok(Number.isNaN(linkBudget(weak).maxLengthKm));
  // 0 km: only the Tx power reaches the receiver.
  assert.equal(linkBudget({ ...weak, lengthKm: 0 }).receivedPowerDbm, -30);
  assert.ok(Number.isNaN(linkBudget({ ...weak, lengthKm: -1 }).receivedPowerDbm));
});
