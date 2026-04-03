"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function OpticalFrequencyCombPage() {
  const [repRate, setRepRate] = useState(250); // MHz
  const [centerWavelength, setCenterWavelength] = useState(1550); // nm
  const [combLines, setCombLines] = useState(50);

  const chartData = useMemo(() => {
    const c = 3e8;
    const f0 = c / (centerWavelength * 1e-9);
    const repFreqHz = repRate * 1e6;
    
    const freqs = Array.from({ length: combLines }, (_, i) => {
      const n = i - Math.floor(combLines / 2);
      return f0 + n * repFreqHz;
    });
    
    return [
      { x: freqs.map(f => f / 1e12), y: freqs.map((_, i) => Math.exp(-((i - combLines / 2) ** 2))), type: "scatter" as const, mode: "lines" as const, name: "Comb Teeth", line: { color: "#60a5fa" } },
    ];
  }, [repRate, centerWavelength, combLines]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Optical Frequency Comb</h1>
      <p className="text-gray-400 mb-8">Precision spectroscopy and metrology using a train of equally spaced narrow spectral lines.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Rep Rate (MHz)</span>
          <input type="number" value={repRate} onChange={e => setRepRate(+e.target.value)} step="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Center λ (nm)</span>
          <input type="number" value={centerWavelength} onChange={e => setCenterWavelength(+e.target.value)} step="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Comb Lines</span>
          <input type="number" value={combLines} onChange={e => setCombLines(+e.target.value)} step="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Line spacing: <span className="text-blue-400 font-mono">{repRate.toFixed(3)} MHz</span></p>
        <p className="text-gray-300">Center frequency: <span className="text-blue-400 font-mono">{(c / (centerWavelength * 1e-9) / 1e12).toFixed(1)} THz</span></p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: "Frequency (THz)", gridcolor: "#374151" },
        yaxis: { title: "Amplitude", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
