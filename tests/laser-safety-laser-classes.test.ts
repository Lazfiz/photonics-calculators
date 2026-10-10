import test from "node:test";
import assert from "node:assert/strict";

import {
  aelEnergy, classAels, classifyCw, cwClassLimit, exposureLimitEnergy, timeBase,
} from "../src/physics/laser-safety/laser-classes";

// Tabulated values: IEC 60825-1:1993+A1:1997+A2:2001, Tables 1 (Class 1), 2 (Class 2), 3 (Class 3R), 4 (Class 3B),
// 4.3 e) (time bases); unchanged in IEC 60825-1:2014 for CW below 1250 nm and for Class 3B (K. Schulmeister, "The new
// edition of the international laser product safety standard IEC 60825-1", white paper, Seibersdorf Laboratories,
// 2017). Retinal and corneal limits: ICNIRP, Health Phys. 105(3), 271–295 (2013), doi:10.1097/HP.0b013e3182983fd4,
// Tables 3, 5, 8. 1250–1400 nm: Schulmeister 2017 (Class 3B cap, 1310 nm crossover) and "The European Amendment A11:2021
// to EN 60825-1" (white paper, 2022; skin AEL 0.1 W from 0.35 s).

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = (x: number) => x * 1e-9;
const A7 = Math.PI * 3.5e-3 * 3.5e-3; // m², 7 mm stop
const A1 = Math.PI * 0.5e-3 * 0.5e-3; // m², 1 mm stop
const A35 = Math.PI * 1.75e-3 * 1.75e-3; // m², 3.5 mm stop

test("Class 1 CW, point source, 100 s: the MPE times the stop area", () => {
  // 400–700 nm: 10 W/m² over 7 mm = 0.385 mW (IEC: 3.9×10⁻⁴ W).
  const vis = cwClassLimit("1", nm(633), 0);
  assertRel(vis.power, 10 * A7, 1e-12, "633 nm");
  assertRel(vis.power, 3.9e-4, 0.02, "633 nm vs IEC");
  assert.equal(vis.limiting, "retinalThermal");
  assert.equal(vis.timeBase, 100);
  // 450 nm: photochemical 100 C_B J/m² over 10–100 s, C_B = 1: 3.85×10⁻⁵ W (IEC: 3.9×10⁻³ C₃ J over 100 s).
  const blue = cwClassLimit("1", nm(450), 0);
  assertRel(blue.power, (100 * A7) / 100, 1e-12, "450 nm");
  assert.equal(blue.limiting, "retinalPhotochemical");
  // 532 nm: C_B = 10^(0.02·82) = 43.7, so the thermal 0.385 mW is lower.
  assert.equal(cwClassLimit("1", nm(532), 0).limiting, "retinalThermal");
  // 905 nm: × C₄ = 10^(0.002·205) = 2.570 (IEC: 3.9×10⁻⁴ C₄ W = 1.0 mW).
  assertRel(cwClassLimit("1", nm(905), 0).power, 10 * Math.pow(10, 0.41) * A7, 1e-12, "905 nm");
  // 1064 nm: C₄ = 5, C₇ = 1: 1.92 mW (IEC 1.95 mW).
  assertRel(cwClassLimit("1", nm(1064), 0).power, 50 * A7, 1e-12, "1064 nm");
  // 1550 nm and 10.6 µm: 10³ W/m² over 3.5 mm = 9.62 mW (IEC: 1.0×10⁻² W).
  assertRel(cwClassLimit("1", nm(1550), 0).power, 1e3 * A35, 1e-12, "1550 nm");
  assertRel(cwClassLimit("1", nm(10600), 0).power, 1e3 * A35, 1e-12, "10.6 µm");
  assertRel(cwClassLimit("1", nm(1550), 0).power, 1e-2, 0.04, "1550 nm vs IEC");
});

test("Class 1 UV: IEC's own values over a 1 mm stop, 30 000 s", () => {
  // 315–400 nm, 10³ – 3×10⁴ s: 7.9×10⁻⁶ W (10 W/m² × 7.85×10⁻⁷ m²).
  const r = cwClassLimit("1", nm(355), 0);
  assertRel(r.power, 10 * A1, 1e-12, "355 nm");
  assertRel(r.power, 7.9e-6, 0.01, "355 nm vs IEC");
  assert.equal(r.timeBase, 3e4);
  // 180–302.5 nm: 30 J/m² over 30 000 s.
  assertRel(cwClassLimit("1", nm(250), 0).power, (30 * A1) / 3e4, 1e-12, "250 nm");
  // 302.5–315 nm beyond T₁: C₂ = 10^(0.2(λ − 295)) J/m² = 10³ J/m² at 310 nm.
  assertRel(cwClassLimit("1", nm(310), 0).power, (1e3 * A1) / 3e4, 1e-12, "310 nm");
  // 315–400 nm, 10–10³ s: 7.9×10⁻³ J (10⁴ J/m² over 1 mm).
  assertRel(aelEnergy("1", nm(355), 100).energy, 7.9e-3, 0.01, "355 nm, 100 s");
});

test("1250–1400 nm: the Class 3B cap and the EU A11 skin AEL", () => {
  // 1310 nm: C₇ = 8 + 10^(0.04·60) = 259.2; 10 C₄ C₇ W/m² over 7 mm = 0.499 W, where the 0.5 W cap starts to bind
  // (Schulmeister 2017: "the wavelength where the new retinal thermal AEL for Class 1 reaches 0,5 Watt is at 1310 nm").
  const at1310 = cwClassLimit("1", nm(1310), 0);
  assertRel(at1310.power, 10 * 5 * (8 + Math.pow(10, 2.4)) * A7, 1e-12, "1310 nm");
  assert.equal(at1310.limiting, "retinalThermal");
  const at1350 = cwClassLimit("1", nm(1350), 0);
  assert.equal(at1350.power, 0.5);
  assert.equal(at1350.limiting, "class3B");
  // A11: the skin limit through the corneal stop. Just below 0.35 s (1 mm): 1.1×10⁴·5·0.35^0.25 J/m² × A₁ / 0.35 s
  // = 0.0949 W, below the tabulated 0.1 W from 0.35 s (A11 lists 4.3×10⁻² t^0.25 J below 0.35 s: 0.0945 W there).
  const a11 = cwClassLimit("1", nm(1350), 0, { euA11: true });
  assertRel(a11.power, (1.1e4 * 5 * Math.pow(0.35, 0.25) * A1) / 0.35, 1e-9, "A11");
  assert.equal(a11.limiting, "skinA11");
  // No anterior-segment limit of ICNIRP's in the class AELs; no cap below 1250 nm.
  assert.ok(classAels("1", nm(1300)).every((l) => (l.kind as string) !== "anteriorSegment"));
  assert.ok(classAels("1", nm(1200)).every((l) => l.kind !== "class3B"));
});

test("Classes 2, 3R and 3B", () => {
  // Class 2: C₆ × 1 mW from 0.25 s; C₆ = α/1.5 mrad = 10 at 15 mrad.
  assert.equal(cwClassLimit("2", nm(633), 0).power, 1e-3);
  assertRel(cwClassLimit("2", nm(633), 0, { alpha: 15e-3 }).power, 1e-2, 1e-12, "C₆ = 10");
  assert.equal(cwClassLimit("2", nm(633), 0).timeBase, 0.25);
  assert.ok(Number.isNaN(cwClassLimit("2", nm(1550), 0).power), "no Class 2 outside 400–700 nm");
  // Class 3R: 5 mW visible; 5 × Class 1 elsewhere (1550 nm: IEC 5.0×10⁻² W); none below 302.5 nm.
  assertRel(cwClassLimit("3R", nm(633), 0).power, 5e-3, 1e-12, "3R visible");
  assertRel(cwClassLimit("3R", nm(1550), 0).power, 5e3 * A35, 1e-12, "3R 1550 nm");
  assert.equal(timeBase("3R", nm(1550)), 100);
  assert.ok(Number.isNaN(cwClassLimit("3R", nm(250), 0).power), "no Class 3R below 302.5 nm");
  // Class 3B, CW: 0.5 W from 315 nm, 1.5 mW below 302.5 nm, 5×10⁻⁵ C₂ W between (50 mW at 310 nm).
  assertRel(cwClassLimit("3B", nm(1064), 0).power, 0.5, 1e-12, "3B");
  assertRel(cwClassLimit("3B", nm(250), 0).power, 1.5e-3, 1e-12, "3B UV-C");
  assertRel(cwClassLimit("3B", nm(310), 0).power, 5e-2, 1e-12, "3B 310 nm");
  // Class 3B, one pulse: 0.03 J visible, 0.03 C₄ J at 700–1050 nm, 0.15 J at 1050–1400 nm.
  assertRel(aelEnergy("3B", nm(532), 1e-8).energy, 0.03, 1e-12, "3B pulse 532 nm");
  assertRel(aelEnergy("3B", nm(905), 1e-7).energy, 0.03 * Math.pow(10, 0.41), 1e-12, "3B pulse 905 nm");
  assertRel(aelEnergy("3B", nm(1064), 1e-3).energy, 0.15, 1e-12, "3B pulse 1064 nm");
  // 905 nm: 0.03 C₄ J holds up to 0.06 C₄ = 0.154 s, so at 0.1 s it is still 0.077 J (not 0.5 W × 0.1 s).
  assertRel(aelEnergy("3B", nm(905), 0.1).energy, 0.03 * Math.pow(10, 0.41), 1e-12, "3B 905 nm, 0.1 s");
});

test("time bases (IEC 60825-1 4.3 e)", () => {
  assert.equal(timeBase("2", nm(633)), 0.25);
  assert.equal(timeBase("3R", nm(633)), 0.25);
  assert.equal(timeBase("1", nm(633)), 100);
  assert.equal(timeBase("1", nm(633), { longTermViewing: true }), 3e4);
  // "less than or equal to 400 nm": 30 000 s for Class 1 at 400 nm, but 0.25 s for Class 2 (400–700 nm).
  assert.equal(timeBase("1", nm(400)), 3e4);
  assert.equal(timeBase("2", nm(400)), 0.25);
});

test("MPE through its aperture against the Class 1 AEL", () => {
  // 633 nm, 0.25 s: 18 t^0.75 J/m² over 7 mm for both (the AEL is built from it).
  const mpe = exposureLimitEnergy(nm(633), 0.25);
  assertRel(mpe.energy, 18 * Math.pow(0.25, 0.75) * A7, 1e-12, "633 nm MPE");
  assertRel(aelEnergy("1", nm(633), 0.25).energy, mpe.energy, 1e-12, "AEL = MPE × area");
  // 355 nm, 100 s: ICNIRP 10⁴ J/m² over 3.5 mm; IEC 10⁴ J/m² over 1 mm (12.25× less energy).
  assertRel(exposureLimitEnergy(nm(355), 100).energy, 1e4 * A35, 1e-12, "355 nm MPE");
  assertRel(exposureLimitEnergy(nm(355), 100).energy / aelEnergy("1", nm(355), 100).energy, 12.25, 1e-12, "UV stops");
  // 1350 nm, 100 s: ICNIRP's anterior-segment limit, 2 × 2×10³ C_A W/m² over 3.5 mm = 19.2 J; the class cap is 50 J.
  assertRel(exposureLimitEnergy(nm(1350), 100).energy, 2 * 2e3 * 5 * 100 * A35, 1e-12, "1350 nm MPE");
  assert.equal(exposureLimitEnergy(nm(1350), 100).kind, "anteriorSegment");
  assertRel(aelEnergy("1", nm(1350), 100).energy, 50, 1e-12, "1350 nm AEL");
});

test("Class 1, one pulse: 2×10⁻³ J/m² over 7 mm below 5 µs (ICNIRP 2013)", () => {
  // 7.7×10⁻⁸ J, the IEC 60825-1:2014 value (the 2001 edition had 2×10⁻⁷ J up to 18 µs).
  const e = aelEnergy("1", nm(532), 1e-8);
  assertRel(e.energy, 2e-3 * A7, 1e-12, "10 ns");
  assert.equal(e.stop, 7e-3);
});

test("classification of CW beams", () => {
  const pointer = { d: 1e-3, phi: 1e-3 };
  assert.equal(classifyCw(nm(532), 0.3e-3, pointer).laserClass, "1");
  assert.equal(classifyCw(nm(532), 0.9e-3, pointer).laserClass, "2");
  assert.equal(classifyCw(nm(532), 5e-3, pointer).laserClass, "3R", "5 mW is within 5 × 1 mW");
  assert.equal(classifyCw(nm(532), 5.01e-3, pointer).laserClass, "3B");
  assert.equal(classifyCw(nm(532), 0.6, pointer).laserClass, "4");
  // 1 mW at 633 nm in a 20 mm collimated beam: Condition 3 (7 mm at 100 mm) passes 1 − e^(−0.245) = 21.7 %, within
  // Class 1; a 50 mm stop at 2 m takes it all, above Class 1 and within 3B: Class 1M. Without telescopes: Class 1.
  const wide = { d: 20e-3, phi: 0.1e-3 };
  assert.equal(classifyCw(nm(633), 1e-3, wide).laserClass, "1M");
  assert.equal(classifyCw(nm(633), 1e-3, wide, { condition1: false }).laserClass, "1");
  // 1350 nm, 0.3 W: Class 1 under IEC 60825-1:2014; above the A11 skin AEL in the EU, then 3R's caps too: 3B.
  assert.equal(classifyCw(nm(1350), 0.3, pointer).laserClass, "1");
  assert.equal(classifyCw(nm(1350), 0.3, pointer, { euA11: true }).laserClass, "3B");
  // 1550 nm, 30 mW: above 9.62 mW, within 48.1 mW.
  assert.equal(classifyCw(nm(1550), 30e-3, pointer).laserClass, "3R");
  // A beam wider than the stop: 20 mW at 1550 nm in a 10 mm beam puts 21.7 % through 3.5 mm (100 s), 4.3 mW: Class 1.
  assert.equal(classifyCw(nm(1550), 20e-3, { d: 10e-3, phi: 0 }).laserClass, "1");
  // A diverging beam (0.1 mm, 100 mrad) is 10.0 mm wide at the Condition 3 stop, 100 mm out: 21.7 % of it through
  // 3.5 mm, so Class 1 allows 9.62 mW / 0.217 = 44.3 mW; 50 mW is 3R.
  const fibre = classifyCw(nm(1550), 50e-3, { d: 0.1e-3, phi: 0.1 });
  assertRel(fibre.diameter3, Math.hypot(0.1e-3, 0.01), 1e-12, "diameter at 100 mm");
  assertRel(fibre.checks[0].condition3.power, (1e3 * A35) / -Math.expm1((-2 * 3.5e-3 * 3.5e-3) / (0.1e-3 ** 2 + 1e-4)), 1e-9, "Class 1 power");
  assert.equal(fibre.laserClass, "3R");
  // Edge: zero power is Class 1; negative power or outside 180 nm – 1 mm has no class.
  assert.equal(classifyCw(nm(1064), 0, pointer).laserClass, "1");
  assert.equal(classifyCw(nm(1064), -1, pointer).laserClass, null);
  assert.equal(classifyCw(nm(150), 1e-3, pointer).laserClass, null);
});
