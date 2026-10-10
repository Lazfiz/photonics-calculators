import test from "node:test";
import assert from "node:assert/strict";

import {
  nonOverlappingRatio,
  quarterWaveMirrorDelay,
  quarterWavePairsForReflectance,
  reflectionBandEdges,
  stopBandCentreAtAngle,
  stopBandEdges,
  stopBandHalfWidth,
} from "../src/physics/thin-film/quarter-wave-stack";
import { quarterWaveLayers, quarterWaveStackReflectance, reflectionGroupDelay, stackResponse, type Stack } from "../src/physics/thin-film/transfer-matrix";

const NM = 1e-9;

function close(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

/** (HL)^N H quarter-wave stack at λ₀ on n_sub = 1.52 in air. */
function hlStack(lambda0: number, pairs: number, nH = 2.35, nL = 1.45): Stack {
  const indices: number[] = [];
  for (let i = 0; i < pairs; i++) indices.push(nH, nL);
  indices.push(nH);
  return { incident: 1, layers: quarterWaveLayers(indices, lambda0), substrate: { n: 1.52 } };
}

// Macleod, Thin-Film Optical Filters, 4th ed., ch. 6: Δg = (2/π) asin((n_H − n_L)/(n_H + n_L)).
// Hand value for 2.35/1.45: asin(0.9/3.8) = asin(0.2368421) → Δg = 0.1522248.
test("quarter-wave stack: zone half-width and edges", () => {
  close(stopBandHalfWidth(2.35, 1.45), 0.1522248, 1e-7, "Δg");
  close(stopBandHalfWidth(1.45, 2.35), stopBandHalfWidth(2.35, 1.45), 0, "symmetric in n_H, n_L");
  const e = stopBandEdges(500 * NM, 2.35, 1.45);
  close(e.short / NM, 500 / 1.1522248, 1e-4, "short edge"); // 433.9431 nm
  close(e.long / NM, 500 / 0.8477752, 1e-4, "long edge"); // 589.7790 nm
  close(nonOverlappingRatio(2.35, 1.45), 1.1522248 / 0.8477752, 1e-6, "λ₂/λ₁"); // 1.359116
  // Edge cases: equal indices have no zone; invalid indices are NaN.
  assert.equal(stopBandHalfWidth(1.5, 1.5), 0);
  assert.ok(Number.isNaN(stopBandHalfWidth(0, 1.45)), "n_H = 0");
  assert.ok(Number.isNaN(stopBandEdges(0, 2.35, 1.45).long), "λ₀ = 0");
});

// Independent check (Born & Wolf, 7th ed., §1.6.5): for an infinite periodic medium the zone edges are
// where the period's half-trace is −1. For two layers of equal phase δ = (π/2) g:
// ½ tr M = cos² δ − ½ (ρ + 1/ρ) sin² δ, ρ = n_H/n_L. A finite stack then reflects strongly inside the
// zone and less just outside it.
test("quarter-wave stack: edges are where the period's half-trace is −1", () => {
  const nH = 2.35;
  const nL = 1.45;
  const rho = nH / nL;
  const halfTrace = (g: number) => {
    const d = (Math.PI / 2) * g;
    return Math.cos(d) ** 2 - 0.5 * (rho + 1 / rho) * Math.sin(d) ** 2;
  };
  const dg = stopBandHalfWidth(nH, nL);
  close(halfTrace(1 + dg), -1, 1e-12, "upper edge");
  close(halfTrace(1 - dg), -1, 1e-12, "lower edge");
  assert.ok(halfTrace(1) < -1, "centre lies inside the zone");

  const stack = hlStack(500 * NM, 25);
  for (const sign of [1, -1]) {
    const inside = stackResponse(stack, (500 * NM) / (1 + sign * 0.9 * dg)).R;
    const outside = stackResponse(stack, (500 * NM) / (1 + sign * 1.1 * dg)).R;
    assert.ok(inside > 0.9999, `R inside the zone (${sign}): ${inside}`);
    assert.ok(outside < 0.6, `R outside the zone (${sign}): ${outside}`);
  }
});

// Macleod, ch. 2: phase thickness 2πNd cos θ/λ. Hand value at 45° in air for 2.35/1.45:
// cos θ_H = √(1 − 0.5/5.5225) = 0.9536567, cos θ_L = √(1 − 0.5/2.1025) = 0.8730340,
// λ_c = 550 × (0.9536567 + 0.8730340)/2 = 502.3399 nm.
test("quarter-wave stack: zone centre at oblique incidence", () => {
  const c = stopBandCentreAtAngle(550 * NM, 2.35, 1.45, Math.PI / 4);
  close(c / NM, 502.3399, 1e-3, "λ_c(45°)");
  close(stopBandCentreAtAngle(550 * NM, 2.35, 1.45, 0) / NM, 550, 1e-9, "normal incidence");
  // The transfer matrix reflects strongly at the predicted centre for both polarizations.
  const stack = hlStack(550 * NM, 25);
  for (const pol of ["s", "p"] as const) {
    const R = stackResponse(stack, c, Math.PI / 4, pol).R;
    assert.ok(R > 0.9999, `R_${pol} at λ_c: ${R}`);
  }
  // Edge cases: light evanescent in the L layer (n₀ sin θ₀ ≥ n_L), and grazing incidence.
  assert.ok(Number.isNaN(stopBandCentreAtAngle(550 * NM, 2.35, 1.45, Math.PI / 3, 2)), "evanescent");
  assert.ok(Number.isNaN(stopBandCentreAtAngle(550 * NM, 2.35, 1.45, Math.PI / 2)), "90°");
});

/** (LH)^N quarter-wave stack (low index outermost, H on the substrate). */
function lhStack(lambda0: number, pairs: number, incident = 1, nH = 2.35, nL = 1.45): Stack {
  const indices: number[] = [];
  for (let i = 0; i < pairs; i++) indices.push(nL, nH);
  return { incident, layers: quarterWaveLayers(indices, lambda0), substrate: { n: 1.52 } };
}

test("reflection band edges: first 50 % points around λ₀, symmetric in g, side lobes ignored", () => {
  const lambda0 = 1064 * NM;
  const stack = lhStack(lambda0, 10);
  const dg = stopBandHalfWidth(2.35, 1.45);
  const { short, long } = reflectionBandEdges(stack, lambda0, 0.5, 2 * dg);
  // The thin-film audit (session 25) found 383 nm by dense sampling; the page had 502 nm (side lobes counted).
  close((long - short) / NM, 383.08, 0.01, "50 % width, (LH)^10 at 1064 nm");
  close(stackResponse(stack, short).R, 0.5, 1e-9, "R(short)");
  close(stackResponse(stack, long).R, 0.5, 1e-9, "R(long)");
  close(lambda0 / short + lambda0 / long, 2, 1e-12, "g_short + g_long");
  // Wider than the infinite stack's zone λ₀/(1 ± Δg), and it narrows toward the zone with more periods.
  const zone = stopBandEdges(lambda0, 2.35, 1.45);
  assert.ok(short < zone.short && long > zone.long);
  const many = reflectionBandEdges(lhStack(lambda0, 40), lambda0, 0.5, 2 * dg);
  assert.ok(many.long - many.short < long - short && many.long - many.short > zone.long - zone.short);
  // No band: one low-contrast pair never reaches 50 %.
  const weak = reflectionBandEdges(lhStack(lambda0, 1, 1, 1.6, 1.5), lambda0, 0.5, 0.5);
  assert.ok(Number.isNaN(weak.short) && Number.isNaN(weak.long));
});

// Hand derivation in quarterWaveMirrorDelay (first-order admittance recursion): for the semi-infinite
// stack τ = λ₀n₀/(2cΔn) with H outermost and λ₀n_Hn_L/(2cn₀Δn) with L outermost. 1064 nm, 2.35/1.45 from
// air: 1.97173 fs and 6.71869 fs. The thin-film audit (session 25) had 6.718 fs from arg r of (LH)^10.
test("mirror group delay: arg r slope of a 25-period stack matches the semi-infinite closed form", () => {
  const lambda0 = 1064 * NM;
  close(quarterWaveMirrorDelay(lambda0, 2.35, 1.45, 1, "high") * 1e15, 1.97173, 1e-5, "closed form, H outer");
  close(quarterWaveMirrorDelay(lambda0, 2.35, 1.45, 1, "low") * 1e15, 6.71869, 1e-5, "closed form, L outer");
  for (const n0 of [1, 1.33]) {
    const high = reflectionGroupDelay({ ...hlStack(lambda0, 25), incident: n0 }, lambda0);
    const low = reflectionGroupDelay(lhStack(lambda0, 25, n0), lambda0);
    const tauHigh = quarterWaveMirrorDelay(lambda0, 2.35, 1.45, n0, "high");
    const tauLow = quarterWaveMirrorDelay(lambda0, 2.35, 1.45, n0, "low");
    close(high.groupDelay / tauHigh, 1, 1e-6, `H outer, n₀ = ${n0}`);
    close(low.groupDelay / tauLow, 1, 1e-6, `L outer, n₀ = ${n0}`);
    // arg r is odd in g − 1 about λ₀ for a quarter-wave stack, so the GDD vanishes there.
    assert.ok(Math.abs(high.gdd) < 1e-40 && Math.abs(low.gdd) < 1e-40, `GDD: ${high.gdd}, ${low.gdd}`);
  }
  // 10 periods: 1.07e-4 below the limit, as (n_L/n_H)^20 = 6.4e-5 times a factor of order 1.
  const ten = reflectionGroupDelay(lhStack(lambda0, 10), lambda0).groupDelay;
  close(ten * 1e15, 6.718, 5e-4, "(LH)^10, the audit's value");
  // Outside the zone's centre the delay grows toward the edges, with GDD of opposite signs.
  const blue = reflectionGroupDelay(lhStack(lambda0, 10), 950 * NM);
  const red = reflectionGroupDelay(lhStack(lambda0, 10), 1200 * NM);
  assert.ok(blue.groupDelay > ten && red.groupDelay > ten && blue.gdd > 0 && red.gdd < 0);
  assert.ok(Number.isNaN(quarterWaveMirrorDelay(lambda0, 1.45, 2.35, 1, "high")), "n_H < n_L");
});

// Low-contrast notch, 1.63/1.46 from air on 1.52. By hand: OD 3 is R = 0.999, atanh √0.999 = 4.14684,
// ½ ln 1.52 = 0.209350, ln(1.63/1.46) = 0.110143, so N ≥ (4.14684 − 0.20935)/0.110143 = 35.75 → 36.
test("pairs for a reflectance: tanh² closed form, checked against the admittance recursion", () => {
  const pairsR = (N: number) => {
    const indices: number[] = [];
    for (let i = 0; i < N; i++) indices.push(1.63, 1.46);
    return quarterWaveStackReflectance(1, indices, 1.52);
  };
  assert.equal(quarterWavePairsForReflectance(0.999, 1.63, 1.46, 1, 1.52), 36);
  assert.ok(pairsR(36) >= 0.999 && pairsR(35) < 0.999, `${pairsR(35)}, ${pairsR(36)}`);
  // R = tanh²(N ln(n_H/n_L) + ½ ln(n_s/n₀)) at N = 40: the session-25 audit's tanh² form.
  close(pairsR(40), Math.tanh(40 * Math.log(1.63 / 1.46) + 0.5 * Math.log(1.52)) ** 2, 1e-15, "tanh² at N = 40");
  for (const od of [2, 4, 6]) {
    const N = quarterWavePairsForReflectance(1 - 10 ** -od, 1.63, 1.46, 1, 1.52);
    assert.ok(pairsR(N) >= 1 - 10 ** -od && pairsR(N - 1) < 1 - 10 ** -od, `OD ${od}: N = ${N}`);
  }
  assert.equal(quarterWavePairsForReflectance(0, 1.63, 1.46, 1, 1.52), 0);
  assert.ok(Number.isNaN(quarterWavePairsForReflectance(0.9, 1.46, 1.63, 1, 1.52)));
  assert.ok(Number.isNaN(quarterWavePairsForReflectance(1, 1.63, 1.46, 1, 1.52)));
});
