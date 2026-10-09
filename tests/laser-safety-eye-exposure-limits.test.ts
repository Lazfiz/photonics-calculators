import test from "node:test";
import assert from "node:assert/strict";

import {
  apertureIrradiance, correctionCA, correctionCB, correctionCC, exposureDuration, exposureLimit, eyeLimits,
  limitingAperture, limitMaxDuration, T_MAX, T_MIN, type EyeLimit, type EyeLimitKind,
} from "../src/physics/laser-safety/eye-exposure-limits";

// Limits: ICNIRP, Health Phys. 105(3), 271–295 (2013), doi:10.1097/HP.0b013e3182983fd4, Tables 3, 5, 7 and 8.

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = (x: number) => x * 1e-9;
const area = (D: number) => (Math.PI * D * D) / 4;
const limitOf = (lambda: number, kind: EyeLimitKind): EyeLimit => {
  const l = eyeLimits(lambda).find((x) => x.kind === kind);
  assert.ok(l, `no ${kind} limit at ${lambda} m`);
  return l;
};
/** A beam 1 m wide: over a ≤ 11 mm aperture it is a uniform irradiance E to ~1e-4. */
const uniform = (E: number) => ({ P: (E * Math.PI) / 8, d: 1 });

test("correction factors, ICNIRP 2013 Table 3", () => {
  assert.equal(correctionCA(nm(532)), 1);
  assertRel(correctionCA(nm(905)), Math.pow(10, 0.41), 1e-12, "C_A at 905 nm");
  assert.equal(correctionCA(nm(1064)), 5);
  assert.equal(correctionCB(nm(445)), 1);
  assertRel(correctionCB(nm(500)), 10, 1e-12, "C_B at 500 nm");
  assert.equal(correctionCC(nm(1100)), 1);
  assertRel(correctionCC(nm(1175)), Math.pow(10, 0.45), 1e-12, "C_C at 1175 nm");
  assertRel(correctionCC(nm(1250)), 9, 1e-12, "C_C at 1250 nm");
  assertRel(correctionCC(nm(1300)), 108, 1e-12, "C_C at 1300 nm");
  // The two C_C branches meet at 1200 nm to 1 % (7.94 vs 8.01).
  assertRel(correctionCC(nm(1199.999)), correctionCC(nm(1200)), 0.01, "C_C at 1200 nm");
});

test("which limits apply, and their apertures (Tables 5, 7, 8)", () => {
  const kinds = (l: number) => eyeLimits(nm(l)).map((x) => x.kind).sort().join(",");
  assert.equal(kinds(399.9), "cornealUv");
  assert.equal(kinds(400), "retinalPhotochemical,retinalThermal");
  assert.equal(kinds(600), "retinalThermal");
  assert.equal(kinds(1149), "retinalThermal");
  assert.equal(kinds(1150), "anteriorSegment,retinalThermal");
  assert.equal(kinds(1400), "cornealIr");
  assert.equal(eyeLimits(nm(179)).length, 0);
  assert.equal(eyeLimits(1e-3).length, 1);
  assert.equal(eyeLimits(1.001e-3).length, 0);
  const uv = limitOf(nm(350), "cornealUv");
  assert.equal(limitingAperture(uv, 0.1), 1e-3);
  assertRel(limitingAperture(uv, 1), 1.5e-3, 1e-12, "1.5 t^0.375 mm at 1 s");
  assert.equal(limitingAperture(uv, 100), 3.5e-3);
  assert.equal(limitingAperture(limitOf(nm(532), "retinalThermal"), 100), 7e-3);
  assert.equal(limitingAperture(limitOf(nm(1350), "anteriorSegment"), 100), 3.5e-3);
  assertRel(limitingAperture(limitOf(50e-6, "cornealIr"), 1), 1.5e-3, 1e-12, "50 µm");
  assert.equal(limitingAperture(limitOf(200e-6, "cornealIr"), 1), 11e-3);
  assert.ok(Number.isNaN(limitingAperture(uv, 4e4)));
});

test("limit values from Table 5 (and the UV laser MPE of IEC 60825-1:2014 Table A.1)", () => {
  const uv = (l: number) => limitOf(nm(l), "cornealUv");
  assert.equal(exposureLimit(uv(254), 1), 30);
  // 310 nm: C₂ = 10^(0.2·15) = 1000 J/m²; C₁(1 µs) = 5.6e3·10^(−1.5) = 177.1 J/m².
  assertRel(exposureLimit(uv(310), 1e-6), 5.6e3 * Math.pow(10, -1.5), 1e-12, "C₁ at 310 nm, 1 µs");
  assertRel(exposureLimit(uv(310), 1), 1000, 1e-12, "C₂ at 310 nm");
  // 350 nm: C₁ to 10 s, 10⁴ J/m² to 1000 s, then 10 W/m².
  assertRel(exposureLimit(uv(350), 1), 5600, 1e-12, "350 nm, 1 s");
  assert.equal(exposureLimit(uv(350), 100), 1e4);
  assertRel(exposureLimit(uv(350), 1e4), 1e5, 1e-12, "350 nm, 10⁴ s");
  const vis = limitOf(nm(532), "retinalThermal");
  assert.equal(exposureLimit(vis, 1e-6), 2e-3);
  assertRel(exposureLimit(vis, 0.25), 18 * Math.pow(0.25, 0.75), 1e-12, "18 t^0.75 at 0.25 s");
  assertRel(exposureLimit(vis, 100), 1000, 1e-12, "10 W/m² for 100 s");
  assert.ok(Number.isNaN(exposureLimit(limitOf(nm(445), "retinalPhotochemical"), 5)), "no photochemical limit below 10 s");
  assertRel(exposureLimit(limitOf(nm(480), "retinalPhotochemical"), 50), 100 * Math.pow(10, 0.6), 1e-12, "100 C_B at 480 nm");
  assertRel(exposureLimit(limitOf(nm(1064), "retinalThermal"), 1), 90, 1e-12, "90 t^0.75 at 1064 nm");
  assertRel(exposureLimit(limitOf(nm(1064), "retinalThermal"), 1e-5), 2e-2, 1e-12, "2×10⁻² J/m² below 13 µs");
  assertRel(exposureLimit(limitOf(nm(1350), "anteriorSegment"), 1e3), 2e7, 1e-12, "2 × 2 C_A kW/m² for 1000 s");
  assert.equal(exposureLimit(limitOf(nm(1550), "cornealIr"), 1), 1e4);
  assertRel(exposureLimit(limitOf(nm(2000), "cornealIr"), 1), 5600, 1e-12, "2 µm, 1 s");
  assert.equal(exposureLimit(limitOf(10.6e-6, "cornealIr"), 1e-8), 100);
});

test("every limit is continuous to 6 % where its pieces join (catches transcription errors)", () => {
  // The tables round the joints: 18·(5 µs)^0.75 = 1.90e-3 vs 2e-3 is the largest step (5 %).
  for (const l of [180, 254, 302.5, 305, 310, 314.9, 350, 400, 445, 480, 532, 599, 700, 808, 1050, 1064, 1175,
    1300, 1399, 1400, 1550, 2000, 3000, 10600, 2e5]) {
    for (const limit of eyeLimits(nm(l))) {
      for (const s of limit.pieces.slice(1)) {
        const t = s.t0;
        const left = exposureLimit(limit, t * (1 - 1e-12));
        assertRel(exposureLimit(limit, t), left, 0.06, `${limit.kind} at ${l} nm, t = ${t} s`);
      }
    }
  }
});

test("Gaussian beam averaged over an aperture", () => {
  // All the power inside: P/(πD²/4). Peak of a wide beam: 8P/(πd²). d = D: 1 − e⁻² of the power.
  assertRel(apertureIrradiance(1e-3, 0, 7e-3), 1e-3 / area(7e-3), 1e-12, "point beam");
  assertRel(apertureIrradiance(1, 1, 1e-4), 8 / Math.PI, 1e-6, "wide beam → peak");
  assertRel(apertureIrradiance(1, 2e-3, 2e-3), (1 - Math.exp(-2)) / area(2e-3), 1e-12, "d = D");
  assert.ok(Number.isNaN(apertureIrradiance(-1, 1e-3, 7e-3)));
});

test("visible: Class 2 at 0.25 s, the page default, photochemical and the 10 s joint", () => {
  // IEC 60825-1 Class 2: ≈ 1 mW for 0.25 s. From Table 5: 18·0.25^0.75 J/m² / 0.25 s over 7 mm = 0.98 mW.
  const P2 = ((18 * Math.pow(0.25, 0.75)) / 0.25) * area(7e-3);
  assertRel(P2, 1e-3, 0.03, "Class 2 power");
  assertRel(exposureDuration(nm(532), P2, 0).tMax, 0.25, 1e-9, "Class 2 at 532 nm");
  // Page default: 100 mW, 3 mm (1/e²), 532 nm. E over 7 mm = 0.1(1 − e^(−2·49/9))/(π·3.5²/4 mm²) = 2598 W/m²;
  // 2×10⁻³ J/m² is reached at 0.77 µs (the page showed "0.0 µs").
  const def = exposureDuration(nm(532), 0.1, 3e-3);
  const E = (0.1 * (1 - Math.exp(-98 / 9))) / area(7e-3);
  assertRel(def.tMax, 2e-3 / E, 1e-9, "default");
  assertRel(def.tMax, 7.697e-7, 1e-3, "default, 0.77 µs");
  assert.equal(def.limiting, "retinalThermal");
  // Photochemical, 5 W/m² (below the 10 W/m² thermal limit): 100 C_B / E.
  const P5 = 5 * area(7e-3);
  const r445 = exposureDuration(nm(445), P5, 0);
  assertRel(r445.tMax, 20, 1e-9, "445 nm");
  assert.equal(r445.limiting, "retinalPhotochemical");
  assertRel(exposureDuration(nm(480), P5, 0).tMax, (100 * Math.pow(10, 0.6)) / 5, 1e-9, "480 nm");
  assert.equal(exposureDuration(nm(500), P5, 0).tMax, Infinity, "C_B = 10 at 500 nm: 10 W/m²");
  assert.equal(exposureDuration(nm(500), P5, 0).limiting, null);
  // 10.05 W/m²: 18 t^0.75 holds to 10 s ((18/10.05)⁴ = 10.3 s), then 10 W/m² is exceeded at once.
  assert.equal(exposureDuration(nm(650), 10.05 * area(7e-3), 0).tMax, 10);
  assert.equal(exposureDuration(nm(650), 9.99 * area(7e-3), 0).tMax, Infinity);
});

test("near IR: C_A, C_C and the anterior-segment limit", () => {
  // 1064 nm, 10 mW inside 7 mm: 90 t^0.75 → t = (90/E)⁴ (the page used C_A ≈ 1.0 instead of 5).
  const E = 0.01 / area(7e-3);
  assertRel(exposureDuration(nm(1064), 0.01, 0).tMax, Math.pow(90 / E, 4), 1e-9, "1064 nm");
  // 808 nm, 15 W/m²: below 10 C_A = 16.4 W/m², so within the limit (the page capped t at 100 s).
  assert.equal(exposureDuration(nm(808), 15 * area(7e-3), 0).tMax, Infinity);
  // 1350 nm, 0.2 W: C_C = 8 + 10⁴ puts the retina out of reach; 2 × skin over 3.5 mm: 1.1×10⁵ t^0.25 J/m².
  const r = exposureDuration(nm(1350), 0.2, 0);
  assert.equal(r.limiting, "anteriorSegment");
  assertRel(r.tMax, Math.pow(1.1e5 / (0.2 / area(3.5e-3)), 4 / 3), 1e-9, "1350 nm");
  assertRel(r.tMax, 9.22, 1e-3, "1350 nm, 9.22 s");
  assert.equal(r.limits.find((l) => l.kind === "retinalThermal")?.tMax, Infinity);
});

test("mid and far IR: limits with the time-dependent aperture", () => {
  // 1550 nm, 1 W, d = 0.5 mm: over 1 mm, E = (1 − e⁻⁸)/(π·0.25 mm²); 10⁴ J/m² at 7.86 ms (the page: 0.2 ms).
  const E = (1 - Math.exp(-8)) / area(1e-3);
  assertRel(exposureDuration(nm(1550), 1, 0.5e-3).tMax, 1e4 / E, 1e-9, "1550 nm, 1 W");
  // 1550 nm, 10 mW inside the aperture: past 0.35 s, E·t = 0.04 t^0.25/(π·(1.5 mm)²) reaches 10⁴ J/m² at
  // t = (10⁴·π·(1.5 mm)²/0.04)⁴ = 9.75 s.
  const t1550 = Math.pow((1e4 * Math.PI * 2.25e-6) / 0.04, 4);
  assertRel(t1550, 9.7517, 1e-4, "closed form");
  assertRel(exposureDuration(nm(1550), 0.01, 0).tMax, t1550, 1e-9, "1550 nm, 10 mW");
  // 10.6 µm, 10 mW: 12 732 W/m² over 1 mm meets 5.6×10³ t^0.25 at t = (5600·π(0.5 mm)²/0.01)^(4/3) = 0.335 s.
  assertRel(exposureDuration(10.6e-6, 0.01, 0).tMax, Math.pow((5600 * area(1e-3)) / 0.01, 4 / 3), 1e-9, "10.6 µm");
  // 1450 nm, 10 W: 10³ J/m² below 1 ms.
  assertRel(exposureDuration(nm(1450), 10, 0).tMax, 1e3 / (10 / area(1e-3)), 1e-9, "1450 nm");
});

test("UV laser MPE durations at a uniform irradiance (IEC 60825-1:2014 Table A.1)", () => {
  const t = (l: number, E: number) => exposureDuration(nm(l), uniform(E).P, uniform(E).d).tMax;
  assertRel(t(254, 100), 0.3, 1e-4, "254 nm, 100 W/m²");
  assertRel(t(350, 1e3), Math.pow(5.6, 4 / 3), 1e-4, "350 nm, 1 kW/m² (C₁)");
  assertRel(t(350, 100), 100, 1e-4, "350 nm, 100 W/m² (10⁴ J/m²)");
  assertRel(t(310, 1e4), 0.1, 1e-4, "310 nm, 10 kW/m² (C₂)");
  assertRel(t(310, 10), 100, 1e-4, "310 nm, 10 W/m²");
  assert.equal(t(350, 5), Infinity);
  assert.equal(t(254, 1e-4), Infinity);
});

test("edges: no power, bad input, exceeded within 1 ns, outside the table", () => {
  assert.equal(exposureDuration(nm(532), 0, 3e-3).tMax, Infinity);
  assert.ok(Number.isNaN(exposureDuration(nm(532), -1, 3e-3).tMax));
  assert.ok(Number.isNaN(exposureDuration(nm(532), 1, -1).tMax));
  // 254 nm, 10¹² W/m²: 30 J/m² within 30 ps.
  assert.ok(Number.isNaN(exposureDuration(nm(254), uniform(1e12).P, 1).tMax));
  const out = exposureDuration(nm(170), 1e-3, 1e-3);
  assert.ok(Number.isNaN(out.tMax));
  assert.equal(out.limits.length, 0);
});

test("the solver agrees with a scan of E(t)·t > H(t) over 1 ns – 30 ks", () => {
  const steps = 200 * 14;
  const grid = Array.from({ length: steps + 1 }, (_, i) => T_MIN * Math.pow(T_MAX / T_MIN, i / steps));
  const cases: [number, number, number][] = [
    [254, 1e-6, 0], [310, 1e-3, 2e-3], [350, 1e-3, 0], [350, 0.05, 5e-3], [445, 2e-4, 0], [480, 3e-4, 4e-3],
    [532, 1e-3, 1e-3], [532, 0.1, 3e-3], [650, 3.9e-4, 0], [808, 1e-3, 2e-3], [1064, 0.05, 1e-3],
    [1300, 0.5, 2e-3], [1350, 0.2, 0], [1550, 0.01, 0], [1550, 0.05, 2e-3], [1550, 0.2, 8e-3],
    [2000, 0.02, 0.5e-3], [10600, 0.01, 0], [10600, 0.3, 4e-3], [2e5, 0.1, 5e-3],
  ];
  for (const [l, P, d] of cases) {
    for (const limit of eyeLimits(nm(l))) {
      const tMax = limitMaxDuration(limit, P, d);
      const i = grid.findIndex((t) => apertureIrradiance(P, d, limitingAperture(limit, t)) * t > exposureLimit(limit, t));
      const label = `${limit.kind} at ${l} nm, ${P} W, ${d} m: ${tMax}`;
      if (i === -1) assert.equal(tMax, Infinity, label);
      else if (i === 0) assert.ok(Number.isNaN(tMax), label);
      else assert.ok(tMax > grid[i - 1] * (1 - 1e-9) && tMax <= grid[i] * (1 + 1e-9), `${label}, scan ${grid[i]}`);
    }
  }
});
