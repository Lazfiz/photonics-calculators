import test from "node:test";
import assert from "node:assert/strict";

import { chromaticity, xyzFromSamples } from "../src/physics/cie-colour";
import { CIE_WAVELENGTHS_NM } from "../src/physics/cie-photometry";
import { abs2 } from "../src/physics/complex";
import { apply, chainMatrix, linearPolarizer, linearRetarder, linearState } from "../src/physics/polarization/jones";
import {
  analyzerOfMinimum, chainTransmissionSlope, interferenceXyz, michelLevyColour, polariscopeTransmission, retarderChainColour,
  retarderChainAveraged, retarderChainTransmission, senarmontRetardance,
} from "../src/physics/polarization/interference-colours";
import { applyMueller, chainMueller, muellerRetarder } from "../src/physics/polarization/mueller";

const deg = Math.PI / 180;
const white = xyzFromSamples(CIE_WAVELENGTHS_NM.map(() => 1));

test("Interference colours: the polariscope formula equals the Jones chain (Born & Wolf ch. 15)", () => {
  for (const [P, phi, A, G] of [[0, 45, 90, 1.3], [10, 33, 70, 2.9], [-20, 80, 15, 5.1], [0, 0, 90, 2]]) {
    const E = apply(chainMatrix([linearRetarder(G, phi * deg), linearPolarizer(A * deg)]), linearState(P * deg));
    const jones = abs2(E[0]) + abs2(E[1]);
    assert.ok(Math.abs(polariscopeTransmission(P * deg, phi * deg, A * deg, G) - jones) < 1e-14, `${P},${phi},${A}`);
  }
  // Plate on a polarizer axis: extinction stays at any retardance.
  assert.ok(Math.abs(polariscopeTransmission(0, 0, Math.PI / 2, 2)) < 1e-15);
});

test("Interference colours: zero retardance, complementary colours and high-order white (Sørensen 2013)", () => {
  for (const c of michelLevyColour(0)) assert.ok(c < 1e-12, "crossed polars, no plate: black");
  for (const c of michelLevyColour(0, "parallel")) assert.ok(Math.abs(c - 1) < 2e-3);
  // Crossed + parallel = the clear sample, at any retardance (the two colours are complementary).
  for (const R of [280e-9, 550e-9, 1234e-9]) {
    const cr = interferenceXyz(() => R, 0, Math.PI / 4, Math.PI / 2);
    const pa = interferenceXyz(() => R, 0, Math.PI / 4, 0);
    for (let i = 0; i < 3; i++) assert.ok(Math.abs(cr[i] + pa[i] - white[i]) < 1e-12);
  }
  // High-order white: 50 µm (≈ 90 orders) has half the light at the D65 chromaticity (0.3127, 0.3290).
  const hi = interferenceXyz(() => 50e-6, 0, Math.PI / 4, Math.PI / 2);
  const [x, y] = chromaticity(hi);
  assert.ok(Math.abs(hi[1] - 0.5) < 0.01 && Math.abs(x - 0.3127) < 0.002 && Math.abs(y - 0.329) < 0.002, `${x}, ${y}`);
});

test("Interference colours: first-order red at R = 550 nm and first-order white near 280 nm", () => {
  // 550 nm: green is extinguished (sin²(π·550/550) = 0), red and blue pass, i.e. the magenta 'sensitive tint'.
  const [r, g, b] = michelLevyColour(550e-9);
  assert.ok(g < 0.01 && r > 0.3 && b > 0.5, `${r}, ${g}, ${b}`);
  // ~280 nm: the brightest first-order colour, Y > 0.95 of the clear sample.
  assert.ok(interferenceXyz(() => 280e-9, 0, Math.PI / 4, Math.PI / 2)[1] > 0.95);
});

test("Interference colours: retarder chain against the Mueller chain and the one-plate formula", () => {
  // One plate: the chain equals polariscopeTransmission.
  for (const [P, phi, A, G] of [[0, 45, 90, 1.3], [10, 33, 70, 2.9], [-20, 80, 15, 5.1]]) {
    const chain = retarderChainTransmission(P * deg, A * deg, [{ gamma: G, axis: phi * deg }]);
    assert.ok(Math.abs(chain - polariscopeTransmission(P * deg, phi * deg, A * deg, G)) < 1e-14);
  }
  // Two plates against mueller.ts: polarizer 20°, plates (1.1 rad, 10°) and (2.3 rad, 70°), analyzer 100°.
  const M = chainMueller([muellerRetarder(1.1, 10 * deg), muellerRetarder(2.3, 70 * deg)]);
  const S = applyMueller(M, [1, Math.cos(40 * deg), Math.sin(40 * deg), 0]);
  const expected = 0.5 * (S[0] + S[1] * Math.cos(200 * deg) + S[2] * Math.sin(200 * deg));
  const got = retarderChainTransmission(20 * deg, 100 * deg, [{ gamma: 1.1, axis: 10 * deg }, { gamma: 2.3, axis: 70 * deg }]);
  assert.ok(Math.abs(got - expected) < 1e-14);
  // Two quarter waves with parallel axes add to a half wave: crossed polars at 45° pass everything.
  const q = { gamma: Math.PI / 2, axis: Math.PI / 4 };
  assert.ok(Math.abs(retarderChainTransmission(0, Math.PI / 2, [q, q]) - 1) < 1e-15);
  // Slope: d/dΓ sin²(Γ/2) = ½ sin Γ.
  assert.ok(Math.abs(chainTransmissionSlope(0, Math.PI / 2, [{ gamma: 1, axis: Math.PI / 4 }], 0) - 0.5 * Math.sin(1)) < 1e-9);
});

test("Interference colours: the chain colour of one plate matches the single-plate colour", () => {
  // Thin plates take 1–4 midpoint samples per bin, thick ones 5; both stay within 2e-4 of the exact bin average.
  for (const R of [100e-9, 280e-9, 550e-9, 900e-9, 1650e-9, 8e-6, 30e-6]) {
    const one = michelLevyColour(R);
    const chain = retarderChainColour(0, Math.PI / 2, [{ R: () => R, axis: Math.PI / 4 }]);
    for (let i = 0; i < 3; i++) assert.ok(Math.abs(one[i] - chain[i]) < 2e-4, `${R}: ${one} vs ${chain}`);
  }
  // Subtraction: a 550 nm sample crossed with a 550 nm plate cancels to black.
  const dark = retarderChainColour(0, Math.PI / 2, [{ R: () => 550e-9, axis: Math.PI / 4 }, { R: () => 550e-9, axis: -Math.PI / 4 }]);
  for (const c of dark) assert.ok(c < 1e-6);
});

test("Interference colours: a red plate adds to a parallel section and subtracts from a crossed one", () => {
  // Crossed polars, 550 nm red plate at +45°: a 100 nm section with its slow axis parallel gives the colour of
  // 650 nm, crossed (135°) that of 450 nm (two retarders on the same axis add; Sørensen 2013 chart).
  const plate = { R: () => 550e-9, axis: 45 * deg };
  const add = retarderChainColour(0, 90 * deg, [{ R: () => 100e-9, axis: 45 * deg }, plate]);
  const sub = retarderChainColour(0, 90 * deg, [{ R: () => 100e-9, axis: 135 * deg }, plate]);
  const ml650 = michelLevyColour(650e-9), ml450 = michelLevyColour(450e-9);
  for (let c = 0; c < 3; c++) {
    assert.ok(Math.abs(add[c] - ml650[c]) < 1e-3, `add ${add} vs ${ml650}`);
    assert.ok(Math.abs(sub[c] - ml450[c]) < 1e-3, `sub ${sub} vs ${ml450}`);
  }
});

test("Interference colours: Sénarmont — the analyzer minimum turns by Γ/2, so R = λΔθ/180°", () => {
  // P = 0, sample slow axis 45°, R = 100 nm at 546 nm: Γ/2 = 180° × 100/546 = 32.967°, so the minimum is at 122.967°
  // (Sénarmont; Born & Wolf ch. 15 for the retarder algebra). Checked against a 0.001° scan of T(A).
  const lambda = 546e-9;
  const chain = (Rs: number, phi: number, P: number) => [{ gamma: (2 * Math.PI * Rs) / lambda, axis: phi }, { gamma: Math.PI / 2, axis: P }];
  const m = analyzerOfMinimum(0, chain(100e-9, 45 * deg, 0));
  assert.ok(Math.abs(m.A / deg - 122.967) < 1e-3 && m.T < 1e-12, `A ${m.A / deg}, T ${m.T}`);
  let best = 0, tBest = Infinity;
  for (let i = 0; i < 18000; i++) {
    const t = retarderChainTransmission(0, i * 0.01 * deg, chain(100e-9, 45 * deg, 0));
    if (t < tBest) { tBest = t; best = i * 0.01; }
  }
  assert.ok(Math.abs(best - m.A / deg) <= 0.01, `scan ${best}`);
  assert.ok(Math.abs(senarmontRetardance(0, 45 * deg, m.A, lambda) - 100e-9) < 1e-15);
  // Slow axis at P + 135° turns the analyzer the other way; P = 30° shifts everything; R up to just below λ.
  const m135 = analyzerOfMinimum(0, chain(100e-9, 135 * deg, 0));
  assert.ok(Math.abs(m135.A / deg - 57.033) < 1e-3);
  assert.ok(Math.abs(senarmontRetardance(0, 135 * deg, m135.A, lambda) - 100e-9) < 1e-15);
  const m30 = analyzerOfMinimum(30 * deg, chain(500e-9, 75 * deg, 30 * deg));
  assert.ok(Math.abs(senarmontRetardance(30 * deg, 75 * deg, m30.A, lambda) - 500e-9) < 1e-15);
  // Not a Sénarmont setting (axis at 20° from P): NaN, and the minimum is no longer an extinction.
  const m20 = analyzerOfMinimum(0, chain(100e-9, 20 * deg, 0));
  assert.ok(Number.isNaN(senarmontRetardance(0, 20 * deg, m20.A, lambda)) && m20.T > 0.02);
  // Circular output (λ/4 sample at 45°, no compensator) has no minimum.
  assert.ok(Number.isNaN(analyzerOfMinimum(0, [{ gamma: Math.PI / 2, axis: 45 * deg }]).A));
});

test("retarderChainAveraged: visibility 1 is the plain transmission, 0 the fringe mean (Born & Wolf 15.3: T = a + b cos Γ)", () => {
  const chain = [{ gamma: 1.1, axis: Math.PI / 4 }];
  const T = retarderChainTransmission(0, Math.PI / 2, chain);
  assert.equal(retarderChainAveraged(0, Math.PI / 2, chain, 1), T);
  // crossed polars, plate at 45°: T = sin²(Γ/2), mean over Γ = 1/2
  assert.ok(Math.abs(retarderChainAveraged(0, Math.PI / 2, chain, 0) - 0.5) < 1e-12);
  assert.ok(Math.abs(retarderChainAveraged(0, Math.PI / 2, chain, 0.5) - (0.5 + 0.5 * (T - 0.5))) < 1e-12);
});
