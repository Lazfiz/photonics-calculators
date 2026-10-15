import test from "node:test";
import assert from "node:assert/strict";

import { measuredRate } from "../src/physics/detectors/dead-time";
import {
  arrheniusFactor, countingSnr, darkCountRate, dbmToWatts, doublingInterval, overbiasAtTemperature, photonRate,
  trapEfficiencyAtOverbias, triggerProbability,
} from "../src/physics/detectors/spad";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

// Hamamatsu S13360-3050CS datasheet (KAPD1052E): V_BR = 53 V, PDE 40 % at 450 nm and ΔV = 3 V, 54 mV/°C.
// Otte et al. 2017 Table 1: α = 0.0395 (relative overvoltage, 452 nm), so V_c = 0.0395 · 53 V = 2.0935 V.
const VC = 0.0395 * 53;

test("trigger probability 1 − e^{−ΔV/V_c} (Otte et al. 2017 eq. 5)", () => {
  // Otte's operating point is 90 % breakdown probability: ΔV = V_c·ln 10.
  close(triggerProbability(Math.LN10 * VC, VC), 0.9, 1e-14);
  // S13360 at 3 V: P_t = 1 − e^{−1.433007} = 0.761410, so PDE_max = 0.40/0.761410 = 0.52534 (Otte measured 52 % at 90 %).
  close(triggerProbability(3, VC), 0.7614095812, 1e-9);
  close(0.4 / triggerProbability(3, VC), 0.525341, 1e-5);
  // Small ΔV: P_t → ΔV/V_c without cancellation.
  close(triggerProbability(1e-9, 1), 1e-9, 1e-8);
  assert.equal(triggerProbability(0, VC), 0);
  assert.equal(triggerProbability(-1, VC), 0);
  assert.ok(Number.isNaN(triggerProbability(1, 0)));
});

test("Arrhenius dark counts: doubling step and Korzh's −50 → −110 °C drop", () => {
  // ln 2·k_B·T²/E_a with E_a = 0.85 eV (Webster & Henderson 2013): 0.693147 · 8.617333e-5 · 273.15² / 0.85 = 5.243 K
  // at 0 °C; Otte et al. 2017 Fig. 23 measured a doubling every 5.3 °C for the Hamamatsu SiPM (−40 to 40 °C).
  close(doublingInterval(0.85, 273.15), 5.24302, 1e-5);
  close(doublingInterval(0.85, 273.15), 5.3, 0.02, "vs Otte");
  // The rate doubles over one doubling step centred on T (to second order in ΔT/T).
  const d2 = doublingInterval(0.85, 298.15);
  close(arrheniusFactor(0.85, 298.15 + d2 / 2, 298.15 - d2 / 2), 2, 1e-3);
  // E_a = 0.25 eV: e^{(0.25/8.617333e-5)(1/163.15 − 1/223.15)} = e^{4.7812} = 119.3, Korzh et al. 2014's "over two
  // orders of magnitude" between −50 and −110 °C.
  close(arrheniusFactor(0.25, 223.15, 163.15), 119.25, 1e-3);
  assert.equal(arrheniusFactor(0.5, 250, 250), 1);
  assert.ok(Number.isNaN(arrheniusFactor(0.5, 0, 250)));
});

test("DCR at a fixed supply: V_br drift, Arrhenius, field slope and P_t", () => {
  // 25 → 50 °C at 54 mV/K: ΔV = 3 − 1.35 = 1.65 V. Hand calculation, 139 cps at 25 °C and 3 V:
  // Arrhenius e^{(0.85/8.617333e-5)(1/298.15 − 1/323.15)} = 12.928; field e^{0.159057·(−1.35)} = 0.80676 (b = 8.43/53 V⁻¹,
  // Otte Table 2); P_t(1.65)/P_t(3) = 0.54532/0.76141 = 0.71620. 139 · 12.928 · 0.80676 · 0.71620 = 1038.4 cps.
  const dv = overbiasAtTemperature(3, 0.054, 50, 25);
  close(dv, 1.65, 1e-12);
  const base = { dcrRef: 139, refTemperature: 298.15, activationEnergy: 0.85, overbiasRef: 3, voltageScale: VC, fieldSlope: 8.43 / 53 };
  close(darkCountRate({ ...base, temperature: 323.15, overbias: dv }), 1038.4, 2e-4);
  close(darkCountRate({ ...base, temperature: 298.15, overbias: 3 }), 139, 1e-14);
  // Hot enough to cross breakdown: 25 + 3/0.054 = 80.6 °C.
  assert.equal(darkCountRate({ ...base, temperature: 363.15, overbias: overbiasAtTemperature(3, 0.054, 90, 25) }), 0);
  assert.ok(Number.isNaN(darkCountRate({ ...base, overbiasRef: 0, temperature: 298.15, overbias: 3 })));
});

test("trap efficiency scales with avalanche charge and P_t (Cova 1991; the form of Otte 2017 eq. 14)", () => {
  close(trapEfficiencyAtOverbias(0.05, 3, 3, VC), 0.05, 1e-14);
  // 3 → 6 V: 2 · P_t(6)/P_t(3) = 2 · 0.9430747/0.7614096 = 2.47718.
  close(trapEfficiencyAtOverbias(0.05, 6, 3, VC), 0.05 * 2.47718, 1e-5);
  assert.equal(trapEfficiencyAtOverbias(0.5, 30, 3, VC), 1);
  assert.equal(trapEfficiencyAtOverbias(0.05, -1, 3, VC), 0);
});

test("counting SNR of the dead-time corrected photon rate", () => {
  // No dead time, no afterpulses: R_s·T/√((R_s + R_d)T) = 900/√1000 = 28.4605.
  close(countingSnr({ signalRate: 900, darkRate: 100, afterpulseProb: 0, deadTime: 0, gateTime: 1 }), 28.46050, 1e-6);
  // Dead time only: the corrected rate has relative error 1/√N_recorded (Müller 1973; detectors part 6a).
  // R = 6e5, Rτ = 0.6, N = 6e5/1.6 · 0.01 = 3750: (5/6)·√3750 = 51.0310.
  close(countingSnr({ signalRate: 5e5, darkRate: 1e5, afterpulseProb: 0, deadTime: 1e-6, gateTime: 0.01 }), 51.0310, 1e-5);
  // Afterpulses: N = 1e6/1.5 · 5e-3 = 3333.3, extra variance 1.5²·0.2·0.8/1.2² = 0.25: √3333.3/√1.25 = 51.640.
  // A Monte Carlo of the same counting model (3000 gates) gave 51.4 ± 0.7.
  close(countingSnr({ signalRate: 1e6, darkRate: 0, afterpulseProb: 0.2, deadTime: 5e-7, gateTime: 5e-3 }), 51.6398, 1e-5);
  // Deep saturation, Rτ = 1.9: mT = 1e6/2.9 · 3e-3 = 1034.48, extra 2.9²·0.16/1.44 = 0.93444, √1034.48/√1.93444 = 23.125.
  // The physics review's independent Monte Carlo (6000 gates) gave 23.15.
  close(countingSnr({ signalRate: 1e6, darkRate: 0, afterpulseProb: 0.2, deadTime: 1.9e-6, gateTime: 3e-3 }), 23.125, 2e-4);
  // Page defaults. SPCM-AQRH-14: 1 pW at 650 nm, PDE 0.65 → R_s = 2.126914e6, R = R_s + 100, Rτ = 0.046794 (22 ns),
  // m·T = 2.031931e6, extra 1.046794²·0.005·0.995/1.005² = 0.0053975: (R_s/R)·√(mT)/√1.0053975 = 1421.56.
  close(countingSnr({ signalRate: photonRate(1e-12, 650e-9) * 0.65, darkRate: 100, afterpulseProb: 0.005, deadTime: 22e-9, gateTime: 1 }), 1421.56, 1e-5);
  // Korzh NFAD: −120 dBm at 1550 nm, 11.5 % → R_s = 897.331, R = 898.521, Rτ = 0.0179704 (20 µs), m·T = 882.657,
  // extra 1.0179704²·0.022·0.978/1.022² = 0.0213530: 0.998676·29.70954/1.0106201 = 29.3585.
  close(countingSnr({ signalRate: photonRate(dbmToWatts(-120), 1550e-9) * 0.115, darkRate: 1.19, afterpulseProb: 0.022, deadTime: 20e-6, gateTime: 1 }), 29.3585, 1e-5);
  assert.equal(countingSnr({ signalRate: 0, darkRate: 0, afterpulseProb: 0, deadTime: 1e-8, gateTime: 1 }), 0);
  assert.ok(Number.isNaN(countingSnr({ signalRate: 1, darkRate: 0, afterpulseProb: 1, deadTime: 0, gateTime: 1 })));
  assert.ok(Number.isNaN(countingSnr({ signalRate: 1, darkRate: 0, afterpulseProb: 0, deadTime: 0, gateTime: 0 })));
});

test("photon rate, dBm, and the SPCM-AQRH dead-time correction factor", () => {
  // 1 pW at 650 nm: 1e-12 · 650e-9 / (6.62607015e-34 · 299792458) = 3.27218e6 photons/s.
  close(photonRate(1e-12, 650e-9), 3.27218e6, 1e-5);
  close(dbmToWatts(-120), 1e-15, 1e-12);
  assert.ok(Number.isNaN(photonRate(1e-12, 0)));
  // Excelitas SPCM-AQRH datasheet (Rev 2023-1): 22 ns dead time and a linearity correction factor of 1.02 at 1 Mc/s.
  // Non-paralyzable: R/m = 1/(1 − mτ) = 1.02249; check that R recorded through 22 ns returns 1 Mc/s.
  const R = 1e6 / (1 - 1e6 * 22e-9);
  close(measuredRate(R, 22e-9, "nonparalyzable"), 1e6, 1e-12);
  close(R / 1e6, 1.02, 0.005, "vs datasheet");
});
