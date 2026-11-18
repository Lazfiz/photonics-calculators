// Golden values for modeFieldSummary (src/physics/fiber-optics/mode-field-diameter.ts), from an independent script (own Bessel
// series and K_ν integral, bisection for the LP01 root): Petermann II w = √2 a J₁(U)/(W J₀(U)) (Petermann, Electron. Lett. 19, 712 (1983)),
// b = W²/V², n_eff² = n₂² + b NA², Γ = b(1 + J₀²/J₁²) (Gloge, Appl. Opt. 10, 2252 (1971)), Marcuse's fit (Bell Syst. Tech. J. 56, 703 (1977)).
import assert from "node:assert/strict";
import { test } from "node:test";

import { modeFieldSummary } from "../src/physics/fiber-optics/mode-field-diameter";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

test("SMF-28-like fibre at 1550 nm", () => {
  const s = modeFieldSummary({ a: 4.1e-6, n1: 1.4494, NA: 0.1246 }, 1550e-9);
  close(s.V, 2.070856803887589);
  close(2 * s.wPII, 9.886416700476806e-6);
  close(2 * s.wFit, 10.084209113123363e-6);
  close(s.aeff, 79.86813939112481e-12);
  close(s.cutoff, 1.3347446494627734e-6);
  close(s.delta, 0.0036951287485260814);
  close(s.n2, 1.4440343486219434);
  close(s.b, 0.43863766711334734);
  close(s.nEff, 1.4463903760617192);
  close(s.gamma, 0.7594711892084486);
});

test("a = 5 µm, NA 0.1, n₁ 1.45 at 1310 nm; V below 0.5 has no result", () => {
  const s = modeFieldSummary({ a: 5e-6, n1: 1.45, NA: 0.1 }, 1310e-9);
  close(s.V, 2.3981623309845754);
  close(2 * s.wPII, 10.8222790570697e-6);
  close(2 * s.wFit, 11.010768459685556e-6);
  close(s.b, 0.5295716503427421);
  const weak = modeFieldSummary({ a: 0.5e-6, n1: 1.45, NA: 0.01 }, 5000e-9);
  assert.ok(Number.isNaN(weak.wPII) && Number.isNaN(weak.wFit) && Number.isNaN(weak.b));
});
