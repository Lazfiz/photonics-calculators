"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ResponsivityPage() {
  const [quantumEfficiency, setQuantumEfficiency] = useState(0.8);
  const [wavelength, setWavelength] = useState(1550);

  const q = 1.602e-19, h = 6.626e-34, c = 3e8;
  const responsivity = (quantumEfficiency * q * wavelength * 1e-9) / (h * c);
  const photonsPerWatt = (wavelength * 1e-9) / (h * c);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 300 + i * 7);
    const R = wls.map(wl => (quantumEfficiency * q * wl * 1e-9) / (h * c));
    return [{ x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Responsivity", line: { color: "#60a5fa" } }];
  }, [quantumEfficiency]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Photodetector Responsivity</h1>
      <p className="text-gray-400 mb-8">Responsivity from quantum efficiency and wavelength. R = ηqλ/(hc).</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Quantum Efficiency (0–1)</span>
          <input type="number" value={quantumEfficiency} onChange={e => setQuantumEfficiency(+e.target.value)} step="0.01" min={0} max={1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Responsivity</p>
          <p className="text-xl font-bold text-blue-400">{responsivity.toFixed(3)} A/W</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Photons/W</p>
          <p className="text-xl font-bold text-green-400">{photonsPerWatt.toExponential(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Current @ 1 mW</p>
          <p className="text-xl font-bold text-orange-400">{(responsivity * 1e-3 * 1e6).toFixed(2)} µA</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Responsivity (A/W)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
