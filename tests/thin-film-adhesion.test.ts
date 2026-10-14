import test from "node:test";
import assert from "node:assert/strict";

import {
  benjaminWeaver,
  benjaminWeaverMaxLoad,
  bendTest,
  kendallPeelEnergy,
  tapeClass,
} from "../src/physics/thin-film/adhesion";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("Benjamin–Weaver scratch test (Benjamin & Weaver 1960; Ohring ch. 12)", () => {
  // L = 10 N, R = 200 µm, H = 6 GPa: a = √(10/(π·6e9)) = 2.303294e-5 m,
  // τ = 6e9 · 2.303294e-5 / √(4e-8 − 5.305165e-10) = 6.956166e8 Pa.
  const r = benjaminWeaver(10, 200e-6, 6e9);
  assertRel(r.contactRadius, 2.303294e-5, 1e-6, "a");
  assertRel(r.shearStress, 6.956166e8, 1e-6, "τ");
  // Small-load limit: τ → H a / R.
  const s = benjaminWeaver(1e-6, 200e-6, 6e9);
  assertRel(s.shearStress, (6e9 * s.contactRadius) / 200e-6, 1e-6, "small-load limit");
  // a reaches R at L = π R² H = π·4e-8·6e9 = 753.982 N.
  assertRel(benjaminWeaverMaxLoad(200e-6, 6e9), 753.9822, 1e-6, "L_max");
  assert.ok(Number.isNaN(benjaminWeaver(800, 200e-6, 6e9).shearStress), "a ≥ R");
  assert.ok(Number.isNaN(benjaminWeaver(10, 0, 6e9).shearStress), "R = 0");
});

test("Kendall peel energy (Kendall 1975)", () => {
  // 90° peel, F/b = 100 N/m, E = 3 GPa, h = 50 µm: 100 + 100²/(2·3e9·50e-6) = 100.033333 J/m².
  assertRel(kendallPeelEnergy(100, Math.PI / 2, 3e9, 50e-6), 100.0333333, 1e-9, "90°");
  // Inextensible 180° peel (Rivlin): 2 F/b.
  assertRel(kendallPeelEnergy(10, Math.PI, 1e15, 1), 20, 1e-9, "180°");
  // Lap shear limit θ = 0: only the stretching term, 1000²/(2·1e9·1e-6) = 500 J/m².
  assertRel(kendallPeelEnergy(1000, 0, 1e9, 1e-6), 500, 1e-9, "θ = 0");
  assert.ok(Number.isNaN(kendallPeelEnergy(-1, 1, 1e9, 1e-6)), "negative force");
});

test("ASTM D3359 Method B classes", () => {
  assert.equal(tapeClass(0), "5B");
  assert.equal(tapeClass(4.9), "4B");
  assert.equal(tapeClass(5), "3B");
  assert.equal(tapeClass(15), "3B");
  assert.equal(tapeClass(15.1), "2B");
  assert.equal(tapeClass(35), "2B");
  assert.equal(tapeClass(65), "1B");
  assert.equal(tapeClass(65.1), "0B");
  assert.equal(tapeClass(100), "0B");
  assert.equal(tapeClass(-1), undefined);
  assert.equal(tapeClass(101), undefined);
});

test("bend test: strain, plane-strain stress, Hutchinson–Suo G", () => {
  // h_s = 1 mm, R = 100 mm: ε = 0.005. E_f = 70 GPa, ν_f = 0.2: Ē = 72.916667 GPa, σ = 364.5833 MPa.
  // h = 100 nm: σ²h/Ē = Ē ε² h = 0.1822917 J/m²; channel 1.976× = 0.3602083, delamination ½× = 0.0911458.
  const r = bendTest(1e-3, 0.1, 70e9, 0.2, 100e-9);
  assertRel(r.strain, 0.005, 1e-12, "ε");
  assertRel(r.stress, 3.645833e8, 1e-6, "σ");
  assertRel(r.channelG, 0.3602083, 1e-6, "G channel");
  assertRel(r.delaminationG, 0.0911458, 1e-5, "G delamination");
  // Delamination G is the plane-strain energy stored per area: (1 − ν²)σ²h/(2E) = 0.96 · 3.645833e8² · 1e-7 / 1.4e11.
  assertRel(r.delaminationG, (0.96 * 3.645833e8 ** 2 * 1e-7) / 1.4e11, 1e-6, "G_ss vs stored energy");
  // Residual tension adds: σ = 100 MPa + 364.5833 MPa; G_channel = 1.976 · 4.645833e8² · 1e-7 / 7.2916667e10.
  const t = bendTest(1e-3, 0.1, 70e9, 0.2, 100e-9, 100e6);
  assertRel(t.stress, 4.645833e8, 1e-6, "σ with residual");
  assertRel(t.channelG, 0.5849077, 1e-5, "G channel with residual");
  // −500 MPa residual: compressive, buckling, so no G.
  assert.ok(Number.isNaN(bendTest(1e-3, 0.1, 70e9, 0.2, 100e-9, -500e6).channelG), "compressive");
  assert.ok(Number.isNaN(bendTest(3e-3, 1e-3, 70e9, 0.2, 1e-7).strain), "h_s ≥ 2R");
  assert.ok(Number.isNaN(bendTest(1e-3, 0.1, 70e9, 1, 1e-7).stress), "ν = 1");
});
