// Null outputs and their reasons in single API schemas, for runs the min/max sweep in api-schemas.test.ts doesn't reach.
import test from "node:test";
import assert from "node:assert/strict";

import { parseInputs, runSchema } from "../src/schemas/run";
import type { CalculatorSchema } from "../src/schemas/types";
import greenLaserPointer from "../src/schemas/laser-safety/green-laser-pointer";
import electroOptic from "../src/schemas/materials/electro-optic";
import radiationDamage from "../src/schemas/materials/radiation-damage";
import thermalConductivityOptics from "../src/schemas/materials/thermal-conductivity-optics";
import fourWaveMixing from "../src/schemas/wave-optics/four-wave-mixing";
import opo from "../src/schemas/wave-optics/optical-parametric-oscillator";
import soliton from "../src/schemas/wave-optics/soliton";

function run(schema: CalculatorSchema, inputs: Record<string, number | string>) {
  const parsed = parseInputs(schema, new URLSearchParams(Object.entries(inputs).map(([k, v]) => [k, String(v)])));
  assert.ok(parsed.ok, `${schema.href}: ${!parsed.ok && parsed.error}`);
  return runSchema(schema, parsed.values);
}

/** Each null output has a reason, and each reason is among the warnings. */
function assertNullsExplained(result: ReturnType<typeof runSchema>, label: string) {
  for (const [key, value] of Object.entries(result.outputs)) {
    if (value !== null) continue;
    assert.ok(result.reasons[key], `${label}: ${key} is null without a reason`);
    assert.ok(result.warnings.includes(result.reasons[key]), `${label}: ${key}'s reason is not a warning`);
  }
}

test("electro-optic: BSO outside its 500–800 nm table gives the optical rotation the index-range reason", () => {
  for (const wavelength of [250, 450, 900]) {
    const r = run(electroOptic, { material: "bso", wavelength });
    assert.equal(r.outputs.rotation, null);
    assert.equal(r.reasons.rotation, "The wavelength is outside the index model's range.");
    assertNullsExplained(r, `bso ${wavelength} nm`);
  }
  // Inside the table the rotation is a number, and a crystal without optical activity gives 0 anywhere.
  assert.ok(Number.isFinite(run(electroOptic, { material: "bso", wavelength: 633 }).outputs.rotation));
  assert.equal(run(electroOptic, { material: "kdp", wavelength: 5000 }).outputs.rotation, 0);
});

test("green-laser-pointer: a wavelength outside the limits gives the class and NOHD a reason", () => {
  // The API's wavelength range is the limits' 180 nm – 1 mm, so this calls compute directly, in SI.
  const limits = "The limits cover 180 nm to 1 mm.";
  const si = { power: 5e-3, wavelength: 150e-9, beamDia: 1.5e-3, divergence: 1.2e-3, distance: 10 };
  const r = greenLaserPointer.compute(si as unknown as Parameters<typeof greenLaserPointer.compute>[0]);
  assert.ok(Number.isNaN(r.values.classRank) && Number.isNaN(r.values.nohd));
  assert.equal(r.reasons?.classRank, limits);
  assert.equal(r.reasons?.nohd, limits);
  assert.equal(r.warnings?.filter((w) => w === limits).length, 1);
  const inside = run(greenLaserPointer, {});
  assert.ok(Number.isFinite(inside.outputs.nohd) && Number.isFinite(inside.outputs.classRank));
  assert.equal(inside.reasons.nohd, undefined);
});

test("thermal-conductivity-optics: with dn/dT entered, a zero dn/dT or power gives the no-lens reason", () => {
  const noLens = "No thermal lens: zero absorbed power or dn/dT = 0.";
  const cases: Record<string, number>[] = [{ dndT: 0 }, { dndT: 5, power: 0 }];
  for (const inputs of cases) {
    const r = run(thermalConductivityOptics, inputs);
    assert.equal(r.outputs.focalLength, null, JSON.stringify(inputs));
    assert.equal(r.reasons.focalLength, noLens);
    assertNullsExplained(r, JSON.stringify(inputs));
  }
  // The preset path is unchanged: zero power, no lens.
  assert.equal(run(thermalConductivityOptics, { power: 0 }).reasons.focalLength, noLens);
  // An entered negative dn/dT now gets the diverging-lens note the preset path already gave.
  const diverging = run(thermalConductivityOptics, { k: 10, dndT: -10, thickness: 5, area: 50, power: 2 });
  // f = 2kA/(P dn/dT) = 2 · 10 · 5e-5/(2 · −10e-6) = −50 m (the schema's Koechner check).
  assert.ok(Math.abs((diverging.outputs.focalLength ?? NaN) + 50) < 1e-9);
  assert.ok(diverging.warnings.includes("Negative focal length: a diverging lens (dn/dT < 0)."));
});

test("soliton: β₂ = 0 explains every null (period, order, count, strongest soliton)", () => {
  const r = run(soliton, { beta2: 0 });
  for (const key of ["dispersionLength", "solitonPeriod", "solitonOrder", "solitonCount", "strongestSolitonPower"]) {
    assert.equal(r.outputs[key], null, key);
  }
  assert.equal(r.reasons.solitonPeriod, r.reasons.dispersionLength);
  assert.match(r.reasons.solitonCount, /^Zero dispersion \(β₂ = 0\): no soliton forms/);
  assert.equal(r.reasons.solitonOrder, r.reasons.solitonCount);
  assert.equal(r.reasons.strongestSolitonPower, r.reasons.solitonCount);
  assertNullsExplained(r, "β₂ = 0");
  // With no peak power as well, N = 0/0: still explained.
  assertNullsExplained(run(soliton, { beta2: 0, peakPower: 0 }), "β₂ = 0, P₀ = 0");
  // Anomalous and normal dispersion keep their own reasons.
  assert.equal(run(soliton, {}).reasons.solitonCount, undefined);
  assert.match(run(soliton, { beta2: 10 }).reasons.solitonCount, /^Normal dispersion/);
});

test("four-wave-mixing: no idler and no pump gives the gain-peak shift its own reason", () => {
  const r = run(fourWaveMixing, { wavelengthSignal: 700, pumpPower: 0 });
  assert.equal(r.outputs.peakWavelengthShift, null);
  assert.match(r.reasons.peakWavelengthShift, /^With no pump there is no parametric gain band/);
  assert.match(r.reasons.idlerWavelength, /no idler/);
  assertNullsExplained(r, "no idler, no pump");
  // With an idler and no pump the existing no-pump reason still applies; with no idler and a pump the peak shift is a number.
  assert.match(run(fourWaveMixing, { pumpPower: 0 }).reasons.peakWavelengthShift, /^With no pump there is no four-wave mixing/);
  assert.ok(Number.isFinite(run(fourWaveMixing, { wavelengthSignal: 700 }).outputs.peakWavelengthShift));
});

test("radiation-damage: \"needs A₁ > 0\" only when A₁ = 0; an overflowing dose has its own reason", () => {
  const needsA1 = "No dose reaches the loss budget: it needs A₁ > 0.";
  const zero = run(radiationDamage, { a1: 0 });
  assert.equal(zero.outputs.doseAtBudget, null);
  assert.equal(zero.reasons.doseAtBudget, needsA1);
  // (1000 dB/(1e-6 dB/m · 1e-6 m))^(1/0.01) = (1e15)^100 overflows although A₁ > 0.
  const huge = run(radiationDamage, { a1: 1e-6, exponent: 0.01, length: 0.001, lossBudget: 1000 });
  assert.equal(huge.outputs.doseAtBudget, null);
  assert.match(huge.reasons.doseAtBudget, /^The dose at the loss budget is beyond floating point/);
  assert.ok(!huge.warnings.includes(needsA1));
  assertNullsExplained(huge, "dose overflow");
  // A zero budget is reached at zero dose: no warning at all.
  const none = run(radiationDamage, { lossBudget: 0 });
  assert.equal(none.outputs.doseAtBudget, 0);
  assert.deepEqual(none.warnings, []);
});

test("optical-parametric-oscillator: the signal-longer-than-pump reason fires only when λ_s ≤ λ_p", () => {
  const noResult = "No result: the signal wavelength must be longer than the pump wavelength.";
  for (const signalWavelength of [400, 532]) {
    const r = run(opo, { signalWavelength });
    assert.equal(r.reasons.thresholdPower, noResult, `λ_s = ${signalWavelength} nm`);
    assertNullsExplained(r, `λ_s = ${signalWavelength} nm`);
  }
  // λ_s > λ_p at the gain extremes (no pump; 1 MW into 1 µm, 200 mm, 100 pm/V): no such warning, and every null is explained.
  const cases: Record<string, number>[] = [
    { pumpPower: 0 },
    { pumpWavelength: 4000, signalWavelength: 4100, crystalLength: 200, dEff: 100, pumpPower: 1e6, beamRadius: 1, walkOff: 0 },
  ];
  for (const inputs of cases) {
    const r = run(opo, inputs);
    assert.ok(!r.warnings.includes(noResult), JSON.stringify(inputs));
    assertNullsExplained(r, JSON.stringify(inputs));
  }
  // The second case's gain overflows cosh²; with n_p = n_s = n_i = 1 at 500 → 1000 nm, Δk is exactly 0.
  assert.match(run(opo, cases[1]).reasons.singlePassGain, /^The single-pass gain cosh²\(gL_eff\) − 1 overflows/);
  const matched = run(opo, { pumpWavelength: 500, signalWavelength: 1000, nPump: 1, nSignal: 1, nIdler: 1 });
  assert.equal(matched.outputs.phaseMismatch, 0);
  assert.match(matched.reasons.qpmPeriod, /^Δk = 0: these indices are already phase matched/);
});
