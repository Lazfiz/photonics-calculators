import assert from "node:assert/strict";
import test from "node:test";
import { SPUTTER_TARGETS, sputterYield, sputteringDeposition } from "../src/physics/thin-film/sputtering";
import { stressMeasurement } from "../src/physics/thin-film/stoney";
import { EVAPORANTS, thermalEvaporation } from "../src/physics/thin-film/thermal-evaporation";

const close = (a: number, b: number, rel = 1e-8) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} vs ${b}`);

test("sputteringDeposition, Al at 300 W / 500 V / γ 0.07 / 2 cm / 10 cm / 300 K substrate", () => {
  // Hand-worked: I_i = 300/(500·1.07) = 0.5607477 A; Φ = I_i/1.602176634e-19 · 1.05 = 3.674907e18 s⁻¹;
  // F = Φ/(π(0.02² + 0.1²)) = 1.124769e20 m⁻² s⁻¹; rate = F·0.026982/(2700·6.02214076e23) = 1.866477e-9 m/s.
  const t = SPUTTER_TARGETS.Al;
  const r = sputteringDeposition(t, {
    power: 300, voltage: 500, gamma: 0.07, Y: sputterYield(t, 0), targetRadius: 0.02, distance: 0.1, pressure: 0.4, substrateTemp: 300,
  });
  close(r.I, 0.6);
  close(r.Ii, 0.5607476635514018);
  close(r.Phi, 3.674907212065683e18);
  close(r.rate, 1.8664769777587042e-9);
  close(r.peak, 3.39 / 2); // Thompson peak U_s/2
  assert.equal(r.zone, 2); // 300/933.47 = 0.321, in [0.3, 0.45)
});

test("sputterYield: 0 selects the table value, otherwise the entry", () => {
  assert.equal(sputterYield(SPUTTER_TARGETS.Cu, 0), 2.35);
  assert.equal(sputterYield(SPUTTER_TARGETS.Cu, 1.7), 1.7);
});

test("thermalEvaporation, Al at 1473.15 K", () => {
  // log10(p/atm) = 5.911 − 16211/1473.15 → p = 0.8173463 Pa; Γ = p√(M/(2πRT)) = 4.839636e-4 kg/m²/s;
  // rate = Γ·r_s²/(ρ h²) = 4.839636e-4·1e-4/(2700·0.09) = 1.99162e-10 m/s; edge = 1/(1 + (0.05/0.3)²)² = 0.9466764.
  const r = thermalEvaporation(EVAPORANTS.Al, {
    T: 1473.15, h: 0.3, sourceRadius: 0.01, substrateRadius: 0.05, alpha: 1, chamberPressure: 1.3332236842105263e-4, substrateTemp: 373.15,
  });
  close(r.p, 0.8173463382214057);
  close(r.flux, 0.0004839635776117278);
  close(r.rate, 1.9916196609536124e-10);
  close(r.edge, 0.9466764061358658);
  close(r.homologous, 373.15 / 933.47);
  assert.equal(r.zone, 2); // 0.3997 in [0.3, 0.45)
  assert.equal(r.bigSource, false);
});

test("stressMeasurement, defaults of the page", () => {
  // κ = 2e-6/(6.25e-4 + 1e-12) = 3.2e-3; σ = 70e9·(5e-4)²·κ/(6·0.78·1e-7) = 119.658e6 Pa; σ_th = 70e9/0.83·8.5e-6·(−175) = −125.452e6 Pa.
  const r = stressMeasurement({
    a: 0.025, tS: 5e-4, tF: 1e-7, Es: 70e9, nuS: 0.22, Ef: 70e9, nuF: 0.17, alphaS: 9e-6, alphaF: 0.5e-6,
    hBefore: 0, hAfter: 1e-6, Tdep: 200, T: 25,
  });
  close(r.stress, 119.65811946666666e6);
  close(r.thermal, -125.45180722891565e6);
  close(r.intrinsic, 245.10992669558232e6);
  close(r.thicknessRatio, 2e-4);
  // Edge: no change of curvature gives zero stress.
  assert.equal(stressMeasurement({ a: 0.025, tS: 5e-4, tF: 1e-7, Es: 70e9, nuS: 0.22, Ef: 70e9, nuF: 0.17, alphaS: 0, alphaF: 0, hBefore: 2e-6, hAfter: 2e-6, Tdep: 0, T: 0 }).stress, 0);
});
