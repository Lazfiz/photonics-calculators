import test from "node:test";
import assert from "node:assert/strict";

import {
  accumulatedDispersion, addedRmsBroadening, dcfLength, dispersionLimitedBitRate, dispersionPenaltyDb,
  optimumPulseBroadening, residualSlope, rmsBroadening, toleratedAccumulatedDispersion, toleratedBroadening,
  usableHalfBandwidth,
} from "../src/physics/fiber-optics/dispersion-comp";
import {
  beta2FromD, gaussianPulseRmsWidth, optimumOutputRmsWidth, sigmaOmegaFromLambda,
} from "../src/physics/fiber-optics/chromatic-dispersion";

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
  // Hand, x = |D_acc| in ps/nm, k = λ²/(4πc) = 0.637724 ps² per ps/nm at 1550 nm:
  // 0.25x² + 0.637724x = 230.652 − 0.1152 → x = 29.1182 ps/nm, half-width x/S_res = 15.1657 nm
  // (15.8161 nm with the broad-source σ_D alone).
  const half = usableHalfBandwidth(Sres, sigmaLambda, toleratedBroadening(B), 1550 * nm);
  assertRel(half, 15.1657 * nm, 1e-5, "half-width");
  assertRel(dispersionPenaltyDb(B, optimumPulseBroadening(Sres * half, Sres, sigmaLambda, 1550 * nm)), 1, 1e-9, "penalty at the edge");
  // Matched slope: unlimited in this model. A slope so large that λ₀ alone exceeds the tolerance: no band.
  assert.equal(usableHalfBandwidth(0, sigmaLambda, toleratedBroadening(B), 1550 * nm), Infinity);
  assert.equal(usableHalfBandwidth(1e6 * PS_NM2, sigmaLambda, toleratedBroadening(B), 1550 * nm), 0);
  // Edge σ_λ = 0: the band ends where λ²|D_acc|/(4πc) = σ_tol², 230.652/0.637724 = 361.68 ps/nm.
  assertRel(toleratedAccumulatedDispersion(Sres, 0, toleratedBroadening(B), 1550 * nm), 361.68 * 1e-3, 1e-4, "σ_λ = 0");
});

test("narrow source: σ_b = √(σ_D² + λ²|D_acc|/(4πc)) closes the eye that σ_D alone leaves open", () => {
  // Agrawal §2.4.2, β₃ = 0: σ² = σ₀² + (β₂L/2σ₀)² + σ_D², optimum σ₀² = |β₂L|/2 → σ² − σ₀² = σ_D² + |β₂L|/2.
  // 80 km G.652, D_acc = 1360 ps/nm, 10 Gb/s, σ_λ = 0: σ_D = 0 (0 dB), but σ_b = √(0.637724·1360) = 29.450 ps,
  // 4Bσ_b = 1.178: eye closed. The total width √|β₂L| = 41.65 ps gives Agrawal's limit 1/(4√(|β₂|L)) = 6.00 Gb/s.
  const lambda = 1550 * nm, B = 10e9;
  const Dacc = accumulatedDispersion(smf, L), Sacc = smf.S * L;
  assertRel(optimumPulseBroadening(Dacc, Sacc, 0, lambda), 29.450 * ps, 1e-4, "σ_b");
  assert.equal(dispersionPenaltyDb(B, rmsBroadening(Dacc, Sacc, 0)), 0);
  assert.equal(dispersionPenaltyDb(B, optimumPulseBroadening(Dacc, Sacc, 0, lambda)), Infinity);
  const beta2L = beta2FromD(Dacc, lambda);
  assertRel(1 / (4 * optimumOutputRmsWidth(beta2L, 0, 1, 0)), 6.003e9, 1e-3, "B_max");
  // σ_b is σ² − σ₀² of the full Agrawal formula at the optimum σ₀ (σ_ω from σ_λ = 0.5 nm).
  const sigmaOmega = sigmaOmegaFromLambda(0.5 * nm, lambda);
  const sigma0 = Math.sqrt(Math.abs(beta2L) / 2);
  const out = gaussianPulseRmsWidth({ sigma0, beta2: beta2L, beta3: 0, L: 1, sigmaOmega });
  assertRel(addedRmsBroadening(out, sigma0), optimumPulseBroadening(Dacc, 0, 0.5 * nm, lambda), 1e-12, "σ² − σ₀²");
  // Broad source: σ_b → σ_D (680.64 vs 680.00 ps at 0.5 nm).
  assertRel(optimumPulseBroadening(Dacc, Sacc, 0.5 * nm, lambda), 680.638 * ps, 1e-5, "broad source");
  // Edges: no broadening when σ ≤ σ₀; negative widths are invalid.
  assert.equal(addedRmsBroadening(1 * ps, 2 * ps), 0);
  assert.ok(Number.isNaN(addedRmsBroadening(1 * ps, -1)));
});

test("dispersion-map page defaults: 80 km SMF + 15 km DCF, net −140 ps/nm, residual slope 1.48 ps/nm²", () => {
  // Hand calculation (Agrawal, dispersion-management chapter: D_net = L_s D_s + L_c D_c, S_res = L_s S_s + L_c S_c):
  // 80·17 = 1360 ps/nm, 15·(−100) = −1500 ps/nm → −140 ps/nm; 80·0.056 − 15·0.2 = 4.48 − 3 = 1.48 ps/nm².
  // At 1560 nm (δλ = +10 nm): 80·(17 + 0.56) + 15·(−100 − 2) = 1404.8 − 1530 = −125.2 ps/nm.
  const s = { D: 17 * PS_NM_KM, S: 0.056 * PS_NM2_KM };
  const c = { D: -100 * PS_NM_KM, S: -0.2 * PS_NM2_KM };
  const PS_NM = 1e-3; // ps/nm → s/m
  assertRel(accumulatedDispersion(s, 80 * km), 1360 * PS_NM, 1e-12, "SMF");
  assertRel(accumulatedDispersion(c, 15 * km), -1500 * PS_NM, 1e-12, "DCF");
  assertRel(accumulatedDispersion(s, 80 * km) + accumulatedDispersion(c, 15 * km), -140 * PS_NM, 1e-12, "net");
  assertRel(residualSlope(s, 80 * km, c, 15 * km), 1.48 * PS_NM2, 1e-12, "S_res");
  const net1560 = accumulatedDispersion(s, 80 * km, 10 * nm) + accumulatedDispersion(c, 15 * km, 10 * nm);
  assertRel(net1560, -125.2 * PS_NM, 1e-12, "net at 1560 nm");
  // Edge: zero lengths accumulate nothing.
  assert.equal(accumulatedDispersion(s, 0, 10 * nm) + accumulatedDispersion(c, 0, 10 * nm), 0);
});
