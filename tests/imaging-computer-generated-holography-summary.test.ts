// Golden values for the computer-generated-holography page summary (hand-worked).
import assert from "node:assert/strict";
import { test } from "node:test";
import { slmReplaySummary } from "../src/physics/imaging/computer-generated-holography";

const close = (a: number, b: number, tol = 1e-8) => assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${a} vs ${b}`);
const base = { lambda: 633e-9, pitch: 8e-6, nx: 1920, ny: 1080, z: 0.5, bits: 8, fill: 0.9, amplitude: false };

test("CGH summary: geometry at the page defaults", () => {
  const s = slmReplaySummary(base);
  // asin(633e-9/16e-6) = asin(0.0395625) = 2.267356°; λz/Δx = 39.5625 mm; λz/(N_xΔx) = 20.60547 µm; λ/(N_xΔx) = 41.2109 µrad.
  close(s.maxAngle, (2.2673560139 * Math.PI) / 180);
  close(s.replayField, 39.5625e-3);
  close(s.spotX, 20.60546875e-6);
  close(s.angularResolution, 633e-9 / (1920 * 8e-6));
  // N_xΔx²/λ = 1920·64e-12/633e-9 = 0.194123 m; frame 1920·1080·8/8 = 2.0736e6 bytes.
  close(s.aliasDistance, 0.1941232227);
  close(s.frameBytes, 2073600);
});

test("CGH summary: efficiencies and pixel envelope", () => {
  // 3 bits: sinc²(π/8) = 0.9496412; binary amplitude 1/π² = 0.1013212; F = 0.64: sinc²(0.4π) = 0.5727867.
  close(slmReplaySummary({ ...base, bits: 3 }).efficiency, 0.94964120355);
  const a = slmReplaySummary({ ...base, amplitude: true, fill: 0.64 });
  close(a.efficiency, 0.10132118364);
  close(a.edgeEnvelope, 0.5727866972);
});
