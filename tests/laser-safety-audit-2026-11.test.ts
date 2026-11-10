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
  // The audit's figure for 1550 nm at 10 s: 1.53 W (rule 2).
  assertRel(standard.outputs.maxPowerScanned as number, 1530, 5e-3, "1550 nm, 10 s");
  assert.equal(standard.outputs.bindingRule, 2);
  // 355 nm: 30 000 s.
  assert.equal(run(scan, { wavelength: 355 }).outputs.exposureUsed, 30000);
  // A shorter time entered for an invisible beam is used, with a warning; none when it is as long.
  const short = run(scan, { wavelength: 905, exposureBasis: "custom", exposureTime: 0.25 });
  assert.equal(short.outputs.exposureUsed, 0.25);
  assert.ok(short.warnings.some((w) => w.includes("10 s") && w.includes("no aversion response")), short.warnings.join(" | "));
  const long = run(scan, { wavelength: 905, exposureBasis: "custom", exposureTime: 100 });
  assert.ok(!long.warnings.some((w) => w.includes("less conservative")));
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
