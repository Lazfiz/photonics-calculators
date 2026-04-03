"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function LambertBeerLawPage() {
  const [concentration, setConcentration] = useState(0.01);
  const [pathLength, setPathLength] = useState(1);
  const [extinctionCoeff, setExtinctionCoeff] = useState(50000);
  const [plotVar, setPlotVar] = useState<"conc" | "path" | "epsilon">("conc");

  const chartData = useMemo(() => {
    const n = 200;
    let xs: number[], ys: number[], xLabel: string;

    if (plotVar === "conc") {
      const cMax = concentration * 5 || 0.05;
      xs = Array.from({ length: n }, (_, i) => (i / n) * cMax);
      ys = xs.map(c => extinctionCoeff * c * pathLength);
      xLabel = "Concentration (mol/L)";
    } else if (plotVar === "path") {
      const pMax = Math.max(pathLength * 5, 5);
      xs = Array.from({ length: n }, (_, i) => (i / n) * pMax);
      ys = xs.map(l => extinctionCoeff * concentration * l);
      xLabel = "Path Length (cm)";
    } else {
      const eMax = Math.max(extinctionCoeff * 2, 100000);
      xs = Array.from({ length: n }, (_, i) => (i / n) * eMax);
      ys = xs.map(e => e * concentration * pathLength);
      xLabel = "ε (L·mol⁻¹·cm⁻¹)";
    }

    return [
      { x: xs, y: ys, type: "scatter" as const, mode: "lines" as const, name: "Absorbance", line: { color: "#60a5fa" } },
      { x: xs, y: ys.map(a => Math.pow(10, -a) * 100), type: "scatter" as const, mode: "lines" as const, name: "Transmission %", line: { color: "#34d399" }, yaxis: "y2" },
    ];
  }, [concentration, pathLength, extinctionCoeff, plotVar]);

  const absorbance = extinctionCoeff * concentration * pathLength;
  const transmission = Math.pow(10, -absorbance);
  const od = absorbance;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Lambert-Beer Law Calculator</h1>
      <p className="text-gray-400 mb-8">Comprehensive Beer-Lambert law analysis — A = ε·c·l with interactive parameter sweeps.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
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
          <input type="number" value={extinctionCoeff} onChange={e => setExtinctionCoeff(+e.target.value)} min={0} step={1000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="flex gap-2 mb-6">
        {(["conc", "path", "epsilon"] as const).map(v => (
          <button key={v} onClick={() => setPlotVar(v)}
            className={`px-3 py-1 rounded text-sm ${plotVar === v ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}>
            {v === "conc" ? "Sweep Concentration" : v === "path" ? "Sweep Path Length" : "Sweep ε"}
          </button>
        ))}
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
        <p className="text-gray-300 text-sm font-mono text-blue-400">A = ε · c · l</p>
        <p className="text-gray-300 text-sm font-mono text-green-400">T = 10⁻ᴬ</p>
        <p className="text-gray-300 text-sm font-mono text-purple-400">OD = A = −log₁₀(T)</p>
        <p className="text-gray-500 text-xs mt-2">Lambert: intensity decreases exponentially with path length. Beer: proportional to concentration.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot
          data={chartData}
          layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: plotVar === "conc" ? "Concentration (mol/L)" : plotVar === "path" ? "Path Length (cm)" : "ε (L·mol⁻¹·cm⁻¹)", gridcolor: "#1f2937" },
            yaxis: { title: "Absorbance", gridcolor: "#1f2937" },
            yaxis2: { title: "Transmission %", overlaying: "y", side: "right", gridcolor: "#1f2937", range: [0, 100] },
            legend: { orientation: "h", y: 1.15 },
            margin: { t: 40 },
          }}
          config={{ responsive: true }}
        />
      </div>
    </div>
  );
}
