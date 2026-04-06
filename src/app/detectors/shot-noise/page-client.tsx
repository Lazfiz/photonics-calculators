"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

export default function ShotNoisePage() {
  const [photocurrent, setPhotocurrent] = useState(1e-6); // A
  const [q, setQ] = useState(1.6e-19); // C
  const [bandwidth, setBandwidth] = useState(1e6); // Hz

  const chartData = useMemo(() => {
    const currents = Array.from({ length: 200 }, (_, i) => 1e-9 * Math.pow(1000, i / 200)); // 1nA to 1mA
    const iNoise = currents.map(I => Math.sqrt(2 * q * I * bandwidth));
    const snr = currents.map(I => I / Math.sqrt(2 * q * I * bandwidth));
    return [
      { x: currents, y: iNoise, type: "scatter" as const, mode: "lines" as const, name: "Shot noise current", line: { color: "#f87171" }, yaxis: "y" },
      { x: currents, y: snr, type: "scatter" as const, mode: "lines" as const, name: "SNR", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [photocurrent, q, bandwidth]);

  const iShot = Math.sqrt(2 * q * photocurrent * bandwidth);
  const snrVal = iShot === 0 ? Infinity : photocurrent / iShot;
  const NEP = iShot; // simplified

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Photocurrent (A)</span>
          <input type="number" value={photocurrent} onChange={e => setPhotocurrent(+e.target.value)} step="1e-9" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Bandwidth (Hz)</span>
          <input type="number" value={bandwidth} onChange={e => setBandwidth(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Shot noise = <span className="text-blue-400 font-mono">{iShot.toExponential(3)} A</span></p>
        <p className="text-gray-300">SNR = <span className="text-blue-400 font-mono">{snrVal === Infinity ? "∞" : snrVal.toFixed(1)}</span></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Photocurrent (A)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Noise Current (A)", type: "log", gridcolor: "#374151" },
        yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} />
    </div>
  );
}
