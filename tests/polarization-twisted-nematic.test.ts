import test from "node:test";
import assert from "node:assert/strict";

import { apply, chainMatrix, linearRetarder, linearState } from "../src/physics/polarization/jones";
import {
  goochTarryMinimum, goochTarryParallel, lcTransmission,
} from "../src/physics/polarization/twisted-nematic";

const deg = Math.PI / 180;

function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

/** Independent model: N thin retarders, slow axis (director) at Φ(k − ½)/N, between polarizers. */
function slabTransmission(twist: number, gamma: number, polarizer: number, analyzer: number, N = 4000) {
  const slabs = Array.from({ length: N }, (_, k) => linearRetarder(gamma / N, (twist * (k + 0.5)) / N + Math.PI / 2));
  const E = apply(chainMatrix(slabs), linearState(polarizer));
  const c = Math.cos(analyzer), s = Math.sin(analyzer);
  return (c * E[0].re + s * E[1].re) ** 2 + (c * E[0].im + s * E[1].im) ** 2;
}

test("twisted nematic: closed-form Jones matrix equals a stack of 4000 thin retarders", () => {
  const cases: [number, number, number, number][] = [
    [90, 7, 0, 0], [90, 7, 0, 90], [240, 9, 45, -30], [-90, 5, 20, 70], [270, 12, 30, 60], [0, 3, 45, 45],
  ];
  for (const [tw, g, p, a] of cases) {
    assertAbs(lcTransmission(tw * deg, g, p * deg, a * deg), slabTransmission(tw * deg, g, p * deg, a * deg), 1e-6, `${tw}° Γ ${g}`);
  }
});

test("Gooch-Tarry (J. Phys. D 8, 1575 (1975)): 90° cell, Δn 0.2, 5 µm, 550 nm → T∥ = 0.008686", () => {
  const gamma = (2 * Math.PI * 0.2 * 5e-6) / 550e-9;
  // u = 2Δn d/λ = 3.636364; T∥ = sin²((π/2)√(1 + u²))/(1 + u²) = 0.12354/14.2231 = 0.008686.
  assertAbs(goochTarryParallel(gamma), 0.008686, 1e-6, "formula");
  assertAbs(lcTransmission(90 * deg, gamma, 0, 0), goochTarryParallel(gamma), 1e-12, "Jones");
});

test("Gooch-Tarry minima at Δn d/λ = √3/2 and √15/2 (normally black cell is dark, normally white is fully on)", () => {
  for (const k of [1, 2]) {
    const gamma = 2 * Math.PI * goochTarryMinimum(k);
    assertAbs(lcTransmission(90 * deg, gamma, 0, 0), 0, 1e-15, `T∥ min ${k}`);
    assertAbs(lcTransmission(90 * deg, gamma, 0, 90 * deg), 1, 1e-15, `T⊥ max ${k}`);
  }
  assertAbs(goochTarryMinimum(1), Math.sqrt(3) / 2, 1e-15, "first minimum");
});

test("twist 0 is a plain retarder: T = cos²(Γ/2) between parallel and sin²(Γ/2) between crossed polarizers at 45°", () => {
  for (const g of [0, 1, 2, Math.PI]) {
    assertAbs(lcTransmission(0, g, 45 * deg, 45 * deg), Math.cos(g / 2) ** 2, 1e-15, `parallel Γ ${g}`);
    assertAbs(lcTransmission(0, g, 45 * deg, -45 * deg), Math.sin(g / 2) ** 2, 1e-15, `crossed Γ ${g}`);
  }
  // Edge: no twist and no retardance is the identity: Malus's law between the polarizers.
  assertAbs(lcTransmission(0, 0, 0, 30 * deg), 0.75, 1e-15, "identity");
});

test("lossless: T(analyzer) + T(analyzer + 90°) = 1; Mauguin limit Δn d ≫ λ guides the polarization", () => {
  for (const [tw, g, p, a] of [[90, 4, 10, 25], [240, 11, 45, 80]]) {
    const sum = lcTransmission(tw * deg, g, p * deg, a * deg) + lcTransmission(tw * deg, g, p * deg, (a + 90) * deg);
    assertAbs(sum, 1, 1e-14, `${tw}°`);
  }
  // u = 20: T⊥ ≥ 1 − 1/(1 + u²) = 0.9975 (Gooch & Tarry; the waveguiding limit of Mauguin).
  assert.ok(lcTransmission(90 * deg, 20 * Math.PI, 0, 90 * deg) >= 1 - 1 / 401);
});
