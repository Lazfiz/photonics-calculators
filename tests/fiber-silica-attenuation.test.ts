import test from "node:test";
import assert from "node:assert/strict";

import {
  CWDM_CHANNELS, OH_BAND_FWHM, OH_BANDS, OH_PEAK_WAVELENGTH, minimumLossWavelength, oh1383Shape, ohBandFwhm, ohContentPpm, ohDbPerKmPerPpm,
  rayleighScatteringDbPerKm, silicaLossDbPerKm,
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

test("1383 nm OH band: Humbach's Table 2 four-Gaussian fit, the input height at 1383 nm, asymmetric", () => {
  // Humbach et al. 1996, Table 2: 1353/1382/1393/1407 nm, σ 20.2/6.7/10.6/29.2 nm, A 0.058/0.664/0.380/0.132. Independent
  // scratch sum: 1.01357 at 1383 nm, max 1.016 at 1383.6 nm, half of the 1383 nm value at 1374.0216 and 1398.0818 nm (FWHM 24.0 nm).
  assert.equal(OH_BAND_FWHM, 24e-9);
  assertRel(oh1383Shape(OH_PEAK_WAVELENGTH), 1, 1e-15, "shape at 1383");
  const p = { ...smf, ohPeakDbPerKm: 0.5 };
  assertRel(silicaLossDbPerKm(p, OH_PEAK_WAVELENGTH).oh, 0.5, 1e-15, "peak");
  assertRel(silicaLossDbPerKm(p, 1374.0216e-9).oh, 0.25, 1e-5, "half height, short side");
  assertRel(silicaLossDbPerKm(p, 1398.0818e-9).oh, 0.25, 1e-5, "half height, long side");
  // The long-wavelength wing: for α_OH = 1 the CWDM channels at 1371 and 1411 nm get 0.313099 and 0.218667 dB/km.
  assertRel(silicaLossDbPerKm({ ...smf, ohPeakDbPerKm: 1 }, 1371e-9).oh, 0.313099, 1e-5, "1371");
  assertRel(silicaLossDbPerKm({ ...smf, ohPeakDbPerKm: 1 }, 1411e-9).oh, 0.218667, 1e-5, "1411");
  // At 1550 nm only the 1407 nm component (σ 29.2 nm, 4.9σ away) is left: 0.5 · 0.132 · e^(−12.0)/1.01357 ≈ 4e-7 dB/km.
  assert.ok(silicaLossDbPerKm(p, 1550e-9).oh < 1e-6);
});

test("OH bands scale with the OH content: 1 ppm gives Humbach's Table 3 strengths and ≈ 1.0e4 dB/km at 2722 nm", () => {
  // Humbach et al., J. Non-Cryst. Solids 203, 19 (1996), Table 3: 62.7 dB/km per ppm at the first overtone. 0.5 dB/km → 0.5/62.7 ppm = 7.97 ppb.
  assertRel(ohContentPpm(0.5), 7.9745e-3, 1e-4, "ppm from peak");
  const onePpm = { ...smf, ohPeakDbPerKm: 62.7 };
  // Humbach Table 3 ("Result"): 943 nm 1.6, 1246 nm 2.7, 2212 nm 201 dB/km per ppm; at 1246 nm the 1353 nm fit component
  // adds 4.9e-6 dB/km, elsewhere the other bands add < 1e-12.
  assertRel(silicaLossDbPerKm(onePpm, 943e-9).oh, 1.6, 1e-12, "943");
  assertRel(silicaLossDbPerKm(onePpm, 1246e-9).oh, 2.7, 1e-5, "1246");
  assertRel(silicaLossDbPerKm(onePpm, 2212e-9).oh, 201, 1e-12, "2212");
  // Hetherington & Jack 1962: ε = 77.5 L mol⁻¹ cm⁻¹ at 2.72 µm. By hand, 1 ppm in silica of 2.201 g/cm³ is
  // 2.201e-6/17.007 = 1.29417e-7 mol/cm³ = 1.29417e-4 mol/L; A = 77.5 · 1.29417e-4 = 0.0100298 per cm = 1002.98 per km → 10029.8 dB/km.
  assertRel(ohDbPerKmPerPpm(7.75), 10029.8, 1e-5, "ε → dB/km/ppm");
  assertRel(silicaLossDbPerKm(onePpm, 2722e-9).oh, 10029.8, 1e-5, "2722");
  // Same width in wavenumber: FWHM 24 nm · (2722/1383)² = 92.970 nm; half height at ± FWHM/2.
  assertRel(ohBandFwhm(2722e-9), 92.970e-9, 1e-4, "2722 FWHM");
  assertRel(silicaLossDbPerKm(onePpm, 2722e-9 + ohBandFwhm(2722e-9) / 2).oh, 10029.8 / 2, 1e-5, "2722 half max");
  assert.deepEqual(OH_BANDS.map((b) => Math.round(b.wavelength * 1e9)), [943, 1246, 1383, 2212, 2722]);
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

test("rayleighScatteringDbPerKm: A/λ⁴ with λ in µm", () => {
  // Hand calculation: 0.8 dB·km⁻¹·µm⁴ / 1.55⁴ = 0.8 / 5.77200625 = 0.1386000 dB/km.
  assertRel(rayleighScatteringDbPerKm(0.8, 1.55e-6), 0.1386000, 1e-6, "0.8 at 1550 nm");
  assertRel(rayleighScatteringDbPerKm(0.8, 1e-6), 0.8, 1e-12, "0.8 at 1 µm");
  assert.ok(Number.isNaN(rayleighScatteringDbPerKm(0.8, 0)));
  assert.ok(Number.isNaN(rayleighScatteringDbPerKm(0, 1.55e-6)));
});
