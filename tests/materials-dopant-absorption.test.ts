import test from "node:test";
import assert from "node:assert/strict";

import { DOPANT_LINES, dopantAbsorption } from "../src/physics/materials/dopant-absorption";
import { COLOR_CENTERS, stokesShift } from "../src/physics/materials/color-centers";
import { DOPANT_PRESETS, ionDensityFromWtPpm, twoLevelAt } from "../src/physics/fiber-optics/doped-fiber-gain";

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
  // Melkumov 2004 (arXiv:1502.02885 App. 2, Al fibre) 1064 nm row: σ_e 0.31 pm², σ_a 0.0057 pm² (54× below σ_e, 472× below
  // σ_a at 976 nm). The 1068 nm row (0.30, 0.0046) was used before session 189.
  assert.deepEqual([pick("Yb1064")?.sigmaA, pick("Yb1064")?.sigmaE], [5.7e-27, 3.1e-25]);
});

test("Tm presets: Agger & Povlsen 2006, Al/La-silica fibre Tm1", () => {
  // Text: σ_a(1600) = 3.5 ± 0.1e-25 m², σ_e/σ_a = 0.10 ± 0.02 at 1600 nm and 1.20 ± 0.02 at 1740 nm, τ(³F₄) = 650 µs.
  // Vector data of Fig. 3 (σ_a) and Fig. 4 (σ_a, σ_e): 1740 nm 2.822/2.830 and 3.395; 1900 nm 0.171/0.173 and 2.836.
  const tm = DOPANT_PRESETS.find((p) => p.id === "Tm");
  assert.ok(tm);
  assert.equal(tm.tau, 650e-6);
  const pick = (id: string) => DOPANT_LINES.find((l) => l.id === id);
  const p = pick("Tm1600"), s1 = pick("Tm1740"), s2 = pick("Tm1900");
  assert.ok(p && s1 && s2);
  assert.deepEqual([p.role, p.sigmaA, p.sigmaE], ["pump", 3.5e-25, 0.35e-25]);
  assertRel(s1.sigmaE / s1.sigmaA, 1.2, 0.02 / 1.2, "σ_e/σ_a at 1740 nm");
  assertRel(s1.sigmaA, 2.83e-25, 0.05 / 2.83, "σ_a(1740)");
  assertRel(s2.sigmaA, 0.17e-25, 0.05 / 0.17, "σ_a(1900)");
  assertRel(s2.sigmaE, 2.84e-25, 0.05 / 2.84, "σ_e(1900)");
  // The amplifier pages take the first signal: 1900 nm.
  assert.equal(tm.signals[0].lambda, 1900e-9);
  // 1000 wt-ppm Tm (M 168.934 g/mol): N = 1e-3·2201·6.02214076e23/0.168934 = 7.84610e24 m⁻³; α(1600) = 3.5e-25·N =
  // 2.74614 m⁻¹ = 11.9263 dB/m; 10 cm: T = e^(−0.274614) = 0.759866.
  const N = ionDensityFromWtPpm(1000, tm.molarMass);
  assertRel(N, 7.8461e24, 1e-5, "N");
  const r = dopantAbsorption(p.sigmaA, N, 0.1);
  assertRel(r.dbPerM, 11.9263, 1e-5, "dB/m");
  assertRel(r.transmission, 0.759866, 1e-5, "T");
});

test("In-band pumping at 1600 nm inverts Tm at most to σ_a/(σ_a + σ_e) = 1/1.1", () => {
  // Two-level limit of Giles & Desurvire eq. (6) as the pump grows: n₂/N → σ_a/(σ_a + σ_e) = 3.5/3.85 = 0.909091.
  const tm = DOPANT_PRESETS.find((p) => p.id === "Tm");
  assert.ok(tm);
  const fiber = { N: 8.4e25, area: Math.PI * 3.5e-6 ** 2, tau: tm.tau };
  const beam = { ...tm.pumps[0], overlap: 0.8, power: 1e4 };
  assertRel(twoLevelAt(fiber, [beam], 0).inversion, 1 / 1.1, 1e-4, "inversion at 10 kW");
});

test("Ho presets: Le Gouët et al. 2020 (Opt. Express 28, 22307; arXiv:2003.14188v1), silica fibre", () => {
  // Text: σ_a(1946) = 4.3 ± 0.2e-25 m² (fibre #2), peak σ_e/σ_a = 1.40 ± 0.06, g(1995) = 58 dB/m against α(1946) = 57 dB/m,
  // so σ_e(1995) = (58/57)·4.3 = 4.3754e-25 m²; at 1908 nm σ_a 1.9, σ_e 1.6e-25 m²; τ(⁵I₇) = 0.7 ± 0.1 ms.
  // Fig. 1 (raster) read: 1946 nm σ_e 5.9; 1995 nm σ_a 1.93; 2120 nm 0.18 and 1.30 (±0.1, steep edge).
  const ho = DOPANT_PRESETS.find((p) => p.id === "Ho");
  assert.ok(ho);
  assert.equal(ho.tau, 0.7e-3);
  const pick = (id: string) => DOPANT_LINES.find((l) => l.id === id);
  const p1 = pick("Ho1908"), p2 = pick("Ho1946"), s1 = pick("Ho1995"), s2 = pick("Ho2120");
  assert.ok(p1 && p2 && s1 && s2);
  assert.deepEqual([p1.role, p1.sigmaA, p1.sigmaE], ["pump", 1.9e-25, 1.6e-25]);
  assert.equal(p2.sigmaA, 4.3e-25);
  assertRel(p2.sigmaE / p2.sigmaA, 1.4, 0.06 / 1.4, "σ_e/σ_a near the peaks");
  assertRel(s1.sigmaE, 4.3754e-25, 0.01, "σ_e(1995) from the measured gain");
  assertRel(s2.sigmaE, 1.3e-25, 0.1 / 1.3, "σ_e(2120)");
  // The amplifier pages take the first signal: the paper's 2120 nm laser line.
  assert.equal(ho.signals[0].lambda, 2120e-9);
  // Fibre #2: N = 27e25 m⁻³, Γ = 0.85: α = 0.85·4.3e-25·2.7e26 = 98.685 m⁻¹ = 428.58 dB/m; measured 425 ± 5 dB/m at 1950 nm.
  const f2 = dopantAbsorption(p2.sigmaA, 2.7e26, 1, 0.85);
  assertRel(f2.dbPerM, 428.584, 1e-5, "fibre #2, dB/m");
  assertRel(f2.dbPerM, 425, 10 / 425, "against the measured 425 ± 5 dB/m");
  // Fibre #1 (N 3.7e25 ± 16 %, Γ 0.776 at 1908 nm): 4.343·0.776·1.9e-25·3.7e25 = 23.69 dB/m; measured 25.2 ± 0.3 dB/m.
  assertRel(dopantAbsorption(p1.sigmaA, 3.7e25, 1, 0.776).dbPerM, 25.2, 0.1, "fibre #1 at 1908 nm");
  // 1000 wt-ppm Ho (M 164.930 g/mol): N = 1e-3·2201·6.02214076e23/0.16493 = 8.03658e24 m⁻³; α(1946) = 3.45573 m⁻¹ =
  // 15.0080 dB/m; 10 cm: T = e^(−0.345573) = 0.707815.
  const N = ionDensityFromWtPpm(1000, ho.molarMass);
  assertRel(N, 8.03658e24, 1e-5, "N");
  const r = dopantAbsorption(p2.sigmaA, N, 0.1);
  assertRel(r.dbPerM, 15.008, 1e-5, "dB/m");
  assertRel(r.transmission, 0.707815, 1e-5, "T");
});

test("In-band pumping at 1908 nm inverts Ho at most to σ_a/(σ_a + σ_e) = 1.9/3.5", () => {
  const ho = DOPANT_PRESETS.find((p) => p.id === "Ho");
  assert.ok(ho);
  const fiber = { N: 3.7e25, area: Math.PI * 4e-6 ** 2, tau: ho.tau };
  const beam = { ...ho.pumps[0], overlap: 0.76, power: 1e4 };
  assertRel(twoLevelAt(fiber, [beam], 0).inversion, 1.9 / 3.5, 1e-4, "inversion at 10 kW");
});

test("The twelve preset lines and the domain guards", () => {
  assert.deepEqual(DOPANT_LINES.map((l) => l.id), [
    "Er980", "Er1480", "Er1550", "Yb976", "Yb1064", "Tm1600", "Tm1740", "Tm1900", "Ho1908", "Ho1946", "Ho1995", "Ho2120",
  ]);
  // The old page counted Nd's 1064 nm emission as absorption; σ_a of Yb at 1064 nm is 5.7e-27 m², 472× below 976 nm.
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
