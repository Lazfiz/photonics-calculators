"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ConfocalResolutionPage() {
  const [wavelength, setWavelength] = useState(550);
  const [na, setNa] = useState(1.4);
  const [pinholeAU, setPinholeAU] = useState(1.0);
  const [refractiveIndex, setRefractiveIndex] = useState(1.518);

  // Lateral resolution (confocal ~0.4× widefield)
  const widefieldLateral = 0.61 * wavelength / na;
  const confocalLateral = 0.4 * wavelength / na;

  // Axial resolution
  const widefieldAxial = 2 * refractiveIndex * wavelength / (na * na);
  const confocalAxial = 1.4 * refractiveIndex * wavelength / (na * na);

  // Pinhole size in µm
  const airyRadiusUm = 0.61 * wavelength / (na * 1000);
  const pinholeUm = pinholeAU * airyRadiusUm;

  const chartData = useMemo(() => {
    const nas = Array.from({ length: 80 }, (_, i) => 0.2 + i * 0.016);
    return [
      { x: nas, y: nas.map(n => 0.61 * wavelength / n), type: "scatter", mode: "lines", name: "Widefield Lateral", line: { color: "#60a5fa" } },
      { x: nas, y: nas.map(n => 0.4 * wavelength / n), type: "scatter", mode: "lines", name: "Confocal Lateral", line: { color: "#34d399" } },
      { x: nas, y: nas.map(n => 2 * refractiveIndex * wavelength / (n * n)), type: "scatter", mode: "lines", name: "Widefield Axial", line: { color: "#f87171", dash: "dash" } },
      { x: nas, y: nas.map(n => 1.4 * refractiveIndex * wavelength / (n * n)), type: "scatter", mode: "lines", name: "Confocal Axial", line: { color: "#fbbf24", dash: "dash" } },
      { x: [na], y: [confocalLateral], type: "scatter", mode: "markers", name: "Current Lateral", marker: { color: "#34d399", size: 12 } },
      { x: [na], y: [confocalAxial], type: "scatter", mode: "markers", name: "Current Axial", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [wavelength, na, refractiveIndex, confocalLateral, confocalAxial]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Confocal Resolution Calculator</h1>
      <p className="text-gray-400 mb-8">Compare lateral and axial resolution between widefield and confocal microscopy with adjustable pinhole size.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={300} max={2000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Numerical Aperture</span>
          <input type="number" value={na} onChange={e => setNa(+e.target.value)} min={0.1} max={1.7} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Pinhole (Airy units)</span>
          <input type="number" value={pinholeAU} onChange={e => setPinholeAU(+e.target.value)} min={0.1} max={5} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Refractive Index</span>
          <input type="number" value={refractiveIndex} onChange={e => setRefractiveIndex(+e.target.value)} min={1.0} max={1.8} step="0.001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Confocal Lateral</p>
          <p className="text-2xl font-bold text-green-400">{confocalLateral.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Confocal Axial</p>
          <p className="text-2xl font-bold text-yellow-400">{confocalAxial.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Widefield Lateral</p>
          <p className="text-2xl font-bold text-blue-400">{widefieldLateral.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pinhole Diameter</p>
          <p className="text-2xl font-bold text-purple-400">{pinholeUm.toFixed(2)} µm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <p className="text-gray-400 text-sm">Lateral: <code className="text-green-400">d<sub>lat</sub> = 0.4λ / NA</code> (confocal), <code className="text-blue-400">d<sub>lat</sub> = 0.61λ / NA</code> (widefield)</p>
        <p className="text-gray-400 text-sm">Axial: <code className="text-yellow-400">d<sub>ax</sub> = 1.4nλ / NA²</code> (confocal), <code className="text-red-400">d<sub>ax</sub> = 2nλ / NA²</code> (widefield)</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "NA", gridcolor: "#374151" },
          yaxis: { title: "Resolution (nm)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
