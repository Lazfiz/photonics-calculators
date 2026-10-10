import test from "node:test";
import assert from "node:assert/strict";

import * as cx from "../src/physics/complex";
import {
  quarterQuarterArInnerIndex,
  quarterWaveLayers,
  quarterWaveStackReflectance,
  quarterWaveThickness,
  reflectanceSpectrum,
  stackResponse,
  unpolarizedResponse,
  type Layer,
  type Stack,
} from "../src/physics/thin-film/transfer-matrix";

const NM = 1e-9;
const DEG = Math.PI / 180;

function close(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

const bare = (n0: number, ns: number): Stack => ({ incident: n0, layers: [], substrate: { n: ns } });

// Fresnel formulae for a single interface (Born & Wolf, Principles of Optics, 7th ed., §1.5.2),
// written out by hand with θt from Snell's law. Born & Wolf's r_p has the opposite sign to the
// admittance convention used by the module.
test("transfer matrix: a bare interface reproduces the Fresnel formulae", () => {
  const n0 = 1, ns = 1.52;
  const R0 = ((n0 - ns) / (n0 + ns)) ** 2; // 0.0425800 at normal incidence
  const normal = stackResponse(bare(n0, ns), 550 * NM);
  close(normal.R, R0, 1e-15, "R(0°)");
  close(normal.T, 1 - R0, 1e-15, "T(0°)");
  close(normal.A, 0, 1e-15, "A(0°)");
  close(R0, 0.04258, 1e-6, "R(0°) value");

  const ti = 45 * DEG;
  const tt = Math.asin((n0 * Math.sin(ti)) / ns);
  const rs = (n0 * Math.cos(ti) - ns * Math.cos(tt)) / (n0 * Math.cos(ti) + ns * Math.cos(tt));
  const rp = (ns * Math.cos(ti) - n0 * Math.cos(tt)) / (ns * Math.cos(ti) + n0 * Math.cos(tt));
  const s = stackResponse(bare(n0, ns), 550 * NM, ti, "s");
  const p = stackResponse(bare(n0, ns), 550 * NM, ti, "p");
  close(s.r.re, rs, 1e-15, "r_s(45°)");
  close(p.r.re, -rp, 1e-15, "r_p(45°)");
  close(s.T, 1 - rs * rs, 1e-15, "T_s(45°)");
  close(p.T, 1 - rp * rp, 1e-15, "T_p(45°)");

  // Brewster angle tan θ_B = n_s/n_0: R_p = 0.
  const brewster = stackResponse(bare(n0, ns), 550 * NM, Math.atan(ns / n0), "p");
  close(brewster.R, 0, 1e-30, "R_p(θ_B)");
});

// Beyond the critical angle the reflectance is total and nothing reaches the substrate.
test("transfer matrix: total internal reflection, glass to air at 60°", () => {
  for (const pol of ["s", "p"] as const) {
    const res = stackResponse(bare(1.52, 1), 633 * NM, 60 * DEG, pol);
    close(res.R, 1, 1e-15, `R_${pol}`);
    close(res.T, 0, 1e-15, `T_${pol}`);
  }
});

// Quarter-wave layers transform the admittance Y → n²/Y (Macleod, Thin-Film Optical Filters,
// 4th ed., ch. 2–3). At λ₀ a single layer gives R = ((n₀n_s − n₁²)/(n₀n_s + n₁²))², and a
// half-wave layer is "absentee".
test("transfer matrix: single-layer AR coatings at the design wavelength", () => {
  const wl = 550 * NM;
  const mgf2 = 1.38, ns = 1.52;
  const qw = (n: number): Stack => ({
    incident: 1,
    layers: [{ n, thickness: quarterWaveThickness(n, wl) }],
    substrate: { n: ns },
  });
  const expected = ((ns - mgf2 ** 2) / (ns + mgf2 ** 2)) ** 2; // 0.01260 (1.26 %)
  close(stackResponse(qw(mgf2), wl).R, expected, 1e-15, "MgF₂ QW");
  close(expected, 0.0126, 1e-4, "MgF₂ QW value");
  close(stackResponse(qw(Math.sqrt(ns)), wl).R, 0, 1e-30, "ideal n₁ = √n_s");

  const halfWave: Stack = { incident: 1, layers: [{ n: 2.1, thickness: 2 * quarterWaveThickness(2.1, wl) }], substrate: { n: ns } };
  close(stackResponse(halfWave, wl).R, stackResponse(bare(1, ns), wl).R, 1e-15, "half-wave absentee");
});

test("transfer matrix: quarter-wave high reflector (HL)⁵H at λ₀", () => {
  const wl = 1064 * NM, nH = 2.35, nL = 1.45, ns = 1.52, pairs = 5;
  const layers = quarterWaveLayers(Array.from({ length: 2 * pairs + 1 }, (_, i) => (i % 2 === 0 ? nH : nL)), wl);
  close(layers[1].thickness, 1064e-9 / (4 * 1.45), 1e-24, "d_L");
  // Y = (n_H/n_L)^(2p) n_H² / n_s, R = ((n₀ − Y)/(n₀ + Y))² — a hand calculation.
  const Y = (nH / nL) ** (2 * pairs) * (nH ** 2 / ns);
  const expected = ((1 - Y) / (1 + Y)) ** 2; // 0.99317
  const res = stackResponse({ incident: 1, layers, substrate: { n: ns } }, wl);
  close(res.R, expected, 1e-14, "R");
  close(res.R + res.T, 1, 1e-14, "R + T");
  close(stackResponse({ incident: 1, layers, substrate: { n: ns } }, wl, 0, "p").R, expected, 1e-14, "R_p = R_s at 0°");
});

test("transfer matrix: closed-form quarter-wave reflectance agrees with the matrix", () => {
  const wl = 700 * NM;
  const designs: [string, number[]][] = [
    ["MgF₂", [1.38]],
    ["(HL)⁷", Array.from({ length: 14 }, (_, i) => (i % 2 === 0 ? 2.35 : 1.45))],
    ["(LH)⁵", Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? 1.45 : 2.35))],
    ["V-coat", [1.38, 2.1]],
  ];
  for (const [label, indices] of designs) {
    const matrix = stackResponse({ incident: 1, layers: quarterWaveLayers(indices, wl), substrate: { n: 1.52 } }, wl).R;
    close(quarterWaveStackReflectance(1, indices, 1.52), matrix, 1e-14, label);
  }
  // (HL)⁷ on 1.52: Y = (2.35/1.45)^14 · 1.52 ≈ 1303.6, R = ((1 − Y)/(1 + Y))² ≈ 0.99694
  close(quarterWaveStackReflectance(1, designs[1][1], 1.52), ((1 - 1.52 * (2.35 / 1.45) ** 14) / (1 + 1.52 * (2.35 / 1.45) ** 14)) ** 2, 1e-15, "(HL)⁷ formula");
  assert.ok(Number.isNaN(quarterWaveStackReflectance(1, [0], 1.52)), "n = 0");
});

// Macleod, Thin-Film Optical Filters, 4th ed., ch. 4: a quarter-quarter coating (outer n₁, inner n₂)
// has Y = n₁² n_s / n₂², so R(λ₀) = 0 when n₂ = n₁ √(n_s/n₀). MgF₂ on 1.52 glass: n₂ = 1.38 √1.52 = 1.70138.
test("transfer matrix: quarter-quarter AR inner index gives zero reflectance at λ₀", () => {
  const wl = 550 * NM;
  const n2 = quarterQuarterArInnerIndex(1, 1.38, 1.52);
  close(n2, 1.70138, 1e-5, "n₂ in air");
  close(quarterWaveStackReflectance(1, [1.38, n2], 1.52), 0, 1e-30, "closed form");
  close(stackResponse({ incident: 1, layers: quarterWaveLayers([1.38, n2], wl), substrate: { n: 1.52 } }, wl).R, 0, 1e-15, "matrix");
  // Immersed in water (n₀ = 1.33) the inner layer must be lower.
  const n2w = quarterQuarterArInnerIndex(1.33, 1.38, 1.52);
  close(stackResponse({ incident: 1.33, layers: quarterWaveLayers([1.38, n2w], wl), substrate: { n: 1.52 } }, wl).R, 0, 1e-15, "in water");
  assert.ok(Number.isNaN(quarterQuarterArInnerIndex(0, 1.38, 1.52)), "n₀ = 0");
});

// One absorbing film: sum of the multiply reflected waves (Airy), Born & Wolf §1.6.4 and §14.4:
//   r = (r₀₁ + r₁₂ e^(2iβ)) / (1 + r₀₁ r₁₂ e^(2iβ)),  t = t₀₁ t₁₂ e^(iβ) / (1 + r₀₁ r₁₂ e^(2iβ)),
// with β = k₀ N₁ d cos θ₁, s-polarized r_ij = (q_i − q_j)/(q_i + q_j), t_ij = 2q_i/(q_i + q_j),
// T_s = Re(q_s)/q₀ |t|², and Born & Wolf's p-polarized r_ij = (N_j² q_i − N_i² q_j)/(N_j² q_i + N_i² q_j).
test("transfer matrix: absorbing film at 30° matches the Airy summation", () => {
  const wl = 633 * NM, d = 120 * NM, theta = 30 * DEG;
  const N0 = cx.complex(1), N1 = cx.complex(2.0, 0.3), N2 = cx.complex(1.5);
  const beta2 = (Math.sin(theta)) ** 2;
  const qOf = (N: cx.Complex) => cx.sqrt(cx.sub(cx.mul(N, N), cx.complex(beta2)));
  const [q0, q1, q2] = [N0, N1, N2].map(qOf);
  const phase = cx.scale(q1, (2 * Math.PI * d) / wl); // β
  const e2 = cx.exp(cx.mul(cx.complex(0, 2), phase));
  const e1 = cx.exp(cx.mul(cx.complex(0, 1), phase));
  const airy = (r01: cx.Complex, r12: cx.Complex) =>
    cx.div(cx.add(r01, cx.mul(r12, e2)), cx.add(cx.complex(1), cx.mul(cx.mul(r01, r12), e2)));

  const rsIJ = (qi: cx.Complex, qj: cx.Complex) => cx.div(cx.sub(qi, qj), cx.add(qi, qj));
  const tsIJ = (qi: cx.Complex, qj: cx.Complex) => cx.div(cx.scale(qi, 2), cx.add(qi, qj));
  const rs = airy(rsIJ(q0, q1), rsIJ(q1, q2));
  const ts = cx.div(
    cx.mul(cx.mul(tsIJ(q0, q1), tsIJ(q1, q2)), e1),
    cx.add(cx.complex(1), cx.mul(cx.mul(rsIJ(q0, q1), rsIJ(q1, q2)), e2)),
  );
  const Ts = (q2.re / q0.re) * cx.abs2(ts);

  const rpIJ = (Ni: cx.Complex, qi: cx.Complex, Nj: cx.Complex, qj: cx.Complex) => {
    const a = cx.mul(cx.mul(Nj, Nj), qi);
    const b = cx.mul(cx.mul(Ni, Ni), qj);
    return cx.div(cx.sub(a, b), cx.add(a, b));
  };
  const rp = airy(rpIJ(N0, q0, N1, q1), rpIJ(N1, q1, N2, q2));

  const stack: Stack = { incident: 1, layers: [{ n: 2.0, k: 0.3, thickness: d }], substrate: { n: 1.5 } };
  const s = stackResponse(stack, wl, theta, "s");
  const p = stackResponse(stack, wl, theta, "p");
  close(s.r.re, rs.re, 1e-14, "Re r_s");
  close(s.r.im, rs.im, 1e-14, "Im r_s");
  close(s.T, Ts, 1e-14, "T_s");
  close(p.R, cx.abs2(rp), 1e-14, "R_p");
  for (const res of [s, p]) {
    close(res.R + res.T + res.A, 1, 1e-14, "R + T + A");
    assert.ok(res.A > 0.05, `absorbing film absorbs: A = ${res.A}`);
  }
});

// An opaque metal reflects like the bulk: R = ((n − 1)² + κ²)/((n + 1)² + κ²) (Born & Wolf §14.2).
test("transfer matrix: an opaque metal layer reflects like bulk metal, without overflow", () => {
  const metal = { n: 0.1, k: 3.5 };
  const bulk = ((metal.n - 1) ** 2 + metal.k ** 2) / ((metal.n + 1) ** 2 + metal.k ** 2); // 0.9685
  for (const thickness of [1e-6, 1]) {
    const res = stackResponse({ incident: 1, layers: [{ ...metal, thickness }], substrate: { n: 1.52 } }, 550 * NM);
    close(res.R, bulk, 1e-12, `R, d = ${thickness} m`);
    close(res.T, 0, 1e-30, `T, d = ${thickness} m`);
    close(res.A, 1 - bulk, 1e-12, `A, d = ${thickness} m`);
  }
});

test("transfer matrix: lossless stacks conserve energy at any angle and polarization", () => {
  const layers: Layer[] = Array.from({ length: 21 }, (_, i) => ({
    n: i % 3 === 0 ? 2.35 : i % 3 === 1 ? 1.45 : 1.8,
    thickness: (40 + 17 * i) * NM,
  }));
  const stack: Stack = { incident: 1, layers, substrate: { n: 1.52 } };
  for (const angle of [0, 30 * DEG, 70 * DEG, 89 * DEG]) {
    for (const pol of ["s", "p"] as const) {
      for (const wl of [400 * NM, 633 * NM, 1550 * NM]) {
        const res = stackResponse(stack, wl, angle, pol);
        close(res.R + res.T, 1, 1e-12, `R + T (${pol}, ${angle}, ${wl})`);
        close(res.A, 0, 1e-12, `A (${pol}, ${angle}, ${wl})`);
      }
    }
  }
});

// Edge case: a layer and the substrate at their critical angle, where q = N cos θ ≈ 0 and the
// p admittance N²/q diverges. Frustrated TIR through a 100 nm air gap still conserves energy.
test("transfer matrix: layers at the critical angle stay finite", () => {
  const theta = Math.asin(1 / 2); // n₀ sin θ = 1 for n₀ = 2
  const stack: Stack = { incident: 2, layers: [{ n: 1, thickness: 100 * NM }], substrate: { n: 2 } };
  const exact: Stack = { incident: 2, layers: [], substrate: { n: 1 } };
  for (const pol of ["s", "p"] as const) {
    const res = stackResponse(stack, 633 * NM, theta, pol);
    assert.ok(Number.isFinite(res.R) && Number.isFinite(res.T), `${pol}: finite`);
    close(res.R + res.T, 1, 1e-9, `${pol}: R + T`);
    close(stackResponse(exact, 633 * NM, theta, pol).R, 1, 1e-6, `${pol}: bare interface at θ_c`);
  }
});

test("transfer matrix: invalid inputs give NaN", () => {
  const ok: Stack = { incident: 1, layers: [{ n: 1.38, thickness: 100 * NM }], substrate: { n: 1.52 } };
  assert.ok(Number.isFinite(stackResponse(ok, 550 * NM).R));
  const bad: [string, Stack, number, number][] = [
    ["λ = 0", ok, 0, 0],
    ["θ = 90°", ok, 550 * NM, Math.PI / 2],
    ["θ < 0", ok, 550 * NM, -0.1],
    ["incident n = 0", { ...ok, incident: 0 }, 550 * NM, 0],
    ["negative thickness", { ...ok, layers: [{ n: 1.38, thickness: -1 }] }, 550 * NM, 0],
    ["κ < 0 (gain)", { ...ok, layers: [{ n: 1.38, k: -0.1, thickness: 1e-7 }] }, 550 * NM, 0],
    ["N = 0", { ...ok, substrate: { n: 0 } }, 550 * NM, 0],
    ["NaN index", { ...ok, layers: [{ n: NaN, thickness: 1e-7 }] }, 550 * NM, 0],
  ];
  for (const [label, stack, wl, angle] of bad) {
    assert.ok(Number.isNaN(stackResponse(stack, wl, angle).R), label);
  }
  assert.ok(Number.isNaN(quarterWaveThickness(0, 550 * NM)));
});

test("transfer matrix: unpolarized reflectance is the mean of s and p", () => {
  const stack: Stack = { incident: 1, layers: [{ n: 2.1, thickness: 80 * NM }], substrate: { n: 1.52 } };
  const wls = [450 * NM, 650 * NM];
  const s = reflectanceSpectrum(stack, wls, 50 * DEG, "s");
  const p = reflectanceSpectrum(stack, wls, 50 * DEG, "p");
  const u = reflectanceSpectrum(stack, wls, 50 * DEG, "unpolarized");
  wls.forEach((wl, i) => {
    close(u[i], (s[i] + p[i]) / 2, 1e-16, `R_u(${wl})`);
    close(unpolarizedResponse(stack, wl, 50 * DEG).T, 1 - u[i], 1e-14, `T_u(${wl})`);
  });
});

// Single film, normal incidence, e^(−iωt): Born & Wolf, Principles of Optics, 7th ed., §1.6.4,
//   r = (r₁₂ + r₂₃ e^(2iβ))/(1 + r₁₂r₂₃ e^(2iβ)),  t = t₁₂t₂₃ e^(iβ)/(1 + r₁₂r₂₃ e^(2iβ)),  β = 2πn₂h/λ,
// with the normal-incidence Fresnel coefficients r = (n₁ − n₂)/(n₁ + n₂), t = 2n₁/(n₁ + n₂).
test("transfer matrix: r and t of a single film match the Airy formulae", () => {
  const n1 = 1, n2 = 2.35, n3 = 1.52, h = 137 * NM;
  for (const wl of [400 * NM, 633 * NM, 1064 * NM]) {
    const beta = (2 * Math.PI * n2 * h) / wl;
    const r12 = (n1 - n2) / (n1 + n2), r23 = (n2 - n3) / (n2 + n3);
    const t12 = (2 * n1) / (n1 + n2), t23 = (2 * n2) / (n2 + n3);
    const e2 = cx.exp(cx.complex(0, 2 * beta));
    const den = cx.add(cx.complex(1), cx.scale(e2, r12 * r23));
    const r = cx.div(cx.add(cx.complex(r12), cx.scale(e2, r23)), den);
    const t = cx.div(cx.scale(cx.exp(cx.complex(0, beta)), t12 * t23), den);
    const res = stackResponse({ incident: n1, layers: [{ n: n2, thickness: h }], substrate: { n: n3 } }, wl);
    close(res.r.re, r.re, 1e-14, `Re r(${wl})`);
    close(res.r.im, r.im, 1e-14, `Im r(${wl})`);
    close(res.t.re, t.re, 1e-14, `Re t(${wl})`);
    close(res.t.im, t.im, 1e-14, `Im t(${wl})`);
  }
});

// Macleod, Thin-Film Optical Filters, 4th ed., ch. 2: T = Re(η_sub)/η₀ · |t|² with tilted admittances
// η_s = N cos θ, η_p = N/cos θ, also with an absorbing layer and at oblique incidence.
test("transfer matrix: T = Re(η_sub)/η₀ |t|² for s and p, absorbing layer at 40°", () => {
  const theta = 40 * DEG;
  const stack: Stack = {
    incident: 1,
    layers: [{ n: 2.0, k: 0.3, thickness: 80 * NM }, { n: 1.4, thickness: 120 * NM }],
    substrate: { n: 1.6 },
  };
  const cosSub = Math.sqrt(1 - (Math.sin(theta) / 1.6) ** 2);
  for (const pol of ["s", "p"] as const) {
    const res = stackResponse(stack, 600 * NM, theta, pol);
    const etaSub = pol === "s" ? 1.6 * cosSub : 1.6 / cosSub;
    const eta0 = pol === "s" ? Math.cos(theta) : 1 / Math.cos(theta);
    close(res.T, (etaSub / eta0) * cx.abs2(res.t), 1e-14, `T(${pol})`);
    assert.ok(res.A > 0.05, `the layer absorbs (${pol}): A = ${res.A}`);
  }
  // Invalid input: t is NaN like the other fields.
  assert.ok(Number.isNaN(stackResponse(stack, -1).t.re));
});
