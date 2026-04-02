"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function AfocalPage() {
  const [f1Mm, setF1Mm] = useState(100);
  const [f2Mm, setF2Mm] = useState(200);
  const [separationMm, setSeparationMm] = useState(300); // f1 + f2 for afocal
  const [objectAngleDeg, setObjectAngleDeg] = useState(2);

  // Afocal: separation d = f1 + f2
  const idealSep = f1Mm + f2Mm;
  const isAfocal = Math.abs(separationMm - idealSep) < 0.01;
  const angularMag = isAfocal ? -f2Mm / f1Mm : -(f2Mm / f1Mm) * (1 - (separationMm - idealSep) / f2Mm);
  const exitAngle = objectAngleDeg * angularMag;
  const fieldStopDiam = 2 * f1Mm * Math.tan(objectAngleDeg * Math.PI / 180);

  // Keplerian (f1,f2 > 0) vs Galilean (one negative)
  const type = f1Mm > 0 && f2Mm > 0 ? "Keplerian" : "Galilean";

  const chartData = useMemo(() => {
    const seps = Array.from({ length: 200 }, (_, i) => (f1Mm + f2Mm) - 50 + i * 0.5);
    return [
      {
        x: seps,
        y: seps.map(d => {
          const dev = d - (f1Mm + f2Mm);
          return -(f2Mm / f1Mm) * (1 - dev / f2Mm);
        }),
        type: "scatter" as const, mode: "lines" as const,
        name: "Angular Magnification",
        line: { color: "#60a5fa", width: 2 },
      },
      {
        x: [separationMm], y: [angularMag],
        type: "scatter" as const, mode: "markers" as const,
        name: "Current",
        marker: { color: "#f87171", size: 12 },
      },
      {
        x: [idealSep], y: [-f2Mm / f1Mm],
        type: "scatter" as const, mode: "markers" as const,
        name: "True Afocal",
        marker: { color: "#34d399", size: 12, symbol: "diamond" },
      },
    ];
  }, [f1Mm, f2Mm, separationMm, angularMag, idealSep]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Afocal System Calculator</h1>
      <p className="text-gray-400 mb-8">Design and analyze afocal (telescopic) relay systems — Keplerian and Galilean configurations.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">M_ang = −f₂ / f₁ &nbsp;(afocal, d = f₁ + f₂)</p>
        <p className="text-gray-300 text-sm font-mono mt-1">d_ideal = f₁ + f₂</p>
        <p className="text-gray-300 text-sm font-mono mt-1">θ_out = M_ang · θ_in</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">f₁ (mm)</span>
          <input type="number" value={f1Mm} onChange={e => setF1Mm(+e.target.value)} min={-500} max={5000} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">f₂ (mm)</span>
          <input type="number" value={f2Mm} onChange={e => setF2Mm(+e.target.value)} min={-500} max={5000} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Separation (mm)</span>
          <input type="number" value={separationMm} onChange={e => setSeparationMm(+e.target.value)} min={0} max={10000} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Input Angle (°)</span>
          <input type="number" value={objectAngleDeg} onChange={e => setObjectAngleDeg(+e.target.value)} min={0.01} max={30} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Angular Mag.</p>
          <p className="text-2xl font-bold text-blue-400">{angularMag.toFixed(2)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Ideal Separation</p>
          <p className="text-2xl font-bold text-green-400">{idealSep.toFixed(1)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Exit Angle</p>
          <p className="text-2xl font-bold text-yellow-400">{exitAngle.toFixed(3)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Type</p>
          <p className="text-xl font-bold text-purple-400">{type}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Afocal?</p>
          <p className={`text-2xl font-bold ${isAfocal ? "text-green-400" : "text-red-400"}`}>
            {isAfocal ? "Yes ✓" : "No ✗"}
          </p>
        </div>
      </div>

      {!isAfocal && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-8">
          <p className="text-yellow-400 text-sm">
            Separation is {(separationMm - idealSep).toFixed(1)} mm from afocal condition. System is not truly afocal.
          </p>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Separation (mm)", gridcolor: "#374151" },
          yaxis: { title: "Angular Magnification", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
