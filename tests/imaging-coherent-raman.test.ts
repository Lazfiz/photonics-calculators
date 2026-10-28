import test from "node:test";
import assert from "node:assert/strict";

import {
  antiStokesWavelength, carsLineshape, carsPeakDetuning, excitationBandwidth, ramanShiftFrequency, srsFocusFactor, srsLineshape,
  srsModulationDepth, stokesWavelength,
} from "../src/physics/imaging/coherent-raman";
import { gaussianPulsePeakPower } from "../src/physics/imaging/multiphoton-focus";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const perCm = 100; // 1 cm⁻¹ in 1/m

test("SRS of the CH₂ stretch: 816.8 nm pump and 2845 cm⁻¹ need a 1064 nm Stokes", () => {
  // Freudiger et al., Science 322, 1857 (2008) image lipids at 2845 cm⁻¹ with a 1064.2 nm Stokes beam.
  // Hand calculation: 1/816.8 nm = 12242.90 cm⁻¹; − 2845 = 9397.90 cm⁻¹ → 1064.07 nm.
  // Anti-Stokes: 12242.90 + 2845 = 15087.90 cm⁻¹ → 662.78 nm.
  assertRel(stokesWavelength(816.8e-9, 2845 * perCm), 1064.07e-9, 1e-5, "Stokes");
  assertRel(antiStokesWavelength(816.8e-9, 2845 * perCm), 662.78e-9, 1e-5, "anti-Stokes");
  // Page default: 800 nm, 2850 cm⁻¹ → Stokes 1036.27 nm, anti-Stokes 651.47 nm.
  assertRel(stokesWavelength(800e-9, 2850 * perCm), 1036.269e-9, 1e-5, "Stokes default");
  assertRel(antiStokesWavelength(800e-9, 2850 * perCm), 651.466e-9, 1e-5, "anti-Stokes default");
  // 2850 cm⁻¹ = 85.44 THz (c = 299 792 458 m/s).
  assertRel(ramanShiftFrequency(2850 * perCm), 85.4408e12, 1e-5, "Ω");
  // Energy conservation: 2ν_p = ν_s + ν_as.
  const p = 1 / 800e-9, s = 1 / stokesWavelength(800e-9, 2850 * perCm), as = 1 / antiStokesWavelength(800e-9, 2850 * perCm);
  assertRel(s + as, 2 * p, 1e-12, "2ω_p = ω_s + ω_as");
});

test("CARS lineshape: dispersive, maximum below the resonance (hand algebra)", () => {
  // |χ_NR + χ_R|² = a² + (Γ² − 2aΓΔ)/(Δ² + Γ²); extremes where aΔ² − ΓΔ − aΓ² = 0.
  // a = 0.3: Δ = Γ(1 ∓ √1.36)/0.6 → maximum at −0.276984 Γ, minimum at +3.610317 Γ.
  const a = 0.3, G = 15;
  assertRel(carsPeakDetuning(G, a), -0.276984 * G, 1e-5, "peak");
  const peak = carsLineshape(-0.276984 * G, G, a);
  assert.ok(peak > carsLineshape(-0.25 * G, G, a) && peak > carsLineshape(-0.3 * G, G, a), "local maximum");
  // Values: at resonance 1 + a² = 1.09; far away a² = 0.09; at the dip a² + (1 − 2a·3.610317)/(1 + 3.610317²).
  assertRel(carsLineshape(0, G, a), 1.09, 1e-12, "on resonance");
  assertRel(carsLineshape(1e9, G, a), 0.09, 1e-6, "far wing");
  assertRel(carsLineshape(3.610317 * G, G, a), 0.09 + (1 - 0.6 * 3.610317) / (1 + 3.610317 ** 2), 1e-6, "dip");
  assert.ok(carsLineshape(3.610317 * G, G, a) < 0.09, "the dip goes below the background");
  // No background: CARS is Lorentzian squared magnitude = SRS lineshape.
  assertRel(carsLineshape(7, G, 0), srsLineshape(7, G), 1e-12, "a = 0");
  assert.equal(carsPeakDetuning(G, 0), 0);
});

test("SRS lineshape is a Lorentzian with half width Γ", () => {
  assert.equal(srsLineshape(0, 15), 1);
  assertRel(srsLineshape(15, 15), 0.5, 1e-12, "HWHM");
});

test("domain guards", () => {
  // 1/800 nm = 12500 cm⁻¹: a shift at or above it has no Stokes photon.
  assert.ok(Number.isNaN(stokesWavelength(800e-9, 12500 * perCm)));
  assert.ok(Number.isNaN(stokesWavelength(0, 2850 * perCm)));
  assert.ok(Number.isNaN(antiStokesWavelength(800e-9, -1)));
  assert.ok(Number.isNaN(carsLineshape(0, 0, 0.3)));
  assert.ok(Number.isNaN(srsLineshape(0, -1)));
});

test("CARS from the pump and Stokes wavelengths: 532 nm and 630 nm give 2924 cm⁻¹ and a 460.4 nm signal", () => {
  // Hand calculation: 10⁷/532 − 10⁷/630 = 18796.99 − 15873.02 = 2923.98 cm⁻¹; ν̃_aS = 2ν̃_p − ν̃_S = 21720.96 cm⁻¹
  // → 460.385 nm (the audit value of spectroscopy/coherent-anti-stokes-raman, PR #127).
  const shift = 1 / 532e-9 - 1 / 630e-9;
  assertRel(shift / perCm, 2923.977, 1e-6, "shift");
  assertRel(antiStokesWavelength(532e-9, shift) * 1e9, 460.3846, 1e-6, "λ_aS");
});

test("Excitation bandwidth of two 2 ps transform-limited Gaussian pulses is 10.41 cm⁻¹", () => {
  // Δν = (2 ln 2/π)·√2/τ (time–bandwidth product 0.4413 of a Gaussian, envelope I_p I_S of FWHM τ/√2):
  // 0.441271·1.414214/(2e-12 s · 2.99792458e10 cm/s) = 10.4081 cm⁻¹.
  assertRel(excitationBandwidth(2e-12) / perCm, 10.4081, 1e-4, "2 ps");
  // Scales as 1/τ.
  assertRel(excitationBandwidth(200e-15) / excitationBandwidth(2e-12), 10, 1e-12, "1/τ");
  assert.ok(Number.isNaN(excitationBandwidth(0)), "τ = 0");
});

test("SRS focus factor √2πn/√(λp² + λS²) matches a quadrature over the two Gaussian beams, at any NA", () => {
  // Independent check: ∫ 2/(π(w_p(z)² + w_S(z)²)) dz with w_i² = w_i0²(1 + z²/z_Ri²), w_i0 = λ_i/(πnθ),
  // z_Ri = πn w_i0²/λ_i, integrated with the substitution z = Z tan u (trapezoid, 20000 steps).
  const lp = 800e-9, ls = 1036.27e-9, n = 1.33;
  for (const theta of [0.05, 0.3]) {
    const w0 = (l: number) => l / (Math.PI * n * theta);
    const zr = (l: number) => (Math.PI * n * w0(l) ** 2) / l;
    const Z = zr(lp);
    const N = 20000;
    // Both ends (u = ±π/2) tend to 1/(πθ²Z), half weight each in the trapezoid rule.
    let sum = 1 / (Math.PI * theta ** 2 * Z);
    for (let i = 1; i < N; i++) {
      const u = -Math.PI / 2 + (Math.PI * i) / N;
      const z = Z * Math.tan(u);
      const w2 = (l: number) => w0(l) ** 2 * (1 + (z / zr(l)) ** 2);
      sum += (2 / (Math.PI * (w2(lp) + w2(ls)))) * (Z / Math.cos(u) ** 2);
    }
    assertRel(srsFocusFactor(lp, ls, n), (sum * Math.PI) / N, 1e-6, `θ = ${theta}`);
  }
  // Equal wavelengths: πn/λ, the on-axis ∫dz/(πw²) of one beam (z_R/w0² = πn/λ).
  assertRel(srsFocusFactor(1e-6, 1e-6, 1), Math.PI / 1e-6, 1e-12, "equal λ");
});

test("SRS modulation depth from g_R: SRG gR·F·P_p, SRL carries ω_p/ω_S, Gaussian pulses weight by 1/√2", () => {
  // g_R = 1 cm/GW = 1e-11 m/W, F(800 nm, 1036.27 nm, n 1.33) = 4.5137e6 m⁻¹, P̂ = 1 W, CW: δ = 4.5137e-5.
  const lp = 800e-9, ls = 1036.27e-9;
  const F = srsFocusFactor(lp, ls, 1.33);
  assertRel(F, 4.51367e6, 1e-5, "F");
  assertRel(srsModulationDepth(1e-11, 1, lp, ls, 1.33, "stokes", "cw"), 1e-11 * F, 1e-12, "SRG cw");
  assertRel(srsModulationDepth(1e-11, 1, lp, ls, 1.33, "pump", "cw"), (1e-11 * F * ls) / lp, 1e-12, "SRL cw");
  assertRel(srsModulationDepth(1e-11, 1, lp, ls, 1.33, "stokes", "gaussian"), (1e-11 * F) / Math.SQRT2, 1e-12, "SRG pulsed");
  assert.equal(srsModulationDepth(0, 1, lp, ls, 1.33, "stokes", "cw"), 0, "no gain");
  assert.ok(Number.isNaN(srsModulationDepth(-1, 1, lp, ls, 1.33, "stokes", "cw")), "negative gain");
  // Page defaults, hand calculation: P̂ = 0.939·0.1 W/(80 MHz · 6 ps) = 195.7 W, δ = 1e-11 · 4.5137e6 · 195.7/√2 = 6.2466e-3.
  assertRel(srsModulationDepth(1e-11, gaussianPulsePeakPower(0.1, 80e6, 6e-12), lp, ls, 1.33, "stokes", "gaussian"), 6.2466e-3, 1e-4, "SRG defaults");
  // 500 mW Stokes in 0.1 ps pulses: δ_SRL ≈ 2.4, a pump loss above 100 %: outside the small-signal model.
  assert.ok(Number.isNaN(srsModulationDepth(1e-11, gaussianPulsePeakPower(0.5, 80e6, 0.1e-12), lp, ls, 1.33, "pump", "gaussian")), "δ ≥ 1");
});
