import test from "node:test";
import assert from "node:assert/strict";

import { dualBandReflectance, fitDualBandAr } from "../src/physics/thin-film/dual-band-ar";

// Two-layer V-coat: R = 0 at λ for an outer layer n₁ and inner layer n₂ on n_s in n₀ when
//   tan²δ₁ = (n_s − n₀)(n₀n_s − n₂²) n₁² / ((n₁²n_s − n₀n₂²)(n₁² − n₀n_s)),
//   tan δ₂ = tan δ₁ · n₂(n₁² − n₀n_s) / (n₁(n₀n_s − n₂²)),
// from C/B = n₀ with the characteristic matrices (Macleod, Thin-Film Optical Filters, 4th ed., ch. 4, the
// two-layer V-coat), re-derived for this test. δ = 2πnd/λ, taken in (0, π).
function vCoat(n0: number, n1: number, n2: number, ns: number, lambda: number): [number, number][] {
  const t1sq = ((ns - n0) * (n0 * ns - n2 * n2) * n1 * n1) / ((n1 * n1 * ns - n0 * n2 * n2) * (n1 * n1 - n0 * ns));
  const ratio = (n2 * (n1 * n1 - n0 * ns)) / (n1 * (n0 * ns - n2 * n2));
  const angle = (t: number) => (t >= 0 ? Math.atan(t) : Math.PI + Math.atan(t));
  return [1, -1].map((sign) => {
    const t1 = sign * Math.sqrt(t1sq);
    const d1 = (angle(t1) * lambda) / (2 * Math.PI * n1);
    const d2 = (angle(t1 * ratio) * lambda) / (2 * Math.PI * n2);
    return [d1, d2];
  });
}

test("dual-band AR: with λ₁ = λ₂ the fit finds a two-layer V-coat", () => {
  const lambda = 550e-9;
  const [n0, n1, n2, ns] = [1, 1.38, 2.1, 1.52];
  const solutions = vCoat(n0, n1, n2, ns, lambda);
  // The closed form is a true zero: MgF₂ over n = 2.1 on glass, 72.76 + 113.37 nm or 126.52 + 17.58 nm.
  for (const [d1, d2] of solutions) {
    const p = { incident: n0, indices: [n1, n2], substrate: ns, lambda1: lambda, lambda2: lambda };
    assert.ok(dualBandReflectance(p, [d1, d2], lambda) < 1e-24);
  }
  const expected = [[72.755, 113.373], [126.520, 17.579]];
  solutions.forEach((s, i) => assert.ok(Math.abs(s[0] * 1e9 - expected[i][0]) < 1e-3 && Math.abs(s[1] * 1e9 - expected[i][1]) < 1e-3, `${s.map((d) => d * 1e9)}`));
  // A third layer index-matched to the substrate is absentee at any thickness; the fit must land on a V-coat.
  const fit = fitDualBandAr({ incident: n0, indices: [n1, n2, ns], substrate: ns, lambda1: lambda, lambda2: lambda });
  assert.ok(fit.R1 < 1e-12 && fit.R2 < 1e-12, `R = ${fit.R1}, ${fit.R2}`);
  const near = solutions.some(([d1, d2]) => Math.abs(fit.thicknesses[0] - d1) < 0.05e-9 && Math.abs(fit.thicknesses[1] - d2) < 0.05e-9);
  assert.ok(near, `fit ${fit.thicknesses.map((d) => (d * 1e9).toFixed(3))} nm`);
});

test("dual-band AR: 450 + 1064 nm on glass", () => {
  // The page's defaults. Quarter waves at λ₁, λ₂ and their geometric mean (the old design) leave R(1064 nm) = 12.9 %.
  const p = { incident: 1, indices: [1.38, 2.1, 1.65], substrate: 1.52, lambda1: 450e-9, lambda2: 1064e-9 };
  const qw = [450e-9 / (4 * 1.38), 1064e-9 / (4 * 2.1), Math.sqrt(450e-9 * 1064e-9) / (4 * 1.65)];
  assert.ok(Math.abs(dualBandReflectance(p, qw, 1064e-9) - 0.129) < 0.001);
  // With these indices and each layer at most a half wave at 1064 nm there is no double zero; the optimum (the same
  // from a 40-point grid with 20 starts) is 251.48 / 16.26 / 71.37 nm with R = 0.037 % and 0.234 %.
  const fit = fitDualBandAr(p);
  const dense = fitDualBandAr(p, 40, 20);
  assert.ok(Math.abs(fit.R1 + fit.R2 - (dense.R1 + dense.R2)) < 1e-9);
  assert.ok(Math.abs(fit.R1 - 3.698e-4) < 1e-6 && Math.abs(fit.R2 - 2.343e-3) < 1e-6, `R = ${fit.R1}, ${fit.R2}`);
  assert.ok(Math.abs(fit.thicknesses[0] * 1e9 - 251.48) < 0.01, `${fit.thicknesses[0]}`);
  // Local optimum: nudging any thickness by ±0.5 nm doesn't lower R₁ + R₂.
  const cost = (d: number[]) => dualBandReflectance(p, d, p.lambda1) + dualBandReflectance(p, d, p.lambda2);
  for (let i = 0; i < 3; i++) {
    for (const s of [-0.5e-9, 0.5e-9]) {
      const d = fit.thicknesses.slice();
      d[i] = Math.max(0, d[i] + s);
      assert.ok(cost(d) >= fit.R1 + fit.R2);
    }
  }
  // Invalid input.
  assert.ok(Number.isNaN(fitDualBandAr({ ...p, indices: [1.38, 0, 1.65] }).R1));
  assert.ok(Number.isNaN(fitDualBandAr({ ...p, lambda2: -1 }).thicknesses[0]));
});
