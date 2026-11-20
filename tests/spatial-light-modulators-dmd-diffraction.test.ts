import test from "node:test";
import assert from "node:assert/strict";

import {
  GEOMETRY_REASON, type DmdSetup, blazedIncidences, dmdDiffraction, nearestBlazedIncidence, ordersNearBlaze,
} from "../src/physics/spatial-light-modulators/dmd-diffraction";
import schema from "../src/schemas/spatial-light-modulators/dmd-diffraction";
import { runSchema } from "../src/schemas/run";

const DEG = Math.PI / 180;
const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);
// Brown et al. 2021 Table 1 device: d = 7.56 µm, γ = 12°; F = 0.92 (TI DLPA083B Table 2-1 on-state fill factors, 92–97 %,
// a power fraction used here as the area fraction).
const brown = (lambda_nm: number, incidence_deg: number, state: "on" | "off" = "on"): DmdSetup => ({
  pitch: 7.56e-6, tilt: 12 * DEG, lambda: lambda_nm * 1e-9, incidence: incidence_deg * DEG, fillFactor: 0.92, state,
});
const run = (values: Record<string, number | string>) =>
  runSchema(schema, {
    ...Object.fromEntries(schema.inputs.map((i) => [i.key, i.default])),
    ...Object.fromEntries((schema.choices ?? []).map((c) => [c.key, c.default])),
    ...values,
  });

test("Brown et al. 2021 Table 1, 465 nm: θa = 45.20° blazes order (4, −4) at θb = 21.20°", () => {
  const r = dmdDiffraction(brown(465, 45.2));
  assert.ok(r.nearest);
  assert.deepEqual([r.nearest.mx, r.nearest.my], [4, -4]);
  close(r.nearest.outputAngle / DEG, 21.2, 5e-4);
  close(r.onAngle / DEG, 21.2, 1e-12); // θi − 2γ
  close(r.blazeOrder, 4, 1e-4); // whole: on the blaze (45.20° is rounded)
  assert.ok(r.nearest.deviation / DEG < 0.001);
  close(r.nearest.envelope, 1, 1e-6);
  close(r.nearest.efficiency, 0.92 * 0.92, 1e-6);
  // Exact blazed incidence for order 4 (TI DLPA037A Eq. 7): 12° + acos(4 · 0.465/(√2 · 7.56 · sin 12°)) = 45.201°.
  const best = nearestBlazedIncidence(blazedIncidences(465e-9, 7.56e-6, 12 * DEG, "on"), 45.2 * DEG);
  assert.ok(best);
  assert.equal(best.order, 4);
  close(best.incidence / DEG, 45.2, 5e-4);
  close(best.output / DEG, 21.2, 5e-4);
});

test("Brown et al. 2021 Table 1, 635 nm at 45.89° and 532 nm (off state) at −2.09°: 21.20°, 0.69° and 0.71° from the blaze", () => {
  const red = dmdDiffraction(brown(635, 45.89)).nearest;
  assert.ok(red);
  assert.deepEqual([red.mx, red.my], [3, -3]);
  close(red.outputAngle / DEG, 21.2, 5e-4);
  close(red.deviation / DEG, 0.69, 0.005);
  const green = dmdDiffraction(brown(532, -2.09, "off")).nearest;
  assert.ok(green);
  assert.deepEqual([green.mx, green.my], [-4, 4]);
  close(green.outputAngle / DEG, 21.2, 5e-4);
  close(green.deviation / DEG, 0.71, 0.005);
});

test("TI DLPA037A Eq. 7 pair: order 4 at 465 nm is also blazed from θi = 12° − acos(0.83675) = −21.20°", () => {
  const u = (4 * 0.465) / (Math.SQRT2 * 7.56 * Math.sin(12 * DEG));
  close(u, 0.836753, 1e-5);
  const list = blazedIncidences(465e-9, 7.56e-6, 12 * DEG, "on");
  const pair = list.filter((b) => b.order === 4).map((b) => b.incidence / DEG);
  assert.equal(pair.length, 2);
  close(pair[0], 12 - Math.acos(u) / DEG, 1e-12);
  close(pair[0], -21.2, 5e-4);
  close(pair[1], 45.2, 5e-4);
  // Orders 1–4 can be blazed (Brown: n_max = 4 at 465 nm); order 5 needs u = 1.046 > 1.
  assert.deepEqual([...new Set(list.map((b) => b.order))].sort(), [1, 2, 3, 4]);
});

test("Littrow blaze (TI DLPA037A Eq. 8): λ = √2 d sin γ/n at θi = γ returns along the incidence with power F²", () => {
  const lambda = (Math.SQRT2 * 7.56e-6 * Math.sin(12 * DEG)) / 4;
  close(lambda, 555.7196e-9, 1e-6);
  const r = dmdDiffraction({ ...brown(0, 12), lambda });
  assert.ok(r.nearest);
  close(r.nearest.outputAngle / DEG, -12, 1e-9);
  close(r.nearest.envelope, 1, 1e-12);
  close(r.nearest.efficiency, 0.8464, 1e-12);
});

test("mirror envelope in the tilt plane is sinc⁴ of the mismatch along the tilted mirror (Brown Eqs. 1–2; TI DLPA037A Sec. 2.5)", () => {
  // Hand calculation for the 635 nm row, w = √0.92 · 7.56 µm: â = (−sin θi, −cos θi), b̂ = (−sin θo, cos θo) in (t, z),
  // X = (πw/λ)(cos γ q_t − sin γ q_z)/√2 with q = â − b̂.
  const r = dmdDiffraction(brown(635, 45.89)).nearest;
  assert.ok(r);
  const ti = 45.89 * DEG, to = r.outputAngle, g = 12 * DEG;
  const qt = -Math.sin(ti) + Math.sin(to), qz = -Math.cos(ti) - Math.cos(to);
  const X = ((Math.PI * Math.sqrt(0.92) * 7.56) / 0.635) * (Math.cos(g) * qt - Math.sin(g) * qz) / Math.SQRT2;
  close(X, -0.25414, 1e-4);
  close(r.envelope, (Math.sin(X) / X) ** 4, 1e-12);
  close(r.envelope, 0.95777, 1e-4);
});

test("array theorem: at normal incidence on nearly flat mirrors the orders together carry F of the power", () => {
  // Σ F² sinc²(πw fx/d) sinc²(πw fy/d) over the lattice = F² · d²/w² = F for w = √F d (Parseval); γ → 0 and θi = 0.
  // λ ≪ d so that the 201 × 201 orders all propagate; the tails left out carry about 0.4 %.
  const p: DmdSetup = { pitch: 7.56e-6, tilt: 1e-7, lambda: 20e-9, incidence: 0, fillFactor: 0.92, state: "on" };
  const total = ordersNearBlaze(p, 100).reduce((sum, o) => sum + o.efficiency, 0);
  close(total, 0.92, 0.01);
  // Off normal the F² normalisation overshoots (the page and modelNote say so): the propagating orders at 45.2° sum to
  // about 1.10 F.
  const oblique = ordersNearBlaze(brown(465, 45.2), 60).reduce((sum, o) => sum + o.efficiency, 0) / 0.92;
  assert.ok(oblique > 1.05 && oblique < 1.15, `${oblique}`);
});

test("Littrow incidence (u = 1) is listed once; steep angles carry a warning in the API", () => {
  const lambda = (Math.SQRT2 * 7.56e-6 * Math.sin(12 * DEG)) / 4;
  const rows = blazedIncidences(lambda, 7.56e-6, 12 * DEG, "on").filter((b) => b.order === 4);
  assert.equal(rows.length, 1);
  close(rows[0].incidence / DEG, 12, 1e-6);
  assert.ok(run({ incidence: 70 }).warnings.some((w) => /steeper than 60°/.test(w)));
  assert.ok(!run({}).warnings.some((w) => /steeper than 60°/.test(w)));
});

test("off-state mirrors mirror the on-state geometry; orders near the blaze come out in a lattice", () => {
  const on = dmdDiffraction(brown(532, 30));
  const off = dmdDiffraction(brown(532, -30, "off"));
  assert.ok(on.nearest && off.nearest);
  close(off.onAngle, -on.onAngle, 1e-12);
  close(off.nearest.outputAngle, -on.nearest.outputAngle, 1e-12);
  assert.deepEqual([off.nearest.mx, off.nearest.my], [-on.nearest.mx, -on.nearest.my]);
  assert.equal(ordersNearBlaze(brown(465, 45.2), 3).length, 49);
});

test("edge cases: grazing geometry and no blazable order give null results with reasons", () => {
  const graze = dmdDiffraction(brown(465, -80));
  assert.equal(graze.nearest, null);
  assert.equal(graze.reason, GEOMETRY_REASON);
  assert.ok(Number.isNaN(graze.onAngle));
  // √2 · 1 µm · sin 12° = 294 nm < 465 nm: even order 1 can't be blazed.
  assert.deepEqual(blazedIncidences(465e-9, 1e-6, 12 * DEG, "on"), []);
  const api = run({ pitch: 1, incidence: 0 });
  assert.equal(api.outputs.bestIncidence, null);
  assert.match(api.reasons.bestIncidence, /No order can be blazed/);
  const apiGraze = run({ incidence: -80 });
  for (const k of ["onAngle", "orderX", "outputAngle", "efficiency"]) assert.equal(apiGraze.reasons[k], GEOMETRY_REASON);
});

test("API defaults reproduce the page's worked example", () => {
  const r = run({});
  assert.equal(r.outputs.orderX, 4);
  assert.equal(r.outputs.orderY, -4);
  close(r.outputs.outputAngle ?? NaN, 21.2, 5e-4);
  close(r.outputs.efficiency ?? NaN, 84.64, 1e-5);
  close(r.outputs.bestIncidence ?? NaN, 45.2, 5e-4);
});
