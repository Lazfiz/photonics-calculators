import test from "node:test";
import assert from "node:assert/strict";

import {
  type JonesMatrix, type JonesVector, LCP, RCP, adjoint, apply, chainMatrix, circularPolarizer, ellipticalState,
  intensity, linearPolarizer, linearRetarder, linearState, matMul, propagate, rotator, stokesFromJones,
} from "../src/physics/polarization/jones";

const deg = Math.PI / 180;
const H = linearState(0);

function assertStokes(actual: number[], expected: number[], tol: number, label: string) {
  actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]) < tol, `${label} S${i}: ${actual} vs ${expected}`));
}

test("Jones: Malus's law, I = cos² θ for H light through a polarizer at θ (Malus 1809; Hecht, Optics)", () => {
  assert.ok(Math.abs(intensity(apply(linearPolarizer(30 * deg), H)) - 0.75) < 1e-15);
  assert.ok(Math.abs(intensity(apply(linearPolarizer(60 * deg), H)) - 0.25) < 1e-15);
  // Edge: crossed polarizers extinguish.
  assert.ok(intensity(apply(linearPolarizer(90 * deg), H)) < 1e-30);
});

test("Jones: a half-wave plate at θ turns linear light by 2θ; HWP at 22.5° takes H to +45° (S2 = 1)", () => {
  assertStokes(stokesFromJones(apply(linearRetarder(Math.PI, 22.5 * deg), H)), [1, 0, 1, 0], 1e-15, "HWP 22.5°");
  assertStokes(stokesFromJones(apply(linearRetarder(Math.PI, 30 * deg), H)), [1, -0.5, Math.sqrt(3) / 2, 0], 1e-15, "HWP 30°");
});

test("Jones: quarter-wave plates in the Goldstein convention", () => {
  // Fast axis at 0°: diag(1, −i) takes +45° to [1, −i]/√2, left-handed (S3 = −1).
  assertStokes(stokesFromJones(apply(linearRetarder(Math.PI / 2, 0), linearState(45 * deg))), [1, 0, 0, -1], 1e-15, "QWP 0° on +45°");
  // Fast axis at +45°, H in: right circular.
  assertStokes(stokesFromJones(apply(linearRetarder(Math.PI / 2, 45 * deg), H)), [1, 0, 0, 1], 1e-15, "QWP 45° on H");
});

test("Jones: RCP = [1, i]/√2 turns clockwise as seen by the receiver (Goldstein; Collett)", () => {
  assertStokes(stokesFromJones(RCP), [1, 0, 0, 1], 1e-15, "RCP");
  assertStokes(stokesFromJones(LCP), [1, 0, 0, -1], 1e-15, "LCP");
  // Physical field Re{E e^{iωt}} at ωt = 0 and π/2; the receiver looks back along −z, with x right and y up,
  // so a negative z-component of E(0) × E(π/2) is clockwise.
  const field = (E: JonesVector, wt: number) =>
    E.map((c) => c.re * Math.cos(wt) - c.im * Math.sin(wt)) as [number, number];
  const [a, b] = [field(RCP, 0), field(RCP, Math.PI / 2)];
  assert.ok(a[0] * b[1] - a[1] * b[0] < -0.4);
});

test("Jones: elliptical states give S = [1, cos 2χ cos 2ψ, cos 2χ sin 2ψ, sin 2χ]", () => {
  for (const [psi, chi] of [[0, 45], [20, 10], [-35, -25], [80, 30]]) {
    const p = psi * deg, c = chi * deg;
    const S = [1, Math.cos(2 * c) * Math.cos(2 * p), Math.cos(2 * c) * Math.sin(2 * p), Math.sin(2 * c)];
    assertStokes(stokesFromJones(ellipticalState(p, c)), S, 1e-15, `ψ ${psi}°, χ ${chi}°`);
  }
});

test("Jones: chains run in the order the light meets the elements", () => {
  const P45 = linearPolarizer(45 * deg), PV = linearPolarizer(90 * deg);
  // H → 45° polarizer (½) → vertical polarizer (½ again) = ¼; the reverse order is dark.
  assert.ok(Math.abs(intensity(apply(chainMatrix([P45, PV]), H)) - 0.25) < 1e-15);
  assert.ok(intensity(apply(chainMatrix([PV, P45]), H)) < 1e-30);
  const steps = propagate([P45, PV], H).map(intensity);
  steps.forEach((v, i) => assert.ok(Math.abs(v - [1, 0.5, 0.25][i]) < 1e-15, `step ${i}: ${v}`));
});

test("Jones: a rotator turns the polarization counter-clockwise; 0° is the identity", () => {
  assertStokes(stokesFromJones(apply(rotator(45 * deg), H)), [1, 0, 1, 0], 1e-15, "rotator 45°");
  assertStokes(stokesFromJones(apply(rotator(0), linearState(30 * deg))), stokesFromJones(linearState(30 * deg)), 1e-15, "rotator 0°");
});

test("Jones: circular polarizers pass half of H light and block the opposite hand", () => {
  assertStokes(stokesFromJones(apply(circularPolarizer("right"), H)), [0.5, 0, 0, 0.5], 1e-15, "right on H");
  assertStokes(stokesFromJones(apply(circularPolarizer("left"), H)), [0.5, 0, 0, -0.5], 1e-15, "left on H");
  assert.ok(intensity(apply(circularPolarizer("right"), LCP)) < 1e-30);
});

test("Jones: retarders are unitary at any retardance and axis", () => {
  for (const [g, t] of [[90, 0], [180, 22.5], [37, -61], [400, 100]]) {
    const J = linearRetarder(g * deg, t * deg);
    const P: JonesMatrix = matMul(adjoint(J), J);
    const I = [[1, 0], [0, 1]];
    P.forEach((row, i) => row.forEach((z, j) => {
      assert.ok(Math.abs(z.re - I[i][j]) < 1e-15 && Math.abs(z.im) < 1e-15, `Γ ${g}°, θ ${t}°: J†J[${i}][${j}]`);
    }));
  }
});
