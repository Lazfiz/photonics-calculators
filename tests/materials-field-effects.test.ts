import test from "node:test";
import assert from "node:assert/strict";

import {
  ACOUSTO_OPTIC, braggAngle, braggEfficiency, fullEfficiencyPower, kleinCookQ, scanAngle,
} from "../src/physics/materials/acousto-optic";
import {
  faradayRotation, fieldForRotation, lengthForRotation, singleTransitionVerdet, verdetConstant,
} from "../src/physics/materials/faraday";
import { STRESS_OPTIC, stressForRetardance } from "../src/physics/materials/stress-optic";
import { crystalIndices } from "../src/physics/materials/uniaxial-data";
import { photoelasticRetardance } from "../src/physics/polarization/photoelasticity";

const deg = Math.PI / 180;

function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

// ------------------------------------------------------------------ Faraday rotation

test("Verdet fits reproduce Vojna et al. 2019 Table 2 (|V| in rad/(T·m)), paramagnets negative", () => {
  assertAbs(verdetConstant("tgg", 633e-9), -130.6, 0.1, "TGG 633 nm");
  assertAbs(verdetConstant("tgg", 1064e-9), -37.5, 0.1, "TGG 1064 nm");
  assertAbs(verdetConstant("tsag", 633e-9), -156.6, 0.3, "TSAG 633 nm");
  assertAbs(verdetConstant("tsag", 1064e-9), -48.9, 0.1, "TSAG 1064 nm");
  // Table 1's UV fit against Table 2's 123 rad/(T·m) at 633 nm.
  assertAbs(verdetConstant("cef3", 633e-9), -123, 1, "CeF3 633 nm");
});

test("fused silica Verdet matches Tran et al. 2024: 310 ± 3 °/(T·m) at 532 nm, positive (diamagnetic)", () => {
  assertAbs(verdetConstant("silica", 532e-9) / deg, 310, 3, "silica 532 nm");
});

test("Verdet constant is NaN outside each fit range and below the transition wavelength", () => {
  assert.ok(Number.isNaN(verdetConstant("tgg", 1550e-9)));
  assert.ok(Number.isNaN(verdetConstant("cef3", 1064e-9)));
  assert.ok(Number.isNaN(singleTransitionVerdet(820.3, -6.2, 239.3e-9, 200e-9)));
  assertAbs(verdetConstant("yig", 1550e-9), 304, 0, "YIG saturated rotation, rad/m");
});

test("Faraday rotation θ = VBL and the 45° isolator field and length (hand calculation)", () => {
  // TGG at 633 nm, 0.5 T, 20 mm: −130.58 × 0.5 × 0.02 = −1.3058 rad = −74.82°.
  const V = verdetConstant("tgg", 633e-9);
  assertAbs(faradayRotation(V, 0.5, 0.02) / deg, -74.82, 0.01, "rotation");
  assertAbs(fieldForRotation(V, 0.02, Math.PI / 4), 0.30073, 1e-4, "B for 45°");
  // YIG, saturated: (π/4) / 304 rad/m = 2.5835 mm.
  assertAbs(lengthForRotation(304, 1, Math.PI / 4) * 1e3, 2.5835, 1e-4, "YIG length for 45°");
  assert.ok(Number.isNaN(fieldForRotation(V, 0, Math.PI / 4)));
});

// ------------------------------------------------------------------ Stress-optic law

test("stress-optic retardance: N-BK7 K = 2.77 × 10⁻⁶ mm²/N is 27.7 nm/cm per MPa (Schott)", () => {
  const C = STRESS_OPTIC["n-bk7"].C;
  assertAbs(photoelasticRetardance(C, 0.01, 1e6) * 1e9, 27.7, 1e-9, "R per cm per MPa");
  assertAbs(photoelasticRetardance(C, 0.01, 10e6) * 1e9, 277, 1e-9, "10 MPa, 10 mm");
});

test("fused silica C = 3.55 × 10⁻¹² Pa⁻¹ (Jog 1957): half-wave stress at 632.8 nm over 10 mm is 8.913 MPa", () => {
  assertAbs(stressForRetardance(632.8e-9 / 2, STRESS_OPTIC.silica.C, 0.01) / 1e6, 8.9127, 1e-4, "σ for λ/2");
  assert.ok(Number.isNaN(stressForRetardance(1e-7, STRESS_OPTIC.silica.C, 0)));
});

// ------------------------------------------------------------------ Acousto-optics

test("Bragg angle of a TeO₂ slow-shear cell at 633 nm, 100 MHz is 2.940° (PR #155 audit)", () => {
  const m = ACOUSTO_OPTIC["teo2-shear"];
  assertAbs(braggAngle(633e-9, 100e6, m.v) / deg, 2.9403, 1e-4, "θ_B");
  // A 50 MHz sweep scans λΔf/v = 633e-9 × 50e6 / 617 = 51.30 mrad.
  assertAbs(scanAngle(633e-9, 50e6, m.v) * 1e3, 51.297, 1e-3, "scan angle");
  assert.ok(Number.isNaN(braggAngle(633e-9, 5e9, m.v)), "λf/2v > 1");
});

test("Bragg efficiency: P₁₀₀ = λ²H/(2M₂L) and η(P₁₀₀) = 1 (Yariv & Yeh ch. 9)", () => {
  // TeO₂ shear, 633 nm, L 10 mm, H 1 mm: (633e-9)² × 1e-3 / (2 × 793e-15 × 0.01) = 25.264 mW.
  const m = ACOUSTO_OPTIC["teo2-shear"];
  const P = fullEfficiencyPower(633e-9, m.M2, 0.01, 1e-3);
  assertAbs(P * 1e3, 25.264, 1e-3, "P₁₀₀");
  assertAbs(braggEfficiency(633e-9, m.M2, 0.01, 1e-3, P), 1, 1e-12, "η at P₁₀₀");
  assertAbs(braggEfficiency(633e-9, m.M2, 0.01, 1e-3, 0), 0, 0, "η at 0 W");
  // Small-signal limit η ≈ π² M₂ L P / (2 λ² H): at P₁₀₀ / 100 that is π²/400 = 0.024674 against sin²(π/20) = 0.024472.
  assertAbs(braggEfficiency(633e-9, m.M2, 0.01, 1e-3, P / 100), 0.024472, 1e-6, "η at P₁₀₀/100");
});

test("Acousto-optic presets: TeO₂ and LiNbO₃ from US 3,661,441, n from the ordinary-index fits at 632.8 nm", () => {
  // US 3,661,441 Table 1: TeO₂ S[110] 0.617e5 cm/s, M 793e-18 s³/g; L[001] 4.26e5 cm/s, M 34.5 (light ⊥ [001]).
  // Table 2: LiNbO₃ L[11̄20] 6.57e5 cm/s, M 7.0 (light along [0001]). 1e-18 s³/g = 1e-15 s³/kg.
  const t = ACOUSTO_OPTIC;
  assert.deepEqual([t["teo2-shear"].v, t["teo2-shear"].M2], [617, 793e-15]);
  assert.deepEqual([t["teo2-long"].v, t["teo2-long"].M2], [4260, 34.5e-15]);
  assert.deepEqual([t.linbo3.v, t.linbo3.M2], [6570, 7.0e-15]);
  // Uchida 1971 nₒ² − 1 = 2.584λ²/(λ² − 0.1342²) + 1.157λ²/(λ² − 0.2638²) gives 2.2597 at 0.6328 µm; Malitson's PbMoO₄
  // fit (Handbook of Optics) 2.3860; Zelmon 1997 LiNbO₃ 2.2865.
  assertAbs(t["teo2-shear"].n, 2.2597, 0.005, "TeO₂ nₒ");
  assertAbs(t.pbmoo4.n, 2.3860, 0.005, "PbMoO₄ nₒ");
  assertAbs(t.linbo3.n, crystalIndices("linbo3", 632.8e-9).no, 0.005, "LiNbO₃ nₒ");
});

test("Klein–Cook Q of a fused silica cell, 633 nm, 20 mm, 80 MHz is 9.82 (hand calculation)", () => {
  const m = ACOUSTO_OPTIC.silica;
  // 2π × 633e-9 × 0.02 × (80e6)² / (1.46 × 5960²) = 9.816.
  assertAbs(kleinCookQ(633e-9, 0.02, 80e6, m.n, m.v), 9.816, 1e-3, "Q");
});
