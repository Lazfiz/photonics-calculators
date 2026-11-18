// Golden values for the registration page summary (hand-worked). Displacement: ⟨|d|²⟩ = |t|² + (L²/12)‖A − I‖²_F;
// TRE² = (FLE²/N)(1 + m·d²/(2f²)) and FRE² = FLE²(1 − p/(2N)) (Fitzpatrick, West & Maurer 1998, doi:10.1109/42.736021, in 2-D);
// bound ℓ/(SNR·√N_px) (Robinson & Milanfar 2004, doi:10.1109/TIP.2004.832923).
import assert from "node:assert/strict";
import { test } from "node:test";
import { registrationSummary, uniformFiducialRms } from "../src/physics/imaging/registration-summary";

const close = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${a} vs ${b}`);
const deg = Math.PI / 180;
const base = { model: "rigid" as const, size: 512, theta: 2 * deg, tx: 5, ty: 3, scale: 1.02, shear: 0.5 * deg, points: 10, fle: 1, snr: 10, feature: 2 };

test("registration summary: rigid defaults", () => {
  const s = registrationSummary(base);
  // ‖R − I‖²_F = 4(1 − cos 2°); rms = √(34 + (512²/12)·4(1 − cos 2°)) = 9.339719 px.
  close(s.rms, 9.33971880208694);
  close(s.max, 18.33072795246187);
  // f² = L²/6, m = 1: TRE_rms = √(1.5/10), centre 1/√10, corner (d² = 3f²) √(2.5/10) = 0.5; FRE = √(1 − 3/20); ℓ/(SNR·L) = 2/5120.
  close(s.treRms, 0.3872983346207417);
  close(s.treCentre, 0.31622776601683794);
  close(s.treCorner, 0.5);
  close(s.fre, 0.9219544457292888);
  close(s.crlb, 0.000390625);
  assert.equal(s.tooFew, false);
  close(uniformFiducialRms(512), 512 / Math.sqrt(6));
});

test("registration summary: affine matrix and errors (m = 4, p = 6)", () => {
  const s = registrationSummary({ ...base, model: "affine" });
  // A = s·R(θ)·[1 tan φ; 0 1]; a = 1.0193786, b = −0.0267015, c = 0.0355975, d = 1.0196893.
  close(s.matrix[0], 1.0193786435594776);
  close(s.matrix[1], -0.026701503985484397);
  close(s.matrix[2], 0.03559748663655099);
  close(s.matrix[3], 1.0196892981190382);
  close(s.treRms, Math.sqrt(0.3));
  close(s.fre, Math.sqrt(0.7));
});

test("registration summary: too few control points (domain boundary)", () => {
  const s = registrationSummary({ ...base, points: 2, model: "affine" }); // needs ⌈6/2⌉ = 3
  assert.equal(s.tooFew, true);
  assert.ok(Number.isNaN(s.treRms) && Number.isNaN(s.fre));
  assert.equal(registrationSummary({ ...base, points: 3, model: "affine" }).tooFew, false);
});
