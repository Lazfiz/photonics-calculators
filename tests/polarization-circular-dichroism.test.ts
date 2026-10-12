import test from "node:test";
import assert from "node:assert/strict";

import {
  CD_OPTIMUM_ABSORBANCE, DELTA_EPS_CONV_PER_SI, MOLAR_ELLIPTICITY_CONV_PER_SI, deltaEpsilon, dissymmetryFactor,
  ellipticity, ellipticityLinear, meanResidueEllipticity, molarEllipticity, relativeCdSnr,
} from "../src/physics/polarization/circular-dichroism";

const deg = 180 / Math.PI;

test("CD: Greenfield (2006) conversions, θ(mdeg) = 32 980 ΔA and [θ] = 3298.2 Δε", () => {
  assert.ok(Math.abs(ellipticityLinear(1, 0) * deg * 1e3 - 32982) < 1, "mdeg per unit ΔA");
  // Δε = 1 M⁻¹cm⁻¹ = 0.1 m²/mol → [θ] = 3298.2 deg·cm²·dmol⁻¹.
  const theta = molarEllipticity(1 / DELTA_EPS_CONV_PER_SI) * MOLAR_ELLIPTICITY_CONV_PER_SI;
  assert.ok(Math.abs(theta - 3298.2) < 0.05, `[θ] ${theta}`);
  // ΔA = 0.1 at 1 mM (1 mol/m³) in 1 cm: Δε = 0.1/(0.001 M · 1 cm) = 100 M⁻¹cm⁻¹, i.e. 10 m²/mol.
  assert.ok(Math.abs(deltaEpsilon(0.5, 0.4, 1, 0.01) * DELTA_EPS_CONV_PER_SI - 100) < 1e-9);
  // 200 residues: [θ]_MRW = [θ]/199.
  assert.equal(meanResidueEllipticity(199, 200), 1);
  assert.ok(Number.isNaN(meanResidueEllipticity(1, 1)) && Number.isNaN(deltaEpsilon(1, 0, 0, 1)));
});

test("CD: exact ellipticity from the field amplitudes, and the dissymmetry factor", () => {
  // Hand calculation: E = 10^(−A/2); tan θ = (E_R − E_L)/(E_R + E_L) for A_L = 0.6, A_R = 0.5.
  const ER = 10 ** -0.25, EL = 10 ** -0.3;
  assert.ok(Math.abs(ellipticity(0.6, 0.5) - Math.atan((ER - EL) / (ER + EL))) < 1e-15);
  // The small-angle form is 0.22 % high at ΔA = 0.1 (tanh and atan each lose x²/3 with x = 0.0576).
  assert.ok(Math.abs(ellipticityLinear(0.6, 0.5) / ellipticity(0.6, 0.5) - (1 + (2 / 3) * (Math.LN10 / 40) ** 2)) < 1e-5);
  assert.ok(Math.abs(dissymmetryFactor(0.5, 0.4) - 0.2 / 0.9) < 1e-15);
  assert.ok(Number.isNaN(dissymmetryFactor(0, 0)));
});

test("CD: shot-noise optimum at A = 2/ln 10 = 0.8686", () => {
  assert.ok(Math.abs(CD_OPTIMUM_ABSORBANCE - 0.868589) < 1e-6);
  assert.ok(Math.abs(relativeCdSnr(CD_OPTIMUM_ABSORBANCE) - 1) < 1e-15);
  // In units x = A/A_opt the curve is x·e^(1−x): A = 2 gives 0.6260.
  const x = 2 / CD_OPTIMUM_ABSORBANCE;
  assert.ok(Math.abs(relativeCdSnr(2) - x * Math.exp(1 - x)) < 1e-12);
  assert.ok(relativeCdSnr(0.8) < 1 && relativeCdSnr(0.95) < 1);
  assert.equal(relativeCdSnr(0), 0);
});
