import { WINDOWS, type WindowName } from "../../physics/spectroscopy/apodization-comparison";
import { twoToneAnalysis } from "../../physics/spectroscopy/fourier-transform";
import { defineSchema } from "../types";

const HARRIS = "Harris F. J. (1978). On the use of windows for harmonic analysis with the discrete Fourier transform. " +
  "Proc. IEEE 66(1), 51–83, doi:10.1109/PROC.1978.10837; Oppenheim A. V., Schafer R. W. (2010). Discrete-Time Signal Processing, " +
  "3rd ed., Pearson, ch. 4 (sampling, aliasing) and ch. 10 (spectral analysis with windows). One-sided amplitude 2|X_k|/Σw; " +
  "a sinusoid of amplitude A exactly on bin k gives X_k = A Σw/2; white noise of standard deviation σ gives an RMS 2σ√(Σw²)/Σw.";

const WINDOW_NAMES = Object.keys(WINDOWS) as WindowName[];

// The page adds Gaussian noise from the fixed seed 1 (createRng(1)); the schema calls the same function, so the
// tone readings include that one fixed noise realization and are deterministic. The checks use σ = 0 for the readings.
export default defineSchema({
  href: "/spectroscopy/fourier-transform",
  inputs: [
    { key: "freq1", label: "Frequency 1", unit: "Hz", toSI: 1, siUnit: "Hz", default: 10, min: 0, max: 1e10 },
    { key: "amp1", label: "Amplitude 1", unit: "", toSI: 1, siUnit: "", default: 1, min: 0, max: 1e6 },
    { key: "freq2", label: "Frequency 2", unit: "Hz", toSI: 1, siUnit: "Hz", default: 25, min: 0, max: 1e10 },
    { key: "amp2", label: "Amplitude 2", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0, max: 1e6 },
    { key: "sampleRate", label: "Sampling rate f_s", unit: "Hz", toSI: 1, siUnit: "Hz", default: 100, min: 0.001, max: 1e9 },
    { key: "nPoints", label: "Samples N", unit: "", toSI: 1, siUnit: "", default: 256, min: 4, max: 8192 },
    { key: "noise", label: "Noise, RMS σ", unit: "", toSI: 1, siUnit: "", default: 0.1, min: 0, max: 1e6 },
  ],
  choices: [
    {
      key: "window",
      label: "Window",
      options: WINDOW_NAMES.map((name) => ({ value: name, label: WINDOWS[name].label })),
      default: "boxcar",
    },
  ],
  outputs: [
    { key: "nyquist", label: "Nyquist frequency f_s/2", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "binSpacing", label: "Bin spacing Δf = f_s/N", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "enbw", label: "Window equivalent noise bandwidth (bins)", unit: "", toSI: 1, siUnit: "" },
    { key: "tone1Read", label: "Tone 1 read amplitude", unit: "", toSI: 1, siUnit: "" },
    { key: "tone1Apparent", label: "Tone 1 apparent frequency", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "tone2Read", label: "Tone 2 read amplitude", unit: "", toSI: 1, siUnit: "" },
    { key: "tone2Apparent", label: "Tone 2 apparent frequency", unit: "Hz", toSI: 1, siUnit: "Hz" },
    { key: "noiseFloor", label: "Noise floor (RMS, amplitude scale)", unit: "", toSI: 1, siUnit: "" },
  ],
  validate({ freq1, freq2, sampleRate }) {
    return Math.max(freq1, freq2) > 10 * sampleRate ? "Tone frequencies must not exceed 10 f_s." : undefined;
  },
  compute({ freq1, amp1, freq2, amp2, sampleRate, nPoints, noise, window }) {
    const win = (WINDOW_NAMES as string[]).includes(window) ? (window as WindowName) : "boxcar";
    const N = Math.round(nPoints);
    const r = twoToneAnalysis({ f1: freq1, a1: amp1, f2: freq2, a2: amp2, sigma: noise, N, fs: sampleRate, win });
    const warnings: string[] = [];
    const above = r.tones.filter((t) => t.f > sampleRate / 2);
    if (above.length > 0) warnings.push(`Above the Nyquist frequency ${sampleRate / 2} Hz: ${above.map((t) => `${t.f} Hz appears at ${t.fa} Hz`).join(", ")}.`);
    return {
      values: {
        nyquist: sampleRate / 2,
        binSpacing: r.df,
        enbw: WINDOWS[win].enbw,
        tone1Read: r.tones[0].read,
        tone1Apparent: r.tones[0].fa,
        tone2Read: r.tones[1].read,
        tone2Apparent: r.tones[1].fa,
        noiseFloor: r.floor,
      },
      warnings,
    };
  },
  checks: [
    {
      // f_s = N = 64, boxcar, σ = 0: df = 1 Hz, tones on bins 8 and 20, so X_k = A N/2 and the amplitude 2|X_k|/N = A:
      // reads 1 and 0.5; Nyquist 32 Hz, ENBW of the boxcar 1.
      source: HARRIS,
      basis: "computed",
      inputs: { freq1: 8, amp1: 1, freq2: 20, amp2: 0.5, sampleRate: 64, nPoints: 64, noise: 0, window: "boxcar" },
      expect: { nyquist: 32, binSpacing: 1, enbw: 1, tone1Read: 1, tone1Apparent: 8, tone2Read: 0.5, tone2Apparent: 20 },
      tolerance: 1e-8,
    },
    {
      // Aliasing: 72 Hz sampled at 64 Hz folds to |72 − 64·round(72/64)| = 8 Hz; sin(2π·72n/64) = sin(2π·8n/64), so it reads 1.
      source: HARRIS,
      basis: "computed",
      inputs: { freq1: 72, amp1: 1, freq2: 20, amp2: 0.5, sampleRate: 64, nPoints: 64, noise: 0, window: "boxcar" },
      expect: { tone1Read: 1, tone1Apparent: 8, tone2Read: 0.5 },
      tolerance: 1e-8,
    },
    {
      // Noise floor 2σ√(Σw²)/Σw, boxcar: 2·0.1·√64/64 = 0.025.
      source: HARRIS,
      basis: "computed",
      inputs: { freq1: 8, amp1: 1, freq2: 20, amp2: 0.5, sampleRate: 64, nPoints: 64, noise: 0.1, window: "boxcar" },
      expect: { noiseFloor: 0.025 },
      tolerance: 1e-8,
    },
  ],
});
