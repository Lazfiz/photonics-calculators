import assert from "node:assert/strict";
import { test } from "node:test";
import { photoacousticSummary } from "../src/physics/imaging/photoacoustic";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual / expected - 1) <= rel, `${actual} vs ${expected}`);

// ICNIRP 2013 (Health Phys. 105(3), 271–295, doi:10.1097/HP.0b013e3182983fd4) skin limits, 750 nm:
// C_A = 10^(0.002·(750 − 700)) = 1.25892541; one 5 ns pulse H = 200·C_A J/m² = 251.785 J/m² = 25.1785 mJ/cm²;
// 10 s or longer E = 2000·C_A W/m² = 2517.85 W/m²; fluence 20 mJ/cm² = 200 J/m² at 10 Hz is 2000 W/m².
// Hand-worked in a scratch script that does not call the repo.
test("photoacoustic summary: ICNIRP skin limits at 750 nm, 5 ns, 20 mJ/cm², 10 Hz", () => {
  const s = photoacousticSummary({
    lambda: 750e-9, pulseWidth: 5e-9, fluence: 200, repRate: 10, mua: 500, muaBackground: 10, musPrime: 1000, gruneisen: 0.2,
    depth: 2e-3, soundSpeed: 1540, centerFrequency: 5e6, bandwidthFraction: 1, na: 0.5, acousticAttenuation: 0.5 * 1e-4,
  });
  close(s.pulseLimit, 251.78508235883346);
  close(s.pulseRatio, 0.7943282347242815);
  close(s.averageIrradiance, 2000);
  close(s.irradianceLimit, 2517.8508235883345);
  close(s.averageRatio, 0.7943282347242815);
  close(s.p0Surface, 20000); // Γ μ_a F = 0.2 × 500 × 200 Pa
});
