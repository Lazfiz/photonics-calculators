import { signalToNoiseSummary, type BinningMode } from "../../physics/imaging/signal-to-noise";
import { defineSchema } from "../types";

const JANESICK = "Janesick J. R. (2007). Photon Transfer: DN → λ. SPIE Press, doi:10.1117/3.725073: SNR = S/√(S + S_bg + D + σ_read²) " +
  "for Poisson signal, background and dark charge plus read noise, ch. 5: averaging N frames of independent noise gives SNR_N = √N·SNR " +
  "and a b × b charge-binned super-pixel is read once while a digital sum of b² reads has noise b·σ_read.";

const noNoise = "There is no signal, background, dark charge or read noise, so the noise is 0 and the SNR is undefined.";
const noSignal = "There is no signal (SNR = 0): averaging frames can't reach any target SNR.";

export default defineSchema({
  href: "/imaging/signal-to-noise",
  inputs: [
    { key: "signalPhotons", label: "Signal photons (per pixel, per exposure)", unit: "photons", toSI: 1, siUnit: "photons", default: 5000, min: 0, max: 10000000 },
    { key: "backgroundPhotons", label: "Background photons (per pixel, per exposure)", unit: "photons", toSI: 1, siUnit: "photons", default: 500, min: 0, max: 10000000 },
    { key: "quantumEfficiency", label: "Quantum efficiency", unit: "", toSI: 1, siUnit: "", default: 0.7, min: 0.01, max: 1 },
    { key: "readNoise", label: "Read noise", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻", default: 1.5, min: 0, max: 100 },
    { key: "darkCurrent", label: "Dark current", unit: "e⁻/s/pixel", toSI: 1, siUnit: "e⁻/s", default: 0.1, min: 0, max: 10000 },
    { key: "exposureTime", label: "Exposure time", unit: "ms", toSI: 1e-3, siUnit: "s", default: 100, min: 0.01, max: 3600000 },
    { key: "binning", label: "Binning B (B × B pixels)", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 8 },
    { key: "numFrames", label: "Number of frames (averaged)", unit: "", toSI: 1, siUnit: "", default: 1, min: 1, max: 10000 },
    { key: "targetSnr", label: "Target SNR", unit: "", toSI: 1, siUnit: "", default: 100, min: 1, max: 100000 },
  ],
  choices: [
    {
      key: "binningMode",
      label: "Binning mode",
      options: [
        { value: "charge", label: "Charge binning (CCD): one read" },
        { value: "digital", label: "Digital sum (CMOS): B² reads" },
      ],
      default: "charge",
    },
  ],
  outputs: [
    { key: "signal", label: "Signal per super-pixel", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "background", label: "Background per super-pixel", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "darkCharge", label: "Dark charge per super-pixel", unit: "e⁻", toSI: 1, siUnit: "e⁻" },
    { key: "readNoiseBinned", label: "Read noise per super-pixel", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻" },
    { key: "noise", label: "Total noise (one frame)", unit: "e⁻ rms", toSI: 1, siUnit: "e⁻" },
    { key: "snr", label: "SNR (one frame)", unit: "", toSI: 1, siUnit: "" },
    { key: "snrAveraged", label: "SNR (frames averaged)", unit: "", toSI: 1, siUnit: "" },
    { key: "framesNeeded", label: "Frames for the target SNR", unit: "frames", toSI: 1, siUnit: "frames" },
    { key: "shareSignal", label: "Variance share, signal shot noise", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "shareBackground", label: "Variance share, background shot noise", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "shareDark", label: "Variance share, dark-charge shot noise", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "shareRead", label: "Variance share, read noise", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute(i) {
    const s = signalToNoiseSummary({
      signalPhotons: i.signalPhotons, backgroundPhotons: i.backgroundPhotons, quantumEfficiency: i.quantumEfficiency,
      read: i.readNoise, darkRate: i.darkCurrent, exposure: i.exposureTime, binning: Math.round(i.binning),
      binningMode: i.binningMode as BinningMode, frames: Math.round(i.numFrames), targetSnr: i.targetSnr,
    });
    const share = (variance: number) => (s.totalVariance > 0 ? variance / s.totalVariance : NaN);
    const warnings: string[] = [];
    if (!(s.noise > 0)) warnings.push(noNoise);
    return {
      values: {
        signal: s.signal,
        background: s.background,
        darkCharge: s.dark,
        readNoiseBinned: s.readBinned,
        noise: s.noise,
        snr: s.snr,
        snrAveraged: s.snrAveraged,
        framesNeeded: s.framesNeeded,
        shareSignal: share(s.budget[0].variance),
        shareBackground: share(s.budget[1].variance),
        shareDark: share(s.budget[2].variance),
        shareRead: share(s.budget[3].variance),
      },
      warnings,
      reasons: {
        snr: noNoise,
        snrAveraged: noNoise,
        framesNeeded: s.noise > 0 ? noSignal : noNoise,
        shareSignal: noNoise,
        shareBackground: noNoise,
        shareDark: noNoise,
        shareRead: noNoise,
      },
    };
  },
  checks: [
    {
      // Defaults: S = 0.7·5000 = 3500 e⁻, S_bg = 0.7·500 = 350 e⁻, D = 0.1 e⁻/s·0.1 s = 0.01 e⁻, σ_read² = 2.25;
      // noise² = 3500 + 350 + 0.01 + 2.25 = 3852.26 → 62.06657716 e⁻; SNR = 3500/62.06657716 = 56.39105877; frames for 100: ⌈(100/56.39105877)²⌉ = ⌈3.1447⌉ = 4.
      source: JANESICK,
      basis: "computed",
      inputs: {},
      expect: { signal: 3500, noise: 62.06657715711412, snr: 56.391058768073655, framesNeeded: 4, shareSignal: 90.85575739955246 },
      tolerance: 1e-8,
    },
    {
      // 3 × 3 digital sum, 4 frames, target 200: pixels = 9; S = 31500, S_bg = 3150, D = 0.09, σ_read,B = 3·1.5 = 4.5 (σ² = 20.25);
      // noise² = 34670.34 → 186.19973147; SNR = 169.17317630; SNR_4 = √4·SNR = 338.34635261; frames ⌈(200/169.1732)²⌉ = ⌈1.3976⌉ = 2.
      source: JANESICK,
      basis: "computed",
      inputs: { binning: 3, binningMode: "digital", numFrames: 4, targetSnr: 200 },
      expect: { readNoiseBinned: 4.5, noise: 186.19973147134235, snr: 169.17317630422096, snrAveraged: 338.3463526084419, framesNeeded: 2 },
      tolerance: 1e-8,
    },
    {
      // Background-limited, 2 × 2 charge binning (read once): QE 0.5, 100 signal and 200 background photons, read 3 e⁻, dark 1 e⁻/s, 500 ms:
      // S = 0.5·100·4 = 200, S_bg = 400, D = 1·0.5·4 = 2, σ² = 9; total = 611 → 24.71841419 e⁻; SNR = 8.09113394; shares 200/611 = 32.733 %, 400/611 = 65.466 %;
      // frames for 20: ⌈(20/8.09113394)²⌉ = ⌈6.11⌉ = 7.
      source: JANESICK,
      basis: "computed",
      inputs: {
        signalPhotons: 100, backgroundPhotons: 200, quantumEfficiency: 0.5, readNoise: 3, darkCurrent: 1, exposureTime: 500,
        binning: 2, numFrames: 5, targetSnr: 20,
      },
      expect: { snr: 8.09113394062735, snrAveraged: 18.0923255062985, shareBackground: 65.46644844517185, framesNeeded: 7 },
      tolerance: 1e-8,
    },
  ],
});
