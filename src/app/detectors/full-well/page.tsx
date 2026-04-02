"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function FullWellPage() {
  const [fullWell, setFullWell] = useState(20000);
  const [readNoise, setReadNoise] = useState(3);
  const [signal, setSignal] = useState(10000);

  const shotNoise = Math.sqrt(signal);
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
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Full Well Capacity vs SNR</h1>
      <p className="text-gray-400 mb-8">Analyze how full well capacity affects signal-to-noise ratio and dynamic range.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Full Well Capacity (e⁻)</span>
          <input type="number" value={fullWell} onChange={e => setFullWell(+e.target.value)} min={1000} step="1000"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Read Noise (e⁻)</span>
          <input type="number" value={readNoise} onChange={e => setReadNoise(+e.target.value)} min={0.5} step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Signal Level (e⁻)</span>
          <input type="number" value={signal} onChange={e => setSignal(+e.target.value)} min={0} max={fullWell} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Current SNR</p>
          <p className="text-2xl font-bold text-blue-400">{snr.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max SNR (saturation)</p>
          <p className="text-2xl font-bold text-green-400">{maxSNR.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dynamic Range</p>
          <p className="text-2xl font-bold text-yellow-400">{dynamicRange.toFixed(0)}:1 ({(20 * Math.log10(dynamicRange)).toFixed(1)} dB)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Saturation</p>
          <p className={`text-2xl font-bold ${saturation > 90 ? "text-red-400" : "text-green-400"}`}>{saturation.toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Signal (e⁻)", gridcolor: "#374151" },
          yaxis: { title: "SNR", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
