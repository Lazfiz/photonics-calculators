import test from "node:test";
import assert from "node:assert/strict";

import { DOPANT_LINES, dopantAbsorption } from "../src/physics/materials/dopant-absorption";
import { COLOR_CENTERS, stokesShift } from "../src/physics/materials/color-centers";
import { ionDensityFromWtPpm } from "../src/physics/fiber-optics/doped-fiber-gain";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

test("Yb 976 nm at 1000 wt-ppm in silica: α = σ_aN (Giles & Desurvire 1991), by hand", () => {
  // N = 1e-3·2201·6.02214076e23/0.173045 = 7.65970e24 m⁻³; α = 2.69e-24·N = 20.6046 m⁻¹; ×10/ln 10 = 89.4846 dB/m.
  // σ_a(976) = 2.69 pm², σ_e 2.97 pm² in aluminosilicate: Melkumov et al. 2004, arXiv:1502.02885 Appendix 2.
  const yb976 = DOPANT_LINES.find((l) => l.id === "Yb976");
  assert.ok(yb976);
  assert.equal(yb976.sigmaA, 2.69e-24);
  assert.equal(yb976.sigmaE, 2.97e-24);
  const N = ionDensityFromWtPpm(1000, 0.173045);
  assertRel(N, 7.6597e24, 1e-4, "N");
  const r = dopantAbsorption(yb976.sigmaA, N, 0.1);
  assertRel(r.alpha, 20.6046, 1e-4, "α");
  assertRel(r.dbPerM, 89.4846, 1e-4, "dB/m");
  assertRel(r.absorptionLength, 1 / 20.6046, 1e-4, "1/α");
  // 10 cm: 8.94846 dB, T = e^(−2.06046) = 0.127395.
  assertRel(r.lossDb, 8.94846, 1e-4, "dB over 10 cm");
  assertRel(r.transmission, 0.127395, 1e-4, "T");
  // An overlap Γ = 0.8 (fibre core) scales α.
  assertRel(dopantAbsorption(yb976.sigmaA, N, 0.1, 0.8).alpha, 0.8 * 20.6046, 1e-4, "Γα");
});

test("Er presets: Barnes et al. 1991, GeO₂–Al₂O₃–SiO₂ fibre", () => {
  // Table V: σ_a(980) = 1.7 ± 0.3e-25 m². Fig. 6(c), read to ±0.15e-25: 1480 nm σ_a 1.7, σ_e 0.5; 1550 nm σ_a 2.2, σ_e 3.0.
  const pick = (id: string) => DOPANT_LINES.find((l) => l.id === id);
  assert.deepEqual([pick("Er980")?.sigmaA, pick("Er980")?.sigmaE], [1.7e-25, 0]);
  assert.deepEqual([pick("Er1480")?.sigmaA, pick("Er1480")?.sigmaE], [1.7e-25, 0.5e-25]);
  assert.deepEqual([pick("Er1550")?.sigmaA, pick("Er1550")?.sigmaE], [2.2e-25, 3.0e-25]);
  // Melkumov 2004 at 1064 nm: σ_e 0.30 pm², σ_a 0.0046 pm² (65× below σ_e, 585× below σ_a at 976 nm).
  assert.deepEqual([pick("Yb1064")?.sigmaA, pick("Yb1064")?.sigmaE], [4.6e-27, 3.0e-25]);
});

test("The five preset lines and the domain guards", () => {
  assert.deepEqual(DOPANT_LINES.map((l) => l.id), ["Er980", "Er1480", "Er1550", "Yb976", "Yb1064"]);
  // The old page counted Nd's 1064 nm emission as absorption; σ_a of Yb at 1064 nm is 4.6e-27 m², 585× below 976 nm.
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
