import test from "node:test";
import assert from "node:assert/strict";

import { c, epsilon_0 } from "../src/physics/constants";
import { BBO_THETA } from "../src/physics/materials/nonlinear-crystals";
import { refractiveIndex } from "../src/physics/materials/sellmeier";
import { BBO_TAMOSAUSKAS } from "../src/physics/materials/uniaxial-data";
import {
  bboTypeICut, idlerWavelength, parametricGainCoefficient, phaseMismatch, qpmPeriod, sroThresholdGainLength,
  sroThresholdIntensity, threeWaveMismatch, walkOffApertureLength,
} from "../src/physics/wave-optics/optical-parametric-oscillator";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// An example process: 532 nm pump, 800 nm signal, d_eff = 2 pm/V, n = 1.65 / 1.53 / 1.53, 5 W in w = 50 µm.
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

const deg = Math.PI / 180;

test("Tamošauskas 2018 BBO fits against the EKSMA sheet indices", () => {
  // EKSMA BBO page: n_o, n_e = 1.6551, 1.5426 at 1064 nm and 1.6750, 1.5555 at 532 nm.
  const { o, e } = BBO_TAMOSAUSKAS;
  for (const [l, no, ne] of [[1064e-9, 1.6551, 1.5426], [532e-9, 1.675, 1.5555]]) {
    assert.ok(Math.abs(refractiveIndex(o, l) - no) < 1e-3, `n_o(${l})`);
    assert.ok(Math.abs(refractiveIndex(e, l) - ne) < 1e-3, `n_e(${l})`);
  }
  // Hand evaluation of n_o² − 1 = Σ Bλ²/(λ² − C) at 1.064 µm: 0.906054 + 0.845571 − 0.014716 → 1.654363.
  assert.ok(Math.abs(refractiveIndex(o, 1064e-9) - 1.654363) < 2e-6);
});

test("BBO type I cut: degenerate 532 → 1064 nm is the 1064 nm SHG cut", () => {
  const cut = bboTypeICut(532e-9, 1064e-9);
  // θ from the EKSMA indices (nonlinear-crystals.ts) is 22.9°; this set gives 22.83°.
  assert.ok(Math.abs(cut.theta - BBO_THETA) < 0.15 * deg, `θ ${cut.theta / deg}`);
  // EKSMA: walk-off 55.9 mrad (type I SHG of 1064 nm).
  assertRel(cut.walkOff, 55.9e-3, 0.01, "ρ");
  assert.ok(Math.abs(cut.nSignal - cut.nIdler) < 1e-12 && Math.abs(cut.nPump - cut.nSignal) < 1e-12, "n_e(θ, 532) = n_o(1064)");
});

test("BBO type I cut at the page defaults (532 → 800 nm)", () => {
  const cut = bboTypeICut(532e-9, 800e-9);
  assert.ok(Math.abs(cut.theta / deg - 22.1202) < 1e-3, `θ ${cut.theta / deg}`);
  assert.ok(Math.abs(cut.nSignal - 1.6604) < 5e-6 && Math.abs(cut.nIdler - 1.64576) < 5e-6, "n_s, n_i");
  assert.ok(Math.abs(cut.walkOff / deg - 3.114) < 5e-4, `ρ ${cut.walkOff / deg}`);
  // d₃₁ sinθ + d₂₂ cosθ = 0.08 · 0.37650 + 2.2 · 0.92642 = 2.0682 pm/V.
  assert.ok(Math.abs(cut.dEff - 2.0682e-12) < 1e-16, `d_eff ${cut.dEff}`);
  // The page defaults (n 1.6555 / 1.6604 / 1.64576) leave |Δk| L < π over 20 mm.
  const dk = phaseMismatch({ lambdaPump: 532e-9, lambdaSignal: 800e-9, dEff: cut.dEff, nPump: 1.6555, nSignal: 1.6604, nIdler: 1.64576 });
  assert.ok(Math.abs(dk) * 0.02 < Math.PI, `Δk ${dk}`);
  assert.ok(Math.abs(phaseMismatch({ ...p, nPump: cut.nPump, nSignal: cut.nSignal, nIdler: cut.nIdler })) < 1e-6, "exact cut: Δk = 0");
});

test("BBO type I cut outside the fits", () => {
  // 1064 → 1300 nm puts the idler at 5.86 µm, past the 5.2 µm fit.
  assert.ok(Number.isNaN(bboTypeICut(1064e-9, 1300e-9).theta));
  assert.ok(Number.isNaN(bboTypeICut(800e-9, 532e-9).dEff));
});

test("three-wave mismatch and first-order QPM period", () => {
  // SHG of 1064 nm (ω + ω → 2ω), illustrative extraordinary indices 2.1560 and 2.2340: by hand
  // Δk = 2π(2n_2ω/λ − 2n_ω/λ) = 4π(0.078)/λ, so Λ = λ/(2(n_2ω − n_ω)) = 1064 nm / 0.156 = 6.8205 µm.
  const dk = threeWaveMismatch(2.156, 1064e-9, 2.156, 1064e-9, 2.234, 532e-9);
  assertRel(dk, (4 * Math.PI * 0.078) / 1064e-9, 1e-12, "Δk");
  assertRel(qpmPeriod(dk), 1064e-9 / 0.156, 1e-12, "Λ");
  // Same law as phaseMismatch with wave 3 = pump.
  const lambdaI = idlerWavelength(p.lambdaPump, p.lambdaSignal);
  assert.equal(threeWaveMismatch(p.nSignal, p.lambdaSignal, p.nIdler, lambdaI, p.nPump, p.lambdaPump), phaseMismatch(p));
  // Vacuum (n = 1) with energy conservation is phase matched: Λ → ∞ in the limit.
  assert.equal(qpmPeriod(0), Infinity, "Δk = 0");
  assert.ok(Math.abs(threeWaveMismatch(1, 1064e-9, 1, 1550e-9, 1, 1 / (1 / 1064e-9 + 1 / 1550e-9))) < 1e-3, "vacuum SFG");
  assert.ok(Number.isNaN(threeWaveMismatch(1, 0, 1, 1550e-9, 1, 630e-9)), "λ = 0");
  assert.ok(Number.isNaN(qpmPeriod(NaN)), "NaN Δk");
});
