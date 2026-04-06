"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

export default function BoxcarIntegratorPage() {
  const [gateWidth, setGateWidth] = useState(100);
  const [repRate, setRepRate] = useState(1000);
  const [signalPeak, setSignalPeak] = useState(1);
  const [noiseRms, setNoiseRms] = useState(5);
  const [averages, setAverages] = useState(100);
  const [pulseWidth, setPulseWidth] = useState(500);

  const dutyCycle = gateWidth / pulseWidth;
  const samplesPerGate = Math.max(1, Math.round(gateWidth / 10));
  const snrPerGate = signalPeak / noiseRms;
  const snrAfterAvg = snrPerGate * Math.sqrt(averages);
  const snrTotal = snrPerGate * Math.sqrt(samplesPerGate * averages);
  const bandwidth = repRate * dutyCycle / (2 * averages);

  const chartData = useMemo(() => {
    const t = Array.from({ length: 500 }, (_, i) => i * pulseWidth * 2 / 500);
    const gateStart = pulseWidth * 0.3;
    const gateEnd = gateStart + gateWidth;
    const signal = t.map(ti => signalPeak * Math.exp(-0.5 * Math.pow((ti - pulseWidth * 0.5) / (pulseWidth * 0.15), 2)));
    const noisy = t.map((ti, i) => signal[i] + noiseRms * (Math.sin(i * 7.3) * 0.5 + Math.cos(i * 13.7) * 0.5));
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
      { x: N, y: N.map(n => snrPerGate * Math.sqrt(n)), type: "scatter" as const, mode: "lines" as const, name: "SNR vs Averages", line: { color: "#fbbf24", width: 2 } },
      { x: N, y: N.map(n => snrPerGate * Math.sqrt(n * samplesPerGate)), type: "scatter" as const, mode: "lines" as const, name: "SNR (gate + avg)", line: { color: "#a78bfa", width: 2 } },
    ];
  }, [snrPerGate, samplesPerGate]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Boxcar Integrator" description="Gated signal averaging — recover repetitive signals from noise.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Gate Width (ns)</span><input type="number" value={gateWidth} onChange={e => setGateWidth(+e.target.value)} min="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Pulse Width (ns)</span><input type="number" value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} min="10" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Signal Peak (mV)</span><input type="number" value={signalPeak} onChange={e => setSignalPeak(+e.target.value)} min="0.001" step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Noise RMS (mV)</span><input type="number" value={noiseRms} onChange={e => setNoiseRms(+e.target.value)} min="0.01" step="0.5" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Rep Rate (Hz)</span><input type="number" value={repRate} onChange={e => setRepRate(+e.target.value)} min="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Averages</span><input type="number" value={averages} onChange={e => setAverages(+e.target.value)} min="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Single-shot SNR" value={snrPerGate.toFixed(3)} tone="red" />
        <ResultCard label={`After ${averages} avg`} value={snrAfterAvg.toFixed(2)} tone="yellow" />
        <ResultCard label="Total SNR (gate+avg)" value={snrTotal.toFixed(2)} tone="green" />
        <ResultCard label="Effective BW" value={`${bandwidth.toFixed(2)} Hz`} tone="blue" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>SNR_total = (V_sig / σ_noise) · √(N_gate · N_avg)</p>
        <p>BW_eff ≈ f_rep · (t_gate / t_pulse) / (2 · N_avg)</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Time (ns)", gridcolor: "#374151" }, yaxis: { title: "Signal (mV)", gridcolor: "#374151" } }} title="Signal with Gate Window" />
      <h2 className="text-xl font-bold mt-8 mb-4">SNR vs Averages</h2>
      <ChartPanel data={snrVsAvg} layout={{ xaxis: { title: "Number of Averages", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} />
    </CalculatorShell>
  );
}
