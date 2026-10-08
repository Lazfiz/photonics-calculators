import test from "node:test";
import assert from "node:assert/strict";

import { pseudoOpticalConstants } from "../src/physics/thin-film/ellipsometry";
import { stackResponse } from "../src/physics/thin-film/transfer-matrix";

const DEG = Math.PI / 180;

function close(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

// Azzam & Bashara, Ellipsometry and Polarized Light, ch. 4: ⟨ε⟩ = sin²θ [1 + tan²θ ((1 − ρ)/(1 + ρ))²].
test("ellipsometry: hand values of the two-phase inversion", () => {
  // Glass at its Brewster angle: r_p = 0, so Ψ = 0 and ⟨ε⟩ = sin²θ (1 + tan²θ) = tan²θ_B = n².
  const b = pseudoOpticalConstants(0, Math.PI, Math.atan(1.5));
  close(b.eps1, 2.25, 1e-14, "Brewster ε₁");
  close(b.n, 1.5, 1e-14, "Brewster n");
  close(b.k, 0, 1e-14, "Brewster k");
  // Ψ = 45°, Δ = 90° at 60°: ρ = i, ((1 − i)/(1 + i))² = −1, ⟨ε⟩ = 0.75 (1 − 3) = −1.5,
  // a lossless metal (|r_p| = |r_s| = 1) with n = 0 and k = √1.5.
  const m = pseudoOpticalConstants(45 * DEG, 90 * DEG, 60 * DEG);
  close(m.eps1, -1.5, 1e-14, "metal ε₁");
  close(m.eps2, 0, 1e-14, "metal ε₂");
  close(m.n, 0, 1e-7, "metal n");
  close(m.k, Math.sqrt(1.5), 1e-14, "metal k"); // 1.2247449
});

test("ellipsometry: inverting the transfer matrix's ρ recovers the substrate (Nebraska convention)", () => {
  // The module uses e^(−iωt), N = n + iκ and r_p = r_s at normal incidence. The Nebraska ρ is the
  // complex conjugate of −r_p/r_s.
  const substrates: Array<[number, number]> = [[1.52, 0], [3.882, 0.019], [1.2, 7.0], [0.13, 3.5]];
  for (const [n, k] of substrates) {
    for (const deg of [55, 70, 80]) {
      const st = { incident: 1, layers: [], substrate: { n, k } };
      const rs = stackResponse(st, 633e-9, deg * DEG, "s").r;
      const rp = stackResponse(st, 633e-9, deg * DEG, "p").r;
      const d2 = rs.re ** 2 + rs.im ** 2;
      const re = -(rp.re * rs.re + rp.im * rs.im) / d2;
      const im = (rp.im * rs.re - rp.re * rs.im) / d2; // conj(−r_p/r_s)
      const psi = Math.atan(Math.hypot(re, im));
      const delta = Math.atan2(im, re);
      if (k > 0) assert.ok(delta > 0 && delta < Math.PI, `absorber Δ in (0°, 180°): ${n}+${k}i @${deg}°`);
      const out = pseudoOpticalConstants(psi, delta, deg * DEG);
      close(out.n, n, 1e-10, `n ${n}+${k}i @${deg}°`);
      close(out.k, k, 1e-10, `k ${n}+${k}i @${deg}°`);
      close(out.eps1, n * n - k * k, 1e-9, `ε₁ ${n}+${k}i @${deg}°`);
      close(out.eps2, 2 * n * k, 1e-9, `ε₂ ${n}+${k}i @${deg}°`);
    }
  }
});

test("ellipsometry: invalid inputs give NaN", () => {
  assert.ok(Number.isNaN(pseudoOpticalConstants(45 * DEG, Math.PI, 70 * DEG).n), "ρ = −1");
  assert.ok(Number.isNaN(pseudoOpticalConstants(30 * DEG, 0, 0).n), "normal incidence");
  assert.ok(Number.isNaN(pseudoOpticalConstants(90 * DEG, 0, 70 * DEG).n), "Ψ = 90°");
  assert.ok(Number.isNaN(pseudoOpticalConstants(30 * DEG, NaN, 70 * DEG).n), "Δ NaN");
});
