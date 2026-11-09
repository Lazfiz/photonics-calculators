// Moved page logic for the 11c-7d schemas: wide-bandpass, wavelength-separation, solar-protection.
// Expected values come from an independent 2×2 characteristic-matrix program (Macleod, Thin-Film Optical
// Filters, 4th ed., ch. 2) written outside the repo, or from closed forms worked in the comments.
import assert from "node:assert/strict";
import { test } from "node:test";

import { bareGlassTransmittance, solarProtectionDesign, solarProtectionMeans, thirdOrderZones } from "../src/physics/thin-film/solar-protection";
import { wavelengthSeparationSummary } from "../src/physics/thin-film/wavelength-separation";
import { wideBandpassDesign, wideBandpassPassBand } from "../src/physics/thin-film/wide-bandpass";

const NM = 1e-9;
const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

test("wide bandpass: nH 2.35, nL 1.45, glass 1.52, 500–700 nm, N = 8", () => {
  // Δg = (2/π) asin(0.9/3.8); λ₀ = 500(1 − Δg), 700(1 + Δg); T = T₁T₂/(1 − R₁R₂); 50 % points by 4000-step scan + bisection.
  const d = wideBandpassDesign({ nH: 2.35, nL: 1.45, nSub: 1.52, cutOn: 500 * NM, cutOff: 700 * NM, periods: 8 });
  assert.equal(d.valid, true);
  close(d.lpLambda0 / NM, 423.887591731269);
  close(d.spLambda0 / NM, 806.5573715762234);
  const p = wideBandpassPassBand(d);
  close(p.on / NM, 509.1545624410828);
  close(p.off / NM, 684.505636983032);
  close(p.pass.max, 0.9434579984343093);
  close(p.pass.mean, 0.8602068600472662);
});

test("wide bandpass: nH ≤ nL or edges in the wrong order gives NaN, no throw", () => {
  const bad = wideBandpassDesign({ nH: 1.4, nL: 1.45, nSub: 1.52, cutOn: 500 * NM, cutOff: 700 * NM, periods: 8 });
  assert.equal(bad.valid, false);
  assert.ok(Number.isNaN(wideBandpassPassBand(bad).on));
  const swapped = wideBandpassDesign({ nH: 2.35, nL: 1.45, nSub: 1.52, cutOn: 700 * NM, cutOff: 500 * NM, periods: 8 });
  assert.equal(swapped.valid, false);
});

test("wavelength separation: closed-form R(λ₁) of (HL)^N and the zone limit", () => {
  // Y = (nH/nL)^(2N) nSub, R = ((1 − Y)/(1 + Y))²; N = 5: 0.9791714422888022. minRatio = (1 + Δg)/(1 − Δg).
  const s = wavelengthSeparationSummary({ nH: 2.35, nL: 1.45, nSub: 1.52, nInc: 1, pairs: 5, lambda1: 550 * NM, lambda2: 770 * NM });
  const Y = (2.35 / 1.45) ** 10 * 1.52;
  close(s.RA1, ((1 - Y) / (1 + Y)) ** 2, 1e-12);
  close(s.RA1, 0.9791714422888022);
  close(s.TA2, 0.7182599496175187);
  close(s.minRatio, 1.3591160003427691);
  assert.equal(s.overlap, false);
  assert.equal(s.layerCount, 20);
  // λ₂/λ₁ = 1.3 < 1.3591: the zones overlap.
  assert.equal(
    wavelengthSeparationSummary({ nH: 2.35, nL: 1.45, nSub: 1.52, nInc: 1, pairs: 5, lambda1: 550 * NM, lambda2: 715 * NM }).overlap,
    true,
  );
  // No index contrast: the ratio limit is 1 and nothing overlaps.
  assert.equal(wavelengthSeparationSummary({ nH: 1.5, nL: 1.5, nSub: 1.5, nInc: 1, pairs: 3, lambda1: 550 * NM, lambda2: 770 * NM }).overlap, false);
});

test("solar protection: design wavelengths, bare glass, third-order zones, means", () => {
  const d = solarProtectionDesign({
    nH: 2.35, nL: 1.45, nSub: 1.52,
    uvFrom: 300 * NM, uvTo: 400 * NM, irFrom: 720 * NM, irTo: 1300 * NM, uvPairs: 8, irPairs: 10,
  });
  // UV: one stack, λ₀ = 400(1 − Δg) = 339.11007 nm; IR: K = 2 stacks at 829.60187 and 1102.10774 nm (short-pass, ascending).
  assert.equal(d.ready, true);
  assert.deepEqual([d.uvCentres.length, d.irCentres.length], [1, 2]);
  close(d.uvCentres[0] / NM, 339.1100733850152);
  close(d.irCentres[0] / NM, 829.6018679069726);
  close(d.irCentres[1] / NM, 1102.1077385012993);
  close(d.transmittance(550 * NM), d.transmittance(550 * NM), 1e-15);
  // 2n/(n² + 1) = 3.04/3.3104 for n = 1.52.
  close(bareGlassTransmittance(1.52), 3.04 / 3.3104, 1e-12);
  // λ₀ = 1000 nm: 1000/(3 + Δg) and 1000/(3 − Δg) with Δg = 0.15222481653746195.
  const [z] = thirdOrderZones([1000 * NM], 2.35, 1.45);
  close(z.from / NM, 317.23625635891113);
  close(z.to / NM, 351.15131482539476);
  // Means with a stand-in weighting: the function is called over each band and the total.
  const calls: [number | undefined, number | undefined][] = [];
  const m = solarProtectionMeans(() => 0.5, (_f, from, to) => (calls.push([from, to]), (from ?? 0) + (to ?? 0)));
  assert.deepEqual(calls, [[undefined, undefined], [280, 400], [400, 700], [700, 4000]]);
  assert.deepEqual([m.uv, m.vis, m.nir], [680, 1100, 4700]);
});

test("solar protection: invalid or too large a design is not ready", () => {
  const base = { nH: 2.35, nL: 1.45, nSub: 1.52, uvFrom: 300 * NM, uvTo: 400 * NM, irFrom: 720 * NM, irTo: 1300 * NM };
  assert.equal(solarProtectionDesign({ ...base, nH: 1.4, uvPairs: 8, irPairs: 10 }).valid, false);
  const big = solarProtectionDesign({ ...base, uvPairs: 40, irPairs: 40 }); // 3 stacks × 40 = 120 periods: fine
  assert.equal(big.tooBig, false);
  assert.equal(solarProtectionDesign({ ...base, uvFrom: 200 * NM, uvTo: 4000 * NM, irFrom: 200 * NM, irTo: 4000 * NM, uvPairs: 40, irPairs: 40 }).tooBig, true);
});
