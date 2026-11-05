import test from "node:test";
import assert from "node:assert/strict";

import { TORR } from "../src/physics/constants";
import {
  ambipolarDiffusion,
  argonDischarge,
  collisionalLoss,
  electronTemperature,
  floatingSheathVoltage,
  geometry,
  kEl,
  kEx,
  kIz,
  lowPressureRegime,
  TE_FIT_MAX,
  TE_FIT_MIN,
} from "../src/physics/thin-film/plasma-global-model";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("argon rate constants and collisional loss (Lieberman & Lichtenberg Table 3.3, eq. 3.5.9)", () => {
  // Hand evaluation at Tₑ = 3 eV: 2.34e-14·3^0.59·e^(−17.44/3) etc.
  assertRel(kIz(3), 1.336653e-16, 1e-6, "K_iz(3)");
  assertRel(kEx(3), 5.032771e-16, 1e-6, "K_ex(3)");
  assertRel(kEl(3), 1.262180e-13, 1e-6, "K_el(3)");
  // E_c(3 eV) = 15.76 + 12.14·K_ex/K_iz + (3m/M)·3·K_el/K_iz = 61.59 eV; 37.29 eV at 5 eV
  assertRel(collisionalLoss(3), 61.58627, 1e-6, "E_c(3)");
  assertRel(collisionalLoss(5), 37.28728, 1e-6, "E_c(5)");
  // Floating sheath ln √(M/2πm) = 4.6789 for argon (≈ 4.7 Tₑ, L&L §10.2).
  assertRel(floatingSheathVoltage(1), 4.678940, 1e-6, "V_s/Tₑ");
});

test("global model, R = 15 cm, l = 30 cm, 1 mTorr, 293 K, 800 W", () => {
  // Reference values from an independent script (constants typed in, L&L eqs. 5.3.16–5.3.17 with D_a = D_i(1 + Tₑ/Tᵢ))
  // that scans Tₑ on a 1e-5 eV grid instead of bisecting. The diffusion term lowers h_l by 0.8 % here (0.3051 without it).
  const d = argonDischarge(800, 0.15, 0.3, 1e-3 * TORR, 293);
  assertRel(d.ng, 3.295734e19, 1e-6, "n_g");
  assertRel(d.lambdaI, 0.03034226, 1e-6, "λᵢ");
  assertRel(d.Da, 707.846, 1e-5, "D_a");
  assertRel(d.hl, 0.3027996, 1e-6, "h_l");
  assertRel(d.hR, 0.2650229, 1e-6, "h_R");
  assertRel(d.dEff, 0.1801055, 1e-6, "d_eff");
  assertRel(d.aEff, 0.1177407, 1e-6, "A_eff");
  assertRel(d.Te, 3.78101, 1e-5, "Tₑ");
  assertRel(d.Ec, 47.0387, 1e-4, "E_c");
  assertRel(d.ET, 74.1823, 1e-4, "E_T");
  assertRel(d.n0, 1.891757e17, 1e-4, "n₀");
  assertRel(d.ionFluxAxial, 1.731042e20, 1e-4, "Γ_axial");
  assertRel(d.debye, 3.323460e-5, 1e-4, "λ_De");
  // L&L §10.2 Example 1 (p. 335), the same case with n_g = 3.3e19 m⁻³ and λᵢ ≈ 0.03 m: h_l ≈ 0.31, h_R ≈ 0.27,
  // d_eff ≈ 0.18 m, Tₑ ≈ 3.8 V (Fig. 10.1), E_c ≈ 47 V, E_T ≈ 74 V, u_B ≈ 3.0e3 m/s, A_eff ≈ 0.12 m², n₀ ≈ 1.9e17 m⁻³,
  // Γ_il ≈ 1.7e20 m⁻²s⁻¹, J_il ≈ 2.8 mA/cm². The book's h_l uses eq. 10.2.1 without the diffusion term (0.305).
  assertRel(d.hl, 0.31, 0.03, "h_l vs Example 1");
  assertRel(d.hR, 0.27, 0.03, "h_R vs Example 1");
  assertRel(d.dEff, 0.18, 0.01, "d_eff vs Example 1");
  assertRel(d.Te, 3.8, 0.01, "Tₑ vs Example 1");
  assertRel(d.Ec, 47, 0.01, "E_c vs Example 1");
  assertRel(d.ET, 74, 0.01, "E_T vs Example 1");
  assertRel(d.uB, 3.0e3, 0.02, "u_B vs Example 1");
  assertRel(d.aEff, 0.12, 0.03, "A_eff vs Example 1");
  assertRel(d.n0, 1.9e17, 0.01, "n₀ vs Example 1");
  assertRel(d.ionFluxAxial, 1.7e20, 0.03, "Γ_il vs Example 1");
  assertRel(1.602176634e-19 * d.ionFluxAxial * 0.1, 2.8, 0.02, "J_il (mA/cm²) vs Example 1");
});

test("rate-constant fit range (Lieberman & Lichtenberg Table 3.3 note a: Gudmundsson, 1 < T_e ≤ 7 V)", () => {
  assert.equal(TE_FIT_MIN, 1);
  assert.equal(TE_FIT_MAX, 7);
  // The page defaults (500 W, 5 mTorr, R 15 cm, l 30 cm, 300 K) solve to T_e ≈ 2.553 eV (independent scan), inside the fits.
  const Te = argonDischarge(500, 0.15, 0.3, 5e-3 * TORR, 300).Te;
  assert.ok(Te > TE_FIT_MIN && Te <= TE_FIT_MAX, `T_e ${Te}`);
  assertRel(Te, 2.5528, 1e-5, "T_e at the defaults");
});

test("collisional regime: 100 mTorr, and the diffusion limit of h (L&L eqs. 5.3.16–5.3.17)", () => {
  // Same independent scan as above: the diffusion term takes over (h_l 0.0142 against 0.0386 from the low-pressure terms alone).
  const d = argonDischarge(800, 0.15, 0.3, 0.1 * TORR, 293);
  assertRel(d.Da, 2.69638, 1e-5, "D_a");
  assertRel(d.hl, 0.01415881, 1e-5, "h_l");
  assertRel(d.hR, 0.01146272, 1e-5, "h_R");
  assertRel(d.Te, 1.42466, 1e-5, "Tₑ");
  assertRel(d.n0, 1.456527e18, 1e-4, "n₀");
  assertRel(d.ionFluxAxial, 3.825463e19, 1e-4, "Γ_axial");
  // Hand calculation, ambipolar diffusion: D_i = k_B T_g / (M ν_i), ν_i = v̄_i/λ_i; at 1 mTorr, 293 K, Tₑ = 3.781 eV:
  // v̄_i = √(8 k_B T_g/(π M)) = 394.6 m/s, D_i = 4.689 m²/s, × (1 + 3.781/0.02525) = 707.8 m²/s.
  assertRel(ambipolarDiffusion(3.781005, 293, 0.03034226), 707.8455, 1e-5, "D_a by hand");
  // At 10 Torr the cosine and J₀ diffusion profiles hold: h_l → π D_a/(l u_B) (L&L p. 149, Problem 5.7), h_R → χ₀₁ J₁(χ₀₁) D_a/(R u_B).
  const ng = (10 * TORR) / (1.380649e-23 * 293);
  const g = geometry(0.15, 0.3, ng, 1.5, 293);
  const uB = Math.sqrt((1.602176634e-19 * 1.5) / (39.948 * 1.66053906892e-27));
  assertRel(g.hl, (Math.PI * g.Da) / (0.3 * uB), 2e-3, "h_l diffusion limit");
  assertRel(g.hR, (2.404825557695773 * 0.5191474972894669 * g.Da) / (0.15 * uB), 2e-3, "h_R diffusion limit");
});

test("limits and guards", () => {
  // Tₑ depends only on n_g d_eff and falls as it rises.
  assert.ok(electronTemperature(1e19) > electronTemperature(1e20));
  // Particle balance is satisfied at the root.
  const Te = electronTemperature(5e18);
  const uB = Math.sqrt((1.602176634e-19 * Te) / (39.948 * 1.66053906892e-27));
  assertRel(kIz(Te) / uB, 1 / 5e18, 1e-8, "balance");
  // Power only scales n₀.
  const a = argonDischarge(200, 0.1, 0.1, 0.5, 300);
  const b = argonDischarge(400, 0.1, 0.1, 0.5, 300);
  assertRel(b.n0 / a.n0, 2, 1e-12, "n₀ ∝ P");
  assert.equal(a.Te, b.Te);
  // Regime: 1 mTorr is inside (λᵢ = 30 mm vs 0.0253/3.79 · 0.3 m = 2.0 mm); 100 mTorr is outside.
  assert.ok(lowPressureRegime(argonDischarge(800, 0.15, 0.3, 1e-3 * TORR, 293), 0.15, 0.3, 293));
  assert.ok(!lowPressureRegime(argonDischarge(800, 0.15, 0.3, 0.1 * TORR, 293), 0.15, 0.3, 293));
  assert.ok(Number.isNaN(electronTemperature(1e10)), "no root: Tₑ above range");
  assert.ok(Number.isNaN(argonDischarge(100, 0, 0.1, 0.5, 300).Te), "R = 0");
  assert.ok(Number.isNaN(geometry(0.1, 0.1, -1, 3, 300).hl), "n_g < 0");
});
