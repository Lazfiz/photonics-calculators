"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function OpticalPowerPage() {
  const [focalLengthMm, setFocalLengthMm] = useState(100);
  const [corneaPower, setCorneaPower] = useState(43);
  const [lensPower, setLensPower] = useState(19);

  const diopters = 1000 / focalLengthMm; // D = 1/f (f in meters)
  const totalEye = corneaPower + lensPower - (corneaPower * lensPower) / 1000; // reduced vergence approx
  const eyeFl = 1000 / totalEye; // mm approx
  const myopiaD = totalEye - 60; // emmetropic ≈ 60 D
  const myopiaMm = (1000 / (totalEye - myopiaD) - 1000 / totalEye); // approx axial shift

  const chartData = useMemo(() => {
    const fls = Array.from({ length: 200 }, (_, i) => 5 + i * 1);
    return [
      {
        x: fls, y: fls.map(f => 1000 / f),
        type: "scatter" as const, mode: "lines" as const,
        name: "Optical Power",
        line: { color: "#60a5fa", width: 2 },
      },
      {
        x: [focalLengthMm], y: [diopters],
        type: "scatter" as const, mode: "markers" as const,
        name: "Current",
        marker: { color: "#f87171", size: 12 },
      },
    ];
  }, [focalLengthMm, diopters]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Optical Power (Diopters)</h1>
      <p className="text-gray-400 mb-8">Convert between focal length and optical power, with an eye model reference.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">P = 1/f &nbsp;&nbsp;[diopters = 1/meters]</p>
        <p className="text-gray-300 text-sm font-mono mt-1">P_total = P₁ + P₂ − (d/n)·P₁·P₂</p>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-gray-200">Simple Lens</h2>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Focal Length (mm)</span>
          <input type="number" value={focalLengthMm} onChange={e => setFocalLengthMm(+e.target.value)} min={1} max={5000} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col justify-center">
          <p className="text-sm text-gray-400">Optical Power</p>
          <p className="text-2xl font-bold text-blue-400">{diopters.toFixed(2)} D</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-gray-200">Simplified Eye Model</h2>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Cornea Power (D)</span>
          <input type="number" value={corneaPower} onChange={e => setCorneaPower(+e.target.value)} min={30} max={50} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Lens Power (D)</span>
          <input type="number" value={lensPower} onChange={e => setLensPower(+e.target.value)} min={10} max={35} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col justify-center">
          <p className="text-sm text-gray-400">Total Eye Power</p>
          <p className="text-2xl font-bold text-green-400">{totalEye.toFixed(1)} D</p>
          <p className="text-xs text-gray-500">≈ {eyeFl.toFixed(1)} mm focal length</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Refractive Error</p>
          <p className={`text-2xl font-bold ${myopiaD < -0.5 ? "text-red-400" : myopiaD > 0.5 ? "text-yellow-400" : "text-green-400"}`}>
            {myopiaD.toFixed(1)} D
          </p>
          <p className="text-xs text-gray-500">{myopiaD < -0.5 ? "Myopic" : myopiaD > 0.5 ? "Hyperopic" : "Emmetropic"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Correction Lens</p>
          <p className="text-2xl font-bold text-purple-400">{(-myopiaD).toFixed(1)} D</p>
          <p className="text-xs text-gray-500">Lens to correct to emmetropia</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Focal Length (mm)", gridcolor: "#374151" },
          yaxis: { title: "Power (D)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
