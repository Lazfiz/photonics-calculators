import test from "node:test";
import assert from "node:assert/strict";

import { brewsterAngle, fresnel } from "../src/physics/polarization/fresnel";
import {
  macNeilleAngle, macNeilleGlassIndex, macNeilleResponse, macNeilleStack, pileDopAtBrewster, pileOfPlates,
  plateStackTransmittance,
} from "../src/physics/polarization/reflection-polarizers";

const deg = Math.PI / 180;

function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

test("pile of plates n = 1.52 at Brewster: P(m = 1, 2, 4, 10) = .1567, .2709, .4264, .6501 = m/(m + (2n/(n² − 1))²)", () => {
  const b = brewsterAngle(1, 1.52);
  const expected = [[1, 0.15669], [2, 0.27093], [4, 0.42635], [10, 0.65011]];
  for (const [m, P] of expected) {
    assertAbs(pileOfPlates(1.52, b, m).dop, P, 5e-6, `P(${m})`);
    assertAbs(pileDopAtBrewster(1.52, m), P, 5e-6, `closed form P(${m})`);
  }
  // One plate polarizes by exactly r_s = ((n² − 1)/(n² + 1))².
  assertAbs(pileOfPlates(1.52, b, 1).dop, (1.3104 / 3.3104) ** 2, 1e-12, "P(1) = r_s");
  // Edge: no plates, no polarization.
  assert.equal(pileDopAtBrewster(1.52, 0), 0);
});

test("(1 − r)/(1 + (2m − 1)r) equals the incoherent sum T = T₁T₂/(1 − R₁R₂) built plate by plate", () => {
  for (const r of [0.04, 0.15, 0.6]) {
    const surfT = 1 - r;
    let T = 1, R = 0;
    for (let surfaces = 1; surfaces <= 20; surfaces++) {
      const den = 1 - R * r;
      [T, R] = [(T * surfT) / den, R + (T * T * r) / den];
      if (surfaces % 2 === 0) assertAbs(plateStackTransmittance(r, surfaces / 2), T, 1e-14, `r = ${r}, m = ${surfaces / 2}`);
    }
  }
  assert.ok(Number.isNaN(plateStackTransmittance(1.2, 1)));
});

test("ignoring the multiple reflections overstates the polarization: 10 plates give 0.936, not 0.650 (n = 1.52)", () => {
  const p = pileOfPlates(1.52, brewsterAngle(1, 1.52), 10);
  const singlePass = (p.TpSinglePass - p.TsSinglePass) / (p.TpSinglePass + p.TsSinglePass);
  assertAbs(singlePass, 0.93594, 1e-5, "single-pass P");
  assertAbs(p.Tp, 1, 1e-15, "T_p at Brewster");
});

test("MacNeille condition: ZnS 2.35 / MgF₂ 1.38 in a 45° cube needs n_g = 1.68290; the H/L interface is then at Brewster", () => {
  const ng = macNeilleGlassIndex(2.35, 1.38);
  assertAbs(ng, 1.68290, 1e-5, "n_g");
  assertAbs(macNeilleAngle(2.35, 1.38, ng) / deg, 45, 1e-12, "angle back");
  const beta = ng * Math.sin(45 * deg);
  const thetaH = Math.asin(beta / 2.35);
  assertAbs(Math.tan(thetaH), 1.38 / 2.35, 1e-14, "tan θ_H = n_L/n_H");
  assertAbs(fresnel(2.35, 1.38, thetaH).Rp, 0, 1e-30, "R_p at the H/L interface");
  // In BK7 (1.52) the same layers need 51.53° in the glass; in n = 1.1 glass, no angle works (edge).
  assertAbs(macNeilleAngle(2.35, 1.38, 1.52) / deg, 51.53, 0.01, "angle in BK7");
  assert.ok(Number.isNaN(macNeilleAngle(2.35, 1.38, 1.1)));
});

test("MacNeille stack at λ₀ matches the quarter-wave admittance formula (Macleod ch. 2, 9): R_s, R_p = 0.01813", () => {
  const nH = 2.35, nL = 1.38, nGlass = macNeilleGlassIndex(nH, nL), pairs = 5, theta = 45 * deg;
  const design = { nH, nL, nGlass, pairs, lambda0: 550e-9, thetaGlass: theta };
  assert.equal(macNeilleStack(design).layers.length, 2 * pairs + 1);
  const beta = nGlass * Math.sin(theta);
  const q = (n: number) => Math.sqrt(n * n - beta * beta);
  // s: η = n cos θ; p: η = n²/(n cos θ). A quarter-wave (HL)^N H stack on η_g has Y = (η_H/η_L)^{2N} η_H²/η_g.
  const R = (eta: (n: number) => number) => {
    const Y = (eta(nH) / eta(nL)) ** (2 * pairs) * eta(nH) ** 2 / eta(nGlass);
    return ((eta(nGlass) - Y) / (eta(nGlass) + Y)) ** 2;
  };
  const r = macNeilleResponse(design, 550e-9);
  assertAbs(r.Rs, R(q), 1e-12, "R_s");
  assertAbs(r.Rp, R((n) => (n * n) / q(n)), 1e-12, "R_p");
  assertAbs(r.Rp, 0.018128, 1e-6, "R_p hand value (only the glass/H faces reflect p)");
  assertAbs(r.Ts, 3.28e-5, 0.02e-5, "T_s");
  assertAbs(r.Rs + r.Ts, 1, 1e-12, "lossless");
});
