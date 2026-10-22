import test from "node:test";
import assert from "node:assert/strict";

import {
  CWDM_CHANNELS, OH_BAND_FWHM, OH_BANDS, OH_PEAK_WAVELENGTH, minimumLossWavelength, ohBandFwhm, ohContentPpm, ohDbPerKmPerPpm,
  silicaLossDbPerKm,
} from "../src/physics/fiber-optics/silica-attenuation";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);

const smf = { rayleighA: 0.85, geO2Fraction: 0.04, ohPeakDbPerKm: 0 };

test("Keiser's infrared and ultraviolet tails and the Rayleigh term (hand values)", () => {
  // Keiser, Optical Fiber Communications 4th ed. §3.1: α_IR = 7.81e11 e^(−48.48/λ); by hand at 1.55 µm:
  // 48.48/1.55 = 31.27742, e^(−31.27742) = 2.6085e-14 → 0.020372 dB/km.
  const at1550 = silicaLossDbPerKm(smf, 1550e-9);
  assertRel(at1550.infrared, 0.020372, 1e-4, "IR 1550");
  // α_UV = 154.2x/(46.6x + 60)·1e-2·e^(4.63/λ): x = 0.04 → 6.168/61.864 = 0.099703e-2; e^(2.987097) = 19.8279 → 0.019769.
  assertRel(at1550.ultraviolet, 0.019769, 1e-4, "UV 1550");
  // Rayleigh 0.85/1.55⁴ = 0.85/5.77200625 = 0.147262 dB/km.
  assertRel(at1550.rayleigh, 0.147262, 1e-5, "Rayleigh 1550");
  assertRel(at1550.total, at1550.rayleigh + at1550.infrared + at1550.ultraviolet, 1e-15, "sum");
  // Pure silica (x = 0) has no germania UV term.
  assert.equal(silicaLossDbPerKm({ ...smf, geO2Fraction: 0 }, 1550e-9).ultraviolet, 0);
});

test("Defaults reproduce standard single-mode fibre: 0.32 dB/km at 1310 nm, 0.19 at 1550 nm, minimum near 1550 nm", () => {
  // Typical G.652.D values (e.g. 0.32–0.35 and 0.18–0.20 dB/km in fibre data sheets); the old page's IR term put the minimum at 1654 nm.
  assertRel(silicaLossDbPerKm(smf, 1310e-9).total, 0.32286, 1e-4, "1310");
  assertRel(silicaLossDbPerKm(smf, 1550e-9).total, 0.18740, 1e-4, "1550");
  const lMin = minimumLossWavelength(smf);
  assert.ok(lMin > 1540e-9 && lMin < 1570e-9, `minimum at ${lMin * 1e9} nm`);
  // Independent brute-force scan at 0.01 nm steps.
  let best = 1450e-9;
  for (let l = 1450e-9; l <= 1800e-9; l += 1e-11) if (at(l) < at(best)) best = l;
  assert.ok(Math.abs(lMin - best) < 2e-11, `golden section ${lMin} vs scan ${best}`);
  function at(l: number) {
    return silicaLossDbPerKm(smf, l).total;
  }
});

test("OH band: peak height at 1383 nm, half height at ± FWHM/2", () => {
  const p = { ...smf, ohPeakDbPerKm: 0.5 };
  assertRel(silicaLossDbPerKm(p, OH_PEAK_WAVELENGTH).oh, 0.5, 1e-15, "peak");
  assertRel(silicaLossDbPerKm(p, OH_PEAK_WAVELENGTH + OH_BAND_FWHM / 2).oh, 0.25, 1e-12, "half max");
  assert.ok(silicaLossDbPerKm(p, 1550e-9).oh < 1e-30);
});

test("OH bands scale with the OH content: 1 ppm gives 62.7, 1.2 and ≈ 1.0e4 dB/km at 1383, 943 and 2722 nm", () => {
  // Humbach 1996 (via arXiv:2303.17814 Table I): 62.7 dB/km per ppm at the first overtone. 0.5 dB/km → 0.5/62.7 ppm = 7.97 ppb.
  assertRel(ohContentPpm(0.5), 7.9745e-3, 1e-4, "ppm from peak");
  const onePpm = { ...smf, ohPeakDbPerKm: 62.7 };
  // Philen, Bell Syst. Tech. J. 61, 283 (1982): 10 ppm adds ≈ 12 dB/km at 0.95 µm.
  assertRel(silicaLossDbPerKm(onePpm, 943e-9).oh, 1.2, 1e-12, "943");
  // Hetherington & Jack 1962: ε = 77.5 L mol⁻¹ cm⁻¹ at 2.72 µm. By hand, 1 ppm in silica of 2.201 g/cm³ is
  // 2.201e-6/17.007 = 1.29417e-7 mol/cm³ = 1.29417e-4 mol/L; A = 77.5 · 1.29417e-4 = 0.0100298 per cm = 1002.98 per km → 10029.8 dB/km.
  assertRel(ohDbPerKmPerPpm(7.75), 10029.8, 1e-5, "ε → dB/km/ppm");
  assertRel(silicaLossDbPerKm(onePpm, 2722e-9).oh, 10029.8, 1e-5, "2722");
  // Same width in wavenumber: FWHM 30 nm · (2722/1383)² = 116.21 nm; half height at ± FWHM/2.
  assertRel(ohBandFwhm(2722e-9), 116.21e-9, 1e-4, "2722 FWHM");
  assertRel(silicaLossDbPerKm(onePpm, 2722e-9 + ohBandFwhm(2722e-9) / 2).oh, 10029.8 / 2, 1e-5, "2722 half max");
  // The 1246 and 2212 nm bands have no sourced strength and add nothing.
  assert.deepEqual(OH_BANDS.filter((b) => Number.isNaN(b.dbPerKmPerPpm)).map((b) => Math.round(b.wavelength * 1e9)), [1246, 2212]);
  assert.ok(silicaLossDbPerKm(onePpm, 1246e-9).oh < 1e-6);
});

test("CWDM grid is ITU-T G.694.2: 18 channels, 1271–1611 nm", () => {
  assert.equal(CWDM_CHANNELS.length, 18);
  assertRel(CWDM_CHANNELS[0], 1271e-9, 1e-15, "first");
  assertRel(CWDM_CHANNELS[17], 1611e-9, 1e-15, "last");
});

test("Domain guards", () => {
  assert.ok(Number.isNaN(silicaLossDbPerKm({ ...smf, rayleighA: 0 }, 1550e-9).total));
  assert.ok(Number.isNaN(silicaLossDbPerKm({ ...smf, ohPeakDbPerKm: -1 }, 1550e-9).total));
  assert.ok(Number.isNaN(silicaLossDbPerKm(smf, 0).total));
  assert.ok(Number.isNaN(minimumLossWavelength({ ...smf, geO2Fraction: 1 })));
});
