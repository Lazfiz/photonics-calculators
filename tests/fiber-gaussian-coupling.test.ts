import test from "node:test";
import assert from "node:assert/strict";

import {
  angledFaceReflectance, gapEtalonTransmission, gaussianCoupling, gaussianCouplingWorstTilt, lossDb, returnLossDb, stepReflectance, waistFromNA,
} from "../src/physics/fiber-optics/gaussian-coupling";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const um = 1e-6;
const lambda = 1.55 * um;

test("Marcuse single-effect splice losses (BSTJ 56, 703, 1977) for equal mode radii", () => {
  const w = 4.5 * um;
  // Gap: η = 1/(1 + (λz/(2πnw²))²). z = 10 µm, n = 1: λz/(2πw²) = 15.5/127.235 = 0.121822 → 0.06398 dB.
  assertRel(lossDb(gaussianCoupling({ w1: w, w2: w, lambda, gap: 10 * um })), 0.06398, 2e-4, "gap 10 µm");
  // Offset: η = exp(−d²/w²). d = 0.5 µm: 4.3429 × 0.25/20.25 = 0.053616 dB.
  assertRel(lossDb(gaussianCoupling({ w1: w, w2: w, lambda, offset: 0.5 * um })), 0.053616, 1e-4, "offset 0.5 µm");
  // Tilt: η = exp(−(πnwθ/λ)²). θ = 0.5°, n = 1: (π·4.5·0.0087266/1.55)² = 0.0063352 → 0.027513 dB.
  assertRel(lossDb(gaussianCoupling({ w1: w, w2: w, lambda, tilt: 0.5 * Math.PI / 180 })), 0.027513, 2e-4, "tilt 0.5°");
  for (const n of [1, 1.33, 1.46]) {
    const z = 25 * um, theta = 0.02;
    assertRel(gaussianCoupling({ w1: w, w2: w, lambda, n, gap: z }),
      1 / (1 + ((lambda * z) / (2 * Math.PI * n * w * w)) ** 2), 1e-12, `gap formula, n = ${n}`);
    assertRel(gaussianCoupling({ w1: w, w2: w, lambda, n, tilt: theta }),
      Math.exp(-(((Math.PI * n * w * theta) / lambda) ** 2)), 1e-12, `tilt formula, n = ${n}`);
  }
});

test("Unequal mode radii: Marcuse mismatch, offset and tilt, and Kogelnik's gap formula", () => {
  const w1 = 3 * um, w2 = 5.2 * um, s = w1 * w1 + w2 * w2, m = ((2 * w1 * w2) / s) ** 2;
  const d = 1.2 * um, theta = 0.03, z = 40 * um, n = 1.2;
  assertRel(gaussianCoupling({ w1, w2, lambda }), m, 1e-12, "mismatch");
  assertRel(gaussianCoupling({ w1, w2, lambda, offset: d }), m * Math.exp((-2 * d * d) / s), 1e-12, "offset");
  assertRel(gaussianCoupling({ w1, w2, lambda, n, tilt: theta }),
    m * Math.exp((-2 * ((Math.PI * n * theta) / lambda) ** 2 * w1 * w1 * w2 * w2) / s), 1e-12, "tilt");
  assertRel(gaussianCoupling({ w1, w2, lambda, n, gap: z }),
    4 / ((w1 / w2 + w2 / w1) ** 2 + ((lambda * z) / (Math.PI * n * w1 * w2)) ** 2), 1e-12, "gap");
  // Coupling-efficiency page default: NA 0.22 beam into a 10.4 µm MFD fibre at 1550 nm.
  // w₀ = 1.55/(π·0.22) = 2.242638 µm; η = (2·2.242638·5.2/(2.242638² + 5.2²))² = 0.528935.
  const w0 = waistFromNA(0.22, lambda);
  assertRel(w0, 2.242638 * um, 1e-6, "waist from NA");
  assertRel(gaussianCoupling({ w1: w0, w2: 5.2 * um, lambda }), 0.528935, 1e-5, "NA 0.22 into MFD 10.4 µm");
});

test("Combined offset + tilt + gap + mismatch matches a numerical overlap integral", () => {
  const w1 = 4.1 * um, w2 = 5.3 * um, n = 1.1, d = 1.5 * um, theta = 0.025, z = 30 * um;
  const k = (2 * Math.PI * n) / lambda;
  // Propagated beam of fibre 1 (Kogelnik & Li, Appl. Opt. 5, 1550, 1966): w(z), R(z), written independently.
  const zR = (Math.PI * n * w1 * w1) / lambda;
  const wz = w1 * Math.sqrt(1 + (z / zR) ** 2);
  const Rz = z * (1 + (zR / z) ** 2);
  // E₁ = exp(−r²/w(z)²) exp(−ikr²/2R); E₂ = exp(−((x−d)² + y²)/w₂²) exp(−ikθx). Separable in x and y.
  const N = 4001, L = 40 * um, h = (2 * L) / (N - 1);
  const overlap1D = (offset: number, phaseSlope: number) => {
    let re = 0, imag = 0, p1 = 0, p2 = 0;
    for (let i = 0; i < N; i++) {
      const x = -L + i * h;
      const a1 = Math.exp(-(x * x) / (wz * wz)), ph1 = (-k * x * x) / (2 * Rz);
      const a2 = Math.exp(-((x - offset) ** 2) / (w2 * w2)), ph2 = -phaseSlope * x;
      // E₁ E₂*: amplitude a₁a₂, phase ph₁ − ph₂.
      re += a1 * a2 * Math.cos(ph1 - ph2);
      imag += a1 * a2 * Math.sin(ph1 - ph2);
      p1 += a1 * a1;
      p2 += a2 * a2;
    }
    return (re * re + imag * imag) / (p1 * p2);
  };
  const numeric = overlap1D(d, k * theta) * overlap1D(0, 0);
  const closed = gaussianCoupling({ w1, w2, lambda, n, offset: d, tilt: theta, gap: z });
  assertRel(closed, numeric, 1e-9, "combined joint");
  assert.ok(closed < 0.9 && closed > 0.5, `combined joint in a non-trivial range: ${closed}`);
});

test("Edge cases: perfect joint, invalid input, zero transmission", () => {
  assert.equal(gaussianCoupling({ w1: 5 * um, w2: 5 * um, lambda }), 1);
  assert.ok(Number.isNaN(gaussianCoupling({ w1: 0, w2: 5 * um, lambda })));
  assert.ok(Number.isNaN(gaussianCoupling({ w1: 5 * um, w2: 5 * um, lambda, n: 0.5 })));
  assert.ok(Number.isNaN(gaussianCoupling({ w1: 5 * um, w2: 5 * um, lambda, gap: -1e-6 })));
  assert.equal(lossDb(0), Infinity);
  assert.ok(Number.isNaN(lossDb(1.5)));
});

test("Return loss of a flat end face (Fresnel) and the n₁ = n₂ guard", () => {
  // R = ((1.4682 − 1)/(1.4682 + 1))² = 0.035984 → RL = 14.439 dB.
  assertRel(stepReflectance(1.4682, 1), 0.035984, 1e-4, "R glass/air");
  assertRel(returnLossDb(stepReflectance(1.4682, 1)), 14.439, 1e-4, "RL glass/air");
  assert.equal(stepReflectance(1.4682, 1.4682), 0);
  assert.equal(returnLossDb(stepReflectance(1.4682, 1.4682)), Infinity);
});

test("Angled end face: Fresnel at α times tilt back-coupling at 2α", () => {
  const n1 = 1.4682, w = 5.2 * um, a = (8 * Math.PI) / 180;
  // Independent check: unpolarized Fresnel at 8° from Snell's law, times exp(−(2π n₁ w α/λ)²).
  const t = Math.asin((n1 * Math.sin(a)) / 1);
  const rs = (n1 * Math.cos(a) - Math.cos(t)) / (n1 * Math.cos(a) + Math.cos(t));
  const rp = (Math.cos(a) - n1 * Math.cos(t)) / (Math.cos(a) + n1 * Math.cos(t));
  const back = Math.exp(-(((2 * Math.PI * n1 * w * a) / lambda) ** 2));
  const R = angledFaceReflectance(n1, 1, a, w, lambda);
  assertRel(R, ((rs * rs + rp * rp) / 2) * back, 1e-10, "8° APC face");
  // (2π·1.4682·5.2·0.139626/1.55)² = 18.659 → RL ≈ 14.44 + 81.0 ≈ 95.5 dB.
  assertRel(returnLossDb(R), 95.49, 2e-3, "RL of 8° face");
  assertRel(angledFaceReflectance(n1, 1, 0, w, lambda), stepReflectance(n1, 1), 1e-12, "α = 0 is a flat face");
  assert.ok(Number.isNaN(angledFaceReflectance(n1, 1, (44 * Math.PI) / 180, w, lambda)), "TIR above 42.9°");
});

test("Gap etalon (Airy): contact, quarter-wave maximum, index matching", () => {
  const nf = 1.468, R = stepReflectance(nf, 1);
  assert.equal(gapEtalonTransmission(nf, 1, 0, lambda), 1);
  // Quarter-wave air gap: T_min = ((1 − R)/(1 + R))², R = 0.035964 → 0.86594 (0.6250 dB).
  assertRel(gapEtalonTransmission(nf, 1, lambda / 4, lambda), ((1 - R) / (1 + R)) ** 2, 1e-12, "quarter wave");
  assertRel(lossDb(gapEtalonTransmission(nf, 1, lambda / 4, lambda)), 0.6250, 1e-3, "quarter-wave loss");
  assertRel(gapEtalonTransmission(nf, 1, lambda / 2, lambda), 1, 1e-12, "half-wave resonance");
  assert.equal(gapEtalonTransmission(nf, nf, 1e-6, lambda), 1);
});

test("Tilt sign matters with a gap; the worst-tilt helper takes the unfavourable sense", () => {
  // MFD 9 µm, 1550 nm, air, d = 1 µm, θ = 1°, z = 20 µm. Physics review, session 44: 0.498 dB (+θ), 0.640 dB (−θ).
  const w = 4.5 * um, j = { w1: w, w2: w, lambda, offset: 1 * um, gap: 20 * um };
  const plus = lossDb(gaussianCoupling({ ...j, tilt: Math.PI / 180 }));
  const minus = lossDb(gaussianCoupling({ ...j, tilt: -Math.PI / 180 }));
  assertRel(plus, 0.498, 3e-3, "+θ");
  assertRel(minus, 0.640, 3e-3, "−θ");
  assert.equal(lossDb(gaussianCouplingWorstTilt({ ...j, tilt: Math.PI / 180 })), minus);
  assert.equal(lossDb(gaussianCouplingWorstTilt({ ...j, tilt: -Math.PI / 180 })), minus);
  // No gap: the sign drops out.
  assertRel(gaussianCoupling({ ...j, gap: 0, tilt: 0.01 }), gaussianCoupling({ ...j, gap: 0, tilt: -0.01 }), 1e-12, "z = 0");
});

test("Airy × Gaussian gap factor vs a coherent sum of multiply reflected Gaussian beams", () => {
  // Pass m crosses the gap 2m + 1 times. Equal-waist amplitude overlap after a path L in index n (derived from the
  // q-parameter, Kogelnik & Li 1966): c(L) = e^(−ikL) / (1 − iL/(2z_R)), |c|² = 1/(1 + (L/2z_R)²).
  // Each round trip reflects twice at gap/fibre faces with r = (n_f − n_g)/(n_f + n_g); t t' = 1 − r².
  const nf = 1.447, ng = 1, w = 4.5 * um;
  const k = (2 * Math.PI * ng) / lambda, zR = (Math.PI * ng * w * w) / lambda, r = (nf - ng) / (nf + ng);
  const multipass = (z: number) => {
    let re = 0, imag = 0;
    for (let m = 0; m < 40; m++) {
      const L = (2 * m + 1) * z, a = r ** (2 * m) * (1 - r * r);
      // c(L) = e^(−ikL)(1 + iL/2z_R)/(1 + (L/2z_R)²)
      const u = L / (2 * zR), den = 1 + u * u;
      const cr = Math.cos(k * L), ci = -Math.sin(k * L);
      re += (a * (cr - ci * u)) / den;
      imag += (a * (ci + cr * u)) / den;
    }
    return re * re + imag * imag;
  };
  for (const [z_um, tol_dB] of [[0.3875, 1e-3], [1, 0.01], [5, 0.02]] as const) {
    const z = z_um * um;
    const product = gapEtalonTransmission(nf, ng, z, lambda) * gaussianCoupling({ w1: w, w2: w, lambda, n: ng, gap: z });
    const diff = Math.abs(lossDb(product) - lossDb(multipass(z)));
    assert.ok(diff < tol_dB, `z = ${z_um} µm: ${lossDb(product)} vs ${lossDb(multipass(z))} dB`);
  }
});

test("Flat-face return loss with the phase index of SMF-28 (≈ 1.447 at 1550 nm)", () => {
  // R = (0.447/2.447)² = 0.033369 → 14.766 dB.
  assertRel(returnLossDb(stepReflectance(1.447, 1)), 14.766, 1e-4, "RL n = 1.447");
});
