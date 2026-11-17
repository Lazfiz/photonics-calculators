import test from "node:test";
import assert from "node:assert/strict";

import { AVERSION_TIME, unintendedExposureTime } from "../src/physics/laser-safety/aversion-response";
import { classifyCw, condition1MayRaiseClass } from "../src/physics/laser-safety/laser-classes";
import { schemas } from "../src/schemas";
import { parseInputs, runSchema } from "../src/schemas/run";
import type { CalculatorSchema } from "../src/schemas/types";

// Fixes from docs/audit/fable-2026-11-laser-safety.md (U2, U3, U4, E1; U1 is in laser-safety-hazard-distance.test.ts).
// Sources: ICNIRP, Health Phys. 105(3), 271–295 (2013), doi:10.1097/HP.0b013e3182983fd4: p. 286 (exposure durations
// for unintended viewing), Table 5 (eye), Table 7 (skin), Table 8 (apertures). IEC 60825-1:2014 (Class AELs, Conditions 1
// and 3); EN 60825-1:2014/A11:2021 (K. Schulmeister, "The European Amendment A11:2021 to EN 60825-1", white paper, 2022).

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const schema = (href: string) => schemas.find((s) => s.href === href)!;
function run(s: CalculatorSchema, inputs: Record<string, number | string>) {
  const parsed = parseInputs(s, new URLSearchParams(Object.entries(inputs).map(([k, v]) => [k, String(v)])));
  assert.ok(parsed.ok, `${s.href}: ${!parsed.ok && parsed.error}`);
  return runSchema(s, parsed.values);
}

test("U4: exposure time for unintended viewing (ICNIRP 2013 p. 286)", () => {
  // 0.25 s at 400–700 nm (the aversion response), 10 s at 700–1400 nm; T_max elsewhere: 10 s above 1400 nm (1 kW/m²
  // from 10 s on, Table 5), 30 000 s below 400 nm (Table 5's longest time).
  assert.equal(unintendedExposureTime(532e-9), AVERSION_TIME);
  assert.equal(unintendedExposureTime(400e-9), 0.25, "400 nm edge");
  assert.equal(unintendedExposureTime(700 * 1e-9), 0.25, "700 nm edge");
  assert.equal(unintendedExposureTime(701e-9), 10);
  assert.equal(unintendedExposureTime(905e-9), 10);
  assert.equal(unintendedExposureTime(1400e-9), 10);
  assert.equal(unintendedExposureTime(1550e-9), 10);
  assert.equal(unintendedExposureTime(10.6e-6), 10);
  assert.equal(unintendedExposureTime(355e-9), 30000);
  assert.equal(unintendedExposureTime(399e-9), 30000);
  assert.ok(Number.isNaN(unintendedExposureTime(100e-9)), "below 180 nm");
  assert.ok(Number.isNaN(unintendedExposureTime(2e-3)), "above 1 mm");
});

test("U4: the scanning page uses the standard time unless a time is entered, and warns when it is shorter", () => {
  const scan = schema("/laser-safety/scanning-mpe");
  // At 532 nm the default is unchanged: 0.25 s.
  assert.equal(run(scan, {}).outputs.exposureUsed, 0.25);
  // 1550 nm: 10 s, the same as entering 10 s.
  const standard = run(scan, { wavelength: 1550 });
  const entered = run(scan, { wavelength: 1550, exposureBasis: "custom", exposureTime: 10 });
  assert.equal(standard.outputs.exposureUsed, 10);
  assert.equal(standard.outputs.maxPowerScanned, entered.outputs.maxPowerScanned);
  assert.equal(standard.outputs.bindingRule, 2);
  // The audit's figure for 1550 nm at 10 s, 1.53 W (rule 2), is for a 2 mm beam at the eye (linear growth, 1 + 1 mm);
  // with Gaussian growth a √3 mm beam is 2 mm at 1 m: √(3 + 1).
  const twoMm = run(scan, { wavelength: 1550, beamDiam: Math.sqrt(3) });
  assertRel(twoMm.outputs.maxPowerScanned as number, 1530, 5e-3, "1550 nm, 10 s, 2 mm at the eye");
  // 355 nm: 30 000 s.
  assert.equal(run(scan, { wavelength: 355 }).outputs.exposureUsed, 30000);
  // A shorter time entered for an invisible beam is used, with a warning; none when it is as long.
  const short = run(scan, { wavelength: 905, exposureBasis: "custom", exposureTime: 0.25 });
  assert.equal(short.outputs.exposureUsed, 0.25);
  assert.ok(short.warnings.some((w) => w.includes("10 s") && w.includes("no aversion response")), short.warnings.join(" | "));
  const long = run(scan, { wavelength: 905, exposureBasis: "custom", exposureTime: 100 });
  assert.ok(!long.warnings.some((w) => w.includes("less conservative")));
});

test("U1 on the scanning page: the beam grows as √(d² + (rφ)²)", () => {
  // 2 mm at the scanner (the default), 1 mrad, 1 m: √(4 + 1) mm, the same beam as √5 mm with no divergence.
  const scan = schema("/laser-safety/scanning-mpe");
  const grown = run(scan, {});
  const fixed = run(scan, { beamDiam: Math.sqrt(5), divergence: 0 });
  assertRel(grown.outputs.maxPowerScanned as number, fixed.outputs.maxPowerScanned as number, 1e-12, "scanned");
  assertRel(grown.outputs.passDuration as number, fixed.outputs.passDuration as number, 1e-12, "pass");
});

test("U2 on the AEL page: the EU A11 values are outputs of their own, with no toggle", () => {
  const ael = schema("/laser-safety/ael-limits");
  assert.ok(!ael.inputs.some((i) => i.key === "euA11"));
  // 1310 nm, CW: A11's skin AEL through 1 mm at 0.35 s, 1.1×10⁴·5·0.35^0.25/0.35 J/(m²·s) × π(1 mm)²/4 = 94.93 mW,
  // caps Class 1 (IEC alone: the 3B cap, 0.5 W).
  const cap = (5.5e4 * Math.pow(0.35, -0.75) * Math.PI * 1e-6) / 4;
  const r = run(ael, { wavelength: 1310 });
  assertRel(r.outputs.cw1A11 as number, cap * 1e3, 1e-9, "Class 1, EU");
  assertRel(r.outputs.cw3R as number, 500, 1e-9, "Class 3R, IEC");
  assert.ok(r.warnings.some((w) => w.includes("In the EU") && w.includes("unverified")), r.warnings.join(" | "));
  // Verification W2 (2026-11-17): the AEL page, its API warning and the classification agree on Class 3R under A11.
  // The white paper adds one skin-AEL table to Classes 1, 1M and 3R with no factor; we take 3R at 1×, the cautious
  // reading (5 × Class 1 would allow ≈ 475 mW). So 3R is capped at the same 94.93 mW, and the warning names both.
  assertRel(r.outputs.cw3RA11 as number, cap * 1e3, 1e-9, "Class 3R, EU");
  // One 1 s emission: through 1.5 mm, 5.5×10⁴ J/m² × π(0.75 mm)² = 0.09719 J for both classes (IEC alone: 0.5 J).
  const one = run(ael, { wavelength: 1310, emissionDuration: 1 });
  assertRel(one.outputs.energy3RA11 as number, 5.5e4 * Math.PI * 0.75e-3 ** 2, 1e-9, "Class 3R, EU, 1 s");
  assertRel(one.outputs.energy3R as number, 0.5, 1e-9, "Class 3R, IEC, 1 s");
  // 10 ns (the default duration): the skin limit is 200 C_A = 1000 J/m² below 100 ns (ICNIRP 2013 Table 7), through
  // 1 mm 1000 × π(0.5 mm)² = 0.7854 mJ (white paper: 7.9×10⁻⁴ J). That caps 3R (IEC 5 × 0.1995 = 0.9975 mJ) but not
  // Class 1 (0.1995 mJ): for one 10 ns emission only the 3R value changes (both CW values do).
  assertRel(r.outputs.energy3RA11 as number, 1000 * Math.PI * 0.5e-3 ** 2, 1e-9, "Class 3R, EU, 10 ns");
  assertRel(r.outputs.energy3R as number, 5 * (r.outputs.energy1 as number), 1e-12, "Class 3R, IEC, 10 ns");
  assert.equal(r.outputs.energy1A11, r.outputs.energy1);
  assert.ok(r.warnings.some((w) => w.includes("In the EU") && w.includes("Class 1 / 1M and Class 3R")), r.warnings.join(" | "));
  const cls = run(schema("/laser-safety/classification"), { power: 200, wavelength: 1310 });
  assert.equal(cls.outputs.classRank, 1, "200 mW at 1310 nm: IEC Class 1");
  assert.equal(cls.outputs.classRankA11, 6, "200 mW at 1310 nm: above the 1× 3R cap in the EU, so 3B");
  assert.ok(200 > (r.outputs.cw3RA11 as number), "the AEL page's 3R A11 value agrees with that class");
  // Every A11 output says it is unverified.
  const a11 = ael.outputs.filter((o) => o.key.endsWith("A11"));
  assert.equal(a11.length, 6);
  assert.ok(a11.every((o) => o.label.includes("unverified: A11 text not read")));
  // Outside 1250–1400 nm the two agree and nothing is said.
  const d = run(ael, {});
  assert.equal(d.outputs.cw1A11, d.outputs.cw1);
  assert.equal(d.outputs.energy1A11, d.outputs.energy1);
  assert.equal(d.outputs.cw3RA11, d.outputs.cw3R);
  assert.ok(!d.warnings.some((w) => w.includes("In the EU")));
});

// Verification 2026-11 W4: the scanning page's absolute values, against a brute-force reference that does not call
// src/physics: docs/audit/fable-verify-probes/pr289/probe-scan.ts on review/fable-verify-2026-11 (2-D midpoint quadrature
// of a round Gaussian beam crossing the aperture, pass duration = FWHM of the power through it, pass energy P·L/v; ICNIRP
// 2013 Table 5 limits and Table 8 apertures typed in by hand; rules 1 and 2 of p. 287 by enumeration). The quadrature is
// good to about 1e-4, hence the tolerances. Scan: 30°, 100 Hz both ways, eye at 1 m.
test("W4: scanning P_max against the brute-force pass model", () => {
  const scan = schema("/laser-safety/scanning-mpe");
  // Beam √2 mm at the eye (1 mm, 1 mrad, 1 m, Gaussian growth). 532 nm, 0.25 s: rule 1, 7.6722 mW (linear growth, a
  // 2 mm beam, gave 7.682). 1550 nm, 10 s: rule 2 over all 2000 passes, 1492.98 mW (linear: 1527.6).
  const r532 = run(scan, { beamDiam: 1, divergence: 1 });
  assertRel(r532.outputs.maxPowerScanned as number, 7.6722, 3e-4, "532 nm, √2 mm");
  assert.equal(r532.outputs.bindingRule, 1);
  const r1550 = run(scan, { wavelength: 1550, beamDiam: 1, divergence: 1 });
  assertRel(r1550.outputs.maxPowerScanned as number, 1492.98, 1e-4, "1550 nm, √2 mm");
  assert.equal(r1550.outputs.bindingRule, 2);
  assert.equal(r1550.outputs.passes, 2000);
  // The defaults since M9 (2 mm at the scanner, √5 mm at the eye): 7.6878 mW and 1547.13 mW by the same quadrature.
  assertRel(run(scan, {}).outputs.maxPowerScanned as number, 7.6878, 3e-4, "532 nm, √5 mm");
  assertRel(run(scan, { wavelength: 1550 }).outputs.maxPowerScanned as number, 1547.13, 1e-4, "1550 nm, √5 mm");
});

test("W4: scanning P_max never falls as the beam at the eye grows", () => {
  // A wider beam spreads the same power over a larger area and a longer pass, so the allowed power can only rise. Five
  // wavelengths (UV, visible, near-IR, the 1250–1400 nm band, far-IR) × five variants × 61 sizes from 0.3 to 20 mm.
  const scan = schema("/laser-safety/scanning-mpe");
  const variants: Record<string, number | string>[] = [
    {}, { alpha: 100 }, { exposureBasis: "custom", exposureTime: 10 }, { scanDirection: "one" }, { workingDistance: 10 },
  ];
  for (const wavelength of [355, 532, 905, 1310, 1550]) {
    for (const v of variants) {
      let prev = 0;
      for (let i = 0; i <= 60; i++) {
        const d = 0.3 * Math.pow(20 / 0.3, i / 60);
        const p = run(scan, { wavelength, beamDiam: d, divergence: 0, ...v }).outputs.maxPowerScanned as number;
        assert.ok(Number.isFinite(p), `${wavelength} nm ${JSON.stringify(v)} ${d} mm: ${p}`);
        assert.ok(p >= prev * (1 - 1e-9), `${wavelength} nm ${JSON.stringify(v)}: ${prev} → ${p} mW at ${d.toFixed(3)} mm`);
        prev = p;
      }
    }
  }
});

test("W4 / M3 at the API: below 1 ns the anterior-segment limit binds at 1399 nm", () => {
  // One 500 ps pulse, 2 mm beam. Anterior segment (ICNIRP 2013 Table 5 note d, twice the skin limit; C_A = 5 above
  // 1050 nm): 2 · 200 · 5 = 2000 J/m² at 1 ns, 10 % below 1 ns (p. 287) = 200 J/m², through the 3.5 mm aperture, of
  // which the 2 mm beam puts 1 − e^(−2(3.5/2)²) inside: 200·π(1.75 mm)²/(1 − e^−6.125) = 1928.44 µJ. Retinal (Table 5,
  // 10 ps–13 µs at 1050–1400 nm): 20 C_C mJ/m², C_C = 8 + 10^(0.04(1399 − 1250)) = 912.0, through 7 mm: 0.70197 J,
  // 364× more, so the anterior limit binds. Before M3 the held irradiance gave 1000 J/m², 9642 µJ.
  const pulsed = schema("/laser-safety/pulsed-mpe");
  const r = run(pulsed, { wavelength: 1399, pulseDuration: 0.5, prf: 0, exposureTime: 5e-10, beamDiam: 2 });
  const anterior = (200 * Math.PI * 1.75e-3 ** 2) / -Math.expm1(-2 * (3.5 / 2) ** 2);
  assertRel(r.outputs.maxPulseEnergy as number, anterior * 1e6, 1e-9, "1399 nm, 500 ps, µJ");
  const retinal = 0.02 * (8 + Math.pow(10, 0.04 * (1399 - 1250))) * Math.PI * 3.5e-3 ** 2;
  assertRel(retinal, 0.70197, 1e-4, "retinal hand value");
  assert.ok(retinal / anterior > 300);
  // The same through the ultrafast page's API (one 500 ps pulse, 2 mm beam).
  const fast = run(schema("/laser-safety/ultrafast-laser-safety"), {
    wavelength: 1399, repRate: 0, pulseWidth: 5e5, beamDia: 2, divergence: 0, exposureTime: 5e-10,
  });
  assertRel(fast.outputs.maxPulseEnergy as number, anterior * 1e6, 1e-9, "ultrafast, 1399 nm, 500 ps, µJ");
});

test("U3: the scanning API carries the page's scan-centre and turning-point caveats", () => {
  const { warnings, outputs } = run(schema("/laser-safety/scanning-mpe"), {});
  assert.ok(Number.isFinite(outputs.maxPowerScanned));
  assert.ok(warnings.some((w) => w.includes("centre of the scan line")), warnings.join(" | "));
  assert.ok(warnings.some((w) => w.includes("turning points")), warnings.join(" | "));
});

test("U2: the EU A11 class is reported next to IEC's", () => {
  // 1310 nm, 400 mW, 1 mm, 1 mrad: IEC Class 1 (limit 0.4987 W). A11's skin AEL (ICNIRP Table 7, C_A = 5) through the
  // corneal stop, all of the beam inside the 50 mm Condition 1 stop: least at 0.35 s through 1 mm,
  // 1.1×10⁴·5·0.35^0.25 J/m² / 0.35 s × π(1 mm)²/4 = 94.93 mW, so Class 3B in the EU.
  const beam = { d: 1e-3, phi: 1e-3 };
  const iec = classifyCw(1310e-9, 0.4, beam, { alpha: 1.5e-3 });
  const eu = classifyCw(1310e-9, 0.4, beam, { alpha: 1.5e-3, euA11: true });
  assert.equal(iec.laserClass, "1");
  assert.equal(eu.laserClass, "3B");
  const cap = 5.5e4 * Math.pow(0.35, -0.75) * (Math.PI * 1e-6) / 4;
  assertRel(cap, 94.93e-3, 1e-4, "hand value");
  assertRel(eu.checks[0].condition1!.power, cap, 1e-9, "A11 Class 1 cap, Condition 1");
  const r = run(schema("/laser-safety/classification"), { power: 400, wavelength: 1310 });
  assert.equal(r.outputs.classRank, 1);
  assert.equal(r.outputs.classRankA11, 6);
  assert.ok(r.warnings.some((w) => w.includes("In the EU") && w.includes("Class 3B")), r.warnings.join(" | "));
  // The toggle is gone: A11 is no longer an input.
  assert.ok(!schema("/laser-safety/classification").inputs.some((i) => i.key === "euA11"));
  // Outside 1250–1400 nm the two agree and nothing is said.
  const d = run(schema("/laser-safety/classification"), {});
  assert.equal(d.outputs.classRank, d.outputs.classRankA11);
  assert.ok(!d.warnings.some((w) => w.includes("In the EU")));
});

test("E1 stopgap: Condition 1 not evaluated outside 400–1400 nm is flagged for a beam wider than the Condition 3 stop", () => {
  const cls = schema("/laser-safety/classification");
  // 1550 nm, 30 mm, 0.1 mrad (audit E1): d3 = 30.0 mm on the 3.5 mm corneal stop from 10 s, which passes
  // 1 − exp(−2(3.5/30)²) = 2.686 % of it, so Class 1 allows 9.6211 mW / 0.02686 = 358 mW. A telescope would collect
  // far more: 100 mW is Class 1 here and 1 W Class 3R, both with the warning.
  const pass = -Math.expm1(-2 * (3.5 / 30) ** 2);
  const at100 = run(cls, { power: 100, wavelength: 1550, beamDia: 30, divergence: 0.1 });
  assert.equal(at100.outputs.classRank, 1);
  assertRel(at100.outputs.class1Max as number, (1e3 * Math.PI * 3.5e-3 ** 2) / 4 / pass * 1e3, 1e-6, "Class 1 limit, mW");
  assert.ok(at100.warnings.some((w) => w.startsWith("Condition 1 (telescope viewing) not evaluated")), at100.warnings.join(" | "));
  const at1W = run(cls, { power: 1000, wavelength: 1550, beamDia: 30, divergence: 0.1 });
  assert.equal(at1W.outputs.classRank, 5);
  assert.ok(at1W.warnings.some((w) => w.includes("class may be higher")), "3R gets the warning too");
  // The default 1 mm beam fits the stop: no warning. Indoor-only (no Condition 1): no warning. 532 nm: Condition 1 is
  // modelled, so the class already includes it.
  assert.ok(!run(cls, {}).warnings.some((w) => w.includes("Condition 1")));
  assert.ok(!run(cls, { power: 100, wavelength: 1550, beamDia: 30, divergence: 0.1, telescopes: 0 }).warnings.some((w) => w.includes("Condition 1")));
  assert.equal(condition1MayRaiseClass(532e-9, 30e-3), false);
  // Edge: a beam just over 2/3 of the 3.5 mm stop raises the limit by more than 1 %; just under, not.
  assert.equal(condition1MayRaiseClass(1550e-9, 2.5e-3), true);
  assert.equal(condition1MayRaiseClass(1550e-9, 2.0e-3), false);
  // UV (350 nm, IEC's 1 mm stop): a 1 mm beam already loses 13.5 % to it.
  assert.equal(condition1MayRaiseClass(350e-9, 1e-3), true);
});
