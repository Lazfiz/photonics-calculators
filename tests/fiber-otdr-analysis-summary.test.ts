import test from "node:test";
import assert from "node:assert/strict";

import { otdrSummary } from "../src/physics/fiber-optics/otdr";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

// Golden values from an independent scratch script (299792458 m/s; Δz = cτ/2n_g, α_s = A/λ⁴, S = 1.5(λ/2πnw)², η = S α_s Δz sinh(αΔz)/(αΔz),
// P_n = NEP √(1/2τ)/√N, DR = 5 log₁₀(P_bs/P_n), peak = 5 log₁₀(1 + R/η)); Barnoski & Jensen, Appl. Opt. 15, 2112 (1976);
// Brinkmeyer, J. Opt. Soc. Am. 70, 1010 (1980).
test("OTDR summary at the page defaults (SMF-28, 1550 nm, 100 ns, 50 km)", () => {
  const s = otdrSummary({
    wavelength: 1550e-9, modeFieldDiameter: 10.4e-6, rayleighA: 0.85, lossDbPerKm: 0.19, nPhase: 1.447, nGroup: 1.4682,
    pulseWidth: 100e-9, length: 50e3, splices: 5, spliceLossDb: 0.1, launchReflectanceDb: -45, peakPowerDbm: 20,
    nep: 0.5e-12, averages: 65536,
  });
  assertRel(s.resolution, 10.209523838714073, 1e-9, "Δz");
  assertRel(s.alphaS_dBkm, 0.1472624878048252, 1e-9, "α_s");
  assertRel(10 * Math.log10(s.eta1), -82.53235521565091, 1e-9, "η(1 ns) dB");
  assertRel(10 * Math.log10(s.eta), -62.53235507126023, 1e-9, "η(100 ns) dB");
  assertRel(s.dr, 20.532747258408996, 1e-9, "DR");
  assertRel(s.spanLoss, 10, 1e-12, "span loss");
  assertRel(s.farEndMargin, 10.532747258408996, 1e-9, "margin");
  assertRel(s.maxLength, 108.06709083373156, 1e-9, "reach");
  assertRel(s.endPeak, 23.882949395290638, 1e-9, "end peak");
  assertRel(s.launchPeak, 8.804171435926829, 1e-9, "launch peak");
  assertRel(s.acquisition, 32.095522296294725, 1e-9, "acquisition");
});

test("OTDR summary: a dynamic range that is not positive has no reach", () => {
  const s = otdrSummary({
    wavelength: 1550e-9, modeFieldDiameter: 10.4e-6, rayleighA: 0.85, lossDbPerKm: 0.19, nPhase: 1.447, nGroup: 1.4682,
    pulseWidth: 1e-9, length: 50e3, splices: 0, spliceLossDb: 0, launchReflectanceDb: -45, peakPowerDbm: -20,
    nep: 1e-9, averages: 1,
  });
  assert.ok(s.dr < 0);
  assert.ok(Number.isNaN(s.maxLength));
});
