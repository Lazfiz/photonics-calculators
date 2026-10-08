import test from "node:test";
import assert from "node:assert/strict";

import {
  airyTransmission, diffractionLimit, fabryPerotResolution, gratingAngularDispersion, gratingDiffractionAngle,
  gratingDiffractionLimit, gratingMaxOrder, gratingSlitBandpass, slitBandpass,
} from "../src/physics/spectroscopy/spectral-resolution";

const close = (actual: number, expected: number, rel: number, msg?: string) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg ?? ""} ${actual} vs ${expected}`);

const d = 1e-3 / 1200; // 1200 lines/mm
const alpha = (10 * Math.PI) / 180;

test("grating at the page defaults: slit-limited and diffraction-limited bandpass", () => {
  // Hand: sin β = 1 · 500 nm · 1200/mm − sin 10° = 0.6 − 0.173648 = 0.426352, cos β = 0.904557.
  const beta = gratingDiffractionAngle(500e-9, d, 1, alpha);
  close(Math.sin(beta), 0.426352, 1e-5);
  // δλ = w d cos β/(m f) = 25 µm · 833.33 nm · 0.904557/(1 · 500 mm) = 0.037690 nm (Palmer & Loewen ch. 2).
  close(gratingSlitBandpass(25e-6, d, 1, beta, 0.5), 0.037690e-9, 1e-4);
  // R = mN = 1 · 1200/mm · 50 mm = 60 000, δλ = 500 nm/60 000 = 8.333 pm.
  close(gratingDiffractionLimit(500e-9, 1, 0.05, d), 500e-9 / 60000, 1e-12);
});

test("λ/(D dθ/dλ) reproduces R = mN for a grating and R = b dn/dλ for a prism at minimum deviation", () => {
  const beta = gratingDiffractionAngle(500e-9, d, 1, alpha);
  close(diffractionLimit(500e-9, 0.05 * Math.cos(beta), gratingAngularDispersion(d, 1, beta)), 500e-9 / 60000, 1e-12);
  // Equilateral prism, n = 1.5168, dn/dλ = −0.05 /µm, face length L = 30 mm: b = 2L sin 30° = 30 mm.
  const A = Math.PI / 3, n = 1.5168, dndl = 0.05e6, L = 0.03;
  const theta1 = Math.asin(n * Math.sin(A / 2));
  const dThetaDl = ((2 * Math.sin(A / 2)) / Math.cos(theta1)) * dndl;
  close(diffractionLimit(500e-9, L * Math.cos(theta1), dThetaDl), 500e-9 / (0.03 * dndl), 1e-12);
  // Slit term: 25 µm/(500 mm · 1e-4 rad/nm) = 0.5 nm.
  close(slitBandpass(25e-6, 0.5, 1e5), 0.5e-9, 1e-12);
});

test("orders that do not propagate give NaN; the highest order is floor(d(1 + sin α)/λ)", () => {
  // 2 · 0.6 − 0.1736 = 1.026 > 1.
  assert.ok(Number.isNaN(gratingDiffractionAngle(500e-9, d, 2, alpha)));
  assert.equal(gratingMaxOrder(500e-9, d, alpha), 1); // 833.3 · 1.1736/500 = 1.956
  assert.equal(gratingMaxOrder(400e-9, d, alpha), 2); // 2.445
  assert.ok(Number.isFinite(gratingDiffractionAngle(400e-9, d, 2, alpha)));
  // Grazing limit: sin β = 1 exactly still propagates.
  assert.equal(gratingDiffractionAngle(500e-9, 1e-6, 2, 0), Math.PI / 2);
});

test("Fabry-Pérot: the Airy FWHM is FSR/ℱ up to the exact (2/π) asin(π/2ℱ) factor (Hecht §9.6.1)", () => {
  const fsr = 0.05e-9, F = 50;
  assert.equal(fabryPerotResolution(fsr, F), 1e-12);
  assert.equal(airyTransmission(0, fsr, F), 1);
  close(airyTransmission(fsr, fsr, F), 1, 1e-12); // next order
  // Half maximum where (2ℱ/π) sin(πΔ/FSR) = 1: Δ = (FSR/π) asin(π/(2ℱ)), FWHM = 1.000165 FSR/ℱ.
  const half = (fsr / Math.PI) * Math.asin(Math.PI / (2 * F));
  close(airyTransmission(half, fsr, F), 0.5, 1e-12);
  close((2 * half) / (fsr / F), 1.000165, 1e-6);
});
