import test from "node:test";
import assert from "node:assert/strict";

import {
  antiStokesWavelength, carsLineshape, carsPeakDetuning, ramanShiftFrequency, srsLineshape, stokesWavelength,
} from "../src/physics/imaging/coherent-raman";

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
