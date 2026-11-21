import test from "node:test";
import assert from "node:assert/strict";

import { phaseQuantizationEfficiency } from "../src/physics/imaging/holography";
import {
  type SteeringSetup, gapOrderEfficiency, lcosSteering, phaseStroke, rampOrderEfficiency, steeringAngle, thicknessFor2Pi,
} from "../src/physics/spatial-light-modulators/lcos-steering";
import schema from "../src/schemas/spatial-light-modulators/lcos-steering";
import { runSchema } from "../src/schemas/run";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);
const DEG = 180 / Math.PI;
// Hamamatsu X15213 (Applications and Features, Cat. No. LLAP3012E05, 2024): 12.5 µm pitch, fill factor 96.8 %,
// 1272 × 1024 pixels; the X15213-01 (400–700 nm) is measured at 633 nm. Δn and t are illustrative.
const x15213: SteeringSetup = {
  lambda: 633e-9, pitch: 12.5e-6, period: 4, fillFactor: 0.968, gap: "absorbing", deltaN: 0.2, thickness: 2.5e-6, focal: 0.2, pixels: 1272,
};
const run = (values: Record<string, number | string>) =>
  runSchema(schema, {
    ...Object.fromEntries(schema.inputs.map((i) => [i.key, i.default])),
    ...Object.fromEntries((schema.choices ?? []).map((c) => [c.key, c.default])),
    ...values,
  });

test("Hamamatsu X15213 note, Feature 3: 2-level grating 40 lp/mm, 4-level 20 lp/mm at 12.5 µm pitch", () => {
  close(lcosSteering({ ...x15213, period: 2 }).gratingFrequency, 40e3, 1e-12);
  const r = lcosSteering(x15213);
  close(r.gratingFrequency, 20e3, 1e-12);
  // arcsin(0.633/50) = 0.725384°; N = 2 is the largest angle, arcsin(0.633/25) = 1.450884°.
  close(r.angle * DEG, 0.725384, 1e-6);
  close(r.maxAngle * DEG, 1.450884, 1e-6);
  close(steeringAngle(633e-9, 12.5e-6, 2), r.maxAngle, 1e-12);
  // f tan θ at f = 200 mm: 2.53220 mm; λf/d = 10.128 mm; over 1272 pixels 7.96226 µm.
  close(r.spotShift, 2.53220e-3, 1e-5);
  close(r.replayField, 10.128e-3, 1e-12);
  close(r.spotSize, 7.96226e-6, 1e-5);
});

test("F = 100 %: the steered order is sinc²(π/N), Swanson's N-level efficiency (4/π², 81.06 %, 94.96 %, 98.72 %)", () => {
  for (const [N, eta] of [[2, 4 / Math.PI ** 2], [4, 0.810569], [8, 0.949641], [16, 0.987215]]) {
    close(rampOrderEfficiency(N, 1, 0), eta, 1e-5, `N = ${N}`);
    close(rampOrderEfficiency(N, 1, 0), phaseQuantizationEfficiency(N), 1e-12);
  }
  // N = 2 is a binary π grating: the alias (−1 order) gets as much as the steered one.
  close(rampOrderEfficiency(2, 0.968, -1), rampOrderEfficiency(2, 0.968, 0), 1e-12);
});

test("Fill factor: F² sinc²(π√F/N); Naber et al. 2016: 87 % fill → (fill factor)² = 76 %", () => {
  const r = lcosSteering(x15213);
  // sinc²(π·0.983870/4) = 0.816151; × 0.968² = 0.764753. Alias: sinc²(3π·0.983870/4) × 0.937024 = 0.0938016.
  close(r.relativeEfficiency, 0.816151, 1e-5);
  close(r.efficiency, 0.764753, 1e-5);
  close(r.aliasEfficiency, 0.0938016, 1e-5);
  close(r.pixelation, 0.810569, 1e-5);
  const pluto = lcosSteering({ ...x15213, fillFactor: 0.87, period: 1000 });
  close(pluto.fillLimit, 0.7569, 1e-12);
  close(pluto.efficiency, 0.76, 0.005, "printed 76 %");
});

test("Power bookkeeping: the ramp orders of one row add to F^1.5, the gap orders to (1 − √F)(1 + √F − F)", () => {
  // Row ν_y = 0 of a pixel of side √F d: Σ_k F² sinc²(π√F(k + 1/N)) = F² · (1/√F) by Parseval on the √F-wide rect,
  // for any N. The unmodulated gap 1 − rect(√F) along x averaged over y gives the second sum. Tails beyond |k| = 20000
  // carry about 1e-5 of the total.
  for (const F of [1, 0.968, 0.6]) {
    for (const N of [2, 3.7, 8]) {
      let s = 0;
      for (let k = -20000; k <= 20000; k++) s += rampOrderEfficiency(N, F, k);
      close(s, F ** 1.5, 2e-5, `F = ${F}, N = ${N}`);
    }
  }
  let g = 0;
  for (let k = -20000; k <= 20000; k++) g += gapOrderEfficiency(0.968, k);
  const q = Math.sqrt(0.968);
  close(g, (1 - q) * (1 + q - 0.968), 2e-3);
  close(gapOrderEfficiency(0.968, 0), 0.032 ** 2, 1e-12);
  assert.equal(lcosSteering(x15213).zeroOrder, 0);
  close(lcosSteering({ ...x15213, gap: "mirror" }).zeroOrder, 0.001024, 1e-9);
});

test("Zhang, You and Chu 2014, Eqs. 3–4: δ = 2πΔn·2t/λ; 2π needs t = λ/(2Δn)", () => {
  close(thicknessFor2Pi(633e-9, 0.2), 1.5825e-6, 1e-12);
  close(phaseStroke(633e-9, 0.2, 1.5825e-6), 2 * Math.PI, 1e-12);
  const r = lcosSteering(x15213);
  close(r.stroke / (2 * Math.PI), 1.579779, 1e-6);
  close(r.maxWavelength, 1000e-9, 1e-12);
  assert.ok(r.reaches2Pi);
  // Exactly 2π still blazes; just under it does not, and the efficiencies are withheld.
  assert.ok(lcosSteering({ ...x15213, thickness: 1.5825e-6 }).reaches2Pi);
  const thin = lcosSteering({ ...x15213, thickness: 1.5e-6 });
  assert.equal(thin.reaches2Pi, false);
  assert.ok(Number.isNaN(thin.efficiency) && Number.isNaN(thin.zeroOrder) && Number.isNaN(thin.aliasEfficiency));
  close(thin.pixelation, 0.810569, 1e-5);
});

test("Domain: below 2 pixels and evanescent orders give NaN", () => {
  assert.ok(Number.isNaN(steeringAngle(633e-9, 12.5e-6, 1.5)));
  assert.ok(Number.isNaN(rampOrderEfficiency(1.9, 1, 0)));
  assert.ok(Number.isNaN(rampOrderEfficiency(4, 1.2, 0)));
  // 2500 nm on 1 µm pixels: λ/(2d) = 1.25.
  assert.ok(Number.isNaN(steeringAngle(2500e-9, 1e-6, 2)));
});

test("API schema: nulls carry reasons (evanescent orders, stroke below 2π, reflecting gaps)", () => {
  const ir = run({ wavelength: 2500, pitch: 1, period: 2 });
  assert.equal(ir.outputs.angle, null);
  assert.equal(ir.outputs.maxAngle, null);
  assert.ok(ir.warnings.some((w) => w.includes("evanescent")));
  const thin = run({ thickness: 0.5 });
  assert.equal(thin.outputs.efficiency, null);
  assert.ok(thin.warnings.some((w) => w.includes("below 2π")));
  // 2500 nm on 1 µm pixels with N = 2: sin θ = 1.25, so the steered and alias orders carry nothing away.
  const gone = run({ wavelength: 2500, pitch: 1, period: 2, thickness: 20 });
  assert.equal(gone.outputs.efficiency, null);
  assert.equal(gone.outputs.aliasEfficiency, null);
  assert.equal(gone.outputs.relativeEfficiency, null);
  assert.ok(gone.warnings.every((w) => !w.includes("below 2π")));
  const mirror = run({ gap: "mirror" });
  assert.equal(mirror.outputs.relativeEfficiency, null);
  assert.ok(mirror.warnings.some((w) => w.includes("gaps' phase")));
  close(mirror.outputs.zeroOrder as number, 0.1024, 1e-9);
});
