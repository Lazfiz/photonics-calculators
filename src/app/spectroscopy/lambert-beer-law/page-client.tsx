"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";

const currentHref = "/spectroscopy/lambert-beer-law";

export default function LambertBeerLawPage() {
  const [concentration, setConcentration] = useState(0.01);
  const [pathLength, setPathLength] = useState(1);
  const [extinctionCoeff, setExtinctionCoeff] = useState(50000);
  const [plotVar, setPlotVar] = useState<"conc" | "path" | "epsilon">("conc");

  const absorbance = extinctionCoeff * concentration * pathLength;
  const transmission = Math.pow(10, -absorbance);
  const od = absorbance;

  const series = useMemo(() => {
    const n = 200;
    let xs: number[], ys1: number[];
    if (plotVar === "conc") {
      const cMax = concentration * 5 || 0.05;
      xs = Array.from({ length: n }, (_, i) => (i / n) * cMax);
      ys1 = xs.map((c) => extinctionCoeff * c * pathLength);
    } else if (plotVar === "path") {
      const pMax = Math.max(pathLength * 5, 5);
      xs = Array.from({ length: n }, (_, i) => (i / n) * pMax);
      ys1 = xs.map((l) => extinctionCoeff * concentration * l);
    } else {
      const eMax = Math.max(extinctionCoeff * 2, 100000);
      xs = Array.from({ length: n }, (_, i) => (i / n) * eMax);
      ys1 = xs.map((e) => e * concentration * pathLength);
    }
    return [
      { name: "Absorbance", color: "#60a5fa", points: xs.map((x, i) => ({ x, y: ys1[i] })) },
      { name: "Transmission %", color: "#34d399", dashed: true, points: xs.map((x, i) => ({ x, y: Math.pow(10, -ys1[i]) * 100 })) },
    ];
  }, [concentration, pathLength, extinctionCoeff, plotVar]);

  const xLabel = plotVar === "conc" ? "Concentration (mol/L)" : plotVar === "path" ? "Path Length (cm)" : "ε (L·mol⁻¹·cm⁻¹)";

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Lambert-Beer Law Calculator" description="Comprehensive Beer-Lambert law analysis — A = ε·c·l with interactive parameter sweeps.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Concentration (mol/L)</span>
          <input type="number" value={concentration} onChange={e => setConcentration(+e.target.value)} min={0} step={0.001} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Path Length (cm)</span>
          <input type="number" value={pathLength} onChange={e => setPathLength(Math.max(0.001, +e.target.value))} min={0.001} step={0.1} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">ε (L·mol⁻¹·cm⁻¹)</span>
          <input type="number" value={extinctionCoeff} onChange={e => setExtinctionCoeff(+e.target.value)} min={0} step={1000} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["conc", "path", "epsilon"] as const).map((v) => (
          <button key={v} onClick={() => setPlotVar(v)} className={`px-3 py-1 rounded text-sm ${plotVar === v ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}>
            {v === "conc" ? "Sweep Concentration" : v === "path" ? "Sweep Path Length" : "Sweep ε"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Absorbance (A)" value={absorbance.toFixed(4)} tone="blue" />
        <ResultCard label="Optical Density (OD)" value={od.toFixed(4)} tone="green" />
        <ResultCard label="Transmission" value={`${(transmission * 100).toFixed(2)}%`} tone="yellow" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">A = ε · c · l</p>
        <p className="font-mono text-green-400">T = 10⁻ᴬ</p>
        <p className="font-mono text-purple-400">OD = A = −log₁₀(T)</p>
        <p className="text-gray-500 text-xs mt-2">Lambert: intensity decreases exponentially with path length. Beer: proportional to concentration.</p>
      </div>

      <SimpleLineChart title="Beer-Lambert sweep" xLabel={xLabel} yLabel="Value" yScale="log" series={series} />

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
