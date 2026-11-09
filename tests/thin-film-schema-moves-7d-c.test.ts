import assert from "node:assert/strict";
import test from "node:test";

import { protectedSilverStacks, protectedSilverSummary, protectedSilverValid } from "../src/physics/thin-film/protected-silver";
import { filmOpticalSummary } from "../src/physics/thin-film/spectrophotometry";

const close = (a: number, b: number, rel = 1e-9) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} vs ${b}`);

test("filmOpticalSummary: n = 1.46, k = 0.001, d = 100 nm at 550 nm (hand-worked)", () => {
  const s = filmOpticalSummary(1.46, 0.001, 100e-9);
  close(s.opticalThickness, 146e-9); // 1.46 × 100 nm
  close(s.quarterWaveThickness, 550e-9 / 5.84); // 550/(4 × 1.46) = 94.17808219 nm
  close(s.halfWaves, 292 / 550); // 2 × 146/550
  close(s.alpha, (4 * Math.PI * 0.001) / 550e-9); // 22847.9466 1/m
  close(s.alpha, 22847.94657, 1e-8);
});

test("filmOpticalSummary: domain guards give NaN", () => {
  for (const s of [filmOpticalSummary(0, 0, 1e-7), filmOpticalSummary(1.5, -1, 1e-7), filmOpticalSummary(1.5, 0, -1e-7), filmOpticalSummary(1.5, 0, 1e-7, 0)]) {
    assert.ok(Number.isNaN(s.opticalThickness) && Number.isNaN(s.alpha));
  }
});

test("protectedSilverSummary: no metal and no overcoat leaves the bare substrate, R = (0.52/2.52)^2 (Fresnel)", () => {
  const s = protectedSilverSummary({ nSub: 1.52, agThickness: 0, nProtect: 1.38, protectThickness: 0, nAdhesion: 2.35, adhesionThickness: 0 });
  const R = (0.52 / 2.52) ** 2; // 0.04257999
  for (const v of [s.visMean, s.visMin, s.nirMean, s.bareVisMean, s.minR]) close(v, R, 1e-9);
});

test("protectedSilverSummary: a 100 nm n = 1.38 layer on n = 1.52 is lowest at 552 nm, R = ((1.52 - 1.38^2)/(1.52 + 1.38^2))^2", () => {
  const s = protectedSilverSummary({ nSub: 1.52, agThickness: 0, nProtect: 1.38, protectThickness: 100e-9, nAdhesion: 2.35, adhesionThickness: 0 });
  close(s.minWavelength, 552e-9, 1e-12);
  close(s.minR, (0.3844 / 3.4244) ** 2, 1e-8); // 0.01260079
});

test("protectedSilver: invalid input gives NaN, stacks keep the layer order", () => {
  const p = { nSub: 1.52, agThickness: 8e-8, nProtect: 1.38, protectThickness: 5e-8, nAdhesion: 2.35, adhesionThickness: 1e-8 };
  assert.equal(protectedSilverValid({ ...p, nSub: 0 }), false);
  assert.ok(Number.isNaN(protectedSilverSummary({ ...p, protectThickness: -1 }).minR));
  const st = protectedSilverStacks(p);
  assert.deepEqual(st.protectedAg.map((l) => l.material), ["dielectric", "Ag", "dielectric"]);
  assert.deepEqual(st.bare.map((l) => l.material), ["Ag", "dielectric"]);
});
