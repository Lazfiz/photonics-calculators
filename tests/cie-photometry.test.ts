import test from "node:test";
import assert from "node:assert/strict";

import { CIE_D65, CIE_V_PHOTOPIC, CIE_WAVELENGTHS_NM, luminousWeightedMean } from "../src/physics/cie-photometry";

// CIE datasets doi:10.25039/CIE.DS.dktna2s3 (photopic V(λ)) and doi:10.25039/CIE.DS.hjfjmt59 (D65).
test("CIE tables: grid, normalisation and spot values", () => {
  assert.equal(CIE_WAVELENGTHS_NM.length, 81);
  assert.equal(CIE_V_PHOTOPIC.length, 81);
  assert.equal(CIE_D65.length, 81);
  assert.equal(CIE_WAVELENGTHS_NM[80], 780);
  const at = (nm: number) => CIE_WAVELENGTHS_NM.indexOf(nm);
  assert.equal(CIE_V_PHOTOPIC[at(555)], 1);
  assert.equal(CIE_V_PHOTOPIC[at(500)], 0.323);
  assert.equal(CIE_V_PHOTOPIC[at(650)], 0.107);
  assert.equal(CIE_D65[at(560)], 100);
  assert.equal(CIE_D65[at(380)], 49.9755);
  assert.equal(CIE_D65[at(780)], 63.3828);
  // ∫V dλ over 380–780 nm is 106.86 nm from the 1 nm table; the 5 nm sum agrees to 0.01 nm.
  const sum = CIE_V_PHOTOPIC.reduce((s, v) => s + 5 * v, 0);
  assert.ok(Math.abs(sum - 106.86) < 0.01, `ΣVΔλ = ${sum}`);
});

test("CIE: luminous mean", () => {
  assert.ok(Math.abs(luminousWeightedMean(() => 0.8) - 0.8) < 1e-15);
  // Weight below 555 nm, from the tables directly (half of 555 itself on each side is not used: strict step).
  let lo = 0, all = 0;
  CIE_WAVELENGTHS_NM.forEach((w, i) => {
    const x = CIE_D65[i] * CIE_V_PHOTOPIC[i];
    all += x;
    if (w < 555) lo += x;
  });
  assert.ok(Math.abs(luminousWeightedMean((lam) => (lam < 555e-9 ? 1 : 0)) - lo / all) < 1e-15);
  assert.ok(lo / all > 0.4 && lo / all < 0.5, `${lo / all}`);
});
