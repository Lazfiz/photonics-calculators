import assert from "node:assert/strict";
import test from "node:test";

import { spadSnrAtPower, spadSummary } from "../src/physics/detectors/spad-summary";

const rel = (a: number, e: number, tol: number, label: string) => assert.ok(Math.abs(a / e - 1) < tol, `${label}: ${a} vs ${e}`);

// Knoll, Radiation Detection and Measurement, 4th ed., ch. 4 (m = R/(1 + Rτ)); Webster & Henderson, IEEE TED 60, 4014 (2013), doi:10.1109/TED.2013.2285163.
const point = {
  pde: 0.115, dcrRef: 1.19, refTemperatureC: -110, temperatureC: -110, activationEnergy: 0.25, deadTime: 20e-6,
  afterpulseProb: 0.022, powerDbm: -120, wavelength: 1550e-9, gate: 1,
};

test("spadSummary: defaults, hand-worked (P = 1e-15 W, R = 0.115·Pλ/hc + 1.19, m = R/(1 + Rτ))", () => {
  const r = spadSummary(point);
  rel(r.photons, 7802.8806797, 1e-9, "photons");
  rel(r.dcr, 1.19, 1e-12, "dcr");
  rel(r.rate, 898.52127816, 1e-9, "R");
  rel(r.measured, 882.65951112, 1e-9, "m");
  rel(r.loss, 0.01765319022, 1e-9, "loss");
  rel(r.afterpulseRate, 19.4185092, 1e-8, "afterpulse rate");
  rel(r.snr, 29.35854003, 1e-9, "snr");
  rel(r.doubling, 6.35963949, 1e-8, "doubling");
});

test("spadSnrAtPower: ideal counter at the same power, and NaN for an invalid wavelength", () => {
  // τ = 0, P_ap = 0: SNR = R_s·T/√((R_s + R_d)·T), R_s = 0.115·7802.8806797 = 897.3312782, R_d = 1.19
  const rs = 0.115 * 7802.8806797;
  rel(spadSnrAtPower(point, -120, true), (rs * 1) / Math.sqrt(rs + 1.19), 1e-9, "ideal snr");
  assert.ok(Number.isNaN(spadSnrAtPower({ ...point, wavelength: 0 }, -120)));
});
