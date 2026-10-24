import test from "node:test";
import assert from "node:assert/strict";

import { KERR_MEDIA, kerrIndexChange, n2FromEsu, piPhaseIntensity } from "../src/physics/materials/kerr-index";
import {
  BBO_THETA, SHG_CRYSTALS, SHG_LAMBDA, focusedShg, shgPrefactor, typeIPhaseMatchingAngle, uniaxialWalkOff, waistForXi,
  xyPlaneIndex,
} from "../src/physics/materials/nonlinear-crystals";
import { criticalPower, nonlinearPhase } from "../src/physics/wave-optics/kerr";
import { nonlinearCoefficient } from "../src/physics/fiber-optics/fiber-nonlinear";

const deg = Math.PI / 180;

function assertRel(actual: number, expected: number, rel: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${label}: ${actual} vs ${expected}`);
}

// ------------------------------------------------------------------ Kerr index

test("nonlinear phase and γ of silica at 1550 nm (materials audit golden, PR #155)", () => {
  const m = KERR_MEDIA["silica-fiber"];
  assert.equal(m.n2, 2.6e-20);
  // k₀n₂IL = (2π/1.55e-6) · 2.6e-20 · 1e16 · 0.01 = 10.5397 rad.
  assertRel(nonlinearPhase(m.lambda, m.n2, 1e16, 0.01), 10.5397, 1e-4, "φ_NL");
  // γ = 2π · 2.6e-20 / (1.55e-6 · 80e-12) = 1.31743e-3 /(W·m).
  assertRel(nonlinearCoefficient(m.n2, m.lambda, 80e-12), 1.31743e-3, 1e-5, "γ");
  // Malitson n(1550 nm) = 1.44402.
  assertRel(m.n0, 1.44402, 1e-5, "n₀");
});

test("Dubietis Table 1 n₂ in m²/W and the fused-silica critical power at 800 nm", () => {
  // Table 1 lists n₂ in 1e-16 cm²/W: fused silica 2.4, sapphire 3.1, YVO₄ 15.
  assertRel(KERR_MEDIA["fused-silica"].n2, 2.4e-20, 1e-12, "FS");
  assertRel(KERR_MEDIA.sapphire.n2, 3.1e-20, 1e-12, "Al₂O₃");
  assertRel(KERR_MEDIA.yvo4.n2, 15e-20, 1e-12, "YVO₄");
  // 3.77 · (800e-9)² / (8π · 1.45 · 2.4e-20) = 2.4128e-12 / 8.7462e-19 = 2.7587 MW.
  const fs = KERR_MEDIA["fused-silica"];
  assertRel(criticalPower(fs.lambda, fs.n0, fs.n2), 2.7587e6, 1e-4, "P_cr");
});

test("DeSalvo 1996 n₂ from esu (Tables I–II) and Bristow 2007 silicon", () => {
  // DeSalvo et al. Sec. III: fused silica (7.5 ± 1.5) × 10⁻¹⁴ esu = (2.1 ± 0.4) × 10⁻¹⁶ cm²/W with n₀ = 1.48.
  assertRel(n2FromEsu(7.5e-14, 1.48), 2.1e-20, 0.02, "FS esu");
  // KTP 100 × 10⁻¹⁴ esu, n₀ 1.77: 40π · 1e-12 / (299792458 · 1.77) = 1.25664e-10 / 5.30633e8 = 2.36819e-19 m²/W.
  assertRel(KERR_MEDIA.ktp.n2, 2.36819e-19, 1e-5, "KTP");
  // MgF₂ 1.9 × 10⁻¹⁴ esu, n₀ 1.4: 2.38761e-12 / 4.19709e8 = 5.68872e-21 m²/W.
  assertRel(KERR_MEDIA.mgf2.n2, 5.68872e-21, 1e-5, "MgF₂");
  assert.equal(KERR_MEDIA.ktp.lambda, 1064e-9);
  // Bristow et al. abstract: peak n₂ = 1.2e-13 cm²/W at 1800 nm.
  assertRel(KERR_MEDIA.silicon.n2, 1.2e-17, 1e-12, "Si");
  assert.equal(KERR_MEDIA.silicon.lambda, 1800e-9);
  assert.ok(Number.isNaN(n2FromEsu(1e-13, 0)), "n₀ = 0 guarded");
});

test("Kerr index change, π-phase intensity and their domain guards", () => {
  assertRel(kerrIndexChange(2.6e-20, 1e16), 2.6e-4, 1e-12, "Δn");
  // λ/(2n₂L) = 1.55e-6 / (2 · 2.6e-20 · 0.01) = 2.98077e15 W/m², where φ = π.
  const Ipi = piPhaseIntensity(1.55e-6, 2.6e-20, 0.01);
  assertRel(Ipi, 2.98077e15, 1e-5, "I_π");
  assertRel(nonlinearPhase(1.55e-6, 2.6e-20, Ipi, 0.01), Math.PI, 1e-12, "φ(I_π)");
  assert.ok(Number.isNaN(kerrIndexChange(2.6e-20, -1)));
  assert.ok(Number.isNaN(piPhaseIntensity(1.55e-6, 0, 0.01)));
});

// ------------------------------------------------------------------ SHG crystals

test("BBO type I 1064 nm: phase-matching angle, walk-off and d_eff from the EKSMA sheet", () => {
  // sin²θ = (1.6551⁻² − 1.6750⁻²)/(1.5555⁻² − 1.6750⁻²) = 0.0086229/0.0568686 = 0.151628 → θ = 22.916°.
  assertRel(BBO_THETA / deg, 22.916, 1e-4, "θ");
  // EKSMA quotes a 55.9 mrad walk-off for type I SHG of 1064 nm.
  assertRel(uniaxialWalkOff(1.675, 1.5555, BBO_THETA), 55.9e-3, 3e-3, "ρ");
  // d₃₁ sinθ + d₂₂ cosθ = 0.08 · 0.38940 + 2.2 · 0.92107 = 2.0576 pm/V.
  assertRel(SHG_CRYSTALS.bbo.deff, 2.0576e-12, 1e-4, "d_eff");
  // n_o(ω) below n_e(2ω): no type I phase matching.
  assert.ok(Number.isNaN(typeIPhaseMatchingAngle(1.5, 1.675, 1.5555)));
});

test("d_eff of LBO, KTP and LiNbO₃ from their tensors (EKSMA sheets, Shoji et al. 1997)", () => {
  // LBO: d₃₂ cos 11.6° = 0.98 · 0.979575 = 0.95998 pm/V.
  assertRel(SHG_CRYSTALS.lbo.deff, 0.95998e-12, 1e-4, "LBO");
  // KTP: d₁₅ sin²23.5° + d₂₄ cos²23.5° = 1.95 · 0.159001 + 3.9 · 0.840999 = 3.58995 pm/V.
  assertRel(SHG_CRYSTALS.ktp.deff, 3.58995e-12, 1e-5, "KTP");
  // 2d₃₃/π = 2 · 25.0/π = 15.9155 pm/V; the audit's Nikogosyan value is 15.9.
  assertRel(SHG_CRYSTALS.ppln.deff, 15.9155e-12, 1e-5, "PPLN");
  assertRel(SHG_CRYSTALS["mgo-ln"].deff, 4.4e-12, 1e-12, "MgO:LN");
});

test("the EKSMA cut angles phase-match their own indices (KTP type II, LBO type I)", () => {
  const ktp = SHG_CRYSTALS.ktp;
  // Mean fundamental index (1.8296 + n(23.5°, 1064 nm) = 1.74670)/2 vs the SH index n(23.5°, 532 nm) = 1.78811.
  assertRel(xyPlaneIndex(1.7404, 1.7479, 23.5 * deg), 1.7467, 1e-5, "KTP n(φ)");
  assert.ok(Math.abs(ktp.nOmega - ktp.n2Omega) < 2e-4, `KTP Δn ${ktp.nOmega - ktp.n2Omega}`);
  const lbo = SHG_CRYSTALS.lbo;
  assert.ok(Math.abs(lbo.nOmega - lbo.n2Omega) < 3e-4, `LBO Δn ${lbo.nOmega - lbo.n2Omega}`);
});

test("focused SHG at Δk = 0 follows h = arctan²ξ/ξ, largest at ξ = 1.39", () => {
  const input = { lambda: SHG_LAMBDA, length: 0.01, deff: 16e-12, nOmega: 2.15, n2Omega: 2.23, w0: 30e-6 };
  const r = focusedShg(input);
  // b = 2π · 2.15 · (30e-6)² / 1.064e-6 = 11.4266 mm, ξ = 0.875152.
  assertRel(r.b, 11.4266e-3, 1e-5, "b");
  assertRel(r.h, Math.atan(r.xi) ** 2 / r.xi, 1e-6, "h");
  // 16π² d² L / (ε₀ c n_ω n_2ω λ³) = 4.04259e-22 / 1.53298e-20 = 0.026371 /W per unit h.
  assertRel(shgPrefactor(input.lambda, input.length, input.deff, input.nOmega, input.n2Omega), 0.026371, 1e-4, "prefactor");
  const at = (xi: number) => focusedShg({ ...input, w0: waistForXi(input.lambda, input.nOmega, input.length, xi) }).h;
  assertRel(at(1.39), 0.6455, 1e-3, "h(1.39)");
  assert.ok(at(1.2) < at(1.39) && at(1.6) < at(1.39), "maximum at 1.39");
  assert.ok(Number.isNaN(focusedShg({ ...input, w0: 0 }).K));
});
