"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function CavityDumpedLaserPage() {
  const [repRate, setRepRate] = useState(80); // MHz
  const [pulseEnergy, setPulseEnergy] = useState(10); // μJ
  const [cavityLength, setCavityLength] = useState(1.5); // m

  const chartData = useMemo(() => {
    const t = Array.from({ length: 200 }, (_, i) => i * 0.5);
    const roundTrip = (2 * cavityLength) / 3e8 * 1e6; // μs
    const intensity = t.map(ti => {
      const envelope = Math.exp(-(((ti - 50) / 20) ** 2));
      return envelope * Math.sin(ti * 0.5) ** 2;
    });
    return [
      { x: t, y: intensity, type: "scatter" as const, mode: "lines" as const, name: "Cavity Dumped Pulse", line: { color: "#60a5fa" } },
    ];
  }, [repRate, pulseEnergy, cavityLength]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Cavity-Dumped Laser" description="Energy extraction from a laser cavity using fast Q-switching or intracavity modulation.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Rep Rate (MHz)</span>
          <input type="number" value={repRate} onChange={e => setRepRate(+e.target.value)} step="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Pulse Energy (μJ)</span>
          <input type="number" value={pulseEnergy} onChange={e => setPulseEnergy(+e.target.value)} step="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Cavity Length (m)</span>
          <input type="number" value={cavityLength} onChange={e => setCavityLength(+e.target.value)} step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Round-trip time: <span className="text-blue-400 font-mono">{((2 * cavityLength) / 3e8 * 1e6).toFixed(2)} μs</span></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: "Time (μs)", gridcolor: "#374151" },
        yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true
      }} />
    </CalculatorShell>
  );
}
