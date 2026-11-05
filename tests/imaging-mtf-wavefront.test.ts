import test from "node:test";
import assert from "node:assert/strict";

import {
  cutoffFrequency, defocusW020, defocusedOtf, diffractionMtf, highNaDefocusOtf, highNaDefocusStrehl, wienerGain,
  wienerHalfFrequency, wienerTransfer,
} from "../src/physics/imaging/diffraction-mtf";
import {
  defocusStrehlExact, marechalRms, marechalStrehl, pvFromRms, rmsFromPv, zernikeStrehl,
} from "../src/physics/imaging/wavefront";
import { integrateSimpson } from "../src/physics/math";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const um = 1e-6;
const nm = 1e-9;

test("diffraction-limited MTF and cutoff 2NA/λ (Goodman §6.3)", () => {
  // Hand value: (2/π)(π/3 − 0.5·√0.75) = 0.391002.
  assertRel(diffractionMtf(0.5), 0.39100222, 1e-7, "MTF(0.5)");
  assert.equal(diffractionMtf(0), 1);
  assert.equal(diffractionMtf(1), 0);
  assert.equal(diffractionMtf(1.5), 0);
  assertRel(cutoffFrequency(0.95, 550 * nm) * um, 3.4545454, 1e-7, "cutoff, lp/µm");
  assert.ok(Number.isNaN(cutoffFrequency(0, 550 * nm)));
  assert.ok(Number.isNaN(diffractionMtf(-0.1)));
});

test("Hopkins defocused OTF (Proc. R. Soc. A 231, 91 (1955))", () => {
  // NA 0.95, Δz 0.5 µm in air: W₀₂₀ = 0.5·0.9025/2 = 0.225625 µm = 0.41023λ at 550 nm, kW₀₂₀ = 2.5775 rad.
  const w = defocusW020(0.5 * um, 0.95) / (550 * nm);
  assertRel(w, 0.41022727, 1e-7, "W020 in waves");
  assertRel(2 * Math.PI * w, 2.578, 2e-4, "kW020");
  // Independent check: brute-force 2D overlap integral of the two shifted pupils, (1/π)∫∫cos(4kW₀₂₀νx), gives 0.15592.
  assertRel(defocusedOtf(0.5, w), 0.15592, 1e-4, "OTF(0.5)");
  assert.equal(defocusedOtf(0.5, 0), diffractionMtf(0.5));
  assert.equal(defocusedOtf(0.5, -w), defocusedOtf(0.5, w));
  // Contrast reversal: at W₀₂₀ = λ the OTF is −0.0728 near ν = 0.275 (2D overlap integral: −0.0728).
  assert.ok(defocusedOtf(0.275, 1) < -0.07);
  // Large defocus: the radial rule agrees with an 8× finer Simpson grid.
  const a = 8 * Math.PI * 30 * 0.3;
  const fine = (4 / Math.PI) * integrateSimpson((t) => Math.sin(t) ** 2 * Math.cos(a * (Math.cos(t) - 0.3)), 0, Math.acos(0.3), 32 * Math.ceil(a));
  assert.ok(Math.abs(defocusedOtf(0.3, 30) - fine) < 1e-8);
  assert.ok(Number.isNaN(defocusW020(1 * um, 1.4, 1)), "NA above n");
});

test("Wiener restoration H²/(H² + NSR) (Gonzalez & Woods §5.8)", () => {
  assert.equal(wienerTransfer(0.1, 0.01), 0.5);
  assertRel(wienerGain(0.1, 0.01), 5, 1e-12, "gain");
  assert.equal(wienerTransfer(0.5, 0), 1);
  assert.ok(Number.isNaN(wienerGain(0, 0)));
  // 30 dB: MTF(ν½) = √0.001 = 0.031623; MTF(0.91066) = 0.031622 by hand.
  const nu = wienerHalfFrequency(1e-3);
  assertRel(diffractionMtf(nu), Math.sqrt(1e-3), 1e-9, "MTF at ν½");
  assertRel(nu, 0.91066, 1e-4, "ν½");
  assert.equal(wienerHalfFrequency(1), 0);
  assert.equal(wienerHalfFrequency(0), 1);
});

test("Maréchal Strehl, λ/14 and S = 0.8 (Mahajan, JOSA 73, 860 (1983))", () => {
  assertRel(marechalStrehl(0.05, 1), 0.906018, 1e-6, "S(0.05λ)");
  assertRel(marechalStrehl(1, 14), 0.817569, 1e-6, "S(λ/14)");
  assertRel(marechalRms(0.8, 1), 0.0751817, 1e-6, "σ at S 0.8");
  assertRel(marechalStrehl(20 * nm, 550 * nm), 0.949136, 1e-6, "20 nm at 550 nm");
  assert.equal(marechalStrehl(0, 1), 1);
  assert.ok(Number.isNaN(marechalRms(0, 1)));
});

test("exact Strehl of one Zernike term (Noll 1976; Mahajan, JOSA 72, 1258 (1982))", () => {
  // Defocus: W₀₂₀ = √12σ, φ = 2π√12·0.05 = 1.08828, sinc²(φ/2) = (sin 0.54414/0.54414)² = 0.905119.
  assertRel(defocusStrehlExact(0.05), 0.905119, 1e-6, "defocus S(0.05λ)");
  assertRel(zernikeStrehl("defocus", 0.05), 0.905119, 1e-6, "defocus via zernikeStrehl");
  // Brute-force 2D pupil averages (600 × 720 midpoint grid) at σ = 0.1λ.
  assertRel(zernikeStrehl("astigmatism", 0.1), 0.671320, 1e-5, "astigmatism");
  assertRel(zernikeStrehl("coma", 0.1), 0.669420, 1e-5, "coma");
  assertRel(zernikeStrehl("spherical", 0.1), 0.666399, 1e-5, "spherical");
  // Small σ: every orthonormal term gives 1 − (2πσ)² + O(σ⁴).
  for (const mode of ["astigmatism", "coma", "spherical"] as const) {
    assert.ok(Math.abs(zernikeStrehl(mode, 0.01) - (1 - (2 * Math.PI * 0.01) ** 2)) < 2e-5, mode);
  }
  assert.ok(Number.isNaN(zernikeStrehl("coma", 6)));
});

test("PV/RMS of one Zernike term", () => {
  assertRel(pvFromRms(1, "defocus"), 2 * Math.sqrt(3), 1e-15, "defocus 2√3");
  assertRel(pvFromRms(1, "spherical"), 1.5 * Math.sqrt(5), 1e-15, "spherical, √5 − (−√5/2)");
  assertRel(rmsFromPv(2 * Math.sqrt(8), "coma"), 1, 1e-15, "coma 2√8");
  assert.ok(Number.isNaN(pvFromRms(-1, "astigmatism")));
});

test("High-NA exact-phase defocus: Strehl and OTF (Richards & Wolf 1959; Sheppard 1988)", () => {
  // NA 0.95, Δz 0.5 µm in air, 550 nm: D = nΔz/λ = 0.90909, s = 0.95. Closed form 0.272975 vs paraxial sinc²(kW₀₂₀/2) 0.5554
  // (session-90 reviewer's scalar quadrature: 0.27).
  const D = 0.5 / 0.55;
  const S = highNaDefocusStrehl(D, 0.95);
  assertRel(S, 0.27297521, 1e-6, "Strehl, exact phase");
  // Independent check of the closed form: brute-force |∫₀¹ e^(i2πD√(1 − s²ρ²)) 2ρ dρ|² by Simpson.
  const brute = (d: number, s: number) => {
    const re = integrateSimpson((r) => 2 * r * Math.cos(2 * Math.PI * d * Math.sqrt(1 - s * s * r * r)), 0, 1, 4000);
    const im = integrateSimpson((r) => 2 * r * Math.sin(2 * Math.PI * d * Math.sqrt(1 - s * s * r * r)), 0, 1, 4000);
    return re * re + im * im;
  };
  assertRel(S, brute(D, 0.95), 1e-9, "Strehl vs quadrature");
  // Series branch (z = 2πDδ < 0.5) and the s = 1 edge.
  assertRel(highNaDefocusStrehl(0.1, 0.8), brute(0.1, 0.8), 1e-9, "series branch");
  // At s = 1 the phase has an infinite slope at the rim: substitute ρ = sin φ, |∫₀^(π/2) e^(i2πD cos φ) sin 2φ dφ|².
  const rimRe = integrateSimpson((p) => Math.sin(2 * p) * Math.cos(6 * Math.PI * Math.cos(p)), 0, Math.PI / 2, 2000);
  const rimIm = integrateSimpson((p) => Math.sin(2 * p) * Math.sin(6 * Math.PI * Math.cos(p)), 0, Math.PI / 2, 2000);
  assertRel(highNaDefocusStrehl(3, 1), rimRe * rimRe + rimIm * rimIm, 1e-9, "s = 1");
  // Paraxial limit: s → 0 at fixed W₀₂₀ = Ds²/2 = 0.41023λ gives sinc²(kW₀₂₀/2) = 0.55544.
  const w = defocusW020(0.5 * um, 0.95) / (550 * nm);
  const kw2 = Math.PI * w;
  assertRel(highNaDefocusStrehl((2 * w) / 1e-4, 1e-2), (Math.sin(kw2) / kw2) ** 2, 1e-4, "paraxial Strehl");
  // The OTF tends to Hopkins' as s → 0 (relative difference O(s²)).
  assertRel(highNaDefocusOtf(0.5, (2 * w) / 1e-4, 1e-2), defocusedOtf(0.5, w), 1e-4, "paraxial OTF");
  // The PSF peak is the integral of the OTF: S = ∫OTF ν dν / ∫MTF₀ ν dν, with ∫₀¹MTF₀ ν dν = 1/8 (midpoint rule, 200 bins).
  let moment = 0;
  for (let k = 0; k < 200; k++) moment += (highNaDefocusOtf((k + 0.5) / 200, D, 0.95) * (k + 0.5)) / 200 / 200;
  assertRel(moment / 0.125, S, 2e-4, "Strehl from the OTF");
  // Grid convergence: 0.0432365532 at ν = 0.5 on a grid 4× finer in τ and 16× in t.
  assertRel(highNaDefocusOtf(0.5, D, 0.95), 0.0432365532, 1e-6, "OTF(0.5)");
  // In focus, symmetric in Δz, zero past the cutoff; NaN outside the domain or past 10³ rad.
  assert.equal(highNaDefocusOtf(0.5, 0, 0.95), diffractionMtf(0.5));
  assert.equal(highNaDefocusOtf(0.3, -D, 0.95), highNaDefocusOtf(0.3, D, 0.95));
  assert.equal(highNaDefocusOtf(1, D, 0.95), 0);
  assertRel(highNaDefocusStrehl(0, 0.95), 1, 1e-12, "Strehl in focus");
  assert.ok(Number.isNaN(highNaDefocusOtf(0.5, D, 0)) && Number.isNaN(highNaDefocusStrehl(D, 1.1)));
  assert.ok(Number.isNaN(highNaDefocusOtf(0.5, 1e4, 0.9)));
  // s = 1 (infinite phase slope at the rim): 0.0031635 by a brute-force Cartesian grid and by an edge-substituted
  // Gauss–Legendre rule (physics review, session 201); 0.00316350565 on a 256 × 128-panel grid. Within 1e-6 absolute.
  assert.ok(Math.abs(highNaDefocusOtf(0.3, 2, 1) - 0.00316350565) < 1e-6, "OTF at s = 1");
});
