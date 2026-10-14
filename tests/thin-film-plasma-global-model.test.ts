import test from "node:test";
import assert from "node:assert/strict";

import { TORR } from "../src/physics/constants";
import {
  argonDischarge,
  collisionalLoss,
  electronTemperature,
  floatingSheathVoltage,
  geometry,
  kEl,
  kEx,
  kIz,
  lowPressureRegime,
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
  // Reference values from an independent script that scans Tₑ on a 1e-5 eV grid instead of bisecting.
  const d = argonDischarge(800, 0.15, 0.3, 1e-3 * TORR, 293);
  assertRel(d.ng, 3.295734e19, 1e-6, "n_g");
  assertRel(d.lambdaI, 0.03034226, 1e-6, "λᵢ");
  assertRel(d.hl, 0.3051334, 1e-6, "h_l");
  assertRel(d.hR, 0.2675062, 1e-6, "h_R");
  assertRel(d.dEff, 0.1785405, 1e-6, "d_eff");
  assertRel(d.aEff, 0.1187728, 1e-6, "A_eff");
  assertRel(d.Te, 3.78804, 1e-5, "Tₑ");
  assertRel(d.Ec, 46.952, 1e-4, "E_c");
  assertRel(d.ET, 74.146, 1e-4, "E_T");
  assertRel(d.n0, 1.874493e17, 1e-4, "n₀");
  assertRel(d.ionFluxAxial, 1.730071e20, 1e-4, "Γ_axial");
  assertRel(d.debye, 3.341832e-5, 1e-4, "λ_De");
  // Lieberman's worked example of this case (course notes, https://people.eecs.berkeley.edu/~lieber/Day1View150315crop.pdf):
  // n₀ ≈ 2.0e17 m⁻³, J ≈ 2.9 mA/cm², with Tₑ ≈ 3.5 eV and E_c ≈ 42 eV read off figures; the fits give 3.79 and 47 eV.
  assertRel(d.n0, 2.0e17, 0.1, "n₀ vs example");
  assertRel(1.602176634e-19 * d.ionFluxAxial * 0.1, 2.9, 0.1, "J (mA/cm²) vs example");
  assertRel(d.Te, 3.5, 0.1, "Tₑ vs example");
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
  assert.ok(Number.isNaN(geometry(0.1, 0.1, -1).hl), "n_g < 0");
});
