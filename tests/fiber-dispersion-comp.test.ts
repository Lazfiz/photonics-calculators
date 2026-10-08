import test from "node:test";
import assert from "node:assert/strict";

import {
  accumulatedDispersion, dcfLength, dispersionLimitedBitRate, dispersionPenaltyDb, residualSlope, rmsBroadening,
  toleratedBroadening, usableHalfBandwidth,
} from "../src/physics/fiber-optics/dispersion-comp";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Unit conversions at the test boundary.
const PS_NM_KM = 1e-6; // ps/(nm·km) → s/m²
const PS_NM2_KM = 1e3; // ps/(nm²·km) → s/m³
const PS_NM2 = 1e6; // ps/nm² → s/m²
const nm = 1e-9;
const km = 1e3;
const ps = 1e-12;

// G.652 fibre at 1550 nm and a DCF that matches only part of its slope.
const smf = { D: 17 * PS_NM_KM, S: 0.058 * PS_NM2_KM };
const dcf = { D: -100 * PS_NM_KM, S: -0.2 * PS_NM2_KM };
const L = 80 * km;

test("power penalty reproduces the −5 log₁₀(1 − (4BLDσ_λ)²) table", () => {
  // NPTEL Optical Communication, Module 12 "System degradation and power penalty" (Agrawal §5.4.4 form).
  const B = 10e9;
  for (const [blds, dB] of [[0.05, 0.088], [0.1, 0.378], [0.15, 0.97], [0.2, 2.22]]) {
    const sigmaLambda = blds / (B * L * smf.D);
    const sigmaD = rmsBroadening(accumulatedDispersion(smf, L), 0, sigmaLambda);
    assert.ok(Math.abs(dispersionPenaltyDb(B, sigmaD) - dB) < 0.005, `BLDσ = ${blds}`);
  }
  // 4Bσ_D ≥ 1: the eye is closed.
  assert.equal(dispersionPenaltyDb(B, 1 / (4 * B)), Infinity);
  assert.equal(dispersionPenaltyDb(B, 0), 0);
});

test("broad-source bit-rate limit BL|D|σ_λ = 1/4", () => {
  // Hand: D = 16 ps/(nm·km), σ_λ = 2 nm → BL = 1/(4·16·2) Tb/s·km = 7.8125 (Gb/s)·km.
  const sigmaD = rmsBroadening(accumulatedDispersion({ D: 16 * PS_NM_KM, S: 0 }, 1 * km), 0, 2 * nm);
  assertRel(dispersionLimitedBitRate(sigmaD), 7.8125e9, 1e-12, "B at 1 km");
  assert.equal(dispersionLimitedBitRate(0), Infinity);
});

test("slope term: σ_D = |S|Lσ_λ²/√2 at zero dispersion, BL|S|σ_λ² = 1/√8 closes the eye", () => {
  const sigmaLambda = 3 * nm;
  const Sacc = 0.09 * PS_NM2_KM * 50 * km;
  assertRel(rmsBroadening(0, Sacc, sigmaLambda), (Sacc * sigmaLambda ** 2) / Math.SQRT2, 1e-14, "σ_D");
  // Agrawal §2.4.3: the limit at λ_ZD is BL|S|σ_λ² = 1/√8.
  const B = 1 / (Math.sqrt(8) * Sacc * sigmaLambda ** 2);
  assertRel(4 * B * rmsBroadening(0, Sacc, sigmaLambda), 1, 1e-12, "4Bσ_D");
});

test("rms broadening equals the rms group delay over a Gaussian spectrum (numerical integration)", () => {
  // τ(δλ) = D_acc δλ + ½ S_acc δλ², δλ ~ N(0, σ²); trapezoid rule over ±12σ.
  const Dacc = 3.2 * 1e-3; // 3.2 ps/nm
  const Sacc = 4.64 * PS_NM2;
  const sigma = 0.8 * nm;
  const N = 4000;
  const h = (24 * sigma) / N;
  let m0 = 0, m1 = 0, m2 = 0;
  for (let i = 0; i <= N; i++) {
    const x = -12 * sigma + i * h;
    const w = (i === 0 || i === N ? 0.5 : 1) * Math.exp(-0.5 * (x / sigma) ** 2);
    const tau = Dacc * x + 0.5 * Sacc * x * x;
    m0 += w;
    m1 += w * tau;
    m2 += w * tau * tau;
  }
  const rms = Math.sqrt(m2 / m0 - (m1 / m0) ** 2);
  assertRel(rmsBroadening(Dacc, Sacc, sigma), rms, 1e-9, "σ_D");
});

test("DCF length nulls the dispersion at λ₀ and leaves the slope mismatch", () => {
  // Hand: L_c = 17·80/100 = 13.6 km; S_res = 0.058·80 − 0.2·13.6 = 1.92 ps/nm².
  const Lc = dcfLength(smf, L, dcf);
  assertRel(Lc, 13.6 * km, 1e-12, "L_c");
  assert.ok(Math.abs(accumulatedDispersion(smf, L) + accumulatedDispersion(dcf, Lc)) < 1e-18, "D_acc(λ₀)");
  assertRel(residualSlope(smf, L, dcf, Lc), 1.92 * PS_NM2, 1e-12, "S_res");
  // At λ₀ + 15 nm the residual is S_res·15 nm = 28.8 ps/nm.
  const resid = accumulatedDispersion(smf, L, 15 * nm) + accumulatedDispersion(dcf, Lc, 15 * nm);
  assertRel(resid, 28.8e-3, 1e-12, "D_acc(λ₀ + 15 nm)");
  // Equal relative dispersion slopes S/D compensate the slope too (Agrawal, dispersion management).
  const matched = { D: dcf.D, S: (dcf.D * smf.S) / smf.D };
  assert.ok(Math.abs(residualSlope(smf, L, matched, dcfLength(smf, L, matched))) < 1e-9 * smf.S * L, "RDS match");
  // Edges: nothing to compensate; a "DCF" with the same sign or zero dispersion can't compensate.
  assert.equal(dcfLength({ D: 0, S: smf.S }, L, dcf), 0);
  assert.ok(Number.isNaN(dcfLength(smf, L, { D: 17 * PS_NM_KM, S: 0 })));
  assert.ok(Number.isNaN(dcfLength(smf, L, { D: 0, S: 0 })));
});

test("usable band of the compensated link ends at the 1 dB penalty", () => {
  const B = 10e9;
  const sigmaLambda = 0.5 * nm;
  const Sres = 1.92 * PS_NM2;
  // Hand: σ_tol = √(1 − 10^−0.2)/(4B) = 15.1872 ps.
  assertRel(toleratedBroadening(B), 15.1872 * ps, 1e-5, "σ_tol");
  // Hand: √(σ_tol² − (S_res σ_λ²)²/2)/(S_res σ_λ) = √(230.652 − 0.1152)/0.96 ps/nm = 15.8161 nm.
  const half = usableHalfBandwidth(Sres, sigmaLambda, toleratedBroadening(B));
  assertRel(half, 15.8161 * nm, 1e-5, "half-width");
  assertRel(dispersionPenaltyDb(B, rmsBroadening(Sres * half, Sres, sigmaLambda)), 1, 1e-9, "penalty at the edge");
  // Matched slope: unlimited in this model. A slope so large that λ₀ alone exceeds the tolerance: no band.
  assert.equal(usableHalfBandwidth(0, sigmaLambda, toleratedBroadening(B)), Infinity);
  assert.equal(usableHalfBandwidth(1e6 * PS_NM2, sigmaLambda, toleratedBroadening(B)), 0);
});
