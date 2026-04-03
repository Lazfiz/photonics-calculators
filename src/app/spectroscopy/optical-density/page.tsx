"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function OpticalDensityPage() {
  const [transmission, setTransmission] = useState(1);
  const [absorbance, setAbsorbance] = useState(2);
  const [inputMode, setInputMode] = useState<"trans" | "abs">("abs");

  const abs = inputMode === "abs" ? absorbance : -Math.log10(transmission / 100);
  const trans = inputMode === "trans" ? transmission : Math.pow(10, -absorbance) * 100;

  const chartData = useMemo(() => {
    const od = Array.from({ length: 300 }, (_, i) => (i / 300) * 8);
    const tPct = od.map(a => Math.pow(10, -a) * 100);
    const reflectedFraction = od.map(a => {
      const t = Math.pow(10, -a);
      return Math.max(0, (1 - t) * 100); // absorbed fraction
    });

    return [
      { x: od, y: tPct, type: "scatter" as const, mode: "lines" as const, name: "Transmission (%)", line: { color: "#60a5fa", width: 2 } },
      { x: od, y: reflectedFraction, type: "scatter" as const, mode: "lines" as const, name: "Absorption (%)", fill: "tozeroy" as const, line: { color: "#f87171", width: 1 } },
      { x: [abs], y: [trans], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#34d399", size: 12 } },
    ];
  }, [abs, trans]);

  const neutralDensity = abs / 3; // ND filters: OD 1 = 10% T, ND1.0 = OD1
  const attenuationDB = 10 * abs;

  // Common OD values reference
  const odTable = [
    { od: 0.1, t: 79.4 },
    { od: 0.3, t: 50.1 },
    { od: 1, t: 10 },
    { od: 2, t: 1 },
    { od: 3, t: 0.1 },
    { od: 4, t: 0.01 },
    { od: 6, t: 0.0001 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Optical Density</h1>
      <p className="text-gray-400 mb-8">Convert between optical density (OD), transmission, and attenuation. Essential for filter selection and absorbance measurements.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Absorbance (OD)</span>
          <input type="number" value={abs} onChange={e => { setAbsorbance(+e.target.value); setInputMode("abs"); }} min={0} max={10} step={0.01}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Transmission (%)</span>
          <input type="number" value={trans} onChange={e => { setTransmission(+e.target.value); setInputMode("trans"); }} min={0} max={100} step={0.01}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Optical Density</p>
          <p className="text-xl font-bold text-blue-400">{abs.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmission</p>
          <p className="text-xl font-bold text-green-400">{trans.toFixed(3)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Attenuation</p>
          <p className="text-xl font-bold text-orange-400">{attenuationDB.toFixed(1)} dB</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Reference Values</h3>
        <div className="grid grid-cols-2 gap-1">
          {odTable.map(r => (
            <p key={r.od} className="text-gray-300 text-sm">
              OD <span className="text-blue-400">{r.od}</span> → <span className="text-green-400">{r.t}%</span> T
            </p>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm"><span className="text-blue-400 font-mono">OD = −log₁₀(T)</span></p>
        <p className="text-gray-300 text-sm"><span className="text-green-400 font-mono">T = 10^(−OD)</span></p>
        <p className="text-gray-300 text-sm"><span className="text-orange-400 font-mono">Attenuation (dB) = 10 × OD</span></p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Optical Density (OD)", gridcolor: "#374151" },
          yaxis: { title: "Percentage (%)", gridcolor: "#374151", range: [-5, 105] },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { x: 0.01, y: 0.99 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
