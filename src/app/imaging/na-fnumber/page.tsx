"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function NAFNumberPage() {
  const [fNumber, setFNumber] = useState(2.8);

  const chartData = useMemo(() => {
    const fNums = Array.from({ length: 200 }, (_, i) => 1 + i * 20 / 200);
    const na = fNums.map(f => 1 / (2 * f));
    const halfAngle = fNums.map(f => Math.atan(1 / (2 * f)) * 180 / Math.PI);
    return [
      { x: fNums, y: na, type: "scatter" as const, mode: "lines" as const, name: "NA", line: { color: "#60a5fa" } },
      { x: fNums, y: halfAngle, type: "scatter" as const, mode: "lines" as const, name: "Half-angle (°)", line: { color: "#f87171" } },
    ];
  }, [fNumber]);

  const na = 1 / (2 * fNumber);
  const halfAngle = Math.atan(1 / (2 * fNumber)) * 180 / Math.PI;
  const airyDiameter = 1.22 * 0.55e-6 * fNumber * 1e6; // μm at 550nm

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="NA ↔ f/# Conversion" description="NA = 1/(2·f/#) for objects at infinity. Relates numerical aperture to f-number.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">f/#</span>
          <input type="number" value={fNumber} onChange={e => setFNumber(+e.target.value)} step="0.1" min={0.5} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">NA = <span className="text-blue-400 font-mono">{na.toFixed(4)}</span></p>
        <p className="text-gray-300">Half-angle = <span className="text-blue-400 font-mono">{halfAngle.toFixed(2)}°</span></p>
        <p className="text-gray-300">Airy disk diameter @550nm = <span className="text-blue-400 font-mono">{airyDiameter.toFixed(2)} μm</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "f/#", gridcolor: "#374151" }, yaxis: { title: "Value", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true, showlegend: true }} />
    </CalculatorShell>
  );
}
