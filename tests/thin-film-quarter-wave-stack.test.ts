import test from "node:test";
import assert from "node:assert/strict";

import {
  nonOverlappingRatio,
  stopBandCentreAtAngle,
  stopBandEdges,
  stopBandHalfWidth,
} from "../src/physics/thin-film/quarter-wave-stack";
import { quarterWaveLayers, stackResponse, type Stack } from "../src/physics/thin-film/transfer-matrix";

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
