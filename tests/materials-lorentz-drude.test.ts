import test from "node:test";
import assert from "node:assert/strict";

import { inTabulatedRange, lorentzDrudePermittivity, RAKIC_LD, rakicIndex, type RakicMetal } from "../src/physics/materials/lorentz-drude";

// refractiveindex.info database (CC0), main/<metal>/nk/Rakic-LD.yml: n and k tabulated from the Rakić et al.
// (1998) LD model, Appl. Opt. 37, 5271, doi:10.1364/AO.37.005271. Rows: wavelength (µm), n, k, 5 significant
// figures. The wavelength is rounded too, which moves n, k by up to ~2e-4 relative where they change fastest.
const TABLE: Record<RakicMetal, [number, number, number][]> = {
  Ag: [
    [0.30184, 1.3162, 0.63073],
    [0.55518, 0.13465, 3.2132],
    [0.80658, 0.17457, 5.071],
    [1.0013, 0.21994, 6.4341],
    [3.0107, 1.2442, 19.905],
    [9.9874, 11.861, 63.28],
  ],
  Al: [
    [0.3002, 0.25129, 3.4853],
    [0.55033, 0.96708, 6.4617],
    [0.79962, 2.6719, 8.3382],
    [1.0005, 1.4765, 9.2887],
    [2.9935, 4.3326, 29.332],
    [9.9771, 22.201, 82.602],
  ],
  Cr: [
    [0.29923, 1.0923, 2.6846],
    [0.5496, 2.8979, 4.2302],
    [0.80033, 4.145, 4.3029],
    [0.99835, 4.4537, 4.2425],
    [2.9988, 3.5993, 9.1939],
    [10.005, 7.51, 32.848],
  ],
};

test("Rakić LD: n and k match the refractiveindex.info tables", () => {
  for (const metal of ["Ag", "Al", "Cr"] as const) {
    for (const [um, n, k] of TABLE[metal]) {
      const N = rakicIndex(metal, um * 1e-6);
      assert.ok(Math.abs(N.n / n - 1) < 5e-4, `${metal} ${um} µm: n ${N.n} vs ${n}`);
      assert.ok(Math.abs(N.k / k - 1) < 5e-4, `${metal} ${um} µm: k ${N.k} vs ${k}`);
      assert.ok(inTabulatedRange(metal, um * 1e-6));
    }
  }
});

test("Rakić LD: limits and domain", () => {
  // Normal-incidence reflectance of bulk Al at 550 nm from the tabulated n, k: ((n−1)² + k²)/((n+1)² + k²) = 91.5 %.
  const al = rakicIndex("Al", 550e-9);
  const R = ((al.n - 1) ** 2 + al.k ** 2) / ((al.n + 1) ** 2 + al.k ** 2);
  assert.ok(Math.abs(R - 0.9152) < 5e-4, `R(Al, 550 nm) = ${R}`);
  // Far IR: the Drude term dominates, ε ≈ 1 − f₀ω_p²/(E² + Γ₀²) + Σ fⱼω_p²/Eⱼ², so Im ε → f₀ω_p²/(EΓ₀) grows as λ.
  const m = RAKIC_LD.Ag;
  const lam = 1e-3; // 1 mm, E = 1.24 meV ≪ Γ₀
  const eps = lorentzDrudePermittivity(m, lam);
  const E = 1.23984198e-6 / lam;
  const imDrude = (m.f0 * m.plasma ** 2 * m.gamma0) / (E * (E * E + m.gamma0 ** 2));
  assert.ok(Math.abs(eps.im / imDrude - 1) < 1e-3, `${eps.im} vs ${imDrude}`);
  assert.equal(inTabulatedRange("Ag", lam), false);
  assert.ok(Number.isNaN(rakicIndex("Ag", 0).n));
  assert.ok(Number.isNaN(rakicIndex("Cr", -1e-6).k));
});
