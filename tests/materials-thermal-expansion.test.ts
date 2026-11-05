import test from "node:test";
import assert from "node:assert/strict";

import {
  alphaPpm, CTE_TABLE, expansionWaves, siliconAlpha, siliconAlphaIntegral, siliconExpansion, siliconMeanAlpha, thermalExpansion,
} from "../src/physics/materials/thermal-expansion";

test("thermal expansion ΔL = αLΔT (PR #155 golden value)", () => {
  // Si, α = 2.6e-6/K at 300 K (Okada & Tokumaru 1984, doi:10.1063/1.333965), L = 100 mm, ΔT = 10 K: ΔL = 2.6 µm.
  const dL = thermalExpansion(2.6e-6, 0.1, 10);
  assert.ok(Math.abs(dL - 2.6e-6) < 1e-15, `${dL}`);
  // 2.6 µm is 4.11 waves of 633 nm.
  assert.ok(Math.abs(expansionWaves(dL, 633e-9) - 4.1074) < 1e-4);
  // Cooling contracts; λ ≤ 0 is guarded.
  assert.ok(thermalExpansion(2.6e-6, 0.1, -10) < 0 && Number.isNaN(expansionWaves(dL, 0)));
});

test("CTE table: sourced room-temperature values, sorted, in 1/K", () => {
  const ppm = Object.fromEntries(CTE_TABLE.map((m) => [m.name, alphaPpm(m.alpha)]));
  // Crystran data sheets (fused silica 0.55, CaF₂ 18.85, Si 2.6, sapphire ∥ c 5.6), Corning ULE 7972 (0 ± 0.03, 5–35 °C),
  // SCHOTT Zerodur class 1 (0 ± 0.05) and SF11 (6.1), Kaye & Laby 293 K (Cu 16.5, Pyrex 2.8), NIST 293 K slopes
  // (6061-T6 22.6, Invar 0.9, 304 15.4).
  const golden: Record<string, number> = {
    "Fused Silica": 0.55, "CaF₂": 18.85, Si: 2.6, "Sapphire ∥ c": 5.6, "ULE 7972": 0.03, Zerodur: 0.05, SF11: 6.1,
    Copper: 16.5, "Pyrex (Borosilicate)": 2.8, "Aluminum 6061-T6": 22.6, "Invar 36": 0.9, "Stainless 304": 15.4,
  };
  for (const [name, value] of Object.entries(golden)) assert.equal(ppm[name], value, name);
  // Stored in SI (1/K), every value positive and below 1e-4, sorted ascending, names unique.
  assert.ok(CTE_TABLE.every((m, i) => m.alpha > 0 && m.alpha < 1e-4 && (i === 0 || CTE_TABLE[i - 1].alpha <= m.alpha)));
  assert.equal(new Set(CTE_TABLE.map((m) => m.name)).size, CTE_TABLE.length);
  // The page's preset: 100 mm of 6061-T6 heated by 10 K grows 22.6 µm.
  const al = CTE_TABLE.find((m) => m.name === "Aluminum 6061-T6")!;
  assert.ok(Math.abs(thermalExpansion(al.alpha, 0.1, 10) - 22.6e-6) < 1e-15);
  // alphaPpm strips float noise: 0.05e-6 × 1e6 is 0.049999… in IEEE doubles.
  assert.equal(alphaPpm(0.05e-6), 0.05);
});

test("silicon α(T): Okada & Tokumaru (1984) fit, closed-form integral", () => {
  // Abstract of J. Appl. Phys. 56, 314 (doi:10.1063/1.333965): α = (3.725{1 − exp[−5.88e-3 (T − 124)]} + 5.548e-4 T) 1e-6 /K,
  // 120–1500 K. Hand values: 300 K: 3.725 (1 − e^−1.03488) + 0.16644 = 2.56806; 1500 K: 3.72389 + 0.83220 = 4.55606.
  assert.ok(Math.abs(siliconAlpha(300) - 2.56806e-6) < 1e-11, `${siliconAlpha(300)}`);
  assert.ok(Math.abs(siliconAlpha(1500) - 4.55606e-6) < 1e-11, `${siliconAlpha(1500)}`);
  // Paszkowicz, Powder Diffr. 10, 223 (1995), doi:10.1017/s0885715600014792: Okada–Tokumaru's room-temperature α is "about
  // 2.6e-6 /K", varying "by about 0.01e-6 /K" per kelvin; Hartwig et al. (1994) correct 20 °C lattice parameters with 2.51e-6.
  assert.equal(+(siliconAlpha(293.15) * 1e6).toFixed(2), 2.51);
  const slope = (siliconAlpha(301) - siliconAlpha(299)) / 2;
  assert.ok(slope > 0.007e-6 && slope < 0.01e-6, `${slope}`);
  // The closed-form integral against an independent trapezoid sum (2e5 steps) of the fit as written in the abstract.
  const raw = (T: number) => (3.725 * (1 - Math.exp(-5.88e-3 * (T - 124))) + 5.548e-4 * T) * 1e-6;
  for (const [a, b] of [[300, 400], [293.15, 1273.15], [120, 1500], [800, 300]]) {
    const n = 200000, h = (b - a) / n;
    let sum = 0;
    for (let i = 0; i <= n; i++) sum += (i === 0 || i === n ? 0.5 : 1) * raw(a + i * h);
    assert.ok(Math.abs(siliconAlphaIntegral(a, b) - sum * h) < 1e-12, `${a}–${b}`);
  }
  // Mean α over 300–400 K is 2.919e-6 /K (the page's warning quotes 2.92); T1 = T2 gives α itself.
  assert.ok(Math.abs(siliconMeanAlpha(300, 400) - 2.91863e-6) < 1e-11);
  assert.equal(siliconMeanAlpha(300, 300), siliconAlpha(300));
  // 100 mm heated 20 → 120 °C: L·expm1(2.87371e-4) = 28.741 µm (constant 2.6e-6: 26.0 µm). Cooling back undoes it exactly.
  const dL = siliconExpansion(0.1, 293.15, 393.15);
  assert.ok(Math.abs(dL - 28.7412e-6) < 1e-10, `${dL}`);
  assert.ok(Math.abs((0.1 + dL) * Math.exp(siliconAlphaIntegral(393.15, 293.15)) - 0.1) < 1e-16);
  // Outside 120–1500 K the fit is not used.
  assert.ok(Number.isNaN(siliconAlpha(119)) && Number.isNaN(siliconAlpha(1501)) && Number.isNaN(siliconExpansion(0.1, 77, 300)));
});
