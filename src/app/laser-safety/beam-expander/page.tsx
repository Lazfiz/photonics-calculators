"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function BeamExpanderPage() {
  const [power, setPower] = useState(1);
  const [beamDia, setBeamDia] = useState(2);
  const [expansion, setExpansion] = useState(5);

  const outputDia = beamDia * expansion;
  const inputIrr = (power * 4) / (Math.PI * beamDia * beamDia);
  const outputIrr = (power * 4) / (Math.PI * outputDia * outputDia);
  const reduction = inputIrr / outputIrr;

  const chartData = useMemo(() => {
    const exps = Array.from({ length: 50 }, (_, i) => 1 + i * 0.5);
    const irrIn = Array(50).fill(inputIrr);
    const irrOut = exps.map(e => (power * 4) / (Math.PI * Math.pow(beamDia * e, 2)));
    return [
      { x: exps, y: irrIn, type: "scatter" as const, mode: "lines" as const, name: "Input", line: { color: "#f87171", dash: "dash" } },
      { x: exps, y: irrOut, type: "scatter" as const, mode: "lines" as const, name: "Output", line: { color: "#60a5fa" } },
    ];
  }, [power, beamDia]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/laser-safety" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Laser Safety</Link>
      <h1 className="text-3xl font-bold mb-2">Beam Expander Safety</h1>
      <p className="text-gray-400 mb-8">Calculate power density reduction from beam expansion. Critical for ensuring safe irradiance levels.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Power (W)</span>
          <input type="number" value={power} onChange={e => setPower(+e.target.value)} min={0.001} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Input Beam Diameter (mm)</span>
          <input type="number" value={beamDia} onChange={e => setBeamDia(+e.target.value)} min={0.1} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Expansion Ratio (×)</span>
          <input type="number" value={expansion} onChange={e => setExpansion(+e.target.value)} min={1} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output Diameter</p>
          <p className="text-2xl font-bold text-green-400">{outputDia.toFixed(1)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Input Irradiance</p>
          <p className="text-2xl font-bold text-red-400">{inputIrr.toFixed(2)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output Irradiance</p>
          <p className="text-2xl font-bold text-blue-400">{outputIrr.toFixed(4)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Reduction Factor</p>
          <p className="text-2xl font-bold text-yellow-400">{reduction.toFixed(1)}×</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Expansion Ratio", gridcolor: "#374151" },
          yaxis: { title: "Irradiance (W/cm²)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
