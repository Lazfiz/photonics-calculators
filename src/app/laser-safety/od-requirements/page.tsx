"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ODRequirementsPage() {
  const [power, setPower] = useState(500); // mW
  const [beamDiameter, setBeamDiameter] = useState(2); // mm
  const [mpe, setMpe] = useState(1.0); // mW/cm²

  const beamArea = useMemo(() => Math.PI * Math.pow(beamDiameter / 10 / 2, 2), [beamDiameter]); // cm²
  const irradiance = useMemo(() => power / 1000 / beamArea, [power, beamArea]); // W/cm²
  const requiredOD = useMemo(() => {
    if (irradiance <= 0 || mpe <= 0) return 0;
    return Math.max(0, Math.log10(irradiance / (mpe / 1000)));
  }, [irradiance, mpe]);

  const transmittedPower = useMemo(() => {
    const transmission = Math.pow(10, -requiredOD);
    return power * transmission;
  }, [power, requiredOD]);

  const chartData = useMemo(() => {
    const ods = Array.from({ length: 100 }, (_, i) => i * 0.1);
    return [
      {
        x: ods, y: ods.map(od => power / 1000 * Math.pow(10, -od)),
        type: "scatter" as const, mode: "lines" as const, name: "Transmitted Power",
        line: { color: "#60a5fa" }
      },
      {
        x: ods, y: ods.map(() => mpe / 1000),
        type: "scatter" as const, mode: "lines" as const, name: "MPE",
        line: { color: "#f87171", dash: "dash" }
      }
    ];
  }, [power, mpe]);

  const odRecommendations = [
    { od: 2, label: "OD2", desc: "Low-power visible lasers" },
    { od: 3, label: "OD3", desc: "Class 3B visible" },
    { od: 5, label: "OD5", desc: "Class 3B/4 IR" },
    { od: 7, label: "OD7+", desc: "High-power Class 4" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/laser-safety" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Laser Safety</Link>
      <h1 className="text-3xl font-bold mb-2">Optical Density (OD) Requirements</h1>
      <p className="text-gray-400 mb-8">Calculate required eyewear OD given beam power, diameter, and MPE. OD = log₁₀(H/MPE).</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Beam Power (mW)</span>
          <input type="number" value={power} onChange={e => setPower(+e.target.value)} min={0.001} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Beam Diameter (mm)</span>
          <input type="number" value={beamDiameter} onChange={e => setBeamDiameter(+e.target.value)} min={0.01} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">MPE (mW/cm²)</span>
          <input type="number" value={mpe} onChange={e => setMpe(+e.target.value)} min={0.0001} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Beam Irradiance</p>
          <p className="text-2xl font-bold text-yellow-400">{irradiance.toFixed(2)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Required OD</p>
          <p className="text-2xl font-bold text-blue-400">OD {requiredOD.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmitted (at required OD)</p>
          <p className="text-2xl font-bold text-green-400">{transmittedPower < 0.001 ? transmittedPower.toExponential(2) : transmittedPower.toFixed(4)} mW</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">OD Reference Guide</h3>
        <div className="space-y-2">
          {odRecommendations.map(r => (
            <div key={r.od} className="flex justify-between text-sm">
              <span className="text-gray-400">{r.label}</span>
              <span className="text-gray-500">{r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Optical Density", gridcolor: "#374151" },
          yaxis: { title: "Transmitted Power (W)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
