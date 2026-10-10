import test from "node:test";
import assert from "node:assert/strict";

import { cavityFilterLayers, cavityPassband, type CavityFilterDesign } from "../src/physics/thin-film/cavity-filter";
import { stopBandHalfWidth } from "../src/physics/thin-film/quarter-wave-stack";
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

const filterStack = (d: CavityFilterDesign): Stack => ({ incident: 1, layers: cavityFilterLayers(d), substrate: { n: nSub } });

/** Independent check: FWHM from 200 001 samples of T over λ₀ ± halfWindow, crossings interpolated linearly. */
function sampledFwhm(stack: Stack, halfWindow: number): number {
  const n = 200000;
  const wl = (i: number) => lambda0 - halfWindow + (2 * halfWindow * i) / n;
  const T = Array.from({ length: n + 1 }, (_, i) => stackResponse(stack, wl(i)).T);
  const half = T.reduce((m, t) => Math.max(m, t), 0) / 2;
  const first = T.findIndex((t) => t >= half);
  let last = n;
  while (T[last] < half) last--;
  const cross = (i: number, j: number) => wl(i) + ((half - T[i]) / (T[j] - T[i])) * (wl(j) - wl(i));
  return cross(last, last + 1) - cross(first - 1, first);
}

test("cavity filter: pass-band FWHM by scan and bisection", () => {
  const dg = stopBandHalfWidth(2.35, 1.45);
  // narrow-bandpass defaults (6 pairs, 3 cavities): the thin-film audit (session 25) found 1.134 nm, the
  // page showed 0.775 nm (two grid steps). bandpass-filter defaults (3 pairs, 2 cavities): the audit found 19.14 nm.
  // At λ₀ each cavity is an absentee, leaving the couplers: two L layers (3 cavities) are a half-wave absentee,
  // so T = 1 − R₀ = 0.957420; one L layer (2 cavities) gives R = ((1.52 − 1.45²)/(1.52 + 1.45²))², T = 0.974143.
  const RL = ((nSub - 1.45 ** 2) / (nSub + 1.45 ** 2)) ** 2;
  for (const [pairs, cavities, expected, window, T0] of [[6, 3, 1.13443, 3, 1 - R0], [3, 2, 19.1377, 40, 1 - RL]]) {
    const stack = filterStack(design({ mirrorPairs: pairs, cavities }));
    const pb = cavityPassband(stack, lambda0, dg);
    const fwhm = (pb.long - pb.short) / NM;
    close(fwhm, expected, 1e-4, `${pairs} pairs × ${cavities}`);
    close(fwhm, sampledFwhm(stack, window * NM) / NM, 2e-4 * expected, `${pairs} × ${cavities}, dense sampling`);
    close(stackResponse(stack, pb.short).T, pb.peakT / 2, 1e-9, "T(short) = peak/2");
    close(stackResponse(stack, pb.long).T, pb.peakT / 2, 1e-9, "T(long) = peak/2");
    close(stackResponse(stack, pb.peakShort).T, pb.peakT, 1e-12, "T at the peak");
    close(lambda0 / pb.peakShort + lambda0 / pb.peakLong, 2, 1e-12, "the two ripple peaks are mirrored in g");
    // Multiple cavities ripple: T(λ₀) is below the ripple peaks.
    close(stackResponse(stack, lambda0).T, T0, 1e-12, "T(λ₀)");
    assert.ok(pb.peakT > 0.98 && pb.peakT > T0);
  }
  // 8 pairs (the old page showed FWHM 0 from 8 pairs up): 0.1643 nm.
  const eight = cavityPassband(filterStack(design({ mirrorPairs: 8, cavities: 3 })), lambda0, dg);
  close((eight.long - eight.short) / NM, 0.164335, 1e-5, "8 pairs × 3");
  // Single cavity: the peak is at λ₀ and equals the bare substrate's transmittance.
  const one = cavityPassband(filterStack(design({ mirrorPairs: 12 })), lambda0, dg);
  assert.equal(one.peakShort, lambda0);
  close(one.peakT, 1 - R0, 1e-12, "single cavity peak");
  close((one.long - one.short) / NM, 0.00391734, 1e-7, "12 pairs × 1");
  // No mirrors: no stop band, so T never halves.
  assert.ok(Number.isNaN(cavityPassband(filterStack(design({ mirrorPairs: 0 })), lambda0, dg).short));
});
