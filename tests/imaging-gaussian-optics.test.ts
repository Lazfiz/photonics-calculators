import test from "node:test";
import assert from "node:assert/strict";

import {
  conjugatesFromMag, emmetropicAxialLength, focalDistances, ocularRefraction, opticalPower, spectacleCorrection,
  thinLensImage, twoElementPower, twoLensABCD,
} from "../src/physics/imaging/gaussian-optics";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const mm = 1e-3;

test("thin-lens conjugates 1/o + 1/i = 1/f, M = −i/o (Greivenkamp 2004, doi:10.1117/3.547461)", () => {
  // f 50, o 200: i = 50·200/150 = 66.667 mm, M = −1/3 (real, inverted).
  const real = thinLensImage(50, 200);
  assertRel(real.i, 200 / 3, 1e-12, "i");
  assertRel(real.M, -1 / 3, 1e-12, "M");
  // Inside the focal length, o 25: i = 50·25/(−25) = −50 mm, M = +2 (virtual, upright).
  const virt = thinLensImage(50, 25);
  assertRel(virt.i, -50, 1e-12, "virtual i");
  assertRel(virt.M, 2, 1e-12, "virtual M");
  // Diverging lens f −50, o 100: i = −5000/150 = −33.333 mm, M = +1/3.
  assertRel(thinLensImage(-50, 100).i, -100 / 3, 1e-12, "diverging i");
  // Newtonian x·x′ = f²: (200 − 50)(66.667 − 50) = 2500.
  assertRel((200 - 50) * (real.i - 50), 2500, 1e-12, "Newtonian");
  // Edge: object at the focal point has no finite image.
  assert.ok(Number.isNaN(thinLensImage(50, 50).i), "o = f");
});

test("conjugates from magnification o = f(1 − 1/M), i = f(1 − M)", () => {
  // Old working-distance case: f 10 mm at 20× (real image, M = −20) → o 10.5, i 210 mm.
  const c = conjugatesFromMag(10, -20);
  assertRel(c.o, 10.5, 1e-12, "o");
  assertRel(c.i, 210, 1e-12, "i");
  // Round trip with thinLensImage, and the virtual case M = +2 → o 25, i −50.
  assertRel(thinLensImage(10, c.o).M, -20, 1e-12, "round trip");
  const v = conjugatesFromMag(50, 2);
  assertRel(v.o, 25, 1e-12, "virtual o");
  assertRel(v.i, -50, 1e-12, "virtual i");
  // 1:1 imaging puts both conjugates at 2f (track 4f).
  assert.deepEqual(conjugatesFromMag(50, -1), { o: 100, i: 100 });
  assert.ok(Number.isNaN(conjugatesFromMag(50, 0).o), "M = 0");
});

test("optical power and Gullstrand's equation", () => {
  assertRel(opticalPower(100 * mm), 10, 1e-12, "f 100 mm → 10 D");
  assertRel(opticalPower(-250 * mm), -4, 1e-12, "f −250 mm → −4 D");
  assert.ok(Number.isNaN(opticalPower(0)), "f = 0");
  // Gullstrand's exact eye: cornea 43.053 D, lens 19.11 D, principal planes 5.7286 mm apart in n 1.336:
  // 62.163 − (0.0057286/1.336)·43.053·19.11 = 58.635 D (published total 58.64 D).
  assertRel(twoElementPower(43.053, 19.11, 5.7286 * mm, 1.336), 58.635, 1e-4, "Gullstrand eye");
  // Thin lenses 100 mm and 200 mm, 250 mm apart in air: 10 + 5 − 0.25·10·5 = 2.5 D, EFL 400 mm.
  assertRel(twoElementPower(10, 5, 0.25), 2.5, 1e-12, "two lenses");
});

test("two-lens ray-transfer matrix: afocal, Galilean and powered spacings (Greivenkamp, afocal systems)", () => {
  // Keplerian 100 + 200 at 300 mm: C = 0, angular magnification D = −f₁/f₂ = −0.5, beam scale A = −2, det 1.
  const k = twoLensABCD(100, 200, 300);
  assert.ok(Math.abs(k.C) < 1e-15, `C ${k.C}`);
  assertRel(k.D, -0.5, 1e-12, "M");
  assertRel(k.A, -2, 1e-12, "A");
  assertRel(k.A * k.D - k.B * k.C, 1, 1e-12, "det");
  // Galilean 100 and −25 at 75 mm: M = +4 (upright).
  const g = twoLensABCD(100, -25, 75);
  assert.ok(Math.abs(g.C) < 1e-15, `Galilean C ${g.C}`);
  assertRel(g.D, 4, 1e-12, "Galilean M");
  // 250 mm spacing: EFL 400 mm; lens 1 focuses 150 mm before lens 2, which images it to −600 mm (virtual);
  // traced backwards, lens 2's focus 50 mm behind lens 1 images to 100 mm behind it (FFD −100).
  const p = focalDistances(twoLensABCD(100, 200, 250));
  assertRel(p.efl, 400, 1e-12, "EFL");
  assertRel(p.bfd, -600, 1e-12, "BFD");
  assertRel(p.ffd, -100, 1e-12, "FFD");
  assert.ok(Number.isNaN(twoLensABCD(0, 200, 300).C), "f₁ = 0");
});

test("two-element eye: ocular refraction and spectacle effectivity (Atchison & Smith 2000)", () => {
  // Reduced eye (Emsley: 60 D, n 4/3, emmetropic at 22.222 mm) 1 mm long: K = n/L − φ = 57.416 − 60 = −2.584 D.
  assertRel(ocularRefraction(60, 0, 3 * mm, 4 / 3, 23.2222 * mm), 4 / 3 / (23.2222 * mm) - 60, 1e-12, "reduced eye");
  assertRel(ocularRefraction(60, 0, 0, 4 / 3, 23.2222 * mm), -2.5837, 1e-4, "reduced eye value");
  // Gullstrand powers: rear focal point t + n(1 − tφ₁/n)/φ = 5.7286 + 1.336·0.81540/58.635 m = 24.307 mm, where K = 0.
  const Lemm = emmetropicAxialLength(43.053, 19.11, 5.7286 * mm, 1.336);
  assertRel(Lemm, 24.3074 * mm, 1e-4, "emmetropic length");
  assert.ok(Math.abs(ocularRefraction(43.053, 19.11, 5.7286 * mm, 1.336, Lemm)) < 1e-9, "K = 0 there");
  // 24.0 mm: V₃ = 1.336/0.0182714 = 73.119, V₂ = 54.009, V₁ = 54.009/1.23158 = 43.853, K = +0.801 D (hyperopic).
  assertRel(ocularRefraction(43.053, 19.11, 5.7286 * mm, 1.336, 24 * mm), 0.8008, 1e-3, "24 mm eye");
  // A longer eye is myopic: 25 mm → −1.734 D.
  assertRel(ocularRefraction(43.053, 19.11, 5.7286 * mm, 1.336, 25 * mm), -1.7342, 1e-3, "25 mm eye");
  // Effectivity F = K/(1 + dK) at 12 mm: −5 D → −5.319 D, +5 D → +4.717 D.
  assertRel(spectacleCorrection(-5, 12 * mm), -5 / 0.94, 1e-12, "myope");
  assertRel(spectacleCorrection(5, 12 * mm), 5 / 1.06, 1e-12, "hyperope");
  // Edge: the retina can't lie in front of the lens.
  assert.ok(Number.isNaN(ocularRefraction(43, 19, 5 * mm, 1.336, 4 * mm)), "L < t");
});
