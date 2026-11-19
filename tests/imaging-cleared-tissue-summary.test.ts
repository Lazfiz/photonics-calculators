import test from "node:test";
import assert from "node:assert/strict";

import { clearedTissueSummary } from "../src/physics/imaging/cleared-tissue";

const nm = 1e-9;
const close = (actual: number, expected: number, tol: number, label: string) =>
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);

test("cleared tissue summary: Beer-Lambert ballistic light (Jacques 2013), 0.02 + 1.0 mm^-1 at 500 um", () => {
  // Hand: µ_t = 1020 m⁻¹ × 5e-4 m = 0.51; exp(−0.51) = 0.6004955788; 10 log10(e) × 0.51 = 2.214901858 dB;
  // 1/µ_t = 0.9803921569 mm; ln(100)/µ_t = 4.514872731 mm.
  const s = clearedTissueSummary(0.8, 700 * nm, 1.45, 1.33, 500e-6, 20, 1000);
  close(s.ballistic, 0.6004955788122659, 1e-9, "ballistic");
  close(s.lossDb, 2.2149018577065847, 1e-9, "loss");
  close(s.depth1e, 0.9803921568627451e-3, 1e-9, "1/e depth");
  close(s.depth1pc, 4.514872731360874e-3, 1e-9, "1 % depth");
  close(s.scatteringLength, 1e-3, 1e-9, "scattering length");
});

test("cleared tissue summary: resolution and focal shifts (Hell et al. 1993; Born & Wolf §8.8)", () => {
  // Hand: n_s/n_imm = 1.45/1.33; √(1.45² − 0.64)/√(1.33² − 0.64) = 1.1382042446; λ/(2NA) = 437.5 nm; 0.88589 λ/(n_s − √(n_s² − NA²)) = 2.576753976 µm.
  const s = clearedTissueSummary(0.8, 700 * nm, 1.45, 1.33, 500e-6, 20, 1000);
  assert.equal(s.problem, "");
  close(s.paraxialShift, 1.0902255639097744, 1e-9, "paraxial");
  close(s.marginalShift, 1.1382042446201965, 1e-9, "marginal");
  close(s.lateral, 437.5 * nm, 1e-9, "lateral");
  close(s.axial, 2.5767539761454223e-6, 1e-9, "axial");
});

test("cleared tissue summary: an impossible NA is reported and no resolution is returned (edge)", () => {
  const s = clearedTissueSummary(1.4, 700 * nm, 1.33, 1.52, 500e-6, 20, 1000);
  assert.match(s.problem, /not possible inside a sample/);
  assert.ok(Number.isNaN(s.lateral) && Number.isNaN(s.marginalShift));
  assert.equal(clearedTissueSummary(1.4, 700 * nm, 1.52, 1.33, 0, 0, 0).problem.startsWith("An NA of 1.4"), true);
});
