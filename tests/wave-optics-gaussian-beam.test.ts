import test from "node:test";
import assert from "node:assert/strict";

import {
  beamParameterProduct, beamRadius, divergenceHalfAngle, gouyPhase, m2FromWaistDivergence, rayleighRange,
  wavefrontRadius,
} from "../src/physics/wave-optics/gaussian-beam";
import {
  determinant, elementMatrix, expectedDeterminant, systemMatrix, traceRay, type AbcdElement,
} from "../src/physics/wave-optics/abcd";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("Gaussian beam: Rayleigh range, divergence and BPP (Kogelnik & Li 1966)", () => {
  // λ 1550 nm, w₀ 10 µm: z_R = π (10 µm)² / 1550 nm = 0.2026834 mm, θ = λ/(π w₀) = 49.33803 mrad.
  const b = { lambda: 1550e-9, w0: 10e-6 };
  assertRel(rayleighRange(b), 2.026833970e-4, 1e-9, "z_R");
  assertRel(divergenceHalfAngle(b), 4.933803236e-2, 1e-9, "θ");
  assertRel(beamParameterProduct(b), 1550e-9 / Math.PI, 1e-12, "BPP = λ/π");
  // Embedded Gaussian (Siegman 1990): M² = 2 halves z_R and doubles θ.
  assertRel(rayleighRange({ ...b, m2: 2 }), 1.013416985e-4, 1e-9, "z_R / M²");
  assertRel(divergenceHalfAngle({ ...b, m2: 2 }), 9.867606472e-2, 1e-9, "M² θ");
});

test("Gaussian beam: w(z), R(z) and Gouy phase ψ(z) (Feng & Winful 2001)", () => {
  // λ 1064 nm, w₀ 0.5 mm: z_R = π (0.5 mm)²/1064 nm = 738.1562 mm. At z = 100 mm, ψ = arctan(100/738.1562) = 7.71504°,
  // w = 0.5 mm √(1 + 0.0183527) = 0.5045674 mm, R = 100 mm + z_R²/100 mm = 5548.745 mm.
  const b = { lambda: 1064e-9, w0: 0.5e-3 };
  const zR = rayleighRange(b);
  assertRel(zR, 0.7381561686, 1e-9, "z_R");
  assertRel((gouyPhase(b, 0.1) * 180) / Math.PI, 7.715044350, 1e-9, "ψ(100 mm)");
  assertRel(beamRadius(b, 0.1), 5.045673516e-4, 1e-9, "w(100 mm)");
  assertRel(wavefrontRadius(b, 0.1), 5.548745293, 1e-9, "R(100 mm)");
  // At z = ±z_R: ψ = ±π/4, w = √2 w₀, |R| = 2 z_R (its minimum). The total Gouy shift through focus tends to π.
  assertRel(gouyPhase(b, zR), Math.PI / 4, 1e-12, "ψ(z_R)");
  assertRel(gouyPhase(b, -zR), -Math.PI / 4, 1e-12, "ψ(−z_R)");
  assertRel(beamRadius(b, zR), Math.SQRT2 * 0.5e-3, 1e-12, "w(z_R)");
  assertRel(wavefrontRadius(b, -zR), -2 * zR, 1e-12, "R(−z_R)");
  assertRel(gouyPhase(b, 1e9) - gouyPhase(b, -1e9), Math.PI, 1e-9, "Δψ far field");
});

test("Gaussian beam: edge cases (waist, invalid inputs)", () => {
  const b = { lambda: 1064e-9, w0: 0.5e-3 };
  assert.equal(wavefrontRadius(b, 0), Infinity);
  assert.equal(gouyPhase(b, 0), 0);
  assert.equal(beamRadius(b, 0), 0.5e-3);
  assert.ok(Number.isNaN(rayleighRange({ lambda: 0, w0: 1e-3 })));
  assert.ok(Number.isNaN(beamRadius({ lambda: 1e-6, w0: -1e-3 }, 0)));
  assert.ok(Number.isNaN(gouyPhase(b, NaN)));
});

test("M² from waist and far-field half angle (Siegman 1990, ISO 11146-1)", () => {
  // 1064 nm, w₀ 0.5 mm, θ 1 mrad: M² = π · 0.5 mm · 1 mrad / 1064 nm = 1.476312.
  assertRel(m2FromWaistDivergence(1064e-9, 0.5e-3, 1e-3), 1.476312337, 1e-9, "M²");
  // A TEM₀₀ beam returns exactly 1; a smaller θ gives the (impossible) M² < 1, returned unclamped.
  assertRel(m2FromWaistDivergence(1064e-9, 0.5e-3, 1064e-9 / (Math.PI * 0.5e-3)), 1, 1e-12, "TEM₀₀");
  assert.ok(m2FromWaistDivergence(1064e-9, 0.5e-3, 0.5e-3) < 1);
  assert.ok(Number.isNaN(m2FromWaistDivergence(1064e-9, 0.5e-3, 0)));
});

test("ABCD: element matrices and systems (Kogelnik & Li 1966, table I)", () => {
  const f = 0.05;
  // 2f–2f imaging: d = 2f, lens f, d = 2f → [[−1, 0], [−1/f, −1]], an inverted image at unit magnification.
  const imaging = systemMatrix([{ kind: "space", d: 2 * f }, { kind: "lens", f }, { kind: "space", d: 2 * f }]);
  assert.deepEqual(imaging, { A: -1, B: 0, C: -20, D: -1 });
  // A parallel ray through a lens and one focal length of space crosses the axis: y = 0, θ = −y₀/f.
  const focus = traceRay(systemMatrix([{ kind: "lens", f }, { kind: "space", d: f }]), 1e-3, 0);
  assert.ok(Math.abs(focus.y) < 1e-18);
  assertRel(focus.theta, -0.02, 1e-12, "θ at focus");
  // A concave mirror of radius R acts as a lens of focal length R/2.
  assert.deepEqual(elementMatrix({ kind: "curved-mirror", R: 0.2 }), elementMatrix({ kind: "lens", f: 0.1 }));
  // Flat interface n₁ → n₂ (real angles): Snell's law n₁θ₁ = n₂θ₂, det = n₁/n₂.
  const glass: AbcdElement[] = [{ kind: "space", d: 0.01 }, { kind: "interface", n1: 1, n2: 1.5 }];
  const M = systemMatrix(glass);
  assertRel(traceRay(M, 0, 0.003).theta, 0.002, 1e-12, "refracted θ");
  assertRel(determinant(M), expectedDeterminant(glass), 1e-12, "det = n₁/n₂");
  assertRel(expectedDeterminant(glass), 2 / 3, 1e-12, "n₁/n₂");
  // Non-physical parameters give NaN rather than a matrix.
  assert.ok(Number.isNaN(elementMatrix({ kind: "lens", f: 0 }).C));
  assert.ok(Number.isNaN(elementMatrix({ kind: "space", d: -1 }).B));
  assert.ok(Number.isNaN(elementMatrix({ kind: "interface", n1: 1, n2: 0 }).D));
});
