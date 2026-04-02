"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ConcMirrorPage() {
  const [radius, setRadius] = useState(50);
  const [wavelength, setWavelength] = useState(600);
  const [mirrorDiam, setMirrorDiam] = useState(25);
  const [slitWidth, setSlitWidth] = useState(50); // µm

  const finesse = Math.PI * Math.sqrt(Math.max(0, 0.99)) / (1 - 0.99);
  const resolvingPower = finesse * (2 * radius) / slitWidth;
  const throughput = Math.min(1, Math.pow(mirrorDiam / 2, 2) / Math.pow(radius * wavelength * 1e-6 / (2 * slitWidth * 1e-6), 2));
  const etendue = slitWidth * 1e-6 * mirrorDiam * 1e-3 * 1e-6; // simplified
  const throughputAdvantage = resolvingPower / (mirrorDiam / slitWidth); // Connes advantage factor

  const chartData = useMemo(() => {
    const radii = Array.from({ length: 50 }, (_, i) => 10 + i * 4);
    return [
      { x: radii, y: radii.map(r => (finesse * 2 * r) / slitWidth / 1000), type: "scatter" as const, mode: "lines" as const, name: "Resolving Power (k)", line: { color: "#c084fc" } },
      { x: [radius], y: [resolvingPower / 1000], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [radius, slitWidth, resolvingPower]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Concave Mirror Throughput</h1>
      <p className="text-gray-400 mb-8">Connes advantage and throughput for concave mirror-based spectrometers (e.g., FTIR, concave grating).</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Mirror Radius (mm)</span>
          <input type="number" value={radius} onChange={e => setRadius(+e.target.value)} min={5} max={500}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={100} max={50000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Mirror Diameter (mm)</span>
          <input type="number" value={mirrorDiam} onChange={e => setMirrorDiam(+e.target.value)} min={5} max={200}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Slit Width (µm)</span>
          <input type="number" value={slitWidth} onChange={e => setSlitWidth(+e.target.value)} min={1} max={500}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Resolving Power</p>
          <p className="text-2xl font-bold text-purple-400">{(resolvingPower / 1000).toFixed(1)}k</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Finesse</p>
          <p className="text-2xl font-bold text-blue-400">{finesse.toFixed(0)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Étendue (a.u.)</p>
          <p className="text-2xl font-bold text-green-400">{etendue.toExponential(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Connes Advantage</p>
          <p className="text-2xl font-bold text-yellow-400">{throughputAdvantage.toFixed(1)}×</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Mirror Radius (mm)", gridcolor: "#374151" },
          yaxis: { title: "Resolving Power (×10³)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
