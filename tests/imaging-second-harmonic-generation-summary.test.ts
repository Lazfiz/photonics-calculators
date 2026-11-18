import assert from "node:assert/strict";
import { test } from "node:test";
import { shgSummary } from "../src/physics/imaging/second-harmonic-generation-summary";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual / expected - 1) <= rel, `${actual} vs ${expected}`);

const base = {
  lambda: 800e-9, na: 0.45, n: 1.33, pulseWidth: 100e-15, avgPower: 50e-3, repRate: 80e6, deff: 1e-12, length: 10e-6, deltaN: 0,
};

// Boyd & Kleinman 1968 (J. Appl. Phys. 39, 3597, doi:10.1063/1.1656831), σ = 0 so h = arctan²ξ/ξ; Zipfel et al. 2003
// (doi:10.1038/nbt899) focus w₀ = 2·0.320 λ/(√2 NA) = 0.80453038 µm (NA ≤ 0.7); b = 2π n w₀²/λ = 6.76124107 µm;
// ξ = L/b = 1.47901841; h = 0.64442234; K = 16π² d² L h/(ε₀ c n² λ³) = 4.2329939e-7 W⁻¹;
// Gaussian pulses (Xu & Webb 1996, doi:10.1364/JOSAB.13.000481): ⟨P_2ω⟩ = K g ⟨P⟩²/(fτ), g = √(2 ln 2/π) = 0.66428247
// → 87.871989 µW, i.e. 0.17574398 % of 50 mW. Hand-worked in a scratch script that does not call the repo.
test("SHG summary for a phase-matched slab matches the hand-worked Boyd–Kleinman value", () => {
  const s = shgSummary(base);
  close(s.w0, 0.8045303821500274e-6);
  close(s.b, 6.761241073425401e-6);
  close(s.xi, 1.479018406739603);
  close(s.h, 0.6444223439515031);
  close(s.shPower, 87.87198881580157e-6);
  close(s.efficiency, 0.0017574397763160313);
  close(s.shgWavelength, 400e-9);
  close(s.pulseEnergy, 0.625e-9); // 50 mW / 80 MHz
  close(s.bandwidth, 4.4127120030530325e12); // (2 ln 2/π)/100 fs = 0.44127120/100 fs
  assert.equal(s.forwardCoherenceLength, Infinity);
});

// Coherence lengths π/|Δk|, Δk = 2k_ω − k_2ω = −4πΔn/λ: forward λ/(4|Δn|) = 20 µm; backward λ/(4(n + n₂ω)) = 74.906367 nm.
test("coherence lengths of a dispersive slab", () => {
  const s = shgSummary({ ...base, deltaN: 0.01 });
  close(s.forwardCoherenceLength, 20e-6);
  close(s.backwardCoherenceLength, 74.9063670411985e-9);
});

test("focus-dependent results are NaN for NA ≥ n, the rest stays finite", () => {
  const s = shgSummary({ ...base, na: 1.4 });
  assert.ok(Number.isNaN(s.lateralFwhm) && Number.isNaN(s.shPower) && Number.isNaN(s.efficiency));
  close(s.pulseEnergy, 0.625e-9);
});
