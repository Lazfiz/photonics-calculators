"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function PulseCompressionPage() {
  const [inputDuration, setInputDuration] = useState(100); // fs
  const [compressionRatio, setCompressionRatio] = useState(10);
  const [inputBandwidth, setInputBandwidth] = useState(10); // nm at 800nm
  const [wavelength, setWavelength] = useState(800);

  const outputDuration = inputDuration / compressionRatio;
  const tlDuration = 0.44 * Math.pow(wavelength * 1e-9, 2) / (3e8 * inputBandwidth * 1e-9) * 1e15; // fs
  const peakPowerGain = compressionRatio;
  const timeBandwidth = inputDuration * tlDuration;

  const chartData = useMemo(() => {
    const N = 500;
    const tMax = inputDuration * 2;
    const ts = Array.from({ length: N }, (_, i) => (i / N - 0.5) * tMax);
    const input = ts.map(t => Math.exp(-2.77 * Math.pow(t / inputDuration, 2)));
    const output = ts.map(t => Math.exp(-2.77 * Math.pow(t / outputDuration, 2)));
    return [
      { x: ts, y: input, type: "scatter" as const, mode: "lines" as const, name: "Input pulse", line: { color: "#f87171", width: 2 } },
      { x: ts, y: output, type: "scatter" as const, mode: "lines" as const, name: "Compressed pulse", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [inputDuration, outputDuration]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Pulse Compression</h1>
      <p className="text-gray-400 mb-8">Transform-limited pulse compression via chirp compensation.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Input Pulse Duration (fs FWHM)</span>
          <input type="number" value={inputDuration} onChange={e => setInputDuration(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Compression Ratio</span>
          <input type="number" value={compressionRatio} onChange={e => setCompressionRatio(+e.target.value)} step="any" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Spectral Bandwidth (nm)</span>
          <input type="number" value={inputBandwidth} onChange={e => setInputBandwidth(+e.target.value)} step="any" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Center Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output Duration</p>
          <p className="text-xl font-bold text-blue-400">{outputDuration.toFixed(2)} fs</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transform Limit (TL)</p>
          <p className="text-xl font-bold text-green-400">{tlDuration.toFixed(2)} fs</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Power Gain</p>
          <p className="text-xl font-bold text-orange-400">{peakPowerGain.toFixed(1)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Time-Bandwidth Product</p>
          <p className="text-xl font-bold text-purple-400">{timeBandwidth.toFixed(1)} fs²</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2 font-mono">τ<sub>TL</sub> = 0.44 λ²/(c·Δλ) &nbsp;|&nbsp; Δτ·Δν ≥ 0.441 (Gaussian) &nbsp;|&nbsp; GDD<sub>comp</sub> = -GDD<sub>input</sub></p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Time (fs)", gridcolor: "#374151" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
