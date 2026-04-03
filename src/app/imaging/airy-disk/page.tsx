"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function AiryDiskPage() {
  const [wavelength, setWavelength] = useState(550);
  const [na, setNa] = useState(0.95);

  const airyRadius = 0.61 * (wavelength / 1000) / (2 * na); // mm (rayleigh criterion)
  const airyDiameter = 2 * airyRadius;
  const airyRadiusUm = airyRadius * 1000;
  const resolutionNm = (wavelength / (2 * na)); // Abbe limit

  const chartData = useMemo(() => {
    const nas = Array.from({ length: 100 }, (_, i) => 0.1 + i * 0.015);
    return [
      { x: nas, y: nas.map(n => (0.61 * (wavelength / 1000) / (2 * n)) * 1000), type: "scatter" as const, mode: "lines" as const, name: "Airy Radius", line: { color: "#60a5fa" } },
      { x: nas, y: nas.map(n => wavelength / (2 * n)), type: "scatter" as const, mode: "lines" as const, name: "Abbe Limit", line: { color: "#34d399", dash: "dash" } },
      { x: [na], y: [airyRadiusUm], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [wavelength, na, airyRadiusUm]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Airy Disk Size Calculator" description="Calculate the Airy disk radius and Abbe diffraction limit based on wavelength and numerical aperture.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={300} max={2000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Numerical Aperture (NA)</span>
          <input type="number" value={na} onChange={e => setNa(+e.target.value)} min={0.1} max={1.5} step="0.01"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Airy Radius</p>
          <p className="text-2xl font-bold text-blue-400">{airyRadiusUm.toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Airy Diameter</p>
          <p className="text-2xl font-bold text-green-400">{(airyDiameter * 1000).toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Abbe Limit</p>
          <p className="text-2xl font-bold text-yellow-400">{resolutionNm.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Resolution (lp/mm)</p>
          <p className="text-2xl font-bold text-purple-400">{(1000 / airyDiameter).toFixed(0)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "NA", gridcolor: "#374151" },
          yaxis: { title: "Size (µm)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
