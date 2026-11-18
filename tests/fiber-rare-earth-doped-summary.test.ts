// Golden values for rareEarthSpec / rareEarthSummary / rareEarthProfile (src/physics/fiber-optics/rare-earth-doped.ts), from an
// independent script: Gloge D., Appl. Opt. 10, 2252 (1971), doi:10.1364/AO.10.002252 (LP01 U, W by bisection with its own Bessel J and K
// integrals; Γ = 1 − (U²/V²)(1 − K₀²/K₁²)), and the two-level rate equations of Giles C. R., Desurvire E., J. Lightwave Technol. 9, 271
// (1991), doi:10.1109/50.65886, integrated with RK4 (20000 steps): dQ/dz = ((α+g)n − α)Q, n = ΣαQ/(ζ + Σ(α+g)Q), ζ = N·A/τ.
import assert from "node:assert/strict";
import { test } from "node:test";

import { rareEarthProfile, rareEarthSpec, rareEarthSummary, type RareEarthInput } from "../src/physics/fiber-optics/rare-earth-doped";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

const er: RareEarthInput = {
  dopant: "Er", ppm: 1000, L: 3, a: 1.6e-6, n1: 1.474, n2: 1.457, pump: 0.2, signalDbm: -30, lp: 980e-9, ls: 1550e-9,
  sigmaAPump: 1.7e-25, sigmaEPump: 0, sigmaASignal: 2.2e-25, sigmaESignal: 3.0e-25, tau: 10.2e-3,
};

test("Er amplifier at the page defaults", () => {
  const s = rareEarthSummary(rareEarthSpec(er));
  close(s.N, 7.924674793440115e24);
  close(s.V, 1.4477731656353696);
  close(s.cutoff, 933.1439444967468e-9);
  close(s.gp, 0.8073763142710941);
  close(s.gs, 0.5088596930510234);
  close(s.alphaP, 4.723791128582694);
  close(s.L90, 2.116943727569165);
  close(s.pSatS, 0.3818856199691147e-3);
  close(s.pSatP, 1.1644353921461055e-3);
  close(s.fullInv, 15.761818469466625);
  close(s.gain, 15.599801856964447);
  close(s.nf, 2.968588499776055);
});

test("the profile has 61 points to 3L, the gain at L matches the amplifier and the pump left is a percentage", () => {
  const p = rareEarthProfile(rareEarthSpec(er));
  assert.equal(p.lengths.length, 61);
  close(p.lengths[60], 9);
  close(p.gain[20], 15.599801856964447, 1e-7);
  close(p.pumpLeft[20], 98.08352317677164, 1e-7);
  close(p.pumpLeft[0], 100);
});

test("Yb amplifier", () => {
  const s = rareEarthSummary(rareEarthSpec({
    dopant: "Yb", ppm: 500, L: 2, a: 3e-6, n1: 1.46, n2: 1.4555, pump: 0.5, signalDbm: -10, lp: 976e-9, ls: 1064e-9,
    sigmaAPump: 26.9e-25, sigmaEPump: 29.7e-25, sigmaASignal: 0.057e-25, sigmaESignal: 3.1e-25, tau: 0.83e-3,
  }));
  close(s.N, 3.829851140674391e24);
  close(s.alphaP, 35.43308679479714);
  close(s.gain, 3.582869824422345);
  close(s.nf, 2.000797304724957);
});

test("inputs are clamped, n₂ to n₁, and an unknown dopant falls back to Er", () => {
  const spec = rareEarthSpec({ ...er, dopant: "Nd", ppm: 0, L: 1e3, n1: 1.35, n2: 1.9, pump: -1, signalDbm: 99 });
  assert.equal(spec.ion.id, "Er");
  assert.equal(spec.ppm, 1);
  assert.equal(spec.L, 200);
  assert.equal(spec.n2, 1.35);
  assert.equal(spec.pump, 0);
  assert.equal(spec.signalDbm, 20);
  // n₂ = n₁ gives NA = 0: no guided mode, so no overlap and no gain.
  const s = rareEarthSummary(spec);
  assert.ok(Number.isNaN(s.gp) && Number.isNaN(s.gain));
});
