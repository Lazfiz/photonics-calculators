import test from "node:test";
import assert from "node:assert/strict";

import {
  LAMBDA_D, abbeNumber, d2nDlambda2, dispersionParameter, dnDlambda, fromResonanceWavelengths, gvd, groupIndex,
  inRange, refractiveIndex, schottDeltaN, schottDnDt, zeroDispersionWavelengths, type SellmeierModel,
} from "../src/physics/materials/sellmeier";
import { MATERIALS, SCHOTT_GLASSES } from "../src/physics/materials/sellmeier-data";

const um = 1e-6;

function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

function maxDifference(a: SellmeierModel, b: SellmeierModel, lo: number, hi: number) {
  let worst = 0;
  for (let i = 0; i <= 200; i++) {
    const l = lo * (hi / lo) ** (i / 200);
    worst = Math.max(worst, Math.abs(refractiveIndex(a, l) - refractiveIndex(b, l)));
  }
  return worst;
}

test("SCHOTT sets reproduce their catalog n_d and V_d", () => {
  for (const [id, g] of Object.entries(SCHOTT_GLASSES)) {
    assertAbs(refractiveIndex(g.model, LAMBDA_D), g.nd, 1e-5, `${id} n_d`);
    assertAbs(abbeNumber(g.model), g.vd, 0.01, `${id} V_d`);
  }
});

test("fused silica (Malitson): zero-dispersion wavelength and sign of D", () => {
  const fs = MATERIALS.fusedSilica.model;
  // Agrawal, Nonlinear Fiber Optics §1.2.3: λ_D ≈ 1.27 µm for bulk fused silica.
  const zd = zeroDispersionWavelengths(fs);
  assert.equal(zd.length, 1);
  assertAbs(zd[0], 1.27 * um, 0.005 * um, "λ_D");
  // Normal dispersion (β₂ > 0, D < 0) below λ_D, anomalous above; dn/dλ < 0 throughout the transparent range.
  assert.ok(gvd(fs, 800e-9) > 0 && dispersionParameter(fs, 800e-9) < 0, "normal at 800 nm");
  assert.ok(gvd(fs, 1550e-9) < 0 && dispersionParameter(fs, 1550e-9) > 0, "anomalous at 1550 nm");
  assert.ok(dnDlambda(fs, 1550e-9) < 0, "dn/dλ < 0");
  // D = −2πc β₂/λ² links the two.
  const l = 1550e-9;
  assertAbs(dispersionParameter(fs, l), (-2 * Math.PI * 299792458 * gvd(fs, l)) / l ** 2, 1e-12, "D vs β₂");
});

test("analytic derivatives match finite differences", () => {
  const cases: [SellmeierModel, number][] = [
    [MATERIALS.fusedSilica.model, 0.8 * um], [MATERIALS.fusedSilica.model, 1.55 * um], [SCHOTT_GLASSES["N-SF11"].model, 0.6 * um],
    [MATERIALS.ge.model, 10 * um], [MATERIALS.zns.model, 4 * um], [MATERIALS.nacl.model, 20 * um],
  ];
  for (const [m, l] of cases) {
    const h = 1e-3 * l;
    const n = (x: number) => refractiveIndex(m, x);
    const d1 = (n(l + h) - n(l - h)) / (2 * h);
    const d2 = (n(l + h) - 2 * n(l) + n(l - h)) / (h * h);
    assert.ok(Math.abs(dnDlambda(m, l) / d1 - 1) < 1e-5, `n′ at ${l}`);
    assert.ok(Math.abs(d2nDlambda2(m, l) / d2 - 1) < 1e-4, `n″ at ${l}`);
    assertAbs(groupIndex(m, l), n(l) - l * d1, 1e-6, `n_g at ${l}`);
  }
});

test("crystal sets agree with independent measurements", () => {
  // Li, J. Phys. Chem. Ref. Data 9, 161 (1980), 20 °C: CaF₂, BaF₂ over the full common range; MgF₂ (o) to 1 µm
  // (beyond, Li's MgF₂ fit runs 0.4 % high against Dodge and the Duncanson & Stevenson data below).
  const caf2Li = fromResonanceWavelengths(1.33973, [0.69913, 0.11994, 4.35181], [0.09374, 21.18, 38.46], [0.15, 12]);
  const baf2Li = fromResonanceWavelengths(1.33973, [0.8107, 0.19652, 4.52469], [0.10065, 29.87, 53.82], [0.15, 15]);
  const mgf2Li = fromResonanceWavelengths(1.2762, [0.60967, 0.008, 2.14973], [0.08636, 18, 25], [0.14, 7.5]);
  assert.ok(maxDifference(MATERIALS.caf2.model, caf2Li, 0.23 * um, 9.7 * um) < 2e-4, "CaF₂");
  assert.ok(maxDifference(MATERIALS.baf2.model, baf2Li, 0.27 * um, 10.3 * um) < 2e-4, "BaF₂");
  assert.ok(maxDifference(MATERIALS.mgf2.model, mgf2Li, 0.2 * um, 1 * um) < 2e-4, "MgF₂");
  // MgF₂ (o): Duncanson & Stevenson, Proc. Phys. Soc. 72, 1001 (1958), as tabulated by Crystran (3 decimals).
  for (const [l, n] of [[2, 1.368], [3.03, 1.36], [4, 1.349], [5, 1.334], [6.06, 1.314]]) {
    assertAbs(refractiveIndex(MATERIALS.mgf2.model, l * um), n, 1e-3, `MgF₂ ${l} µm`);
  }
  // Ge: Li, J. Phys. Chem. Ref. Data 9, 561 (1980), 293 K table (Burnett's fit is at 295 K).
  for (const [l, n] of [[4, 4.0242], [5, 4.0149], [10, 4.0025], [12, 4.0012]]) {
    assertAbs(refractiveIndex(MATERIALS.ge.model, l * um), n, 2e-3, `Ge ${l} µm`);
  }
  // Si: Chandler-Horowitz & Amirtharaj, J. Appl. Phys. 97, 123526 (2005): n² = 11.67316 + 1/λ² + 0.004482633/(λ² − 1.108205²).
  for (const l of [2.5, 4, 6, 8, 11]) {
    const nCH = Math.sqrt(11.67316 + 1 / l ** 2 + 0.004482633 / (l ** 2 - 1.108205 ** 2));
    assertAbs(refractiveIndex(MATERIALS.si.model, l * um), nCH, 1e-3, `Si ${l} µm`);
  }
  // ZnSe: Crystran data sheet (manufacturer's published data).
  for (const [l, n] of [[0.62, 2.5994], [1, 2.4892], [5, 2.4295], [10.6, 2.4028], [18.2, 2.3278]]) {
    assertAbs(refractiveIndex(MATERIALS.znse.model, l * um), n, 3e-4, `ZnSe ${l} µm`);
  }
  // ZnS: Bond, J. Appl. Phys. 36, 1674 (1965).
  assertAbs(refractiveIndex(MATERIALS.zns.model, 1 * um), 2.2932, 1e-3, "ZnS 1 µm");
  assertAbs(refractiveIndex(MATERIALS.zns.model, 2 * um), 2.2653, 1e-3, "ZnS 2 µm");
  // n_D (589.3 nm), CRC Handbook of Chemistry and Physics: NaCl 1.544, diamond 2.417.
  assertAbs(refractiveIndex(MATERIALS.nacl.model, 589.3e-9), 1.544, 1e-3, "NaCl n_D");
  assertAbs(refractiveIndex(MATERIALS.diamond.model, 589.3e-9), 2.417, 1e-3, "diamond n_D");
  // Peter's formula (Z. Phys. 15, 358 (1923), doi:10.1007/BF01330487) at 589.3 nm: 2.4173. He measured 226–644 nm only.
  assertAbs(refractiveIndex(MATERIALS.diamond.model, 589.3e-9), 2.4173, 1e-4, "diamond Peter 589.3 nm");
  assert.equal(inRange(MATERIALS.diamond.model, 644e-9), true);
  assert.equal(inRange(MATERIALS.diamond.model, 700e-9), false);
});

test("the merged dispersion pages' reviewer values (materials audit part 0, PR #155)", () => {
  // Malitson 1965 (doi:10.1364/JOSA.55.001205): n_d 1.45846, V_d 67.82.
  assertAbs(refractiveIndex(MATERIALS.fusedSilica.model, LAMBDA_D), 1.45846, 1e-5, "fused silica n_d");
  assertAbs(abbeNumber(MATERIALS.fusedSilica.model), 67.82, 0.01, "fused silica V_d");
  // β₂ = λ³n″/(2πc²) and n_g = n − λn′: N-BK7 at 800 nm 44.65 fs²/mm and 1.52665; fused silica at 1550 nm
  // −27.95 ps²/km and 1.46260.
  const bk7 = SCHOTT_GLASSES["N-BK7"].model;
  assertAbs(gvd(bk7, 800e-9) * 1e27, 44.65, 0.01, "N-BK7 β₂ 800 nm");
  assertAbs(groupIndex(bk7, 800e-9), 1.52665, 1e-5, "N-BK7 n_g 800 nm");
  assertAbs(gvd(MATERIALS.fusedSilica.model, 1550e-9) * 1e27, -27.95, 0.01, "fused silica β₂ 1550 nm");
  assertAbs(groupIndex(MATERIALS.fusedSilica.model, 1550e-9), 1.4626, 1e-4, "fused silica n_g 1550 nm");
});

test("the old pages' failures: Ge at 4 µm is 4.02, MgF₂ stays above 1", () => {
  assertAbs(refractiveIndex(MATERIALS.ge.model, 4 * um), 4.0247, 1e-4, "Ge 4 µm");
  for (let l = 0.2; l <= 7; l += 0.1) assert.ok(refractiveIndex(MATERIALS.mgf2.model, l * um) > 1.29, `MgF₂ ${l.toFixed(1)} µm`);
});

test("SCHOTT dn/dT: hand value at 20 °C and the derivative of the TIE-19 Δn", () => {
  const g = SCHOTT_GLASSES["N-BK7"];
  const l = 546.07e-9;
  const n = refractiveIndex(g.model, l);
  const [D0, D1, D2, E0, E1, lTK] = g.thermal;
  const x2 = (l / um) ** 2;
  // ΔT = 0: (n² − 1)/(2n) · (D₀ + E₀/(λ² − λ_TK²)) = 1.493e-6 /K by hand.
  assertAbs(schottDnDt(g.model, g.thermal, l, 20), ((n * n - 1) / (2 * n)) * (D0 + E0 / (x2 - lTK ** 2)), 1e-15, "20 °C");
  assertAbs(schottDnDt(g.model, g.thermal, l, 20), 1.493e-6, 1e-9, "20 °C value");
  // Central difference of Δn_abs(T) = (n² − 1)/(2n) (D₀ΔT + D₁ΔT² + D₂ΔT³ + (E₀ΔT + E₁ΔT²)/(λ² − λ_TK²)).
  const dn = (T: number) => {
    const d = T - 20;
    return ((n * n - 1) / (2 * n)) * (D0 * d + D1 * d * d + D2 * d ** 3 + (E0 * d + E1 * d * d) / (x2 - lTK ** 2));
  };
  assertAbs(schottDnDt(g.model, g.thermal, l, 60), (dn(60.01) - dn(59.99)) / 0.02, 1e-13, "60 °C");
  assertAbs(schottDeltaN(g.model, g.thermal, l, 60), dn(60), 1e-18, "Δn 20 → 60 °C");
  // By hand: 0.43014 · (7.440e-5 + 2.096e-5 − 0.088e-5 + 1.8363e-5/0.26929) = 6.997e-5.
  assertAbs(schottDeltaN(g.model, g.thermal, l, 60), 6.997e-5, 1e-8, "Δn 20 → 60 °C value");
  assert.equal(schottDeltaN(g.model, g.thermal, l, 20), 0);
});

test("SCHOTT dn/dT: N-BK7 data-sheet table (SCHOTT data sheets 2017)", () => {
  const g = SCHOTT_GLASSES["N-BK7"];
  // Δn_abs/ΔT (×10⁻⁶/K) at 1060 nm, e (546.07 nm) and g (435.83 nm), as printed to 0.1 on the N-BK7 sheet.
  const table: [number, number, number[]][] = [[-40, -20, [0.3, 0.8, 1.2]], [20, 40, [1.1, 1.6, 2.1]]];
  for (const [a, b, row] of table) {
    [1060e-9, 546.07e-9, 435.83e-9].forEach((l, i) => {
      const mean = (schottDeltaN(g.model, g.thermal, l, b) - schottDeltaN(g.model, g.thermal, l, a)) / (b - a);
      assertAbs(mean * 1e6, row[i], 0.05, `${a}/${b} °C, ${l * 1e9} nm`);
    });
  }
});

test("domain: outside the fit range and inside an absorption band", () => {
  assert.equal(inRange(MATERIALS.ge.model, 1 * um), false);
  assert.equal(inRange(MATERIALS.ge.model, 10 * um), true);
  // MgF₂'s third resonance sits at 23.79 µm: the formula gives n² < 0 below it (20 µm), a NaN rather than a number.
  assert.ok(Number.isNaN(refractiveIndex(MATERIALS.mgf2.model, 20 * um)));
  assert.ok(Number.isNaN(refractiveIndex(MATERIALS.mgf2.model, 0)));
});
