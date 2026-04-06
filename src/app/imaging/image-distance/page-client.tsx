"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function ImageDistancePage() {
  const [objectDistMm, setObjectDistMm] = useState(200);
  const [focalLengthMm, setFocalLengthMm] = useState(50);

  const f = focalLengthMm;
  const o = objectDistMm;
  const i = (f * o) / (o - f); // thin lens: 1/f = 1/o + 1/i
  const valid = o > f && o > 0;
  const magnification = valid ? -i / o : 0;
  const workingDist = Math.abs(o);
  const conjugateRatio = valid ? Math.abs(i / o) : 0;

  const chartData = useMemo(() => {
    const objs = Array.from({ length: 300 }, (_, idx) => f * 1.01 + idx * 2);
    const validObjs = objs.filter(ob => ob > f);
    return [
      {
        x: validObjs,
        y: validObjs.map(ob => (f * ob) / (ob - f)),
        type: "scatter" as const, mode: "lines" as const,
        name: "Image Distance",
        line: { color: "#60a5fa", width: 2 },
      },
      {
        x: validObjs,
        y: validObjs.map(ob => Math.abs(ob / (ob - f))),
        type: "scatter" as const, mode: "lines" as const,
        name: "|Magnification|",
        line: { color: "#34d399", width: 2, dash: "dash" },
      },
      ...(valid ? [{
        x: [o] as number[], y: [i] as number[],
        type: "scatter" as const, mode: "markers" as const,
        name: "Current" as const,
        marker: { color: "#f87171", size: 12 },
      }] : []),
    ];
  }, [f, o, i, valid]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Thin Lens Image Distance" description="Calculate image distance, magnification, and conjugate ratio for a thin lens.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">1/f = 1/o + 1/i</p>
        <p className="text-gray-300 text-sm font-mono mt-1">i = f·o / (o − f)</p>
        <p className="text-gray-300 text-sm font-mono mt-1">M = −i / o</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Object Distance (mm)</span>
          <input type="number" value={objectDistMm} onChange={e => setObjectDistMm(+e.target.value)} min={1} max={10000} step="0.1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Focal Length (mm)</span>
          <input type="number" value={focalLengthMm} onChange={e => setFocalLengthMm(+e.target.value)} min={1} max={5000} step="0.1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      {valid ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Image Distance</p>
            <p className="text-2xl font-bold text-blue-400">{i.toFixed(2)} mm</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Magnification</p>
            <p className="text-2xl font-bold text-green-400">{magnification.toFixed(3)}×</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">|Magnification|</p>
            <p className="text-2xl font-bold text-yellow-400">{Math.abs(magnification).toFixed(3)}×</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Image Type</p>
            <p className="text-lg font-bold text-purple-400">
              {i > 0 ? "Real" : "Virtual"}, {magnification < 0 ? "Inverted" : "Upright"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-8">
          <p className="text-red-400">Object distance must be greater than focal length ({f} mm) for a real image.</p>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Object Distance (mm)", gridcolor: "#374151" },
          yaxis: { title: "mm", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
