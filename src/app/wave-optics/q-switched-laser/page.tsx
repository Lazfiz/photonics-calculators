"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function QSwitchedLaserPage() {
  const [repRate, setRepRate] = useState(10); // kHz
  const [pulseEnergy, setPulseEnergy] = useState(1); // mJ
  const [pulseWidth, setPulseWidth] = useState(10); // ns

  const chartData = useMemo(() => {
    const t = Array.from({ length: 200 }, (_, i) => i * pulseWidth * 0.1); // ns
    const intensity = t.map(ti => {
      const pulseCenter = pulseWidth * 5;
      return Math.exp(-(((ti - pulseCenter) / pulseWidth) ** 2));
    });
    
    return [
      { x: t, y: intensity, type: "scatter" as const, mode: "lines" as const, name: "Q-Switched Pulse", line: { color: "#60a5fa" }, fill: "tozeroy" },
    ];
  }, [repRate, pulseEnergy, pulseWidth]);

  const peakPower = pulseEnergy / (pulseWidth * 1e-9) / 1000; // kW
  const avgPower = pulseEnergy * repRate; // W

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Q-Switched Laser</h1>
      <p className="text-gray-400 mb-8">High-energy pulse generation through repetitive Q-switching of a laser cavity.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Rep Rate (kHz)</span>
          <input type="number" value={repRate} onChange={e => setRepRate(+e.target.value)} step="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Pulse Energy (mJ)</span>
          <input type="number" value={pulseEnergy} onChange={e => setPulseEnergy(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Pulse Width (ns)</span>
          <input type="number" value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} step="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 grid grid-cols-3 gap-4">
        <div><p className="text-xs text-gray-500">Peak Power</p><p className="text-blue-400 font-mono">{peakPower.toFixed(1)} kW</p></div>
        <div><p className="text-xs text-gray-500">Avg Power</p><p className="text-blue-400 font-mono">{avgPower.toFixed(1)} W</p></div>
        <div><p className="text-xs text-gray-500">Duty Cycle</p><p className="text-blue-400 font-mono">{(pulseWidth * 1e-9 * repRate * 1e3 * 100).toFixed(4)}%</p></div>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: "Time (ns)", gridcolor: "#374151" },
        yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
