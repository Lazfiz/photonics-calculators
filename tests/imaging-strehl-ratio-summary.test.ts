import test from "node:test";
import assert from "node:assert/strict";

import { strehlSummary } from "../src/physics/imaging/strehl-ratio";

const close = (actual: number, expected: number, tol: number, label: string) =>
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);

test("strehl summary, defocus 20 nm RMS at 550 nm (Mahajan 1982, 1983; extended Maréchal form exp(−(2πσ/λ)²))", () => {
  // Hand (scratch script): exp(−(2π·20/550)²) = 0.9491362995855074; defocus sinc²(√3·2πσ/λ) = 0.9488750801948005;
  // PV = 2√3·20 nm; λ/14 = 39.2857 nm; σ(0.8) = 550·√(−ln 0.8)/(2π) = 41.34995025 nm.
  const s = strehlSummary(550e-9, 20e-9, "rms", "defocus");
  close(s.marechal, 0.9491362995855074, 1e-12, "Maréchal");
  close(s.exact, 0.9488750801948005, 1e-12, "exact");
  close(s.pv, 69.28203230275508e-9, 1e-12, "PV");
  close(s.lambda14, 550e-9 / 14, 1e-12, "λ/14");
  close(s.sigma08, 41.34995025464485e-9, 1e-10, "σ(0.8)");
});

test("strehl summary, PV input and the 5-wave limit", () => {
  // Astigmatism PV 100 nm: σ = 100/(2√6) nm; S = 0.9470044194779101 (200000-panel Simpson, power-series J0).
  const s = strehlSummary(550e-9, 100e-9, "pv", "astigmatism");
  close(s.rms, 20.412414523193153e-9, 1e-12, "RMS");
  close(s.exact, 0.9470044194779101, 1e-7, "exact");
  assert.ok(Number.isNaN(strehlSummary(200e-9, 1e-5, "rms", "coma").exact));
});
