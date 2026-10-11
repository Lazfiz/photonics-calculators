import test from "node:test";
import assert from "node:assert/strict";

import {
  MOLAR_ROTATION_CONV_PER_SI, SPECIFIC_ROTATION_SI_PER_CONV, SUCROSE_TEMPERATURE_COEFFICIENT, T_REF,
  drudeSpecificRotation, molarRotation, observedRotation, outputAzimuth, specificRotationFromObserved,
  sucroseDispersionRatio, sucroseSpecificRotation, temperatureCorrected,
} from "../src/physics/polarization/optical-activity";

const deg = 180 / Math.PI;
const nm = 1e-9;

test("Optical activity: the NIST SRM 17e normal sugar solution, 200 mm, 20 °C (Table 1a)", () => {
  // Normal sugar solution: 26.0160 g of sucrose in 100.000 cm³ = 260.160 kg/m³ (certificate, Preparation).
  const c = 260.16, l = 0.2;
  const table: [number, number][] = [[546.2271, 40.763], [589.44, 34.614], [632.9914, 29.741], [882.6, 14.831]];
  for (const [lambda_nm, alpha_deg] of table) {
    const a = observedRotation(sucroseSpecificRotation(lambda_nm * nm), c, l) * deg;
    assert.ok(Math.abs(a - alpha_deg) < 0.0015, `${lambda_nm} nm: ${a} vs ${alpha_deg}`);
  }
  // Transcription check: the ICUMSA polynomial is normalised to 1 at 546.2271 nm (1/1.000003).
  assert.ok(Math.abs(sucroseDispersionRatio(546.2271 * nm) - 1) < 5e-6);
});

test("Optical activity: Drude dispersion, Biot limit and a two-point fit to the ICUMSA curve", () => {
  const a589 = 66.524;
  // λ₀ = 0: Biot's 1/λ² law, [α](400 nm) = 66.524 · (589.44/400)².
  assert.ok(Math.abs(drudeSpecificRotation(a589, 589.44 * nm, 400 * nm, 0) - a589 * (589.44 / 400) ** 2) < 1e-9);
  // λ₀ fitted to the 546/589 ratio of the ICUMSA curve: λ₀² = (λ₅₈₉² − rλ₅₄₆²)/(1 − r), r = α546/α589.
  const r = sucroseDispersionRatio(546.2271 * nm) / sucroseDispersionRatio(589.44 * nm);
  const l589 = 0.58944, l546 = 0.5462271;
  const lambda0 = Math.sqrt((l589 ** 2 - r * l546 ** 2) / (1 - r)) * 1e-6;
  assert.ok(Math.abs(lambda0 / nm - 148.8) < 0.2, `λ₀ ${lambda0 / nm} nm`);
  // It reproduces SRM 17e at 632.9914 nm to 0.05 %: 29.741° in 200 mm of the normal solution.
  const drude633 = drudeSpecificRotation(a589, 589.44 * nm, 632.9914 * nm, lambda0) * 2 * 0.26016;
  assert.ok(Math.abs(drude633 / 29.741 - 1) < 5e-4, `Drude 633 nm: ${drude633}`);
  assert.ok(Number.isNaN(drudeSpecificRotation(a589, 589.44 * nm, 100 * nm, 148.8 * nm)), "λ ≤ λ₀");
});

test("Optical activity: temperature, molar rotation, inverse and sign", () => {
  // Schönrock (Bates & Blake 1907): α(25 °C) = α(20 °C)(1 − 0.000461 · 5) = 0.997695 α(20 °C).
  assert.ok(Math.abs(temperatureCorrected(1, SUCROSE_TEMPERATURE_COEFFICIENT, T_REF + 5) - 0.997695) < 1e-12);
  // [M] = [α]·M/100 = 66.524 · 342.297/100 = 227.71 deg·cm²·dmol⁻¹ (C₁₂H₂₂O₁₁, IUPAC atomic weights).
  const M = molarRotation(66.524 * SPECIFIC_ROTATION_SI_PER_CONV, 0.342297) * MOLAR_ROTATION_CONV_PER_SI;
  assert.ok(Math.abs(M - 227.71) < 0.01, `[M] ${M}`);
  // 10 g/100 mL (100 kg/m³) in 1 dm at [α] = 66.524: 6.6524°; and back.
  const a = observedRotation(66.524 * SPECIFIC_ROTATION_SI_PER_CONV, 100, 0.1);
  assert.ok(Math.abs(a * deg - 6.6524) < 1e-9);
  assert.ok(Math.abs(specificRotationFromObserved(a, 100, 0.1) / SPECIFIC_ROTATION_SI_PER_CONV - 66.524) < 1e-9);
  // Dextrorotatory turns clockwise seen toward the source: −α in the counter-clockwise site convention.
  assert.equal(outputAzimuth(0, 0.1), -0.1);
  assert.ok(Number.isNaN(observedRotation(1, -1, 1)) && Number.isNaN(specificRotationFromObserved(1, 0, 1)));
});
