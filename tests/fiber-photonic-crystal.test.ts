import { test } from "node:test";
import assert from "node:assert/strict";
import {
  V_CUTOFF, cutoffWavelength, endlesslySingleModeLimit, isEndlesslySingleMode, pcfDispersion, pcfMode, saitohKoshibaV,
  saitohKoshibaW,
} from "../src/physics/fiber-optics/photonic-crystal";

const PS_NM_KM = 1e-6;
const sigmoid = (a: readonly number[], x: number) => a[0] + a[1] / (1 + a[2] * Math.exp(a[3] * x));

test("Saitoh–Koshiba V and W reproduce the per-d/Λ fits of Rahmani et al.", () => {
  // Rahmani et al., arXiv:1908.01575, Tables I–II: A₁..A₄ and B₁..B₄ fitted separately at each d/Λ.
  const table: Record<number, { A: number[]; B: number[] }> = {
    0.4: { A: [0.5844, 2.6392, 0.5622, 1.5363], B: [-0.1123, 2.37, 0.3301, 2.0709] },
    0.6: { A: [0.7281, 5.7153, 1.03, 1.2638], B: [-0.1922, 5.4698, 0.693, 1.3662] },
    0.8: { A: [1.1045, 13.783, 1.6108, 1.4947], B: [0.0143, 15.1949, 1.5343, 1.3731] },
  };
  for (const [r, { A, B }] of Object.entries(table)) {
    for (const x of [0.1, 0.5, 1, 2]) {
      assert.ok(Math.abs(saitohKoshibaV(x, +r) - sigmoid(A, x)) < 5e-4, `V at d/Λ ${r}, λ/Λ ${x}`);
      assert.ok(Math.abs(saitohKoshibaW(x, +r) - sigmoid(B, x)) < 5e-4, `W at d/Λ ${r}, λ/Λ ${x}`);
    }
  }
});

test("endlessly single-mode limit is near the FEM value d/Λ = 0.424", () => {
  // Saitoh, Tsuchida, Koshiba, Mortensen, Opt. Express 13, 10833 (2005), Table 1: d*/Λ = 0.424 (single-rod core).
  const limit = endlesslySingleModeLimit();
  assert.ok(Math.abs(limit - 0.424) < 0.006, `limit ${limit}`);
  assert.equal(isEndlesslySingleMode(0.4), true);
  assert.equal(isEndlesslySingleMode(0.5), false);
});

test("cutoff wavelength solves V(λ_c/Λ) = 2.405, and is 0 when endlessly single-mode", () => {
  const pitch = 4.5e-6;
  const lc = cutoffWavelength(pitch, 0.6);
  assert.ok(Math.abs(saitohKoshibaV(lc / pitch, 0.6) - V_CUTOFF) < 1e-9);
  assert.ok(lc > 2.5e-6 && lc < 3.5e-6, `λ_c ${lc}`);
  assert.equal(cutoffWavelength(pitch, 0.35), 0);
});

test("cutoff follows the Kuhlmey/Mortensen phase boundary λ*/Λ = 2.80 (d/Λ − 0.406)^0.89", () => {
  // Mortensen et al., Opt. Lett. 28, 1879 (2003) (arXiv:physics/0307010): α = 2.80 ± 0.12, γ = 0.89 ± 0.02,
  // fitted to the multipole cutoff of Kuhlmey et al., Opt. Lett. 27, 1684 (2002).
  for (const r of [0.6, 0.7, 0.8]) {
    const ref = 2.8 * (r - 0.406) ** 0.89;
    const got = cutoffWavelength(1e-6, r) / 1e-6;
    assert.ok(Math.abs(got - ref) / ref < 0.05, `d/Λ ${r}: λc/Λ ${got.toFixed(3)} vs ${ref.toFixed(3)}`);
  }
});

test("dispersion agrees with multipole-method results for d/Λ = 0.8 at 850 nm", () => {
  // Rahmani et al., arXiv:1908.01575, Sec. 3 / Fig. 3(c),(d), multipole method: Λ = 1.5 µm → 71.296 ps/(nm·km),
  // Λ = 2 µm → 23.0689 ps/(nm·km). (Their text labels the second pitch 2.5 µm; Fig. 3(d) and its caption say 2 µm.)
  for (const [pitch_um, mpm] of [[1.5, 71.296], [2, 23.0689]]) {
    const D = pcfDispersion(pitch_um * 1e-6, 0.8 * pitch_um * 1e-6, 850e-9) / PS_NM_KM;
    assert.ok(Math.abs(D - mpm) < 5, `Λ ${pitch_um} µm: D ${D.toFixed(2)} vs ${mpm}`);
  }
});

test("large pitch recovers bulk silica dispersion (≈ 21.9 ps/(nm·km) at 1550 nm, Malitson)", () => {
  const m = pcfMode(60e-6, 0.3 * 60e-6, 1550e-9);
  assert.ok(Math.abs(m.materialDispersion / PS_NM_KM - 21.9) < 0.3, `material ${m.materialDispersion / PS_NM_KM}`);
  assert.ok(Math.abs(m.waveguideDispersion / PS_NM_KM) < 1, `waveguide ${m.waveguideDispersion / PS_NM_KM}`);
});

test("effective area of the ESM fibre HF1 (Λ = 12.4 µm, d/Λ = 0.424) is ≈ 200 µm² at 1550 nm", () => {
  // Saitoh et al., Opt. Express 13, 10833 (2005), Sec. 4: A_eff = 200 µm² from FEM. Gaussian πw² with Marcuse's w.
  const m = pcfMode(12.4e-6, 0.424 * 12.4e-6, 1550e-9);
  const area_um2 = m.effectiveArea * 1e12;
  assert.ok(Math.abs(area_um2 - 200) / 200 < 0.1, `A_eff ${area_um2}`);
  assert.equal(m.singleMode, true);
  assert.ok(m.nEff > m.nFsm && m.nEff < m.nCore);
});

test("unphysical fit regions give NaN: W ≤ 0, d/Λ outside 0.2–0.8, Marcuse below V = 1.2", () => {
  // Λ = 0.8 µm, d/Λ = 0.25, λ = 1550 nm: the W fit is −0.087 (n_eff would fall below n_FSM).
  const neg = pcfMode(0.8e-6, 0.2e-6, 1550e-9);
  assert.ok(neg.W < 0 && !neg.physical);
  assert.ok(Number.isNaN(neg.nEff) && Number.isNaN(neg.mfd) && Number.isNaN(neg.dispersion));
  // d/Λ = 0.9: the r^24.8 terms blow W up to ≈ 121; no result.
  const big = pcfMode(2.3e-6, 2.07e-6, 1550e-9);
  assert.ok(Number.isNaN(big.nEff) && Number.isNaN(big.na) && Number.isNaN(big.dispersion));
  // d/Λ = 0.3, λ/Λ = 1.2: W > 0 but V ≈ 1.07 < 1.2, so n_eff is given and the MFD is not.
  const lowV = pcfMode(1.25e-6, 0.375e-6, 1500e-9);
  assert.ok(lowV.V < 1.2 && lowV.W > 0, `V ${lowV.V}, W ${lowV.W}`);
  assert.ok(Number.isFinite(lowV.nEff) && Number.isNaN(lowV.mfd));
  // λ/Λ = 2 exactly counts as inside the fit range despite rounding.
  assert.equal(pcfMode(1e-6, 0.5e-6, 2000e-9).inFitRange, true);
});

test("invalid geometry gives NaN, not a number", () => {
  assert.ok(Number.isNaN(pcfMode(4e-6, 4e-6, 1550e-9).V));
  assert.ok(Number.isNaN(pcfMode(4e-6, 0, 1550e-9).nEff));
  assert.ok(Number.isNaN(pcfMode(0, 1e-6, 1550e-9).dispersion));
  assert.ok(Number.isNaN(cutoffWavelength(4e-6, 1.2)));
});
