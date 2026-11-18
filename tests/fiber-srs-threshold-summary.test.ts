// Golden values for srsSpan / srsSummary (src/physics/fiber-optics/srs-threshold.ts), from an independent script that applies
// Smith R. G., Appl. Opt. 11, 2489 (1972), doi:10.1364/AO.11.002489 (g_R P L_eff/A_eff ≈ 16, times K), Agrawal, Nonlinear
// Fiber Optics, 6th ed., §4.1 (L_eff) and §8.1 (g_R = 1e-13 m/W at 1 µm, scaling as 1/λ_p) and 1/λ_s = 1/λ_p − Δν/c.
import assert from "node:assert/strict";
import { test } from "node:test";

import { srsSpan, srsSummary } from "../src/physics/fiber-optics/srs-threshold";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

test("10 km of 0.2 dB/km fibre pumped at 1550 nm, g_R = 6.5e-14 m/W, shift 13.2 THz", () => {
  const s = srsSummary(srsSpan({ lambda: 1550e-9, L: 10e3, Aeff: 80e-12, lossDbPerKm: 0.2, gR: 6.5e-14, shift: 13.2e12 }));
  close(s.Leff, 8013.659443958735);
  close(s.thresholds[0], 2.457342719642666);
  close(s.thresholds[1], 4.914685439285332);
  close(s.gRAtLambda, 6.451612903225806e-14);
  close(s.lambdaStokes, 1663.5313820207748e-9);
});

test("1064 nm, 25 km, 0.5 dB/km, A_eff = 50 µm², g_R = 9e-14 m/W", () => {
  const s = srsSummary(srsSpan({ lambda: 1064e-9, L: 25e3, Aeff: 50e-12, lossDbPerKm: 0.5, gR: 9e-14, shift: 13.2e12 }));
  close(s.thresholds[0], 1.084348552648243);
  close(s.thresholds[1], 2.168697105296486);
  close(s.gRAtLambda, 9.398496240601503e-14);
  close(s.lambdaStokes, 1116.2967267854215e-9);
});

test("a shift at or above the pump frequency has no Stokes wavelength", () => {
  const s = srsSummary(srsSpan({ lambda: 1550e-9, L: 10e3, Aeff: 80e-12, lossDbPerKm: 0.2, gR: 6.5e-14, shift: 200e12 }));
  assert.ok(Number.isNaN(s.lambdaStokes));
});
