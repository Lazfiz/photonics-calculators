// Golden values for sbsSpan / sbsSummary (src/physics/fiber-optics/sbs-threshold.ts), from an independent script that applies
// Smith R. G., Appl. Opt. 11, 2489 (1972), doi:10.1364/AO.11.002489 (g_B P L_eff/A_eff ≈ 21, times the polarization factor K)
// and Agrawal, Nonlinear Fiber Optics, 6th ed., §4.1 (L_eff = (1 − e^(−αL))/α), §9.1 (ν_B = 2 n v_A/λ, factor 1 + Δν_s/Δν_B).
import assert from "node:assert/strict";
import { test } from "node:test";

import { sbsSpan, sbsSummary, sbsThresholdOf } from "../src/physics/fiber-optics/sbs-threshold";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

const base = { lambda: 1550e-9, L: 10e3, Aeff: 80e-12, lossDbPerKm: 0.2, gB: 5e-11, dnuB: 35e6, dnuS: 1e6 };

test("10 km of 0.2 dB/km fibre at 1550 nm, 1 MHz source, Δν_B = 35 MHz", () => {
  const s = sbsSummary(sbsSpan(base));
  close(s.Leff, 8013.659443958735);
  close(s.nuB, 11150967741.935482);
  close(s.linewidthFactor, 1.0285714285714285);
  close(s.thresholds[0], 0.004312636472972878);
  close(s.thresholds[1], 0.0064689547094593175);
  close(s.thresholds[2], 0.008625272945945756);
});

test("1064 nm, 25 km, 0.5 dB/km, 20 MHz source: the threshold of another length and linewidth", () => {
  const span = sbsSpan({ lambda: 1064e-9, L: 25e3, Aeff: 50e-12, lossDbPerKm: 0.5, gB: 3e-11, dnuB: 50e6, dnuS: 20e6 });
  close(sbsThresholdOf(span, 1.5), 0.008966207094710158);
  close(sbsThresholdOf(span, 2), 0.011954942792946876);
  // Narrow source (factor 1): 21·2·50e-12/(3e-11·8197.446169112376) = 8.5389e-3 W.
  close(sbsThresholdOf(span, 2, undefined, 0), (21 * 2 * 50e-12) / (3e-11 * 8197.446169112376));
});

test("values outside the model's domain are clamped", () => {
  const span = sbsSpan({ ...base, lambda: 100e-9, L: 0, lossDbPerKm: -1, dnuB: 0, dnuS: -5 });
  close(span.lambda, 400e-9);
  assert.equal(span.L, 1);
  assert.equal(span.alpha, 0);
  close(span.dnuB, 0.1e6);
  assert.equal(span.dnuS, 0);
});
