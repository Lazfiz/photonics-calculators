"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function BoxcarIntegratorPage() {
  const [gateWidth, setGateWidth] = useURLState("gateWidth", 100);
  const [repRate, setRepRate] = useURLState("repRate", 1000);
  const [signalPeak, setSignalPeak] = useURLState("signalPeak", 1);
  const [noiseRms, setNoiseRms] = useURLState("noiseRms", 5);
  const [averages, setAverages] = useURLState("averages", 100);
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 500);

  // Single-shot SNR: ratio of peak signal to RMS noise within the gate
  const snrPerGate = signalPeak / noiseRms;
  // Averaging N sweeps improves SNR by √N (independent measurements)
  const snrAfterAvg = snrPerGate * Math.sqrt(averages);
  // Noise equivalent bandwidth of the boxcar gate: NEB = 1/(2·τ_gate)
  const neb = 1 / (2 * gateWidth * 1e-9);
  // Total measurement time for N averages
  const measureTime = averages / repRate;

  const chartData = useMemo(() => {
    const t = Array.from({ length: 500 }, (_, i) => i * pulseWidth * 2 / 500);
    const gateStart = pulseWidth * 0.3;
    const gateEnd = gateStart + gateWidth;
    const signal = t.map(ti => signalPeak * Math.exp(-0.5 * Math.pow((ti - pulseWidth * 0.5) / (pulseWidth / 2.355), 2)));
    const noisy = t.map((ti, i) => signal[i] + noiseRms * Math.SQRT2 * (Math.sin(i * 7.3) * 0.5 + Math.cos(i * 13.7) * 0.5));
    const gate = t.map(ti => ti >= gateStart && ti <= gateEnd ? signalPeak * 1.2 : 0);
    return [
      { x: t, y: noisy, type: "scatter" as const, mode: "lines" as const, name: "Noisy Signal", line: { color: "#6b7280", width: 1 } },
      { x: t, y: signal, type: "scatter" as const, mode: "lines" as const, name: "True Signal", line: { color: "#60a5fa", width: 2 } },
      { x: t, y: gate, type: "scatter" as const, mode: "lines" as const, fill: "tozeroy", name: "Gate Window", line: { color: "#34d399", dash: "dash" }, fillcolor: "rgba(52,211,153,0.1)" },
    ];
  }, [gateWidth, pulseWidth, signalPeak, noiseRms]);

  const snrVsAvg = useMemo(() => {
    const N = Array.from({ length: 200 }, (_, i) => Math.pow(10, i * 5 / 200));
    return [
      { x: N, y: N.map(n => snrPerGate * Math.sqrt(n)), type: "scatter" as const, mode: "lines" as const, name: "SNR after N averages", line: { color: "#fbbf24", width: 2 } },
    ];
  }, [snrPerGate]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Boxcar Integrator" description="Gated signal averaging — recover repetitive signals from noise.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Gate Width (ns)" value={gateWidth} onChange={setGateWidth} min={1} />
        <ValidatedNumberInput label="Pulse Width (ns)" value={pulseWidth} onChange={setPulseWidth} min={10} />
        <ValidatedNumberInput label="Signal Peak (mV)" value={signalPeak} onChange={setSignalPeak} min={0.001} step="0.1" />
        <ValidatedNumberInput label="Noise RMS (mV)" value={noiseRms} onChange={setNoiseRms} min={0.01} step="0.5" />
        <ValidatedNumberInput label="Rep Rate (Hz)" value={repRate} onChange={setRepRate} min={1} />
        <ValidatedNumberInput label="Averages" value={averages} onChange={setAverages} min={1} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Single-shot SNR" value={snrPerGate.toFixed(3)} tone="red" />
        <ResultCard label={`After ${averages} avg`} value={snrAfterAvg.toFixed(2)} tone="yellow" />
        <ResultCard label="NEB (gate)" value={`${neb.toExponential(3)} Hz`} tone="blue" />
        <ResultCard label="Measure Time" value={measureTime >= 1 ? `${measureTime.toFixed(1)} s` : `${(measureTime * 1000).toFixed(1)} ms`} tone="green" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>SNR improves by √N_avg with N independent sweep averages</p>
        <p>Noise Equivalent Bandwidth: NEB = 1 / (2 · τ_gate)</p>
        <p>Total measurement time: T = N_avg / f_rep</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Time (ns)", gridcolor: "#374151" }, yaxis: { title: "Signal (mV)", gridcolor: "#374151" } }} title="Signal with Gate Window" />
      <h2 className="text-xl font-bold mt-8 mb-4">SNR vs Averages</h2>
      <ChartPanel data={snrVsAvg} layout={{ xaxis: { title: "Number of Averages", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} />
    </CalculatorShell>
  );
}
