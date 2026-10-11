import test from "node:test";
import assert from "node:assert/strict";

import { besselI0 } from "../src/physics/math";
import { eyeLimits, exposureLimit } from "../src/physics/laser-safety/eye-exposure-limits";
import {
  angularScan, offsetApertureFraction, passLength, passWidth, scannedBeamLimits, stationaryMaxPower, type Scan,
} from "../src/physics/laser-safety/scanned-beam";

// ICNIRP, "Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm", Health
// Phys. 105(3), 271–295 (2013), doi:10.1097/HP.0b013e3182983fd4: "Repetitive pulse exposures" (p. 287: scanning beams
// are repetitive-pulse exposures; rules 1–3, C_P), Table 4 (T₂, T_i), Table 5 (18 C_E t^0.75 J/m² through 7 mm,
// 400–700 nm; 10⁴ J/m² at 1500–1800 nm to 10 s), Table 8 (corneal aperture 1 mm to 0.35 s, 1.5 t^0.375 mm to 10 s).
// One pass across the aperture is one pulse, of the duration between its half-power points, with all of its energy:
// K. Schulmeister, "Extended source AEL analysis of scanned laser emission for IEC 60825-1", White Paper Ed. 2,
// Seibersdorf Laboratories (2025), 4.2.5 and 6.2.3. Expected values are hand calculations from those tables.

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = (x: number) => x * 1e-9;
const D7 = 7e-3;
const A7 = (Math.PI * D7 * D7) / 4;
const H532 = (t: number) => 18 * Math.pow(t, 0.75); // J/m², point source, 400–700 nm
const scan = (speed: number, rate: number, exposure: number, sweep = 1): Scan => ({ speed, rate, sweep, exposure });
const limit = (r: ReturnType<typeof scannedBeamLimits>, kind: string) => {
  const l = r.limits.find((x) => x.kind === kind);
  assert.ok(l, kind);
  return l;
};

test("Gaussian beam through an offset aperture", () => {
  // Centred: 1 − exp(−2D²/d²).
  for (const d of [1e-4, 2e-3, 7e-3, 2e-2, 0.1]) {
    assertRel(offsetApertureFraction(d, D7, 0), -Math.expm1((-2 * D7 * D7) / (d * d)), 1e-12, `η(0), d = ${d}`);
  }
  // Offset: the radial form ∫₀^R (r/σ²) exp(−(r² + x²)/2σ²) I₀(rx/σ²) dr (Rice distribution, σ = d/4), by Simpson.
  const radial = (d: number, D: number, x: number) => {
    const s = d / 4;
    const n = 2000;
    const h = D / 2 / n;
    let sum = 0;
    for (let i = 0; i <= n; i++) {
      const r = i * h;
      const w = i === 0 || i === n ? 1 : i % 2 === 1 ? 4 : 2;
      sum += w * (r / (s * s)) * Math.exp(-(r * r + x * x) / (2 * s * s)) * besselI0((r * x) / (s * s));
    }
    return (sum * h) / 3;
  };
  for (const [d, x] of [[7e-3, 2e-3], [3e-3, 3.5e-3], [1e-2, 5e-3], [2e-3, 4e-3]]) {
    assertRel(offsetApertureFraction(d, D7, x), radial(d, D7, x), 1e-8, `η(${x}), d = ${d}`);
  }
  // A point beam: inside, on the edge, outside.
  assert.equal(offsetApertureFraction(0, D7, 3e-3), 1);
  assert.equal(offsetApertureFraction(0, D7, 3.5e-3), 0.5);
  assert.equal(offsetApertureFraction(0, D7, 4e-3), 0);
  assert.ok(Number.isNaN(offsetApertureFraction(-1e-3, D7, 0)));
  assert.ok(Number.isNaN(offsetApertureFraction(1e-3, 0, 0)));
});

test("pass length and width", () => {
  // Narrow beam: the pass lasts D/v at full power, so L = W = D.
  assert.equal(passLength(0, D7), D7);
  assert.equal(passWidth(0, D7), D7);
  assertRel(passLength(1e-5, D7), D7, 1e-6, "L, d = 10 µm");
  assertRel(passWidth(1e-5, D7), D7, 1e-6, "W, d = 10 µm");
  // Wide beam (d = 100 mm ≫ 7 mm): L → (πD²/4)·√(2/π)/(d/2), the profile's peak line density times the area, and
  // W → √(2 ln 2)·d/2, the Gaussian's FWHM (both within the (D/d)² corrections, 0.3 %).
  const d = 0.1;
  assertRel(passLength(d, D7), (A7 * Math.sqrt(2 / Math.PI)) / (d / 2), 3e-3, "L, d = 100 mm");
  assertRel(passWidth(d, D7), (Math.sqrt(2 * Math.LN2) * d) / 2, 3e-3, "W, d = 100 mm");
  // L is ∫η dx (trapezoid over ±20 mm); η at ±W/2 is half its peak.
  const d3 = 3e-3;
  let sum = 0;
  for (let x = -0.02; x <= 0.02; x += 1e-5) sum += offsetApertureFraction(d3, D7, x) * 1e-5;
  assertRel(passLength(d3, D7), sum, 1e-9, "L = ∫η dx");
  assertRel(offsetApertureFraction(d3, D7, passWidth(d3, D7) / 2), offsetApertureFraction(d3, D7, 0) / 2, 1e-9, "η(W/2)");
});

test("angular scan seen from the pivot", () => {
  // 30° at 100 Hz, both directions, at 1 m: ω = 2Θf = 104.72 rad/s, 200 passes a second, sweeps of 0.5236 m.
  const s = angularScan(Math.PI / 6, 100, 1, true, 0.25);
  assertRel(s.speed, (2 * Math.PI * 100) / 6, 1e-12, "speed");
  assert.equal(s.rate, 200);
  assertRel(s.sweep, Math.PI / 6, 1e-12, "sweep");
  const one = angularScan(Math.PI / 6, 100, 1, false, 0.25);
  assertRel(one.speed, s.speed / 2, 1e-12, "one direction");
  assert.equal(one.rate, 100);
});

test("point source at 532 nm: the single pass binds", () => {
  // A narrow beam (d → 0) at 10 m/s across 7 mm: τ = 0.7 ms, 0.7 mJ per watt; 100 passes/s for 0.25 s: N = 25.
  const tau = 7e-4;
  const r = scannedBeamLimits(nm(532), 0, scan(10, 100, 0.25));
  assert.equal(r.status, "ok");
  const l = limit(r, "retinalThermal");
  assertRel(l.passDuration, tau, 1e-12, "τ");
  assertRel(l.passEnergy, tau, 1e-12, "J per W");
  assert.equal(l.passes, 25);
  // Rule 1: H(τ)·A/τ = 18 A τ^−0.25 = 4.259 mW.
  assertRel(l.singlePulse, (H532(tau) * A7) / tau, 1e-9, "rule 1");
  assertRel(l.singlePulse, 4.2588e-3, 1e-4, "rule 1 (W)");
  // Rule 2: the full train, T_25 = τ + 24/f = 0.2407 s, binds among the groups: 18 T^0.75 A / (25 τ) = 13.60 mW.
  const T25 = tau + 0.24;
  assert.equal(l.groupPulses, 25);
  assertRel(l.group, (H532(T25) * A7) / (25 * tau), 1e-9, "rule 2");
  // Rule 3: pulses longer than T_i from a point source: C_P = 1.
  assert.equal(l.cp, 1);
  assert.equal(r.rule, 1);
  assertRel(r.pMax, l.singlePulse, 1e-12, "pMax");
  // The beam held still for 0.25 s: 18 A 0.25^−0.25 = 0.980 mW, 4.35× less.
  assertRel(stationaryMaxPower(nm(532), 0, 0.25), (H532(0.25) * A7) / 0.25, 1e-9, "stationary");
});

test("passes back to back: the stationary limit", () => {
  // Edge case: a pass every D/v (duty cycle 1) is a continuous beam. N = ⌊(0.25 − τ)f⌋ + 1 = 357 passes span
  // T_N = 357 τ = 0.2499 s, and the full train gives the CW limit for T_N: 18 A T_N^−0.25.
  const v = 10;
  const r = scannedBeamLimits(nm(532), 0, scan(v, v / D7, 0.25));
  const l = limit(r, "retinalThermal");
  assert.equal(l.passes, 357);
  const TN = 357 * (D7 / v);
  assert.equal(r.rule, 2);
  assertRel(r.pMax, (H532(TN) * A7) / TN, 1e-9, "scanned = CW");
  assertRel(r.pMax, stationaryMaxPower(nm(532), 0, TN), 1e-9, "stationaryMaxPower");
});

test("extended source: C_P = 0.2 binds", () => {
  // α = 20 mrad: α_max(0.7 ms) = 5.29 mrad < α < 100 mrad and T₂ = 15.4 s > T = 10 s, so all N = 1000 passes count:
  // n > 625 gives C_P = 0.2 (ICNIRP 2013 rule 3 b).
  const alpha = 0.02;
  const tau = 7e-4;
  const r = scannedBeamLimits(nm(532), 0, scan(10, 100, 10), alpha);
  const l = limit(r, "retinalThermal");
  assert.equal(l.passes, 1000);
  assert.equal(l.cpCount, 1000);
  assert.equal(l.cp, 0.2);
  const thermal = eyeLimits(nm(532), alpha).find((x) => x.kind === "retinalThermal");
  assert.ok(thermal);
  assertRel(l.reduced, (0.2 * exposureLimit(thermal, tau) * A7) / tau, 1e-9, "rule 3");
  assert.equal(r.rule, 3);
});

test("cornea at 1550 nm: the aperture grows with the group", () => {
  // 1 m/s across 1 mm: τ = 1 ms. 10 passes/s for 10 s: N = 100 over T_N = 9.901 s, where the aperture is
  // 1.5 T^0.375 mm = 3.544 mm, so each pass puts 3.544 mJ per watt through it. Rule 2, full train:
  // 10⁴ J/m² · (π/4)·D(T_N)² / (100 · D(T_N)/v) = 0.2783 W. (With the 1 mm pass energy it would be 3.5× too high.)
  const r = scannedBeamLimits(nm(1550), 0, scan(1, 10, 10));
  const l = limit(r, "cornealIr");
  assertRel(l.passDuration, 1e-3, 1e-12, "τ");
  assert.equal(l.aperture, 1e-3);
  assert.equal(l.passes, 100);
  const TN = 1e-3 + 9.9;
  const D = 1.5e-3 * Math.pow(TN, 0.375);
  assertRel(l.group, (1e4 * (Math.PI / 4) * D * D) / (100 * D), 1e-9, "rule 2");
  assertRel(l.group, 0.27833, 1e-4, "rule 2 (W)");
  assert.equal(r.rule, 2);
  // Rule 1: 10⁴ J/m² over 1 mm in 1 ms: 7.854 W.
  assertRel(l.singlePulse, (1e4 * Math.PI * 0.25e-6) / 1e-3, 1e-9, "rule 1");
});

test("scans that don't leave the eye, and invalid input", () => {
  // A 10 mm sweep with a 4 mm beam doesn't clear 7 mm + 4 mm: the beam is never off the pupil.
  assert.equal(scannedBeamLimits(nm(532), 4e-3, scan(10, 100, 0.25, 0.01)).status, "noClearance");
  assert.equal(scannedBeamLimits(nm(532), 4e-3, scan(10, 100, 0.25, 0.011)).status, "ok");
  // Overlapping passes (rate × duration > 1), no speed, an exposure beyond 30 ks.
  assert.equal(scannedBeamLimits(nm(532), 0, scan(10, 2000, 0.25)).status, "invalid");
  assert.equal(scannedBeamLimits(nm(532), 0, scan(0, 100, 0.25)).status, "invalid");
  assert.equal(scannedBeamLimits(nm(532), 0, scan(10, 100, 4e4)).status, "invalid");
  assert.ok(Number.isNaN(scannedBeamLimits(nm(532), -1e-3, scan(10, 100, 0.25)).pMax));
});

test("a finite beam: pass duration from W, energy from L", () => {
  // d = D = 7 mm at 10 m/s: the half-power width W sets the pulse duration, the whole pass (L < W here) its energy.
  const d = 7e-3;
  const r = scannedBeamLimits(nm(532), d, scan(10, 100, 0.25));
  const l = limit(r, "retinalThermal");
  const tau = passWidth(d, D7) / 10;
  assertRel(l.passDuration, tau, 1e-12, "τ = W/v");
  assertRel(l.passEnergy, passLength(d, D7) / 10, 1e-12, "J per W = L/v");
  assertRel(l.singlePulse, (H532(tau) * A7) / (passLength(d, D7) / 10), 1e-9, "rule 1");
});

test("a pass slower than 0.35 s at the cornea sets its own aperture", () => {
  // 2 mm/s across the cornea: the pass lasts D/v while D = 1.5 mm·(D/v)^0.375 (t in s), so
  // D = (1.5×10⁻³)^1.6 · v^−0.6 m = 1.264 mm and τ = 0.632 s.
  const v = 2e-3;
  const D = Math.pow(1.5e-3, 1.6) * Math.pow(v, -0.6);
  const l = limit(scannedBeamLimits(nm(1550), 0, scan(v, 0.1, 30)), "cornealIr");
  assertRel(l.aperture, D, 1e-9, "aperture");
  assertRel(l.passDuration, D / v, 1e-9, "τ");
});

test("blue light over 1000 s: the photochemical limit binds", () => {
  // 450 nm, C_B = 1: 100 J/m² for 10–100 s, then 1 W/m² (ICNIRP 2013 Table 5). Passes of 0.7 ms at 100/s put an
  // average of P·f·τ through 7 mm, so P ≤ 1 W/m² · A / (f τ) = 0.550 mW; the thermal single-pass limit is 4.26 mW.
  const r = scannedBeamLimits(nm(450), 0, scan(10, 100, 1000));
  assert.equal(r.limiting, "retinalPhotochemical");
  assert.equal(r.rule, 2);
  assertRel(r.pMax, A7 / (100 * 7e-4), 1e-3, "photochemical");
  assertRel(limit(r, "retinalThermal").singlePulse, (H532(7e-4) * A7) / 7e-4, 1e-9, "thermal rule 1");
});
