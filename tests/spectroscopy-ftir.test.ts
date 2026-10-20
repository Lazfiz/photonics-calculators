import test from "node:test";
import assert from "node:assert/strict";

import { dft, fftRadix2, nextPow2 } from "../src/physics/fft";
import {
  apodization, cosineTransform, halfVisibilityOpd, ilsFwhm, ilsHighestSidelobe, lineInterferogram, modulationFrequency,
  nominalResolution, scanTime, singleSidedPoints,
} from "../src/physics/spectroscopy/ftir";
import { aliasedFrequency, amplitudeSpectrum, noiseFloorRms } from "../src/physics/spectroscopy/fourier-transform";
import {
  findZpd, forman, magnitudeSpectrum, mertz, relativeRmsError, synthesizeInterferogram, uncorrectedSpectrum,
} from "../src/physics/spectroscopy/ftir-phase-correction";
import { equivalentNoiseBandwidth, windowSamples } from "../src/physics/spectroscopy/apodization-comparison";
import { createRng, gaussian } from "../src/physics/random";

const close = (actual: number, expected: number, rel: number, msg?: string) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg ?? ""} ${actual} vs ${expected}`);

function naiveDft(re: number[], im: number[]) {
  const N = re.length;
  return Array.from({ length: N }, (_, k) => {
    let r = 0, i = 0;
    for (let n = 0; n < N; n++) {
      const a = (-2 * Math.PI * k * n) / N;
      r += re[n] * Math.cos(a) - im[n] * Math.sin(a);
      i += re[n] * Math.sin(a) + im[n] * Math.cos(a);
    }
    return [r, i];
  });
}

test("fft: radix-2 and Bluestein agree with the defining sum; inverse round-trips", () => {
  assert.equal(nextPow2(1), 1);
  assert.equal(nextPow2(1000), 1024);
  for (const N of [1, 7, 12, 16, 100]) {
    const re = Array.from({ length: N }, (_, n) => Math.sin(1.3 * n) + 0.2 * n);
    const im = Array.from({ length: N }, (_, n) => Math.cos(0.7 * n));
    const X = dft(re, im);
    naiveDft(re, im).forEach(([r, i], k) => {
      assert.ok(Math.abs(X.re[k] - r) < 1e-10 && Math.abs(X.im[k] - i) < 1e-10, `N ${N} k ${k}`);
    });
    const back = dft(X.re, X.im, true);
    re.forEach((v, n) => assert.ok(Math.abs(back.re[n] - v) < 1e-12 && Math.abs(back.im[n] - im[n]) < 1e-12));
  }
  // Parseval: Σ|x|² = Σ|X|²/N.
  const x = Array.from({ length: 64 }, (_, n) => Math.exp(-((n - 20) ** 2) / 30));
  const y = new Array<number>(64).fill(0);
  const e = x.reduce((s, v) => s + v * v, 0);
  fftRadix2(x, y);
  close(x.reduce((s, v, k) => s + v * v + y[k] ** 2, 0) / 64, e, 1e-12);
  assert.throws(() => fftRadix2([1, 2, 3], [0, 0, 0]));
});

test("FTIR: instrument line shape FWHM and sidelobes of each apodization", () => {
  // Boxcar ILS sinc(2πs): sin y/y = ½ at y = 1.8954943, FWHM = 2y/(2π) = 0.603355/L (Griffiths & de Haseth ch. 2: 1.207/(2L));
  // first sidelobe −0.217234 at y = 4.4934.
  close(ilsFwhm("boxcar"), (2 * 1.8954943) / (2 * Math.PI), 1e-6);
  close(ilsHighestSidelobe("boxcar"), Math.sin(4.4934095) / 4.4934095, 1e-4);
  // Triangular ILS sinc²(πs): sin²z/z² = ½ at z = 1.3915574, FWHM = 2z/π = 0.885893/L; first sidelobe sinc²(4.4934) = 0.047190.
  close(ilsFwhm("triangular"), (2 * 1.3915574) / Math.PI, 1e-6);
  close(ilsHighestSidelobe("triangular"), (Math.sin(4.4934095) / 4.4934095) ** 2, 1e-3);
  // Norton & Beer (1976) designed weak/medium/strong for FWHM 1.2, 1.4, 1.6 × boxcar; with the tabulated coefficients
  // (Naylor & Tahic 2007) the computed ratios hit them to 10⁻⁴, and every window is 1 at ZPD (the old page had C₁ = +0.136,
  // giving 1.272).
  const box = ilsFwhm("boxcar");
  close(ilsFwhm("nb-weak") / box, 1.2, 2e-4);
  close(ilsFwhm("nb-medium") / box, 1.4, 2e-4);
  close(ilsFwhm("nb-strong") / box, 1.6, 2e-4);
  close(apodization("nb-medium", 0), 1, 1e-6);
  assert.equal(apodization("nb-medium", 1), 0.152442);
  assert.equal(apodization("happ-genzel", 1.01), 0);
  // Happ–Genzel (Hamming on ±L) 1.50 and Blackman–Harris 4-term 2.21 × boxcar (part 0 audit, PR #127; Harris 1978 Table I
  // 6-dB widths 1.81/1.21 = 1.50 and 2.72/1.21 = 2.25 for sampled windows); Hamming sidelobe −42.7 dB.
  close(ilsFwhm("happ-genzel") / box, 1.504, 1e-3);
  close(ilsFwhm("bh4") / box, 2.21, 1e-3);
  close(20 * Math.log10(Math.abs(ilsHighestSidelobe("happ-genzel"))), -42.7, 2e-3);
});

test("FTIR: resolution, sampling and scan time", () => {
  // Defaults L = 1 cm, σ_max = 4000 cm⁻¹, v = 1 cm/s: 1 cm⁻¹, N = 2Lσ_max = 8000, t = L/(2v) = 0.5 s, f = 2vσ = 8 kHz (PR #127).
  assert.equal(nominalResolution(1), 1);
  assert.equal(singleSidedPoints(1, 4000), 8000);
  assert.equal(scanTime(1, 1), 0.5);
  assert.equal(modulationFrequency(1, 4000), 8000);
  // Michelson page defaults: L = 100 µm = 0.01 cm gives δσ = 100 cm⁻¹ = 0.01 µm⁻¹ (PR #127).
  close(nominalResolution(100e-4), 100, 1e-12);
  assert.ok(Number.isNaN(nominalResolution(0)) && Number.isNaN(scanTime(1, 0)));
});

test("FTIR: line interferogram and its cosine transform", () => {
  // A Gaussian line's fringe envelope halves at 2 ln 2/(πΓ).
  const G = 0.5;
  close(lineInterferogram([{ sigma: 0, amplitude: 1, fwhm: G }], halfVisibilityOpd(G)), 0.5, 1e-12);
  assert.equal(halfVisibilityOpd(0), Infinity);
  // The transform of a line of amplitude a has area a/2 and peak a·√(ln 2/π)/Γ (I = 2∫B cos).
  const dx = 0.01;
  const I = Array.from({ length: 4000 }, (_, n) => lineInterferogram([{ sigma: 5, amplitude: 1, fwhm: G }], n * dx));
  const ct = cosineTransform(I, dx, 2);
  close(ct.B.reduce((s, b) => s + b, 0) * ct.sigma[1], 0.5, 1e-9);
  close(Math.max(...ct.B), Math.sqrt(Math.LN2 / Math.PI) / G, 1e-4);
  // A monochromatic line on a grid point gives B(σ₁) = Δx[1 + 2Σcos²] = L + Δx·(small) for L = NΔx = 10.
  const P = nextPow2(2000) * 4;
  const s1 = 410 / (P * dx);
  const mono = cosineTransform(Array.from({ length: 1000 }, (_, n) => Math.cos(2 * Math.PI * s1 * n * dx)), dx, 4);
  close(mono.B[410], 10, 2e-3);
  assert.deepEqual(cosineTransform([1], dx), { sigma: [], B: [] });
});

test("sampled spectrum: coherent gain, scalloping, aliasing and noise floor", () => {
  const fs = 100;
  const tone = (f: number, N: number) => Array.from({ length: N }, (_, n) => Math.sin((2 * Math.PI * f * n) / fs));
  // On a bin (10 Hz, N = 250: bin 25) every window reads the amplitude.
  const box = amplitudeSpectrum(tone(10, 250), fs);
  close(box.amplitude[25], 1, 1e-12);
  close(box.f[25], 10, 1e-12);
  close(amplitudeSpectrum(tone(10, 250), fs, windowSamples("hanning", 250)).amplitude[25], 1, 2e-3);
  // Half a bin off (10 Hz, N = 255: bin 25.5): scalloping loss 3.92 dB boxcar, 1.42 dB Hanning (Harris 1978 Table I).
  const off = amplitudeSpectrum(tone(10, 255), fs).amplitude;
  close(Math.max(off[25], off[26]), 10 ** (-3.92 / 20), 1e-2);
  const offH = amplitudeSpectrum(tone(10, 255), fs, windowSamples("hanning", 255)).amplitude;
  close(Math.max(offH[25], offH[26]), 10 ** (-1.42 / 20), 1e-2);
  // Aliasing: 60 Hz at 100 S/s appears at 40 Hz, 110 Hz at 10 Hz; 50 Hz is the Nyquist frequency.
  assert.equal(aliasedFrequency(60, fs), 40);
  close(aliasedFrequency(110, fs), 10, 1e-12);
  assert.equal(aliasedFrequency(50, fs), 50);
  // Noise floor 2σ/√N for the boxcar: σ = 0.1, N = 256 → 0.0125; windowed 2σ√(ENBW/N); Monte Carlo agrees to 5 %.
  close(noiseFloorRms(0.1, new Array(256).fill(1)), 0.0125, 1e-12);
  const hann = windowSamples("hanning", 256);
  close(noiseFloorRms(0.1, hann), 2 * 0.1 * Math.sqrt(equivalentNoiseBandwidth(hann) / 256), 1e-12);
  const rng = createRng(7);
  let ms = 0, count = 0;
  for (let trial = 0; trial < 40; trial++) {
    const a = amplitudeSpectrum(Array.from({ length: 256 }, () => 0.1 * gaussian(rng)), fs, hann).amplitude;
    for (let k = 5; k < 120; k++) { ms += a[k] ** 2; count++; }
  }
  close(Math.sqrt(ms / count), noiseFloorRms(0.1, hann), 0.05);
  assert.deepEqual(amplitudeSpectrum([1], fs), { f: [], amplitude: [] });
});

test("FTIR phase correction: Mertz and Forman recover the spectrum; magnitude rectifies noise", () => {
  const dx = 632.8e-7; // HeNe-wavelength sampling, Nyquist 7901 cm⁻¹
  const N = 4096, M = 128, nNeg = N + 8;
  const B = (s: number) => Math.exp(-4 * Math.LN2 * ((s - 2000) / 1600) ** 2) * 10 ** (-0.8 * Math.exp(-4 * Math.LN2 * ((s - 2350) / 30) ** 2));
  const run = (phi: (s: number) => number) => {
    const r = { I: synthesizeInterferogram(B, phi, dx, nNeg, N), zero: nNeg, dx };
    return { r, z: findZpd(r) };
  };
  // Zero phase: every method returns the spectrum (truncation error only).
  const flat = run(() => 0);
  assert.equal(flat.z, nNeg);
  for (const sp of [uncorrectedSpectrum(flat.r, flat.z, M), mertz(flat.r, flat.z, M), forman(flat.r, flat.z, M), magnitudeSpectrum(flat.r, flat.z, N)])
    assert.ok(relativeRmsError(sp, B) < 1e-5);
  // Constant phase 0.5 rad about the true ZPD: the uncorrected real part reads B cos 0.5 = 0.8776 B; Mertz reads B.
  const c = run(() => 0.5);
  const u = uncorrectedSpectrum(c.r, nNeg, M), m = mertz(c.r, nNeg, M);
  const k = Math.round(2000 / u.sigma[1]);
  close(u.B[k] / B(u.sigma[k]), Math.cos(0.5), 1e-3);
  close(m.B[k] / B(m.sigma[k]), 1, 1e-4);
  // Sub-sample ZPD shift 0.3 Δx, 0.5 rad offset and quadratic dispersion: both corrections cut the error at least 4×.
  const d = run((s) => 2 * Math.PI * s * 0.3 * dx + 0.5 + ((s - 2000) / 2000) ** 2);
  const e0 = relativeRmsError(uncorrectedSpectrum(d.r, d.z, M), B);
  const eM = relativeRmsError(mertz(d.r, d.z, M), B);
  const eF = relativeRmsError(forman(d.r, d.z, M), B);
  assert.ok(e0 > 0.01 && eM < e0 / 4 && eF < e0 / 4 && eM < 0.005 && eF < 0.005, `${e0} ${eM} ${eF}`);
  // Noise σₙ in an empty band (6000–7500 cm⁻¹): magnitude has the Rayleigh mean σ_c√(π/2), σ_c = Δxσₙ√n for a ±n record;
  // Mertz stays unbiased.
  const rng = createRng(3);
  const sn = 2;
  const noisy = { ...d.r, I: d.r.I.map((v) => v + sn * gaussian(rng)) };
  const band = (sp: { sigma: number[]; B: number[] }) => sp.B.filter((_, i) => sp.sigma[i] > 6000 && sp.sigma[i] < 7500);
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  const mag = band(magnitudeSpectrum(noisy, d.z, N));
  close(mean(mag), dx * sn * Math.sqrt(N) * Math.sqrt(Math.PI / 2), 0.06);
  const mz = band(mertz(noisy, d.z, M));
  const sd = Math.sqrt(mean(mz.map((x) => x * x)));
  assert.ok(Math.abs(mean(mz)) < (4 * sd) / Math.sqrt(mz.length), `${mean(mz)} ${sd}`);
});
