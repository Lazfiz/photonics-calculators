"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
// Lock-in amplifier: V_out = V_signal * cos(Δφ) * (2/π) * H(Δf) for square-wave demod
// ENBW = 1/(4*RC) for 1st-order RC output filter
// SNR improvement = (2/π)|cos(Δφ)|·H(Δf)·√(BW_in / ENBW)
export default function LockinAmplifierPage() {
  const [signalFreq, setSignalFreq] = useURLState("signalFreq", 1000); // Hz
  const [refFreq, setRefFreq] = useURLState("refFreq", 1000); // Hz
  const [phaseShift, setPhaseShift] = useURLState("phaseShift", 0); // degrees
  const [signalAmp, setSignalAmp] = useURLState("signalAmp", 1); // μV
  const [noiseDensity, setNoiseDensity] = useURLState("noiseDensity", 10); // nV/√Hz
  const [timeConstant, setTimeConstant] = useURLState("timeConstant", 1); // seconds
  const [filterOrder, setFilterOrder] = useURLState("filterOrder", 1); // 1 or 2
  const [inputBandwidth, setInputBandwidth] = useURLState("inputBandwidth", 1e5); // Hz

  const deltaF = Math.abs(signalFreq - refFreq);
  const phaseRad = (phaseShift * Math.PI) / 180;
  const enbw = 1 / (4 * timeConstant); // Hz, for 1st order RC LPF
  // 2nd-order Butterworth ENBW = f_c * π/(2√2), f_c = 1/(2πRC), ratio to 1st = 1/√2
  const enbwActual = filterOrder === 1 ? enbw : enbw / Math.SQRT2;

  // LPF transfer function magnitude at detuning frequency
  const omegaTau = 2 * Math.PI * deltaF * timeConstant;
  const lpfAttenuation = filterOrder === 1
    ? 1 / Math.sqrt(1 + omegaTau * omegaTau)
    : 1 / Math.sqrt(1 + Math.pow(omegaTau, 4));

  const demodFactor = (2 / Math.PI) * Math.abs(Math.cos(phaseRad));
  const outputSignal = signalAmp * 1e-6 * Math.cos(phaseRad) * (2 / Math.PI) * lpfAttenuation;
  const inputNoise = noiseDensity * 1e-9 * Math.sqrt(inputBandwidth);
  const outputNoise = noiseDensity * 1e-9 * Math.sqrt(enbwActual);
  const snrInput = signalAmp * 1e-6 / inputNoise;
  const snrOutput = Math.abs(outputSignal) / outputNoise;
  const snrImprovement = snrOutput / snrInput;
  const bwGain = Math.sqrt(inputBandwidth / enbwActual);

  const chartData = useMemo(() => {
    const f = Array.from({ length: 500 }, (_, i) => 0.1 + i * 5000 / 500);
    const noiseFloor = f.map(() => noiseDensity * 1e-9);
    // Actual LPF transfer function (bandpass equivalent centered on ref freq)
    const transfer = f.map(fi => {
      const dist = Math.abs(fi - refFreq);
      const wt = 2 * Math.PI * dist * timeConstant;
      return filterOrder === 1
        ? 1 / Math.sqrt(1 + wt * wt)
        : 1 / Math.sqrt(1 + Math.pow(wt, 4));
    });
    const outNoise = f.map((fi, i) => noiseDensity * 1e-9 * transfer[i]);

    return [
      { x: f, y: noiseFloor.map(v => v * 1e9), type: "scatter", mode: "lines",
        name: "Input Noise Floor", line: { color: "#f87171", width: 2 }, yaxis: "y" },
      { x: f, y: outNoise.map(v => v * 1e9), type: "scatter", mode: "lines",
        name: "After Lock-in", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: f, y: transfer, type: "scatter", mode: "lines",
        name: "Transfer Function", line: { color: "#34d399", dash: "dash" }, yaxis: "y2" },
    ];
  }, [noiseDensity, refFreq, timeConstant, filterOrder]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Signal Frequency (Hz)" value={signalFreq} onChange={setSignalFreq} min={1} />
        <ValidatedNumberInput label="Reference Frequency (Hz)" value={refFreq} onChange={setRefFreq} min={1} />
        <ValidatedNumberInput label="Phase Shift (°)" value={phaseShift} onChange={setPhaseShift} min={-180} max={180} />
        <ValidatedNumberInput label="Signal Amplitude (μV)" value={signalAmp} onChange={setSignalAmp} min={0.001} step="0.1" />
        <ValidatedNumberInput label="Input Noise Density (nV/√Hz)" value={noiseDensity} onChange={setNoiseDensity} min={0.1} step="1" />
        <ValidatedNumberInput label="Time Constant τ (s)" value={timeConstant} onChange={setTimeConstant} min={0.001} step="0.1" />
        <ValidatedNumberInput label="Filter Order" value={filterOrder} onChange={setFilterOrder} min={1} max={4} step="1" />
        <ValidatedNumberInput label="Input Bandwidth (Hz)" value={inputBandwidth} onChange={setInputBandwidth} min={100} step="1000" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Δf (detuning)" value={`${deltaF} Hz`} tone="yellow" />
        <ResultCard label="ENBW" value={`${enbwActual.toFixed(3)} Hz`} tone="blue" />
        <ResultCard label="Output Signal" value={`${(outputSignal * 1e6).toFixed(2)} μV`} tone="green" />
        <ResultCard label="SNR Improvement" value={`×${snrImprovement.toFixed(1)}`} tone="purple" subtext={`BW gain: ×${bwGain.toFixed(1)}`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>V<sub>out</sub> = V<sub>sig</sub> · cos(Δφ) · (2/π) · H(Δf)  [square-wave demod + LPF]</p>
        <p>ENBW = 1 / (4 · τ)  [1st-order] | ENBW₂ = ENBW / √2  [2nd-order]</p>
        <p>SNR improvement = (2/π)|cos(Δφ)| · H(Δf) · √(BW<sub>in</sub> / ENBW)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Frequency (Hz)", gridcolor: "#374151", type: "log" },
        yaxis: { title: "Noise Density (nV/√Hz)", gridcolor: "#374151", type: "log" },
        yaxis2: { title: "Transfer", gridcolor: "#374151", overlaying: "y", side: "right", range: [-0.1, 1.2] },
        margin: { t: 30, r: 60, b: 50, l: 80 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} />
    </div>
  );
}
