import { test } from "node:test";
import assert from "node:assert/strict";
import {
  channelWavelengths, gaussianAdjacentIsolationDb, gaussianPassband, ituGrid,
} from "../src/physics/fiber-optics/wdm-channel-plan";

const close = (a: number, b: number, tol: number, what: string) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);

test("0.8 nm at 1550 nm is the G.694.1 100 GHz grid; 20 nm is G.694.2 CWDM; 0.6 nm is custom", () => {
  // Hand: Δν = cΔλ/λ² = 299792458 · 0.8e-9 / (1550e-9)² = 99.827 GHz.
  assert.deepEqual(ituGrid(0.8e-9, 1550e-9), { name: "ITU-T G.694.1 DWDM, 100 GHz", equalFrequency: true });
  assert.deepEqual(ituGrid(0.4e-9, 1550e-9), { name: "ITU-T G.694.1 DWDM, 50 GHz", equalFrequency: true });
  assert.equal(ituGrid(20e-9, 1471e-9).equalFrequency, false);
  assert.match(ituGrid(20e-9, 1471e-9).name, /G\.694\.2 CWDM/);
  assert.match(ituGrid(0.6e-9, 1550e-9).name, /Custom/);
});

test("DWDM channels sit at equal frequency steps, CWDM at equal wavelength steps", () => {
  // Hand: ν_c = c/1550 nm = 193.414489 THz, Δν = 99.826833 GHz; c/(ν_c + Δν) = 1549.200413 nm, c/(ν_c − Δν) = 1550.800413 nm.
  const [a, b, d] = channelWavelengths(3, 1550e-9, 0.8e-9, true);
  close(a * 1e9, 1549.200413, 1e-6, "low channel");
  close(b * 1e9, 1550, 1e-9, "centre");
  close(d * 1e9, 1550.800413, 1e-6, "high channel");
  assert.deepEqual(channelWavelengths(2, 1551e-9, 20e-9, false).map((x) => Math.round(x * 1e12) / 1e3), [1541, 1561]);
  // Edge: 96 × 20 nm around 800 nm runs below zero wavelength (first channel 800 − 47.5·20 = −150 nm): NaN, not negative.
  const wide = channelWavelengths(96, 800e-9, 20e-9, false);
  assert.ok(Number.isNaN(wide[0]) && wide[95] > 0);
});

test("Gaussian passband: half power at FWHM/2; adjacent isolation 12.04 (Δλ/FWHM)² dB", () => {
  close(gaussianPassband(0.2, 0.4), 0.5, 1e-12, "T at FWHM/2");
  // Hand: 10 log₁₀(e) · 4 ln 2 = 4.342945 · 2.772589 = 12.041200 dB; Δλ/FWHM = 2 → 48.164799 dB.
  close(gaussianAdjacentIsolationDb(0.8, 0.4), 48.164799, 1e-6, "isolation 0.8/0.4");
  close(gaussianAdjacentIsolationDb(1, 1), 12.041200, 1e-6, "isolation 1/1");
  // Consistency with the passband: −10 log₁₀ T(Δλ).
  close(gaussianAdjacentIsolationDb(0.8, 0.4), -10 * Math.log10(gaussianPassband(0.8, 0.4)), 1e-9, "vs passband");
  assert.ok(Number.isNaN(gaussianAdjacentIsolationDb(0.8, 0)));
});
