"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function ConcentrationPage() {
  const [absorbance, setAbsorbance] = useState(0.5);
  const [pathLength, setPathLength] = useState(1);
  const [extinctionCoeff, setExtinctionCoeff] = useState(50000);
  const [cMax, setCMax] = useState(0.05);

  const concentration = absorbance / (extinctionCoeff * pathLength);
  const molarity = concentration;
  const ppm = concentration * 1000;
  const transmission = Math.pow(10, -absorbance);

  const chartData = useMemo(() => {
    const cs = Array.from({ length: 200 }, (_, i) => (i / 200) * cMax);
    const abs = cs.map(c => extinctionCoeff * c * pathLength);
    return [
      { x: cs, y: abs, type: "scatter" as const, mode: "lines" as const, name: "A vs c", line: { color: "#60a5fa" } },
      { x: [concentration], y: [absorbance], type: "scatter" as const, mode: "markers" as const, name: "Measured", marker: { color: "#f87171", size: 12 } },
    ];
  }, [absorbance, pathLength, extinctionCoeff, cMax, concentration]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Concentration from Absorbance" description="c = A / (ε·l) — determine concentration from measured absorbance using Beer-Lambert law.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Absorbance (A)</span>
          <input type="number" value={absorbance} onChange={e => setAbsorbance(Math.max(0, +e.target.value))} min={0} step={0.01}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Path Length (cm)</span>
          <input type="number" value={pathLength} onChange={e => setPathLength(Math.max(0.001, +e.target.value))} min={0.001} step={0.1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">ε (L·mol⁻¹·cm⁻¹)</span>
          <input type="number" value={extinctionCoeff} onChange={e => setExtinctionCoeff(+e.target.value)} min={1} step={1000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Plot c max (mol/L)</span>
          <input type="number" value={cMax} onChange={e => setCMax(+e.target.value)} min={0.001} step={0.01}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Concentration</p>
          <p className="text-xl font-bold text-blue-400">{concentration.toExponential(3)} mol/L</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Molarity</p>
          <p className="text-xl font-bold text-green-400">{molarity.toExponential(3)} M</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">≈ mmol/L</p>
          <p className="text-xl font-bold text-purple-400">{(concentration * 1000).toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmission</p>
          <p className="text-xl font-bold text-orange-400">{(transmission * 100).toFixed(2)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono text-blue-400">c = A / (ε · l)</p>
        <p className="text-gray-300 text-sm font-mono text-green-400">Valid range: 0.1 &lt; A &lt; 2.0 (linear region)</p>
        <p className="text-gray-500 text-xs mt-2">Requires known ε at measurement wavelength. Deviations from linearity occur at A &gt; 2 due to stray light and detector saturation.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Concentration (mol/L)", gridcolor: "#1f2937" },
          yaxis: { title: "Absorbance", gridcolor: "#1f2937" },
          margin: { t: 30 },
        }} />
      </div>
    </CalculatorShell>
  );
}
