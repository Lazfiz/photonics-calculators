import assert from "node:assert/strict";
import test from "node:test";

import { adaptiveOpticsSummary } from "../src/physics/imaging/adaptive-optics";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Modal values: the script sums Noll's radial orders to n = 2·10⁶ plus the closed-form tail (3/5)N^(−5/3). Noll, J. Opt. Soc. Am. 66, 207 (1976), doi:10.1364/JOSA.66.000207 (Δ_J, Δ₁ = 1.0299); Hudgin, JOSA 67, 393 (1977) (κ);
// Parenti & Sasiela, JOSA A 11, 288 (1994) (Strehl). Values worked by an independent script (Lanczos lnΓ, Noll's
// (n+1)Γ(n−5/6)/Γ(n+23/6) per mode scaled to Δ₁, sum to n = 2·10⁶), not the repo function.
test("adaptiveOpticsSummary: D/r0 = 10, J = 15, 32 continuous actuators, 550 nm", () => {
  // 10^(5/3) = 46.4158883: open 1.0299·46.4158883 = 47.8037234; Δ₁₅ = 0.02790638461 → 1.29529963; κ(d/r₀)^(5/3) = 0.28·0.3125^(5/3) = 0.0402941;
  // Δ₃ = 0.13433478 → tip-tilt-removed σ² = 6.235268, stroke 3·σ·λ/2π = 0.65573996 µm
  const r = adaptiveOpticsSummary({ wavelength: 550e-9, dr0: 10, modes: 15, actuators: 32, dmType: "continuous", stroke: 5e-6 });
  assertRel(r.openVariance, 47.80372339737802, 1e-9, "open");
  assertRel(r.openRms, 605.2205746116061e-9, 1e-9, "open rms");
  assertRel(r.modalVariance, 1.2952996320421564, 1e-8, "modal");
  assertRel(r.zonalVariance, 0.04029409451637923, 1e-9, "zonal");
  assertRel(r.strehlOpen, 0.009900990099009901, 1e-9, "Strehl open");
  assertRel(r.strehlModal, 0.28100575054353794, 1e-8, "Strehl modal");
  assertRel(r.strehlZonal, 0.9608979384088129, 1e-9, "Strehl zonal");
  assertRel(r.strokeNeeded, 0.6557399566170983e-6, 1e-8, "stroke");
  assert.equal(r.strokeShort, false);
  assert.equal(r.pitchOverR0, 0.3125);
});

test("adaptiveOpticsSummary: a short stroke is flagged; fractional J rounds", () => {
  const short = adaptiveOpticsSummary({ wavelength: 550e-9, dr0: 10, modes: 15, actuators: 32, dmType: "continuous", stroke: 0.5e-6 });
  assert.equal(short.strokeShort, true);
  const a = adaptiveOpticsSummary({ wavelength: 1000e-9, dr0: 4, modes: 2.6, actuators: 16, dmType: "segmentedPiston", stroke: 5e-6 });
  const b = adaptiveOpticsSummary({ wavelength: 1000e-9, dr0: 4, modes: 3, actuators: 16, dmType: "segmentedPiston", stroke: 5e-6 });
  assert.equal(a.modalVariance, b.modalVariance);
  assertRel(b.modalVariance, 1.354009762733977, 1e-8, "J = 3");
  assertRel(b.zonalVariance, 0.1250078328424957, 1e-9, "piston-only segments");
});
