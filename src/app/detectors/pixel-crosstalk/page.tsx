"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function PixelCrosstalkPage() {
  const [pixelSize, setPixelSize] = useState(6.5);
  const [diffusionLength, setDiffusionLength] = useState(5);
  const [absorptionDepth, setAbsorptionDepth] = useState(3);
  const [backIlluminated, setBackIlluminated] = useState(false);

  const effectiveDepth = backIlluminated ? absorptionDepth * 1.5 : absorptionDepth;
  const crosstalk = Math.exp(-pixelSize / diffusionLength) * (1 - Math.exp(-effectiveDepth / diffusionLength));
  const mtfAtNyquist = 1 / (1 + crosstalk);
  const chargeSpread = diffusionLength * (1 - Math.exp(-effectiveDepth / diffusionLength));

  const chartData = useMemo(() => {
    const depths = Array.from({ length: 100 }, (_, i) => 0.5 + i * 0.2);
    return [
      { x: depths, y: depths.map(d => Math.exp(-pixelSize / diffusionLength) * (1 - Math.exp(-d / diffusionLength))), type: "scatter" as const, mode: "lines" as const, name: "Crosstalk", line: { color: "#f87171" } },
      { x: [effectiveDepth], y: [crosstalk], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#60a5fa", size: 12 } },
    ];
  }, [pixelSize, diffusionLength, effectiveDepth, crosstalk]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Pixel Crosstalk Calculator</h1>
      <p className="text-gray-400 mb-8">Model charge diffusion crosstalk between adjacent pixels based on carrier diffusion length.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Pixel Size (µm)</span>
          <input type="number" value={pixelSize} onChange={e => setPixelSize(+e.target.value)} min={1} max={50} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Diffusion Length (µm)</span>
          <input type="number" value={diffusionLength} onChange={e => setDiffusionLength(+e.target.value)} min={0.1} max={50} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Absorption Depth (µm)</span>
          <input type="number" value={absorptionDepth} onChange={e => setAbsorptionDepth(+e.target.value)} min={0.1} max={100} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Back Illuminated</span>
          <select value={backIlluminated ? "yes" : "no"} onChange={e => setBackIlluminated(e.target.value === "yes")}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="no">Front</option>
            <option value="yes">Back</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Crosstalk</p>
          <p className="text-2xl font-bold text-red-400">{(crosstalk * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">MTF at Nyquist</p>
          <p className="text-2xl font-bold text-blue-400">{(mtfAtNyquist * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Charge Spread</p>
          <p className="text-2xl font-bold text-green-400">{chargeSpread.toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Illumination</p>
          <p className="text-2xl font-bold text-yellow-400">{backIlluminated ? "Back" : "Front"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Absorption Depth (µm)", gridcolor: "#374151" },
          yaxis: { title: "Crosstalk (%)", gridcolor: "#374151", tickformat: ".1%" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
