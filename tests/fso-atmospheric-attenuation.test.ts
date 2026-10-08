import test from "node:test";
import assert from "node:assert/strict";

import {
  DB_PER_NEPER, KOSCHMIEDER, aerosolExtinction, kimExponent, rayleighExtinction, standardAirIndex, totalExtinction,
} from "../src/physics/free-space-comms/atmospheric-attenuation";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

test("standard-air index at 550 nm: n − 1 = 2.7783e-4 (Peck & Reeder 1972, hand)", () => {
  // σ² = 3.30579: 8060.51 + 2480990/128.9682 + 17455.7/36.0238 = 27782.5 → 2.77825e-4.
  close(standardAirIndex(550e-9) - 1, 2.77825e-4, 1e-5);
});

test("Rayleigh extinction matches Hansen & Travis's optical depth over the standard column", () => {
  // Hansen & Travis, Space Sci. Rev. 16, 527 (1974): τ_R = 0.008569 λ⁻⁴ (1 + 0.0113 λ⁻² + 0.00013 λ⁻⁴), λ in µm,
  // for a 1013.25 hPa column. Sea-level β = τ N_s / N_column, N_column = p N_A/(M g) = 2.14825e29 m⁻²,
  // N_s = 2.54688e25 m⁻³ (15 °C).
  const ratio = 2.54688e25 / 2.14825e29;
  for (const um of [0.4, 0.55, 1.064, 1.55]) {
    const tau = 0.008569 * um ** -4 * (1 + 0.0113 * um ** -2 + 0.00013 * um ** -4);
    close(rayleighExtinction(um * 1e-6), tau * ratio, 0.01, `${um} µm`); // −0.46 % at all four
  }
  // The old atmospheric-attenuation page used 0.0084 λ⁻⁴ · 0.001 km⁻¹: 9.2e-5 km⁻¹ at 550 nm, 125× low.
  close(rayleighExtinction(550e-9) / (0.0084 * 0.55 ** -4 * 1e-6), 125, 0.02);
});

test("Koschmieder: at 550 nm the visibility distance transmits 2 % (17.0 dB), whatever the aerosol model", () => {
  for (const V of [300, 2000, 23000]) {
    const beta = totalExtinction(550e-9, V);
    close(Math.exp(-beta * V), 0.02, 1e-12, `V = ${V} m`);
    close(beta * V * DB_PER_NEPER, 16.9897, 1e-5);
  }
  assert.equal(aerosolExtinction(550e-9, 1e6), 0); // beyond the Rayleigh-limited visibility (~340 km)
});

test("Kim's exponent q(V) and the 1550 nm clear-air loss in dB/km, not Np/km", () => {
  assert.equal(kimExponent(60e3), 1.6);
  assert.equal(kimExponent(23e3), 1.3);
  close(kimExponent(3e3), 0.82, 1e-12);
  close(kimExponent(800), 0.3, 1e-12);
  assert.equal(kimExponent(300), 0);
  // V = 23 km, 1550 nm: aerosol (3.912/23 − 0.01150) · (1550/550)^−1.3 = 0.15859 · 0.26027 = 0.04128 km⁻¹
  // plus Rayleigh 1.8e-4 km⁻¹ → 0.04146 km⁻¹ = 0.180 dB/km.
  close(totalExtinction(1550e-9, 23e3) * 1e3, 0.04146, 3e-3);
  close(totalExtinction(1550e-9, 23e3) * 1e3 * DB_PER_NEPER, 0.1801, 3e-3);
  close(KOSCHMIEDER, 3.912, 1e-4);
});
