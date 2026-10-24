"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  lockinSnrGain,
  lowPassEnbw,
  lowPassMagnitude,
  referenceMatch,
  type LockinFilter,
  type LockinReference,
} from "../../../physics/detectors/lockin";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const ORDER_COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171"];

export default function LockinAmplifierPage() {
  const [signalFreqRaw, setSignalFreq] = useURLState("signalFreq", 1000); // Hz
  const [refFreqRaw, setRefFreq] = useURLState("refFreq", 1000); // Hz
  const [phaseShiftRaw, setPhaseShift] = useURLState("phaseShift", 0); // degrees
  const [signalAmpRaw, setSignalAmp] = useURLState("signalAmp", 1); // µV peak
  const [noiseDensityRaw, setNoiseDensity] = useURLState("noiseDensity", 10); // nV/√Hz
  const [timeConstantRaw, setTimeConstant] = useURLState("timeConstant", 1); // s
  const [filterOrderRaw, setFilterOrder] = useURLState("filterOrder", 1);
  const [filterRaw, setFilter] = useURLState("filter", "rc");
  const [referenceRaw, setReference] = useURLState("reference", "sine");
  const [inputBandwidthRaw, setInputBandwidth] = useURLState("inputBandwidth", 1e5); // Hz
  const signalFreq = clamp(signalFreqRaw, 0, 1e9, 1000);
  const refFreq = clamp(refFreqRaw, 0, 1e9, 1000);
  const phaseRad = (clamp(phaseShiftRaw, -180, 180, 0) * Math.PI) / 180;
  const signalAmp = clamp(signalAmpRaw, 0, 1e9, 1) * 1e-6; // V peak
  const noiseDensity = clamp(noiseDensityRaw, 1e-3, 1e9, 10) * 1e-9; // V/√Hz
  const tau = clamp(timeConstantRaw, 1e-6, 1e5, 1);
  const order = Math.round(clamp(filterOrderRaw, 1, 4, 1));
  const filter: LockinFilter = filterRaw === "butterworth" ? "butterworth" : "rc";
  const reference: LockinReference = referenceRaw === "square" ? "square" : "sine";
  const inputBandwidth = clamp(inputBandwidthRaw, 1, 1e10, 1e5);

  // Unit-power reference: in phase, X = g_k·(A/√2)·cos φ; detuned, X beats at Δf_k with envelope g_k·(A/√2)·|H(Δf_k)|.
  // A square reference detects the signal at the odd harmonic k·f_r with the largest g_k·|H(Δf_k)|.
  const match = referenceMatch(signalFreq, refFreq, phaseRad, tau, order, filter, reference);
  const deltaF = match.detuning_Hz;
  const enbw = lowPassEnbw(tau, order, filter);
  const outputSignal = (signalAmp / Math.SQRT2) * match.gain;
  const outputNoise = noiseDensity * Math.sqrt(enbw);
  const inputNoise = noiseDensity * Math.sqrt(inputBandwidth);
  const snrInput = signalAmp / Math.SQRT2 / inputNoise;
  const snrGain = lockinSnrGain({ phase_rad: phaseRad, signal_Hz: signalFreq, reference_Hz: refFreq, tau, order, filter, reference, inputBandwidth_Hz: inputBandwidth });

  // Filter response vs detuning, 1e-3/τ … 1e2/τ, for orders 1–4 of the chosen filter type.
  const n = 161;
  const f = Array.from({ length: n }, (_, i) => Math.pow(10, -3 + (5 * i) / (n - 1)) / tau);
  const toDb = (m: number) => Math.max(-120, 20 * Math.log10(m));
  const chartData = [1, 2, 3, 4].map(N => ({
    x: f,
    y: f.map(fi => toDb(lowPassMagnitude(fi, tau, N, filter))),
    type: "scatter" as const,
    mode: "lines" as const,
    name: `Order ${N} (${6 * N} dB/oct)${N === order ? " ◀" : ""}`,
    line: { color: ORDER_COLORS[N - 1], width: N === order ? 3 : 1 },
  }));
  if (deltaF > 0) {
    chartData.push({ x: [deltaF, deltaF], y: [-120, 0], type: "scatter", mode: "lines", name: `Δf = ${fmt(deltaF, 3)} Hz`, line: { color: "#a78bfa", width: 1 } });
  }

  const select = "w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white";
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Signal Frequency (Hz)" value={signalFreqRaw} onChange={setSignalFreq} min={0} max={1e9} />
        <ValidatedNumberInput label="Reference Frequency (Hz)" value={refFreqRaw} onChange={setRefFreq} min={0} max={1e9} />
        <ValidatedNumberInput label="Phase Shift (°)" value={phaseShiftRaw} onChange={setPhaseShift} min={-180} max={180} />
        <ValidatedNumberInput label="Signal Amplitude (µV peak)" value={signalAmpRaw} onChange={setSignalAmp} min={0} max={1e9} step="0.1" />
        <ValidatedNumberInput label="Input Noise Density (nV/√Hz)" value={noiseDensityRaw} onChange={setNoiseDensity} min={1e-3} max={1e9} step="1" />
        <ValidatedNumberInput label="Input Noise Bandwidth (Hz)" value={inputBandwidthRaw} onChange={setInputBandwidth} min={1} max={1e10} step="1000" />
        <ValidatedNumberInput label="Time Constant τ (s)" value={timeConstantRaw} onChange={setTimeConstant} min={1e-6} max={1e5} step="0.1" />
        <ValidatedNumberInput label="Filter Order (1–4)" value={filterOrderRaw} onChange={setFilterOrder} min={1} max={4} step="1" />
        <label className="block text-sm text-gray-300">
          <span className="mb-1 block">Output filter</span>
          <select value={filter} onChange={e => setFilter(e.target.value)} className={select}>
            <option value="rc">Cascaded RC stages (lock-in standard)</option>
            <option value="butterworth">Butterworth, f_c = 1/2πτ</option>
          </select>
        </label>
        <label className="block text-sm text-gray-300">
          <span className="mb-1 block">Reference waveform</span>
          <select value={reference} onChange={e => setReference(e.target.value)} className={select}>
            <option value="sine">Sine (DSP lock-in)</option>
            <option value="square">Square (analog switching)</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="ENBW" value={`${fmt(enbw)} Hz`} tone="blue" subtext={`Detuning Δf = ${fmt(deltaF, 4)} Hz${match.harmonic > 1 ? ` from ${match.harmonic}·f_r` : ""}`} />
        <ResultCard
          label={deltaF === 0 ? "Output X (rms)" : "Output beat amplitude"}
          value={`${fmt(outputSignal * 1e6, 3)} µV`}
          tone="green"
          subtext={`Output noise ${fmt(outputNoise * 1e9, 3)} nV rms`}
        />
        <ResultCard label="SNR in → out" value={`${fmt(snrInput, 3)} → ${fmt(snrInput * snrGain, 3)}`} tone="yellow" />
        <ResultCard label="SNR Improvement" value={`×${fmt(snrGain, 4)}`} tone="purple" subtext={`√(B_in/ENBW) = ×${fmt(Math.sqrt(inputBandwidth / enbw), 4)}`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>X = g · (A/√2) · cos φ · |H(Δf)|, &nbsp;noise = e_n · √ENBW &nbsp;(g = 1 sine, 2√2/π square reference)</p>
        <p>A ±1 square reference also detects odd harmonics: g_k = 2√2/(kπ) at Δf_k = |f_s − k·f_r|, k = 3, 5, …</p>
        <p>RC cascade: ENBW = 1/4τ, 1/8τ, 3/32τ, 5/64τ (N = 1–4) &nbsp;| &nbsp;Butterworth: ENBW = (1/4Nτ)/sin(π/2N)</p>
        <p>SNR improvement = g · |cos φ| · |H(Δf)| · √(B_in / ENBW)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        xaxis: { title: "Detuning from reference (Hz)", gridcolor: "#374151", type: "log" },
        yaxis: { title: "Filter response |H| (dB)", gridcolor: "#374151" },
      }} />
    </>
  );
}
