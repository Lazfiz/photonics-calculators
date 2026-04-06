"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function MacroBendPage() {
  const [wavelength, setWavelength] = useState(1550);
  const [bendRadius, setBendRadius] = useState(15);
  const [coreRadius, setCoreRadius] = useState(4.5);
  const [na, setNa] = useState(0.14);

  const loss = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const R = bendRadius * 1e-3;
    const a = coreRadius * 1e-6;
    const V = (2 * Math.PI * a / lambda) * na;
    const criticalRadius = 3 * a * Math.pow(na, 2);
    const bendLoss = 10 * Math.exp(-2 * R / criticalRadius) * Math.pow(wavelength / 1310, 2);
    return Math.max(0, bendLoss);
  }, [wavelength, bendRadius, coreRadius, na]);

  const chartData = useMemo(() => {
    const radii = Array.from({ length: 100 }, (_, i) => 5 + i * 0.5);
    return [
      { x: radii, y: radii.map(r => {
        const R = r * 1e-3;
        const a = coreRadius * 1e-6;
        const lambda = wavelength * 1e-9;
        const criticalRadius = 3 * a * Math.pow(na, 2);
        return Math.max(0, 10 * Math.exp(-2 * R / criticalRadius) * Math.pow(wavelength / 1310, 2));
      }), type: "scatter" as const, mode: "lines" as const, name: "Bend Loss", line: { color: "#f97316" } },
      { x: [bendRadius], y: [loss], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [wavelength, coreRadius, na, bendRadius, loss]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Macro Bend Loss" description="Detailed macrobending loss calculation for single-mode fibers based on bend radius and wavelength.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={800} max={2000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Bend Radius (mm)</span>
          <input type="number" value={bendRadius} onChange={e => setBendRadius(+e.target.value)} min={1} max={100}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Core Radius (µm)</span>
          <input type="number" value={coreRadius} onChange={e => setCoreRadius(+e.target.value)} min={2} max={15} step="0.1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Numerical Aperture</span>
          <input type="number" value={na} onChange={e => setNa(+e.target.value)} min={0.05} max={0.5} step="0.01"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bend Loss</p>
          <p className="text-2xl font-bold text-orange-400">{loss.toFixed(3)} dB/turn</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Critical Radius</p>
          <p className="text-2xl font-bold text-blue-400">{(3 * coreRadius * 1e-6 * Math.pow(na, 2) * 1000).toFixed(2)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">V-Number</p>
          <p className="text-2xl font-bold text-green-400">{((2 * Math.PI * coreRadius * 1e-6) / (wavelength * 1e-9) * na).toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Safety Margin</p>
          <p className={`text-2xl font-bold ${loss < 0.1 ? "text-green-400" : loss < 0.5 ? "text-yellow-400" : "text-red-400"}`}>{loss < 0.1 ? "OK" : loss < 0.5 ? "Caution" : "High"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Bend Radius (mm)", gridcolor: "#374151" },
          yaxis: { title: "Loss (dB/turn)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
