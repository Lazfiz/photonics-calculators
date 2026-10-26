import test from "node:test";
import assert from "node:assert/strict";

import { crystalIndices } from "../src/physics/materials/uniaxial-data";
import {
  achromaticPair, compoundRetardance, fullWaveWavelengths, plateOrder, plateThickness, retardance, retardanceFromPath,
  tirAnglesForPhase, tirMaxPhase, tirPhaseDifference,
} from "../src/physics/polarization/retarders";

const deg = Math.PI / 180;

function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

test("waveplate thickness d = (m + f)λ/|Δn|: quartz-like Δn = 0.0092 at 550 nm (Hecht, Optics, §8.7)", () => {
  // Zero-order QWP: 0.25 × 0.55 µm / 0.0092 = 14.9457 µm; 10th-order QWP: 10.25 × 0.55 / 0.0092 = 612.772 µm.
  assertAbs(plateThickness(0.0092, 550e-9, 0.25) * 1e6, 14.9457, 1e-4, "zero order");
  assertAbs(plateThickness(0.0092, 550e-9, 10.25) * 1e6, 612.772, 1e-3, "order 10");
  // Negative Δn (calcite) needs the same |Δn|; the sign only swaps fast and slow axes.
  assert.equal(plateThickness(-0.0092, 550e-9, 0.25), plateThickness(0.0092, 550e-9, 0.25));
  // Edge: no birefringence, no plate.
  assert.ok(Number.isNaN(plateThickness(0, 550e-9, 0.25)));
  assertAbs(retardance(0.0092, plateThickness(0.0092, 550e-9, 0.25), 550e-9), Math.PI / 2, 1e-12, "Γ = π/2");
});

test("retardance from a path difference, Γ = 2πR/λ", () => {
  // A first-order red plate (R = 550 nm) is a full wave at 550 nm and 2π·550/400 = 2.75π at 400 nm.
  assertAbs(retardanceFromPath(550e-9, 550e-9), 2 * Math.PI, 1e-12, "full wave");
  assertAbs(retardanceFromPath(550e-9, 400e-9), 2.75 * Math.PI, 1e-12, "400 nm");
  assert.equal(retardanceFromPath(0.0092 * 20e-6, 633e-9), retardance(0.0092, 20e-6, 633e-9), "same as Δn d");
  assert.ok(Number.isNaN(retardanceFromPath(550e-9, 0)), "λ = 0");
  assert.ok(Number.isNaN(retardance(0.0092, 1e-3, -1)), "λ < 0");
});

test("waveplate order: Δn 0.009, 100 µm at 550 nm is 1.63636 waves (order 1, fraction 0.63636), either sign", () => {
  for (const dn of [0.009, -0.009]) {
    const o = plateOrder(dn, 100e-6, 550e-9);
    assertAbs(o.waves, 1.636364, 1e-6, "waves");
    assert.equal(o.order, 1);
    assertAbs(o.fraction, 0.636364, 1e-6, "fraction");
  }
});

test("compound zero-order plate: crossed plates of one material act as d₁ − d₂", () => {
  const dn = 0.0092, l = 633e-9;
  assertAbs(compoundRetardance(dn, 1.0e-3, dn, 0.98e-3, l), retardance(dn, 0.02e-3, l), 1e-12, "d₁ − d₂");
});

test("full-wave wavelengths: constant Δn gives λ_m = Δn d/m; dispersive quartz shifts them", () => {
  const roots = fullWaveWavelengths(() => 0.0091, 1e-3, 400e-9, 1000e-9);
  // 9.1 µm/m for m = 10 … 22: 910, 827.27, …, 413.64 nm.
  assert.equal(roots.length, 13);
  assertAbs(roots[0] * 1e9, 9100 / 22, 1e-6, "m = 22");
  assertAbs(roots[12] * 1e9, 910, 1e-6, "m = 10");
  // Quartz (Ghosh): each root satisfies |Δn(λ)| d/λ = m to 1e-9.
  const dnQ = (l: number) => { const x = crystalIndices("quartz", l); return x.ne - x.no; };
  for (const l of fullWaveWavelengths(dnQ, 1e-3, 400e-9, 1000e-9)) {
    const w = (dnQ(l) * 1e-3) / l;
    assertAbs(w, Math.round(w), 1e-9, `${l}`);
  }
});

test("achromatic pair: Cramer's rule by hand; quartz + MgF₂ hits R at both design wavelengths", () => {
  // Δn₁ = 0.02, 0.019; Δn₂ = 0.01, 0.0098 at 500, 700 nm; R = ¼: det = −6e-6, d₁ = −87.5 µm, d₂ = −187.5 µm,
  // so plate 2 dominates: 87.5 µm and 187.5 µm with sign −1.
  const table = (a: number, b: number) => (l: number) => (l < 600e-9 ? a : b);
  const p = achromaticPair(table(0.02, 0.019), table(0.01, 0.0098), 500e-9, 700e-9, 0.25);
  assertAbs(p.d1 * 1e6, 87.5, 1e-9, "d₁");
  assertAbs(p.d2 * 1e6, 187.5, 1e-9, "d₂");
  assert.equal(p.sign, -1);
  const dn = (id: "quartz" | "mgf2") => (l: number) => { const x = crystalIndices(id, l); return x.ne - x.no; };
  const q = achromaticPair(dn("quartz"), dn("mgf2"), 450e-9, 700e-9, 0.25);
  for (const l of [450e-9, 700e-9]) {
    const waves = compoundRetardance(dn("quartz")(l), q.d1, dn("mgf2")(l), q.d2, l) / (2 * Math.PI);
    assertAbs(Math.abs(waves), 0.25, 1e-12, `${l}`);
  }
  // Edge: constant Δn cannot be achromatized (singular system).
  assert.ok(Number.isNaN(achromaticPair(() => 0.01, () => 0.005, 500e-9, 700e-9, 0.25).d1));
});

test("total internal reflection: n = 1.51 gives δ = 45° at 48°37′ and 54°37′ (Born & Wolf §1.5.4, Fresnel rhomb)", () => {
  const [a, b] = tirAnglesForPhase(1.51, 45 * deg);
  assertAbs(a / deg, 48 + 37 / 60, 1 / 60, "lower angle");
  assertAbs(b / deg, 54 + 37 / 60, 1 / 60, "upper angle");
  assertAbs(tirPhaseDifference(1.51, b), 45 * deg, 1e-12, "δ at the root");
  // δ_max: tan(δ/2) = (n² − 1)/(2n) = 1.2801/3.02 = 0.423874 → 45.942°.
  assertAbs(tirMaxPhase(1.51).delta / deg, 45.942, 1e-3, "δ_max");
  // Edges: no TIR below the critical angle; δ → 0 at grazing incidence; δ above the peak is unreachable.
  assert.ok(Number.isNaN(tirPhaseDifference(1.51, 40 * deg)));
  assertAbs(tirPhaseDifference(1.51, 90 * deg), 0, 1e-15, "grazing");
  assert.ok(Number.isNaN(tirAnglesForPhase(1.51, 50 * deg)[0]));
});
