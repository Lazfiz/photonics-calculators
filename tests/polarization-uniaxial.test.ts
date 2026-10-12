import test from "node:test";
import assert from "node:assert/strict";

import { refractiveIndex } from "../src/physics/materials/sellmeier";
import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS as X, crystalIndices, crystalRange } from "../src/physics/materials/uniaxial-data";
import {
  beamSeparation, extraordinaryIndex, maxWalkoff, plateRetardance, plateWaves, sectionRetardance, sectionSlowAxis, walkoffAngle,
} from "../src/physics/polarization/uniaxial";

const deg = Math.PI / 180;
const um = 1e-6;

function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

/** Largest |model − reference| over a log grid in [lo, hi] µm. */
function worst(model: (l_um: number) => number, ref: (l_um: number) => number, lo: number, hi: number) {
  let w = 0;
  for (let i = 0; i <= 200; i++) {
    const l = lo * (hi / lo) ** (i / 200);
    w = Math.max(w, Math.abs(model(l) - ref(l)));
  }
  return w;
}

const n = (m: (typeof X)["quartz"]["o"], l_um: number) => refractiveIndex(m, l_um * um);
/** refractiveindex.info "formula 1": n² − 1 = C₀ + Σ Bᵢλ²/(λ² − λᵢ²), λ in µm. */
function formula1(c: readonly number[], l: number) {
  let s = 1 + c[0];
  for (let i = 1; i < c.length; i += 2) s += (c[i] * l * l) / (l * l - c[i + 1] ** 2);
  return Math.sqrt(s);
}

// ------------------------------------------------------------------ transcription

test("uniaxial data: every set reproduces the refractiveindex.info coefficients as published (formula types 1, 2, 4)", () => {
  // Coefficient strings copied from the database files; each type evaluated here, independently of sellmeier.ts.
  const types: Record<number, (c: number[], l: number) => number> = {
    1: formula1,
    2: (c, l) => Math.sqrt(1 + c[0] + c.slice(1).reduce((s, _, i, r) => (i % 2 ? s : s + (r[i] * l * l) / (l * l - r[i + 1])), 0)),
    4: (c, l) => Math.sqrt(c[0] + (c[1] * l ** c[2]) / (l * l - c[3] ** c[4]) + (c[5] * l ** c[6]) / (l * l - c[7] ** c[8])),
  };
  const published: [keyof typeof X, "o" | "e", number, string][] = [
    ["quartz", "o", 2, "0.28604141 1.07044083 1.00585997e-2 1.10202242 100"],
    ["quartz", "e", 2, "0.28851804 1.09509924 1.02101864e-2 1.15662475 100"],
    ["calcite", "o", 2, "0.73358749 0.96464345 1.94325203e-2 1.82831454 120"],
    ["calcite", "e", 2, "0.35859695 0.82427830 1.06689543e-2 0.14429128 120"],
    ["mgf2", "o", 1, "0 0.48755108 0.04338408 0.39875031 0.09461442 2.3120353 23.793604"],
    ["mgf2", "e", 1, "0 0.41344023 0.03684262 0.50497499 0.09076162 2.4904862 23.771995"],
    ["sapphire", "o", 1, "0 1.4313493 0.0726631 0.65054713 0.1193242 5.3414021 18.028251"],
    ["sapphire", "e", 1, "0 1.5039759 0.0740288 0.55069141 0.1216529 6.5927379 20.072248"],
    ["yvo4", "o", 2, "0 2.7665 0.026884"],
    ["yvo4", "e", 2, "0 3.5930 0.032103"],
    ["linbo3", "o", 2, "0 2.6734 0.01764 1.2290 0.05914 12.614 474.60"],
    ["linbo3", "e", 2, "0 2.9804 0.02047 0.5981 0.0666 8.9543 416.08"],
    ["rutile", "o", 4, "5.913 0.2441 0 0.0803 1 0 0 0 1"],
    ["rutile", "e", 4, "7.197 0.3322 0 0.0843 1 0 0 0 1"],
  ];
  for (const [id, ray, type, coeffs] of published) {
    const c = coeffs.split(" ").map(Number);
    for (const l of [0.5, 0.6328, 1.064]) assertAbs(n(X[id][ray], l), types[type](c, l), 1e-9, `${id} ${ray} ${l} µm`);
  }
});

// ------------------------------------------------------------------ data sets against independent values

test("uniaxial data: quartz, calcite and rutile at 589.3 nm match Hecht, Optics, Table 8.1", () => {
  const hecht = { quartz: [1.5443, 1.5534, 2e-4], calcite: [1.6584, 1.4864, 4e-4], rutile: [2.616, 2.903, 6e-3] } as const;
  for (const [id, [no, ne, tol]] of Object.entries(hecht)) {
    const v = crystalIndices(id as keyof typeof hecht, 589.3e-9);
    assertAbs(v.no, no, tol, `${id} n_o`);
    assertAbs(v.ne, ne, tol, `${id} n_e`);
  }
});

test("uniaxial data: quartz (Ghosh 1999) agrees with Radhakrishnan's independent fit (Proc. Indian Acad. Sci. A 33, 22 (1951))", () => {
  const radO = [0, 0.663044, 0.06, 0.517852, 0.106, 0.175912, 0.119, 0.56538, 8.844, 1.675299, 20.742];
  const radE = [0, 0.665721, 0.06, 0.503511, 0.106, 0.214792, 0.119, 0.539173, 8.792, 1.807613, 19.7];
  assert.ok(worst((l) => n(X.quartz.o, l), (l) => formula1(radO, l), 0.25, 2) < 3e-4, "n_o");
  assert.ok(worst((l) => n(X.quartz.e, l), (l) => formula1(radE, l), 0.25, 2) < 3e-4, "n_e");
  const dn = (l: number) => n(X.quartz.e, l) - n(X.quartz.o, l);
  assert.ok(worst(dn, (l) => formula1(radE, l) - formula1(radO, l), 0.25, 2) < 2e-4, "Δn");
});

test("uniaxial data: MgF₂ (Dodge 1984) agrees with Li's critical evaluation (J. Phys. Chem. Ref. Data 9, 161 (1980)) to 1 µm", () => {
  // The two part by 7.6e-4 at 2 µm, where their infrared terms differ.
  const liO = [0.2762, 0.60967, 0.08636, 0.008, 18.0, 2.14973, 25.0];
  const liE = [0.25385, 0.66405, 0.08504, 1.0899, 22.2, 0.1816, 24.4, 2.1227, 40.6];
  assert.ok(worst((l) => n(X.mgf2.o, l), (l) => formula1(liO, l), 0.2, 1) < 2.5e-4, "n_o");
  assert.ok(worst((l) => n(X.mgf2.e, l), (l) => formula1(liE, l), 0.2, 1) < 2.5e-4, "n_e");
});

test("uniaxial data: sapphire n_o matches Malitson 1962 (JOSA 52, 1377); n_e by hand from the printed coefficients", () => {
  const mal = [0, 1.023798, 0.06144821, 1.058264, 0.1106997, 5.280792, 17.92656];
  assert.ok(worst((l) => n(X.sapphire.o, l), (l) => formula1(mal, l), 0.27, 5) < 2e-4, "n_o");
  // n_e(589.3 nm): 1 + 1.528091 + 0.575205 − 0.005687 = 3.097609 → 1.760003 (same formula type as n_o, which is
  // checked independently above). Δn ≈ −0.0081: sapphire is negative uniaxial.
  assertAbs(n(X.sapphire.e, 0.5893), 1.760003, 2e-6, "n_e");
});

test("uniaxial data: LiNbO₃ (Zelmon 1997) matches Smith et al. 1976 (n_o) and Jundt 1997 at 21 °C (n_e)", () => {
  // D. S. Smith, H. D. Riccius, R. P. Edwin, Opt. Commun. 17, 332 (1976), doi:10.1016/0030-4018(76)90273-X.
  const smithO = (l: number) => Math.sqrt(4.9048 + 0.11768 / (l * l - 0.0475) - 0.027169 * l * l);
  // D. H. Jundt, Opt. Lett. 22, 1553 (1997), doi:10.1364/OL.22.001553; f = (T − 24.5)(T + 570.82).
  const jundtE = (l: number, T: number) => {
    const f = (T - 24.5) * (T + 570.82), L = l * l;
    return Math.sqrt(5.35583 + 4.629e-7 * f + (0.100473 + 3.862e-8 * f) / (L - (0.20692 - 0.89e-8 * f) ** 2)
      + (100 + 2.657e-5 * f) / (L - 11.34927 ** 2) - 1.5334e-2 * L);
  };
  assert.ok(worst((l) => n(X.linbo3.o, l), smithO, 0.42, 2) < 5e-4, "n_o");
  assert.ok(worst((l) => n(X.linbo3.e, l), (l) => jundtE(l, 21), 0.42, 2) < 6e-4, "n_e");
});

test("uniaxial data: YVO₄ (Lomheim & DeShazer 1978) matches Shi et al. 2001 at 20 °C within 0.004", () => {
  // H. S. Shi, G. Zhang, H. Y. Shen, J. Synth. Cryst. 30, 85 (2001), as tabulated by refractiveindex.info.
  const shiO = (l: number) => Math.sqrt(3.77879 + 0.070479 / (l * l - 0.045731) - 0.009701 * l * l);
  const shiE = (l: number) => Math.sqrt(4.6072 + 0.108087 / (l * l - 0.052495) - 0.014305 * l * l);
  assert.ok(worst((l) => n(X.yvo4.o, l), shiO, 0.6, 1.34) < 4e-3, "n_o");
  assert.ok(worst((l) => n(X.yvo4.e, l), shiE, 0.6, 1.34) < 4e-3, "n_e");
});

test("uniaxial data: rutile (DeVore 1951) within sample spread of Bond's measurements (J. Appl. Phys. 36, 1674 (1965))", () => {
  const bondO = [[0.45, 2.8087], [0.6, 2.6034], [0.8, 2.5213], [1.0, 2.488], [1.4, 2.4514]];
  const bondE = [[0.6, 2.89], [0.8, 2.7866], [1.0, 2.743], [1.4, 2.7024]];
  for (const [l, v] of bondO) assertAbs(n(X.rutile.o, l), v, 7e-3, `n_o ${l} µm`);
  for (const [l, v] of bondE) assertAbs(n(X.rutile.e, l), v, 1.5e-2, `n_e ${l} µm`);
});

test("uniaxial data: sign of Δn and ranges", () => {
  const negative = new Set(["calcite", "sapphire", "linbo3"]);
  for (const id of CRYSTAL_IDS) {
    const [lo, hi] = crystalRange(id);
    assert.ok(lo < 589e-9 && 1000e-9 < hi, `${id} covers 589–1000 nm`);
    const { no, ne } = crystalIndices(id, 633e-9);
    assert.equal(ne < no, negative.has(id), `${id} sign`);
  }
});

// ------------------------------------------------------------------ uniaxial optics

test("n(θ): n_o along the axis, n_e across it; 1/n² = cos²θ/n_o² + sin²θ/n_e² at 45° (Born & Wolf ch. 15)", () => {
  assertAbs(extraordinaryIndex(1.6584, 1.4864, 0), 1.6584, 1e-15, "θ = 0");
  assertAbs(extraordinaryIndex(1.6584, 1.4864, 90 * deg), 1.4864, 1e-15, "θ = 90°");
  // Hand: 1/n² = ½(0.363595 + 0.452622) = 0.408108 → n = 1.565350.
  assertAbs(extraordinaryIndex(1.6584, 1.4864, 45 * deg), 1.56535, 1e-5, "θ = 45°");
});

test("walk-off: calcite (Hecht's indices) peaks at 6.26° for a wave normal 41.87° from the axis", () => {
  const no = 1.6584, ne = 1.4864;
  const m = maxWalkoff(no, ne);
  // tan ρ = (n_o² − n_e²)/(2 n_o n_e) = 0.540908/4.930092 = 0.109716; tan θ = n_e/n_o = 0.896286.
  assertAbs(m.rho / deg, 6.2615, 1e-3, "ρ_max");
  assertAbs(m.theta / deg, 41.8694, 1e-4, "θ");
  assertAbs(walkoffAngle(no, ne, m.theta), m.rho, 1e-15, "walkoffAngle at the peak");
  // At 45°: tan ρ = (n_o² − n_e²)/(n_o² + n_e²) = 0.540906/4.959676 = 0.109061 → ρ = 6.2240°. Positive crystal: ρ < 0.
  assertAbs(walkoffAngle(no, ne, 45 * deg) / deg, 6.224, 1e-3, "ρ(45°)");
  assert.ok(walkoffAngle(1.5443, 1.5534, 45 * deg) < 0, "quartz walks toward the axis");
  // Edge: no walk-off along or across the axis.
  assertAbs(walkoffAngle(no, ne, 0), 0, 1e-15, "θ = 0");
  assertAbs(walkoffAngle(no, ne, 90 * deg), 0, 1e-15, "θ = 90°");
});

test("plate: a 10 mm calcite beam displacer (axis 45°, normal incidence) separates the beams by 1.0906 mm", () => {
  const no = 1.6584, ne = 1.4864;
  const w = plateWaves(no, ne, { nIncident: 1, incidence: 0, axisPolar: 45 * deg, axisAzimuth: 0 });
  assertAbs(w.e.index, extraordinaryIndex(no, ne, 45 * deg), 1e-12, "e index");
  // The ray is turned away from the axis (toward −x) by ρ(45°).
  assertAbs(Math.atan2(w.e.ray[0], w.e.ray[2]), -walkoffAngle(no, ne, 45 * deg), 1e-12, "ray angle");
  // 10 mm × tan ρ(45°) = 10 mm × 0.109061 = 1.09061 mm.
  assertAbs(beamSeparation(w, 10e-3, 0) * 1e3, 1.09061, 1e-5, "separation");
});

test("plate: oblique e wave obeys Snell with n(θ) and the closed forms for three axis directions", () => {
  const no = 1.6584, ne = 1.4864, s = Math.sin(30 * deg);
  const g = { nIncident: 1, incidence: 30 * deg };
  const w = plateWaves(no, ne, { ...g, axisPolar: 60 * deg, axisAzimuth: 0 });
  assertAbs(w.e.index * Math.sin(w.e.waveAngle), s, 1e-14, "tangential k");
  assertAbs(w.e.index, extraordinaryIndex(no, ne, w.e.axisAngle), 1e-14, "index on the index ellipsoid");
  // Axis along the normal: k_z = n_o √(1 − sin²θ/n_e²). Axis in the faces, in the plane of incidence:
  // k_z = (n_e/n_o)√(n_o² − sin²θ). Axis in the faces, across the plane: k_z = √(n_e² − sin²θ) (Yariv & Yeh ch. 4).
  assertAbs(plateWaves(no, ne, { ...g, axisPolar: 0, axisAzimuth: 0 }).e.kz, no * Math.sqrt(1 - (s * s) / (ne * ne)), 1e-14, "axis ⊥ faces");
  assertAbs(plateWaves(no, ne, { ...g, axisPolar: 90 * deg, axisAzimuth: 0 }).e.kz, (ne / no) * Math.sqrt(no * no - s * s), 1e-14, "axis ∥ plane");
  const across = plateWaves(no, ne, { ...g, axisPolar: 90 * deg, axisAzimuth: 90 * deg });
  assertAbs(across.e.kz, Math.sqrt(ne * ne - s * s), 1e-14, "axis ⊥ plane");
  assertAbs(across.e.ray[1], 0, 1e-15, "no walk-off across the axis");
});

test("plate retardance: 2πΔn d/λ at normal incidence; Veiras et al. 2010 for a plate tilted about its axis", () => {
  const no = 1.5443, ne = 1.5534, d = 1e-3, lambda = 589.3e-9;
  const normal = plateWaves(no, ne, { nIncident: 1, incidence: 0, axisPolar: 90 * deg, axisAzimuth: 0 });
  assertAbs(plateRetardance(normal, d, lambda), (2 * Math.PI * (ne - no) * d) / lambda, 1e-9, "normal incidence");
  const t = 10 * deg, s = Math.sin(t);
  const tilted = plateWaves(no, ne, { nIncident: 1, incidence: t, axisPolar: 90 * deg, axisAzimuth: 90 * deg });
  const expected = ((2 * Math.PI * d) / lambda) * (Math.sqrt(ne * ne - s * s) - Math.sqrt(no * no - s * s));
  assertAbs(plateRetardance(tilted, d, lambda), expected, 1e-9, "tilted about the axis");
});

test("plate: evanescent waves give NaN (index-2 prism at 80° onto calcite)", () => {
  const w = plateWaves(1.6584, 1.4864, { nIncident: 2, incidence: 80 * deg, axisPolar: 45 * deg, axisAzimuth: 0 });
  assert.ok(Number.isNaN(w.o.kz) && Number.isNaN(w.e.kz));
});

test("section: R = |n(θc) − n_o|·d; a 30 µm quartz section with the axis in its plane gives first-order white", () => {
  // Ghosh 1999 quartz at 550 nm: n_o = 1.545948, n_e = 1.555108, Δn = 0.0091598 → R = 274.79 nm for 30 µm (the
  // standard section thickness, first-order white to pale yellow on the Michel-Lévy chart).
  const { no, ne } = crystalIndices("quartz", 550e-9);
  assertAbs(sectionRetardance(no, ne, 90 * deg, 30 * um) * 1e9, 274.79, 0.01, "θc = 90°");
  assert.ok(sectionRetardance(no, ne, 0, 30 * um) < 1e-18, "θc = 0: along the axis");
  // Hand, θc = 45°: n = (½/n_o² + ½/n_e²)^(−1/2) = 1.550508 → R = 0.0045596 × 30 µm = 136.79 nm.
  assertAbs(sectionRetardance(no, ne, 45 * deg, 30 * um) * 1e9, 136.79, 0.05, "θc = 45°");
  // Slow axis: the e-wave (ρ) in positive quartz, the o-wave (ρ + 90°) in negative calcite.
  assert.equal(sectionSlowAxis(no, ne, 10 * deg), 10 * deg);
  assert.equal(sectionSlowAxis(1.6584, 1.4864, 10 * deg), 100 * deg);
});
