import test from "node:test";
import assert from "node:assert/strict";

import { siPinQe, siVsIngaasSummary, type SiVsIngaasParams } from "../src/physics/detectors/si-vs-ingaas";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Gärtner (1959) QE with Green (2008) silicon k; InGaAs slab QE with α = 2.4e6·√(E − E_g) (fit to Adachi 1989) and the Vurgaftman gaps;
// I = q·n_i·W·A/τ_g (Sze & Ng 2007, ch. 2); SNR = I_s/√((2q(I_s + I_d) + i_amp²)B). Values re-derived with an independent script.
const base: SiVsIngaasParams = { lambda: 950e-9, power: 1e-7, T: 300, area: 1e-6, bandwidth: 1e6, ampNoise: 1e-12, window: "inp" };

test("siVsIngaasSummary: 950 nm, 300 K, InP cap", () => {
  const s = siVsIngaasSummary(base);
  assertRel(s.siQe, 0.6783581380788112, 1e-9, "Si QE");
  assertRel(s.ingaasQe, 0.97568550459968, 1e-9, "InGaAs QE");
  assertRel(s.siDark, 3.09220090362e-11, 1e-9, "Si dark");
  assertRel(s.ingaasDark, 3.0281138382599995e-9, 1e-9, "InGaAs dark");
  assertRel(s.siSnr, 51.54983631066937, 1e-9, "Si SNR");
  assertRel(s.ingaasSnr, 73.84496298589004, 1e-9, "InGaAs SNR");
  assertRel(s.inpEdge, 916.442513391905e-9, 1e-9, "InP edge");
  assertRel(s.niRatio, 65.28497409326425, 1e-9, "n_i ratio");
});

test("siVsIngaasSummary: 1000 nm, 320 K, no window", () => {
  const s = siVsIngaasSummary({ lambda: 1000e-9, power: 1e-6, T: 320, area: 2e-6, bandwidth: 1e7, ampNoise: 2e-12, window: "none" });
  assertRel(s.siQe, 0.4403310041925663, 1e-9, "Si QE");
  assertRel(s.ingaasResponsivity, 0.7857931990689325, 1e-9, "InGaAs R");
  assertRel(s.ingaasDark, 1.848428499805448e-8, 1e-9, "InGaAs dark");
  assertRel(s.ingaasSnr, 120.42586434509653, 1e-9, "InGaAs SNR");
});

test("siVsIngaasSummary: window and cutoff edges give QE 0, not NaN", () => {
  assert.equal(siVsIngaasSummary({ ...base, lambda: 850e-9 }).ingaasQe, 0); // below the InP edge
  assert.ok(siVsIngaasSummary({ ...base, lambda: 850e-9, window: "none" }).ingaasQe > 0.9);
  assert.equal(siPinQe(1500e-9), 0); // beyond the silicon table
  assert.equal(siVsIngaasSummary({ ...base, lambda: 1550e-9 }).siSnr, 0);
});
