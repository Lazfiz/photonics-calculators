"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ExtinctionCoefficientPage() {
  const [absorbance, setAbsorbance] = useState(0.5);
  const [concentration, setConcentration] = useState(0.01);
  const [pathLength, setPathLength] = useState(1);
  const [molecularWeight, setMolecularWeight] = useState(100);

  const extinctionCoeff = absorbance / (concentration * pathLength); // L·mol⁻¹·cm⁻¹
  const molarExtCoeff = extinctionCoeff;
  const specificExtCoeff = extinctionCoeff / molecularWeight; // L·g⁻¹·cm⁻¹
  const transmittance = Math.pow(10, -absorbance) * 100;

  // Concentration plot at fixed ε for absorbance vs concentration
  const chartData = useMemo(() => {
    const cs = Array.from({ length: 200 }, (_, i) => (i / 200) * concentration * 5);
    const absLine = cs.map(c => extinctionCoeff * c * pathLength);
    const transLine = absLine.map(a => Math.pow(10, -a) * 100);

    return [
      { x: cs, y: absLine, type: "scatter" as const, mode: "lines" as const, name: "Absorbance", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: cs, y: transLine, type: "scatter" as const, mode: "lines" as const, name: "Transmission (%)", line: { color: "#34d399" }, yaxis: "y2" },
      { x: [concentration], y: [absorbance], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [concentration, pathLength, absorbance, extinctionCoeff]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Extinction Coefficient</h1>
      <p className="text-gray-400 mb-8">Calculate molar and specific extinction coefficients from absorbance measurements. Beer-Lambert law: ε = A / (c·l).</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Absorbance (A)</span>
          <input type="number" value={absorbance} onChange={e => setAbsorbance(+e.target.value)} min={0} step={0.01}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
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
          <span className="text-gray-300 text-sm">Molecular Weight (g/mol)</span>
          <input type="number" value={molecularWeight} onChange={e => setMolecularWeight(+e.target.value)} min={1} step={1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Molar ε</p>
          <p className="text-xl font-bold text-blue-400">{molarExtCoeff.toFixed(1)} <span className="text-sm text-gray-400">L·mol⁻¹·cm⁻¹</span></p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Specific ε</p>
          <p className="text-xl font-bold text-green-400">{specificExtCoeff.toFixed(3)} <span className="text-sm text-gray-400">L·g⁻¹·cm⁻¹</span></p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmittance</p>
          <p className="text-xl font-bold text-orange-400">{transmittance.toFixed(2)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm"><span className="text-blue-400 font-mono">ε = A / (c · l)</span></p>
        <p className="text-gray-300 text-sm"><span className="text-green-400 font-mono">ε_specific = ε_molar / MW</span></p>
        <p className="text-gray-300 text-sm"><span className="text-orange-400 font-mono">T = 10^(−A)</span></p>
        <p className="text-gray-300 text-sm mt-1">Typical ranges: dyes ε ~ 10⁴–10⁵, proteins (A₂₈₀) ε ~ 10⁴–10⁵ L·mol⁻¹·cm⁻¹</p>
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
