// Golden values for the page summaries of the stimulated-Raman, sum-frequency, third-harmonic and three-photon microscopy
// pages. Each value is worked independently of the repo (separate script, exact SI constants: c = 299792458 m/s,
// h = 6.62607015e-34 J s, µ₀ = 1.25663706127e-6 H/m for ε₀ = 1/(µ₀c²)) from the cited equations.
import assert from "node:assert/strict";
import { test } from "node:test";
import { srsSummary } from "../src/physics/imaging/stimulated-raman-microscopy";
import { sfgSummary } from "../src/physics/imaging/sum-frequency-microscopy";
import { thgSummary } from "../src/physics/imaging/third-harmonic-microscopy";
import { threePhotonSummary } from "../src/physics/imaging/three-photon-microscopy";

const close = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${a} vs ${b}`);

// Zipfel W. R., Williams R. M., Webb W. W. (2003), Nat. Biotechnol. 21, 1369, doi:10.1038/nbt899: ω_xy = 0.320 λ/(√2 NA) (NA ≤ 0.7),
// ω_z = 0.532 λ/(√2 (n − √(n² − NA²))), FWHM of I^k = 2√(2 ln 2/k) ω.
test("third-harmonic summary: 1200 nm, NA 0.5, n 1.33 focus and THG wavelength", () => {
  const s = thgSummary({ lambda: 1200e-9, n: 1.33, na: 0.5, avgPower: 0.1, pulseWidth: 100e-15, repRate: 80e6 });
  close(s.thgLateral, 738.3177659396521e-9);
  close(s.thgAxial, 6.290542475902385e-6);
  close(s.fundamentalLateral, 1278.8038827382236e-9);
  close(s.thgWavelength, 400e-9);
  assert.equal(s.valid, true);
});

test("third-harmonic summary: NA at or above n has no axial extent", () => {
  const s = thgSummary({ lambda: 1200e-9, n: 1.33, na: 1.4, avgPower: 0.1, pulseWidth: 100e-15, repRate: 80e6 });
  assert.equal(s.valid, false);
  assert.ok(Number.isNaN(s.thgAxial));
});

test("three-photon summary: 1300 nm, NA 0.5 focus and volume (π/6)^(3/2) w² w_z", () => {
  const s = threePhotonSummary({
    lambda: 1300e-9, n: 1.33, na: 0.5, pulseWidth: 100e-15, repRate: 1e6, avgPower: 0.1, scattering: 6000, depth: 500e-6,
  });
  close(s.lateral3, 799.8442464346232e-9);
  close(s.axial3, 6.81475434889425e-6);
  close(s.lateral2, 979.6051387328748e-9);
  close(s.volume, 5.258449241973011e-18);
  // exp(−µz) = exp(−6000·500e-6) = exp(−3); signal ∝ exp(−9) = 1.2340980408667956e-4.
  close(s.fraction, Math.exp(-3), 1e-12);
  close(s.relativeSignal, 1.2340980408667956e-4, 1e-12);
});

test("sum-frequency summary: 1040 nm + 800 nm, NA 0.8, thin layer power and coherence lengths", () => {
  const s = sfgSummary({
    lambda1: 1040e-9, lambda2: 800e-9, na: 0.8, n: 1.33, power1: 0.1, power2: 0.05, pulseWidth: 150e-15, repRate: 80e6,
    deff: 1e-12, thickness: 0.05e-6, deltaN: 0.01,
  });
  close(s.sfgWavelength, 452.17391304347825e-9);
  close(s.lateralFwhm, 420.4084129769588e-9);
  close(s.forwardCoherenceLength, 22.608695652173914e-6);
  close(s.backwardCoherenceLength, 84.6767627422244e-9);
  close(s.xi, 0.02358715531266508, 1e-8);
  close(s.power, 49528.588583971585e-12, 1e-8);
  close(s.photonRate, 112741737344.29617, 1e-8);
});

test("sum-frequency summary: a layer thicker than the focus withholds the power; Δn = 0 gives an infinite forward length", () => {
  const thick = sfgSummary({
    lambda1: 1040e-9, lambda2: 800e-9, na: 0.8, n: 1.33, power1: 0.1, power2: 0.05, pulseWidth: 150e-15, repRate: 80e6,
    deff: 1e-12, thickness: 100e-6, deltaN: 0.01,
  });
  assert.ok(thick.xi > 1);
  assert.ok(Number.isNaN(thick.power));
  const matched = sfgSummary({
    lambda1: 1040e-9, lambda2: 800e-9, na: 0.8, n: 1.33, power1: 0.1, power2: 0.05, pulseWidth: 150e-15, repRate: 80e6,
    deff: 1e-12, thickness: 0.05e-6, deltaN: 0,
  });
  assert.equal(matched.forwardCoherenceLength, Infinity);
});

const srs = {
  pumpWavelength: 800e-9, ramanShift: 285000, na: 1, n: 1.33, pumpPower: 0.1, stokesPower: 0.08, detectedBeam: "stokes",
  deltaSource: "measured", modulationDepth: 10e-6, ramanGain: 1e-11, pulseWidth: 6e-12, repRate: 80e6, quantumEfficiency: 0.8,
  pixelDwell: 1e-6,
};

test("SRS summary: Stokes detection, measured δ = 10 ppm (Ozeki et al. 2009, doi:10.1364/OE.17.003651: SNR = δ√N)", () => {
  const s = srsSummary(srs);
  // λ_S = 1/(1/800 nm − 285000 m⁻¹) = 1036.2694300518 nm; N = ηPτλ/(hc) = 3.338688708e11.
  close(s.stokesWavelength, 1036.2694300518135e-9);
  close(s.beatFrequency, 85.44085053e12);
  close(s.photoelectrons, 333868870800.76, 1e-9);
  close(s.snr, 5.778138721082767, 1e-9);
  close(s.minDelta, 1.7306611147137876e-6, 1e-9);
  close(s.frameTime, 0.262144);
});

test("SRS summary: gain mode, SRL: δ = (λ_S/λ_p) g_R F P̂_S/√2 with F = √2 π n/√(λ_p² + λ_S²)", () => {
  const s = srsSummary({ ...srs, detectedBeam: "pump", deltaSource: "gain" });
  close(s.focusFactor, 4.513667444958061e6, 1e-9);
  close(s.delta, 0.006473122107739231, 1e-9);
  close(s.snr, 3674.2222293175205, 1e-9);
  assert.equal(s.deltaDepleted, false);
});

test("SRS summary: gain mode with huge peak power depletes (δ ≥ 1) and has no SNR; NA ≥ n has no focus", () => {
  const depleted = srsSummary({ ...srs, deltaSource: "gain", ramanGain: 1e-9, pulseWidth: 0.1e-12, repRate: 1e6 });
  assert.equal(depleted.deltaDepleted, true);
  assert.ok(Number.isNaN(depleted.snr));
  const noFocus = srsSummary({ ...srs, na: 1.5 });
  assert.equal(noFocus.focusOk, false);
  assert.ok(Number.isNaN(noFocus.lateralFwhm));
});
