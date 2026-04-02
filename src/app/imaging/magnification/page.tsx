"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function MagnificationPage() {
  const [objFocal, setObjFocal] = useState(10);
  const [tubeFocal, setTubeFocal] = useState(200);
  const [camFocal, setCamFocal] = useState(50);

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
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Total Magnification Calculator</h1>
      <p className="text-gray-400 mb-8">Calculate total system magnification from objective, tube lens, and camera adapter lens.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Objective Focal Length (mm)</span>
          <input type="number" value={objFocal} onChange={e => setObjFocal(+e.target.value)} min={1} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Tube Lens Focal Length (mm)</span>
          <input type="number" value={tubeFocal} onChange={e => setTubeFocal(+e.target.value)} min={50} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Camera Adapter Focal Length (mm)</span>
          <input type="number" value={camFocal} onChange={e => setCamFocal(+e.target.value)} min={10} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
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
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Objective Focal Length (mm)", gridcolor: "#374151" },
          yaxis: { title: "Total Magnification (×)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
