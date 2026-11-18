// Golden values for the sensor-cmos page summary (hand-worked from Janesick, Photon Transfer, SPIE 2007,
// doi:10.1117/3.725073, SNR = S/√(S + D + σ_read² + σ_q²); dark charge from the doubling law I ∝ 2^((T − 25 °C)/T_d)).
import assert from "node:assert/strict";
import { test } from "node:test";
import { SENSOR_PRESETS, sensorCmosSummary } from "../src/physics/imaging/sensor-cmos";

const close = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${a} vs ${b}`);
const cmos = { photons: 1000, quantumEfficiency: 0.7, pitch: 6.5e-6, well: 25000, read: 1.5, darkRef: 2, temp: 0, doubling: 6, exposure: 0.1, electronsPerDn: 0.5, bits: 16 };

test("sensor-cmos summary: air-cooled sCMOS preset SNR and noise floor", () => {
  const s = sensorCmosSummary(cmos);
  // D = 2·2^(−25/6)·0.1 = 0.011136234; floor² = 2.25 + D + 0.25/12 = 2.2819...; noise² = 700 + floor².
  close(s.dark, 0.01113623397675424);
  close(s.floor, 1.510618935175277);
  close(s.snr, 700 / Math.sqrt(700 + 1.510618935175277 ** 2));
  close(s.snr, 26.41449309341101);
  assert.equal(s.saturated, false);
  assert.equal(SENSOR_PRESETS.cmos.pixelPitch, 6.5);
});

test("sensor-cmos summary: the ADC clips before the well on the CCD preset; dynamic range", () => {
  const s = sensorCmosSummary({ photons: 20000, quantumEfficiency: 0.92, pitch: 16e-6, well: 80000, read: 8, darkRef: 200, temp: -70, doubling: 6, exposure: 1, electronsPerDn: 1.2, bits: 16 });
  // K·(2^16 − 1) = 1.2·65535 = 78642 e⁻ < 80000; DR = 20·log₁₀((78642 − 0.0034255)/8.0077104) = 79.842923 dB.
  close(s.adcFullScale, 78642);
  close(s.maxSignal, 78642);
  close(s.drExposureDb, 79.84292347418267);
  close(s.drDatasheetDb, 80);
});

test("sensor-cmos summary: edge cases (saturation, no dark current, dark charge fills the well)", () => {
  assert.equal(sensorCmosSummary({ ...cmos, photons: 1e7 }).saturated, true);
  assert.ok(Number.isNaN(sensorCmosSummary({ ...cmos, photons: 1e7 }).snr));
  const noDark = sensorCmosSummary({ ...cmos, darkRef: 0 });
  assert.equal(noDark.crossoverInRange, false);
  assert.ok(Number.isNaN(noDark.crossoverTemp));
  const full = sensorCmosSummary({ ...cmos, darkRef: 1e5, temp: 60, exposure: 3600 });
  assert.ok(Number.isNaN(full.drExposureDb));
});

test("sensor-cmos summary: dark-equals-read crossover temperature and densities", () => {
  const s = sensorCmosSummary(cmos);
  // T* = 25 + 6·log₂(1.5²/(2·0.1)) = 25 + 6·log₂(11.25) = 45.951119 °C.
  close(s.crossoverTemp, 45.95111857797805);
  // q·R/p² = 1.602176634e-19·2/(6.5e-6)² = 7.584268e-9 A/m²; FW/p² = 25000/(6.5e-6)² e⁻/m².
  close(s.darkDensity, 7.584268089940829e-9);
  close(s.wellDensity, 591.7159763313609e12);
});
