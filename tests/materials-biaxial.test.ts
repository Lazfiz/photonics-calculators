import test from "node:test";
import assert from "node:assert/strict";

import { biaxialIndices } from "../src/physics/materials/biaxial-data";
import { BIBO_THETA, uniaxialWalkOff, xyPlaneIndex, yzPlaneMatchingAngle } from "../src/physics/materials/nonlinear-crystals";

const deg = Math.PI / 180;

test("KTP (Kato & Takaoka 2002) against the EKSMA KTP sheet's 1064 nm indices", () => {
  // EKSMA: n_x 1.7404, n_y 1.7479, n_z 1.8296. Kato's fit gives n_z to 1e-4 and n_x, n_y 0.0025 lower.
  const k = biaxialIndices("ktp", 1064e-9);
  assert.ok(Math.abs(k.nz - 1.8296) < 1e-4, `n_z ${k.nz}`);
  assert.ok(Math.abs(k.nx - 1.7404) < 3e-3 && Math.abs(k.ny - 1.7479) < 3e-3, `n_x ${k.nx}, n_y ${k.ny}`);
  assert.ok(k.nx < k.ny && k.ny < k.nz, "n_x < n_y < n_z");
  // Outside 0.43–3.54 µm the fit isn't used.
  assert.ok(Number.isNaN(biaxialIndices("ktp", 400e-9).ny), "below the range");
});

test("KTP type II SHG of 1064 nm in the XY plane: Kato's indices put φ at 23.6° (EKSMA cut 23.5°)", () => {
  const w = biaxialIndices("ktp", 1064e-9);
  const s = biaxialIndices("ktp", 532e-9);
  const mismatch = (phi: number) => (w.nz + xyPlaneIndex(w.nx, w.ny, phi)) / 2 - xyPlaneIndex(s.nx, s.ny, phi);
  let lo = 0;
  let hi = 90 * deg;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (Math.sign(mismatch(m)) === Math.sign(mismatch(lo))) lo = m;
    else hi = m;
  }
  assert.ok(Math.abs(lo / deg - 23.5) < 0.2, `φ ${lo / deg}°`);
});

test("BiBO (Umemura et al. 2007) type I YZ cut: θ 168.8° and walk-off 25.7 mrad vs CASTECH 168.9° and 25.6 mrad", () => {
  // 1/n_x(532)² = cos²θ/n_y(1064)² + sin²θ/n_z(1064)²: n_x 1.78851, n_y 1.78398, n_z 1.91718 give sin²θ = 0.0377, θ = 11.20°.
  assert.ok(Math.abs(180 - BIBO_THETA / deg - 168.9) < 0.15, `θ ${180 - BIBO_THETA / deg}°`);
  const b = biaxialIndices("bibo", 1064e-9);
  assert.ok(Math.abs(Math.abs(uniaxialWalkOff(b.ny, b.nz, BIBO_THETA)) - 0.0256) < 3e-4, "walk-off");
  // Edge: a target index outside [n_y, n_z] has no in-plane match.
  assert.ok(Number.isNaN(yzPlaneMatchingAngle(b.ny, b.nz, 2.0)), "no match above n_z");
});
