import test from "node:test";
import assert from "node:assert/strict";

import {
  XRAY_MATERIALS as M,
  incoherentCrossSection,
  scatteringFactors,
  xrayIndex,
  xrayTransmission,
} from "../src/physics/materials/x-ray-optics";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) <= tol, `${label}: ${actual} vs ${expected}`);
}

const index = (id: keyof typeof M, rho_gcc: number, E_eV: number) => xrayIndex(M[id].formula, rho_gcc * 1000, E_eV);

test("x-ray δ: hand calculation r_e λ² n f₁/2π (PR #155 golden value)", () => {
  // Be, 10 keV, ρ 1.85 g/cm³, f₁ ≈ 4.00: δ = 2.818e-15 · (1.2398e-10)² · 1.236e29 · 4.00/2π = 3.41e-6.
  assertRel(index("Be", 1.85, 10000).delta, 3.41e-6, 0.002, "Be δ");
});

test("x-ray δ, β against the CXRO index-of-refraction calculator (henke.lbl.gov/cgi-bin/getdb.pl, 2026-10-22)", () => {
  // [material, ρ g/cm³, E eV, δ, β]; CXRO's β includes Compton scattering, as ours does.
  const cxro: [keyof typeof M, number, number, number, number][] = [
    ["Si", 2.33, 10000, 4.88892465e-6, 7.37899413e-8],
    ["Ni", 8.902, 10000, 1.72124055e-5, 1.83405609e-6],
    ["Cu", 8.96, 10000, 1.62193392e-5, 1.92141965e-6],
    ["Mo", 10.22, 10000, 1.84293494e-5, 8.3251507e-7],
    ["Mo", 10.22, 25000, 2.94151482e-6, 1.83375192e-7],
    ["Pt", 21.45, 10000, 3.29074646e-5, 2.34672279e-6],
    ["Au", 19.32, 10000, 2.99120929e-5, 2.2081831e-6],
    ["Au", 19.32, 12000, 1.84018918e-5, 2.8540137e-6],
    ["Si3N4", 3.17, 5000, 2.68203949e-5, 9.7143834e-7],
  ];
  for (const [id, rho, E, delta, beta] of cxro) {
    const r = index(id, rho, E);
    assertRel(r.delta, delta, 0.003, `${id} ${E} eV δ`);
    assertRel(r.beta, beta, 0.005, `${id} ${E} eV β`);
  }
  assertRel(index("Be", 1.848, 10000).delta, 3.40754082e-6, 0.003, "Be δ");
  assertRel(index("diamond", 2.2, 10000).delta, 4.57251872e-6, 0.003, "C δ");
  assertRel(index("polyimide", 1.42, 8000).delta, 4.74066701e-6, 0.003, "Kapton δ");
  // Si₃N₄ preset: α-Si₃N₄ 3.18 g/cm³ (Kaloyeros et al. 2020, Table I: 3.184), not CXRO's 3.44. δ ∝ ρ, so δ at 5 keV is
  // the CXRO 3.17 row × 3.18/3.17 = 2.69050e-5.
  assert.equal(M.Si3N4.rho_gcc, 3.18);
  assertRel(index("Si3N4", M.Si3N4.rho_gcc, 5000).delta, 2.68203949e-5 * (3.18 / 3.17), 0.003, "Si₃N₄ preset δ");
});

test("x-ray β and attenuation length with Compton scattering against CXRO (getdb.pl, atten.pl, 2026-11-03)", () => {
  // Photoabsorption alone gives Be β 7.98e-10 at 10 keV (0.78 of CXRO) and an attenuation length 14× too long at 30 keV.
  assertRel(index("Be", 1.848, 10000).beta, 1.02839592e-9, 0.002, "Be 10 keV β");
  assertRel(index("Be", 1.848, 30000).attenuationLength, 33354.8e-6, 0.002, "Be 30 keV L");
  assertRel(index("diamond", 3.515, 10000).beta, 7.62779e-9, 0.003, "C 10 keV β");
  assertRel(index("diamond", 3.515, 20000).attenuationLength, 7794.74e-6, 0.002, "C 20 keV L");
  assertRel(index("polyimide", 1.43, 30000).beta, 1.15305307e-10, 0.002, "Kapton 30 keV β");
  assertRel(index("Si", 2.33, 30000).beta, 9.89384463e-10, 0.002, "Si 30 keV β");
  // Compton share of Be β at 30 keV: n σ_inc λ/4π with XCOM σ_inc 2.256 b, n = 1.848e3 · N_A/9.0122e-3 = 1.2349e29 m⁻³,
  // λ = 4.1328e-11 m: 1.2349e29 · 2.256e-28 · 4.1328e-11/4π = 9.162e-11 of CXRO's 9.860e-11.
  assertRel(index("Be", 1.848, 30000).betaCompton, 9.162e-11, 0.002, "Be 30 keV β_C");
});

test("x-ray incoherent cross-section: XCOM rows, interpolation, range", () => {
  // XCOM (barn/atom): Be 10 keV 1.888; Au 30 keV 27.56; H between rows at 2.2 and 2.5 keV, XCOM 2.35 keV not queried:
  // log-log midpoint of 0.2786 and 0.3214 at √(2200 · 2500) = 2345 eV is √(0.2786 · 0.3214) = 0.29924.
  assertRel(incoherentCrossSection("Be", 10000), 1.888e-28, 1e-9, "Be 10 keV");
  assertRel(incoherentCrossSection("Au", 30000), 27.56e-28, 1e-9, "Au 30 keV");
  assertRel(incoherentCrossSection("H", Math.sqrt(2200 * 2500)), Math.sqrt(0.2786 * 0.3214) * 1e-28, 1e-9, "H midpoint");
  assert.ok(Number.isNaN(incoherentCrossSection("Be", 999)) && Number.isNaN(incoherentCrossSection("Be", 30001)));
});

test("x-ray scattering factors: interpolation reproduces dropped Henke rows; edges; range", () => {
  // be.nff row 10075.9 eV: f₁ 4.00248, f₂ 0.921746e-3 (not among the kept rows).
  const be = scatteringFactors("Be", 10075.9);
  assertRel(be.f1, 4.00248, 0.002, "Be f₁");
  assertRel(be.f2, 0.921746e-3, 0.002, "Be f₂");
  // Cu K edge (cu.nff rows 8978.80 / 8979 eV): f₂ jumps from 0.4955 to 3.853.
  assertRel(scatteringFactors("Cu", 8978.8).f2, 0.495545, 1e-6, "Cu f₂ below K");
  assertRel(scatteringFactors("Cu", 8979).f2, 3.85305, 1e-6, "Cu f₂ above K");
  assert.ok(Number.isNaN(scatteringFactors("Au", 999).f1) && Number.isNaN(index("Au", 19.32, 30001).delta));
  assert.ok(Number.isNaN(index("Au", 0, 10000).delta));
});

test("x-ray critical angle and attenuation length", () => {
  const si = index("Si", 2.33, 10000);
  // θ_c = √(2δ) = √(2 · 4.889e-6) = 3.127 mrad; L = λ/(4πβ) = 1.2398e-10/(4π · 7.37e-8) = 134 µm.
  assertRel(si.thetaC, Math.sqrt(2 * 4.88892465e-6), 0.002, "Si θc");
  assertRel(si.attenuationLength, 1.23984e-10 / (4 * Math.PI * 7.37899413e-8), 0.005, "Si L");
  assertRel(xrayTransmission(si.attenuationLength, si.attenuationLength), Math.exp(-1), 1e-12, "T(L)");
});
