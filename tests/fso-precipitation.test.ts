import test from "node:test";
import assert from "node:assert/strict";

import {
  MM_PER_HOUR, RAIN_SHAPES, rainMultipleScatteringGain, rainPathAttenuation, rainPathReduction, rainPowerLaw,
  rainSpecificAttenuation, snowPowerLaw, snowSpecificAttenuation,
} from "../src/physics/free-space-comms/precipitation";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

const mmh = MM_PER_HOUR;

test("ITU-R P.1814-1 Table 4: k, α for each drop-size shape µ", () => {
  const table: Record<number, [number, number]> = {
    [-2]: [2.2838, 0.405], [-1]: [1.5921, 0.5506], [0]: [1.2924, 0.6436], [1]: [1.1394, 0.7057], [2]: [1.0505, 0.7497],
  };
  for (const mu of RAIN_SHAPES) assert.deepEqual(rainPowerLaw(mu), { k: table[mu][0], alpha: table[mu][1] });
});

test("specific rain attenuation at 25 mm/h, µ = 0: 1.2924·25^0.6436 = 10.259 dB/km (P.1814-1 eq. 11, hand)", () => {
  // ln 25 = 3.218876; ×0.6436 = 2.071669; e^… = 7.93804; ×1.2924 = 10.2591.
  close(rainSpecificAttenuation(25 * mmh, 0) * 1000, 10.2591, 1e-4);
  // 1 mm/h gives k itself.
  close(rainSpecificAttenuation(1 * mmh, 2) * 1000, 1.0505, 1e-12);
});

test("rain path model, 25 mm/h over 1 km, µ = 0 (P.1814-1 eqs. 14–19, hand)", () => {
  // F = 1/(1 + 1·18.8/2623) = 2623/2641.8 = 0.992884.
  close(rainPathReduction(25 * mmh, 1000), 2623 / 2641.8, 1e-12);
  // ln R = 3.218876, (ln R)² = 10.361161: a_ms = 0.01594 − 0.001476·3.218876 + 0.008297·10.361161 = 0.097155;
  // L = 1 km so G_ms = a_ms whatever b_ms is.
  close(rainMultipleScatteringGain(25 * mmh, 1000, 0), 0.097155, 1e-4);
  const r = rainPathAttenuation(25 * mmh, 1000, 0);
  close(r.reduced, 10.2591 * 0.992884, 1e-4); // 10.1861 dB
  close(r.attenuation, 10.0890, 1e-4);
});

test("rain path model, 100 mm/h over 4 km, µ = −2: the L^b_ms exponent bites (hand)", () => {
  // ln R = 4.605170, (ln R)² = 21.207592.
  // a_ms = 0.010012 + 0.025381·4.605170 − 0.001606·21.207592 = 0.092837
  // b_ms = 0.250329 − 0.035278·4.605170 + 0.008349·21.207592 = 0.264930; 4^0.264930 = 1.443822 → G_ms = 0.134040.
  close(rainMultipleScatteringGain(100 * mmh, 4000, -2), 0.134040, 1e-4);
  // γ = 2.2838·100^0.405 = 14.7454 dB/km; F = 1/(1 + 4·93.8/2623) = 0.874858; A′ = 51.6006; A = 51.4666 dB.
  const r = rainPathAttenuation(100 * mmh, 4000, -2);
  close(r.reduction, 0.874858, 1e-5);
  close(r.attenuation, 51.4666, 1e-4);
});

test("Table 5, every row: at R = e mm/h, G_ms(1 km) = p₀ + p₁ + p₂ and log₂(G_ms(2 km)/G_ms(1 km)) = k₀ + k₁ + k₂", () => {
  // Row sums by hand from P.1814-1 Table 5 (ln R = 1 makes a_ms and b_ms the plain sums).
  const sums: Record<number, [number, number]> = {
    [-2]: [0.033787, 0.2234], [-1]: [0.027015, 0.307731], [0]: [0.022761, 0.149407],
    [1]: [0.035277, 0.130227], [2]: [0.054082, 0.143892],
  };
  for (const mu of RAIN_SHAPES) {
    const g1 = rainMultipleScatteringGain(Math.E * mmh, 1000, mu);
    close(g1, sums[mu][0], 1e-9, `a_ms µ=${mu}`);
    close(Math.log2(rainMultipleScatteringGain(Math.E * mmh, 2000, mu) / g1), sums[mu][1], 1e-9, `b_ms µ=${mu}`);
  }
});

test("µ = −1 lies within 1 % of the independent Carbonneau law 1.076·R^0.67 at 25 mm/h (9.30 dB/km)", () => {
  // Kaushal & Kaddoum, arXiv:1506.04836, Table IV: 1.076·25^0.67 = 9.299 dB/km; P.1814-1 µ = −1 gives 9.369.
  close(rainSpecificAttenuation(25 * mmh, -1) * 1000, 1.076 * 25 ** 0.67, 0.01);
});

test("rain edge cases: zero rate, negative inputs and the G_ms taper and clamp below 1 mm/h", () => {
  assert.equal(rainPathAttenuation(0, 1000, 0).attenuation, 0);
  assert.equal(rainPathAttenuation(25 * mmh, 0, 0).attenuation, 0);
  assert.ok(Number.isNaN(rainSpecificAttenuation(-1 * mmh)));
  assert.ok(Number.isNaN(rainPathAttenuation(25 * mmh, -1).attenuation));
  // µ = 0 at 0.1 mm/h over 1 km: the fit gives 0.063 dB (rising as R → 0); the taper uses G(1 mm/h, 1 km) = p₀ =
  // 0.01594 scaled by A′(0.1)/A′(1) = 0.294314/1.294967 → 0.003623 dB, A = 0.290691 dB (hand).
  const low = rainPathAttenuation(0.1 * mmh, 1000, 0);
  assert.ok(low.gainFit > 0.06);
  close(low.gain, 0.003622, 1e-3);
  close(low.attenuation, 0.290691, 1e-5);
  // Continuous at 1 mm/h.
  const below = rainPathAttenuation(0.999999 * mmh, 1000, 0), at = rainPathAttenuation(1 * mmh, 1000, 0);
  close(below.gain, at.gain, 1e-5);
  // µ = 2 at 0.5 mm/h: the fit gives G_ms < 0 and G_ms(1 mm/h) < 0 too; the gain is 0, so A = A′, never above it.
  const neg = rainPathAttenuation(0.5 * mmh, 1000, 2);
  assert.ok(neg.gainFit < 0);
  assert.equal(neg.attenuation, neg.reduced);
  // 10 m path at 1 mm/h: G_ms > A′, clamped so A = 0, not negative.
  assert.equal(rainPathAttenuation(1 * mmh, 10, 1).attenuation, 0);
});

test("snow at 5 mm/h, 1550 nm: dry 51.43, wet 12.57 dB/km (Awan 2010 eq. 3.29, hand)", () => {
  // dry: a = 5.42e-5·1550 + 5.4958776 = 5.5798876; 5^1.38 = 9.216769 → 51.4285.
  // wet: a = 1.023e-4·1550 + 3.7855466 = 3.9441116; 5^0.72 = 3.186088 → 12.5663.
  close(snowPowerLaw(1550e-9, "dry").a, 5.5798876, 1e-9);
  close(snowSpecificAttenuation(5 * mmh, 1550e-9, "dry") * 1000, 51.4285, 1e-4);
  close(snowSpecificAttenuation(5 * mmh, 1550e-9, "wet") * 1000, 12.5663, 1e-4);
  // 780 nm, 1 mm/h, dry: a = 5.42e-5·780 + 5.4958776 = 5.5381536 dB/km.
  close(snowSpecificAttenuation(1 * mmh, 780e-9, "dry") * 1000, 5.5381536, 1e-9);
  // Koschmieder cross-check of the water-equivalent reading: 51.4 dB/km = 11.84 km⁻¹, the extinction of V = 0.33 km.
  close(3.912 / ((snowSpecificAttenuation(5 * mmh, 1550e-9, "dry") * 1000) / (10 / Math.LN10)), 0.33, 0.01);
});

test("snow edge cases: wet exceeds dry only below 0.59 mm/h, zero rate gives 0, bad inputs give NaN", () => {
  // a_dry S^1.38 = a_wet S^0.72 at S = (a_wet/a_dry)^(1/0.66) = 0.5911 mm/h at 1550 nm.
  const cross = (3.9441116 / 5.5798876) ** (1 / 0.66);
  close(cross, 0.5911, 1e-3);
  assert.ok(snowSpecificAttenuation(0.5 * mmh, 1550e-9, "wet") > snowSpecificAttenuation(0.5 * mmh, 1550e-9, "dry"));
  assert.ok(snowSpecificAttenuation(1 * mmh, 1550e-9, "wet") < snowSpecificAttenuation(1 * mmh, 1550e-9, "dry"));
  assert.equal(snowSpecificAttenuation(0, 1550e-9, "dry"), 0);
  assert.ok(Number.isNaN(snowSpecificAttenuation(-1, 1550e-9, "dry")));
  assert.ok(Number.isNaN(snowSpecificAttenuation(1 * mmh, 0, "wet")));
});
