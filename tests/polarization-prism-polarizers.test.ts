import test from "node:test";
import assert from "node:assert/strict";

import { crystalIndices } from "../src/physics/materials/uniaxial-data";
import {
  glanBalancedHypotenuse, glanState, glanWindow, splitterAngles, splitterExitAngle,
} from "../src/physics/polarization/prism-polarizers";
import { extraordinaryIndex } from "../src/physics/polarization/uniaxial";

const deg = Math.PI / 180;
const { no, ne } = crystalIndices("calcite", 589.3e-9); // 1.65834, 1.48613 (Ghosh 1999)

function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

/** Bisection for an increasing f on [a, b]. */
function root(f: (x: number) => number, a: number, b: number): number {
  for (let k = 0; k < 200; k++) {
    const m = 0.5 * (a + b);
    if (f(m) < 0) a = m;
    else b = m;
  }
  return 0.5 * (a + b);
}

// Axis perpendicular to the plane of incidence: each wave keeps one index, so a window edge is where the internal
// angle of incidence θ_h + ψ reaches the critical angle asin(n_gap/n), and the external angle is asin(n sin ψ).
const edge = (n: number, gap: number, theta: number) => Math.asin(n * Math.sin(Math.asin(gap / n) - theta));

test("Glan-Foucault, calcite 589 nm, 38.5° hypotenuse: window −2.346° … +5.638° from the critical angles", () => {
  const p = { no, ne, hypotenuse: 38.5 * deg, gapIndex: 1, axis: "perpendicular" as const };
  const w = glanWindow(p);
  assertAbs(w.lower, edge(no, 1, p.hypotenuse), 1e-12, "lower (o leaks)");
  assertAbs(w.upper, edge(ne, 1, p.hypotenuse), 1e-12, "upper (e reflected)");
  assertAbs(w.lower / deg, -2.3455, 1e-4, "lower, degrees");
  assertAbs(w.upper / deg, 5.6380, 1e-4, "upper, degrees");
  assert.equal(w.lowerLimit, "leaks");
  assert.equal(w.upperLimit, "blocked");
  assertAbs(w.halfField, -w.lower, 0, "symmetric half-field");
  assert.equal(glanState(p, 0), "polarized");
  assert.equal(glanState(p, -3 * deg), "leaks");
  assert.equal(glanState(p, 6 * deg), "blocked");
});

test("Glan-Taylor (axis in the plane): the e edge solves n(90° − ψ) sin(θ_h + ψ) = 1, slightly inside the Foucault edge", () => {
  const theta = 38.5 * deg;
  const w = glanWindow({ no, ne, hypotenuse: theta, gapIndex: 1, axis: "in-plane" });
  // Wave normal at ψ inside the crystal, 90° − ψ from the optic axis (along x); sin φ = n sin ψ.
  const psi = root((x) => extraordinaryIndex(no, ne, Math.PI / 2 - x) * Math.sin(theta + x) - 1, 0, 0.2);
  assertAbs(w.upper, Math.asin(extraordinaryIndex(no, ne, Math.PI / 2 - psi) * Math.sin(psi)), 1e-12, "upper");
  assertAbs(w.upper / deg, 5.607, 1e-3, "upper, degrees");
  assertAbs(w.lower, edge(no, 1, theta), 1e-12, "lower: the o wave doesn't care where the axis lies");
});

test("Glan-Thompson (cement 1.55 > n_e): the e wave is never reflected, so grazing ends the window", () => {
  const theta = Math.atan(3); // L/A = 3 per prism
  const w = glanWindow({ no, ne, hypotenuse: theta, gapIndex: 1.55, axis: "perpendicular" });
  assertAbs(w.lower, edge(no, 1.55, theta), 1e-12, "lower (o leaks)");
  assertAbs(w.lower / deg, -3.966, 1e-3, "lower, degrees");
  // The e ray grazes the hypotenuse when ψ = 90° − θ_h: φ = asin(n_e cos θ_h) = asin(n_e/√10).
  assertAbs(w.upper, Math.asin(ne / Math.sqrt(10)), 1e-12, "upper");
  assert.equal(w.upperLimit, "grazing");
  // A 60° hypotenuse is too shallow for this cement: the window moves off the axis (from φ = +15.3°).
  const off = glanWindow({ no, ne, hypotenuse: 60 * deg, gapIndex: 1.55, axis: "perpendicular" });
  assert.equal(off.axialPolarized, false);
  assert.equal(off.halfField, 0);
  assertAbs(off.lower, edge(no, 1.55, 60 * deg), 1e-12, "off-axis lower");
  // Edge: a gap index above n_o, so the o wave is never totally reflected.
  assert.ok(Number.isNaN(glanWindow({ no, ne, hypotenuse: 60 * deg, gapIndex: 1.7, axis: "perpendicular" }).lower));
});

test("positive crystal (YVO₄, 1064 nm): the e wave is reflected and the o wave passes, edges swap indices", () => {
  const y = crystalIndices("yvo4", 1064e-9);
  assert.ok(y.ne > y.no);
  const theta = 30 * deg;
  const w = glanWindow({ no: y.no, ne: y.ne, hypotenuse: theta, gapIndex: 1, axis: "perpendicular" });
  assertAbs(w.lower, edge(y.ne, 1, theta), 1e-12, "lower (e leaks)");
  assertAbs(w.upper, edge(y.no, 1, theta), 1e-12, "upper (o reflected)");
  assert.equal(w.axialPolarized, true);
});

test("balanced hypotenuse puts the window symmetric about the axis (Glan-Foucault, closed-form edges)", () => {
  const theta = root((t) => -(edge(no, 1, t) + edge(ne, 1, t)), 37.1 * deg, 42.2 * deg);
  const b = glanBalancedHypotenuse({ no, ne, gapIndex: 1, axis: "perpendicular" });
  assertAbs(b, theta, 1e-9, "θ_h");
  assertAbs(b / deg, 39.546, 1e-3, "θ_h, degrees");
  const w = glanWindow({ no, ne, hypotenuse: b, gapIndex: 1, axis: "perpendicular" });
  assertAbs(w.lower + w.upper, 0, 1e-9, "centred");
});

test("Wollaston, calcite, 20° wedges: exact split 7.191°, 2|Δn| tan α within 0.2 %; scalar Snell gives the same angles", () => {
  const alpha = 20 * deg;
  const a = splitterAngles("wollaston", no, ne, alpha);
  // s: o (n_o) in the first wedge, e (n_e, axis ⟂ plane) in the second; sin ε = n₂ sin(β − α), n₁ sin α = n₂ sin β.
  const exit = (n1: number, n2: number) => Math.asin(n2 * Math.sin(Math.asin((n1 * Math.sin(alpha)) / n2) - alpha));
  assertAbs(a.s, exit(no, ne), 1e-13, "s");
  assertAbs(a.p, exit(ne, no), 1e-13, "p");
  assertAbs(a.separation / deg, 7.191, 1e-3, "split");
  assert.ok(Math.abs(a.smallAngle / a.separation - 1) < 0.002, "2Δn tan α");
  // Edge: past asin(n_e/n_o) = 63.7° the s wave is totally reflected at the interface.
  assert.ok(Number.isNaN(splitterExitAngle("wollaston", no, ne, 65 * deg, "s")));
});

test("Rochon and Sénarmont: one beam undeviated; Sénarmont's e wave solves n(90° − γ) sin(α + γ) = n_o sin α", () => {
  const alpha = 20 * deg;
  const r = splitterAngles("rochon", no, ne, alpha);
  assertAbs(r.p, 0, 1e-15, "Rochon p undeviated");
  assertAbs(r.s, splitterExitAngle("wollaston", no, ne, alpha, "s"), 1e-15, "Rochon s = Wollaston s");
  const s = splitterAngles("senarmont", no, ne, alpha);
  assertAbs(s.s, 0, 1e-15, "Sénarmont s undeviated");
  // Second wedge axis along x: the e wave normal at γ from z is 90° − γ from the axis.
  const n = (g: number) => extraordinaryIndex(no, ne, Math.PI / 2 - g);
  const gamma = root((g) => n(g) * Math.sin(alpha + g) - no * Math.sin(alpha), 0, 0.2);
  assertAbs(s.p, Math.asin(n(gamma) * Math.sin(gamma)), 1e-12, "Sénarmont p");
  assertAbs(s.p / deg, 3.616, 1e-3, "Sénarmont p, degrees");
  assertAbs(r.smallAngle / r.separation, 0.9914, 1e-3, "|Δn| tan α is 0.9 % low");
});
