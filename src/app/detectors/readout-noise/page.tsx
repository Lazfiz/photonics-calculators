"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ReadoutNoisePage() {
  const [readNoise, setReadNoise] = useState(10); // e- rms
  const [darkCurrent, setDarkCurrent] = useState(0.1); // e-/s/pixel
  const [exposureTime, setExposureTime] = useState(0.01); // s

  const chartData = useMemo(() => {
    const signals = Array.from({ length: 200 }, (_, i) => 1 + (i / 200) * 9999);
    const shotNoise = signals.map(s => Math.sqrt(s));
    const totalNoise = signals.map(s => Math.sqrt(s + readNoise ** 2));
    const snr = signals.map(s => s / Math.sqrt(s + readNoise ** 2 + darkCurrent * exposureTime));
    return [
      { x: signals, y: shotNoise, type: "scatter" as const, mode: "lines" as const, name: "Shot noise only", line: { color: "#60a5fa" } },
      { x: signals, y: totalNoise, type: "scatter" as const, mode: "lines" as const, name: "Total (shot + read)", line: { color: "#f87171" } },
      { x: signals, y: snr, type: "scatter" as const, mode: "lines" as const, name: "SNR", line: { color: "#34d399" }, yaxis: "y2" },
    ];
  }, [readNoise, darkCurrent, exposureTime]);

  const darkElectrons = darkCurrent * exposureTime;
  const totalNoiseVal = Math.sqrt(readNoise ** 2 + darkElectrons);
  const readNoiseLimitedSignal = readNoise ** 2; // signal where shot = read noise

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Readout Noise</h1>
      <p className="text-gray-400 mb-8">Total noise: σ<sub>total</sub> = √(σ<sub>read</sub>² + S + D·t). Combines read noise, shot noise, and dark current.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Read noise σ<sub>read</sub> (e⁻ rms)</span>
          <input type="number" value={readNoise} onChange={e => setReadNoise(+e.target.value)} step="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Dark current (e⁻/s/pixel)</span>
          <input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Exposure time (s)</span>
          <input type="number" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} step="0.001" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Dark electrons = <span className="text-blue-400 font-mono">{darkElectrons.toFixed(3)} e⁻</span></p>
        <p className="text-gray-300">Noise floor (dark + read) = <span className="text-blue-400 font-mono">{totalNoiseVal.toFixed(2)} e⁻</span></p>
        <p className="text-gray-300">Read-noise-limited signal = <span className="text-blue-400 font-mono">{readNoiseLimitedSignal.toFixed(0)} e⁻</span> (shot = read noise)</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Signal (e⁻)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Noise (e⁻ rms)", type: "log", gridcolor: "#374151" },
        yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
