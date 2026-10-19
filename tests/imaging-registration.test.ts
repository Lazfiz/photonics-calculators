import test from "node:test";
import assert from "node:assert/strict";

import {
  blendWeight,
  displacementMax,
  displacementRms,
  fiducialRegistrationError,
  globalStitchError,
  sequentialStitchError,
  targetRegistrationError,
  tileGrid,
  transformMatrix,
  translationCrlb,
} from "../src/physics/imaging/registration";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const deg = Math.PI / 180;

test("RMS displacement of a rigid transform over the image (hand calculation)", () => {
  // t = (5, 3) px, θ = 2°, L = 512 px: ⟨|d|²⟩ = 34 + 4sin²(1°)·512²/6 = 87.23 px², × 100 nm/px → 934.0 nm.
  const a = transformMatrix("rigid", 2 * deg);
  assertRel(displacementRms(a, 5, 3, 512) * 100, 934.0, 1e-4, "RMS displacement");
  // The old page used the edge rotation θ·L/2 and got 1067 nm. The largest move is at a corner: R·x − x + t.
  const c = Math.cos(2 * deg);
  const s = Math.sin(2 * deg);
  const corner = Math.max(...[[256, 256], [256, -256], [-256, 256], [-256, -256]].map(([x, y]) =>
    Math.hypot(c * x - s * y - x + 5, s * x + c * y - y + 3)));
  assertRel(displacementMax(a, 5, 3, 512), corner, 1e-12, "corner displacement");
  // Rotation alone moves every corner by 2sin(θ/2)·L/√2.
  assertRel(displacementMax(a, 0, 0, 512), 2 * Math.sin(deg) * 256 * Math.SQRT2, 1e-12, "corner rotation");
  // A pure translation moves every pixel by |t|; the identity moves nothing.
  assertRel(displacementRms(transformMatrix("affine", 0), 3, 4, 512), 5, 1e-12, "translation only");
  assert.equal(displacementRms(transformMatrix("similarity", 0, 1), 0, 0, 512), 0);
  // Scale s alone: ‖A − I‖²_F = 2(s − 1)², RMS = |s − 1|·L/√6.
  assertRel(displacementRms(transformMatrix("similarity", 0, 1.02), 0, 0, 512), 0.02 * 512 / Math.sqrt(6), 1e-12, "scale");
  assert.ok(Number.isNaN(displacementRms(a, 0, 0, 0)));
  assert.ok(Number.isNaN(transformMatrix("affine", 0, 1, Math.PI / 2)[0]));
});

test("2-D point-based TRE and FRE (Fitzpatrick, West & Maurer 1998, 10.1109/42.736021)", () => {
  // TRE² = (FLE²/N)(1 + m·d²/(2f²)), m = 1, 2, 4; FLE 1 px, N = 4, f = d = 100 px.
  const base = { n: 4, fle: 1, fiducialRms: 100, targetDistance: 100 };
  assertRel(targetRegistrationError({ model: "rigid", ...base }), Math.sqrt(1.5 / 4), 1e-12, "rigid");
  assertRel(targetRegistrationError({ model: "similarity", ...base }), Math.sqrt(2 / 4), 1e-12, "similarity");
  assertRel(targetRegistrationError({ model: "affine", ...base }), Math.sqrt(3 / 4), 1e-12, "affine");
  // At the centroid only the translation error FLE/√N remains.
  assertRel(targetRegistrationError({ model: "affine", ...base, targetDistance: 0 }), 0.5, 1e-12, "centroid");
  // FRE² = FLE²(1 − p/(2N)): rigid 1 − 3/8; affine with N = 3 fits exactly.
  assertRel(fiducialRegistrationError("rigid", 4, 1), Math.sqrt(5 / 8), 1e-12, "FRE rigid");
  assert.equal(fiducialRegistrationError("affine", 3, 1), 0);
  assert.ok(Number.isNaN(targetRegistrationError({ model: "affine", ...base, n: 2 })), "affine needs 3 points");
  assert.ok(Number.isNaN(fiducialRegistrationError("rigid", 1, 1)), "rigid needs 2 points");
});

test("rigid TRE matches a Monte Carlo Procrustes fit", () => {
  // Independent check of the 2-D derivation: least-squares rotation + translation on noisy fiducials.
  let seed = 12345;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const pts = [[-200, -150], [180, -120], [60, 210], [-90, 40], [230, 160], [-160, 200]];
  const n = pts.length;
  const cx = pts.reduce((s, p) => s + p[0], 0) / n;
  const cy = pts.reduce((s, p) => s + p[1], 0) / n;
  const p0 = pts.map(([x, y]) => [x - cx, y - cy]);
  const f = Math.sqrt(p0.reduce((s, [x, y]) => s + x * x + y * y, 0) / n);
  const target = [250, 0];
  const sigma = 1;
  const trials = 20000;
  let se = 0;
  for (let k = 0; k < trials; k++) {
    let sc = 0, ss = 0, mx = 0, my = 0;
    for (const [x, y] of p0) {
      const qx = x + sigma * gauss();
      const qy = y + sigma * gauss();
      sc += x * qx + y * qy;
      ss += x * qy - y * qx;
      mx += qx / n;
      my += qy / n;
    }
    const th = Math.atan2(ss, sc);
    const ex = Math.cos(th) * target[0] - Math.sin(th) * target[1] + mx - target[0];
    const ey = Math.sin(th) * target[0] + Math.cos(th) * target[1] + my - target[1];
    se += ex * ex + ey * ey;
  }
  const predicted = targetRegistrationError({ model: "rigid", n, fle: sigma * Math.SQRT2, fiducialRms: f, targetDistance: 250 });
  assertRel(Math.sqrt(se / trials), predicted, 0.03, "Monte Carlo TRE");
});

test("translation Cramér–Rao bound (Robinson & Milanfar 2004, 10.1109/TIP.2004.832923)", () => {
  // ℓ/(SNR·√N_px): ℓ = 2 px, SNR 10, 512² px → 2/(10·512) px.
  assertRel(translationCrlb(10, 2, 512 * 512), 2 / 5120, 1e-12, "CRLB");
  assert.ok(Number.isNaN(translationCrlb(0, 2, 100)));
});

test("tile grid geometry (5 × 5 tiles of 512², 10 % overlap)", () => {
  const g = tileGrid({ cols: 5, rows: 5, tileWidth: 512, tileHeight: 512, overlap: 0.1 });
  // round(51.2) = 51 px; 5·512 − 4·51 = 2356; η = 2356²/(25·512²) = 84.70 %.
  assert.equal(g.overlapX, 51);
  assert.equal(g.width, 2356);
  assert.equal(g.height, 2356);
  assertRel(g.efficiency, 0.8469751, 1e-6, "efficiency");
  // Rectangular tiles overlap by a fraction of their own height.
  const r = tileGrid({ cols: 3, rows: 2, tileWidth: 1000, tileHeight: 500, overlap: 0.2 });
  assert.equal(r.overlapY, 100);
  assert.equal(r.height, 900);
  assert.equal(tileGrid({ cols: 4, rows: 4, tileWidth: 64, tileHeight: 64, overlap: 0 }).efficiency, 1);
  assert.ok(Number.isNaN(tileGrid({ cols: -1, rows: 5, tileWidth: 512, tileHeight: 512, overlap: 0.1 }).width));
});

test("blend weights sum to one", () => {
  for (const t of [0, 0.25, 0.5, 0.9]) {
    for (const p of ["linear", "cosine"] as const) assertRel(blendWeight(p, t) + (1 - blendWeight(p, t)), 1, 1e-15, p);
  }
  assertRel(blendWeight("cosine", 0.5), 0.5, 1e-12, "cos² at mid-overlap");
  assertRel(blendWeight("cosine", 0.25), Math.cos(Math.PI / 8) ** 2, 1e-12, "cos²");
  assert.equal(blendWeight("linear", 2), 0);
});

test("stitching error: chain √(i + j) vs global effective resistance (Barooah & Hespanha 2007)", () => {
  // A 1 × 5 chain is a tree: the global solution equals the chain, R_eff = 4.
  assertRel(globalStitchError(5, 1).max, 2, 1e-12, "chain");
  // 2 × 2 grid: two parallel paths of 2 edges → R_eff(corner, opposite corner) = 1; neighbours 3/4.
  const g2 = globalStitchError(2, 2);
  assertRel(g2.max, 1, 1e-12, "2×2 opposite corner");
  assertRel(g2.perTile[1], Math.sqrt(3 / 4), 1e-12, "2×2 neighbour");
  // 3 × 3 node grid of unit resistors, corner to corner: 3/2.
  assertRel(globalStitchError(3, 3).max, Math.sqrt(1.5), 1e-12, "3×3 corner to corner");
  // Chained 5 × 5 grid: farthest tile sums 8 offsets.
  assertRel(sequentialStitchError(5, 5).max, Math.sqrt(8), 1e-12, "chain 5×5");
  assert.equal(globalStitchError(1, 1).max, 0);
  assert.equal(globalStitchError(51, 50).perTile.length, 0);
  assert.ok(Number.isNaN(sequentialStitchError(0, 3).max));
});
