"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

export default function FullWellPage() {
  const [fullWell, setFullWell] = useState(20000);
  const [readNoise, setReadNoise] = useState(3);
  const [signal, setSignal] = useState(10000);

  const totalNoise = Math.sqrt(signal + readNoise ** 2);
  const snr = signal / totalNoise;
  const saturation = (signal / fullWell) * 100;
  const maxSNR = fullWell / Math.sqrt(fullWell + readNoise ** 2);
  const dynamicRange = fullWell / readNoise;

  const chartData = useMemo(() => {
    const signals = Array.from({ length: 100 }, (_, i) => (i + 1) * (fullWell / 100));
    return [
      { x: signals, y: signals.map(s => s / Math.sqrt(Math.max(s, 1) + readNoise ** 2)), type: "scatter" as const, mode: "lines" as const, name: "SNR", line: { color: "#60a5fa" } },
      { x: [signal], y: [snr], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
      { x: signals, y: signals.map(s => Math.sqrt(s)), type: "scatter" as const, mode: "lines" as const, name: "Shot Noise", yaxis: "y2", line: { color: "#34d399", dash: "dash" } },
    ];
  }, [fullWell, readNoise, signal, snr]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Full Well Capacity vs SNR" description="Analyze how full well capacity affects signal-to-noise ratio and dynamic range.">
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Full Well Capacity (e⁻)</span><input type="number" value={fullWell} onChange={e => setFullWell(+e.target.value)} min={1000} step="1000" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Read Noise (e⁻)</span><input type="number" value={readNoise} onChange={e => setReadNoise(+e.target.value)} min={0.5} step="0.5" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Signal Level (e⁻)</span><input type="number" value={signal} onChange={e => setSignal(+e.target.value)} min={0} max={fullWell} step="any" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Current SNR" value={snr.toFixed(1)} tone="blue" />
        <ResultCard label="Max SNR" value={maxSNR.toFixed(1)} tone="green" />
        <ResultCard label="Dynamic Range" value={`${dynamicRange.toFixed(0)}:1`} tone="yellow" subtext={`${(20 * Math.log10(dynamicRange)).toFixed(1)} dB`} />
        <ResultCard label="Saturation" value={`${saturation.toFixed(1)}%`} tone={saturation > 90 ? "red" : "green"} />
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Signal (e⁻)", gridcolor: "#374151" }, yaxis: { title: "SNR", gridcolor: "#374151" }, yaxis2: { title: "Shot Noise (e⁻)", overlaying: "y", side: "right", gridcolor: "#374151" } }} />
    </CalculatorShell>
  );
}
