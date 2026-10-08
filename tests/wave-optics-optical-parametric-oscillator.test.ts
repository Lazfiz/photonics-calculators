import test from "node:test";
import assert from "node:assert/strict";

import { c, epsilon_0 } from "../src/physics/constants";
import {
  idlerWavelength, parametricGainCoefficient, phaseMismatch, sroThresholdGainLength, sroThresholdIntensity,
  walkOffApertureLength,
} from "../src/physics/wave-optics/optical-parametric-oscillator";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// The page defaults: 532 nm pump, 800 nm signal, d_eff = 2 pm/V, n = 1.65 / 1.53 / 1.53, 5 W in w = 50 µm.
const p = { lambdaPump: 532e-9, lambdaSignal: 800e-9, dEff: 2e-12, nPump: 1.65, nSignal: 1.53, nIdler: 1.53 };
const I = 5 / (Math.PI * 50e-6 ** 2); // 6.366198e8 W/m²

test("idler wavelength and gain coefficient", () => {
  // 532 · 800 / (800 − 532) = 1588.0597 nm.
  assertRel(idlerWavelength(532e-9, 800e-9), 1588.0597e-9, 1e-7, "λ_i");
  assertRel(idlerWavelength(532e-9, 1064e-9), 1064e-9, 1e-14, "degenerate");
  // Wavelength form used for PPLN OPOs, Γ² = 8π² d² I/(n_p n_s n_i ε₀ c λ_s λ_i)
  // (L. E. Myers et al., J. Opt. Soc. Am. B 12, 2102 (1995)), equal to Boyd's 2ω_sω_i d² I/(n³ε₀c³).
  const lambdaI = 1588.0597e-9;
  const g2 = (8 * Math.PI ** 2 * p.dEff ** 2 * I) / (p.nPump * p.nSignal * p.nIdler * epsilon_0 * c * 800e-9 * lambdaI);
  assertRel(parametricGainCoefficient(p, I) ** 2, g2, 1e-6, "g² vs wavelength form");
  // By hand: 8π² · 4e-24 · 6.366198e8 / (3.862485 · ε₀ · c · 800 nm · 1588.06 nm) = 15.436 m⁻² → g = 3.9289 m⁻¹.
  assertRel(parametricGainCoefficient(p, I), 3.9289, 1e-4, "g");
});

test("SRO threshold: cosh²(gL)(1 − α) = 1", () => {
  // α = 3 %: arccosh(1/√0.97) = ln(1.0153462 + 0.1758630) = 0.174969.
  assertRel(sroThresholdGainLength(0.03), 0.174969, 1e-5, "g_th L at 3 %");
  for (const a of [0.01, 0.1, 0.5, 0.9]) {
    assertRel(Math.cosh(sroThresholdGainLength(a)) ** 2 * (1 - a), 1, 1e-13, `round trip at α = ${a}`);
  }
  // Small loss: (g_th L)² → α (Boyd §2.9).
  assertRel(sroThresholdGainLength(1e-6) ** 2, 1e-6, 1e-5, "small-α limit");
  // Defaults: L_eff = min(20 mm, √π · 50 µm / 0.5°) = 10.1555 mm; I_th = (0.174969/L_eff)²/(g²/I)
  // = 1.2242e10 W/m², so P_th = I_th · π w² = 96.15 W. (The page used to show ~1e-15 W: it lacked c².)
  const la = walkOffApertureLength(50e-6, (0.5 * Math.PI) / 180);
  assertRel(la, 10.1555e-3, 1e-4, "aperture length");
  const Ith = sroThresholdIntensity(p, la, 0.03);
  assertRel(Ith * Math.PI * 50e-6 ** 2, 96.15, 1e-3, "P_th");
  // At threshold intensity, g L_eff equals g_th L.
  assertRel(parametricGainCoefficient(p, Ith) * la, 0.174969, 1e-5, "g(I_th) L");
});

test("phase mismatch and QPM period (hand calculation)", () => {
  // 2π (1.65/532 nm − 1.53/800 nm − 1.53/1588.06 nm) = 2π · 2.255643e5 m⁻¹ → Λ = 4.4333 µm.
  const dk = phaseMismatch(p);
  assertRel(dk, 2 * Math.PI * 2.255643e5, 1e-5, "Δk");
  assertRel((2 * Math.PI) / dk, 4.4333e-6, 1e-4, "Λ");
  // Degenerate with equal indices: exactly phase matched.
  assert.ok(Math.abs(phaseMismatch({ ...p, lambdaSignal: 1064e-9, nPump: 1.5, nSignal: 1.5, nIdler: 1.5 })) < 1e-6);
});

test("OPO domain edges", () => {
  assert.ok(Number.isNaN(idlerWavelength(532e-9, 532e-9))); // λ_s must exceed λ_p
  assert.ok(Number.isNaN(parametricGainCoefficient({ ...p, lambdaSignal: 500e-9 }, I)));
  assert.ok(Number.isNaN(parametricGainCoefficient(p, -1)));
  assert.equal(parametricGainCoefficient(p, 0), 0);
  assert.ok(Number.isNaN(sroThresholdGainLength(0)));
  assert.ok(Number.isNaN(sroThresholdGainLength(1)));
  assert.equal(walkOffApertureLength(50e-6, 0), Infinity);
  assert.ok(Number.isNaN(sroThresholdIntensity(p, 0, 0.03)));
});
