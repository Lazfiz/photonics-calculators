import { test } from "node:test";
import assert from "node:assert/strict";
import { heroPowerSplit, wavelengthBand, wavelengthToColor } from "../src/lib/hero-optics";

// Quadrature-biased 50/50 Mach-Zehnder, outputs P± = ½(1 ± sin Δφ), each tapped 50/50 into the middle bus.
// Born & Wolf, Principles of Optics, 7th ed., ch. 7 (two-beam interference).
const deg = (d: number) => (d * Math.PI) / 180;

test("heroPowerSplit: zero phase gives 25/50/25", () => {
  const s = heroPowerSplit(0);
  assert.ok(Math.abs(s.spectral - 0.25) < 1e-12);
  assert.ok(Math.abs(s.imaging - 0.5) < 1e-12);
  assert.ok(Math.abs(s.interference - 0.25) < 1e-12);
});

test("heroPowerSplit: +90 deg sends everything to the upper output", () => {
  const s = heroPowerSplit(deg(90));
  assert.ok(Math.abs(s.spectral - 0.5) < 1e-12);
  assert.ok(Math.abs(s.imaging - 0.5) < 1e-12);
  assert.ok(Math.abs(s.interference) < 1e-12);
});

test("heroPowerSplit: -30 deg gives 12.5/50/37.5 and the split always sums to 1", () => {
  const s = heroPowerSplit(deg(-30));
  assert.ok(Math.abs(s.spectral - 0.125) < 1e-12);
  assert.ok(Math.abs(s.imaging - 0.5) < 1e-12);
  assert.ok(Math.abs(s.interference - 0.375) < 1e-12);
  for (let d = -90; d <= 90; d += 5) {
    const t = heroPowerSplit(deg(d));
    assert.ok(Math.abs(t.spectral + t.imaging + t.interference - 1) < 1e-12);
  }
});

test("heroPowerSplit: non-finite phase gives NaN", () => {
  assert.ok(Number.isNaN(heroPowerSplit(NaN).spectral));
});

test("wavelengthBand names the band truthfully", () => {
  assert.equal(wavelengthBand(405), "violet");
  assert.equal(wavelengthBand(488), "blue");
  assert.equal(wavelengthBand(532), "green");
  assert.equal(wavelengthBand(633), "red");
  assert.equal(wavelengthBand(850), "near-IR");
  assert.equal(wavelengthBand(1310), "O/E/S-band");
  assert.equal(wavelengthBand(1550), "C-band");
  assert.equal(wavelengthBand(1600), "L-band");
});

test("wavelengthToColor states the actual wavelength", () => {
  assert.equal(wavelengthToColor(850).name, "850 nm · near-IR");
  assert.ok(!wavelengthToColor(850).name.includes("Telecom"));
});
