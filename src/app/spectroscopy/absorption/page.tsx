"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function AbsorptionPage() {
  const [concentration, setConcentration] = useState(0.01);
  const [pathLength, setPathLength] = useState(1);
  const [extinctionCoeff, setExtinctionCoeff] = useState(50000);
  const [cMax, setCMax] = useState(0.05);

  const chartData = useMemo(() => {
    const cs = Array.from({ length: 200 }, (_, i) => (i / 200) * cMax);
    const abs = cs.map(c => extinctionCoeff * c * pathLength);
    const trans = abs.map(a => Math.pow(10, -a));

    return [
      { x: cs, y: abs, type: "scatter" as const, mode: "lines" as const, name: "Absorbance", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: cs, y: trans.map(t => t * 100), type: "scatter" as const, mode: "lines" as const, name: "Transmission %", line: { color: "#34d399" }, yaxis: "y2" },
      { x: [concentration], y: [extinctionCoeff * concentration * pathLength], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [concentration, pathLength, extinctionCoeff, cMax]);

  const absorbance = extinctionCoeff * concentration * pathLength;
  const transmission = Math.pow(10, -absorbance);
  const od = absorbance;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Beer-Lambert Absorption</h1>
      <p className="text-gray-400 mb-8">A = ε·c·l — absorbance from molar extinction coefficient, concentration, and path length.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Concentration (mol/L)</span>
          <input type="number" value={concentration} onChange={e => setConcentration(+e.target.value)} min={0} step={0.001}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Path Length (cm)</span>
          <input type="number" value={pathLength} onChange={e => setPathLength(Math.max(0.001, +e.target.value))} min={0.001} step={0.1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">ε (L·mol⁻¹·cm⁻¹)</span>
          <input type="number" value={extinctionCoeff} onChange={e => setExtinctionCoeff(+e.target.value)} min={0} step={100}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Max Conc. for Plot (mol/L)</span>
          <input type="number" value={cMax} onChange={e => setCMax(+e.target.value)} min={0.001} step={0.01}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Absorbance (A)</p>
          <p className="text-xl font-bold text-blue-400">{absorbance.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Optical Density (OD)</p>
          <p className="text-xl font-bold text-green-400">{od.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmission</p>
          <p className="text-xl font-bold text-orange-400">{(transmission * 100).toFixed(2)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm"><span className="text-blue-400 font-mono">A = ε · c · l</span></p>
        <p className="text-gray-300 text-sm"><span className="text-green-400 font-mono">T = 10^(−A) = 10^(−εcl)</span></p>
        <p className="text-gray-300 text-sm">Linear range: A &lt; ~2.0 (T &gt; 1%). Deviations at high concentration.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Concentration (mol/L)", gridcolor: "#374151" },
          yaxis: { title: "Absorbance", gridcolor: "#374151", side: "left" },
          yaxis2: { title: "Transmission (%)", gridcolor: "#374151", side: "right", overlaying: "y", range: [0, 105] },
          margin: { t: 30, r: 60, b: 50, l: 70 }, legend: { x: 0.01, y: 0.99 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
