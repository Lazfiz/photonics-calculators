"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { createRng, gaussian } from "../../../physics/random";
import { WINDOWS, windowSamples, type WindowName } from "../../../physics/spectroscopy/apodization-comparison";
import { aliasedFrequency, amplitudeSpectrum, noiseFloorRms } from "../../../physics/spectroscopy/fourier-transform";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (v: number, d = 4) => (Number.isFinite(v) ? Number(v.toPrecision(d)).toString() : "—");
const round6 = (v: number) => Math.round(v * 1e6) / 1e6;
const WINDOW_NAMES = Object.keys(WINDOWS) as WindowName[];

export default function FourierTransformPage() {
  const [f1Raw, setFreq1] = useURLState("freq1", 10);
  const [f2Raw, setFreq2] = useURLState("freq2", 25);
  const [a1Raw, setAmp1] = useURLState("amp1", 1.0);
  const [a2Raw, setAmp2] = useURLState("amp2", 0.5);
  const [noiseRaw, setNoise] = useURLState("noise", 0.1);
  const [nRaw, setNPoints] = useURLState("nPoints", 256);
  const [fsRaw, setSampleRate] = useURLState("sampleRate", 100);
  const [windowRaw, setWindow] = useURLState("window", "boxcar");

  const fs = clamp(fsRaw, 1e-3, 1e9, 100);
  const f1 = clamp(f1Raw, 0, 10 * fs, 10);
  const f2 = clamp(f2Raw, 0, 10 * fs, 25);
  const a1 = clamp(a1Raw, 0, 1e6, 1);
  const a2 = clamp(a2Raw, 0, 1e6, 0.5);
  const sigma = clamp(noiseRaw, 0, 1e6, 0.1);
  const N = Math.round(clamp(nRaw, 4, 8192, 256));
  const win: WindowName = WINDOW_NAMES.includes(windowRaw as WindowName) ? (windowRaw as WindowName) : "boxcar";

  // N ≤ 8192 and one O(N log N) transform: recomputed on every render.
  const rng = createRng(1); // fixed seed: same noise on server and client
  const time = Array.from({ length: N }, (_, n) => n / fs);
  const signal = time.map((t) => a1 * Math.sin(2 * Math.PI * f1 * t) + a2 * Math.sin(2 * Math.PI * f2 * t) + sigma * gaussian(rng));
  const w = windowSamples(win, N);
  const spec = amplitudeSpectrum(signal, fs, w);
  const df = fs / N;
  const floor = noiseFloorRms(sigma, w);

  const tones = [
    { f: f1, a: a1 },
    { f: f2, a: a2 },
  ].map(({ f, a }) => {
    const fa = aliasedFrequency(f, fs);
    const k = Math.round(fa / df);
    const near = spec.amplitude.slice(Math.max(0, k - 1), Math.min(spec.amplitude.length, k + 2));
    return { f, a, fa, bin: fa / df, read: Math.max(...near) };
  });
  const aliased = tones.filter((t) => t.f > fs / 2);

  const signalSeries = [{ name: "x(t)", color: "#60a5fa", points: time.map((t, n) => ({ x: round6(t), y: round6(signal[n]) })) }];
  const spectrumSeries = [{ name: "Amplitude", color: "#f87171", points: spec.f.map((f, k) => ({ x: round6(f), y: round6(spec.amplitude[k]) })) }];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Frequency 1 (Hz)" value={f1Raw} onChange={setFreq1} min={0} max={10 * fs} />
        <ValidatedNumberInput label="Amplitude 1" value={a1Raw} onChange={setAmp1} min={0} max={1e6} />
        <ValidatedNumberInput label="Frequency 2 (Hz)" value={f2Raw} onChange={setFreq2} min={0} max={10 * fs} />
        <ValidatedNumberInput label="Amplitude 2" value={a2Raw} onChange={setAmp2} min={0} max={1e6} />
        <ValidatedNumberInput label="Sampling Rate f_s (Hz)" value={fsRaw} onChange={setSampleRate} min={0.001} max={1e9} />
        <ValidatedNumberInput label="Samples N" value={nRaw} onChange={setNPoints} min={4} max={8192} step="1" />
        <ValidatedNumberInput label="Noise, RMS σ" value={noiseRaw} onChange={setNoise} min={0} max={1e6} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Window</span>
          <select value={win} onChange={(e) => setWindow(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {WINDOW_NAMES.map((name) => <option key={name} value={name}>{WINDOWS[name].label}</option>)}
          </select>
        </label>
      </div>

      {aliased.length > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-800 bg-yellow-950/40 p-4 text-sm text-yellow-100">
          Above the Nyquist frequency {fmt(fs / 2)} Hz: {aliased.map((t) => `${fmt(t.f)} Hz appears at ${fmt(t.fa)} Hz`).join(", ")}.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Nyquist Frequency f_s/2" value={`${fmt(fs / 2)} Hz`} tone="blue" subtext={`record length T = N/f_s = ${fmt(N / fs)} s`} />
        <ResultCard label="Bin Spacing Δf = f_s/N" value={`${fmt(df)} Hz`} tone="green" subtext={`ENBW ${fmt(WINDOWS[win].enbw, 3)} bins (${WINDOWS[win].label})`} />
        {tones.map((t, i) => (
          <ResultCard key={i} label={`Tone ${i + 1} Read Amplitude`} value={fmt(t.read)} tone={i === 0 ? "yellow" : "purple"}
            subtext={`true ${fmt(t.a)} at ${fmt(t.fa)} Hz, bin ${fmt(t.bin)}`} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <SimpleLineChart title="Sampled signal" xLabel="Time (s)" yLabel="x(t)" series={signalSeries} />
        <SimpleLineChart title="One-sided amplitude spectrum" xLabel="Frequency (Hz)" yLabel="Amplitude" series={spectrumSeries} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">X_k = Σ wₙxₙ e^(−2πikn/N),   amplitude = 2|X_k|/Σwₙ,   f_k = k·f_s/N</p>
        <p className="font-mono">noise floor (RMS) = 2σ√(Σwₙ²)/Σwₙ = {fmt(floor)}</p>
        <p>
          Two sinusoids plus Gaussian white noise of standard deviation σ (fixed seed) are sampled N times at f_s and
          transformed with an FFT. Dividing by the window sum corrects the coherent gain, so a tone that falls exactly on a bin
          reads its true amplitude with any window. A tone between bins leaks into its neighbours and reads low (scalloping,
          up to 3.9 dB for no window, 1.4 dB for Hanning); tapered windows trade a wider peak for lower leakage far from it.
          Tones above f_s/2 fold back to |f − f_s·round(f/f_s)|.
        </p>
      </div>
    </>
  );
}
