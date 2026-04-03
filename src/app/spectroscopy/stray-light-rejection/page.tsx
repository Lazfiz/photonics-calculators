"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function StrayLightRejectionPage() {
  const [strayLightRatio, setStrayLightRatio] = useState(0.001); // 0.1%
  const [absorbance, setAbsorbance] = useState(3.0);
  const [resolution, setResolution] = useState(4); // cm⁻¹
  const [filterOrder, setFilterOrder] = useState(3);
  const [gratingLines, setGratingLines] = useState(1200); // lines/mm

  const chartData = useMemo(() => {
    const absRange = Array.from({ length: 200 }, (_, i) => i * 0.05);
    const S = strayLightRatio;

    // Measured absorbance with stray light
    const measuredAbs = absRange.map(A => {
      const trueT = Math.pow(10, -A);
      const measuredT = trueT + S * (1 - trueT);
      return measuredT > 0 ? -Math.log10(measuredT) : 6;
    });

    // Photometric accuracy vs absorbance
    const accuracy = absRange.map(A => {
      const trueT = Math.pow(10, -A);
      const measuredT = trueT + S * (1 - trueT);
      return Math.abs(measuredT - trueT) / Math.max(trueT, 1e-10) * 100;
    });

    // Stray light vs grating order (higher order = better rejection)
    const orders = Array.from({ length: 6 }, (_, i) => i + 1);
    const rejectionByOrder = orders.map(o => S * Math.pow(0.1, filterOrder * (o - 1)));

    return [
      { x: absRange, y: absRange, type: "scatter" as const, mode: "lines" as const, name: "True Absorbance", line: { color: "#60a5fa" } },
      { x: absRange, y: measuredAbs, type: "scatter" as const, mode: "lines" as const, name: "Measured Absorbance", line: { color: "#f87171" } },
      { x: absRange, y: accuracy, type: "scatter" as const, mode: "lines" as const, name: "Error (%)", line: { color: "#34d399" }, xaxis: "x2", yaxis: "y2" },
    ];
  }, [strayLightRatio]);

  const S = strayLightRatio;
  const trueT = Math.pow(10, -absorbance);
  const measuredT = trueT + S * (1 - trueT);
  const measuredAbs = measuredT > 0 ? -Math.log10(measuredT) : Infinity;
  const absorbanceError = Math.abs(measuredAbs - absorbance);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Stray Light Rejection" description="Impact of stray light on photometric accuracy. Critical for high-absorbance measurements.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Stray Light Ratio</span>
          <input type="number" value={strayLightRatio} onChange={e => setStrayLightRatio(Math.max(0, +e.target.value))} min={0} step={0.0001} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">True Absorbance</span>
          <input type="number" value={absorbance} onChange={e => setAbsorbance(+e.target.value)} min={0} step={0.1} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Grating Lines (l/mm)</span>
          <input type="number" value={gratingLines} onChange={e => setGratingLines(+e.target.value)} min={50} step={100} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stray Light Level</p>
          <p className="text-xl font-bold text-yellow-400">{(strayLightRatio * 100).toFixed(3)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Measured Absorbance</p>
          <p className="text-xl font-bold text-red-400">{measuredAbs === Infinity ? "∞" : measuredAbs.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Absorbance Error</p>
          <p className="text-xl font-bold text-green-400">{absorbanceError.toFixed(4)} AU</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400 font-mono">T_measured = T_true + S·(1 − T_true)</span> — stray light adds offset to transmission.</p>
        <p><span className="text-red-400 font-mono">A_max = −log₁₀(S)</span> — stray light limits maximum measurable absorbance.</p>
        <p>S = 0.1% → A_max = 3.0. S = 0.01% → A_max = 4.0. Need &lt;0.001% for A &gt; 5.</p>
        <p>Stray light sources: grating ghosts, scatter from optics, detector crosstalk, higher-order diffraction.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        grid: { rows: 1, columns: 2, pattern: "independent" },
        xaxis: { title: "True Absorbance (AU)", gridcolor: "#374151", domain: [0, 0.47] },
        yaxis: { title: "Absorbance (AU)", gridcolor: "#374151" },
        xaxis2: { title: "True Absorbance (AU)", gridcolor: "#374151", domain: [0.53, 1] },
        yaxis2: { title: "Photometric Error (%)", gridcolor: "#374151" },
        height: 500, margin: { t: 30, b: 40 },
      }} />
    </CalculatorShell>
  );
}
