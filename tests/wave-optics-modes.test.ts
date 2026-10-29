import test from "node:test";
import assert from "node:assert/strict";

import { besselJ, besselJ0Fast, fresnelIntegrals, integrateSimpson } from "../src/physics/math";
import {
  hermiteH, hgAmplitude1D, hgIntensity, hgSecondMomentRadius, laguerreL, lgIntensity, lgRingRadius,
  lgSecondMomentRadius, modeGouyPhase,
} from "../src/physics/wave-optics/higher-order-modes";
import {
  J0_FIRST_ZERO, J0_HALF_INTENSITY, besselBeamIntensity, coreFwhm, coreRadius, maxPropagationDistance, radialWavenumber,
} from "../src/physics/wave-optics/bessel-beam";
import {
  MAX_CIRCULAR_FRESNEL_NUMBER, airyFirstZeroRadius, circularFraunhoferIntensity, circularFresnelIntensity,
  circularOnAxisIntensity, circularOnAxisIntensityExact, fresnelEdgePhaseError, fresnelNumber, slitFirstZero, slitFraunhoferIntensity, slitFresnelIntensity,
} from "../src/physics/wave-optics/diffraction-integral";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}
function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) < tol, `${label}: ${actual} vs ${expected}`);
}

test("Fresnel integrals: A&S Table 7.7, oddness and the large-x asymptote", () => {
  // A&S Table 7.7 (8 decimals).
  const table: [number, number, number][] = [
    [0.5, 0.49234423, 0.06473243],
    [1, 0.7798934, 0.43825915],
    [1.5, 0.44526118, 0.69750496],
    [2, 0.48825341, 0.34341568],
    [3, 0.60572079, 0.4963130],
  ];
  for (const [x, C, S] of table) {
    const [c, s] = fresnelIntegrals(x);
    assertAbs(c, C, 6e-9, `C(${x})`);
    assertAbs(s, S, 6e-9, `S(${x})`);
  }
  // Both branches meet at x = 1.5.
  const [cl, sl] = fresnelIntegrals(1.5 - 1e-14);
  const [cr, sr] = fresnelIntegrals(1.5 + 1e-14);
  assertAbs(cl, cr, 1e-12, "C continuity");
  assertAbs(sl, sr, 1e-12, "S continuity");
  const [cn, sn] = fresnelIntegrals(-1);
  assertAbs(cn, -0.7798934, 1e-8, "C(−1)");
  assertAbs(sn, -0.43825915, 1e-8, "S(−1)");
  // DLMF 7.5.3–4, 7.12: C(10) = ½ − g, S(10) = ½ − f with f ≈ 1/(πx), g ≈ 1/(π²x³) (sin 50π = 0, cos 50π = 1).
  const [c10, s10] = fresnelIntegrals(10);
  assertAbs(c10, 0.5 - 1 / (Math.PI ** 2 * 1000), 3e-8, "C(10)");
  assertAbs(s10, 0.5 - 1 / (10 * Math.PI) + 3 / (Math.PI ** 3 * 1e5), 1e-9, "S(10)");
  assert.deepEqual(fresnelIntegrals(Infinity), [0.5, 0.5]);
});

test("besselJ0Fast: within 1e-7 of the integral-representation besselJ (A&S 9.4.1, 9.4.3)", () => {
  let worst = 0;
  for (let x = 0; x <= 600; x += 0.0731) worst = Math.max(worst, Math.abs(besselJ0Fast(x) - besselJ(0, x)));
  assert.ok(worst < 1e-7, `max |error| ${worst}`);
  assertAbs(besselJ0Fast(J0_FIRST_ZERO), 0, 1e-7, "J₀(j₀,₁)");
  assert.equal(besselJ0Fast(-2), besselJ0Fast(2));
});

test("Hermite and Laguerre polynomials (DLMF Tables 18.3.1, 18.5.1 closed forms)", () => {
  // H₃ = 8x³ − 12x, H₄ = 16x⁴ − 48x² + 12; L₂¹ = (x² − 6x + 6)/2, L₁^α = 1 + α − x.
  assert.equal(hermiteH(3, 1), -4);
  assert.equal(hermiteH(4, 0.5), 16 / 16 - 48 / 4 + 12);
  assertAbs(laguerreL(2, 1, 1), 0.5, 1e-15, "L₂¹(1)");
  assert.equal(laguerreL(1, 3, 2), 2);
  assert.ok(Number.isNaN(hermiteH(2.5, 1)), "fractional index");
  assert.ok(Number.isNaN(laguerreL(-1, 0, 1)), "negative index");
});

test("HG and LG modes: unit power, second moments (Carter 1980; Phillips & Andrews 1983), LG √2 norm", () => {
  const w = 50e-6;
  for (const m of [0, 1, 4, 10]) {
    const P = integrateSimpson((x) => hgAmplitude1D(m, x, w) ** 2, -8 * w, 8 * w, 4000);
    const sigma2 = integrateSimpson((x) => x * x * hgAmplitude1D(m, x, w) ** 2, -8 * w, 8 * w, 4000);
    assertAbs(P, 1, 1e-9, `HG${m} 1-D power`);
    assertRel(2 * Math.sqrt(sigma2), hgSecondMomentRadius(m, w), 1e-9, `W of HG${m}`);
  }
  for (const [p, l] of [[0, 0], [0, 1], [2, -3], [10, 10]]) {
    const P = integrateSimpson((r) => 2 * Math.PI * r * lgIntensity(p, l, r, w), 0, 10 * w, 8000);
    const r2 = integrateSimpson((r) => 2 * Math.PI * r ** 3 * lgIntensity(p, l, r, w), 0, 10 * w, 8000);
    assertAbs(P, 1, 1e-9, `LG${p},${l} power`);
    assertRel(Math.sqrt(2 * r2), lgSecondMomentRadius(p, l, w), 1e-9, `W of LG${p},${l}`);
  }
  // TEM₀₀ peak 2/(πw²) per watt; LG₀⁰ is the same mode.
  assertRel(hgIntensity(0, 0, 0, 0, w), 2 / (Math.PI * w * w), 1e-12, "TEM₀₀ peak");
  assertRel(lgIntensity(0, 0, 30e-6, w), hgIntensity(0, 0, 30e-6, 0, w), 1e-12, "LG₀⁰ = TEM₀₀");
  // LG₀¹ peak at r = w/√2: 2/(πw²) · 2r²/w² e^(−2r²/w²) = 2/(πw²) e^(−1).
  assertRel(lgIntensity(0, 1, lgRingRadius(1, w), w), (2 / (Math.PI * w * w)) * Math.exp(-1), 1e-12, "LG₀¹ ring peak");
  assert.equal(hgIntensity(1, 0, 0, 10e-6, w), 0);
  assert.ok(Number.isNaN(lgIntensity(0, 1.5, 1e-5, w)), "fractional l");
});

test("Gouy phase and Rayleigh range of a higher-order mode (Kogelnik & Li 1966)", () => {
  // λ 1550 nm, w₀ 50 µm: z_R = π w₀²/λ = 5.0671 mm; TEM₂₁ at z = z_R: (3 + 1) π/4 = π.
  const zR = (Math.PI * 50e-6 ** 2) / 1550e-9;
  assertRel(zR, 5.067084e-3, 1e-6, "z_R");
  assertRel(modeGouyPhase(3, zR, zR), Math.PI, 1e-15, "Gouy (N + 1)π/4");
  assert.equal(modeGouyPhase(0, 0, zR), 0);
});

test("Bessel beam: core radius, FWHM and range at the defaults (Durnin 1987; McGloin & Dholakia 2005)", () => {
  // λ 632.8 nm, θ 0.01 rad: k_r = 2π sin θ/λ = 99290.148 /m; r₀ = 2.404826/k_r = 24.2202 µm.
  const kr = radialWavenumber(632.8e-9, 0.01);
  assertRel(kr, 99290.148356, 1e-9, "k_r");
  assertRel(coreRadius(kr), 24.220183e-6, 1e-6, "r₀");
  // x½ by bisection on besselJ: J₀(x½)² = ½.
  let lo = 0.5;
  let hi = 2;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (besselJ(0, mid) ** 2 > 0.5) lo = mid;
    else hi = mid;
  }
  assertAbs(J0_HALF_INTENSITY, lo, 1e-7, "x½");
  assertRel(coreFwhm(kr), (2 * 1.1263642) / 99290.148356, 1e-7, "FWHM 22.688 µm");
  // z_max = R/tan θ: 5 mm / tan(0.01) = 499.983 mm.
  assertRel(maxPropagationDistance(5e-3, 0.01), 0.4999833332, 1e-9, "z_max");
  assertAbs(besselBeamIntensity(0, kr, coreRadius(kr)), 0, 1e-28, "dark ring");
  assert.ok(Number.isNaN(radialWavenumber(632.8e-9, Math.PI / 2)), "θ = π/2");
});

test("Fresnel diffraction, circular aperture: on-axis zones, Fraunhofer limit, Airy zero (Born & Wolf ch. 8)", () => {
  // a 100 µm, λ 632.8 nm, z 50 mm: N_F = 0.316056; on axis 4 sin²(π N_F/2) = 0.907504.
  const NF = fresnelNumber(100e-6, 632.8e-9, 0.05);
  assertRel(NF, 0.316055626, 1e-8, "N_F");
  assertRel(circularOnAxisIntensity(NF), 0.9075040453, 1e-9, "on-axis closed form");
  assertAbs(circularFresnelIntensity(NF, 0), 0.9075040453, 2e-6, "on-axis quadrature");
  // One zone: 4 I₀ on axis; two zones: dark.
  assertAbs(circularFresnelIntensity(1, 0), 4, 2e-5, "N_F = 1");
  assertAbs(circularFresnelIntensity(2, 0), 0, 1e-9, "N_F = 2");
  assertAbs(circularFresnelIntensity(7.3, 0), circularOnAxisIntensity(7.3), 1e-4, "N_F = 7.3");
  // N_F ≪ 1: Fresnel → Fraunhofer (π N_F)² [2J₁(v)/v]², the ratio is 1 − O(N_F²).
  for (const u of [0, 3, 10, 30]) {
    assertRel(circularFresnelIntensity(1e-3, u), circularFraunhoferIntensity(1e-3, u), 1e-5, `Fraunhofer limit ρ/a = ${u}`);
  }
  // First Airy zero j₁,₁ λz/(2πa) = 1.21967 λz/(2a) = 192.952 µm.
  assertRel(airyFirstZeroRadius(100e-6, 632.8e-9, 0.05), 192.95178e-6, 1e-6, "Airy zero");
  assert.ok(Number.isNaN(circularFresnelIntensity(MAX_CIRCULAR_FRESNEL_NUMBER * 1.01, 0)), "above the N_F cap");
});

test("Fresnel diffraction, slit: knife-edge quarter, wide-slit centre, Fraunhofer limit (Goodman ch. 4)", () => {
  // A very wide slit: at its edge the half-plane value I/I₀ = ¼; at the centre ≈ 1.
  assertAbs(slitFresnelIntensity(1e6, 1), 0.25, 5e-4, "edge");
  assertAbs(slitFresnelIntensity(1e6, 0), 1, 2e-3, "centre");
  for (const u of [0, 1, 10, 40]) {
    assertRel(slitFresnelIntensity(1e-3, u), slitFraunhoferIntensity(1e-3, u), 1e-5, `Fraunhofer limit x/a = ${u}`);
  }
  assertRel(slitFraunhoferIntensity(0.5, 0), 2, 1e-15, "4 N_F on axis");
  assertAbs(slitFraunhoferIntensity(0.5, 1), 0, 1e-15, "first zero at x = λz/(2a) ⇔ x/a = 1/(2N_F)");
  assertRel(slitFirstZero(100e-6, 632.8e-9, 0.05), 158.2e-6, 1e-9, "λz/(2a)");
});

test("circular aperture: exact Rayleigh–Sommerfeld on-axis intensity (Heurtley 1973)", () => {
  // I/I₀ = |1 − (z/R) e^(ik(R−z))|², R = √(z² + a²). Hand calc, a = 3 mm, z = 50 mm, λ = 632.8 nm: R − z = 89.92 µm,
  // k(R − z) = 892.8 rad, z/R = 0.99820 → 0.3613, while the paraxial 4 sin²(π N_F/2) at N_F = 284.45 gives 1.6875.
  const R = Math.hypot(0.05, 3e-3);
  const t = 0.05 / R;
  const hand = 1 + t * t - 2 * t * Math.cos(((2 * Math.PI) / 632.8e-9) * (R - 0.05));
  assertRel(circularOnAxisIntensityExact(3e-3, 632.8e-9, 0.05), hand, 1e-9, "closed form");
  assertAbs(circularOnAxisIntensityExact(3e-3, 632.8e-9, 0.05), 0.3613, 1e-4, "far from the paraxial 1.6875");
  assertAbs(circularOnAxisIntensity(fresnelNumber(3e-3, 632.8e-9, 0.05)), 1.6875, 1e-4, "paraxial value");
  // Edge: the page default (a = 100 µm, z = 50 mm) drops 1e-6 rad, so the two agree.
  assertAbs(circularOnAxisIntensityExact(100e-6, 632.8e-9, 0.05), 0.9075040453, 1e-5, "paraxial limit");
  // Dropped phase ≈ −π a⁴/(4λz³) (Goodman eq. 4-18): −0.804 rad at a = 3 mm, z = 50 mm.
  assertRel(fresnelEdgePhaseError(3e-3, 632.8e-9, 0.05), -Math.PI * 81e-12 / (4 * 632.8e-9 * 1.25e-4), 3e-3, "quartic term");
  assert.ok(Number.isNaN(circularOnAxisIntensityExact(0, 632.8e-9, 0.05)), "a = 0");
});
