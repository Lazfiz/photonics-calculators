import test from "node:test";
import assert from "node:assert/strict";

import { alphaPpm, CTE_TABLE, expansionWaves, thermalExpansion } from "../src/physics/materials/thermal-expansion";

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
