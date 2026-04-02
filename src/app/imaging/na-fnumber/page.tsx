"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

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
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">NA ↔ f/# Conversion</h1>
      <p className="text-gray-400 mb-8">NA = 1/(2·f/#) for objects at infinity. Relates numerical aperture to f-number.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">f/#</span>
          <input type="number" value={fNumber} onChange={e => setFNumber(+e.target.value)} step="0.1" min={0.5} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">NA = <span className="text-blue-400 font-mono">{na.toFixed(4)}</span></p>
        <p className="text-gray-300">Half-angle = <span className="text-blue-400 font-mono">{halfAngle.toFixed(2)}°</span></p>
        <p className="text-gray-300">Airy disk diameter @550nm = <span className="text-blue-400 font-mono">{airyDiameter.toFixed(2)} μm</span></p>
      </div>

      <Plot data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "f/#", gridcolor: "#374151" }, yaxis: { title: "Value", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true, showlegend: true }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
