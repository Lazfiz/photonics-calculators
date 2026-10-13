import { test } from "node:test";
import assert from "node:assert/strict";
import { SPECIALTY_FIBERS, specialtyCutoff, specialtyMfd, specialtyV } from "../src/physics/fiber-optics/specialty-fiber";
import { LP11_CUTOFF_V } from "../src/physics/fiber-optics/macro-bending-loss";

test("step-index cutoff from data-sheet core and NA matches each sheet's cutoff", () => {
  // Data-sheet cutoff ± tolerance (nm): PM1550-XP 1380 ± 60, Er16-8/125 1250 ± 150, Yb1200-4/125 1010 ± 70,
  // SM-TSF-9/125 1750 ± 100. IRZS23 2300 states no tolerance; its NA ± 0.02 and core ± 0.5 µm propagate to ± 16 %.
  // IRF-S-9 2650 (no tolerances; its NA 0.225 is from the product page, so this is a consistency check: 3 %).
  const tol: Record<string, number> = { pm: 60, edf: 150, ydf: 70, tdf: 100, zblan: 370, chalcogenide: 80 };
  for (const [id, f] of Object.entries(SPECIALTY_FIBERS)) {
    const lc = specialtyCutoff(f) * 1e9;
    assert.ok(Math.abs(lc - f.cutoff * 1e9) <= tol[id], `${id}: ${lc.toFixed(0)} vs ${f.cutoff * 1e9}`);
  }
  // Hand calculation: PM1550-XP, π × 8.5 µm × 0.125 / j₀₁ (2.404826) = 1388.02 nm.
  assert.ok(Math.abs(specialtyCutoff(SPECIALTY_FIBERS.pm) - 1388.02e-9) < 0.01e-9);
});

test("Marcuse MFD matches the data-sheet MFD within its tolerance", () => {
  // PM1550-XP 10.1 ± 0.4 µm @ 1550; Er16-8 9.5 ± 0.8 @ 1550; Yb1200-4 4.4 ± 0.8 @ 1060; IRZS23 10.5 ± 0.5 @ 2500;
  // SM-TSF-9 10.5 µm nominal @ 2000 (5 %). The IRZS23 MFD is itself calculated from its typical NA and core (sheet
  // note b), so that row only checks consistency.
  const tol: Record<string, number> = { pm: 0.4, edf: 0.8, ydf: 0.8, zblan: 0.5, tdf: 0.53 };
  for (const [id, t] of Object.entries(tol)) {
    const f = SPECIALTY_FIBERS[id as keyof typeof SPECIALTY_FIBERS];
    const mfd = specialtyMfd(f, f.mfd.lambda) * 1e6;
    assert.ok(Math.abs(mfd - f.mfd.value * 1e6) <= t, `${id}: ${mfd.toFixed(2)} µm`);
  }
});

test("V is 2.4048 (first zero of J₀) at the step-index cutoff and NaN for λ ≤ 0", () => {
  const f = SPECIALTY_FIBERS.zblan;
  assert.ok(Math.abs(specialtyV(f, specialtyCutoff(f)) - LP11_CUTOFF_V) < 1e-12);
  assert.ok(Number.isNaN(specialtyV(f, 0)));
  // Doped fibres carry an absorption figure and passive ones an attenuation figure, never both.
  for (const g of Object.values(SPECIALTY_FIBERS)) assert.ok(("attenuation" in g) !== ("absorption" in g));
});

test("Marcuse MFD is withheld below V = 1.2 (PM1550-XP at 5 µm, V = 0.67)", () => {
  assert.ok(Number.isNaN(specialtyMfd(SPECIALTY_FIBERS.pm, 5e-6)));
  assert.ok(Number.isFinite(specialtyMfd(SPECIALTY_FIBERS.pm, 2e-6)));
});
