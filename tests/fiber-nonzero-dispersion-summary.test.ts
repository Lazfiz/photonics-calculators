// Golden values for nonzeroDispersionSummary (src/physics/fiber-optics/nonzero-dispersion.ts), worked by hand:
// D(λ) = D(1550) + S(λ − 1550 nm) (ITU-T G.655 linear model), Δλ = λ²Δν/c, β₂ = −λ²D/(2πc) and
// β₃ = (λ²/(2πc))²(S + 2D/λ) (Agrawal, Fiber-Optic Communication Systems, 4th ed., eqs. 2.3.5, 2.3.13).
import assert from "node:assert/strict";
import { test } from "node:test";

import { nonzeroDispersionSummary } from "../src/physics/fiber-optics/nonzero-dispersion";

const close = (actual: number, expected: number, rel = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} vs ${expected}`);

const base = { wavelength: 1550e-9, length: 80e3, dispAt1550: 4.5e-6, dispSlope: 50, channelSpacing: 100e9 };

test("default NZ-DSF at 1550 nm", () => {
  // D = 4.5 ps/(nm·km); 80 km → 360 ps/nm = 0.36 s/m; C band 3.5..5.25; Δλ = (1550e-9)²·100e9/299792458 = 0.801387739 nm;
  // Δβ = −ω²(β₂ ± β₃ω), ω = 2π·100e9, β₂ = −5.73951690e-27, β₃ = 9.07841558e-41: smaller magnitude 2.24335142 rad/km.
  const s = nonzeroDispersionSummary(base);
  close(s.D, 4.5e-6);
  close(s.totalDisp, 0.36);
  close(s.dCMin, 3.5e-6);
  close(s.dCMax, 5.25e-6);
  close(s.deltaLambda, 0.8013877387135605e-9);
  close(s.deltaBeta, 2.2433514201357396e-3);
  close(s.dSMF, 17.460618823134503e-6); // (0.092/4)(1550 − 1310⁴/1550³) ps/(nm·km), G.652 Sellmeier form
  assert.equal(s.fwmRisk, false);
});

test("D crossing zero in the C band is flagged; S = 0 has no zero wavelength", () => {
  // D(1550) = 0.5 and S = 0.05: λ₀ = 1550 − 0.5/0.05 = 1540 nm, inside the C band, so D changes sign.
  const s = nonzeroDispersionSummary({ ...base, dispAt1550: 0.5e-6 });
  assert.equal(s.fwmRisk, true);
  assert.equal(s.lambda0InBand, true);
  const flat = nonzeroDispersionSummary({ ...base, dispSlope: 0 });
  assert.equal(flat.lambda0InBand, false);
});
