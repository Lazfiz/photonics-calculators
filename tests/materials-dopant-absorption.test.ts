import test from "node:test";
import assert from "node:assert/strict";

import { DOPANT_LINES, dopantAbsorption } from "../src/physics/materials/dopant-absorption";
import { COLOR_CENTERS, stokesShift } from "../src/physics/materials/color-centers";
import { ionDensityFromWtPpm } from "../src/physics/fiber-optics/doped-fiber-gain";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

test("Yb 976 nm at 1000 wt-ppm in silica: α = σ_aN (Giles & Desurvire 1991), by hand", () => {
  // N = 1e-3·2201·6.02214076e23/0.173045 = 7.65970e24 m⁻³; α = 2.5e-24·N = 19.1493 m⁻¹; ×10/ln 10 = 83.164 dB/m.
  // Paschotta et al. 1997 give σ_a ≈ 2.6e-24 m² at 975 nm; the shared preset is 2.5e-24 m² (4 % lower).
  const yb976 = DOPANT_LINES.find((l) => l.id === "Yb976");
  assert.ok(yb976);
  assert.equal(yb976.sigmaA, 2.5e-24);
  const N = ionDensityFromWtPpm(1000, 0.173045);
  assertRel(N, 7.6597e24, 1e-4, "N");
  const r = dopantAbsorption(yb976.sigmaA, N, 0.1);
  assertRel(r.alpha, 19.1493, 1e-4, "α");
  assertRel(r.dbPerM, 83.164, 1e-4, "dB/m");
  assertRel(r.absorptionLength, 1 / 19.1493, 1e-4, "1/α");
  // 10 cm: 8.3164 dB, T = e^(−1.91493) = 0.147353.
  assertRel(r.lossDb, 8.3164, 1e-4, "dB over 10 cm");
  assertRel(r.transmission, 0.147353, 1e-4, "T");
  // An overlap Γ = 0.8 (fibre core) scales α.
  assertRel(dopantAbsorption(yb976.sigmaA, N, 0.1, 0.8).alpha, 0.8 * 19.1493, 1e-4, "Γα");
});

test("The five preset lines and the domain guards", () => {
  assert.deepEqual(DOPANT_LINES.map((l) => l.id), ["Er980", "Er1480", "Er1550", "Yb976", "Yb1064"]);
  // The old page counted Nd's 1064 nm emission as absorption; σ_a of Yb at 1064 nm is 6e-27 m², 400× below 976 nm.
  assert.equal(DOPANT_LINES.find((l) => l.id === "Yb1064")?.role, "signal");
  const none = dopantAbsorption(2.5e-25, 0, 1);
  assert.equal(none.alpha, 0);
  assert.equal(none.absorptionLength, Infinity);
  assert.equal(none.transmission, 1);
  assert.ok(Number.isNaN(dopantAbsorption(1e-25, 1e24, 1, 1.2).alpha), "Γ > 1");
  assert.ok(Number.isNaN(dopantAbsorption(-1e-25, 1e24, 1).alpha), "σ < 0");
  assert.ok(Number.isNaN(dopantAbsorption(1e-25, 1e24, -1).transmission), "L < 0");
});

test("NV⁻ Stokes shift from Davies & Hamer's band maxima (Doherty et al. 2013, Table 9)", () => {
  // 2.180 eV → hc/E = 1239.842/2.180 = 568.735 nm; 1.760 eV → 704.456 nm; ZPL 1.945 eV → 637.451 nm.
  const nv = COLOR_CENTERS.nv;
  assertRel(nv.absorptionPeak, 568.735e-9, 1e-5, "abs");
  assertRel(nv.emissionPeak, 704.456e-9, 1e-5, "em");
  assertRel(nv.zpl, 637.451e-9, 1e-5, "ZPL");
  const s = stokesShift(nv.absorptionPeak, nv.emissionPeak);
  assertRel(s.energyEv, 0.42, 1e-9, "ΔE");
  // 0.420 eV / 1.239842e-4 eV·cm = 3387.53 cm⁻¹; 1 − 1.760/2.180 = 0.192661.
  assertRel(s.wavenumber, 338753, 1e-5, "Δν̃");
  assertRel(s.quantumDefect, 0.192661, 1e-5, "quantum defect");
  // Wee et al. 2007: σ = 3.1e-17 cm² at 532 nm; 1e24 m⁻³ over 0.5 mm: α = 3100 m⁻¹, T = e^(−1.55) = 0.212248.
  assertRel(dopantAbsorption(nv.sigmaA, 1e24, 0.5e-3).transmission, 0.212248, 1e-5, "T");
});

test("LiF F₂ (443 → 678 nm, Baldacchini 2002) and the guards", () => {
  // 1e7/443 − 1e7/678 = 22573.36 − 14749.26 = 7824.10 cm⁻¹; 1 − 443/678 = 0.346608.
  const f2 = COLOR_CENTERS.lifF2;
  const s = stokesShift(f2.absorptionPeak, f2.emissionPeak);
  assertRel(s.wavenumber, 782410, 1e-5, "Δν̃");
  assertRel(s.quantumDefect, 0.346608, 1e-5, "quantum defect");
  assert.ok(Number.isNaN(f2.sigmaA), "no cited cross-section");
  // Equal peaks: no shift; emission below absorption: negative (anti-Stokes); zero wavelength: NaN.
  assert.equal(stokesShift(600e-9, 600e-9).energyEv, 0);
  assert.ok(stokesShift(700e-9, 600e-9).energyEv < 0);
  assert.ok(Number.isNaN(stokesShift(0, 600e-9).energyEv));
});
