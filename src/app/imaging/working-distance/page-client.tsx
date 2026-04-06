"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function WorkingDistancePage() {
  const [focalLength, setFocalLength] = useURLState("focalLength", 10);
  const [mag, setMag] = useURLState("mag", 20);

  const wd = focalLength * (1 + 1 / mag);

  const chartData = useMemo(() => {
    const mags = Array.from({ length: 100 }, (_, i) => 1 + i * 0.5);
    const wds = mags.map(m => focalLength * (1 + 1 / m));
    return [
      { x: mags, y: wds, type: "scatter" as const, mode: "lines" as const, name: "Working Distance", line: { color: "#34d399" } },
      { x: [mag], y: [wd], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [focalLength, mag, wd]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Working Distance Calculator" description="Calculate working distance from objective focal length and magnification.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Objective Focal Length (mm)" value={focalLength} onChange={setFocalLength} min={1} step="any" />
        <ValidatedNumberInput label="Magnification (×)" value={mag} onChange={setMag} min={0.5} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Working Distance</p>
          <p className="text-3xl font-bold text-green-400">{wd.toFixed(2)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Image Distance</p>
          <p className="text-3xl font-bold text-blue-400">{(focalLength * (1 + mag)).toFixed(2)} mm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Magnification (×)", gridcolor: "#374151" },
          yaxis: { title: "Working Distance (mm)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
