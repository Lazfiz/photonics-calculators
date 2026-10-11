import test from "node:test";
import assert from "node:assert/strict";

import {
  CIE_X_BAR, CIE_Z_BAR, chromaticity, colourWeights, cssRgb, srgbEncode, srgbFromXyz, xyzFromSamples,
} from "../src/physics/cie-colour";
import { CIE_V_PHOTOPIC, CIE_WAVELENGTHS_NM } from "../src/physics/cie-photometry";

const ones = CIE_WAVELENGTHS_NM.map(() => 1);

test("CIE colour: the 1931 CMF table (CIE 2019 dataset, doi:10.25039/CIE.DS.xvudnb9b)", () => {
  assert.equal(CIE_X_BAR.length, 81);
  assert.equal(CIE_Z_BAR.length, 81);
  // Spot values: x̄(600 nm) = 1.0622 (its peak at 5 nm), z̄(445 nm) = 1.7826, x̄(380 nm) = 0.001368.
  assert.equal(CIE_X_BAR[CIE_WAVELENGTHS_NM.indexOf(600)], 1.0622);
  assert.equal(CIE_Z_BAR[CIE_WAVELENGTHS_NM.indexOf(445)], 1.7826);
  assert.equal(CIE_X_BAR[0], 0.001368);
  // ȳ = V(λ): ȳ(555) = 1.
  assert.equal(CIE_V_PHOTOPIC[CIE_WAVELENGTHS_NM.indexOf(555)], 1);
});

test("CIE colour: white points of illuminants E and D65 (CIE 15:2018: D65 x = 0.31272, y = 0.32903)", () => {
  // Equal-energy E: the CMFs have equal areas, so x = y = 1/3 (to the 5 nm sampling).
  const [xe, ye] = chromaticity(xyzFromSamples(ones, colourWeights(ones)));
  assert.ok(Math.abs(xe - 1 / 3) < 2e-4 && Math.abs(ye - 1 / 3) < 2e-4, `E: ${xe}, ${ye}`);
  const XYZ = xyzFromSamples(ones);
  assert.ok(Math.abs(XYZ[1] - 1) < 1e-12, "clear sample Y = 1");
  const [x, y] = chromaticity(XYZ);
  assert.ok(Math.abs(x - 0.31272) < 1e-4 && Math.abs(y - 0.32903) < 1e-4, `D65: ${x}, ${y}`);
});

test("CIE colour: sRGB (IEC 61966-2-1) of D65 white is white and of black is black", () => {
  const rgb = srgbFromXyz(xyzFromSamples(ones));
  for (const c of rgb) assert.ok(Math.abs(c - 1) < 2e-3, `white ${rgb}`);
  assert.deepEqual(srgbFromXyz([0, 0, 0]), [0, 0, 0]);
  // Transfer function: both branches meet at 0.0031308 → 0.04045; 18 % grey → 0.4614.
  assert.ok(Math.abs(srgbEncode(0.0031308) - 0.04045) < 1e-5);
  assert.ok(Math.abs(srgbEncode(0.18) - 0.461356) < 1e-6);
  assert.equal(cssRgb([1, 0.5, 0]), "rgb(255, 128, 0)");
  assert.ok(Number.isNaN(chromaticity([0, 0, 0])[0]));
});
