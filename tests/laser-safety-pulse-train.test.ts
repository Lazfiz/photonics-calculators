import test from "node:test";
import assert from "node:assert/strict";

import {
  correctionCP, limitMaxEnergy, pulseCount, pulseLimits, pulseTrainLimits, pulseTrainSafeDiameter, timeTi,
  type PulseTrain,
} from "../src/physics/laser-safety/pulse-train";

// ICNIRP, "Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm", Health
// Phys. 105(3), 271–295 (2013), doi:10.1097/HP.0b013e3182983fd4: "Repetitive pulse exposures" (p. 287, rules 1–3 and
// C_P), Table 4 (T₂, T_i), Table 5 (limits, with the energy through 7 mm, and the rows below 1 ns). Grouping of pulses
// within T_i: IEC 60825-1:2014 4.3 f) as described by K. Schulmeister, "The new edition of the international laser
// product safety standard IEC 60825-1" (white paper, Seibersdorf Laboratories, 2017). Expected values are hand
// calculations from those tables.

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = (x: number) => x * 1e-9;
const A7 = Math.PI * 3.5e-3 * 3.5e-3; // m², 7 mm aperture
const A1 = Math.PI * 0.5e-3 * 0.5e-3; // m², 1 mm aperture
const A35 = Math.PI * 1.75e-3 * 1.75e-3; // m², 3.5 mm aperture
const single = (tau: number): PulseTrain => ({ duration: tau, prf: 0, exposure: tau });
const retina = (lambda: number, d: number, train: PulseTrain, alpha = 0) => {
  const l = pulseTrainLimits(lambda, d, train, alpha).limits.find((x) => x.kind === "retinalThermal");
  assert.ok(l, "retinal thermal limit");
  return l;
};

test("T_i and the pulse count", () => {
  assert.equal(timeTi(nm(532)), 5e-6);
  assert.equal(timeTi(nm(1049)), 5e-6);
  assert.equal(timeTi(nm(1050)), 13e-6);
  assert.ok(Number.isNaN(timeTi(nm(1550))));
  // 10 ns pulses at 1 kHz from t = 0: the 10 000th starts at 9.999 s and ends within 10 s; the next would not.
  assert.equal(pulseCount({ duration: 1e-8, prf: 1e3, exposure: 10 }), 10000);
  assert.equal(pulseCount({ duration: 1e-8, prf: 1e3, exposure: 10 + 1e-8 }), 10001);
  assert.equal(pulseCount(single(1e-3)), 1);
  // Duty cycle above one, exposure shorter than a pulse or beyond 30 ks: invalid.
  assert.ok(Number.isNaN(pulseCount({ duration: 1e-3, prf: 2e3, exposure: 1 })));
  assert.ok(Number.isNaN(pulseCount({ duration: 1e-3, prf: 10, exposure: 1e-4 })));
  assert.ok(Number.isNaN(pulseCount({ duration: 1e-3, prf: 10, exposure: 4e4 })));
  assert.ok(Number.isNaN(pulseTrainLimits(nm(1064), 1e-3, { duration: 1e-3, prf: 2e3, exposure: 1 }).qMax));
});

test("Single pulse: Table 5's energies through 7 mm", () => {
  // 1050–1400 nm, 10 ps – 13 µs: 20 C_C mJ/m², 7.7×10⁻⁷ C_C J; C_C = 1 at 1064 nm.
  const ns = pulseTrainLimits(nm(1064), 0, single(1e-8));
  assertRel(ns.qMax, 2e-2 * A7, 1e-12, "1064 nm, 10 ns");
  assertRel(ns.qMax, 7.7e-7, 0.01, "1064 nm vs Table 5");
  assert.equal(ns.rule, 1);
  // 100 fs – 10 ps: 1.0 C_C C_E mJ/m², 3.8×10⁻⁸ J; 700–1050 nm without C_A (800 nm: 2.0 C_A mJ/m² from 10 ps).
  assertRel(pulseTrainLimits(nm(1064), 0, single(1e-12)).qMax, 1e-3 * A7, 1e-12, "1064 nm, 1 ps");
  assertRel(pulseTrainLimits(nm(800), 0, single(1e-13)).qMax, 1e-3 * A7, 1e-12, "800 nm, 100 fs");
  assertRel(pulseTrainLimits(nm(800), 0, single(1e-11)).qMax, 2e-3 * Math.pow(10, 0.2) * A7, 1e-12, "800 nm, 10 ps");
  assertRel(pulseTrainLimits(nm(1300), 0, single(1e-12)).limits[0].singlePulse, 1e-3 * (8 + Math.pow(10, 2)) * A7, 1e-12, "1300 nm, 1 ps");
  // Shorter than tabulated, the irradiance is held: 10 fs gets a tenth of 100 fs; 355 nm at 100 ps a tenth of the
  // 1 ns value 5.6×10³·(10⁻⁹)^0.25 = 31.5 J/m² over 1 mm.
  assertRel(pulseTrainLimits(nm(800), 0, single(1e-14)).qMax, 1e-4 * A7, 1e-12, "800 nm, 10 fs");
  assertRel(pulseTrainLimits(nm(355), 0, single(1e-10)).qMax, 0.1 * 5.6e3 * Math.pow(1e-9, 0.25) * A1, 1e-12, "355 nm, 100 ps");
  // 1550 nm below 1 ms: 10⁴ J/m² (1500–1800 nm) over 1 mm, so 7.85 mJ at 1 ns and 0.785 mJ at 100 ps.
  assertRel(pulseTrainLimits(nm(1550), 0, single(1e-9)).qMax, 1e4 * A1, 1e-12, "1550 nm, 1 ns");
  assertRel(pulseTrainLimits(nm(1550), 0, single(1e-10)).qMax, 1e3 * A1, 1e-12, "1550 nm, 100 ps");
  // The sub-ns pieces join the 1 ns ones.
  const l = pulseLimits(nm(633))[0];
  assertRel(limitMaxEnergy(l, 0, 0.999e-9), limitMaxEnergy(l, 0, 1e-9), 1e-12, "633 nm at 1 ns");
});

test("Rule 3c: ns pulses beyond 0.25 s, C_P = 5 n^−0.25", () => {
  // 1064 nm, 10 ns, 1 kHz, 10 s: n = 10⁴ within T₂ = 10 s, C_P = 5/10 = 0.5, so 10 mJ/m². The full train allows
  // 90·(9.999 s)^0.75 / 10⁴ = 50.6 mJ/m² per pulse.
  const r = retina(nm(1064), 0, { duration: 1e-8, prf: 1e3, exposure: 10 });
  assertRel(r.cp, 0.5, 1e-12, "C_P");
  assert.equal(r.cpCount, 10000);
  assertRel(r.reduced, 1e-2 * A7, 1e-12, "rule 3");
  assertRel(r.group, (90 * Math.pow(9.999 + 1e-8, 0.75) * A7) / 1e4, 1e-9, "rule 2");
  assert.equal(r.groupPulses, 10000);
  assert.equal(r.rule, 3);
  // Up to 0.25 s, C_P = 1 at any n; beyond, 1 up to 625 pulses (5 n^−0.25 ≥ 1).
  assert.equal(retina(nm(532), 0, { duration: 1e-8, prf: 1e4, exposure: 0.25 }).cp, 1);
  assert.equal(correctionCP(nm(1064), 0, 600, 1e-8, 10), 1);
  assertRel(correctionCP(nm(1064), 0, 1e6, 1e-8, 10), 5 / Math.pow(1e6, 0.25), 1e-12, "n = 10⁶");
  // n is counted within T₂ = 10 s, not the 100 s exposure.
  assert.equal(retina(nm(1064), 0, { duration: 1e-8, prf: 1e3, exposure: 100 }).cpCount, 10000);
  // No C_P outside the retinal thermal limit.
  assert.ok(Number.isNaN(correctionCP(nm(1550), 0, 1e4, 1e-8, 10)));
  assert.equal(pulseTrainLimits(nm(1550), 0, { duration: 1e-8, prf: 1e3, exposure: 10 }).limits[0].reduced, Infinity);
});

test("Rule 3a/3b: pulses longer than T_i", () => {
  // α ≤ 5 mrad: C_P = 1.
  assert.equal(correctionCP(nm(532), 5e-3, 1000, 1e-3, 10), 1);
  // A pulse of exactly T_i is case c: no reduction up to 0.25 s, whatever α.
  assert.equal(correctionCP(nm(532), 0.01, 100, 5e-6, 0.25), 1);
  // α = 10 mrad, 1 ms: α_max = 200·√(10⁻³) = 6.32 mrad < α, so n^−0.25 to 625 pulses, then 0.2.
  assertRel(correctionCP(nm(532), 0.01, 25, 1e-3, 0.25), Math.pow(25, -0.25), 1e-12, "n = 25");
  assertRel(correctionCP(nm(532), 0.01, 625, 1e-3, 1), 0.2, 1e-12, "n = 625");
  assert.equal(correctionCP(nm(532), 0.01, 626, 1e-3, 1), 0.2);
  // α = 10 mrad, 10 ms: α_max = 20 mrad ≥ α, so n^−0.25 to 40 pulses, then 0.4.
  assertRel(correctionCP(nm(532), 0.01, 40, 1e-2, 1), Math.pow(40, -0.25), 1e-12, "n = 40");
  assert.equal(correctionCP(nm(532), 0.01, 41, 1e-2, 1), 0.4);
  // From 100 mrad no reduction.
  assert.equal(correctionCP(nm(532), 0.1, 1000, 1e-3, 1), 1);
  // 532 nm, 1 ms at 100 Hz for 0.25 s, α = 10 mrad: 25 pulses. Single pulse 18 C_E t^0.75 with C_E = α_max/α_min
  // = 133.3·√t: 2400·(10⁻³)^1.25 = 0.4268 J/m²; rule 3 × 25^−0.25 = 0.1909 J/m²; the 25-pulse group (C_E = 6.67
  // from t_α = 2.5 ms) allows 120·(0.241 s)^0.75 / 25 = 1.651 J/m².
  const r = retina(nm(532), 0, { duration: 1e-3, prf: 100, exposure: 0.25 }, 0.01);
  assertRel(r.singlePulse, 2400 * Math.pow(1e-3, 1.25) * A7, 1e-12, "rule 1");
  assertRel(r.reduced, Math.pow(25, -0.25) * 2400 * Math.pow(1e-3, 1.25) * A7, 1e-12, "rule 3");
  assertRel(r.group, (120 * Math.pow(0.241, 0.75) * A7) / 25, 1e-9, "rule 2");
  assert.equal(r.rule, 3);
});

test("Pulses within T_i: rule 2 adds them, rule 3 counts them as one", () => {
  // 800 nm, 100 fs at 80 MHz for 0.25 s: 400 pulses fit in T_i = 5 µs. The full train of 2×10⁷ pulses sets the limit,
  // 18 C_A (0.25 s)^0.75 / N = 0.504 µJ/m² (1.94×10⁻¹¹ J through 7 mm; average 1.55 mW).
  const r = retina(nm(800), 0, { duration: 1e-13, prf: 8e7, exposure: 0.25 });
  const CA = Math.pow(10, 0.2);
  assert.equal(r.perGroup, 400);
  assert.equal(r.groupPulses, 2e7);
  assertRel(r.group, (18 * CA * Math.pow(0.25 - 1.25e-8 + 1e-13, 0.75) * A7) / 2e7, 1e-9, "rule 2");
  assert.equal(r.rule, 2);
  // Rule 3 compares 400 pulses with the limit at T_i: 18 C_A (5 µs)^0.75 / 400.
  assertRel(r.reduced, (18 * CA * Math.pow(5e-6, 0.75) * A7) / 400, 1e-12, "rule 3");
  // A 100 mrad source, 532 nm, 1 ns at 1 MHz for 10 s: groups of 5 pulses, 2×10⁶ groups within T₂ = 100 s,
  // C_P = 5·(2×10⁶)^−0.25 = 0.1330 on 18 C_E (5 µs)^0.75, C_E = 5/1.5: 1.69×10⁻⁴ J/m². Without grouping it would be
  // 5·(10⁷)^−0.25 × 2 C_E mJ/m² = 5.9×10⁻⁴. The best group, 626 pulses just past 625 µs (2400 t^1.25), allows 3.79×10⁻⁴.
  const e = retina(nm(532), 0, { duration: 1e-9, prf: 1e6, exposure: 10 }, 0.1);
  assert.equal(e.perGroup, 5);
  assert.equal(e.cpCount, 2e6);
  assertRel(e.cp, 5 * Math.pow(2e6, -0.25), 1e-12, "C_P");
  assertRel(e.reduced, (e.cp * 18 * (5 / 1.5) * Math.pow(5e-6, 0.75) * A7) / 5, 1e-12, "rule 3");
  assert.equal(e.groupPulses, 626);
  assertRel(e.group, (2400 * Math.pow(625e-6 + 1e-9, 1.25) * A7) / 626, 1e-9, "rule 2");
  assert.equal(e.rule, 3);
});

test("Rule 2 on the cornea: UV doses add; groups found as by enumeration", () => {
  // 308 nm (630 J/m² from 160 µs to 30 ks), 20 ns at 100 Hz for 100 s: 10⁴ pulses share 630 J/m² over 3.5 mm.
  const uv = pulseTrainLimits(nm(308), 0, { duration: 2e-8, prf: 100, exposure: 100 });
  assertRel(uv.qMax, (630 * A35) / 1e4, 1e-12, "308 nm");
  assert.equal(uv.rule, 2);
  // While the corneal aperture grows (0.35–10 s) the least group can sit inside a piece: compare with every n.
  const cases: [number, number, PulseTrain][] = [
    [355, 3e-3, { duration: 1e-3, prf: 100, exposure: 10 }],
    [355, 1.2e-3, { duration: 1e-6, prf: 300, exposure: 20 }],
    [2000, 2e-3, { duration: 1e-4, prf: 200, exposure: 30 }],
    [10600, 1.5e-3, { duration: 1e-2, prf: 50, exposure: 12 }],
    [1064, 5e-3, { duration: 1e-4, prf: 1000, exposure: 3 }],
    // Least group inside the piece (n = 69 of 500 at 1.36 s), and the first pair on an irradiance piece (n = 2).
    [355, 1e-3, { duration: 1e-6, prf: 50, exposure: 10 }],
    [1550, 0, { duration: 15, prf: 0.05, exposure: 100 }],
  ];
  for (const [lam, d, train] of cases) {
    const N = pulseCount(train);
    for (const [i, limit] of pulseLimits(nm(lam)).entries()) {
      let brute = Infinity;
      for (let n = 2; n <= N; n++) brute = Math.min(brute, limitMaxEnergy(limit, d, train.duration + (n - 1) / train.prf) / n);
      assertRel(pulseTrainLimits(nm(lam), d, train).limits[i].group, brute, 1e-12, `${lam} nm, ${limit.kind}`);
    }
  }
});

test("Safe diameter: the inverse in d", () => {
  // 1064 nm, 1 mJ, 10 ns at 1 kHz for 10 s: 0.385 µJ fits through 7 mm, so 1 − exp(−2D²/d²) = 3.85×10⁻⁴.
  const train = { duration: 1e-8, prf: 1e3, exposure: 10 };
  const q = (1e-2 * A7) / 1e-3;
  assertRel(pulseTrainSafeDiameter(nm(1064), 1e-3, train), 7e-3 * Math.sqrt(2 / -Math.log1p(-q)), 1e-9, "1064 nm");
  assertRel(pulseTrainLimits(nm(1064), pulseTrainSafeDiameter(nm(1064), 1e-3, train), train).qMax, 1e-3, 1e-9, "at d");
  // Already within with all of it inside: 0.
  assert.equal(pulseTrainSafeDiameter(nm(1064), 1e-7, train), 0);
  assert.ok(Number.isNaN(pulseTrainSafeDiameter(nm(1064), -1, train)));
});
