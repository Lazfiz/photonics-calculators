import test from "node:test";
import assert from "node:assert/strict";

import {
  filmPsiDelta,
  filmThicknessPeriod,
  pseudoOpticalConstants,
  transparentFilmThickness,
} from "../src/physics/thin-film/ellipsometry";
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

test("ambient|film|substrate: SiO₂ on Si at 70°, 632.8 nm (Azzam & Bashara ch. 4)", () => {
  const lam = 632.8e-9;
  const th = 70 * DEG;
  const si = { n: 3.882, k: 0.019 };
  // Hand calculation: D_φ = λ / (2√(n₁² − sin²φ₀)) = 632.8 / (2√(2.122849 − 0.883022)) = 284.155 nm.
  close(filmThicknessPeriod(th, lam, 1.457) * 1e9, 284.1554, 1e-4, "D_φ");
  for (const dnm of [0, 2, 10, 50, 100, 140, 200]) {
    const f = filmPsiDelta(dnm * 1e-9, th, lam, 1.457, si);
    // Independent forward model: the characteristic matrix (e^(−iωt), N = n + iκ, r_p = r_s at normal incidence)
    // gives ρ_Nebraska = conj(−r_p/r_s).
    const stack = { incident: 1, layers: [{ n: 1.457, thickness: dnm * 1e-9 }], substrate: si };
    const rp = stackResponse(stack, lam, th, "p").r;
    const rs = stackResponse(stack, lam, th, "s").r;
    const d2 = rs.re * rs.re + rs.im * rs.im;
    const rho = { re: -(rp.re * rs.re + rp.im * rs.im) / d2, im: (rp.im * rs.re - rp.re * rs.im) / d2 };
    let delta = Math.atan2(rho.im, rho.re);
    if (delta < 0) delta += 2 * Math.PI;
    close(f.psi, Math.atan(Math.hypot(rho.re, rho.im)), 1e-10, `Ψ at ${dnm} nm`);
    close(f.delta, delta, 1e-10, `Δ at ${dnm} nm`);
    // Inversion recovers the thickness, with |X| = 1 for consistent data.
    const inv = transparentFilmThickness(f.psi, f.delta, th, lam, 1.457, si);
    close(inv.thickness * 1e9, dnm, 1e-6, `d at ${dnm} nm`);
    close(inv.absX, 1, 1e-9, `|X| at ${dnm} nm`);
  }
  // 100 nm: Ψ = 41.055°, Δ = 79.787° (both forward models above agree to 1e-10 rad).
  const f100 = filmPsiDelta(100e-9, th, lam, 1.457, si);
  close(f100.psi / DEG, 41.0550, 1e-4, "Ψ(100 nm)");
  close(f100.delta / DEG, 79.7873, 1e-4, "Δ(100 nm)");
  // Thicker films come back modulo D_φ: 300 nm → 15.845 nm.
  const f300 = filmPsiDelta(300e-9, th, lam, 1.457, si);
  close(transparentFilmThickness(f300.psi, f300.delta, th, lam, 1.457, si).thickness * 1e9, 300 - 284.1554, 1e-4, "d mod D_φ");
  // The page's bare-Si default (Ψ, Δ rounded to 3 decimals) reads as a slightly negative thickness, not one period.
  const bare = transparentFilmThickness(10.573 * DEG, 179.23 * DEG, th, lam, 1.457, si);
  assert.ok(Math.abs(bare.thickness) < 0.01e-9, `bare: ${bare.thickness}`);
  // A wrong film index leaves |X| off 1: n₁ = 1.50 assumed for the 100 nm SiO₂ data gives |X| = 1.073.
  close(transparentFilmThickness(f100.psi, f100.delta, th, lam, 1.5, si).absX, 1.07346, 1e-5, "|X| for a wrong index");
});

test("film inversion guards", () => {
  const si = { n: 3.882, k: 0.019 };
  const th = 70 * DEG;
  // Evanescent film (n₁ ≤ n₀ sin φ₀ = 0.940), λ ≤ 0, and Ψ = 90° are rejected.
  assert.ok(Number.isNaN(filmThicknessPeriod(th, 633e-9, 0.9)));
  assert.ok(Number.isNaN(transparentFilmThickness(0.5, 1, th, 0, 1.457, si).thickness));
  assert.ok(Number.isNaN(transparentFilmThickness(Math.PI / 2, 1, th, 633e-9, 1.457, si).thickness));
  assert.ok(Number.isNaN(filmPsiDelta(-1e-9, th, 633e-9, 1.457, si).psi));
  // Lossless substrate below its critical angle (n = 0.5, k = 0 at 70°): the evanescent branch. Ψ = 45°, Δ = 95.984° from the
  // physics-reviewer's independent Airy model (e^(−iωt), converted), and the same from the characteristic matrix here.
  const tir = filmPsiDelta(50e-9, th, 632.8e-9, 1.457, { n: 0.5, k: 0 });
  close(tir.psi / DEG, 45, 1e-9, "Ψ, TIR substrate");
  close(tir.delta / DEG, 95.984, 1e-3, "Δ, TIR substrate");
  const st = { incident: 1, layers: [{ n: 1.457, thickness: 50e-9 }], substrate: { n: 0.5, k: 0 } };
  const rp = stackResponse(st, 632.8e-9, th, "p").r;
  const rs = stackResponse(st, 632.8e-9, th, "s").r;
  // arg ρ_Nebraska = −arg(−r_p/r_s) = π − arg r_p + arg r_s (mod 2π)
  const dTM = (((Math.PI - Math.atan2(rp.im, rp.re) + Math.atan2(rs.im, rs.re)) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  close(tir.delta, dTM, 1e-10, "Δ, TIR substrate vs characteristic matrix");
  // A film index equal to the ambient's leaves X undetermined (r₀₁ = 0).
  const f = filmPsiDelta(100e-9, th, 633e-9, 1.457, si);
  assert.ok(Number.isNaN(transparentFilmThickness(f.psi, f.delta, th, 633e-9, 1, si).thickness));
});
