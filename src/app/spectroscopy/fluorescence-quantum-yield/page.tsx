"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function FluorescenceQuantumYieldPage() {
  const [sampleInt, setSampleInt] = useState(50000);
  const [refInt, setRefInt] = useState(80000);
  const [sampleAbs, setSampleAbs] = useState(0.1);
  const [refAbs, setRefAbs] = useState(0.1);
  const [refQY, setRefQY] = useState(0.54);
  const [refrIdxSample, setRefrIdxSample] = useState(1.33);
  const [refrIdxRef, setRefrIdxRef] = useState(1.33);
  const [useRefrIdx, setUseRefrIdx] = useState(false);

  const qy = useRefrIdx
    ? (sampleInt / refInt) * (refAbs / sampleAbs) * (refrIdxSample / refrIdxRef) ** 2 * refQY
    : (sampleInt / refInt) * (refAbs / sampleAbs) * refQY;

  const chartData = useMemo(() => {
    const absVals = Array.from({ length: 200 }, (_, i) => 0.01 + (i / 200) * 0.5);
    const qyLine = absVals.map(a => (sampleInt / refInt) * (refAbs / a) * refQY);
    return [
      { x: absVals, y: qyLine, type: "scatter" as const, mode: "lines" as const, name: "QY vs Sample A", line: { color: "#60a5fa" } },
      { x: [sampleAbs], y: [qy], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [sampleInt, refInt, sampleAbs, refAbs, refQY, qy]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Fluorescence Quantum Yield</h1>
      <p className="text-gray-400 mb-8">Φ = Φ_ref · (I_s/I_ref) · (A_ref/A_s) · (n_s/n_ref)² — comparative method using a reference standard.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Sample Integrated Intensity</span>
          <input type="number" value={sampleInt} onChange={e => setSampleInt(+e.target.value)} min={0} step={1000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Reference Integrated Intensity</span>
          <input type="number" value={refInt} onChange={e => setRefInt(+e.target.value)} min={0} step={1000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Sample Absorbance (at λ_ex)</span>
          <input type="number" value={sampleAbs} onChange={e => setSampleAbs(Math.max(0.001, +e.target.value))} min={0.001} step={0.01}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Reference Absorbance (at λ_ex)</span>
          <input type="number" value={refAbs} onChange={e => setRefAbs(Math.max(0.001, +e.target.value))} min={0.001} step={0.01}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Reference Φ (e.g. quinine 0.54)</span>
          <input type="number" value={refQY} onChange={e => setRefQY(+e.target.value)} min={0} max={1} step={0.01}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Apply Refractive Index Correction</span>
          <select value={useRefrIdx ? "yes" : "no"} onChange={e => setUseRefrIdx(e.target.value === "yes")}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
      </div>

      {useRefrIdx && (
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <label className="block">
            <span className="text-gray-300 text-sm">n (sample solvent)</span>
            <input type="number" value={refrIdxSample} onChange={e => setRefrIdxSample(+e.target.value)} min={1} step={0.01}
              className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
          <label className="block">
            <span className="text-gray-300 text-sm">n (reference solvent)</span>
            <input type="number" value={refrIdxRef} onChange={e => setRefrIdxRef(+e.target.value)} min={1} step={0.01}
              className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Quantum Yield (Φ)</p>
          <p className="text-2xl font-bold text-blue-400">{qy.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Φ as percentage</p>
          <p className="text-2xl font-bold text-green-400">{(qy * 100).toFixed(2)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono text-blue-400">Φ_s = Φ_ref · (I_s / I_ref) · (A_ref / A_s) · (n_s² / n_ref²)</p>
        <p className="text-gray-500 text-xs mt-2">Keep A &lt; 0.1 to avoid inner filter effects. Common standards: quinine sulfate (Φ=0.54 in 0.1M H₂SO₄), fluorescein (Φ=0.95 in 0.1M NaOH).</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Sample Absorbance", gridcolor: "#1f2937" },
          yaxis: { title: "Quantum Yield", gridcolor: "#1f2937" },
          margin: { t: 30 },
        }} config={{ responsive: true }} />
      </div>
    </div>
  );
}
