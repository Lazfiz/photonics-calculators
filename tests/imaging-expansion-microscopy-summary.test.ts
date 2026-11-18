// Expansion-microscopy summary (src/physics/imaging/expansion-microscopy.ts). Hand-worked from
// d_eff = √((d/E)² + L²), L = √(probe² + linker²), L → L/E for labels applied after expansion
// (Wassie, Zhao, Boyden 2019, Nat. Methods 16, 33–41, doi:10.1038/s41592-018-0219-4).
import assert from "node:assert/strict";
import test from "node:test";

import { expansionSummary } from "../src/physics/imaging/expansion-microscopy";

const near = (a: number, b: number, rel = 1e-9) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} vs ${b}`);
const nm = 1e-9;

test("E = 4, d = 250 nm, probe 10 nm, linker 15 nm, labelled before expansion", () => {
  const s = expansionSummary(250 * nm, 4, 10 * nm, 15 * nm, "pre", 50e-6);
  near(s.opticalTerm, 62.5 * nm);
  near(s.labelDisplacement, Math.sqrt(325) * nm); // √(100 + 225)
  near(s.labelTerm, Math.sqrt(325) * nm);
  near(s.effective, Math.sqrt(62.5 ** 2 + 325) * nm); // 65.04806 nm
  near(s.effectiveOther, Math.sqrt(62.5 ** 2 + 325 / 16) * nm); // 62.66229 nm
  near(s.fovLinear, 0.25);
  near(s.fovArea, 0.0625);
  near(s.expandedGel, 200e-6);
  near(s.volumeFactor, 64);
});

test("labelled after expansion the label term is L/E", () => {
  const s = expansionSummary(300 * nm, 10, 5 * nm, 8 * nm, "post", 50e-6);
  near(s.labelTerm, Math.sqrt(89) / 10 * nm);
  near(s.effective, Math.sqrt(900 + 0.89) * nm); // 30.01483 nm
});

test("E below 1 is rejected in every field", () => {
  const s = expansionSummary(250 * nm, 0.5, 0, 0, "pre", 1e-6);
  assert.equal(Object.keys(s).length, 9);
  for (const [key, value] of Object.entries(s)) assert.ok(Number.isNaN(value), key);
});
