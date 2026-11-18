import test from "node:test";
import assert from "node:assert/strict";

import { opticalPowerSummary } from "../src/physics/imaging/optical-power";

const mm = 1e-3;
const close = (actual: number, expected: number, tol: number, label: string) =>
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);

test("Gullstrand eye at the page defaults (Greivenkamp 2004 two-lens systems; Atchison & Smith 2000 ch. 9)", () => {
  // Hand: φ = 43.05 + 19.11 − (5.73e-3/1.336)(43.05)(19.11) = 58.6315659 D; 1/φ = 17.0556591 mm; n/φ = 22.7863605 mm;
  // rear focus t + n(1 − (t/n)φ₁)/φ = 24.3091302 mm; K at L = 24 mm: V₃ = 1.336/0.01827 = 73.1253; V₂ = 54.0153;
  // V₁ = V₂/(1 + 0.004289 V₂) = 43.8555 D; K = 0.805454 D (hyperopic); spectacle K/(1 + 0.012 K) = 0.797744 D.
  const s = opticalPowerSummary(0.1, 43.05, 19.11, 5.73 * mm, 1.336, 24 * mm, 12 * mm);
  close(s.lensPower, 10, 1e-12, "P = 1/f");
  close(s.eyePower, 58.63156593188622, 1e-9, "φ");
  close(s.focalAir, 17.05565908237425 * mm, 1e-9, "1/φ");
  close(s.focalEye, 22.786360534052 * mm, 1e-9, "n/φ");
  close(s.emmetropicLength, 24.30913024641871 * mm, 1e-9, "L_emm");
  close(s.refraction, 0.8054543475070446, 1e-8, "K");
  close(s.spectacle, 0.7977437930315167, 1e-8, "K spec");
  // Analytic dK/dL = −n/[(L − t)²(1 + (t/n)V₂)²], L − t = 18.27 mm, V₂ = 54.01534209 D, 1 + (t/n)V₂ = 1.23166760:
  // −1.336/(3.3379290e-4 × 1.51700) = −2638.41 D/m; an independent central difference (h = 1 µm) gives −2.63841029 D/mm.
  close(s.dKdL * mm, -2.6384102835124406, 1e-8, "dK/dL per mm");
  assert.equal(s.state, "hyperopic");
});

test("myopic eye at L = 26 mm (Atchison & Smith 2000, Refractive anomalies)", () => {
  // Hand: V₃ = 1.336/0.02027 = 65.91021214 D; V₂ = 46.80021214 D; V₁ = V₂/1.20072247 = 38.97671063 D; K = −4.07328937 D;
  // spectacle K/(1 + 0.012 K) = −4.28262165 D.
  const s = opticalPowerSummary(0.1, 43.05, 19.11, 5.73 * mm, 1.336, 26 * mm, 12 * mm);
  close(s.refraction, -4.073289366827041, 1e-9, "K myopic");
  close(s.spectacle, -4.282621653759881, 1e-9, "K spec myopic");
  assert.equal(s.state, "myopic");
});

test("reduced eye K = n/L − φ₁ (no lens) and domain edges", () => {
  // Hand: 1.336/0.024 − 43.05 = 12.6166667 D.
  close(opticalPowerSummary(0.1, 43.05, 0, 5.73 * mm, 1.336, 24 * mm, 0).refraction, 12.616666666666674, 1e-9, "K reduced");
  assert.ok(Number.isNaN(opticalPowerSummary(0, 43.05, 19.11, 5.73 * mm, 1.336, 24 * mm, 0).lensPower));
  // Axial length shorter than the lens spacing: no refraction.
  const bad = opticalPowerSummary(0.1, 43.05, 19.11, 10 * mm, 1.336, 5 * mm, 0);
  assert.ok(Number.isNaN(bad.refraction));
  assert.equal(bad.state, "");
});
