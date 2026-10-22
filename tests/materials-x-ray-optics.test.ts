import test from "node:test";
import assert from "node:assert/strict";

import { XRAY_MATERIALS as M, scatteringFactors, xrayIndex, xrayTransmission } from "../src/physics/materials/x-ray-optics";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) <= tol, `${label}: ${actual} vs ${expected}`);
}

const index = (id: keyof typeof M, rho_gcc: number, E_eV: number) => xrayIndex(M[id].formula, rho_gcc * 1000, E_eV);

test("x-ray δ: hand calculation r_e λ² n f₁/2π (PR #155 golden value)", () => {
  // Be, 10 keV, ρ 1.85 g/cm³, f₁ ≈ 4.00: δ = 2.818e-15 · (1.2398e-10)² · 1.236e29 · 4.00/2π = 3.41e-6.
  assertRel(index("Be", 1.85, 10000).delta, 3.41e-6, 0.002, "Be δ");
});

test("x-ray δ, β against the CXRO index-of-refraction calculator (henke.lbl.gov/cgi-bin/getdb.pl, 2026-10-22)", () => {
  // [material, ρ g/cm³, E eV, δ, β]; β only for Z ≥ 14, where Compton scattering (in CXRO's β, not ours) is < 1 %.
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
  // Light elements: δ still matches; β is photoabsorption only, so it sits below CXRO's (Compton included).
  assertRel(index("Be", 1.848, 10000).delta, 3.40754082e-6, 0.003, "Be δ");
  assertRel(index("diamond", 2.2, 10000).delta, 4.57251872e-6, 0.003, "C δ");
  assertRel(index("polyimide", 1.42, 8000).delta, 4.74066701e-6, 0.003, "Kapton δ");
  assertRel(index("Be", 1.848, 10000).beta / 1.02839592e-9, 0.78, 0.01, "Be β / CXRO β");
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
