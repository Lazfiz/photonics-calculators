"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { gateNoiseBandwidth, gateNoiseRms, gaussianGateAverage, optimalGateWidth, optimalGateWidthRatio } from "../../../physics/detectors/boxcar";
import { GAUSSIAN_FWHM_PER_SIGMA } from "../../../physics/math";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 3) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const fmtHz = (f: number) => (!Number.isFinite(f) ? "—" : f >= 1e9 ? `${(f / 1e9).toFixed(2)} GHz` : f >= 1e6 ? `${(f / 1e6).toFixed(2)} MHz` : f >= 1e3 ? `${(f / 1e3).toFixed(2)} kHz` : `${f.toFixed(2)} Hz`);
const fmtTime = (t: number) => (!Number.isFinite(t) ? "—" : t >= 1 ? `${t.toFixed(1)} s` : t >= 1e-3 ? `${(t * 1e3).toFixed(1)} ms` : `${(t * 1e6).toFixed(1)} µs`);
const OPTIMAL_GATE_RATIO = optimalGateWidthRatio();

/** Deterministic standard-normal samples (mulberry32 + Box–Muller) so the illustrative trace is stable across renders. */
function gaussianSamples(count: number, seed: number): number[] {
  let s = seed >>> 0;
  const uniform = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967296;
  };
  return Array.from({ length: count }, () => Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform()));
}
const NOISE = gaussianSamples(301, 12345);

export default function BoxcarIntegratorPage() {
  const [gateWidthRaw, setGateWidth] = useURLState("gateWidth", 100); // ns
  const [pulseWidthRaw, setPulseWidth] = useURLState("pulseWidth", 500); // ns FWHM
  const [gateDelayRaw, setGateDelay] = useURLState("gateDelay", 0); // ns, gate centre − pulse peak
  const [signalPeakRaw, setSignalPeak] = useURLState("signalPeak", 1); // mV
  const [noiseDensityRaw, setNoiseDensity] = useURLState("noiseDensity", 100); // nV/√Hz
  const [inputBandwidthRaw, setInputBandwidth] = useURLState("inputBandwidth", 100); // MHz
  const [repRateRaw, setRepRate] = useURLState("repRate", 1000); // Hz
  const [averagesRaw, setAverages] = useURLState("averages", 100);
  const gateWidth = clamp(gateWidthRaw, 0.01, 1e9, 100) * 1e-9; // s
  const fwhm = clamp(pulseWidthRaw, 0.01, 1e9, 500) * 1e-9; // s
  const gateDelay = clamp(gateDelayRaw, -1e9, 1e9, 0) * 1e-9; // s
  const signalPeak = clamp(signalPeakRaw, 0, 1e6, 1) * 1e-3; // V
  const noiseDensity = clamp(noiseDensityRaw, 0, 1e9, 100) * 1e-9; // V/√Hz
  const inputBandwidth = clamp(inputBandwidthRaw, 1e-6, 1e6, 100) * 1e6; // Hz
  const repRate = clamp(repRateRaw, 1e-3, 1e9, 1000);
  const averages = Math.round(clamp(averagesRaw, 1, 1e9, 100));

  const gateSignal = gaussianGateAverage(signalPeak, fwhm, gateWidth, gateDelay);
  const gateNoise = gateNoiseRms(noiseDensity, inputBandwidth, gateWidth);
  const snrSingle = gateNoise > 0 ? gateSignal / gateNoise : NaN;
  const snrAveraged = snrSingle * Math.sqrt(averages);
  const neb = gateNoiseBandwidth(gateWidth);
  const measureTime = averages / repRate;
  const inputNoise = noiseDensity * Math.sqrt(inputBandwidth);
  const snrAtGate = (T: number) => {
    const noise = gateNoiseRms(noiseDensity, inputBandwidth, T);
    return noise > 0 ? gaussianGateAverage(signalPeak, fwhm, T, gateDelay) / noise : NaN;
  };
  const optimalGate = optimalGateWidth(fwhm, inputBandwidth);
  const bandLimited = inputBandwidth * fwhm < 2;

  // Trace: pulse and gate on a ±(2·FWHM + |delay| + gate/2) window around the pulse peak, in ns.
  const halfSpan = 2 * fwhm + Math.abs(gateDelay) + gateWidth / 2;
  const t = Array.from({ length: NOISE.length }, (_, i) => -halfSpan + (2 * halfSpan * i) / (NOISE.length - 1));
  const sigma = fwhm / GAUSSIAN_FWHM_PER_SIGMA;
  const pulse = t.map(ti => signalPeak * Math.exp(-(ti * ti) / (2 * sigma * sigma)));
  const gateLo = gateDelay - gateWidth / 2;
  const gateHi = gateDelay + gateWidth / 2;
  const gateLevel = 1.2 * Math.max(signalPeak, 1e-12);
  const traceData = [
    { x: t.map(v => v * 1e9), y: pulse.map((p, i) => (p + inputNoise * NOISE[i]) * 1e3), type: "scatter" as const, mode: "lines" as const, name: "Pulse + noise (illustrative)", line: { color: "#6b7280", width: 1 } },
    { x: t.map(v => v * 1e9), y: pulse.map(p => p * 1e3), type: "scatter" as const, mode: "lines" as const, name: "Pulse", line: { color: "#60a5fa", width: 2 } },
    { x: [gateLo, gateLo, gateHi, gateHi].map(v => v * 1e9), y: [0, gateLevel, gateLevel, 0].map(v => v * 1e3), type: "scatter" as const, mode: "lines" as const, name: "Gate", line: { color: "#34d399", dash: "dash" } },
  ];

  const nScan = 161;
  const widths = Array.from({ length: nScan }, (_, i) => fwhm * Math.pow(10, -2 + (3 * i) / (nScan - 1)));
  const scanSnr = widths.map(snrAtGate);
  const scanMax = Math.max(...scanSnr.filter(Number.isFinite), 0);
  const scanData = [
    { x: widths.map(w => w * 1e9), y: scanSnr, type: "scatter" as const, mode: "lines" as const, name: "Single-shot SNR", line: { color: "#fbbf24", width: 2 } },
    { x: [gateWidth * 1e9, gateWidth * 1e9], y: [0, scanMax], type: "scatter" as const, mode: "lines" as const, name: "Current gate", line: { color: "#34d399", dash: "dash" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Pulse Width FWHM (ns)" value={pulseWidthRaw} onChange={setPulseWidth} min={0.01} max={1e9} />
        <ValidatedNumberInput label="Gate Width (ns)" value={gateWidthRaw} onChange={setGateWidth} min={0.01} max={1e9} />
        <ValidatedNumberInput label="Gate Delay from Peak (ns)" value={gateDelayRaw} onChange={setGateDelay} min={-1e9} max={1e9} />
        <ValidatedNumberInput label="Signal Peak (mV)" value={signalPeakRaw} onChange={setSignalPeak} min={0} max={1e6} step="0.1" />
        <ValidatedNumberInput label="Noise Density (nV/√Hz)" value={noiseDensityRaw} onChange={setNoiseDensity} min={0} max={1e9} step="10" />
        <ValidatedNumberInput label="Input Noise Bandwidth (MHz)" value={inputBandwidthRaw} onChange={setInputBandwidth} min={1e-6} max={1e6} step="10" />
        <ValidatedNumberInput label="Rep Rate (Hz)" value={repRateRaw} onChange={setRepRate} min={1e-3} max={1e9} />
        <ValidatedNumberInput label="Averages N" value={averagesRaw} onChange={setAverages} min={1} max={1e9} step="1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Gate-averaged signal" value={`${fmt(gateSignal * 1e3)} mV`} tone="blue" subtext={`Gate noise ${fmt(gateNoise * 1e6)} µV rms`} />
        <ResultCard label="Single-shot SNR" value={fmt(snrSingle)} tone="red" subtext={`Input noise ${fmt(inputNoise * 1e3)} mV rms`} />
        <ResultCard label={`SNR after ${averages} averages`} value={fmt(snrAveraged)} tone="yellow" subtext={`Measurement time ${fmtTime(measureTime)}`} />
        <ResultCard
          label="Optimum gate (centred)"
          value={`${fmt(optimalGate * 1e9)} ns`}
          tone="green"
          subtext={`${fmt(optimalGate / fwhm, 4)} × FWHM at this B (white-noise limit ${fmt(OPTIMAL_GATE_RATIO, 4)}); gate NEB now ${fmtHz(neb)}`}
        />
      </div>
      {bandLimited && (
        <p className="mb-6 text-sm text-yellow-400">
          B·FWHM = {fmt(inputBandwidth * fwhm)} &lt; 2: a real input this slow would also smear the pulse, which this model does not
          do (only the noise is band-limited), so the SNR and the short optimum gate are optimistic.
        </p>
      )}
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>⟨s⟩ = S·σ·√(π/2)/T · [erf((t_g + T/2)/σ√2) − erf((t_g − T/2)/σ√2)], &nbsp;σ = FWHM / 2.355</p>
        <p>σ_gate = e_n · √NEB with NEB = 1/(2T) when B ≫ 1/T; the full single-pole form tends to σ_in = e_n·√B for B ≪ 1/T</p>
        <p>SNR_N = SNR₁ · √N, &nbsp;measurement time = N / f_rep</p>
      </div>
      <ChartPanel data={traceData} layout={{ xaxis: { title: "Time from pulse peak (ns)", gridcolor: "#374151" }, yaxis: { title: "Signal (mV)", gridcolor: "#374151" } }} title="Pulse, Noise and Gate" />
      <h2 className="text-xl font-bold mt-8 mb-4">Single-shot SNR vs Gate Width</h2>
      <ChartPanel data={scanData} layout={{ xaxis: { title: "Gate width (ns)", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} />
    </>
  );
}
