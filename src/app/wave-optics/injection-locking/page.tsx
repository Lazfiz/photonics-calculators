"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function InjectionLockingPage() {
  const [masterPower, setMasterPower] = useState(10); // mW
  const [slavePower, setSlavePower] = useState(1000); // mW
  const [lockingBW, setLockingBW] = useState(10); // MHz

  const chartData = useMemo(() => {
    const f = Array.from({ length: 200 }, (_, i) => -50 + i * 0.5); // MHz offset
    const lockingRange = Math.sqrt(masterPower / slavePower) * lockingBW;
    const phaseNoise = f.map(fi => {
      const inLock = Math.abs(fi) < lockingRange;
      return inLock ? -60 : -30;
    });
    
    return [
      { x: f, y: phaseNoise, type: "scatter" as const, mode: "lines" as const, name: "Phase Noise", line: { color: "#60a5fa" } },
    ];
  }, [masterPower, slavePower, lockingBW]);

  const lockingRange = Math.sqrt(masterPower / slavePower) * lockingBW;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Injection Locking</h1>
      <p className="text-gray-400 mb-8">Phase-locking a slave laser to a master laser through optical injection.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Master Power (mW)</span>
          <input type="number" value={masterPower} onChange={e => setMasterPower(+e.target.value)} step="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Slave Power (mW)</span>
          <input type="number" value={slavePower} onChange={e => setSlavePower(+e.target.value)} step="10" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Locking BW (MHz)</span>
          <input type="number" value={lockingBW} onChange={e => setLockingBW(+e.target.value)} step="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Locking Range: <span className="text-blue-400 font-mono">{lockingRange.toFixed(2)} MHz</span></p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: "Frequency Offset (MHz)", gridcolor: "#374151" },
        yaxis: { title: "Phase Noise (dBc/Hz)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
