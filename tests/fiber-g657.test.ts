import test from "node:test";
import assert from "node:assert/strict";

import { bendLossPerTurnDb } from "../src/physics/fiber-optics/macro-bending-loss";
import { G657_LIMITS, g657Category, meetsG657 } from "../src/physics/fiber-optics/g657";

test("G.657 (11/2016) macrobend limits as tabulated", () => {
  // HFCL / STL tables of ITU-T G.657: A1 10 × 15 mm 0.25/1.0 dB, 1 × 10 mm 0.75/1.5 dB; A2/B2 10 × 15 mm 0.03/0.1,
  // 1 × 10 mm 0.1/0.2, 1 × 7.5 mm 0.5/1.0; B3 1 × 10 mm 0.03/0.1, 1 × 7.5 mm 0.08/0.25, 1 × 5 mm 0.15/0.45.
  const row = (c: keyof typeof G657_LIMITS) => G657_LIMITS[c].map((l) => [l.R * 1e3, l.turns, l.max1550, l.max1625]);
  assert.deepEqual(row("A1"), [[15, 10, 0.25, 1], [10, 1, 0.75, 1.5]]);
  assert.deepEqual(row("A2/B2"), [[15, 10, 0.03, 0.1], [10, 1, 0.1, 0.2], [7.5, 1, 0.5, 1]]);
  assert.deepEqual(row("B3"), [[10, 1, 0.03, 0.1], [7.5, 1, 0.08, 0.25], [5, 1, 0.15, 0.45]]);
});

test("category of step-index designs from Marcuse bend loss", () => {
  const perTurn = (a: number, NA: number) => (R: number, lambda: number) => bendLossPerTurnDb({ a, n1: 1.4494, NA }, lambda, R);
  // SMF-28-like (G.652): ≈ 14 dB/turn at 7.5 mm and 2.6 dB at 10 mm (1550 nm) → no G.657 category.
  assert.equal(g657Category(perTurn(4.1e-6, 0.1246)), null);
  // Same cutoff (≈ 1332 nm), smaller MFD (8.4 µm at 1550 nm): 0.90 dB/turn at 7.5 mm, 1625 nm → A2/B2 only.
  assert.equal(g657Category(perTurn(3.4e-6, 0.15)), "A2/B2");
  // a = 2.8 µm, NA 0.19: 0.016 dB at 5 mm, 1625 nm → B3 macrobend limits (MFD 5.9 µm at 1310 nm, so B only).
  assert.equal(g657Category(perTurn(2.8e-6, 0.19)), "B3");
});

test("category boundaries", () => {
  // Exactly at every A1 limit passes A1; 1 % over at 1625 nm fails it.
  const atLimit = (scale: number) => (R: number, lambda: number) => {
    const l = G657_LIMITS.A1.find((x) => x.R === R);
    if (!l) return 0;
    return ((lambda < 1600e-9 ? l.max1550 : l.max1625 * scale) / l.turns);
  };
  assert.equal(g657Category(atLimit(1)), "A1");
  assert.equal(g657Category(atLimit(1.01)), null);
  assert.equal(g657Category(() => 0), "B3");
  assert.equal(meetsG657("A1", () => NaN), false);
});
