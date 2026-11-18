import test from "node:test";
import assert from "node:assert/strict";

import { fcsSummary } from "../src/physics/imaging/fluorescence-dynamics";

const rel = (a: number, e: number) => Math.abs(a / e - 1);
const um = 1e-6;

// Hess & Webb, Biophys. J. 83, 2300 (2002), doi:10.1016/S0006-3495(02)73990-8; Koppel, Phys. Rev. A 10, 1938 (1974).
test("fcsSummary at the page defaults, worked by hand", () => {
  // V = π^1.5 · 0.09 · 1.5 µm³ = 0.7517242796 fL; N = 50e-6 mol/m³ · 6.02214076e23 · V = 22.63494712; D = 0.09 µm²/(4 · 5e-5 s) = 450 µm²/s.
  const r = fcsSummary({ w0: 0.3 * um, z0: 1.5 * um, tauD: 0.05e-3, brightness: 30e3, concentration: 50e-6, T: 0.1, tauT: 5e-6, binWidth: 1e-6, time: 10 });
  assert.ok(rel(r.volume * 1e18, 0.7517242795723) < 1e-9);
  assert.ok(rel(r.N, 22.63494712147) < 1e-9);
  assert.ok(rel(r.D, 450e-12) < 1e-12);
  assert.ok(rel(r.g0Triplet, 0.04908830160496) < 1e-9);
  assert.ok(rel(r.snr, 92.83968951134) < 1e-9);
  assert.ok(rel(r.countRate, 679.0484136441e3) < 1e-9);
  assert.deepEqual(r.warnings, []);
});

test("fcsSummary warns below one molecule and for wide lag channels; edge T = 0", () => {
  const r = fcsSummary({ w0: 0.1 * um, z0: 0.1 * um, tauD: 1e-3, brightness: 1e6, concentration: 0.01e-6, T: 0, tauT: 1e-6, binWidth: 1e-3, time: 1 });
  assert.ok(r.N < 0.5);
  assert.equal(r.g0Triplet, r.g0);
  assert.equal(r.warnings.length, 4);
});
