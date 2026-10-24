import test from "node:test";
import assert from "node:assert/strict";

import {
  LOW_GAIN_BANDWIDTH_FACTOR, detunedMismatch, gainBandwidth, gaussianMixingPower, idlerPower, idlerWavelength,
  mixingEfficiency, parametricGain, sumFrequencyWavelength,
} from "../src/physics/wave-optics/three-wave";
import { parametricGainCoefficient } from "../src/physics/wave-optics/optical-parametric-oscillator";
import { sfgCoefficient } from "../src/physics/imaging/second-harmonic-generation";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("SFG 1064 + 1550 nm: P₃ = 9.064 µW at n 1.8, d 2 pm/V, L 10 mm, w 30 µm (part 0 audit, PR #141)", () => {
  // Hand calculation: λ₃ = 630.91 nm, 8π²d²L²P₁P₂/(ε₀c n³ λ₃² πw²) = 1.579e-28/1.742e-23 = 9.06e-6 W.
  const lambda3 = sumFrequencyWavelength(1064e-9, 1550e-9);
  assertRel(lambda3, 630.9105e-9, 1e-6, "λ₃");
  const eta = mixingEfficiency({ lambdaOut: lambda3, length: 0.01, deff: 2e-12, n1: 1.8, n2: 1.8, nOut: 1.8, deltaK: 0 });
  assertRel(gaussianMixingPower(eta, 0.1, 0.05, 30e-6, 30e-6), 9.0637e-6, 1e-4, "P₃");
});

test("SFG page default (PPLN, Zelmon indices, d 14 pm/V, w 50 µm): η = 1.4431e-10 m²/W, P₃ = 91.87 µW", () => {
  // Hand calculation: 8π²(14e-12)²(0.01)² = 1.5476e-24; ε₀c·2.1555·2.1376·2.2027·(630.91e-9)² = 1.0724e-14.
  const eta = mixingEfficiency({ lambdaOut: 630.9105e-9, length: 0.01, deff: 14e-12, n1: 2.1555, n2: 2.1376, nOut: 2.2027, deltaK: 0 });
  assertRel(eta, 1.4431e-10, 1e-4, "η");
  assertRel(gaussianMixingPower(eta, 0.1, 0.05, 50e-6, 50e-6), 91.87e-6, 1e-3, "P₃");
});

test("same law as imaging sfgCoefficient (n₁ = n₂, Δk = −2πΔn/λ₃) and sinc² zero at ΔkL = 2π", () => {
  const n = 1.6;
  const deltaN = 0.01;
  const lambda3 = sumFrequencyWavelength(1040e-9, 800e-9);
  const ref = sfgCoefficient({ lambda1: 1040e-9, lambda2: 800e-9, length: 50e-6, deff: 1e-12, n, deltaN, w1: 2e-6, w2: 3e-6 });
  const eta = mixingEfficiency({ lambdaOut: lambda3, length: 50e-6, deff: 1e-12, n1: n, n2: n, nOut: n + deltaN, deltaK: ref.deltaK });
  assertRel(gaussianMixingPower(eta, 1, 1, 2e-6, 3e-6), ref.K, 1e-12, "K");
  const L = 0.01;
  assert.ok(mixingEfficiency({ lambdaOut: lambda3, length: L, deff: 1e-12, n1: n, n2: n, nOut: n, deltaK: (2 * Math.PI) / L }) < 1e-40, "zero");
  assert.ok(Number.isNaN(mixingEfficiency({ lambdaOut: lambda3, length: L, deff: 1e-12, n1: 0.5, n2: n, nOut: n, deltaK: 0 })), "n < 1");
});

test("DFG 1064 − 1550 nm: λ_i 3393.42 nm, P_i = 18.92 µW at n 2.2, d 14 pm/V, L 20 mm, w 40 µm (part 0 audit)", () => {
  const lambdaI = idlerWavelength(1064e-9, 1550e-9);
  assertRel(lambdaI, 3393.416e-9, 1e-6, "λ_i");
  const eta = mixingEfficiency({ lambdaOut: lambdaI, length: 0.02, deff: 14e-12, n1: 2.2, n2: 2.2, nOut: 2.2, deltaK: 0 });
  assertRel(gaussianMixingPower(eta, 0.5, 0.01, 40e-6, 40e-6), 18.92e-6, 1e-3, "P_i");
  assert.ok(Number.isNaN(idlerWavelength(1550e-9, 1064e-9)), "signal shorter than pump");
});

test("OPA gain: cosh²(ΓL) at Δk = 0 (Boyd §2.8), 1 + Γ²L² at |Δk| = 2Γ, oscillating beyond", () => {
  assertRel(parametricGain(300, 0, 0.02), Math.cosh(6) ** 2, 1e-12, "cosh²");
  assertRel(parametricGain(300, 600, 0.02), 1 + 36, 1e-12, "g = 0");
  const g = Math.sqrt(1000 ** 2 / 4 - 300 ** 2);
  assertRel(parametricGain(300, 1000, 0.02), 1 + (300 / g) ** 2 * Math.sin(g * 0.02) ** 2, 1e-12, "sin");
  assert.equal(parametricGain(0, 0, 0.02), 1);
  assert.equal(parametricGain(1e5, 0, 1), Infinity, "overflow");
  assert.ok(Number.isNaN(parametricGain(-1, 0, 0.02)));
});

test("low-gain OPA idler equals the DFG law: (λ_s/λ_i)(G − 1)I_s = η I_p I_s", () => {
  const p = { lambdaPump: 1064e-9, lambdaSignal: 1550e-9, dEff: 14e-12, nPump: 2.1555, nSignal: 2.1376, nIdler: 2.0814 };
  const Ip = 1e6; // ΓL = 0.0068: the next-order term is (ΓL)²/3 ≈ 1.5e-5
  const Is = 1e6;
  const L = 0.02;
  const dk = 150;
  const gamma = parametricGainCoefficient(p, Ip);
  const lambdaI = idlerWavelength(p.lambdaPump, p.lambdaSignal);
  const opa = idlerPower(parametricGain(gamma, dk, L), Is, p.lambdaSignal, lambdaI);
  const dfg = mixingEfficiency({ lambdaOut: lambdaI, length: L, deff: p.dEff, n1: p.nPump, n2: p.nSignal, nOut: p.nIdler, deltaK: dk }) * Ip * Is;
  assertRel(opa, dfg, 1e-4, "low gain");
});

test("OPA idler when the signal is the longer wave (Manley–Rowe): 1064 → 3000 nm, G 1047.15, P_s 1 W → 1903.5 W", () => {
  // λ_i = 1648.76 nm; λ_s/λ_i = λ_s/λ_p − 1 = 1936/1064 = 1.819549, × (G − 1) = 1046.15 → 1903.52 W.
  const lambdaI = idlerWavelength(1064e-9, 3000e-9);
  assertRel(lambdaI, 1648.76e-9, 1e-5, "λ_i");
  assertRel(idlerPower(1047.15, 1, 3000e-9, lambdaI), (1936 / 1064) * 1046.15, 1e-12, "P_i");
  assertRel(idlerPower(1047.15, 1, 3000e-9, lambdaI), 1903.52, 1e-5, "P_i");
  assert.ok(Number.isNaN(idlerPower(1047.15, 1, 3000e-9, 0)));
});

test("OPA page default (PPLN, 50 kW, w 300 µm, 20 mm): Γ = 202.18 /m, G = 813.7 (29.10 dB)", () => {
  // Hand calculation: I₀ = 2P/(πw²) = 3.5368e11 W/m²; Γ² = 2ω_sω_i d²I₀/(n_pn_sn_i ε₀c³) = 4.0878e4 m⁻²;
  // G = cosh²(4.0436) = 813.7.
  const p = { lambdaPump: 1064e-9, lambdaSignal: 1550e-9, dEff: 14e-12, nPump: 2.1555, nSignal: 2.1376, nIdler: 2.0814 };
  const gamma = parametricGainCoefficient(p, (2 * 5e4) / (Math.PI * 300e-6 ** 2));
  assertRel(gamma, 202.18, 1e-4, "Γ");
  assertRel(parametricGain(gamma, 0, 0.02), 813.7, 1e-4, "G");
  // Part 0 audit, parametric-amplification: degenerate 1550 → 3100 nm, d 2 pm/V, n 2.2, I 6.25e9 W/m² → g = 2.696 /m.
  const degenerate = { lambdaPump: 1550e-9, lambdaSignal: 3100e-9, dEff: 2e-12, nPump: 2.2, nSignal: 2.2, nIdler: 2.2 };
  assertRel(parametricGainCoefficient(degenerate, 6.25e9), 2.696, 1e-3, "g");
});

test("gain bandwidth: 0.886/(|δ|L) at low gain, (2√ln2/π)√(Γ/L)/|δ| at high gain (Cerullo & De Silvestri 2003)", () => {
  const delta = 97.7e-12; // s/m, PPLN signal–idler GVM at 1550/3393 nm (Zelmon group indices)
  const L = 0.02;
  assertRel(LOW_GAIN_BANDWIDTH_FACTOR, 0.88589, 1e-5, "factor");
  assertRel(gainBandwidth(1e-3, L, delta), 0.88589 / (delta * L), 1e-5, "low gain");
  assertRel(gainBandwidth(1e-3, L, -delta), gainBandwidth(1e-3, L, delta), 1e-12, "sign of δ");
  const gamma = 300 / L; // ΓL = 300: next-order correction ≈ 0.1 %
  assertRel(gainBandwidth(gamma, L, delta), ((2 * Math.sqrt(Math.LN2)) / Math.PI) * Math.sqrt(gamma / L) / delta, 3e-3, "high gain");
  // Half maximum of G − 1 at the band edge, default OPA.
  const bw = gainBandwidth(202.18, L, delta);
  const edge = detunedMismatch(0, bw / 2, delta);
  assertRel(parametricGain(202.18, edge, L) - 1, (parametricGain(202.18, 0, L) - 1) / 2, 1e-9, "half max");
  assertRel(bw, 616.16e9, 1e-4, "default bandwidth");
  assert.equal(gainBandwidth(202.18, L, 0), Infinity, "δ = 0");
});
