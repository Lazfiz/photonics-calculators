"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function MagnificationPage() {
  const [objFocal, setObjFocal] = useURLState("objFocal", 10);
  const [tubeFocal, setTubeFocal] = useURLState("tubeFocal", 200);
  const [camFocal, setCamFocal] = useURLState("camFocal", 50);

  const objMag = tubeFocal / objFocal;
  const camMag = 250 / camFocal; // standard near point
  const totalMag = objMag * camMag;

  const chartData = useMemo(() => {
    const objs = Array.from({ length: 50 }, (_, i) => 2 + i * 1);
    const totalMags = objs.map(f => (tubeFocal / f) * (250 / camFocal));
    return [
      { x: objs, y: totalMags, type: "scatter" as const, mode: "lines" as const, name: "Total Mag", line: { color: "#60a5fa" } },
      { x: [objFocal], y: [totalMag], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [tubeFocal, camFocal, objFocal, totalMag]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Total Magnification Calculator" description="Calculate total system magnification from objective, tube lens, and camera adapter lens.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Objective Focal Length (mm)" value={objFocal} onChange={setObjFocal} min={1} step="any" />
        <ValidatedNumberInput label="Tube Lens Focal Length (mm)" value={tubeFocal} onChange={setTubeFocal} min={50} step="any" />
        <ValidatedNumberInput label="Camera Adapter Focal Length (mm)" value={camFocal} onChange={setCamFocal} min={10} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Objective Magnification</p>
          <p className="text-2xl font-bold text-blue-400">{objMag.toFixed(1)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Camera Adapter</p>
          <p className="text-2xl font-bold text-green-400">{camMag.toFixed(2)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Magnification</p>
          <p className="text-2xl font-bold text-yellow-400">{totalMag.toFixed(1)}×</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Objective Focal Length (mm)", gridcolor: "#374151" },
          yaxis: { title: "Total Magnification (×)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
