import test from "node:test";
import assert from "node:assert/strict";

import * as cx from "../src/physics/complex";
import {
  middleIndexForReflectance,
  singleLayerIndexForReflectance,
  tunedSplitter,
  tunedSplitterLayers,
} from "../src/physics/thin-film/beamsplitter";
import { quarterWaveStackReflectance, stackResponse, type Layer } from "../src/physics/thin-film/transfer-matrix";

const NM = 1e-9;
const lambda0 = 550 * NM;
const nH = 2.35, nL = 1.45, nSub = 1.52;

function close(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

const R0 = (layers: Layer[], incident = 1) => stackResponse({ incident, layers, substrate: { n: nSub } }, lambda0).R;

// Quarter-wave layer from air on 1.52: R = ((1.52 − n²)/(1.52 + n²))² (Macleod ch. 2, Y → n²/Y).
// R = 0.5: n² = 1.52 (1 + √0.5)/(1 − √0.5) = 1.52 × 5.828427 = 8.859209, n = 2.976442 (the thin-film audit's 2.976).
test("beamsplitter: single quarter-wave layer index for a reflectance", () => {
  const n = singleLayerIndexForReflectance(0.5, 1, nSub);
  close(n, 2.976442, 1e-6, "n for 50 %");
  close(quarterWaveStackReflectance(1, [n], nSub), 0.5, 1e-14, "closed form back");
  close(R0([{ n, thickness: lambda0 / (4 * n) }]), 0.5, 1e-14, "transfer matrix");
  close(singleLayerIndexForReflectance(0, 1, nSub), Math.sqrt(nSub), 1e-15, "R = 0: the AR index √(n₀n_s)");
  // ZnS-like 2.35 reaches only 32.3 %: ((1.52 − 5.5225)/(1.52 + 5.5225))².
  close(quarterWaveStackReflectance(1, [nH], nSub), 0.323005, 1e-6, "R of one H layer");
  assert.ok(Number.isNaN(singleLayerIndexForReflectance(1, 1, nSub)));
});

// H M H, all quarter waves: Y = n_H⁴/(n_M² n_s) (Y → n²/Y three times from n_s), the admittance of one layer of
// index n_H²/n_M. For 50 %: n_M = 2.35²/2.976442 = 5.5225/2.976442 = 1.855403. R is stationary at λ₀.
test("beamsplitter: middle index of an all-quarter-wave H M H", () => {
  const nM = middleIndexForReflectance(0.5, nH, 1, nSub);
  close(nM, 1.855403, 1e-6, "n_M for 50 %");
  close(quarterWaveStackReflectance(1, [nH, nM, nH], nSub), 0.5, 1e-14, "R(λ₀)");
  const stack = { incident: 1, layers: [nH, nM, nH].map((n) => ({ n, thickness: lambda0 / (4 * n) })), substrate: { n: nSub } };
  const R = (wl: number) => stackResponse(stack, wl).R;
  // Stationary in g = λ₀/λ (R(g) = R(2 − g)): the slope is zero at λ₀, and R falls on both sides.
  const dg = 1e-4;
  close((R(lambda0 / (1 + dg)) - R(lambda0 / (1 - dg))) / (2 * dg), 0, 1e-10, "dR/dg at λ₀");
  assert.ok(R(lambda0 / 1.1) < 0.5 && R(lambda0 / 0.9) < 0.5);
  assert.ok(Number.isNaN(middleIndexForReflectance(1, nH, 1, nSub)));
});

// Independent closed form for m = 1 (front H, L of phase δ, H on the substrate), Macleod ch. 2:
// behind the inner H, Y₁ = n_H²/n_s; the L layer gives Y₂ = n_L(Y₁ − i n_L tan δ)/(n_L − i Y₁ tan δ) (e^(−iωt)),
// a circle through Y₁ and n_L²/Y₁ with centre c₀ = (Y₁ + n_L²/Y₁)/2 and radius ρ = |Y₁ − n_L²/Y₁|/2. The front H
// gives R = |(Y₂ − a)/(Y₂ + a)|², a = n_H²/n₀, which is linear-fractional in u = cos θ (Y₂ = c₀ + ρe^(iθ)):
// u = (R((c₀+a)² + ρ²) − (c₀−a)² − ρ²) / (2ρ((c₀−a) − R(c₀+a))). Solving Y₂ for tan δ:
// tan δ = n_L(Y₁ − Y₂) / (i(n_L² − Y₁Y₂)).
test("beamsplitter: tuned H L(x) H reaches the target, x matches the admittance-circle solution", () => {
  const target = 0.5;
  const d = tunedSplitter(target, nH, nL, 1, nSub, lambda0);
  assert.ok(d);
  assert.equal(d.m, 1);
  close(R0(d.layers), target, 1e-12, "R(λ₀)");

  const Y1 = (nH * nH) / nSub, a = nH * nH;
  const c0 = (Y1 + (nL * nL) / Y1) / 2, rho = Math.abs(Y1 - (nL * nL) / Y1) / 2;
  const u = (target * ((c0 + a) ** 2 + rho ** 2) - (c0 - a) ** 2 - rho ** 2) / (2 * rho * (c0 - a - target * (c0 + a)));
  const roots = [1, -1].map((sign) => {
    const Y2 = cx.complex(c0 + rho * u, sign * rho * Math.sqrt(1 - u * u));
    const num = cx.scale(cx.sub(cx.complex(Y1), Y2), nL);
    const den = cx.mul(cx.complex(0, 1), cx.sub(cx.complex(nL * nL), cx.scale(Y2, Y1)));
    return cx.div(num, den);
  });
  // One sign of sin θ gives a real, positive tan δ: the half circle the layer runs along.
  const tan = roots.find((t) => Math.abs(t.im) < 1e-9 && t.re > 0);
  assert.ok(tan, JSON.stringify(roots));
  close(d.x, (2 / Math.PI) * Math.atan(tan.re), 1e-9, "x");
  close(d.x, 0.507422, 1e-6, "x (L layer 48.12 nm instead of 94.83 nm)");
});

test("beamsplitter: the smallest quarter-wave stack is cut down; targets out of reach", () => {
  // Quarter-wave R from air on 1.52: H 32.30 %, HLH 65.66 %, HLHLH 85.25 %.
  for (const [target, m] of [[0.3, 0], [0.5, 1], [0.7, 2], [0.85, 2], [0.9, 3]] as const) {
    const d = tunedSplitter(target, nH, nL, 1, nSub, lambda0);
    assert.ok(d, `target ${target}`);
    assert.equal(d.m, m, `m for ${target}`);
    assert.equal(d.layers.length, 2 * m + 1);
    close(R0(d.layers), target, 1e-12, `R for ${target}`);
  }
  // Exactly a quarter-wave stack: x = 1.
  const hlh = quarterWaveStackReflectance(1, [nH, nL, nH], nSub);
  close(tunedSplitter(hlh, nH, nL, 1, nSub, lambda0)?.x ?? NaN, 1, 1e-12, "x for R(HLH)");
  // Cube beamsplitter (glass on both sides): still one period.
  const cube = tunedSplitter(0.5, nH, nL, nSub, nSub, lambda0);
  assert.ok(cube && cube.m === 1);
  close(R0(cube.layers, nSub), 0.5, 1e-12, "cube R");
  // Below the bare substrate (4.26 %) is an AR task; n_H < n_L; a non-integer m.
  assert.equal(tunedSplitter(0.03, nH, nL, 1, nSub, lambda0), null);
  assert.equal(tunedSplitter(0.5, nL, nH, 1, nSub, lambda0), null);
  assert.deepEqual(tunedSplitterLayers(nH, nL, 1.5, 0.5, lambda0), []);
});
