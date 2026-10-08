import test from "node:test";
import assert from "node:assert/strict";

import {
  amplitudeWeightedLifetime, decayIntensity, fractionalIntensities, intensityWeightedLifetime, quantumYield,
} from "../src/physics/spectroscopy/fluorescence-lifetime";

const close = (actual: number, expected: number, rel: number) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

const ns = 1e-9;
// Page defaults in bi-exponential mode: α₁ = 0.7, τ₁ = 5 ns; α₂ = 0.3, τ₂ = 1 ns.
const bi = [{ amplitude: 0.7, lifetime: 5 * ns }, { amplitude: 0.3, lifetime: 1 * ns }];

test("averages of the default bi-exponential (Lakowicz ch. 4; Sillen & Engelborghs 1998)", () => {
  // Hand: Σατ = 3.5 + 0.3 = 3.8 ns; Σατ² = 17.5 + 0.3 = 17.8 ns²; ⟨τ⟩_int = 17.8/3.8 = 4.684 ns.
  close(amplitudeWeightedLifetime(bi), 3.8 * ns, 1e-12);
  close(intensityWeightedLifetime(bi), (17.8 / 3.8) * ns, 1e-12);
  const f = fractionalIntensities(bi);
  close(f[0], 3.5 / 3.8, 1e-12);
  close(f[0] + f[1], 1, 1e-12);
});

test("⟨τ⟩_int is the mean photon arrival time and ⟨τ⟩_amp the area under the normalised decay (quadrature)", () => {
  // Trapezoid over 0..200 ns at 1 ps steps, independent of the closed forms.
  const dt = 1e-12, n = 200000;
  let area = 0, moment = 0;
  for (let i = 0; i <= n; i++) {
    const t = i * dt, w = i === 0 || i === n ? 0.5 : 1;
    const I = decayIntensity(bi, t);
    area += w * I * dt;
    moment += w * t * I * dt;
  }
  close(moment / area, intensityWeightedLifetime(bi), 1e-6);
  close(area / (0.7 + 0.3), amplitudeWeightedLifetime(bi), 1e-6);
});

test("single exponential: both averages equal τ; quantum yield τ/τ_rad and its domain", () => {
  const single = [{ amplitude: 1, lifetime: 4 * ns }];
  assert.equal(amplitudeWeightedLifetime(single), 4 * ns);
  assert.equal(intensityWeightedLifetime(single), 4 * ns);
  // Fluorescein-like: τ = 4 ns, τ_rad = 4.3 ns → Φ = 0.930.
  close(quantumYield(single, 4.3 * ns), 4 / 4.3, 1e-12);
  assert.ok(Number.isNaN(quantumYield(single, 3 * ns))); // τ_rad < τ would give Φ > 1
  assert.ok(Number.isNaN(amplitudeWeightedLifetime([{ amplitude: 0, lifetime: ns }])));
});
