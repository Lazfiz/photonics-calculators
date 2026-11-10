import test from "node:test";
import assert from "node:assert/strict";

import { exposureLimit, limitingAperture } from "../src/physics/laser-safety/eye-exposure-limits";
import { effectiveDiameterAt, rangeToDiameter, roundBeam } from "../src/physics/laser-safety/hazard-distance";
import { pulseLimits, pulseTrainLimits, pulseTrainSafeDiameter } from "../src/physics/laser-safety/pulse-train";
import { angularScan, offsetApertureFraction, passLength, type Scan } from "../src/physics/laser-safety/scanned-beam";
import {
  lidarHazardDistance, lidarMaxEnergyAt, scannedPulseLimits,
} from "../src/physics/laser-safety/scanned-pulse-train";

// ICNIRP, "Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm", Health
// Phys. 105(3), 271–295 (2013), doi:10.1097/HP.0b013e3182983fd4: "Repetitive pulse exposures" (p. 287: every pulse and
// every group within its limit; C_P with n the pulses within T₂; scanning beams are repetitive-pulse exposures),
// Table 4 (T₂ = 10 s for a point source, T_i = 5 µs at 400–1050 nm), Table 5 (retinal thermal, 700–1050 nm, point
// source: 2.0×10⁻³ C_A J/m² from 1 ns to 5 µs, 18 C_A t^0.75 J/m² to 10 s, C_A = 10^0.002(λ−700); rule 3 for pulses
// within T_i: 5 n^−0.25 beyond 0.25 s). Expected values are hand calculations from those tables.

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const D7 = 7e-3;
const A7 = (Math.PI * D7 * D7) / 4;
const CA905 = Math.pow(10, 0.002 * 205);
const pulses = { duration: 5e-9, prf: 2e5 };
// Default page: 905 nm, 3 mm + 3 mrad, a rotating lidar (360°, 10 Hz, one direction), eye at 10 m, 10 s.
const rotating = (r: number, T = 10) => angularScan(2 * Math.PI, 10, r, false, T);
const beam = roundBeam(3e-3, 3e-3);
const d10 = 0.033; // a 33 mm beam at the eye (3 mm + 10 m × 3 mrad, linear growth)
const limitOf = (r: ReturnType<typeof scannedPulseLimits>, kind: string) => {
  const l = r.limits.find((x) => x.kind === kind);
  assert.ok(l, kind);
  return l;
};

test("rotating lidar at 10 m: the three levels by hand", () => {
  const res = scannedPulseLimits(905e-9, d10, pulses, rotating(10));
  assert.equal(res.status, "ok");
  const l = limitOf(res, "retinalThermal");
  const eta0 = -Math.expm1((-2 * D7 * D7) / (d10 * d10)); // 0.08606
  // v = 2π·10 Hz·10 m = 628.3 m/s, Δx = v/f = 3.142 mm; pulses over the aperture per pass ⌈(7 + 33)/3.142⌉ = 13;
  // 100 passes in 10 s (T₂ = 10 s): n = 1300, C_P = 5·1300^−0.25 = 0.8327.
  assert.equal(l.pulsesPerPass, 13);
  assert.equal(l.cpCount, 1300);
  assertRel(l.cp, 5 * Math.pow(1300, -0.25), 1e-12, "C_P");
  assertRel(l.reduced, (5 * Math.pow(1300, -0.25) * 2e-3 * CA905 * A7) / eta0, 1e-9, "rule 3 over all passes");
  // Within a pass (31.6 µs, 7 pulses): rule 2 binds at two pulses, 5.005 µs, just past Table 5's 5 µs joint, where
  // 18 C_A t^0.75 (4.89 mJ/m²·C_A/2.57…) is below 2.0×10⁻³ C_A: G/2.
  assert.equal(l.within.rule, 2);
  assert.equal(l.within.groupPulses, 2);
  assertRel(l.within.qMax, (18 * CA905 * Math.pow(5.005e-6, 0.75) * A7) / eta0 / 2, 1e-9, "within a pass");
  // Passes: ρ = 1 + Δx·η(0)/L at the 7 mm aperture.
  const dx = (2 * Math.PI * 100) / 2e5;
  assertRel(l.ripple, 1 + (dx * eta0) / passLength(d10, D7), 1e-12, "ρ");
  assertRel(l.passPerPulse, l.pass.qMax / (2e5 * l.ripple), 1e-12, "pass level");
  assert.equal(res.qMax, l.within.qMax);
  assert.equal(res.level, "pulse");
  // 10 µJ is 9.14× over (the stationary beam: 172×).
  assertRel(10e-6 / res.qMax, 9.1353, 1e-4, "ratio");
});

test("ρ bounds the pass energy for every phase of the pulses", () => {
  // Σₖ η(x₀ + kΔx) ≤ L/Δx + η(0) for a unimodal η; a point beam (d = 0) through 7 mm: η = 1 inside, so the sum is the
  // count of pulses inside, at most ⌈7/2⌉ = 4 for Δx = 2 mm, and the bound is 3.5 + 1.
  for (const [d, dx] of [[0, 2e-3], [0.5e-3, 2e-3], [3e-3, 1e-3], [0.033, 3.1e-3], [0.033, 0.03]]) {
    const L = passLength(d, D7);
    const bound = L / dx + offsetApertureFraction(d, D7, 0);
    let worst = 0;
    for (let p = 0; p < 40; p++) {
      let s = 0;
      for (let k = -60; k <= 60; k++) s += offsetApertureFraction(d, D7, (p / 40) * dx + k * dx);
      worst = Math.max(worst, s);
    }
    assert.ok(worst <= bound * (1 + 1e-12), `d ${d}, Δx ${dx}: ${worst} > ${bound}`);
    if (d === 0) assert.equal(worst, 4);
    // Sparse (Δx ≈ L): the worst phase is one centred pulse, η(0), and the bound adds L/Δx to it: 1.7× loose.
    if (dx === 0.03) {
      assertRel(worst, offsetApertureFraction(d, D7, 0), 1e-2, "sparse: one centred pulse (+ 0.4 % from its neighbours)");
      assert.ok(bound / worst < 1.75, `sparse: bound ${bound} vs ${worst}`);
    }
  }
});

// Brute force: each pulse's energy through the aperture, η(x), for the pulses' phase x₀; every window of
// consecutive pulses, over all passes, against H(t)·A(t) at its span t (rules 1 and 2 as written). T ≤ 0.25 s keeps
// C_P = 1, so rule 3 adds nothing. The model must allow no more, and not much less.
function bruteForce(lambda: number, kind: string, d: number, tau: number, f: number, scan: Scan) {
  const limit = pulseLimits(lambda).find((l) => l.kind === kind);
  assert.ok(limit);
  const dx = scan.speed / f;
  const D0 = limitingAperture(limit, 1e-9);
  const passes = Math.floor((scan.exposure - 1e-3) * scan.rate) + 1;
  let best = Infinity;
  for (let p = 0; p < 8; p++) {
    const xs: number[] = [];
    const kMax = Math.ceil((D0 / 2 + 2.5 * d) / dx) + 1;
    for (let k = -kMax; k <= kMax; k++) xs.push((p / 8) * dx + k * dx);
    const times: number[] = [];
    for (let q = 0; q < passes; q++) for (const x of xs) times.push(q / scan.rate + (x - xs[0]) / scan.speed);
    const etas = new Map<number, number[]>();
    const etaAt = (D: number) => {
      let e = etas.get(D);
      if (!e) {
        const one = xs.map((x) => offsetApertureFraction(d, D, x));
        e = Array.from({ length: passes }, () => one).flat();
        etas.set(D, e);
      }
      return e;
    };
    for (let i = 0; i < times.length; i++) {
      for (let j = i; j < times.length; j++) {
        const t = times[j] - times[i] + tau;
        if (t > scan.exposure) break;
        const D = limitingAperture(limit, Math.max(t, 1e-9));
        const e = etaAt(D);
        let s = 0;
        for (let m = i; m <= j; m++) s += e[m];
        if (s < 1e-12) continue;
        best = Math.min(best, (exposureLimit(limit, t) * Math.PI * D * D) / 4 / s);
      }
    }
  }
  return best;
}

test("conservative against a brute-force sum over every window", () => {
  const cases: [string, number, string, number, Scan][] = [
    ["905 nm, dense (10 Hz)", 905e-9, "retinalThermal", d10, { speed: 2 * Math.PI * 100, rate: 10, sweep: 62.8, exposure: 0.25 }],
    ["905 nm, sparse (100 Hz)", 905e-9, "retinalThermal", d10, { speed: 2 * Math.PI * 1000, rate: 100, sweep: 62.8, exposure: 0.25 }],
    ["905 nm, 0.5 mm beam", 905e-9, "retinalThermal", 0.5e-3, { speed: 400, rate: 50, sweep: 8, exposure: 0.25 }],
    ["1550 nm, 1 mm cornea", 1550e-9, "cornealIr", 3e-3, { speed: 200, rate: 20, sweep: 10, exposure: 0.3 }],
  ];
  for (const [name, lambda, kind, d, scan] of cases) {
    const model = limitOf(scannedPulseLimits(lambda, d, pulses, scan), kind).qMax;
    const brute = bruteForce(lambda, kind, d, pulses.duration, pulses.prf, scan);
    // Measured: 1.018, 1.592, 1.000, 1.503.
    assert.ok(model <= brute * (1 + 1e-9) && brute < 1.7 * model, `${name}: model ${model}, brute force ${brute}`);
  }
});

test("pulses closer than T_i: rule 3 counts T_i groups when that is lower", () => {
  // 1 MHz, 2 ns at 905 nm: k = 5 pulses per 5 µs. Eye at 10 m, d = 33 mm: Δx = 0.628 mm, ⌈40/0.628⌉ = 64 pulses per
  // pass, ⌈64/5⌉ = 13 groups; 100 passes. Singles: n = 6400, C_P = 5·6400^−0.25 = 0.5590 → 0.559·G(2 ns).
  // Groups: n = 1300, C_P = 0.8327, G(5 µs)/5 = 18 C_A (5 µs)^0.75 A/η₀/5: 0.8327·0.9516/5 = 0.1585 of G(2 ns). Lower.
  const res = scannedPulseLimits(905e-9, d10, { duration: 2e-9, prf: 1e6 }, rotating(10));
  const l = limitOf(res, "retinalThermal");
  const eta0 = -Math.expm1((-2 * D7 * D7) / (d10 * d10));
  assert.equal(l.pulsesPerPass, 64);
  assert.equal(l.cpCount, 1300);
  assertRel(l.reduced, (5 * Math.pow(1300, -0.25) * 18 * CA905 * Math.pow(5e-6, 0.75) * A7) / eta0 / 5, 1e-9, "grouped rule 3");
});

test("the eye at the window, or a sweep that doesn't clear it, is a stationary beam", () => {
  const stationary = (d: number, T = 10) => pulseTrainLimits(905e-9, d, { ...pulses, exposure: T }).qMax;
  assert.equal(lidarMaxEnergyAt(905e-9, beam, pulses, rotating, 0), stationary(3e-3));
  // 0.01° at 10 m: a 1.7 mm sweep, under the 7 mm pupil plus a 33 mm beam.
  const narrow = (r: number) => angularScan((0.01 * Math.PI) / 180, 10, r, false, 10);
  assert.equal(scannedPulseLimits(905e-9, d10, pulses, narrow(10)).status, "noClearance");
  assert.equal(lidarMaxEnergyAt(905e-9, beam, pulses, narrow, 10), stationary(effectiveDiameterAt(beam, 10)));
  // Invalid: no repetition rate, overlapping pulses.
  assert.equal(scannedPulseLimits(905e-9, d10, { duration: 5e-9, prf: 0 }, rotating(10)).status, "invalid");
  assert.equal(scannedPulseLimits(905e-9, d10, { duration: 1e-5, prf: 2e5 }, rotating(10)).status, "invalid");
});

test("hazard distance: where the ratio crosses 1, inside the stationary NOHD", () => {
  const Q = 10e-6;
  const stationary = rangeToDiameter(beam, pulseTrainSafeDiameter(905e-9, Q, { ...pulses, exposure: 10 }));
  assertRel(stationary, 147.456, 1e-4, "stationary NOHD (Gaussian growth)");
  const r = lidarHazardDistance(905e-9, Q, beam, pulses, rotating, 4 * stationary);
  assert.ok(Q > lidarMaxEnergyAt(905e-9, beam, pulses, rotating, r * (1 - 1e-5)), "over just inside");
  assert.ok(Q <= lidarMaxEnergyAt(905e-9, beam, pulses, rotating, r * (1 + 1e-5)), "within just outside");
  assertRel(r, 33.903, 1e-4, "scanned NOHD (regression)");
  // 1 nJ is within everywhere; NaN for a negative energy.
  assert.equal(lidarHazardDistance(905e-9, 1e-9, beam, pulses, rotating, 600), 0);
  assert.ok(Number.isNaN(lidarHazardDistance(905e-9, -1, beam, pulses, rotating, 600)));
});

test("an exposure shorter than one pass is the stationary beam, also in the hazard distance", () => {
  // Physics review, session 199: 10°, 1 Hz, 50 ms. Near the scanner a pass (W/v, v ∝ r) outlasts the exposure, so the
  // scanned evaluation doesn't apply (0.06–0.75 m); the stationary NOHD (0.22 m) lies in that band, and the scanned
  // search must find it, not read the band as safe.
  const b = roundBeam(3e-3, 3e-3);
  const scanAt = (r: number) => angularScan((10 * Math.PI) / 180, 1, r, false, 0.05);
  const train = { ...pulses, exposure: 0.05 };
  assert.equal(scannedPulseLimits(905e-9, effectiveDiameterAt(b, 0.21), pulses, scanAt(0.21)).status, "invalid");
  const Q = pulseTrainLimits(905e-9, effectiveDiameterAt(b, 0.21), train).qMax * 1.0001;
  const stationary = rangeToDiameter(b, pulseTrainSafeDiameter(905e-9, Q, train));
  assertRel(lidarHazardDistance(905e-9, Q, b, pulses, scanAt, 4 * stationary), stationary, 1e-5, "scanned NOHD = stationary NOHD");
});

test("never stricter than the stationary beam: the floor binds where the pass convention does", () => {
  // Physics review, session 199: 120°, 50 Hz, 0.25 s, 10 kHz, 1 mm + 1 mrad at 1 km (d = 1.001 m): the three levels
  // come out 1.9 % below the stationary limit (the pass's energy counted within its half-power width).
  const scan = angularScan((120 * Math.PI) / 180, 50, 1e3, false, 0.25);
  const p10k = { duration: 5e-9, prf: 1e4 };
  const res = scannedPulseLimits(905e-9, 1.001, p10k, scan);
  const l = limitOf(res, "retinalThermal");
  const stationary = pulseTrainLimits(905e-9, 1.001, { ...p10k, exposure: 0.25 }).limits.find((x) => x.kind === "retinalThermal")?.qMax;
  assert.equal(l.stationary, stationary);
  assert.ok(stationary !== undefined);
  assertRel(stationary / Math.min(l.within.qMax, l.passPerPulse, l.reduced), 1.0193, 1e-3, "the levels alone are stricter");
  assert.equal(l.qMax, stationary);
  assert.equal(l.level, "stationary");
});

test("actual-exposure rule at 1550 nm: conservative against the peak line's brute-force sum", () => {
  // Physics review, session 199: d = 0.5 mm (1/e 0.35 mm < 1 mm), 100 kHz, 50 m/s, 20 Hz, 0.3 s: H = 10⁴ J/m² flat
  // below 0.35 s, so the whole exposure binds; the peak fluence on the scan line is Σ 8Q/(πd²)·exp(−8(x − xⱼ)²/d²)
  // over every pulse, true timing (pulse j at j/f), at its worst point.
  const d = 0.5e-3;
  const [f, v, rate, T] = [1e5, 50, 20, 0.3];
  const res = scannedPulseLimits(1550e-9, d, { duration: 5e-9, prf: f }, { speed: v, rate, sweep: v / rate, exposure: T });
  const l = limitOf(res, "cornealIr");
  assert.ok(l.pass.actual);
  const period = 1 / rate;
  const xs: number[] = [];
  for (let j = 0; j / f + 5e-9 <= T; j++) {
    const x = v * (((j / f) % period) - period / 2);
    if (Math.abs(x) < 3 * d) xs.push(x);
  }
  let worst = 0;
  for (let k = -400; k <= 400; k++) {
    const x0 = (k / 400) * d;
    let s = 0;
    for (const x of xs) s += Math.exp((-8 * (x - x0) ** 2) / (d * d));
    worst = Math.max(worst, s);
  }
  const brute = (1e4 * Math.PI * d * d) / 8 / worst;
  // Measured: model 1.006e-4 J, brute force 1.635e-4 J.
  assert.ok(l.qMax <= brute && brute < 2 * l.qMax, `model ${l.qMax}, brute force ${brute}`);
});
