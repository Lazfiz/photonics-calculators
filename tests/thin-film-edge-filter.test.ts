import test from "node:test";
import assert from "node:assert/strict";

import {
  edgeDesignWavelength,
  edgeFilterLayers,
  halfTransmissionEdge,
  incoherentLosslessFaces,
  staggeredDesignWavelengths,
  symmetricPeriodLayers,
  type EdgeType,
} from "../src/physics/thin-film/edge-filter";
import { stopBandEdges } from "../src/physics/thin-film/quarter-wave-stack";
import { stackResponse, type Stack } from "../src/physics/thin-film/transfer-matrix";

const NM = 1e-9;
const nH = 2.35;
const nL = 1.45;
const nSub = 1.52;

function close(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

const edgeStack = (type: EdgeType, lambda0: number, periods: number): Stack => ({
  incident: 1,
  layers: edgeFilterLayers(type, lambda0, nH, nL, periods),
  substrate: { n: nSub },
});

test("edge filter: symmetric periods merge their half layers", () => {
  const l = edgeFilterLayers("long-pass", 1000 * NM, nH, nL, 3);
  assert.equal(l.length, 7); // 2N + 1
  assert.deepEqual(l.map((x) => x.n), [nH, nL, nH, nL, nH, nL, nH]);
  close(l[0].thickness, 1000 * NM / (8 * nH), 1e-18, "outer H/2");
  close(l[1].thickness, 1000 * NM / (4 * nL), 1e-18, "L");
  close(l[2].thickness, 1000 * NM / (4 * nH), 1e-18, "merged H/2 + H/2");
  close(l[6].thickness, l[0].thickness, 0, "symmetric");
  const s = edgeFilterLayers("short-pass", 1000 * NM, nH, nL, 2);
  assert.deepEqual(s.map((x) => x.n), [nL, nH, nL, nH, nL]);
  // Two stacks in series: the halves where they meet belong to different λ₀.
  const two = symmetricPeriodLayers("long-pass", [600 * NM, 800 * NM], nH, nL);
  close(two[2].thickness, (600 + 800) * NM / (8 * nH), 1e-18, "junction");
  assert.equal(edgeFilterLayers("long-pass", 1000 * NM, nH, nL, 0).length, 0);
  assert.ok(Number.isNaN(edgeFilterLayers("long-pass", -1, nH, nL, 1)[0].thickness), "λ₀ < 0");
});

// Macleod, Thin-Film Optical Filters, 4th ed., ch. 6/7: the zone spans g = λ₀/λ in 1 ± Δg, Δg = 0.1522248
// for 2.35/1.45 (hand value, tests/thin-film-quarter-wave-stack.test.ts). Long-pass λ₀ = λ_edge(1 − Δg).
test("edge filter: design wavelength puts the zone edge at λ_edge", () => {
  close(edgeDesignWavelength("long-pass", 1000 * NM, nH, nL) / NM, 847.7752, 1e-4, "long-pass λ₀");
  close(edgeDesignWavelength("short-pass", 1000 * NM, nH, nL) / NM, 1152.2248, 1e-4, "short-pass λ₀");
  close(stopBandEdges(edgeDesignWavelength("long-pass", 700 * NM, nH, nL), nH, nL).long / NM, 700, 1e-9, "round trip");
  assert.ok(Number.isNaN(edgeDesignWavelength("long-pass", 0, nH, nL)));
});

// Independent check (Herpin equivalent layer; Epstein 1952; Macleod ch. 7): N symmetric periods p/2 q p/2
// act as one layer of admittance E and phase Nγ, with φ = (π/2)λ₀/λ,
//   cos γ = cos²φ − ½(ρ + 1/ρ) sin²φ,  ρ = n_q/n_p,
//   E² = n_p² (cos φ + κ)/(cos φ − κ),  κ = (n_q − n_p)/(n_q + n_p),
// so between air and n_s: T = 4n_s / [(1 + n_s)² cos² Nγ + (n_s/E + E)² sin² Nγ] in the pass band.
function herpinT(type: EdgeType, lambda0: number, N: number, wavelength: number): number {
  const [np, nq] = type === "long-pass" ? [nH, nL] : [nL, nH];
  const phi = (Math.PI / 2) * (lambda0 / wavelength);
  const rho = nq / np;
  const cosG = Math.cos(phi) ** 2 - 0.5 * (rho + 1 / rho) * Math.sin(phi) ** 2;
  const kappa = (nq - np) / (nq + np);
  const E = np * Math.sqrt((Math.cos(phi) + kappa) / (Math.cos(phi) - kappa));
  const NG = N * Math.acos(cosG);
  return (4 * nSub) / ((1 + nSub) ** 2 * Math.cos(NG) ** 2 + (nSub / E + E) ** 2 * Math.sin(NG) ** 2);
}

test("edge filter: transfer matrix matches the equivalent layer in the pass band", () => {
  for (const [type, wl] of [["long-pass", 1300], ["long-pass", 1800], ["short-pass", 700], ["short-pass", 820]] as const) {
    close(stackResponse(edgeStack(type, 1000 * NM, 7), wl * NM).T, herpinT(type, 1000 * NM, 7, wl * NM), 1e-12, `${type} ${wl} nm`);
  }
});

// Golden values: 7 periods, λ₀ = 1000 nm, on glass in air. The session-25 physics-reviewer's own transfer
// matrix gave 1201.4 nm (long-pass) and 845.7 nm (short-pass). Here the equivalent layer is bisected
// independently; both lie outside the infinite-stack zone (867.9–1179.6 nm), toward the pass band.
test("edge filter: 50 % points of 7-period edge filters", () => {
  const bisect = (f: (x: number) => number, lo: number, hi: number) => {
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (f(lo) - 0.5 > 0 === f(mid) - 0.5 > 0) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const longEdge = halfTransmissionEdge(edgeStack("long-pass", 1000 * NM, 7), "long-pass", 1000 * NM);
  const shortEdge = halfTransmissionEdge(edgeStack("short-pass", 1000 * NM, 7), "short-pass", 1000 * NM);
  close(longEdge / NM, 1201.4, 0.05, "long-pass edge");
  close(shortEdge / NM, 845.7, 0.05, "short-pass edge");
  close(longEdge / NM, bisect((x) => herpinT("long-pass", 1000 * NM, 7, x * NM), 1185, 1215), 1e-6, "long vs Herpin");
  close(shortEdge / NM, bisect((x) => herpinT("short-pass", 1000 * NM, 7, x * NM), 830, 865), 1e-6, "short vs Herpin");
  // No zone: equal indices transmit at λ₀.
  const flat: Stack = { incident: 1, layers: edgeFilterLayers("long-pass", 1000 * NM, 1.5, 1.5, 7), substrate: { n: 1.5 } };
  assert.ok(Number.isNaN(halfTransmissionEdge(flat, "long-pass", 1000 * NM)));
  assert.ok(Number.isNaN(halfTransmissionEdge(edgeStack("long-pass", 1000 * NM, 7), "long-pass", 0)));
});

// Stacks in series: K = ⌈ln(λ_b/λ_a)/ln((1 + Δg)/(1 − Δg))⌉, λ₀ from λ_a(1 + Δg) to λ_b(1 − Δg).
// 400–700 nm: ln 1.75 / ln 1.359116 = 1.82 → 2 stacks at 460.8899 and 593.4426 nm.
test("edge filter: stacks in series cover a band", () => {
  const cold = staggeredDesignWavelengths("long-pass", 400 * NM, 700 * NM, nH, nL);
  assert.equal(cold.length, 2);
  close(cold[0] / NM, 700 * 0.8477752, 1e-3, "pass-side stack first (long-pass)");
  close(cold[1] / NM, 400 * 1.1522248, 1e-3, "second stack");
  const ir = staggeredDesignWavelengths("short-pass", 700 * NM, 1100 * NM, nH, nL);
  assert.deepEqual(ir.map((l) => Math.round(l / NM * 10) / 10), [806.6, 932.6]);
  // Wider band: ln(2000/720)/ln 1.359116 = 3.33 → 4 stacks, neighbours overlapping.
  const wide = staggeredDesignWavelengths("short-pass", 720 * NM, 2000 * NM, nH, nL);
  assert.equal(wide.length, 4);
  for (let k = 1; k < wide.length; k++) {
    assert.ok(stopBandEdges(wide[k - 1], nH, nL).long >= stopBandEdges(wide[k], nH, nL).short, `zones ${k - 1}, ${k} overlap`);
  }
  // A band narrower than one zone: one stack with its edge on the pass side.
  close(staggeredDesignWavelengths("long-pass", 600 * NM, 700 * NM, nH, nL)[0] / NM, 593.4426, 1e-3, "one stack");
  assert.deepEqual(staggeredDesignWavelengths("long-pass", 400 * NM, 700 * NM, 1.5, 1.5), []);
  // 10 periods each reflect > 99 % where the two zones overlap and at both zone centres.
  const stack: Stack = { incident: 1, layers: edgeFilterLayers("long-pass", cold, nH, nL, 10), substrate: { n: nSub } };
  assert.equal(stack.layers.length, 41);
  for (const wl of [460.9, 530, 593.4]) assert.ok(stackResponse(stack, wl * NM).R > 0.99, `R(${wl} nm)`);
});

// A non-absorbing slab with incoherent multiple reflections: T = (1 − R)²/(1 − R²) = 2n/(n² + 1)
// (Macleod ch. 2; Born & Wolf §7.6). n = 1.5: R = 0.04 per face, T = 3/3.25.
test("edge filter: incoherent sum of two faces", () => {
  const glass = incoherentLosslessFaces(0.04, 0.04);
  close(glass.T, 3 / 3.25, 1e-15, "bare glass");
  close(glass.R + glass.T, 1, 1e-15, "R + T");
  assert.equal(incoherentLosslessFaces(1, 0.3).T, 0);
  assert.ok(Number.isNaN(incoherentLosslessFaces(1, 1).T), "two perfect mirrors");
  assert.ok(Number.isNaN(incoherentLosslessFaces(-0.1, 0.2).T));
});
