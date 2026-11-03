import { test } from "node:test";
import assert from "node:assert/strict";
import {
  V_CUTOFF, cutoffWavelength, endlesslySingleModeLimit, isEndlesslySingleMode, nielsenSpotSize, pcfDispersion, pcfMode,
  saitohKoshibaV, saitohKoshibaW,
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
  // Saitoh et al., Opt. Express 13, 10833 (2005), Sec. 4: A_eff = 200 µm² from FEM. πw² with Nielsen's w gives 194.0
  // (V_PCF 2.885); Marcuse's step-index fit with V_SK gave 212.
  const m = pcfMode(12.4e-6, 0.424 * 12.4e-6, 1550e-9);
  const area_um2 = m.effectiveArea * 1e12;
  assert.ok(Math.abs(area_um2 - 200) / 200 < 0.04, `A_eff ${area_um2}`);
  assert.equal(m.singleMode, true);
  assert.ok(m.nEff > m.nFsm && m.nEff < m.nCore);
});

test("mode-field diameter from Nielsen et al., Opt. Lett. 28, 2309 (2003), Eq. (2) with g = 8", () => {
  // w/Λ = 0.7078 V^−0.2 + 0.2997 V^−1.5 + 0.0037 V^−6. Read off Fig. 2: w/Λ ≈ 1.0 at V_PCF = 1, ≈ 0.62 at π.
  assert.ok(Math.abs(nielsenSpotSize(1) - 1.0112) < 1e-12);
  assert.ok(Math.abs(nielsenSpotSize(Math.PI) - 0.6168) < 1e-4, `${nielsenSpotSize(Math.PI)}`);
  // Page defaults Λ 4.5 µm, d/Λ 0.6, 1550 nm: W 2.401, V_PCF = √3 W = 4.158; by hand 0.53229 + 0.035347 + 7e-7 =
  // 0.56764, 2w = 5.109 µm (Marcuse with V_SK 2.933 gave 5.076).
  const m = pcfMode(4.5e-6, 2.7e-6, 1550e-9);
  assert.ok(Math.abs(m.vPcf - Math.sqrt(3) * m.W) < 1e-12 && Math.abs(m.vPcf - 4.158) < 1e-3, `V_PCF ${m.vPcf}`);
  assert.ok(Math.abs(m.mfd * 1e6 - 5.109) < 2e-3, `MFD ${m.mfd * 1e6}`);
  assert.ok(Math.abs(m.effectiveArea - (Math.PI * m.mfd * m.mfd) / 4) < 1e-24);
  // NKT LMA-5 (Λ 2.9 µm, d/Λ 0.44): data sheet MFD 4.1 ± 0.5 µm at 1550 nm; Nielsen 4.03 (Marcuse gave 4.40).
  const lma5 = pcfMode(2.9e-6, 0.44 * 2.9e-6, 1550e-9);
  assert.ok(Math.abs(lma5.mfd * 1e6 - 4.1) < 0.15, `LMA-5 MFD ${lma5.mfd * 1e6}`);
});

test("unphysical fit regions give NaN: W ≤ 0, d/Λ outside 0.2–0.8, Nielsen below V_PCF = 0.5", () => {
  // Λ = 0.8 µm, d/Λ = 0.25, λ = 1550 nm: the W fit is −0.087 (n_eff would fall below n_FSM).
  const neg = pcfMode(0.8e-6, 0.2e-6, 1550e-9);
  assert.ok(neg.W < 0 && !neg.physical);
  assert.ok(Number.isNaN(neg.nEff) && Number.isNaN(neg.mfd) && Number.isNaN(neg.dispersion));
  // d/Λ = 0.9: the r^24.8 terms blow W up to ≈ 121; no result.
  const big = pcfMode(2.3e-6, 2.07e-6, 1550e-9);
  assert.ok(Number.isNaN(big.nEff) && Number.isNaN(big.na) && Number.isNaN(big.dispersion));
  // d/Λ = 0.3, λ/Λ = 1.2: W > 0 but V_PCF ≈ 0.18 < 0.5 (Nielsen's w would be 127 µm), so n_eff is given and the MFD is not.
  const lowV = pcfMode(1.25e-6, 0.375e-6, 1500e-9);
  assert.ok(lowV.vPcf < 0.5 && lowV.W > 0, `V_PCF ${lowV.vPcf}, W ${lowV.W}`);
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

test("d/Λ outside 0.2–0.8 gives no V or guidance; d/Λ = 0.2 itself is inside despite rounding", () => {
  // 0.9e-6 / 4.5e-6 = 0.19999999999999998 in floating point; the fit range is 0.2 ≤ d/Λ ≤ 0.8 (Saitoh & Koshiba 2005).
  const edge = pcfMode(4.5e-6, 0.9e-6, 1550e-9);
  assert.equal(edge.physical, true);
  assert.ok(edge.W > 0 && edge.W < edge.V, `V ${edge.V}, W ${edge.W}`);
  // d/Λ = 0.889: the extrapolated fit gave V = 5.42, shown next to "endlessly single-mode".
  const out = pcfMode(4.5e-6, 4.0e-6, 1550e-9);
  assert.ok(Number.isNaN(out.V) && Number.isNaN(out.W));
  assert.equal(out.endlesslySingleMode, false);
  assert.equal(out.singleMode, false);
  assert.equal(pcfMode(4.5e-6, 0.5e-6, 1550e-9).endlesslySingleMode, false);
});
