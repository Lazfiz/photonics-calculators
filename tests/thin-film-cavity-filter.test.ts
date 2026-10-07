import test from "node:test";
import assert from "node:assert/strict";

import { cavityFilterLayers, type CavityFilterDesign } from "../src/physics/thin-film/cavity-filter";
import { stackResponse, type Stack } from "../src/physics/thin-film/transfer-matrix";

const NM = 1e-9;
const nSub = 1.52;
const lambda0 = 1550 * NM;

function close(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

const design = (over: Partial<CavityFilterDesign>): CavityFilterDesign => ({
  nH: 2.35, nL: 1.45, nSpacer: 2.1, mirrorPairs: 3, cavities: 1, spacerQuarterWaves: 2, lambda0, ...over,
});
const R = (d: CavityFilterDesign, wl = lambda0) => {
  const stack: Stack = { incident: 1, layers: cavityFilterLayers(d), substrate: { n: nSub } };
  return stackResponse(stack, wl).R;
};

// Hand calculations with quarter-wave admittances (Macleod, Thin-Film Optical Filters, 4th ed., ch. 2):
// a half-wave layer is an absentee at λ₀, and a quarter-wave layer of index n maps Y → n²/Y.
const R0 = ((1 - nSub) / (1 + nSub)) ** 2; // bare substrate, 0.0425800

test("cavity filter: a half-wave spacer cavity is transparent at λ₀ (bare substrate)", () => {
  close(R(design({})), R0, 1e-12, "1 cavity, p = 3");
  close(R(design({ mirrorPairs: 0 })), R0, 1e-12, "spacer only, p = 0");
  // 3 cavities: the two quarter-wave L coupling layers form a half-wave absentee as well.
  close(R(design({ cavities: 3, mirrorPairs: 5 })), R0, 1e-9, "3 cavities, p = 5");
  // Off λ₀ the mirrors reflect: R at 0.95 λ₀ is far above the bare substrate.
  assert.ok(R(design({}), 0.95 * lambda0) > 0.5);
});

test("cavity filter: two cavities leave one quarter-wave L coupling layer at λ₀", () => {
  const nL = 1.45;
  const Y = nL ** 2 / nSub; // 1.38322
  close(R(design({ cavities: 2 })), ((1 - Y) / (1 + Y)) ** 2, 1e-11, "2 cavities"); // 0.0258568
});

test("cavity filter: a quarter-wave spacer gives a reflection peak at λ₀", () => {
  // Air | H L S L H | sub: Y = (nH/nL)^4 · nS² / n_sub = 20.017, R = 0.81873.
  const Y = (2.35 / 1.45) ** 4 * 2.1 ** 2 / nSub;
  close(R(design({ mirrorPairs: 1, spacerQuarterWaves: 1 })), ((1 - Y) / (1 + Y)) ** 2, 1e-12, "q = 1, p = 1");
  close(((1 - Y) / (1 + Y)) ** 2, 0.81873, 5e-5, "hand value");
});

test("cavity filter: layer count and invalid inputs", () => {
  // m cavities of 4p + 1 layers and m − 1 coupling layers.
  assert.equal(cavityFilterLayers(design({ cavities: 3, mirrorPairs: 4 })).length, 3 * 17 + 2);
  const bad: [string, Partial<CavityFilterDesign>][] = [
    ["0 cavities", { cavities: 0 }],
    ["fractional pairs", { mirrorPairs: 1.5 }],
    ["negative pairs", { mirrorPairs: -1 }],
    ["spacer n = 0", { nSpacer: 0 }],
    ["λ₀ = 0", { lambda0: 0 }],
    ["0 quarter waves", { spacerQuarterWaves: 0 }],
  ];
  for (const [label, over] of bad) assert.ok(Number.isNaN(R(design(over))), label);
});
