import test from "node:test";
import assert from "node:assert/strict";

import {
  SUN_SOLID_ANGLE, backgroundPower, equalNoiseHalfAngle, halfAngleForSolidAngle, parseScene, projectedSolidAngle,
  receiverNoise, responsivity, sceneRadiance, sceneSolidAngle, skyRadiance, solarDiscRadiance,
} from "../src/physics/free-space-comms/background-radiance";
import { excessNoiseFactor } from "../src/physics/detectors/apd";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

test("solar disc: 6.794e-5 sr from the IAU 2015 radius at 1 au, and a total irradiance of 1361 W/m²", () => {
  // α = 6.957e8 / 1.495978707e11 = 4.65047e-3 rad; π sin²α = 6.79427e-5 sr.
  close(SUN_SOLID_ANGLE, 6.79427e-5, 1e-5);
  // ∫ L_λ Ω dλ = σT⁴ sin²α must reproduce the IAU 2015 B3 nominal total solar irradiance, 1361 W/m² (Prša et al. 2016).
  const n = 20000;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const l0 = 100e-9 * 1000 ** (i / n);
    const l1 = 100e-9 * 1000 ** ((i + 1) / n); // 0.1–100 µm, log grid
    sum += 0.5 * (solarDiscRadiance(l0) + solarDiscRadiance(l1)) * (l1 - l0);
  }
  close(sum * SUN_SOLID_ANGLE, 1361, 1e-3);
  // Giggenbach (2022) Table 1 gives 2×10³ W m⁻² sr⁻¹ nm⁻¹ for the sun disc at 1550 nm through the atmosphere,
  // 0.6× the 5772 K blackbody above it (3333 W m⁻² sr⁻¹ nm⁻¹).
  close(solarDiscRadiance(1550e-9) * 1e-9, 3333.4, 1e-4);
});

test("sky radiance: Giggenbach (2022) Table 1 at its wavelengths, log-log between them, NaN outside", () => {
  close(skyRadiance("zenith", 850e-9), 2.0e-3 * 1e9, 1e-12);
  close(skyRadiance("elevation30", 1064e-9), 4.0e-3 * 1e9, 1e-12);
  close(skyRadiance("horizon", 1550e-9), 25e-3 * 1e9, 1e-12);
  close(skyRadiance("sunlitCloud", 850e-9), 200e-3 * 1e9, 1e-12);
  close(skyRadiance("overcast", 1550e-9), 2e-3 * 1e9, 1e-12);
  // 1300 nm, horizon: t = ln(1300/1064)/ln(1550/1064) = 0.53241, 30e-3 · (25/30)^t = 2.7225e-2 per nm.
  close(skyRadiance("horizon", 1300e-9) * 1e-9, 2.7225e-2, 1e-4);
  assert.ok(Number.isNaN(skyRadiance("zenith", 849e-9)));
  assert.ok(Number.isNaN(skyRadiance("zenith", 1551e-9)));
  assert.equal(sceneRadiance("sun", 1550e-9), solarDiscRadiance(1550e-9));
  assert.equal(parseScene("sun"), "sun");
  assert.equal(parseScene("constructor"), "horizon");
});

test("background power L·A·Ω·Δλ·T·η: hand value for the page defaults, and the Sun fills only its disc", () => {
  // Horizon sky at 1550 nm (25e-3 W m⁻² sr⁻¹ nm⁻¹), 78.5 cm², 1 mrad full FOV, 1 nm, T = 0.9, η = 0.8:
  // 25e-3 · 78.5e-4 · π sin²(5e-4) · 1 · 0.72 = 1.10977e-10 W (−69.55 dBm).
  const base = { area: 78.5e-4, bandwidth: 1e-9, filterTransmission: 0.9, opticalEfficiency: 0.8 };
  const sky = backgroundPower({ ...base, radiance: skyRadiance("horizon", 1550e-9), fovHalfAngle: 5e-4, sourceSolidAngle: Infinity });
  close(sky.power, 1.10977e-10, 1e-5);
  const sun = (half: number) =>
    backgroundPower({ ...base, radiance: solarDiscRadiance(1550e-9), fovHalfAngle: half, sourceSolidAngle: sceneSolidAngle("sun") });
  close(sun(10e-3).power, sun(20e-3).power, 1e-15, "wider than the disc");
  // Capped: 3333.4e9 · 78.5e-4 · 6.7943e-5 · 1e-9 · 0.72 = 1.28008e-3 W.
  close(sun(10e-3).power, 1.28008e-3, 1e-4);
  close(sun(10e-3).solidAngle, SUN_SOLID_ANGLE, 1e-15);
  close(sun(1e-3).power / sun(2e-3).power, Math.sin(1e-3) ** 2 / Math.sin(2e-3) ** 2, 1e-12, "inside the disc");
  assert.ok(Number.isNaN(backgroundPower({ ...base, radiance: 1, fovHalfAngle: 2, sourceSolidAngle: Infinity }).power));
  assert.ok(Number.isNaN(backgroundPower({ ...base, filterTransmission: 1.1, radiance: 1, fovHalfAngle: 1e-3, sourceSolidAngle: 1 }).power));
});

test("solid-angle helpers invert each other; π sr is the hemisphere", () => {
  close(halfAngleForSolidAngle(projectedSolidAngle(0.3)), 0.3, 1e-14);
  close(projectedSolidAngle(Math.PI / 2), Math.PI, 1e-15);
  close(halfAngleForSolidAngle(Math.PI), Math.PI / 2, 1e-15);
  assert.ok(Number.isNaN(halfAngleForSolidAngle(4)));
});

test("receiver noise: responsivity, McIntyre excess noise and a hand-computed APD SNR", () => {
  // qλ/(hc) at 1550 nm = 1.55 µm / 1.239842 µm·A/W = 1.250159 A/W.
  close(responsivity(1, 1550e-9), 1.250159, 1e-6);
  // F(10, 0.4) = 0.4·10 + 0.6·(2 − 0.1) = 5.14; F(1, k) = 1.
  close(excessNoiseFactor(10, 0.4), 5.14, 1e-14);
  close(excessNoiseFactor(1, 0.7), 1, 1e-15);
  assert.ok(Number.isNaN(excessNoiseFactor(0.5, 0.4)));
  // I_s = 1 µA, M = 10, F = 5.14, B = 1 GHz, i_n = 10 pA/√Hz:
  // σ²_s = 2q·100·5.14·1e-6·1e9 = 1.64704e-13 A², σ²_amp = 1e-13 A², SNR = 1e-10 / 2.64704e-13 = 377.78.
  const n = receiverNoise({
    signalCurrent: 1e-6, backgroundCurrent: 0, darkCurrent: 0, bandwidth: 1e9, amplifierNoise: 1e-11, gain: 10, ionisationRatio: 0.4,
  });
  close(n.signalShot, 1.64704e-13, 1e-5);
  close(n.snr, 377.78, 1e-4);
  // Background shot noise adds like signal shot noise: equal currents, equal variances.
  const m = receiverNoise({
    signalCurrent: 1e-6, backgroundCurrent: 1e-6, darkCurrent: 0, bandwidth: 1e9, amplifierNoise: 0, gain: 1, ionisationRatio: 0,
  });
  close(m.backgroundShot, m.signalShot, 1e-15);
  // receiver-fov defaults: horizon at 1550 nm, D = 0.2 m, 1 nm, η = 0.7, QE 0.8, M = 10, k = 0.4, i_n = 10 pA/√Hz.
  // P_eq = i_n²/(2qM²F·R) = 1e-22/(2q·100·5.14·1.000127) = 6.0710e-7 W; L·A·Δλ·η = 25e-3·0.0314159·0.7 = 5.4978e-4 W/sr;
  // Ω = 1.10426e-3 sr, θ = asin √(Ω/π) = 18.749 mrad. At θ the two variances are equal.
  const rx = {
    radiance: skyRadiance("horizon", 1550e-9), area: Math.PI * 0.01, bandwidth: 1e-9, filterTransmission: 1, opticalEfficiency: 0.7,
    responsivity: responsivity(0.8, 1550e-9), amplifierNoise: 1e-11, gain: 10, ionisationRatio: 0.4,
  };
  const theta = equalNoiseHalfAngle({ ...rx, sourceSolidAngle: Infinity });
  close(theta, 18.749e-3, 1e-4);
  const pb = backgroundPower({ ...rx, fovHalfAngle: theta, sourceSolidAngle: Infinity }).power;
  const eq = receiverNoise({ signalCurrent: 0, backgroundCurrent: rx.responsivity * pb, darkCurrent: 0, bandwidth: 1e9, amplifierNoise: 1e-11, gain: 10, ionisationRatio: 0.4 });
  close(eq.backgroundShot, eq.amplifier, 1e-12);
  // A disc source caps the collectable power: 1e-4 W m⁻² sr⁻¹ nm⁻¹ over 6.79e-5 sr cannot supply P_eq, so NaN.
  assert.ok(Number.isNaN(equalNoiseHalfAngle({ ...rx, radiance: 1e5, sourceSolidAngle: SUN_SOLID_ANGLE })));
  assert.equal(receiverNoise({ ...{ signalCurrent: 0, backgroundCurrent: 0, darkCurrent: 0 }, bandwidth: 1, amplifierNoise: 0, gain: 1, ionisationRatio: 0 }).snr, 0);
});
