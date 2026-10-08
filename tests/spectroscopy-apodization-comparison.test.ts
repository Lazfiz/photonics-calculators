import test from "node:test";
import assert from "node:assert/strict";

import {
  WINDOWS, equivalentNoiseBandwidth, highestSidelobeDb, lineShapeDb, windowSamples, type WindowName,
} from "../src/physics/spectroscopy/apodization-comparison";
import { erf } from "../src/physics/math";

const names = Object.keys(WINDOWS) as WindowName[];
// N = 512, 32× zero padding, first 64 bins (the full spectrum gives the same maxima).
const cache = new Map<WindowName, { sidelobe: number; enbw: number }>();
const measure = (name: WindowName) => {
  if (!cache.has(name)) {
    const w = windowSamples(name, 512);
    cache.set(name, { sidelobe: highestSidelobeDb(lineShapeDb(w, 32, 64).db), enbw: equivalentNoiseBandwidth(w) });
  }
  return cache.get(name)!;
};

test("highest sidelobe and ENBW match the literature", () => {
  // F. J. Harris, Proc. IEEE 66, 51 (1978), Table I, and A. H. Nuttall, IEEE Trans. ASSP 29, 84 (1981):
  // rectangle −13.26 dB (first sidelobe of the sinc), triangle −26.5, Hann −31.5, Hamming −42.7,
  // Blackman −58.1, 4-term Blackman–Harris −92, Nuttall's continuous-derivative 4-term −93.3.
  // ENBW: 1.00, 1.33, 1.50, 1.36, 1.73, 2.00, 2.02.
  const ref: [WindowName, number, number][] = [
    ["boxcar", -13.26, 1.0], ["triangular", -26.5, 1.33], ["hanning", -31.5, 1.5], ["hamming", -42.7, 1.36],
    ["blackman", -58.1, 1.73], ["blackman-harris", -92.0, 2.0], ["nuttall", -93.3, 2.02],
  ];
  for (const [name, db, enbw] of ref) {
    const m = measure(name);
    assert.ok(Math.abs(m.sidelobe - db) < 0.3, `${name} sidelobe ${m.sidelobe} vs ${db}`);
    assert.ok(Math.abs(m.enbw - enbw) < 0.015, `${name} ENBW ${m.enbw} vs ${enbw}`);
  }
  // Gaussian exp(−½(αu)²) on u ∈ [−1, 1], α = 3, by direct integration:
  // ENBW = 2 ∫w² / (∫w)² = 2 (√π/α) erf(α) / ((√(2π)/α) erf(α/√2))² = 1.7018.
  const a = 3;
  const enbwGauss = (2 * (Math.sqrt(Math.PI) / a) * erf(a)) / ((Math.sqrt(2 * Math.PI) / a) * erf(a / Math.SQRT2)) ** 2;
  assert.ok(Math.abs(enbwGauss - 1.7018) < 1e-4);
  assert.ok(Math.abs(equivalentNoiseBandwidth(windowSamples("gaussian", 2048)) - enbwGauss) < 0.002);
});

test("the WINDOWS table is what the windows give", () => {
  for (const name of names) {
    const m = measure(name);
    assert.ok(Math.abs(m.sidelobe - WINDOWS[name].sidelobeDb) <= 0.55, `${name}: ${m.sidelobe} vs ${WINDOWS[name].sidelobeDb}`);
    assert.ok(Math.abs(m.enbw - WINDOWS[name].enbw) <= 0.01, `${name}: ${m.enbw} vs ${WINDOWS[name].enbw}`);
  }
});

test("window shape: centred, symmetric, and one period of each cosine", () => {
  // The page used cos(2πk x/M) over x ∈ [−M, M], two periods, which put the first sidelobes at −3…−6 dB.
  for (const name of names) {
    const w = windowSamples(name, 65);
    assert.equal(w.length, 65);
    assert.ok(Math.abs(w[32] - 1) < 1e-12, `${name} peak`);
    for (let i = 0; i < 32; i++) assert.ok(Math.abs(w[i] - w[64 - i]) < 1e-12, `${name} symmetry`);
    assert.ok(Math.max(...w) <= 1 + 1e-12, `${name} max`);
  }
  // Ends: Hann, Blackman and triangle reach 0; Hamming 0.08; Blackman–Harris 6e-5.
  const end = (name: WindowName) => windowSamples(name, 65)[0];
  assert.ok(Math.abs(end("hanning")) < 1e-15);
  assert.ok(Math.abs(end("blackman")) < 1e-15);
  assert.equal(end("triangular"), 0);
  assert.ok(Math.abs(end("hamming") - 0.08) < 1e-15);
  assert.ok(Math.abs(end("blackman-harris") - 6e-5) < 1e-12);
});

test("apodization edge cases", () => {
  assert.deepEqual(windowSamples("hanning", 1), []);
  assert.deepEqual(windowSamples("hanning", 10.5), []);
  assert.deepEqual(windowSamples("boxcar", 2), [1, 1]);
});
