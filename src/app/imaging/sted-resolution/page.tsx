"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function STEDResolutionPage() {
  const [wavelength, setWavelength] = useState(640);
  const [na, setNa] = useState(1.4);
  const [depletionWavelength, setDepletionWavelength] = useState(775);
  const [saturationFactor, setSaturationFactor] = useState(30);

  // Confocal resolution
  const confocalRes = 0.4 * wavelength / na;

  // STED resolution: d_STED = d_conf / sqrt(1 + I_dep / I_sat)
  const stedRes = confocalRes / Math.sqrt(1 + saturationFactor);

  // Donut zero intensity at center
  const improvementFactor = Math.sqrt(1 + saturationFactor);

  const chartData = useMemo(() => {
    const sats = Array.from({ length: 100 }, (_, i) => 1 + i * 1.5);
    return [
      { x: sats, y: sats.map(s => confocalRes / Math.sqrt(1 + s)), type: "scatter", mode: "lines", name: "STED Resolution", line: { color: "#34d399" } },
      { x: [saturationFactor], y: [stedRes], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
      { x: [sats[0], sats[sats.length - 1]], y: [confocalRes, confocalRes], type: "scatter", mode: "lines", name: "Confocal Limit", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [confocalRes, stedRes, saturationFactor]);

  const wavelengthData = useMemo(() => {
    const wls = Array.from({ length: 60 }, (_, i) => 400 + i * 10);
    return [
      { x: wls, y: wls.map(w => 0.4 * w / na), type: "scatter", mode: "lines", name: "Confocal", line: { color: "#60a5fa" } },
      { x: wls, y: wls.map(w => 0.4 * w / na / Math.sqrt(1 + saturationFactor)), type: "scatter", mode: "lines", name: "STED", line: { color: "#34d399" } },
    ];
  }, [na, saturationFactor]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">STED Super-Resolution Calculator</h1>
      <p className="text-gray-400 mb-8">Calculate STED (Stimulated Emission Depletion) microscopy resolution based on saturation intensity and depletion parameters.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Excitation λ (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={400} max={800}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Numerical Aperture</span>
          <input type="number" value={na} onChange={e => setNa(+e.target.value)} min={0.5} max={1.7} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Depletion λ (nm)</span>
          <input type="number" value={depletionWavelength} onChange={e => setDepletionWavelength(+e.target.value)} min={500} max={900}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">I<sub>dep</sub> / I<sub>sat</sub></span>
          <input type="number" value={saturationFactor} onChange={e => setSaturationFactor(+e.target.value)} min={1} max={200}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Confocal Resolution</p>
          <p className="text-2xl font-bold text-blue-400">{confocalRes.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">STED Resolution</p>
          <p className="text-2xl font-bold text-green-400">{stedRes.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Improvement Factor</p>
          <p className="text-2xl font-bold text-yellow-400">{improvementFactor.toFixed(1)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Depletion Shift</p>
          <p className="text-2xl font-bold text-purple-400">+{depletionWavelength - wavelength} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <p className="text-gray-400 text-sm"><code className="text-blue-400">d<sub>conf</sub> = 0.4λ / NA</code></p>
        <p className="text-gray-400 text-sm"><code className="text-green-400">d<sub>STED</sub> = d<sub>conf</sub> / √(1 + I<sub>dep</sub>/I<sub>sat</sub>)</code></p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <Plot data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "I_dep / I_sat", gridcolor: "#374151" },
            yaxis: { title: "Resolution (nm)", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <Plot data={wavelengthData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Excitation λ (nm)", gridcolor: "#374151" },
            yaxis: { title: "Resolution (nm)", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>
    </div>
  );
}
